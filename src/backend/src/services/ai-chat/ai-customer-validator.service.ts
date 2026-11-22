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
  QUOTATION: 'VIEW_QUOTATION',
  INVOICE: 'VIEW_INVOICE',
  HOTLINE: 'CALL_HOTLINE',
  CALL: 'CALL_HOTLINE',
};

/**
 * Strip Vietnamese diacritics & normalize whitespace for reliable accent-insensitive matching.
 */
export function normalizeViText(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
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

function normalizeIntent(rawIntent: unknown): AiChatIntent {
  const upper = String(rawIntent || '')
    .trim()
    .toUpperCase();
  if (VALID_AI_CHAT_INTENTS.has(upper as AiChatIntent)) {
    return upper as AiChatIntent;
  }
  return INTENT_ALIASES[upper] || 'GENERAL_SUPPORT';
}

function normalizeActionType(rawType: unknown): AiChatActionType | null {
  const upper = String(rawType || '')
    .trim()
    .toUpperCase();
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

function normalizeActionPayload(rawPayload: unknown): AiChatActionPayload | undefined {
  if (!rawPayload || typeof rawPayload !== 'object') return undefined;
  const p = rawPayload as Record<string, unknown>;

  const rawServiceIds =
    p.preselectedServiceIds ??
    p.preselected_service_ids ??
    p.serviceIds ??
    p.service_ids ??
    (p.serviceId ?? p.service_id ? [p.serviceId ?? p.service_id] : undefined);

  const preselectedServiceIds = Array.isArray(rawServiceIds)
    ? rawServiceIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
    : undefined;

  const preselectedVehicleId = toOptionalPositiveInt(
    p.preselectedVehicleId ?? p.preselected_vehicle_id ?? p.vehicleId ?? p.vehicle_id
  );
  const workOrderId = toOptionalPositiveInt(p.workOrderId ?? p.work_order_id);
  const quotationId = toOptionalPositiveInt(p.quotationId ?? p.quotation_id);
  const invoiceId = toOptionalPositiveInt(p.invoiceId ?? p.invoice_id);

  const preferredDateRaw = p.preferredDate ?? p.preferred_date;
  const preferredTimeRaw = p.preferredTime ?? p.preferred_time;
  const notesRaw = p.notes ?? p.complaint ?? p.symptom;
  const isWarrantyRaw = p.isWarranty ?? p.is_warranty;

  const normalized: AiChatActionPayload = {};
  if (preselectedVehicleId !== null) normalized.preselectedVehicleId = preselectedVehicleId;
  if (preselectedServiceIds && preselectedServiceIds.length > 0) {
    normalized.preselectedServiceIds = preselectedServiceIds;
  }
  if (typeof preferredDateRaw === 'string' && preferredDateRaw.trim()) {
    normalized.preferredDate = preferredDateRaw.trim();
  }
  if (typeof preferredTimeRaw === 'string' && preferredTimeRaw.trim()) {
    normalized.preferredTime = preferredTimeRaw.trim();
  }
  if (typeof notesRaw === 'string' && notesRaw.trim()) {
    normalized.notes = notesRaw.trim().slice(0, 500);
  }
  if (typeof isWarrantyRaw === 'boolean') {
    normalized.isWarranty = isWarrantyRaw;
  }
  if (workOrderId !== null) normalized.workOrderId = workOrderId;
  if (quotationId !== null) normalized.quotationId = quotationId;
  if (invoiceId !== null) normalized.invoiceId = invoiceId;

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function defaultTargetForType(type: AiChatActionType): string {
  switch (type) {
    case 'OPEN_BOOKING_MODAL':
      return 'modal:booking';
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
    authMode: AiChatAuthMode
  ): Omit<AiChatMessageResponse, 'auth_mode' | 'is_fallback'> {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

    const reply =
      typeof obj.reply === 'string' && obj.reply.trim().length > 0
        ? obj.reply.trim()
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

        // Prevent guest responses from leaking private modal actions directly without login
        if (
          authMode === 'GUEST' &&
          (normalizedType === 'VIEW_QUOTATION' || normalizedType === 'VIEW_INVOICE')
        ) {
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

        const payload = normalizeActionPayload(a.payload);
        actions.push({
          type: normalizedType,
          label,
          icon,
          target,
          ...(payload ? { payload } : {}),
        });

        if (actions.length >= 3) break;
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
    const rawLower = String(message || '').toLowerCase();

    // Tier 1: Critical Safety Emergency Detection
    const isCarFire =
      /cháy\s*xe|bốc\s*cháy|cháy\s*nổ/i.test(rawLower) ||
      norm.includes('boc chay') ||
      norm.includes('chay no') ||
      norm.includes('xe bi chay') ||
      norm.includes('chay khoang may');
    const isFloodOrFire =
      norm.includes('ngap nuoc') ||
      (norm.includes('chet may') && norm.includes('nuoc')) ||
      norm.includes('boc khoi') ||
      norm.includes('mui khet') ||
      isCarFire;
    const isBrakeFailure =
      norm.includes('mat phanh') || norm.includes('phanh khong an') || norm.includes('tut chan phanh');

    if (isFloodOrFire || isBrakeFailure) {
      const warning = isFloodOrFire
        ? '**⚠️ TUYỆT ĐỐI KHÔNG ĐỀ MÁY LẠI Ạ!** Việc cố khởi động khi xe bị ngập nước có thể gây thủy kích cong tay biên động cơ.'
        : '**⚠️ TUYỆT ĐỐI KHÔNG CỐ LÁI TIẾP KHI PHANH GẶP SỰ CỐ!** Anh/Chị hãy bật đèn cảnh báo và tấp xe vào lề đường an toàn ngay ạ.';

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

    // Tier 1b: Out-of-Scope / Inspection Violation Requests (Golden Scenario #14)
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
        suggested_questions: ['Bảng giá bảo dưỡng ô tô định kỳ', 'Quy trình kiểm tra 48 hạng mục'],
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

        return {
          reply: `Phiếu sửa chữa **${activeWo.woNumber}** cho xe **${activeWo.vehicle.licensePlate}** (${activeWo.vehicle.make} ${activeWo.vehicle.model}) hiện đang ở trạng thái **${activeWo.status}** (${activeWo.services.length} hạng mục).${quoteText}\n\nCố vấn dịch vụ phụ trách sẽ thông báo ngay khi xe hoàn tất kiểm định KCS ạ.`,
          intent: asksQuotation ? 'QUOTATION_EXPLANATION' : 'WORK_ORDER_TRACKING',
          suggested_questions: ['Thanh toán hóa đơn ở đâu?', 'Xem các hạng mục đang làm'],
          actions,
        };
      }

      if (asksWarranty && (customerContext.warrantyRecords.length > 0 || customerContext.recentCompletedOrders.length > 0)) {
        const topWarranty = customerContext.warrantyRecords[0];
        const recentWo = customerContext.recentCompletedOrders[0];
        const detail = topWarranty
          ? `Hạng mục **${topWarranty.itemName}** trên xe **${topWarranty.licensePlate}** (phiếu **${topWarranty.woNumber}**) đang còn bảo hành (**${topWarranty.warrantyMonths} tháng**${topWarranty.maxWarrantyMileage ? ` hoặc đến mốc **${topWarranty.maxWarrantyMileage.toLocaleString('vi-VN')} km**` : ''}).`
          : `Xe **${recentWo.vehicle.licensePlate}** vừa hoàn tất phiếu **${recentWo.woNumber}** ngày ${recentWo.completedAt}.`;

        return {
          reply: `${detail}\n\nAnh/Chị mang xe qua xưởng để kỹ thuật viên kiểm tra lại miễn phí công kiểm tra theo chính sách bảo hành nhé.`,
          intent: 'WARRANTY_INQUIRY',
          suggested_questions: ['Đặt lịch kiểm tra bảo hành', 'Gọi cố vấn dịch vụ'],
          actions: [
            {
              type: 'OPEN_BOOKING_MODAL',
              label: 'Đặt lịch kiểm tra bảo hành',
              icon: 'calendar_month',
              target: 'modal:booking',
              payload: {
                preselectedVehicleId: topWarranty?.vehicleId ?? recentWo?.vehicle.id ?? null,
                isWarranty: true,
                notes: 'Kiểm tra lại hạng mục bảo hành sau khi nhận xe',
              },
            },
          ],
        };
      }
    }

    // Tier 3: Booking Schedule & Service Catalog Lookup
    if (asksBooking) {
      return {
        reply: `Xưởng **${catalog.garageInfo.name}** tiếp nhận xe từ **${catalog.garageInfo.workingDays}**:\n- **Ca sáng:** ${catalog.garageInfo.bookingSlots.morning.join(', ')}\n- **Ca chiều:** ${catalog.garageInfo.bookingSlots.afternoon.join(', ')}\n\nMọi dịch vụ đều áp dụng **${catalog.garageInfo.vatPolicy}**. Anh/Chị có thể bấm nút bên dưới để chọn khung giờ phù hợp ạ.`,
        intent: 'BOOKING_REQUEST',
        suggested_questions: ['Bảng giá bảo dưỡng định kỳ', 'Quy trình tiếp nhận xe gồm mấy bước?'],
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

    // Catalog search by service keywords
    const allServices: CatalogServiceItem[] = catalog.categories.flatMap((c) => c.services);
    const matchedServices = allServices.filter((svc) => {
      const svcNorm = normalizeViText(`${svc.name} ${svc.description || ''}`);
      const tokens = norm.split(' ').filter((t) => t.length >= 3);
      return tokens.some((tok) => svcNorm.includes(tok));
    });

    if (matchedServices.length > 0) {
      const top = matchedServices.slice(0, 3);
      const lines = top.map((svc) => {
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
              preselectedServiceIds: [top[0].id],
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
