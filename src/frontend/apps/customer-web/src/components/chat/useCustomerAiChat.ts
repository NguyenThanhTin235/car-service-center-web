'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store';
import {
  AiChatHistoryItem,
  AiChatRequestError,
  fetchAiChatWelcome,
  sendAiChatMessageStream,
} from '@/lib/api/ai-chat.api';
import {
  clearUserChatSessions,
  GUEST_HISTORY_KEY,
  GUEST_OPEN_KEY,
  getUserHistoryKey,
  getUserOpenKey,
  promoteGuestSessionToUser,
  safeParseChatHistory,
  selectContextualPreamble,
  SMART_LOADING_STAGES,
  StoredChatMessage,
} from './aiChatUtils';

function resolveFriendlyChatError(err: any, isRetry = false): string {
  if (err?.isTimeout || err?.code === 'STREAM_TIMEOUT') {
    return 'Trợ lý AI phản hồi lâu hơn bình thường do hệ thống đang bận. Anh/Chị vui lòng thử gửi lại nhé.';
  }

  const status = err?.status ?? err?.response?.status;
  const rawServerMsg =
    typeof err?.response?.data?.message === 'string'
      ? err.response.data.message.trim()
      : typeof err?.message === 'string'
        ? err.message.trim()
        : '';
  const isRawEnglishError =
    /^(internal server error|bad gateway|service unavailable|gateway timeout|network error|request failed|too many requests|http \d{3})/i.test(
      rawServerMsg
    );
  const safeServerMsg = rawServerMsg && !isRawEnglishError ? rawServerMsg : '';

  if (status === 429) {
    return (
      safeServerMsg ||
      'Anh/Chị thao tác hơi nhanh ạ. Vui lòng đợi một lát rồi thử lại nhé.'
    );
  }

  return (
    safeServerMsg ||
    (isRetry
      ? 'Kết nối vẫn chưa ổn định. Anh/Chị vui lòng thử lại sau hoặc gọi Hotline 1900 6868 ạ.'
      : 'Kết nối trợ lý AI đang chập chờn. Anh/Chị vui lòng thử gửi lại hoặc gọi Hotline 1900 6868 nhé.')
  );
}
function makeWelcomeMessage(
  greeting: string,
  suggestedQuestions: string[],
  actions: StoredChatMessage['actions'],
  idPrefix = 'welcome'
): StoredChatMessage {
  return {
    id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: 'assistant',
    content: greeting,
    createdAt: new Date().toISOString(),
    suggestedQuestions,
    actions,
  };
}

export function useCustomerAiChat() {
  const pathname = usePathname() || '/home';
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const activeUserId = isAuthenticated && user?.id ? Number(user.id) : null;

  const [isOpen, setIsOpenState] = useState(false);
  const [messages, setMessages] = useState<StoredChatMessage[]>([]);
  const [welcomeLoading, setWelcomeLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [activePreamble, setActivePreamble] = useState('');
  const [loadingStage, setLoadingStage] = useState<0 | 1 | 2>(0);
  const [streamingReply, setStreamingReply] = useState('');
  const [restoredDraft, setRestoredDraft] = useState<string | null>(null);

  const prevUserIdRef = useRef<number | null>(null);
  const hydratedScopeRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stageTimersRef = useRef<number[]>([]);
  const lastPreambleRef = useRef<string | null>(null);

  const getStorageKeys = useCallback((uid: number | null) => {
    if (uid) {
      return {
        historyKey: getUserHistoryKey(uid),
        openKey: getUserOpenKey(uid),
      };
    }
    return {
      historyKey: GUEST_HISTORY_KEY,
      openKey: GUEST_OPEN_KEY,
    };
  }, []);

  const persistMessages = useCallback(
    (uid: number | null, nextMessages: StoredChatMessage[]) => {
      if (typeof window === 'undefined') return;
      const { historyKey } = getStorageKeys(uid);
      try {
        window.sessionStorage.setItem(historyKey, JSON.stringify(nextMessages.slice(-30)));
      } catch {
        // Ignore storage quota errors
      }
    },
    [getStorageKeys]
  );

  const setIsOpen = useCallback(
    (nextOpen: boolean) => {
      setIsOpenState(nextOpen);
      if (typeof window !== 'undefined') {
        const { openKey } = getStorageKeys(activeUserId);
        try {
          window.sessionStorage.setItem(openKey, nextOpen ? '1' : '0');
        } catch {}
      }
    },
    [activeUserId, getStorageKeys]
  );

  const loadWelcome = useCallback(
    async (uid: number | null, appendToExisting: StoredChatMessage[] | null = null) => {
      setWelcomeLoading(true);
      try {
        const data = await fetchAiChatWelcome(pathname);
        const welcomeMsg = makeWelcomeMessage(
          data.greeting,
          data.suggested_questions,
          data.actions,
          appendToExisting ? 'welcome-promoted' : 'welcome'
        );
        const nextList = appendToExisting ? [...appendToExisting, welcomeMsg] : [welcomeMsg];
        setMessages(nextList);
        persistMessages(uid, nextList);
      } catch {
        const fallbackGreeting =
          'Chào Anh/Chị! Em là **Trợ lý Cố vấn Dịch vụ AI của AutoCare Pro**. Em sẵn sàng tư vấn triệu chứng xe, tra cứu bảng giá (**0% VAT**) và đặt lịch hẹn nhanh cho mình ạ.';
        const fallbackMsg = makeWelcomeMessage(
          fallbackGreeting,
          ['Xe phanh kêu két két là bị sao?', 'Bảng giá bảo dưỡng định kỳ 40.000 km', 'Đặt lịch dịch vụ khung giờ nào?'],
          [
            {
              type: 'OPEN_BOOKING_MODAL',
              label: 'Đặt lịch dịch vụ ngay',
              icon: 'calendar_month',
              target: 'modal:booking',
            },
          ]
        );
        const nextList = appendToExisting ? [...appendToExisting, fallbackMsg] : [fallbackMsg];
        setMessages(nextList);
      } finally {
        setWelcomeLoading(false);
      }
    },
    [pathname, persistMessages]
  );

  // Handle Guest <-> Customer scope switches, Session Promotion, and Logout Privacy Cleanup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentScope = activeUserId ? `user_${activeUserId}` : 'guest';
    const prevUid = prevUserIdRef.current;

    // Logout cleanup when transitioning from authenticated -> guest
    if (prevUid !== null && activeUserId === null) {
      clearUserChatSessions(window.sessionStorage);
      setMessages([]);
      setIsOpenState(false);
      setError(null);
      setLastFailedText(null);
    }

    prevUserIdRef.current = activeUserId;

    if (hydratedScopeRef.current === currentScope) return;
    hydratedScopeRef.current = currentScope;

    if (activeUserId) {
      const { promoted, messages: userMsgs } = promoteGuestSessionToUser(
        window.sessionStorage,
        activeUserId
      );
      setMessages(userMsgs);

      const savedOpen = window.sessionStorage.getItem(getUserOpenKey(activeUserId));
      if (savedOpen === '1') {
        setIsOpenState(true);
      }

      if (promoted) {
        loadWelcome(activeUserId, userMsgs);
      }
    } else {
      const guestMsgs = safeParseChatHistory(window.sessionStorage.getItem(GUEST_HISTORY_KEY));
      setMessages(guestMsgs);
      const savedOpen = window.sessionStorage.getItem(GUEST_OPEN_KEY);
      if (savedOpen === '1') {
        setIsOpenState(true);
      }
    }
  }, [activeUserId, loadWelcome]);

  // Listen for cross-tab / forced Logout on BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('csc_session_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'USER_LOGGED_OUT') {
          clearUserChatSessions(window.sessionStorage);
          setMessages([]);
          setIsOpenState(false);
        }
      };
    } catch {}
    return () => {
      if (channel) channel.close();
    };
  }, []);

  // Lazy-fetch welcome message the first time the panel is opened with empty messages
  useEffect(() => {
    if (isOpen && messages.length === 0 && !welcomeLoading) {
      loadWelcome(activeUserId, null);
    }
  }, [isOpen, messages.length, welcomeLoading, activeUserId, loadWelcome]);

  const clearPendingTimers = useCallback(() => {
    for (const timerId of stageTimersRef.current) {
      window.clearTimeout(timerId);
    }
    stageTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      clearPendingTimers();
    };
  }, [clearPendingTimers]);

  const executeSendRequest = useCallback(
    async (text: string, baseMessages: StoredChatMessage[], isRetry: boolean) => {
      abortControllerRef.current?.abort();
      clearPendingTimers();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userTurnCount = baseMessages.filter((m) => m.role === 'user').length;
      const preamble = selectContextualPreamble({
        userMessage: text,
        turnCount: userTurnCount,
        lastPreamble: lastPreambleRef.current,
      });
      lastPreambleRef.current = preamble;

      setError(null);
      setInfoNotice(null);
      setLastFailedText(null);
      setRestoredDraft(null);
      setActivePreamble(preamble);
      setLoadingStage(0);
      setStreamingReply('');

      const userMsg: StoredChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };

      const historyPayload: AiChatHistoryItem[] = baseMessages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const withUser = [...baseMessages, userMsg];
      setMessages(withUser);
      persistMessages(activeUserId, withUser);
      setSending(true);

      let hasReceivedDelta = false;
      const timer1 = window.setTimeout(() => {
        if (!hasReceivedDelta && !controller.signal.aborted) {
          setLoadingStage(1);
        }
      }, 2800);
      const timer2 = window.setTimeout(() => {
        if (!hasReceivedDelta && !controller.signal.aborted) {
          setLoadingStage(2);
        }
      }, 6500);
      stageTimersRef.current = [timer1, timer2];

      try {
        const res = await sendAiChatMessageStream(
          {
            message: text,
            history: historyPayload,
            contextPage: pathname,
          },
          {
            signal: controller.signal,
            timeoutMs: 20_000,
            onDelta: (partialReply) => {
              if (!hasReceivedDelta) {
                hasReceivedDelta = true;
                clearPendingTimers();
                setLoadingStage(0);
              }
              setStreamingReply(partialReply);
            },
          }
        );

        clearPendingTimers();
        const botMsg: StoredChatMessage = {
          id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'assistant',
          content: res.reply,
          createdAt: new Date().toISOString(),
          isFallback: res.is_fallback,
          suggestedQuestions: res.suggested_questions,
          actions: res.actions,
        };

        const updated = [...withUser, botMsg];
        setMessages(updated);
        persistMessages(activeUserId, updated);
      } catch (err: any) {
        clearPendingTimers();
        if (err instanceof AiChatRequestError && err.isAborted) {
          // Remove unanswered pending user bubble and restore draft to composer
          setMessages(baseMessages);
          persistMessages(activeUserId, baseMessages);
          setRestoredDraft(text);
          setInfoNotice('Đã dừng phản hồi. Nội dung câu hỏi đã được giữ lại bên dưới để Anh/Chị chỉnh sửa.');
        } else {
          setError(resolveFriendlyChatError(err, isRetry));
          setLastFailedText(text);
          setRestoredDraft(text);
        }
      } finally {
        clearPendingTimers();
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setStreamingReply('');
        setActivePreamble('');
        setLoadingStage(0);
        setSending(false);
      }
    },
    [activeUserId, clearPendingTimers, pathname, persistMessages]
  );

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || sending) return;

      // Avoid duplicate trailing user bubble if user re-submits restored failed text via Enter
      const cleanedBase =
        lastFailedText &&
        text === lastFailedText &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' &&
        messages[messages.length - 1].content === lastFailedText
          ? messages.slice(0, -1)
          : messages;

      await executeSendRequest(text, cleanedBase, false);
    },
    [executeSendRequest, lastFailedText, messages, sending]
  );

  const retryLastMessage = useCallback(async () => {
    if (!lastFailedText || sending) return;
    const textToRetry = lastFailedText;
    // Remove trailing failed duplicate user bubble before re-sending cleanly
    const cleaned =
      messages.length > 0 &&
      messages[messages.length - 1].role === 'user' &&
      messages[messages.length - 1].content === textToRetry
        ? messages.slice(0, -1)
        : messages;

    await executeSendRequest(textToRetry, cleaned, true);
  }, [executeSendRequest, lastFailedText, messages, sending]);

  const cancelSending = useCallback(() => {
    clearPendingTimers();
    abortControllerRef.current?.abort();
  }, [clearPendingTimers]);

  const clearRestoredDraft = useCallback(() => {
    setRestoredDraft(null);
  }, []);

  const dismissNotice = useCallback(() => {
    setInfoNotice(null);
  }, []);

  const resetConversation = useCallback(() => {
    abortControllerRef.current?.abort();
    clearPendingTimers();
    if (typeof window !== 'undefined') {
      const { historyKey } = getStorageKeys(activeUserId);
      window.sessionStorage.removeItem(historyKey);
    }
    lastPreambleRef.current = null;
    setMessages([]);
    setError(null);
    setInfoNotice(null);
    setLastFailedText(null);
    setRestoredDraft(null);
    setStreamingReply('');
    setActivePreamble('');
    setLoadingStage(0);
    setSending(false);
    loadWelcome(activeUserId, null);
  }, [activeUserId, clearPendingTimers, getStorageKeys, loadWelcome]);

  const loadingStageMessage =
    loadingStage === 2
      ? SMART_LOADING_STAGES.STAGE_2
      : loadingStage === 1
        ? SMART_LOADING_STAGES.STAGE_1
        : null;

  return {
    isAuthenticated,
    user,
    isOpen,
    setIsOpen,
    messages,
    welcomeLoading,
    sending,
    error,
    infoNotice,
    lastFailedText,
    activePreamble,
    loadingStageMessage,
    streamingReply,
    restoredDraft,
    sendMessage,
    retryLastMessage,
    cancelSending,
    clearRestoredDraft,
    dismissNotice,
    resetConversation,
  };
}
