'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ChatMessageBubble from './ChatMessageBubble';
import PendingAssistantBubble from './PendingAssistantBubble';
import { useCustomerAiChat } from './useCustomerAiChat';
import {
  savePendingBookingIntent,
  StoredChatActionItem,
} from './aiChatUtils';

export default function CustomerAiChatWidget() {
  const router = useRouter();
  const pathname = usePathname() || '/home';

  const {
    isAuthenticated,
    isOpen,
    setIsOpen,
    messages,
    welcomeLoading,
    sending,
    error,
    infoNotice,
    activePreamble,
    loadingStageMessage,
    streamingReply,
    restoredDraft,
    bookingSubmittingMsgId,
    bookingErrors,
    sendMessage,
    retryLastMessage,
    cancelSending,
    clearRestoredDraft,
    dismissNotice,
    resetConversation,
    confirmBookingInChat,
  } = useCustomerAiChat();

  const [inputValue, setInputValue] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (restoredDraft !== null) {
      setInputValue(restoredDraft);
      clearRestoredDraft();
      inputRef.current?.focus();
    }
  }, [restoredDraft, clearRestoredDraft]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length, sending, error, infoNotice]);

  useEffect(() => {
    if (!isOpen || !streamingReply) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isOpen, streamingReply]);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;
    const text = inputValue;
    setInputValue('');
    await sendMessage(text);
  };

  const handleTriggerAction = (action: StoredChatActionItem) => {
    if (action.type === 'CALL_HOTLINE') {
      if (typeof window !== 'undefined') {
        const safeTel = /^tel:[0-9+]+$/.test(action.target || '') ? action.target : 'tel:19006868';
        window.location.href = safeTel;
      }
      return;
    }

    if (action.type === 'OPEN_BOOKING_MODAL') {
      // Auto-Minimize so chat never overlaps CustomerBookingModal (z-50)
      setIsOpen(false);
      const payload = action.payload || {};

      if (!isAuthenticated) {
        if (typeof window !== 'undefined') {
          savePendingBookingIntent(window.sessionStorage, payload);
        }
        const targetAfterLogin = encodeURIComponent('/customer/profile?tab=appointments&openBooking=1');
        router.push(`/login?redirect=${targetAfterLogin}`);
        return;
      }

      if (pathname.startsWith('/customer/profile')) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('csc:open-booking-modal', { detail: payload })
          );
        }
      } else {
        if (typeof window !== 'undefined') {
          savePendingBookingIntent(window.sessionStorage, payload);
        }
        router.push('/customer/profile?tab=appointments&openBooking=1');
      }
      return;
    }

    if (action.type === 'VIEW_QUOTATION') {
      setIsOpen(false);
      const payload = action.payload || {};
      const params = new URLSearchParams({ tab: 'tracking', openQuotation: '1' });
      if (payload.workOrderId) params.set('workOrderId', String(payload.workOrderId));
      if (payload.quotationId) params.set('quotationId', String(payload.quotationId));

      if (typeof window !== 'undefined') {
        const currentTab = new URLSearchParams(window.location.search).get('tab');
        if (pathname.startsWith('/customer/profile') && currentTab === 'tracking') {
          window.dispatchEvent(new CustomEvent('csc:view-quotation', { detail: payload }));
          return;
        }
      }
      router.push(`/customer/profile?${params.toString()}`);
      return;
    }

    if (action.type === 'VIEW_INVOICE') {
      setIsOpen(false);
      const payload = action.payload || {};
      const openInvoiceVal = payload.invoiceId ? String(payload.invoiceId) : 'latest';
      const params = new URLSearchParams({ tab: 'invoices', openInvoice: openInvoiceVal });

      if (typeof window !== 'undefined') {
        const currentTab = new URLSearchParams(window.location.search).get('tab');
        if (pathname.startsWith('/customer/profile') && currentTab === 'invoices') {
          window.dispatchEvent(new CustomEvent('csc:view-invoice', { detail: payload }));
          return;
        }
      }
      router.push(`/customer/profile?${params.toString()}`);
      return;
    }

    if (action.type === 'NAVIGATE') {
      const rawTarget = action.target || '/home';
      const target =
        rawTarget.startsWith('/') && !rawTarget.startsWith('//') && !rawTarget.includes('..')
          ? rawTarget
          : '/home';
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      if (isMobile || target.startsWith('/login')) {
        setIsOpen(false);
      }
      router.push(target);
    }
  };

  const latestAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  return (
    <>
      {/* Floating Action Button (z-40: above PublicHeader z-30, below Modals/Toast z-50) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Mở trợ lý tư vấn AI AutoCare Pro"
          data-testid="ai-chat-fab"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 min-w-[52px] min-h-[52px] px-4 py-3 rounded-full bg-accent hover:bg-accent-hover text-white shadow-xl border border-white/20 inline-flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">support_agent</span>
          <span className="hidden sm:inline text-sm font-bold tracking-tight">Hỏi Trợ lý AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
        </button>
      )}

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-ink-primary/35 backdrop-blur-[1px] z-40 sm:hidden"
          aria-hidden="true"
        />
      )}

      {/* Chat Panel (Desktop Floating Card / Mobile Bottom Sheet, z-40) */}
      {isOpen && (
        <section
          role="dialog"
          aria-label="Trợ lý Cố vấn Dịch vụ AI AutoCare Pro"
          data-testid="ai-chat-panel"
          className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-6 sm:right-6 z-40 w-full sm:w-[400px] h-[82dvh] max-h-[85dvh] sm:h-[600px] sm:max-h-[calc(100dvh-5rem)] rounded-t-3xl sm:rounded-2xl bg-surface-elevated border border-hairline shadow-2xl flex flex-col overflow-hidden transition-all duration-200 motion-reduce:transition-none"
        >
          {/* Header */}
          <header className="px-4 py-3.5 bg-accent-navy text-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold truncate">Trợ lý Cố vấn AI AutoCare</h2>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{isAuthenticated ? 'Đã kết nối hồ sơ xe của bạn' : 'Tư vấn miễn phí 24/7 • 0% VAT'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={resetConversation}
                title="Làm mới cuộc trò chuyện"
                aria-label="Làm mới cuộc trò chuyện"
                className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-white/10 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">refresh</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu gọn trợ lý"
                aria-label="Đóng cửa sổ chat"
                data-testid="ai-chat-close"
                className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
          </header>

          {/* Messages Body (4-State UI) */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-canvas/40"
          >
            {/* State 1: Welcome Loading Skeleton */}
            {welcomeLoading && messages.length === 0 && (
              <div className="space-y-3 animate-pulse" data-testid="ai-chat-welcome-skeleton">
                <div className="h-20 bg-surface-muted/70 rounded-2xl w-[88%]" />
                <div className="flex gap-2">
                  <div className="h-11 bg-surface-muted/60 rounded-xl w-40" />
                  <div className="h-11 bg-surface-muted/60 rounded-xl w-36" />
                </div>
              </div>
            )}

            {/* State 2: Data State (Messages) */}
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isLatestAssistant={msg.id === latestAssistantId}
                onSelectQuestion={(q) => sendMessage(q)}
                onTriggerAction={handleTriggerAction}
                onConfirmBooking={confirmBookingInChat}
                isBookingSubmitting={bookingSubmittingMsgId === msg.id}
                bookingError={bookingErrors[msg.id] || null}
                disabled={sending}
              />
            ))}

            {/* State 3: Immediate Feedback, Progressive Preamble & Streaming Reply */}
            {sending && (
              <PendingAssistantBubble
                preamble={activePreamble || 'Dạ, mình hỗ trợ bạn ngay nhé!'}
                stageMessage={loadingStageMessage}
                streamingReply={streamingReply}
              />
            )}

            {/* Cancelled / Info Notice Banner */}
            {infoNotice && !error && (
              <div
                role="status"
                data-testid="ai-chat-notice"
                className="rounded-2xl bg-surface-subtle border border-hairline px-3.5 py-2.5 text-xs text-ink-secondary flex items-center justify-between gap-2"
              >
                <span className="leading-relaxed">{infoNotice}</span>
                <button
                  type="button"
                  onClick={dismissNotice}
                  aria-label="Ẩn thông báo"
                  className="min-w-[36px] min-h-[36px] rounded-lg hover:bg-surface-muted text-ink-muted flex items-center justify-center cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* State 4: Error Retry Banner */}
            {error && (
              <div
                role="alert"
                data-testid="ai-chat-error"
                className="rounded-2xl bg-status-danger-soft border border-status-danger/20 p-3 text-xs text-status-danger space-y-2"
              >
                <p className="font-medium leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={retryLastMessage}
                  disabled={sending}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-status-danger text-white font-bold inline-flex items-center gap-1.5 hover:opacity-95 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">replay</span>
                  <span>Thử gửi lại</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Composer */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-surface-elevated border-t border-hairline flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (infoNotice) dismissNotice();
              }}
              maxLength={1000}
              disabled={sending}
              data-testid="ai-chat-input"
              placeholder="Nhập câu hỏi (VD: phanh kêu, xe xong chưa)..."
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-subtle border border-hairline text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent"
            />
            {sending ? (
              <button
                type="button"
                onClick={cancelSending}
                aria-label="Dừng phản hồi"
                title="Dừng phản hồi"
                data-testid="ai-chat-cancel"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-surface-muted hover:bg-status-danger-soft hover:text-status-danger text-ink-primary border border-hairline flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">stop_circle</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim()}
                aria-label="Gửi tin nhắn"
                data-testid="ai-chat-send"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-accent hover:bg-accent-hover disabled:bg-surface-muted disabled:text-ink-muted text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            )}
          </form>
        </section>
      )}
    </>
  );
}
