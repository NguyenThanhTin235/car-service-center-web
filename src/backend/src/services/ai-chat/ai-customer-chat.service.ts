import logger from '../../loggers/logger';
import { executeWithGeminiFailover, GeminiFailoverAttemptMeta } from '../../utils/ai-client.util';
import {
  createAiTraceId,
  estimateGeminiCostUsd,
  recordAiTelemetry,
} from '../../utils/ai-telemetry.util';
import { stripJsonCodeFence } from '../../utils/vi-text.util';
import {
  AiChatActionItem,
  AiChatAuthMode,
  AiChatHistoryItem,
  AiChatMessageResponse,
  AiChatWelcomeResponse,
} from './ai-customer-chat.types';
import { AiCustomerContextBuilder } from './ai-customer-context.builder';
import { AiCustomerPromptBuilder } from './ai-customer-prompt.builder';
import {
  AiCustomerValidatorService,
  formatVnd,
  localizeReplyEnums,
} from './ai-customer-validator.service';

export interface SendMessageInput {
  userId?: number;
  message: string;
  history?: AiChatHistoryItem[];
  contextPage?: string;
  traceId?: string;
}

export interface StreamMessageCallbacks {
  onDelta?: (partialReply: string) => void;
  signal?: AbortSignal;
}

/**
 * Extract incremental `reply` string from a partial JSON stream (`{"reply": "..."`).
 * Handles escaped sequences (`\n`, `\"`, `\\`, `\t`, `\uXXXX`) without crashing on truncated chunks.
 */
export function extractPartialJsonReply(
  rawBuffer: string
): { text: string; isComplete: boolean } | null {
  const keyMatch = /"reply"\s*:\s*"/.exec(rawBuffer);
  if (!keyMatch) return null;

  const startIndex = keyMatch.index + keyMatch[0].length;
  let out = '';
  let escaped = false;
  let isComplete = false;

  for (let i = startIndex; i < rawBuffer.length; i++) {
    const ch = rawBuffer[i];
    if (escaped) {
      escaped = false;
      switch (ch) {
        case 'n':
          out += '\n';
          break;
        case 'r':
          out += '\r';
          break;
        case 't':
          out += '\t';
          break;
        case 'b':
          out += '\b';
          break;
        case 'f':
          out += '\f';
          break;
        case '"':
          out += '"';
          break;
        case '\\':
          out += '\\';
          break;
        case '/':
          out += '/';
          break;
        case 'u': {
          const hex = rawBuffer.slice(i + 1, i + 5);
          if (hex.length === 4 && /^[0-9a-fA-F]{4}$/.test(hex)) {
            out += String.fromCharCode(parseInt(hex, 16));
            i += 4;
          } else {
            // Incomplete unicode escape at chunk boundary; wait for remaining bytes
            return { text: localizeReplyEnums(out), isComplete: false };
          }
          break;
        }
        default:
          out += ch;
          break;
      }
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      isComplete = true;
      break;
    }
    out += ch;
  }

  return { text: localizeReplyEnums(out), isComplete };
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
  async getWelcomePayload(
    userId?: number,
    _contextPage?: string,
    traceId?: string
  ): Promise<AiChatWelcomeResponse> {
    const start = performance.now();
    const reqTraceId = createAiTraceId(traceId);

    if (!userId) {
      recordAiTelemetry({
        traceId: reqTraceId,
        workflow: 'customer_welcome',
        promptVersion: 'v2.0',
        totalMs: Math.round((performance.now() - start) * 10) / 10,
      });
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
    recordAiTelemetry({
      traceId: reqTraceId,
      workflow: 'customer_welcome',
      promptVersion: 'v2.0',
      totalMs: Math.round((performance.now() - start) * 10) / 10,
    });

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
    return this.executeChat(params);
  }

  /**
   * Stream customer chat reply incrementally via Gemini `generateContentStream`,
   * sharing retrieval, guardrails, telemetry, and deterministic fallback with `sendMessage`.
   */
  async streamMessage(
    params: SendMessageInput,
    callbacks?: StreamMessageCallbacks
  ): Promise<AiChatMessageResponse> {
    return this.executeChat(params, callbacks);
  }

  private async executeChat(
    params: SendMessageInput,
    callbacks?: StreamMessageCallbacks
  ): Promise<AiChatMessageResponse> {
    const totalStart = performance.now();
    const traceId = createAiTraceId(params.traceId);
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

    const retrievalStart = performance.now();
    const [catalog, customerContext] = await Promise.all([
      this.contextBuilder.getCatalogContext(),
      params.userId
        ? this.contextBuilder.getCustomerPrivateContext(params.userId)
        : Promise.resolve(null),
    ]);
    const retrievalMs = Math.round((performance.now() - retrievalStart) * 10) / 10;

    if (callbacks?.signal?.aborted) {
      const abortErr = new Error('Client aborted AI chat stream');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    const systemInstruction = this.promptBuilder.buildSystemPrompt(authMode);
    const userPrompt = this.promptBuilder.buildUserPrompt({
      message: cleanMessage,
      history: trimmedHistory,
      contextPage: params.contextPage,
      catalog,
      customerContext,
    });

    const interventions: string[] = [];
    let attemptMeta: GeminiFailoverAttemptMeta | undefined;
    let inputTokens = 0;
    let outputTokens = 0;
    const isStreaming = Boolean(callbacks);

    const llmStart = performance.now();
    try {
      const llmOutput = await executeWithGeminiFailover(
        async (ai, _keyIndex, model, failoverAbortSignal) => {
          if (callbacks?.signal?.aborted) {
            const abortErr = new Error('Client aborted AI chat stream');
            abortErr.name = 'AbortError';
            throw abortErr;
          }

          // Merge client disconnect signal with failover timeout signal
          const combinedController = new AbortController();
          const abortCombined = () => combinedController.abort();
          failoverAbortSignal?.addEventListener('abort', abortCombined, { once: true });
          callbacks?.signal?.addEventListener('abort', abortCombined, { once: true });

          try {
            const config = {
              systemInstruction: { parts: [{ text: systemInstruction }] },
              responseMimeType: 'application/json',
              temperature: 0.2,
              abortSignal: combinedController.signal,
            };

            if (!isStreaming) {
              const response = await ai.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                config,
              });
              return { text: response.text || '', usage: response.usageMetadata };
            }

            const stream = await ai.models.generateContentStream({
              model,
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              config,
            });

            let rawBuffer = '';
            let lastEmittedReply = '';
            let usageMetadata: { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;

            for await (const chunk of stream) {
              if (callbacks?.signal?.aborted) {
                break;
              }
              if (chunk.usageMetadata) {
                usageMetadata = chunk.usageMetadata;
              }
              const deltaText = typeof chunk.text === 'string' ? chunk.text : '';
              if (!deltaText) continue;

              rawBuffer += deltaText;
              const extracted = extractPartialJsonReply(rawBuffer);
              if (extracted && extracted.text && extracted.text !== lastEmittedReply) {
                lastEmittedReply = extracted.text;
                callbacks?.onDelta?.(extracted.text);
              }
            }

            return { text: rawBuffer, usage: usageMetadata };
          } finally {
            failoverAbortSignal?.removeEventListener('abort', abortCombined);
            callbacks?.signal?.removeEventListener('abort', abortCombined);
          }
        },
        isStreaming ? 18000 : 12000,
        {
          onAttemptMeta: (meta) => {
            attemptMeta = meta;
          },
        }
      );

      if (callbacks?.signal?.aborted) {
        const abortErr = new Error('Client aborted AI chat stream');
        abortErr.name = 'AbortError';
        throw abortErr;
      }

      const rawText = typeof llmOutput === 'string' ? llmOutput : llmOutput.text;
      if (typeof llmOutput !== 'string' && llmOutput.usage) {
        inputTokens = llmOutput.usage.promptTokenCount || 0;
        outputTokens = llmOutput.usage.candidatesTokenCount || 0;
      }

      const llmMs = Math.round((performance.now() - llmStart) * 10) / 10;
      const parsed = JSON.parse(stripJsonCodeFence(rawText));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Gemini response is not a JSON object');
      }

      const validationStart = performance.now();
      const sanitized = this.validator.validateAndSanitize(parsed, authMode, {
        catalog,
        customerContext,
        userMessage: cleanMessage,
        onIntervention: (reason) => interventions.push(reason),
      });
      const validationMs = Math.round((performance.now() - validationStart) * 10) / 10;

      recordAiTelemetry({
        traceId,
        workflow: 'customer_chat',
        promptVersion: isStreaming ? 'v2.0-stream' : 'v2.0',
        provider: 'google_gemini',
        model: attemptMeta?.model,
        inputTokens,
        outputTokens,
        estimatedCostUsd: estimateGeminiCostUsd(attemptMeta?.model, inputTokens, outputTokens),
        retrievalMs,
        llmMs,
        validationMs,
        totalMs: Math.round((performance.now() - totalStart) * 10) / 10,
        retryCount: attemptMeta ? Math.max(0, attemptMeta.attempts - 1) : 0,
        isFallback: false,
        guardrailInterventions: interventions.length > 0 ? interventions : undefined,
      });

      return {
        auth_mode: authMode,
        is_fallback: false,
        ...sanitized,
      };
    } catch (err) {
      if (callbacks?.signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
        throw err;
      }

      const llmMs = Math.round((performance.now() - llmStart) * 10) / 10;
      logger.warn('[AiCustomerChatService] Gemini failed or returned invalid JSON, activating Deterministic Fallback', {
        traceId,
        authMode,
        error: (err as Error).message.slice(0, 160),
      });

      const fallback = this.validator.buildDeterministicFallback({
        message: cleanMessage,
        authMode,
        catalog,
        customerContext,
      });

      recordAiTelemetry({
        traceId,
        workflow: 'customer_chat',
        promptVersion: isStreaming ? 'v2.0-stream' : 'v2.0',
        provider: 'deterministic_fallback',
        retrievalMs,
        llmMs,
        totalMs: Math.round((performance.now() - totalStart) * 10) / 10,
        isFallback: true,
        errorCode: 'GEMINI_FALLBACK_ACTIVATED',
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
