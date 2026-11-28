import {
  AiChatActionItem,
  AiChatActionPayload,
  AiChatActionType,
  AiChatAuthMode,
  AiChatIntent,
  AiChatMessageResponse,
  CatalogContext,
  CatalogServiceItem,
  CustomerPrivateContext,
} from './ai-customer-chat.types';
import { scoreViTextMatch, stripViAccents } from '../../utils/vi-text.util';

export const VALID_AI_CHAT_INTENTS = new Set<AiChatIntent>([
  'SYMPTOM_DIAGNOSIS',
  'CATALOG_PRICING',
  'WORK_ORDER_TRACKING',
  'QUOTATION_EXPLANATION',
  'INVOICE_PAYMENT',
  'WARRANTY_INQUIRY',
  'BOOKING_REQUEST',
  'AUTH_REQUIRED',
  'GENERAL_SUPPORT',
  'HUMAN_HANDOFF',
  'OUT_OF_SCOPE',
]);

export const VALID_AI_CHAT_ACTION_TYPES = new Set<AiChatActionType>([
  'NAVIGATE',
  'OPEN_BOOKING_MODAL',
  'CONFIRM_BOOKING',
  'VIEW_QUOTATION',
  'VIEW_INVOICE',
  'CALL_HOTLINE',
]);

export const WHITELISTED_NAVIGATE_PREFIXES = [
  '/home',
  '/login',
  '/register',
  '/customer/profile',
  '/customer/tracking',
  '/customer/invoices',
  '/customer/history',
  '/customer/appointments',
  '/customer/notifications',
];

export interface ValidationGuardrailContext {
  catalog?: CatalogContext;
  customerContext?: CustomerPrivateContext | null;
  userMessage?: string;
  onIntervention?: (reason: string) => void;
}

const INTENT_ALIASES: Record<string, AiChatIntent> = {
  SYMPTOM_TRIAGE: 'SYMPTOM_DIAGNOSIS',
  SYMPTOM: 'SYMPTOM_DIAGNOSIS',
  DIAGNOSIS: 'SYMPTOM_DIAGNOSIS',
  PRICING: 'CATALOG_PRICING',
  PRICE_INQUIRY: 'CATALOG_PRICING',
  CATALOG: 'CATALOG_PRICING',
  TRACKING: 'WORK_ORDER_TRACKING',
  WORK_ORDER: 'WORK_ORDER_TRACKING',
  QUOTATION: 'QUOTATION_EXPLANATION',
  INVOICE: 'INVOICE_PAYMENT',
  PAYMENT: 'INVOICE_PAYMENT',
  WARRANTY: 'WARRANTY_INQUIRY',
  BOOKING: 'BOOKING_REQUEST',
  APPOINTMENT: 'BOOKING_REQUEST',
  HANDOFF: 'HUMAN_HANDOFF',
  ESCALATE: 'HUMAN_HANDOFF',
};

const ACTION_TYPE_ALIASES: Record<string, AiChatActionType> = {
  OPEN_BOOKING: 'OPEN_BOOKING_MODAL',
  BOOKING: 'OPEN_BOOKING_MODAL',
  BOOKING_MODAL: 'OPEN_BOOKING_MODAL',
  CONFIRM_APPOINTMENT: 'CONFIRM_BOOKING',
  BOOK_APPOINTMENT: 'CONFIRM_BOOKING',
  QUOTATION: 'VIEW_QUOTATION',
  INVOICE: 'VIEW_INVOICE',
  HOTLINE: 'CALL_HOTLINE',
  CALL: 'CALL_HOTLINE',
};

/**
 * Strip Vietnamese diacritics & normalize whitespace for reliable accent-insensitive matching.
 */
export function normalizeViText(text: string): string {
  return stripViAccents(text);
}

const VEHICLE_SIZE_LABELS_VI: Record<string, string> = {
  SMALL: 'Xe nhỏ (Cỡ S)',
  MEDIUM: 'Trung bình (Cỡ M)',
  LARGE: 'Xe lớn (Cỡ L)',
  SUV: 'SUV / Crossover (Cỡ XL)',
  TRUCK: 'Bán tải / Xe tải',
};

const STATUS_LABELS_VI: Record<string, string> = {
  REQUESTED: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  RESCHEDULED: 'Đã dời lịch',
  DRAFT: 'Nháp',
  IN_PLANNING: 'Đang lập kế hoạch',
  PENDING_APPROVAL: 'Chờ duyệt báo giá',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  IN_PROGRESS: 'Đang sửa chữa',
  BILLING_REQUESTED: 'Chờ thanh toán',
  FINANCIAL_CLEARED: 'Đã thanh toán',
  RELEASED: 'Đã bàn giao xe',
  CLOSED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  ISSUED: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  QC_PASSED: 'Đạt kiểm định KCS',
  QC_FAILED: 'Chưa đạt kiểm định KCS',
};

export function localizeReplyEnums(text: string): string {
  let out = String(text || '');
  out = out.replace(
    /((?:cỡ\s*xe|kích\s*thước(?:\s*xe)?)\s*[:\-]?\s*\*?\*?)\b(SMALL|MEDIUM|LARGE|SUV|TRUCK)\b/gi,
    (_, prefix: string, code: string) =>
      `${prefix}${VEHICLE_SIZE_LABELS_VI[code.toUpperCase()] || code}`
  );
  out = out.replace(
    /\b(IN_PLANNING|PENDING_APPROVAL|IN_PROGRESS|BILLING_REQUESTED|FINANCIAL_CLEARED|QC_PASSED|QC_FAILED|REQUESTED|RESCHEDULED|CONFIRMED|APPROVED|REJECTED|RELEASED|ISSUED|PAID|CLOSED|CANCELLED)\b/g,
    (code: string) => STATUS_LABELS_VI[code] || code
  );
  return out;
}

export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))} ₫`;
}

function matchesRoutePrefix(target: string, prefix: string): boolean {
  return (
    target === prefix ||
    target.startsWith(`${prefix}?`) ||
    target.startsWith(`${prefix}#`)
  );
}

export function isSafeActionTarget(type: AiChatActionType, target: string): boolean {
  const clean = String(target || '').trim();
  if (!clean) return false;

  const hasControlOrBackslash = Array.from(clean).some((ch) => {
    const code = ch.charCodeAt(0);
    return code <= 0x1f || ch === '\\';
  });
  if (hasControlOrBackslash || clean.includes('..')) {
    return false;
  }

  const lower = clean.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('//')
  ) {
    return false;
  }

  if (type === 'CALL_HOTLINE') {
    return /^tel:[0-9+]+$/.test(clean);
  }

  if (type === 'OPEN_BOOKING_MODAL') {
    return clean === 'modal:booking' || matchesRoutePrefix(clean, '/customer/profile');
  }

  if (type === 'CONFIRM_BOOKING') {
    return clean === 'action:confirm-booking' || clean === 'modal:booking';
  }

  if (type === 'VIEW_QUOTATION') {
    return (
      clean === 'modal:quotation' ||
      matchesRoutePrefix(clean, '/customer/profile') ||
      matchesRoutePrefix(clean, '/customer/tracking')
    );
  }

  if (type === 'VIEW_INVOICE') {
    return (
      clean === 'modal:invoice' ||
      matchesRoutePrefix(clean, '/customer/profile') ||
      matchesRoutePrefix(clean, '/customer/invoices')
    );
  }

  if (type === 'NAVIGATE') {
    return WHITELISTED_NAVIGATE_PREFIXES.some((prefix) => matchesRoutePrefix(clean, prefix));
  }

  return false;
}

type EmergencyType = 'FLOOD_FIRE' | 'BRAKE' | 'OIL_OR_OVERHEAT' | null;

function detectEmergency(message: string): EmergencyType {
  const norm = normalizeViText(message);
  const rawLower = String(message || '').toLowerCase();

  const isCarFire =
    /cháy\s*xe|bốc\s*cháy|cháy\s*nổ/i.test(rawLower) ||
    norm.includes('boc chay') ||
    norm.includes('chay no') ||
    norm.includes('xe bi chay') ||
    norm.includes('chay khoang may');
  const isFloodOrFire =
    norm.includes('ngap nuoc') ||
    norm.includes('thuy kich') ||
    (norm.includes('chet may') && norm.includes('nuoc')) ||
    norm.includes('boc khoi') ||
    norm.includes('mui khet') ||
    isCarFire;
  if (isFloodOrFire) return 'FLOOD_FIRE';

  const isBrakeFailure =
    norm.includes('mat phanh') ||
    norm.includes('phanh khong an') ||
    norm.includes('tut chan phanh') ||
    norm.includes('dap phanh sat san');
  if (isBrakeFailure) return 'BRAKE';

  const isOilOrOverheat =
    norm.includes('ap suat dau') ||
    norm.includes('den bao dau') ||
    norm.includes('bao do dau') ||
    norm.includes('qua nhiet') ||
    norm.includes('soi ket nuoc') ||
    norm.includes('kim nhiet');
  if (isOilOrOverheat) return 'OIL_OR_OVERHEAT';

  return null;
}

function getEmergencyWarningText(kind: Exclude<EmergencyType, null>): string {
  if (kind === 'FLOOD_FIRE') {
    return '**⚠️ TUYỆT ĐỐI KHÔNG ĐỀ MÁY LẠI Ạ!** Việc cố khởi động khi xe bị ngập nước hoặc có khói/mùi khét có thể gây thủy kích hoặc cháy nổ nguy hiểm.';
  }
  if (kind === 'BRAKE') {
    return '**⚠️ TUYỆT ĐỐI KHÔNG CỐ LÁI TIẾP KHI PHANH GẶP SỰ CỐ!** Anh/Chị hãy bật đèn cảnh báo và tấp xe vào lề đường an toàn ngay ạ.';
  }
  return '**⚠️ TUYỆT ĐỐI KHÔNG ĐỀ MÁY HOẶC CHẠY TIẾP Ạ!** Đèn đỏ áp suất dầu hoặc quá nhiệt động cơ có thể gây bó máy nghiêm trọng. Anh/Chị hãy tắt máy ngay tại vị trí an toàn.';
}

function normalizeIntent(rawIntent: unknown): AiChatIntent {
  const upper = String(rawIntent || '').trim().toUpperCase();
  if (VALID_AI_CHAT_INTENTS.has(upper as AiChatIntent)) {
    return upper as AiChatIntent;
  }
  return INTENT_ALIASES[upper] || 'GENERAL_SUPPORT';
}

function normalizeActionType(rawType: unknown): AiChatActionType | null {
  const upper = String(rawType || '').trim().toUpperCase();
  if (VALID_AI_CHAT_ACTION_TYPES.has(upper as AiChatActionType)) {
    return upper as AiChatActionType;
  }
  return ACTION_TYPE_ALIASES[upper] || null;
}

function toOptionalPositiveInt(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function normalizeActionPayload(
  rawPayload: unknown,
  authMode: AiChatAuthMode,
  guardCtx?: ValidationGuardrailContext
): { payload?: AiChatActionPayload; hadStrippedIds: boolean; wasWarrantyRequested: boolean } {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return { payload: undefined, hadStrippedIds: false, wasWarrantyRequested: false };
  }
  const p = rawPayload as Record<string, unknown>;
  let hadStrippedIds = false;

  const rawServiceIds =
    p.preselectedServiceIds ??
    p.preselected_service_ids ??
    p.serviceIds ??
    p.service_ids ??
    (p.serviceId ?? p.service_id ? [p.serviceId ?? p.service_id] : undefined);

  let preselectedServiceIds = Array.isArray(rawServiceIds)
    ? rawServiceIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
    : undefined;

  if (preselectedServiceIds && guardCtx?.catalog) {
    const validSvcIds = new Set(
      guardCtx.catalog.categories.flatMap((c) => c.services.map((s) => s.id))
    );
    const filtered = preselectedServiceIds.filter((id) => validSvcIds.has(id));
    if (filtered.length !== preselectedServiceIds.length) {
      hadStrippedIds = true;
      guardCtx.onIntervention?.('invalid_service_id_stripped');
    }
    preselectedServiceIds = filtered;
  }

  let preselectedVehicleId = toOptionalPositiveInt(
    p.preselectedVehicleId ?? p.preselected_vehicle_id ?? p.vehicleId ?? p.vehicle_id
  );
  let workOrderId = toOptionalPositiveInt(p.workOrderId ?? p.work_order_id);
  let quotationId = toOptionalPositiveInt(p.quotationId ?? p.quotation_id);
  let invoiceId = toOptionalPositiveInt(p.invoiceId ?? p.invoice_id);

  // Strict Guest Isolation: NEVER carry private entity IDs in GUEST payloads
  if (authMode === 'GUEST') {
    if (preselectedVehicleId || workOrderId || quotationId || invoiceId) {
      hadStrippedIds = true;
      guardCtx?.onIntervention?.('guest_private_payload_id_stripped');
    }
    preselectedVehicleId = null;
    workOrderId = null;
    quotationId = null;
    invoiceId = null;
  } else if (guardCtx?.customerContext) {
    // Strict Customer Ownership Allowlist (Anti-IDOR / Anti-Wrong-Modal)
    const ctx = guardCtx.customerContext;
    const ownedVehicleIds = new Set(ctx.vehicles.map((v) => v.id));
    const ownedWorkOrderIds = new Set([
      ...ctx.activeWorkOrders.map((wo) => wo.id),
      ...ctx.recentCompletedOrders.map((wo) => wo.id),
    ]);
    const allowedQuotationIds = new Set(
      ctx.activeWorkOrders.flatMap((wo) =>
        wo.quotations.filter((q) => q.status !== 'REJECTED').map((q) => q.id)
      )
    );
    const ownedInvoiceIds = new Set([
      ...ctx.activeWorkOrders.flatMap((wo) => wo.invoices.map((i) => i.id)),
      ...ctx.recentCompletedOrders.flatMap((wo) => wo.invoices.map((i) => i.id)),
    ]);

    if (preselectedVehicleId !== null && !ownedVehicleIds.has(preselectedVehicleId)) {
      preselectedVehicleId = null;
      hadStrippedIds = true;
      guardCtx.onIntervention?.('foreign_vehicle_id_stripped');
    }
    if (workOrderId !== null && !ownedWorkOrderIds.has(workOrderId)) {
      workOrderId = null;
      hadStrippedIds = true;
      guardCtx.onIntervention?.('foreign_work_order_id_stripped');
    }
    if (quotationId !== null && !allowedQuotationIds.has(quotationId)) {
      quotationId = null;
      hadStrippedIds = true;
      guardCtx.onIntervention?.('foreign_or_rejected_quotation_id_stripped');
    }
    if (invoiceId !== null && !ownedInvoiceIds.has(invoiceId)) {
      invoiceId = null;
      hadStrippedIds = true;
      guardCtx.onIntervention?.('foreign_invoice_id_stripped');
    }
  }

  const preferredDateRaw = p.preferredDate ?? p.preferred_date;
  const preferredTimeRaw = p.preferredTime ?? p.preferred_time;
  const notesRaw = p.notes ?? p.complaint ?? p.symptom;
  const isWarrantyRaw = p.isWarranty ?? p.is_warranty;
  const wasWarrantyRequested = isWarrantyRaw === true || String(isWarrantyRaw).toLowerCase() === 'true';

  const normalized: AiChatActionPayload = {};
  if (preselectedVehicleId !== null) normalized.preselectedVehicleId = preselectedVehicleId;
  if (preselectedServiceIds && preselectedServiceIds.length > 0) {
    normalized.preselectedServiceIds = preselectedServiceIds;
  }
  if (typeof preferredDateRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(preferredDateRaw.trim())) {
    normalized.preferredDate = preferredDateRaw.trim();
  }
  if (typeof preferredTimeRaw === 'string' && /^\d{2}:\d{2}$/.test(preferredTimeRaw.trim())) {
    normalized.preferredTime = preferredTimeRaw.trim();
  }
  if (typeof notesRaw === 'string' && notesRaw.trim()) {
    normalized.notes = notesRaw.trim().slice(0, 500);
  }
  if (isWarrantyRaw !== undefined) {
    normalized.isWarranty = false;
  }
  if (workOrderId !== null) normalized.workOrderId = workOrderId;
  if (quotationId !== null) normalized.quotationId = quotationId;
  if (invoiceId !== null) normalized.invoiceId = invoiceId;

  return {
    payload: Object.keys(normalized).length > 0 ? normalized : undefined,
    hadStrippedIds,
    wasWarrantyRequested,
  };
}

function isSundayDateStr(dateStr: string): boolean {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.getUTCDay() === 0;
}

function isValidOfficeTimeStr(timeStr: string): boolean {
  const m = timeStr.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return false;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour >= 8 && (hour < 17 || (hour === 17 && minute === 0));
}

function isFutureVnDateTime(dateStr: string, timeStr: string): boolean {
  const dt = new Date(`${dateStr}T${timeStr}:00+07:00`);
  return !Number.isNaN(dt.getTime()) && dt.getTime() > Date.now();
}

function validateAndEnrichConfirmBookingAction(
  baseAction: AiChatActionItem,
  authMode: AiChatAuthMode,
  guardCtx?: ValidationGuardrailContext
): AiChatActionItem {
  const payload: AiChatActionPayload = baseAction.payload ? { ...baseAction.payload, isWarranty: false } : { isWarranty: false };
  const ctx = guardCtx?.customerContext;

  const downgrade = (): AiChatActionItem => {
    guardCtx?.onIntervention?.('confirm_booking_downgraded_to_modal');
    const downgradedPayload = { ...payload };
    if (
      downgradedPayload.preferredDate &&
      (isSundayDateStr(downgradedPayload.preferredDate) ||
        new Date(`${downgradedPayload.preferredDate}T23:59:59+07:00`).getTime() < Date.now())
    ) {
      delete downgradedPayload.preferredDate;
    }
    return {
      type: 'OPEN_BOOKING_MODAL',
      label: 'Đặt lịch trên biểu mẫu',
      icon: 'calendar_month',
      target: 'modal:booking',
      ...(Object.keys(downgradedPayload).length > 0 ? { payload: downgradedPayload } : {}),
    };
  };

  if (authMode !== 'CUSTOMER' || !ctx || !Array.isArray(ctx.vehicles) || ctx.vehicles.length === 0) {
    return downgrade();
  }

  if (!payload.preselectedVehicleId && ctx.vehicles.length === 1) {
    payload.preselectedVehicleId = ctx.vehicles[0].id;
  }

  const ownedVehicle = ctx.vehicles.find((v) => v.id === payload.preselectedVehicleId);
  if (!ownedVehicle) {
    return downgrade();
  }

  const hasServiceOrNotes =
    (Array.isArray(payload.preselectedServiceIds) && payload.preselectedServiceIds.length > 0) ||
    Boolean(payload.notes && payload.notes.trim().length > 0);
  if (!hasServiceOrNotes) {
    return downgrade();
  }

  if (
    !payload.preferredDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(payload.preferredDate) ||
    isSundayDateStr(payload.preferredDate)
  ) {
    return downgrade();
  }

  if (!payload.preferredTime || !isValidOfficeTimeStr(payload.preferredTime)) {
    return downgrade();
  }

  if (!isFutureVnDateTime(payload.preferredDate, payload.preferredTime)) {
    return downgrade();
  }

  const hasConflict = (ctx.upcomingAppointments || []).some((apt) => {
    const activeStatuses = ['REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'ARRIVED'];
    if (!activeStatuses.includes(String(apt.status || '').toUpperCase())) return false;
    if (String(apt.scheduledDate || '').slice(0, 10) !== payload.preferredDate) return false;
    return apt.vehicle?.licensePlate === ownedVehicle.licensePlate;
  });
  if (hasConflict) {
    return downgrade();
  }

  // Enrich server-verified summary fields for the InChatBookingCard
  payload.vehicleLabel = `${ownedVehicle.licensePlate} (${ownedVehicle.make} ${ownedVehicle.model})`.trim();

  if (guardCtx?.catalog && payload.preselectedServiceIds && payload.preselectedServiceIds.length > 0) {
    const allSvcs = guardCtx.catalog.categories.flatMap((c) => c.services);
    const matchedSvcs = payload.preselectedServiceIds
      .map((id) => allSvcs.find((s) => s.id === id))
      .filter((s): s is CatalogServiceItem => Boolean(s));

    if (matchedSvcs.length > 0) {
      payload.serviceNames = matchedSvcs.map((s) => s.name);
      let total = 0;
      let canEstimateExact = true;
      for (const svc of matchedSvcs) {
        if (svc.pricingType === 'FIXED' && svc.fixedPrice !== null) {
          total += svc.fixedPrice;
        } else if (svc.pricingType === 'VEHICLE_SIZE') {
          const sizeMatch = svc.sizePrices.find(
            (sp) => sp.vehicleSize.toUpperCase() === String(ownedVehicle.vehicleSize || '').toUpperCase()
          );
          if (sizeMatch) {
            total += sizeMatch.price;
          } else {
            canEstimateExact = false;
            break;
          }
        } else {
          canEstimateExact = false;
          break;
        }
      }
      payload.estimatedTotal = canEstimateExact ? total : null;
    }
  }

  return {
    type: 'CONFIRM_BOOKING',
    label: baseAction.label || 'Xác nhận đặt lịch',
    icon: baseAction.icon || 'event_available',
    target: 'action:confirm-booking',
    payload,
  };
}

function defaultTargetForType(type: AiChatActionType): string {
  switch (type) {
    case 'OPEN_BOOKING_MODAL':
      return 'modal:booking';
    case 'CONFIRM_BOOKING':
      return 'action:confirm-booking';
    case 'VIEW_QUOTATION':
      return 'modal:quotation';
    case 'VIEW_INVOICE':
      return 'modal:invoice';
    case 'CALL_HOTLINE':
      return 'tel:19006868';
    case 'NAVIGATE':
    default:
      return '/home';
  }
}

export class AiCustomerValidatorService {
  validateAndSanitize(
    raw: unknown,
    authMode: AiChatAuthMode,
    guardCtx?: ValidationGuardrailContext
  ): Omit<AiChatMessageResponse, 'auth_mode' | 'is_fallback'> {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

    let reply =
      typeof obj.reply === 'string' && obj.reply.trim().length > 0
        ? localizeReplyEnums(obj.reply.trim())
        : 'Em đã tiếp nhận thông tin của Anh/Chị ạ. Anh/Chị vui lòng chọn gợi ý bên dưới hoặc liên hệ Hotline **1900 6868** để được hỗ trợ nhanh nhất nhé.';

    const intent = normalizeIntent(obj.intent);

    const suggested_questions = Array.isArray(obj.suggested_questions)
      ? obj.suggested_questions
          .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
          .map((q) => q.trim().slice(0, 120))
          .slice(0, 3)
      : [];

    const actions: AiChatActionItem[] = [];
    if (Array.isArray(obj.actions)) {
      for (const rawAction of obj.actions) {
        if (actions.length >= 3) break;
        if (!rawAction || typeof rawAction !== 'object') continue;
        const a = rawAction as Record<string, unknown>;
        const normalizedType = normalizeActionType(a.type);
        if (!normalizedType) continue;

        let target = typeof a.target === 'string' ? a.target.trim() : '';
        if (!target) {
          target = defaultTargetForType(normalizedType);
        }

        if (
          authMode === 'GUEST' &&
          (normalizedType === 'VIEW_QUOTATION' || normalizedType === 'VIEW_INVOICE')
        ) {
          guardCtx?.onIntervention?.('guest_private_modal_redirected_to_login');
          actions.push({
            type: 'NAVIGATE',
            label: 'Đăng nhập xem hồ sơ xe',
            icon: 'login',
            target: '/login',
          });
          if (actions.length >= 3) break;
          continue;
        }

        if (!isSafeActionTarget(normalizedType, target)) {
          guardCtx?.onIntervention?.('unsafe_action_target_blocked');
          continue;
        }

        const label =
          typeof a.label === 'string' && a.label.trim().length > 0
            ? a.label.trim().slice(0, 60)
            : 'Xem chi tiết';
        const icon =
          typeof a.icon === 'string' && /^[a-z0-9_]+$/i.test(a.icon.trim())
            ? a.icon.trim()
            : 'arrow_forward';

        const { payload, wasWarrantyRequested } = normalizeActionPayload(a.payload, authMode, guardCtx);

        if (
          (normalizedType === 'OPEN_BOOKING_MODAL' || normalizedType === 'CONFIRM_BOOKING') &&
          (wasWarrantyRequested || intent === 'WARRANTY_INQUIRY')
        ) {
          guardCtx?.onIntervention?.('warranty_booking_blocked_redirected');
          actions.push({
            type: 'NAVIGATE',
            label: 'Tra cứu bảo hành',
            icon: 'verified_user',
            target: '/customer/profile?tab=warranty',
          });
          if (actions.length >= 3) break;
          continue;
        }

        if (
          (normalizedType === 'OPEN_BOOKING_MODAL' || normalizedType === 'CONFIRM_BOOKING') &&
          authMode === 'CUSTOMER' &&
          guardCtx?.customerContext &&
          guardCtx.customerContext.vehicles.length === 0
        ) {
          guardCtx?.onIntervention?.('zero_vehicle_redirected_to_vehicles');
          actions.push({
            type: 'NAVIGATE',
            label: 'Thêm phương tiện mới',
            icon: 'directions_car',
            target: '/customer/profile?tab=vehicles',
          });
          if (actions.length >= 3) break;
          continue;
        }

        if (normalizedType === 'CONFIRM_BOOKING') {
          const validatedBooking = validateAndEnrichConfirmBookingAction(
            {
              type: normalizedType,
              label,
              icon,
              target,
              ...(payload ? { payload } : {}),
            },
            authMode,
            guardCtx
          );
          actions.push(validatedBooking);
        } else {
          actions.push({
            type: normalizedType,
            label,
            icon,
            target,
            ...(payload ? { payload } : {}),
          });
        }

        if (actions.length >= 3) break;
      }
    }

    // Deterministic GR-04 Emergency Enforcement even if LLM output forgot ⚠️ prefix or Hotline chip
    if (guardCtx?.userMessage) {
      const emergencyKind = detectEmergency(guardCtx.userMessage);
      if (emergencyKind) {
        if (!reply.startsWith('**⚠️')) {
          guardCtx.onIntervention?.('gr04_emergency_prefix_enforced');
          reply = `${getEmergencyWarningText(emergencyKind)}\n\n${reply}`;
        }
        if (!actions.some((a) => a.type === 'CALL_HOTLINE')) {
          guardCtx.onIntervention?.('gr04_hotline_chip_enforced');
          actions.unshift({
            type: 'CALL_HOTLINE',
            label: 'Gọi cứu hộ 1900 6868',
            icon: 'call',
            target: 'tel:19006868',
          });
          if (actions.length > 3) actions.length = 3;
        }
      }
    }

    return {
      reply,
      intent,
      suggested_questions,
      actions,
    };
  }

  /**
   * 3-Tier Deterministic Fallback Engine (Zero-500 Guarantee).
   * Works seamlessly with accented and unaccented Vietnamese when Gemini is unavailable.
   */
  buildDeterministicFallback(params: {
    message: string;
    authMode: AiChatAuthMode;
    catalog: CatalogContext;
    customerContext: CustomerPrivateContext | null;
  }): Omit<AiChatMessageResponse, 'auth_mode' | 'is_fallback'> {
    const { message, authMode, catalog, customerContext } = params;
    const norm = normalizeViText(message);

    // Tier 1: Critical Safety Emergency Detection (all 4 GR-04 classes)
    const emergencyKind = detectEmergency(message);
    if (emergencyKind) {
      const warning = getEmergencyWarningText(emergencyKind);
      return {
        reply: `${warning}\n\nAnh/Chị vui lòng:\n- Tắt khóa điện và giữ nguyên vị trí xe an toàn.\n- Gọi ngay **Hotline Cứu hộ AutoCare Pro 1900 6868** để đội kỹ thuật điều xe cứu hộ hỗ trợ kiểm tra trực tiếp.`,
        intent: 'SYMPTOM_DIAGNOSIS',
        suggested_questions: ['Đặt lịch kiểm tra sau cứu hộ', 'Quy trình tiếp nhận xe tại xưởng'],
        actions: [
          {
            type: 'CALL_HOTLINE',
            label: 'Gọi cứu hộ 1900 6868',
            icon: 'call',
            target: 'tel:19006868',
          },
        ],
      };
    }

    // Tier 1b: Out-of-Scope / Inspection Violation Requests
    const isOutOfScope =
      norm.includes('tua odo') ||
      norm.includes('tua cong to met') ||
      norm.includes('cong-to-met') ||
      norm.includes('cong to met') ||
      norm.includes('do po') ||
      norm.includes('po no') ||
      norm.includes('thao bau loc') ||
      norm.includes('catalytic') ||
      norm.includes('xe may') ||
      norm.includes('xe sh');

    if (isOutOfScope) {
      return {
        reply: `Dạ **${catalog.garageInfo.name}** là trung tâm dịch vụ kỹ thuật chuyên biệt dành cho **xe ô tô** và tuân thủ nghiêm ngặt tiêu chuẩn an toàn đăng kiểm Việt Nam.\n\nVì vậy xưởng xin phép **từ chối** các yêu cầu tua công-tơ-mét (ODO), độ pô nổ vượt quy chuẩn, tháo bầu lọc khí thải hoặc bảo dưỡng xe máy 2 bánh ạ. Nếu Anh/Chị cần kiểm tra tổng quát hoặc chăm sóc xe ô tô đạt chuẩn đăng kiểm (**${catalog.garageInfo.vatPolicy}**), em luôn sẵn sàng hỗ trợ!`,
        intent: 'OUT_OF_SCOPE',
        suggested_questions: ['Bảng giá bảo dưỡng ô tô định kỳ', 'Quy trình tiếp nhận & bàn giao 8 bước'],
        actions: [
          {
            type: 'OPEN_BOOKING_MODAL',
            label: 'Đặt lịch kiểm tra ô tô',
            icon: 'calendar_month',
            target: 'modal:booking',
          },
        ],
      };
    }

    // Tier 2: Personal Data Inquiries (Tracking / Quotation / Invoice / Warranty)
    const asksBooking =
      norm.includes('dat lich') ||
      norm.includes('hen lich') ||
      norm.includes('chu nhat') ||
      norm.includes('20h') ||
      norm.includes('khung gio');

    const hasLicensePlateMention =
      norm.includes('bien so') || /\b[0-9]{2}[a-z][-\s.]?[0-9]{3}/i.test(norm);

    const asksTracking =
      !asksBooking &&
      (norm.includes('xe xong') ||
        norm.includes('tien do') ||
        norm.includes('sua toi dau') ||
        norm.includes('khi nao xong') ||
        norm.includes('lay xe') ||
        norm.includes('kiem tra tien do') ||
        hasLicensePlateMention ||
        (norm.includes('kiem tra xe') &&
          (norm.includes('cua toi') ||
            norm.includes('cua anh') ||
            norm.includes('cua chi') ||
            norm.includes('sua') ||
            norm.includes('xong'))));
    const asksQuotation = norm.includes('bao gia') || norm.includes('chi phi') || norm.includes('bao nhieu tien');
    const asksInvoice =
      norm.includes('hoa don') || norm.includes('thanh toan') || norm.includes('sepay') || norm.includes('vietqr');
    const asksWarranty = norm.includes('bao hanh') || norm.includes('rung vo lang') || norm.includes('lam lai');

    const isClearlyPersonal =
      asksTracking ||
      asksInvoice ||
      (asksWarranty && (norm.includes('xe toi') || norm.includes('hom qua') || norm.includes('vua'))) ||
      (asksQuotation &&
        (norm.includes('cua toi') ||
          norm.includes('cua anh') ||
          norm.includes('cua chi') ||
          norm.includes('bo sung') ||
          norm.includes('xe toi') ||
          hasLicensePlateMention));

    if (authMode === 'GUEST' && isClearlyPersonal) {
      return {
        reply:
          'Để bảo vệ thông tin riêng tư của phương tiện và hóa đơn, Anh/Chị vui lòng **đăng nhập tài khoản khách hàng** để em tra cứu chính xác tiến độ, báo giá và lịch sử sửa chữa cho xe của mình nhé.',
        intent: 'AUTH_REQUIRED',
        suggested_questions: ['Bảng giá bảo dưỡng định kỳ', 'Giờ làm việc của xưởng?'],
        actions: [
          {
            type: 'NAVIGATE',
            label: 'Đăng nhập xem hồ sơ xe',
            icon: 'login',
            target: '/login',
          },
        ],
      };
    }

    if (authMode === 'CUSTOMER' && customerContext) {
      const woWithUnpaidInvoice = customerContext.activeWorkOrders.find((wo) =>
        wo.invoices.some((inv) => inv.status === 'ISSUED')
      );
      const activeWo =
        customerContext.activeWorkOrders.find(
          (wo) => wo.quotationSummary.pendingQuotationIds.length > 0
        ) || customerContext.activeWorkOrders[0];

      if (asksInvoice && woWithUnpaidInvoice) {
        const unpaid = woWithUnpaidInvoice.invoices.find((inv) => inv.status === 'ISSUED')!;
        return {
          reply: `Xe **${woWithUnpaidInvoice.vehicle.licensePlate}** hiện có hóa đơn **#${unpaid.invoiceNumber}** chưa thanh toán với số tiền cần thanh toán là **${formatVnd(unpaid.amountDue)}** (**0% VAT**).\n\nAnh/Chị có thể bấm nút bên dưới để mở mã VietQR SePay — mã QR đã điền sẵn chính xác số tiền và nội dung chuyển khoản ạ.`,
          intent: 'INVOICE_PAYMENT',
          suggested_questions: ['Xem tiến độ xe của tôi', 'Chính sách bảo hành tại xưởng'],
          actions: [
            {
              type: 'VIEW_INVOICE',
              label: 'Thanh toán qua QR SePay',
              icon: 'qr_code_2',
              target: 'modal:invoice',
              payload: { invoiceId: unpaid.id },
            },
          ],
        };
      }

      if ((asksQuotation || asksTracking) && activeWo) {
        const qs = activeWo.quotationSummary;
        const hasPendingQuote = qs.pendingQuotationIds.length > 0;
        const quoteText =
          qs.projectedCombinedTotal > 0
            ? `\n- Đã duyệt: **${formatVnd(qs.totalApprovedAmount)}**\n- Chờ phê duyệt: **${formatVnd(qs.pendingApprovalAmount)}**\n- Tổng dự kiến cộng dồn (**0% VAT**): **${formatVnd(qs.projectedCombinedTotal)}**`
            : '';

        const actions: AiChatActionItem[] = hasPendingQuote
          ? [
              {
                type: 'VIEW_QUOTATION',
                label: 'Mở báo giá để phê duyệt',
                icon: 'receipt_long',
                target: 'modal:quotation',
                payload: {
                  workOrderId: activeWo.id,
                  quotationId: qs.pendingQuotationIds[0],
                },
              },
            ]
          : [
              {
                type: 'NAVIGATE',
                label: 'Xem chi tiết tiến độ xe',
                icon: 'visibility',
                target: '/customer/profile?tab=tracking',
              },
            ];

        const woStatusLabel = STATUS_LABELS_VI[activeWo.status] || activeWo.status;

        return {
          reply: `Phiếu sửa chữa **${activeWo.woNumber}** cho xe **${activeWo.vehicle.licensePlate}** (${activeWo.vehicle.make} ${activeWo.vehicle.model}) hiện đang ở trạng thái **${woStatusLabel}** (${activeWo.services.length} hạng mục).${quoteText}\n\nCố vấn dịch vụ phụ trách sẽ thông báo ngay khi xe hoàn tất kiểm định KCS ạ.`,
          intent: asksQuotation ? 'QUOTATION_EXPLANATION' : 'WORK_ORDER_TRACKING',
          suggested_questions: ['Thanh toán hóa đơn ở đâu?', 'Xem các hạng mục đang làm'],
          actions,
        };
      }

      if (asksWarranty && (customerContext.warrantyRecords.length > 0 || customerContext.recentCompletedOrders.length > 0)) {
        const topWarranty = customerContext.warrantyRecords[0];
        const recentWo = customerContext.recentCompletedOrders[0];
        const detail = topWarranty
          ? `Hạng mục **${topWarranty.itemName}** trên xe **${topWarranty.licensePlate}** (phiếu **${topWarranty.woNumber}**) đang còn bảo hành (**${topWarranty.warrantyMonths} tháng**${topWarranty.expiresAt ? `, đến hết ngày **${topWarranty.expiresAt}**` : ''}).`
          : `Xe **${recentWo.vehicle.licensePlate}** vừa hoàn tất phiếu **${recentWo.woNumber}** ngày ${recentWo.completedAt}.`;

        return {
          reply: `${detail}\n\nTrợ lý AI chưa hỗ trợ đặt lịch bảo hành trực tiếp. Anh/Chị vui lòng kiểm tra chi tiết tại mục **Bảo hành** trên hồ sơ hoặc gọi **Hotline 1900 6868** để Cố vấn dịch vụ đối soát hạng mục bảo hành nhé.`,
          intent: 'WARRANTY_INQUIRY',
          suggested_questions: ['Gọi cố vấn dịch vụ', 'Bảng giá bảo dưỡng định kỳ'],
          actions: [
            {
              type: 'NAVIGATE',
              label: 'Tra cứu bảo hành',
              icon: 'verified_user',
              target: '/customer/profile?tab=warranty',
            },
            {
              type: 'CALL_HOTLINE',
              label: 'Gọi Hotline 1900 6868',
              icon: 'call',
              target: 'tel:19006868',
            },
          ],
        };
      }
    }

    // Tier 3: Booking Schedule & Ranked Service Catalog Lookup (Stopword-immune)
    if (asksBooking) {
      if (authMode === 'CUSTOMER' && customerContext && customerContext.vehicles.length === 0) {
        return {
          reply:
            'Tài khoản của Anh/Chị hiện chưa có phương tiện nào trong hồ sơ. Vui lòng thêm xe mới vào hồ sơ trước khi đặt lịch hẹn nhé.',
          intent: 'BOOKING_REQUEST',
          suggested_questions: ['Giờ làm việc của xưởng?', 'Bảng giá bảo dưỡng định kỳ'],
          actions: [
            {
              type: 'NAVIGATE',
              label: 'Thêm phương tiện mới',
              icon: 'directions_car',
              target: '/customer/profile?tab=vehicles',
            },
          ],
        };
      }
      return {
        reply: `Xưởng **${catalog.garageInfo.name}** tiếp nhận xe từ **${catalog.garageInfo.workingDays}** (**08:00 - 18:00**). Các khung giờ đặt lịch hẹn trực tuyến gồm:\n- **Ca sáng:** ${catalog.garageInfo.bookingSlots.morning.join(', ')}\n- **Ca chiều:** ${catalog.garageInfo.bookingSlots.afternoon.join(', ')}\n\nMọi dịch vụ đều áp dụng **${catalog.garageInfo.vatPolicy}**. Anh/Chị có thể bấm nút bên dưới để chọn khung giờ phù hợp ạ.`,
        intent: 'BOOKING_REQUEST',
        suggested_questions: ['Bảng giá bảo dưỡng định kỳ', 'Quy trình tiếp nhận & bàn giao 8 bước'],
        actions: [
          {
            type: 'OPEN_BOOKING_MODAL',
            label: 'Đặt lịch dịch vụ ngay',
            icon: 'calendar_month',
            target: 'modal:booking',
          },
        ],
      };
    }

    const asksContactOrHours =
      norm.includes('dia chi') ||
      norm.includes('lien he') ||
      norm.includes('hotline') ||
      norm.includes('tong dai') ||
      norm.includes('gio lam viec') ||
      norm.includes('gio mo cua') ||
      norm.includes('gio tiep nhan') ||
      norm.includes('may gio');

    if (asksContactOrHours) {
      return {
        reply: `Dạ, thông tin liên hệ & giờ tiếp nhận chính thức tại **${catalog.garageInfo.name}**:\n- **Địa chỉ xưởng dịch vụ:** ${catalog.garageInfo.address}\n- **Tổng đài cố vấn:** **${catalog.garageInfo.hotline}** (**Thứ 2 - Thứ 7: 08:00 – 18:00**, **Nghỉ Chủ nhật**)\n- **Giờ tiếp nhận xe:** **Thứ 2 - Thứ 7: 08:00 – 18:00** (**Nghỉ Chủ nhật**)\n- **Chính sách giá:** **${catalog.garageInfo.vatPolicy}** minh bạch, rõ ràng.`,
        intent: 'GENERAL_SUPPORT',
        suggested_questions: ['Đặt lịch dịch vụ ngay', 'Quy trình tiếp nhận & bàn giao 8 bước'],
        actions: [
          {
            type: 'OPEN_BOOKING_MODAL',
            label: 'Đặt lịch hẹn trực tuyến',
            icon: 'calendar_month',
            target: 'modal:booking',
          },
          {
            type: 'CALL_HOTLINE',
            label: 'Gọi Hotline 1900 6868',
            icon: 'call',
            target: 'tel:19006868',
          },
        ],
      };
    }

    const asksProcess =
      norm.includes('quy trinh') ||
      (norm.includes('may buoc') &&
        (norm.includes('tiep nhan') ||
          norm.includes('ban giao') ||
          norm.includes('sua chua') ||
          norm.includes('dich vu')));

    if (asksProcess) {
      const formattedSteps = catalog.garageInfo.processSteps
        .map((step) => {
          const colonIdx = step.indexOf(':');
          if (colonIdx === -1) return `- **${step}**`;
          return `- **${step.slice(0, colonIdx)}:**${step.slice(colonIdx + 1)}`;
        })
        .join('\n');

      return {
        reply: `Dạ, quy trình tiếp nhận & bàn giao xe tại **${catalog.garageInfo.name}** gồm **${catalog.garageInfo.processSteps.length} bước** minh bạch (**${catalog.garageInfo.vatPolicy}**):\n${formattedSteps}`,
        intent: 'GENERAL_SUPPORT',
        suggested_questions: ['Đặt lịch dịch vụ ngay', 'Bảng giá bảo dưỡng định kỳ'],
        actions: [
          {
            type: 'OPEN_BOOKING_MODAL',
            label: 'Đặt lịch dịch vụ ngay',
            icon: 'calendar_month',
            target: 'modal:booking',
          },
        ],
      };
    }

    const allServices: CatalogServiceItem[] = catalog.categories.flatMap((c) => c.services);
    const matchedServices = allServices
      .map((svc) => ({
        svc,
        score: scoreViTextMatch([message], `${svc.name} ${svc.categoryName} ${svc.description || ''}`),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.svc);

    if (matchedServices.length > 0) {
      const lines = matchedServices.map((svc) => {
        if (svc.pricingType === 'FIXED' && svc.fixedPrice !== null) {
          return `- **${svc.name}**: **${formatVnd(svc.fixedPrice)}** (0% VAT)`;
        }
        if (svc.pricingType === 'VEHICLE_SIZE' && svc.sizePrices.length > 0) {
          const prices = svc.sizePrices.map((p) => p.price);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          return `- **${svc.name}**: từ **${formatVnd(min)}** đến **${formatVnd(max)}** tùy cỡ xe (0% VAT)`;
        }
        return `- **${svc.name}**: **Khảo sát & báo giá theo thực tế** (Công thợ + Phụ tùng, 0% VAT — chỉ sửa khi Anh/Chị duyệt)`;
      });

      return {
        reply: `Dưới đây là thông tin tham khảo từ bảng giá chính thức tại **AutoCare Pro** (**${catalog.garageInfo.vatPolicy}**):\n${lines.join('\n')}`,
        intent: 'CATALOG_PRICING',
        suggested_questions: ['Đặt lịch kiểm tra xe', 'Xe tôi cần bảo dưỡng gì?'],
        actions: [
          {
            type: 'OPEN_BOOKING_MODAL',
            label: 'Đặt lịch kiểm tra xe',
            icon: 'calendar_month',
            target: 'modal:booking',
            payload: {
              preselectedServiceIds: [matchedServices[0].id],
              notes: message.slice(0, 200),
            },
          },
        ],
      };
    }

    return {
      reply: `Em đã ghi nhận câu hỏi của Anh/Chị ạ. Hệ thống AI đang xử lý chậm một chút, Anh/Chị có thể chọn nhanh các tác vụ bên dưới hoặc gọi **Hotline ${catalog.garageInfo.hotline}** để Cố vấn dịch vụ hỗ trợ trực tiếp trong 30 giây nhé.`,
      intent: 'GENERAL_SUPPORT',
      suggested_questions: ['Bảng giá bảo dưỡng định kỳ', 'Đặt lịch kiểm tra xe', 'Giờ làm việc của xưởng'],
      actions: [
        {
          type: 'OPEN_BOOKING_MODAL',
          label: 'Đặt lịch dịch vụ ngay',
          icon: 'calendar_month',
          target: 'modal:booking',
        },
        {
          type: 'CALL_HOTLINE',
          label: 'Gọi Hotline 1900 6868',
          icon: 'call',
          target: 'tel:19006868',
        },
      ],
    };
  }
}
