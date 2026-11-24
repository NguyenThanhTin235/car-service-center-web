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
  workOrderId?: number | null;
  quotationId?: number | null;
  invoiceId?: number | null;
}

export interface StoredChatActionItem {
  type: 'NAVIGATE' | 'OPEN_BOOKING_MODAL' | 'VIEW_QUOTATION' | 'VIEW_INVOICE' | 'CALL_HOTLINE';
  label: string;
  icon: string;
  target: string;
  payload?: StoredChatActionPayload;
}

export interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isFallback?: boolean;
  suggestedQuestions?: string[];
  actions?: StoredChatActionItem[];
}

export interface MarkdownInlineSpan {
  type: 'text' | 'bold';
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
    return parsed.filter(
      (item): item is StoredChatMessage =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string'
    );
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
  const regex = /\*\*(.+?)\*\*/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      spans.push({ type: 'text', value: text.slice(lastIdx, match.index) });
    }
    spans.push({ type: 'bold', value: match[1] });
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
