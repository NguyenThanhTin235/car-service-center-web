import { describe, it, expect, vi, beforeEach } from 'vitest';

const aiClientMock = vi.hoisted(() => ({
  executeWithGeminiFailover: vi.fn(),
}));

vi.mock('../../src/utils/ai-client.util', () => aiClientMock);

import {
  AiCustomerChatService,
  extractPartialJsonReply,
} from '../../src/services/ai-chat/ai-customer-chat.service';
import { GARAGE_STATIC_INFO } from '../../src/services/ai-chat/ai-customer-context.builder';
import { CatalogContext, CustomerPrivateContext } from '../../src/services/ai-chat/ai-customer-chat.types';

const MOCK_CATALOG: CatalogContext = {
  garageInfo: GARAGE_STATIC_INFO,
  categories: [
    {
      id: 1,
      name: 'Bảo dưỡng định kỳ',
      description: 'Bảo dưỡng theo km',
      services: [
        {
          id: 2,
          name: 'Kiểm tra hệ thống phanh',
          categoryName: 'Bảo dưỡng định kỳ',
          description: 'Kiểm tra má phanh & đĩa phanh',
          pricingType: 'FIXED',
          fixedPrice: 650000,
          sizePrices: [],
          warrantyMonths: 3,
          warrantyMileage: 3000,
        },
      ],
    },
  ],
};

function makeCustomerContext(overrides?: Partial<CustomerPrivateContext>): CustomerPrivateContext {
  return {
    customer: { id: 101, fullName: 'Chị Lan', phone: '0901234567', email: 'lan@example.com' },
    vehicles: [{ id: 1, licensePlate: '51H-123.45', make: 'Mazda', model: 'CX-5', year: 2022, vehicleSize: 'SUV' }],
    upcomingAppointments: [],
    activeWorkOrders: [],
    recentCompletedOrders: [],
    warrantyRecords: [],
    ...overrides,
  };
}

describe('AiCustomerChatService', () => {
  let mockContextBuilder: {
    getCatalogContext: ReturnType<typeof vi.fn>;
    getCustomerPrivateContext: ReturnType<typeof vi.fn>;
  };
  let service: AiCustomerChatService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContextBuilder = {
      getCatalogContext: vi.fn().mockResolvedValue(MOCK_CATALOG),
      getCustomerPrivateContext: vi.fn().mockResolvedValue(null),
    };
    service = new AiCustomerChatService({
      contextBuilder: mockContextBuilder as any,
    });
  });

  describe('getWelcomePayload', () => {
    it('returns instant GUEST welcome without calling Gemini or getCustomerPrivateContext', async () => {
      const res = await service.getWelcomePayload(undefined, '/home');

      expect(res.auth_mode).toBe('GUEST');
      expect(res.greeting).toContain('0% VAT');
      expect(res.suggested_questions).toHaveLength(3);
      expect(res.actions[0]).toMatchObject({ type: 'OPEN_BOOKING_MODAL' });
      expect(mockContextBuilder.getCustomerPrivateContext).not.toHaveBeenCalled();
      expect(aiClientMock.executeWithGeminiFailover).not.toHaveBeenCalled();
    });

    it('prioritizes pending SENT quotation with VIEW_QUOTATION chip for authenticated customer', async () => {
      mockContextBuilder.getCustomerPrivateContext.mockResolvedValue(
        makeCustomerContext({
          activeWorkOrders: [
            {
              id: 55,
              woNumber: 'WO-055',
              status: 'PENDING_APPROVAL',
              orderType: 'NORMAL',
              vehicle: { id: 1, licensePlate: '51H-123.45', make: 'Mazda', model: 'CX-5' },
              advisorName: 'Cố vấn A',
              advisorPhone: null,
              mileage: 40000,
              complaint: null,
              services: [],
              findings: [],
              quotations: [],
              quotationSummary: {
                totalApprovedAmount: 1800000,
                pendingApprovalAmount: 950000,
                projectedCombinedTotal: 2750000,
                pendingQuotationIds: [302],
              },
              invoices: [],
            },
          ],
        })
      );

      const res = await service.getWelcomePayload(101, '/customer/profile');

      expect(res.auth_mode).toBe('CUSTOMER');
      expect(res.greeting).toContain('Chị Lan');
      expect(res.greeting).toContain('950.000');
      expect(res.greeting).toContain('2.750.000');
      expect(res.actions[0]).toEqual({
        type: 'VIEW_QUOTATION',
        label: 'Mở báo giá để phê duyệt',
        icon: 'receipt_long',
        target: 'modal:quotation',
        payload: { workOrderId: 55, quotationId: 302 },
      });
    });

    it('prioritizes unpaid ISSUED invoice with VIEW_INVOICE chip when no pending quotation', async () => {
      mockContextBuilder.getCustomerPrivateContext.mockResolvedValue(
        makeCustomerContext({
          activeWorkOrders: [
            {
              id: 56,
              woNumber: 'WO-056',
              status: 'BILLING_REQUESTED',
              orderType: 'NORMAL',
              vehicle: { id: 1, licensePlate: '51H-123.45', make: 'Mazda', model: 'CX-5' },
              advisorName: 'Cố vấn A',
              advisorPhone: null,
              mileage: 40000,
              complaint: null,
              services: [],
              findings: [],
              quotations: [],
              quotationSummary: {
                totalApprovedAmount: 2750000,
                pendingApprovalAmount: 0,
                projectedCombinedTotal: 2750000,
                pendingQuotationIds: [],
              },
              invoices: [
                { id: 901, invoiceNumber: 'INV-901', status: 'ISSUED', totalAmount: 2750000, amountDue: 2750000 },
              ],
            },
          ],
        })
      );

      const res = await service.getWelcomePayload(101);

      expect(res.auth_mode).toBe('CUSTOMER');
      expect(res.actions[0]).toEqual({
        type: 'VIEW_INVOICE',
        label: 'Thanh toán qua QR SePay',
        icon: 'qr_code_2',
        target: 'modal:invoice',
        payload: { invoiceId: 901 },
      });
    });
  });

  describe('sendMessage', () => {
    it('returns structured validated AI response on Gemini happy path', async () => {
      aiClientMock.executeWithGeminiFailover.mockResolvedValue(
        JSON.stringify({
          reply: 'Dạ tiếng rít phanh thường do mòn má phanh hoặc bụi bẩn. Kiểm tra phanh chỉ **650.000 ₫** (**0% VAT**).',
          intent: 'SYMPTOM_DIAGNOSIS',
          suggested_questions: ['Đặt lịch kiểm tra phanh'],
          actions: [
            {
              type: 'OPEN_BOOKING_MODAL',
              label: 'Đặt lịch kiểm tra phanh',
              icon: 'calendar_month',
              target: 'modal:booking',
              payload: { preselectedServiceIds: [2], notes: 'Phanh kêu két két' },
            },
          ],
        })
      );

      const res = await service.sendMessage({
        message: 'Xe phanh kêu két két là bị sao?',
        history: [],
        contextPage: '/home',
      });

      expect(res.auth_mode).toBe('GUEST');
      expect(res.is_fallback).toBe(false);
      expect(res.intent).toBe('SYMPTOM_DIAGNOSIS');
      expect(res.actions[0]).toMatchObject({
        type: 'OPEN_BOOKING_MODAL',
        payload: { preselectedServiceIds: [2], notes: 'Phanh kêu két két' },
      });
    });

    it('activates Deterministic Fallback (Zero-500, is_fallback: true) when all Gemini keys fail', async () => {
      aiClientMock.executeWithGeminiFailover.mockRejectedValue(new Error('503 Service Unavailable'));
      mockContextBuilder.getCustomerPrivateContext.mockResolvedValue(
        makeCustomerContext({
          activeWorkOrders: [
            {
              id: 88,
              woNumber: 'WO-088',
              status: 'IN_PROGRESS',
              orderType: 'NORMAL',
              vehicle: { id: 1, licensePlate: '51H-123.45', make: 'Mazda', model: 'CX-5' },
              advisorName: null,
              advisorPhone: null,
              mileage: 45000,
              complaint: null,
              services: [],
              findings: [],
              quotations: [],
              quotationSummary: {
                totalApprovedAmount: 1800000,
                pendingApprovalAmount: 950000,
                projectedCombinedTotal: 2750000,
                pendingQuotationIds: [305],
              },
              invoices: [],
            },
          ],
        })
      );

      const res = await service.sendMessage({
        userId: 101,
        message: 'xe xong chua em oi',
        history: Array.from({ length: 15 }, (_, idx) => ({
          role: idx % 2 === 0 ? ('user' as const) : ('assistant' as const),
          content: `msg-${idx}`,
        })),
      });

      expect(res.auth_mode).toBe('CUSTOMER');
      expect(res.is_fallback).toBe(true);
      expect(res.reply).toContain('WO-088');
      expect(res.reply).toContain('2.750.000');
      expect(res.actions[0]).toMatchObject({
        type: 'VIEW_QUOTATION',
        payload: { workOrderId: 88, quotationId: 305 },
      });
    });
  });

  describe('extractPartialJsonReply & streamMessage', () => {
    it('extracts partial escaped JSON reply safely across chunk boundaries', () => {
      expect(extractPartialJsonReply('{"intent":')).toBeNull();
      expect(extractPartialJsonReply('{"reply": "Dạ, xe đang \\')).toEqual({
        text: 'Dạ, xe đang ',
        isComplete: false,
      });
      expect(extractPartialJsonReply('{"reply": "Dòng 1\\nDòng 2 \\u003C\\u00')).toEqual({
        text: 'Dòng 1\nDòng 2 <',
        isComplete: false,
      });
      expect(
        extractPartialJsonReply('{"reply": "Giá **650.000 ₫**", "intent": "CATALOG_PRICING"}')
      ).toEqual({
        text: 'Giá **650.000 ₫**',
        isComplete: true,
      });
    });

    it('streams incremental deltas via onDelta and validates finalized response', async () => {
      aiClientMock.executeWithGeminiFailover.mockImplementation(async (operation: any) => {
        const fakeAi = {
          models: {
            generateContentStream: async () =>
              (async function* () {
                yield { text: '```json\n{"reply": "Dạ, ' };
                yield { text: 'kiểm tra phanh \\"650.000 ₫\\"", ' };
                yield {
                  text: '"intent": "CATALOG_PRICING", "suggested_questions": ["Đặt lịch"], "actions": []}\n```',
                  usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 30 },
                };
              })(),
          },
        };
        return operation(fakeAi, 0, 'gemini-3.5-flash-lite');
      });

      const deltas: string[] = [];
      const res = await service.streamMessage(
        { message: 'kiểm tra phanh', history: [] },
        { onDelta: (partial) => deltas.push(partial) }
      );

      expect(deltas).toEqual([
        'Dạ, ',
        'Dạ, kiểm tra phanh "650.000 ₫"',
      ]);
      expect(res.reply).toContain('650.000 ₫');
      expect(res.is_fallback).toBe(false);
    });
  });
});
