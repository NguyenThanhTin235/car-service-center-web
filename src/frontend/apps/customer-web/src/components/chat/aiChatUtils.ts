export const GUEST_HISTORY_KEY = 'csc_ai_chat_history:guest';
export const GUEST_OPEN_KEY = 'csc_ai_chat_open:guest';
export const PENDING_BOOKING_INTENT_KEY = 'csc_pending_booking_intent';

export function getUserHistoryKey(userId: number): string {
  return `csc_ai_chat_history:user_${userId}`;
}

export function getUserOpenKey(userId: number): string {
  return `csc_ai_chat_open:user_${userId}`;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
}

export interface StoredChatActionPayload {
  preselectedVehicleId?: number | null;
  preselectedServiceIds?: number[];
  preferredDate?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
  isWarranty?: boolean;
  vehicleLabel?: string | null;
  serviceNames?: string[];
  estimatedTotal?: number | null;
  workOrderId?: number | null;
  quotationId?: number | null;
  invoiceId?: number | null;
}

export interface StoredChatActionItem {
  type:
    | 'NAVIGATE'
    | 'OPEN_BOOKING_MODAL'
    | 'CONFIRM_BOOKING'
    | 'VIEW_QUOTATION'
    | 'VIEW_INVOICE'
    | 'CALL_HOTLINE';
  label: string;
  icon: string;
  target: string;
  payload?: StoredChatActionPayload;
}

export interface StoredChatBookingResult {
  appointmentId: number;
  scheduledDate: string;
  scheduledTime: string;
}

export interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isFallback?: boolean;
  suggestedQuestions?: string[];
  actions?: StoredChatActionItem[];
  bookingResult?: StoredChatBookingResult;
}

export interface MarkdownInlineSpan {
  type: 'text' | 'bold' | 'code';
  value: string;
}

export interface MarkdownParsedLine {
  kind: 'bullet' | 'paragraph' | 'spacer';
  spans: MarkdownInlineSpan[];
}

export function safeParseChatHistory(raw: string | null): StoredChatMessage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is StoredChatMessage =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          (item.role === 'user' || item.role === 'assistant') &&
          typeof item.content === 'string'
      )
      .slice(-30)
      .map((item) => ({
        ...item,
        content: item.content.slice(0, 2000),
      }));
  } catch {
    return [];
  }
}

/**
 * Guest-to-Auth Session Promotion:
 * When an unauthenticated visitor logs in, copy their guest conversation (if it has user messages)
 * into their scoped user session key when that user session has no prior history, then wipe guest key.
 */
export function promoteGuestSessionToUser(
  storage: StorageLike,
  userId: number
): { promoted: boolean; messages: StoredChatMessage[] } {
  const userKey = getUserHistoryKey(userId);
  const existingUserMessages = safeParseChatHistory(storage.getItem(userKey));
  const guestMessages = safeParseChatHistory(storage.getItem(GUEST_HISTORY_KEY));
  const hasUserMessagesInGuest = guestMessages.some((m) => m.role === 'user');

  if (existingUserMessages.length === 0 && hasUserMessagesInGuest) {
    storage.setItem(userKey, JSON.stringify(guestMessages));
    storage.removeItem(GUEST_HISTORY_KEY);
    storage.removeItem(GUEST_OPEN_KEY);
    return { promoted: true, messages: guestMessages };
  }

  return { promoted: false, messages: existingUserMessages };
}

/**
 * Logout Privacy Cleanup:
 * Immediately removes all authenticated user chat histories, open states, and pending booking intents.
 */
export function clearUserChatSessions(storage: StorageLike): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key) continue;
    if (
      key.startsWith('csc_ai_chat_history:user_') ||
      key.startsWith('csc_ai_chat_open:user_') ||
      key === PENDING_BOOKING_INTENT_KEY
    ) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    storage.removeItem(key);
  }
}

export function savePendingBookingIntent(
  storage: StorageLike,
  payload: StoredChatActionPayload
): void {
  storage.setItem(PENDING_BOOKING_INTENT_KEY, JSON.stringify(payload || {}));
}

export function consumePendingBookingIntent(
  storage: StorageLike
): StoredChatActionPayload | null {
  const raw = storage.getItem(PENDING_BOOKING_INTENT_KEY);
  if (!raw) return null;
  storage.removeItem(PENDING_BOOKING_INTENT_KEY);
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as StoredChatActionPayload) : null;
  } catch {
    return null;
  }
}

export function parseInlineBoldSpans(text: string): MarkdownInlineSpan[] {
  const spans: MarkdownInlineSpan[] = [];
  const regex = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      spans.push({ type: 'text', value: text.slice(lastIdx, match.index) });
    }
    if (match[1] !== undefined) {
      spans.push({ type: 'bold', value: match[1] });
    } else if (match[2] !== undefined) {
      spans.push({ type: 'code', value: match[2] });
    }
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    spans.push({ type: 'text', value: text.slice(lastIdx) });
  }

  return spans.length > 0 ? spans : [{ type: 'text', value: text }];
}

/**
 * XSS-safe lightweight Markdown parser for AI chat replies (no HTML injection).
 */
export function parseSafeMarkdownLines(text: string): MarkdownParsedLine[] {
  const rawLines = String(text || '').split(/\r?\n/);
  return rawLines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return { kind: 'spacer', spans: [] };
    }
    if (/^[-*•]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-*•]\s+/, '');
      return { kind: 'bullet', spans: parseInlineBoldSpans(content) };
    }
    return { kind: 'paragraph', spans: parseInlineBoldSpans(trimmed) };
  });
}

/**
 * Prevent open redirect attacks by permitting only relative customer portal routes.
 */
export function isSafeRedirectPath(path: string | null | undefined): boolean {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/customer/')) return false;
  if (trimmed.startsWith('//')) return false;
  const lower = trimmed.toLowerCase();
  if (lower.includes('javascript:') || lower.includes('http://') || lower.includes('https://')) {
    return false;
  }
  return true;
}

const VIET_ACCENT_REGEX = /[\u0300-\u036f]/g;

/** Strip Vietnamese diacritics for lightweight intent matching on the client. */
export function stripChatAccents(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(VIET_ACCENT_REGEX, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

export interface PreambleOptions {
  userMessage: string;
  turnCount: number;
  lastPreamble?: string | null;
}

const FIRST_TURN_PREAMBLES = {
  pricing: 'Dạ, để mình kiểm tra bảng giá cho bạn nhé!',
  booking: 'Dạ, mình hỗ trợ bạn kiểm tra lịch hẹn ngay nhé!',
  tracking: 'Dạ, để mình kiểm tra thông tin cho bạn nhé!',
  technical: 'Dạ, mình hỗ trợ bạn ngay nhé!',
  general: 'Dạ, mình hỗ trợ bạn ngay nhé!',
} as const;

const FOLLOWUP_PREAMBLES: Record<keyof typeof FIRST_TURN_PREAMBLES, readonly string[]> = {
  pricing: [
    'Mình đang tra cứu chi phí và gói dịch vụ phù hợp...',
    'Để mình kiểm tra mức giá mới nhất tại xưởng cho bạn nhé!',
  ],
  booking: [
    'Mình đang xem khung giờ tiếp nhận phù hợp cho bạn...',
    'Để mình kiểm tra lịch trống tại xưởng cho bạn nhé!',
  ],
  tracking: [
    'Mình đang kiểm tra thông tin và tiến độ xe cho bạn...',
    'Để mình đối chiếu trạng thái hồ sơ mới nhất nhé!',
  ],
  technical: [
    'Mình đang phân tích tình trạng kỹ thuật bạn mô tả...',
    'Mình đang tìm kiếm thông tin phù hợp cho hạng mục này...',
  ],
  general: [
    'Mình đang tìm kiếm thông tin phù hợp...',
    'Mình đang phân tích yêu cầu của bạn...',
    'Để mình kiểm tra chi tiết cho bạn nhé!',
  ],
};

function detectPreambleIntent(normalized: string): keyof typeof FIRST_TURN_PREAMBLES {
  if (/(gia|bao nhieu|chi phi|bang gia|khuyen mai|phi)/.test(normalized)) return 'pricing';
  if (/(dat lich|lich hen|gio mo cua|khung gio|dat cho)/.test(normalized)) return 'booking';
  if (/(tien do|xong chua|bien so|hoa don|thanh toan|xe cua|lich su|bao hanh)/.test(normalized)) {
    return 'tracking';
  }
  if (/(keu|rung|phanh|ac quy|dieu hoa|lop|dau|nhot|loi|hu|nong|khoi|den bao|bao duong)/.test(normalized)) {
    return 'technical';
  }
  return 'general';
}

/**
 * Select a natural, context-aware opening preamble without hitting any AI API.
 * Turn 0 uses a warm welcome opening; follow-up turns avoid repeating greetings or consecutive lines.
 */
export function selectContextualPreamble(options: PreambleOptions): string {
  const normalized = stripChatAccents(options.userMessage);
  const category = detectPreambleIntent(normalized);

  if (options.turnCount <= 0) {
    return FIRST_TURN_PREAMBLES[category];
  }

  const candidates = FOLLOWUP_PREAMBLES[category];
  const preferred = candidates[options.turnCount % candidates.length];
  if (preferred !== options.lastPreamble) {
    return preferred;
  }
  return candidates[(options.turnCount + 1) % candidates.length] || preferred;
}

export const SMART_LOADING_STAGES = {
  STAGE_1: 'Mình đang tổng hợp thông tin chi tiết cho bạn...',
  STAGE_2: 'Hệ thống đang xử lý dữ liệu nhiều hơn một chút, bạn chờ thêm giây lát nhé!',
} as const;

export interface ParsedSseEvent {
  event: string;
  data: unknown;
}

/**
 * Incrementally parse complete `event:` / `data:` SSE frames from a streaming text buffer.
 */
export function parseSseChunkBuffer(buffer: string): {
  events: ParsedSseEvent[];
  rest: string;
} {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const frames = normalized.split('\n\n');
  const rest = frames.pop() ?? '';
  const events: ParsedSseEvent[] = [];

  for (const frame of frames) {
    const trimmed = frame.trim();
    if (!trimmed) continue;

    let eventName = 'message';
    const dataLines: string[] = [];

    for (const line of frame.split('\n')) {
      if (line.startsWith(':')) continue; // SSE comment/heartbeat
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim() || 'message';
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length === 0) continue;
    const rawData = dataLines.join('\n');
    let parsedData: unknown = rawData;
    try {
      parsedData = JSON.parse(rawData);
    } catch {
      parsedData = rawData;
    }

    events.push({ event: eventName, data: parsedData });
  }

  return { events, rest };
}
