import { executeWithGeminiFailover } from '../../utils/ai-client.util';
import {
  AiChatActionItem,
  AiChatAuthMode,
  AiChatHistoryItem,
  AiChatMessageResponse,
  AiChatWelcomeResponse,
} from './ai-customer-chat.types';
import { AiCustomerContextBuilder } from './ai-customer-context.builder';
import { AiCustomerPromptBuilder } from './ai-customer-prompt.builder';
import { AiCustomerValidatorService, formatVnd } from './ai-customer-validator.service';

export interface SendMessageInput {
  userId?: number;
  message: string;
  history?: AiChatHistoryItem[];
  contextPage?: string;
}

function stripJsonCodeFence(rawText: string): string {
  const trimmed = String(rawText || '').trim();
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }
  return trimmed;
}

export class AiCustomerChatService {
  private readonly contextBuilder: AiCustomerContextBuilder;
  private readonly promptBuilder: AiCustomerPromptBuilder;
  private readonly validator: AiCustomerValidatorService;

  constructor(deps?: {
    contextBuilder?: AiCustomerContextBuilder;
    promptBuilder?: AiCustomerPromptBuilder;
    validator?: AiCustomerValidatorService;
  }) {
    this.contextBuilder = deps?.contextBuilder ?? new AiCustomerContextBuilder();
    this.promptBuilder = deps?.promptBuilder ?? new AiCustomerPromptBuilder();
    this.validator = deps?.validator ?? new AiCustomerValidatorService();
  }

  /**
   * Generate instant context-aware welcome greeting (< 50ms, zero LLM call).
   */
  async getWelcomePayload(userId?: number, _contextPage?: string): Promise<AiChatWelcomeResponse> {
    if (!userId) {
      return {
        auth_mode: 'GUEST',
        greeting:
          'Chào Anh/Chị! Em là **Trợ lý Cố vấn Dịch vụ AI của AutoCare Pro**. Em sẵn sàng tư vấn triệu chứng xe, tra cứu bảng giá minh bạch (**0% VAT**) và hỗ trợ đặt lịch hẹn nhanh cho mình ạ.',
        suggested_questions: [
          'Xe phanh kêu két két là bị sao?',
          'Bảng giá bảo dưỡng định kỳ 40.000 km',
          'Đặt lịch bảo dưỡng khung giờ nào?',
        ],
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

    const customerContext = await this.contextBuilder.getCustomerPrivateContext(userId);
    if (!customerContext) {
      return {
        auth_mode: 'CUSTOMER',
        greeting:
          'Chào Anh/Chị! Em là **Trợ lý AI AutoCare Pro**. Em có thể hỗ trợ Anh/Chị theo dõi xe, giải thích báo giá (**0% VAT**) hoặc đặt lịch bảo dưỡng nhanh ạ.',
        suggested_questions: [
          'Bảng giá bảo dưỡng định kỳ 40.000 km',
          'Đặt lịch bảo dưỡng xe',
          'Chính sách bảo hành tại xưởng',
        ],
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

    const name = customerContext.customer.fullName || 'Anh/Chị';

    // Priority 1: Pending SENT quotation needing customer approval
    const woWithPendingQuote = customerContext.activeWorkOrders.find(
      (wo) => wo.quotationSummary.pendingQuotationIds.length > 0
    );
    if (woWithPendingQuote) {
      const qs = woWithPendingQuote.quotationSummary;
      const pendingId = qs.pendingQuotationIds[0];
      return {
        auth_mode: 'CUSTOMER',
        greeting: `Chào **${name}**! Xe **${woWithPendingQuote.vehicle.licensePlate}** (phiếu **${woWithPendingQuote.woNumber}**) hiện đang có báo giá mới chờ Anh/Chị phê duyệt trị giá **${formatVnd(qs.pendingApprovalAmount)}** (tổng dự kiến cộng dồn **0% VAT**: **${formatVnd(qs.projectedCombinedTotal)}**). Anh/Chị cần em giải thích hạng mục nào không ạ?`,
        suggested_questions: [
          'Giải thích chi tiết báo giá đang chờ duyệt',
          'Tổng chi phí dự kiến của xe là bao nhiêu?',
          'Xem tiến độ sửa chữa hiện tại',
        ],
        actions: [
          {
            type: 'VIEW_QUOTATION',
            label: 'Mở báo giá để phê duyệt',
            icon: 'receipt_long',
            target: 'modal:quotation',
            payload: {
              workOrderId: woWithPendingQuote.id,
              quotationId: pendingId,
            },
          },
        ],
      };
    }

    // Priority 2: Unpaid ISSUED invoice awaiting payment
    const woWithUnpaidInvoice = customerContext.activeWorkOrders.find((wo) =>
      wo.invoices.some((inv) => inv.status === 'ISSUED')
    );
    if (woWithUnpaidInvoice) {
      const unpaid = woWithUnpaidInvoice.invoices.find((inv) => inv.status === 'ISSUED')!;
      return {
        auth_mode: 'CUSTOMER',
        greeting: `Chào **${name}**! Xe **${woWithUnpaidInvoice.vehicle.licensePlate}** đã có hóa đơn **#${unpaid.invoiceNumber}** với số tiền cần thanh toán là **${formatVnd(unpaid.amountDue)}** (**0% VAT**). Anh/Chị cần em mở mã QR SePay hoặc xem chi tiết không ạ?`,
        suggested_questions: [
          'Hướng dẫn thanh toán qua mã QR SePay',
          'Xem chi tiết hóa đơn của tôi',
          'Xe tôi đã kiểm định KCS xong chưa?',
        ],
        actions: [
          {
            type: 'VIEW_INVOICE',
            label: 'Thanh toán qua QR SePay',
            icon: 'qr_code_2',
            target: 'modal:invoice',
            payload: {
              invoiceId: unpaid.id,
            },
          },
        ],
      };
    }

    // Priority 3: Active WorkOrder in progress
    if (customerContext.activeWorkOrders.length > 0) {
      const activeWo = customerContext.activeWorkOrders[0];
      return {
        auth_mode: 'CUSTOMER',
        greeting: `Chào **${name}**! Xe **${activeWo.vehicle.licensePlate}** (${activeWo.vehicle.make} ${activeWo.vehicle.model}) của mình đang thực hiện tại xưởng theo phiếu **${activeWo.woNumber}** (trạng thái: **${activeWo.status}**). Anh/Chị muốn kiểm tra tiến độ chi tiết hay hỏi gì thêm không ạ?`,
        suggested_questions: [
          `Xe ${activeWo.vehicle.licensePlate} sửa tới đâu rồi?`,
          'Tổng chi phí dự kiến hiện tại là bao nhiêu?',
          'Khi nào xe hoàn tất kiểm định KCS?',
        ],
        actions: [
          {
            type: 'NAVIGATE',
            label: 'Xem tiến độ trực tiếp',
            icon: 'visibility',
            target: '/customer/profile?tab=tracking',
          },
        ],
      };
    }

    // Priority 4: Upcoming appointment or recently released vehicle
    const actions: AiChatActionItem[] = [
      {
        type: 'OPEN_BOOKING_MODAL',
        label: 'Đặt lịch dịch vụ ngay',
        icon: 'calendar_month',
        target: 'modal:booking',
        payload: {
          preselectedVehicleId: customerContext.vehicles[0]?.id ?? null,
        },
      },
    ];

    if (customerContext.upcomingAppointments.length > 0) {
      const apt = customerContext.upcomingAppointments[0];
      return {
        auth_mode: 'CUSTOMER',
        greeting: `Chào **${name}**! Anh/Chị đang có lịch hẹn cho xe **${apt.vehicle.licensePlate}** vào ngày **${apt.scheduledDate}** lúc **${apt.scheduledTime}**. Em có thể hỗ trợ thêm thông tin dịch vụ hoặc bảng giá (**0% VAT**) cho mình ạ.`,
        suggested_questions: [
          'Cần chuẩn bị gì trước khi mang xe đến?',
          'Bảng giá bảo dưỡng định kỳ 40.000 km',
          'Đặt lịch thêm cho xe khác',
        ],
        actions,
      };
    }

    if (customerContext.recentCompletedOrders.length > 0) {
      const recentWo = customerContext.recentCompletedOrders[0];
      return {
        auth_mode: 'CUSTOMER',
        greeting: `Chào **${name}**! Xe **${recentWo.vehicle.licensePlate}** của Anh/Chị vừa hoàn tất phiếu **${recentWo.woNumber}** ngày **${recentWo.completedAt}**. Nếu cần kiểm tra bảo hành hoặc đặt lịch bảo dưỡng tiếp theo, Anh/Chị nhắn em nhé!`,
        suggested_questions: [
          'Kiểm tra hạn bảo hành dịch vụ vừa làm',
          'Bảng giá chăm sóc & vệ sinh nội thất',
          'Đặt lịch kiểm tra xe định kỳ',
        ],
        actions,
      };
    }

    return {
      auth_mode: 'CUSTOMER',
      greeting: `Chào **${name}**! Em là **Trợ lý Cố vấn Dịch vụ AI của AutoCare Pro**. Hôm nay em có thể tư vấn bảo dưỡng, tra cứu bảng giá (**0% VAT**) hoặc đặt lịch nhanh cho xe của Anh/Chị nhé?`,
      suggested_questions: [
        'Xe đi 40.000 km cần bảo dưỡng những gì?',
        'Bảng giá thay dầu động cơ tổng hợp',
        'Đặt lịch kiểm tra xe tuần này',
      ],
      actions,
    };
  }

  /**
   * Process customer chat message with Context Injection + Gemini Failover + Zero-500 Fallback.
   */
  async sendMessage(params: SendMessageInput): Promise<AiChatMessageResponse> {
    const authMode: AiChatAuthMode = params.userId ? 'CUSTOMER' : 'GUEST';
    const cleanMessage = String(params.message || '').trim().slice(0, 1000);
    const trimmedHistory: AiChatHistoryItem[] = Array.isArray(params.history)
      ? params.history
          .filter(
            (item): item is AiChatHistoryItem =>
              Boolean(item) &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string' &&
              item.content.trim().length > 0
          )
          .slice(-10)
          .map((item) => ({
            role: item.role,
            content: item.content.trim().slice(0, 1000),
          }))
      : [];

    const [catalog, customerContext] = await Promise.all([
      this.contextBuilder.getCatalogContext(),
      params.userId
        ? this.contextBuilder.getCustomerPrivateContext(params.userId)
        : Promise.resolve(null),
    ]);

    const systemInstruction = this.promptBuilder.buildSystemPrompt(authMode);
    const userPrompt = this.promptBuilder.buildUserPrompt({
      message: cleanMessage,
      history: trimmedHistory,
      contextPage: params.contextPage,
      catalog,
      customerContext,
    });

    try {
      const rawText = await executeWithGeminiFailover(async (ai, _keyIndex, model) => {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        return response.text || '';
      }, 12000);

      const parsed = JSON.parse(stripJsonCodeFence(rawText));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Gemini response is not a JSON object');
      }
      const sanitized = this.validator.validateAndSanitize(parsed, authMode);

      return {
        auth_mode: authMode,
        is_fallback: false,
        ...sanitized,
      };
    } catch (err) {
      console.warn(
        '[AiCustomerChatService] Gemini failed or returned invalid JSON, activating Deterministic Fallback:',
        (err as Error).message
      );
      const fallback = this.validator.buildDeterministicFallback({
        message: cleanMessage,
        authMode,
        catalog,
        customerContext,
      });

      return {
        auth_mode: authMode,
        is_fallback: true,
        ...fallback,
      };
    }
  }
}

export const aiCustomerChatService = new AiCustomerChatService();
