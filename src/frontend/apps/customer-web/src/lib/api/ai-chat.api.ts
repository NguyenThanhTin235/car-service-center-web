import api from '../axios';

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
