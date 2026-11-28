import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const cacheStore = new Map<string, string>();
const cacheMock = vi.hoisted(() => ({
  getCache: vi.fn(async (key: string) => cacheStore.get(key) ?? null),
  setCache: vi.fn(async (key: string, val: string) => {
    cacheStore.set(key, val);
  }),
  deleteCache: vi.fn(async (key: string) => {
    cacheStore.delete(key);
  }),
}));

const aiClientMock = vi.hoisted(() => ({
  executeWithGeminiFailover: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  serviceCategory: { findMany: vi.fn() },
  vehicle: { findMany: vi.fn() },
  appointment: { findMany: vi.fn() },
  workOrder: { findMany: vi.fn() },
}));

vi.mock('../../src/utils/redis.util', () => cacheMock);
vi.mock('../../src/utils/ai-client.util', () => aiClientMock);
vi.mock('../../src/utils/prisma', () => ({ __esModule: true, default: prismaMock }));

import app from '../../src/app';
import { generateAccessToken } from '../../src/utils/jwt.util';

describe('Integration API — AI Customer Chat Routes (/api/v1/ai-chat)', () => {
  const customerToken = generateAccessToken({
    id: 101,
    email: 'lan@example.com',
    fullName: 'Chị Lan',
    roles: ['CUSTOMER'],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();

    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where?.id === 101) {
        return {
          id: 101,
          full_name: 'Chị Lan',
          phone: '0901234567',
          email: 'lan@example.com',
          is_active: true,
          roles: [{ role: { name: 'CUSTOMER' } }],
        };
      }
      return null;
    });

    prismaMock.serviceCategory.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Bảo dưỡng định kỳ',
        description: 'Bảo dưỡng',
        services: [
          {
            id: 2,
            name: 'Kiểm tra hệ thống phanh',
            description: 'Vệ sinh và kiểm tra bố thắng',
            pricing_type: 'FIXED',
            fixed_price: 650000,
            warranty_months: 3,
            warranty_mileage: 3000,
            size_prices: [],
          },
        ],
      },
    ]);

    prismaMock.vehicle.findMany.mockResolvedValue([
      {
        id: 1,
        license_plate: '51H-123.45',
        make: 'Mazda',
        model: 'CX-5',
        year: 2022,
        vehicle_size: 'SUV',
      },
    ]);
    prismaMock.appointment.findMany.mockResolvedValue([]);
    prismaMock.workOrder.findMany.mockResolvedValue([]);
  });

  describe('GET /api/v1/ai-chat/welcome', () => {
    it('returns GUEST welcome envelope when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/ai-chat/welcome?contextPage=/home');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        code: 200,
        data: {
          auth_mode: 'GUEST',
          greeting: expect.any(String),
          suggested_questions: expect.any(Array),
          actions: expect.any(Array),
        },
        timestamp: expect.any(String),
      });
    });

    it('returns CUSTOMER welcome with VIEW_QUOTATION when customer has SENT quotation', async () => {
      prismaMock.workOrder.findMany
        .mockResolvedValueOnce([
          {
            id: 500,
            wo_number: 'WO-500',
            status: 'PENDING_APPROVAL',
            order_type: 'NORMAL',
            vehicle: { id: 1, license_plate: '51H-123.45', make: 'Mazda', model: 'CX-5' },
            advisor: { full_name: 'Cố vấn A', phone: null },
            check_in: { mileage: 42000, complaint: 'Kêu gầm', status: 'CONFIRMED' },
            services: [],
            inspections: [],
            quotations: [
              { id: 1, quotation_number: 'QT-1', quotation_type: 'PRIMARY', status: 'APPROVED', grand_total: 1800000, lines: [] },
              { id: 2, quotation_number: 'QT-2', quotation_type: 'SUPPLEMENTARY', status: 'REJECTED', grand_total: 1200000, lines: [] },
              { id: 3, quotation_number: 'QT-3', quotation_type: 'SUPPLEMENTARY', status: 'SENT', grand_total: 950000, lines: [] },
            ],
            invoices: [],
          },
        ])
        .mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/v1/ai-chat/welcome')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        auth_mode: 'CUSTOMER',
        actions: [
          {
            type: 'VIEW_QUOTATION',
            payload: { workOrderId: 500, quotationId: 3 },
          },
        ],
      });
    });

    it('returns 401 TOKEN_EXPIRED when expired Bearer token is provided so frontend can refresh', async () => {
      const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
      const expiredToken = jwt.sign(
        { id: 101, email: 'lan@example.com', fullName: 'Chị Lan', roles: ['CUSTOMER'], type: 'access' },
        secret,
        { expiresIn: -10 }
      );

      const res = await request(app)
        .get('/api/v1/ai-chat/welcome')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        code: 401,
        error: { code: 'TOKEN_EXPIRED' },
      });
    });
  });

  describe('POST /api/v1/ai-chat/message', () => {
    it('returns 400 VALIDATION_ERROR on empty message or message > 1000 characters', async () => {
      const emptyRes = await request(app).post('/api/v1/ai-chat/message').send({ message: '   ' });
      expect(emptyRes.status).toBe(400);
      expect(emptyRes.body.error.code).toBe('VALIDATION_ERROR');

      const longRes = await request(app)
        .post('/api/v1/ai-chat/message')
        .send({ message: 'a'.repeat(1001) });
      expect(longRes.status).toBe(400);
      expect(longRes.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('ignores forged customer_id in request body (anti-IDOR) and scopes solely to JWT user.id', async () => {
      aiClientMock.executeWithGeminiFailover.mockResolvedValue(
        JSON.stringify({
          reply: 'Chào Chị Lan, xe 51H-123.45 đang được xử lý.',
          intent: 'WORK_ORDER_TRACKING',
          suggested_questions: ['Xem báo giá'],
          actions: [],
        })
      );

      const res = await request(app)
        .post('/api/v1/ai-chat/message')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          message: 'Xem tiến độ xe của tôi',
          customer_id: 999,
          userId: 999,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.auth_mode).toBe('CUSTOMER');
      // Verify all DB queries used JWT user id 101, NEVER forged 999
      expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customer_id: 101, status: 'ACTIVE' },
        })
      );
      expect(prismaMock.workOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customer_id: 101 }),
        })
      );
    });

    it('returns HTTP 200 with is_fallback=true when Gemini keys fail (Zero-500 guarantee)', async () => {
      aiClientMock.executeWithGeminiFailover.mockRejectedValue(new Error('429 Quota exceeded'));

      const res = await request(app)
        .post('/api/v1/ai-chat/message')
        .send({ message: 'kiểm tra phanh bao nhiêu tiền' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        code: 200,
        data: {
          auth_mode: 'GUEST',
          is_fallback: true,
          intent: 'CATALOG_PRICING',
        },
      });
      expect(res.body.data.reply).toContain('650.000');
    });

    it('streams SSE ack -> delta -> done events when Accept includes text/event-stream', async () => {
      aiClientMock.executeWithGeminiFailover.mockImplementation(async (operation: any) => {
        const fakeAi = {
          models: {
            generateContentStream: async () =>
              (async function* () {
                yield { text: '{"reply": "Dạ, phanh kêu có thể ' };
                yield { text: 'do mòn má phanh ạ.", "intent": "SYMPTOM_DIAGNOSIS", "suggested_questions": ["Đặt lịch"], "actions": []}' };
              })(),
          },
        };
        return operation(fakeAi, 0, 'gemini-3.5-flash-lite');
      });

      const res = await request(app)
        .post('/api/v1/ai-chat/message')
        .set('Accept', 'text/event-stream, application/json')
        .send({ message: 'xe bị kêu phanh' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
      expect(res.text).toContain('event: ack');
      expect(res.text).toContain('event: delta');
      expect(res.text).toContain('Dạ, phanh kêu có thể');
      expect(res.text).toContain('event: done');
      expect(res.text).toContain('"success":true');
    });
  });
});
