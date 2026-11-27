import api from '../axios';
import { parseSseChunkBuffer } from '../../components/chat/aiChatUtils';

export type AiChatAuthMode = 'GUEST' | 'CUSTOMER';

export type AiChatIntent =
  | 'SYMPTOM_DIAGNOSIS'
  | 'CATALOG_PRICING'
  | 'WORK_ORDER_TRACKING'
  | 'QUOTATION_EXPLANATION'
  | 'INVOICE_PAYMENT'
  | 'WARRANTY_INQUIRY'
  | 'BOOKING_REQUEST'
  | 'AUTH_REQUIRED'
  | 'GENERAL_SUPPORT'
  | 'HUMAN_HANDOFF'
  | 'OUT_OF_SCOPE';

export type AiChatActionType =
  | 'NAVIGATE'
  | 'OPEN_BOOKING_MODAL'
  | 'VIEW_QUOTATION'
  | 'VIEW_INVOICE'
  | 'CALL_HOTLINE';

export interface AiChatActionPayload {
  preselectedVehicleId?: number | null;
  preselectedServiceIds?: number[];
  preferredDate?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
  isWarranty?: boolean;
  workOrderId?: number | null;
  quotationId?: number | null;
  invoiceId?: number | null;
}

export interface AiChatActionItem {
  type: AiChatActionType;
  label: string;
  icon: string;
  target: string;
  payload?: AiChatActionPayload;
}

export interface AiChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatWelcomeData {
  auth_mode: AiChatAuthMode;
  greeting: string;
  suggested_questions: string[];
  actions: AiChatActionItem[];
}

export interface AiChatMessageData {
  auth_mode: AiChatAuthMode;
  is_fallback: boolean;
  reply: string;
  intent: AiChatIntent;
  suggested_questions: string[];
  actions: AiChatActionItem[];
}

export async function fetchAiChatWelcome(contextPage?: string): Promise<AiChatWelcomeData> {
  const { data } = await api.get('/api/v1/ai-chat/welcome', {
    params: contextPage ? { contextPage } : undefined,
  });
  return data.data;
}

export async function sendAiChatMessage(payload: {
  message: string;
  history: AiChatHistoryItem[];
  contextPage?: string;
}): Promise<AiChatMessageData> {
  const { data } = await api.post('/api/v1/ai-chat/message', payload);
  return data.data;
}

export class AiChatRequestError extends Error {
  status?: number;
  code?: string;
  isTimeout?: boolean;
  isAborted?: boolean;
  response?: { status?: number; data?: any };

  constructor(
    message: string,
    opts?: {
      status?: number;
      code?: string;
      isTimeout?: boolean;
      isAborted?: boolean;
      data?: any;
    }
  ) {
    super(message);
    this.name = 'AiChatRequestError';
    this.status = opts?.status;
    this.code = opts?.code;
    this.isTimeout = opts?.isTimeout;
    this.isAborted = opts?.isAborted;
    if (opts?.status !== undefined || opts?.data !== undefined) {
      this.response = { status: opts?.status, data: opts?.data };
    }
  }
}

export interface StreamAiChatOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  onAck?: () => void;
  onDelta?: (partialReply: string) => void;
}

/**
 * Send chat message requesting SSE streaming (`Accept: text/event-stream, application/json`),
 * while transparently supporting standard JSON responses (mocked E2E tests / fallbacks)
 * and delegating once to Axios on HTTP 401 so token refresh executes cleanly.
 */
export async function sendAiChatMessageStream(
  payload: {
    message: string;
    history: AiChatHistoryItem[];
    contextPage?: string;
  },
  options?: StreamAiChatOptions
): Promise<AiChatMessageData> {
  const timeoutMs = options?.timeoutMs ?? 20_000;
  const externalSignal = options?.signal;
  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      throw new AiChatRequestError('Yêu cầu đã được hủy.', { isAborted: true });
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const baseUrl = String(api.defaults.baseURL || '').replace(/\/+$/, '');
  const endpoint = `${baseUrl}/api/v1/ai-chat/message`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
        'x-portal': 'customer',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    // If access token expired, delegate once to Axios so shared refreshQueue handles renewal.
    if (res.status === 401 && token && !externalSignal?.aborted) {
      await res.body?.cancel().catch(() => {});
      return await sendAiChatMessage(payload);
    }

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      throw new AiChatRequestError(
        errorBody?.message || `HTTP ${res.status}`,
        {
          status: res.status,
          code: errorBody?.error?.code,
          data: errorBody,
        }
      );
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('text/event-stream') || !res.body) {
      const json = await res.json();
      return (json?.data ?? json) as AiChatMessageData;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalData: AiChatMessageData | null = null;

    const processEvents = (events: Array<{ event: string; data: unknown }>) => {
      for (const evt of events) {
        if (evt.event === 'ack') {
          options?.onAck?.();
        } else if (evt.event === 'delta') {
          const reply =
            evt.data && typeof evt.data === 'object' && 'reply' in evt.data
              ? String((evt.data as { reply: unknown }).reply ?? '')
              : '';
          if (reply) {
            options?.onDelta?.(reply);
          }
        } else if (evt.event === 'done') {
          const payloadObj =
            evt.data && typeof evt.data === 'object' && 'data' in evt.data
              ? (evt.data as { data: AiChatMessageData }).data
              : (evt.data as AiChatMessageData);
          finalData = payloadObj;
        } else if (evt.event === 'error') {
          const errPayload = evt.data as { message?: string; code?: string } | null;
          throw new AiChatRequestError(
            errPayload?.message || 'Hệ thống trợ lý AI đang bận, vui lòng thử lại.',
            { status: 500, code: errPayload?.code, data: errPayload }
          );
        }
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseChunkBuffer(buffer);
      buffer = parsed.rest;
      processEvents(parsed.events);
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      const trailing = parseSseChunkBuffer(`${buffer}\n\n`);
      processEvents(trailing.events);
    }

    if (!finalData) {
      throw new AiChatRequestError('Luồng phản hồi bị gián đoạn giữa chừng.', {
        status: 502,
        code: 'STREAM_INCOMPLETE',
      });
    }

    return finalData;
  } catch (err: any) {
    if (externalSignal?.aborted) {
      throw new AiChatRequestError('Yêu cầu đã được hủy.', { isAborted: true });
    }
    if (timedOut || err?.name === 'AbortError') {
      throw new AiChatRequestError(
        'Trợ lý AI phản hồi lâu hơn dự kiến. Anh/Chị vui lòng thử lại nhé.',
        { isTimeout: true, code: 'STREAM_TIMEOUT' }
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}
