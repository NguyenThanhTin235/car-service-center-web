import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { generateToken } from '../../src/utils/jwt.util';
import prisma from '../../src/utils/prisma';

vi.mock('../../src/utils/prisma', () => {
  return {
    __esModule: true,
    default: {
      user: {
        findUnique: vi.fn(),
      },
      quotation: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      workOrder: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe('Integration API - Quotation Lifecycle (SPEC-QUOT / UC-37, UC-38, UC-39, UC-40)', () => {
  const saToken = generateToken({
    id: 50,
    email: 'advisor@carservice.vn',
    fullName: 'Lê Cố Vấn',
    roles: ['SA'],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 50,
      is_active: true,
      roles: [{ role: { name: 'SA' } }],
    });
  });

  describe('GET /api/quotations/:id (UC-38: Xem chi tiết báo giá)', () => {
    it('QUOT-API-01: Lấy chi tiết báo giá thành công và kiểm tra Zero-Tax', async () => {
      const mockQuotation = {
        id: 12,
        quotation_number: 'QUO-WO-261018-001-01',
        work_order_id: 28,
        status: 'PENDING',
        subtotal: 1500000,
        discount_amount: 100000,
        tax_rate: 0,
        tax_amount: 0,
        grand_total: 1400000,
        created_at: new Date(),
        lines: [
          { id: 1, line_type: 'LABOUR', description: 'Công thay nhớt', quantity: 1, unit_price: 200000, subtotal: 200000 },
          { id: 2, line_type: 'PART', description: 'Dầu Mobil 1', quantity: 4, unit_price: 325000, subtotal: 1300000 },
        ],
        work_order: {
          id: 28,
          wo_number: 'WO-261018-001',
          customer_id: 99,
          customer: { id: 99, full_name: 'Đỗ Thị Khách' },
          vehicle: { license_plate: '51F-888.99' },
        },
      };

      (prisma.quotation.findUnique as any).mockResolvedValue(mockQuotation);

      const response = await request(app)
        .get('/api/quotations/12')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(12);
      expect(response.body.data.subtotal).toBe(1500000);
      expect(response.body.data.taxRate).toBe(0);
      expect(response.body.data.taxAmount).toBe(0);
      expect(response.body.data.grandTotal).toBe(1400000);
    });

    it('QUOT-API-02: Báo lỗi 400 khi mã báo giá không hợp lệ', async () => {
      const response = await request(app)
        .get('/api/quotations/invalid-id')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không hợp lệ');
    });

    it('QUOT-API-03: Trả về 404 khi không tìm thấy báo giá', async () => {
      (prisma.quotation.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/quotations/99999')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Không tìm thấy báo giá');
    });
  });

  describe('POST /api/quotations/:id/approve (UC-39: Phê duyệt báo giá)', () => {
    it('QUOT-API-04: Phê duyệt báo giá thành công -> Status chuyển APPROVED', async () => {
      const pendingQuotation = {
        id: 12,
        quotation_number: 'QUO-WO-261018-001-01',
        work_order_id: 28,
        status: 'PENDING',
        lines: [],
        work_order: {
          id: 28,
          customer_id: 99,
          customer: { email: 'client@gmail.com' },
          vehicle: { license_plate: '51F-888.99' },
        },
      };

      const approvedQuotation = {
        ...pendingQuotation,
        status: 'APPROVED',
        approved_at: new Date(),
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          quotation: {
            findUnique: vi.fn().mockResolvedValue(pendingQuotation),
            update: vi.fn().mockResolvedValue(approvedQuotation),
          },
          jobPart: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          workOrder: {
            update: vi.fn().mockResolvedValue({ id: 28, status: 'APPROVED' }),
          },
          checkIn: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/quotations/12/approve')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('APPROVED');
      expect(response.body.message).toContain('Phê duyệt báo giá thành công');
    });

    it('QUOT-API-05: Chặn phê duyệt lại khi báo giá đã ở trạng thái APPROVED', async () => {
      const alreadyApproved = {
        id: 12,
        status: 'APPROVED',
        lines: [],
        work_order: { customer_id: 99 },
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          quotation: {
            findUnique: vi.fn().mockResolvedValue(alreadyApproved),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/quotations/12/approve')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('đã được phê duyệt');
    });
  });

  describe('POST /api/quotations/:id/reject (UC-39: Khách từ chối báo giá)', () => {
    it('QUOT-API-06: Ghi nhận từ chối báo giá kèm lý do thành công', async () => {
      const pendingQuotation = {
        id: 12,
        quotation_number: 'QUO-WO-261018-001-01',
        work_order_id: 28,
        status: 'PENDING',
        lines: [],
        work_order: { customer_id: 99 },
      };

      const rejectedQuotation = {
        ...pendingQuotation,
        status: 'REJECTED',
        reject_reason: JSON.stringify({ type: 'REVISE', reason: 'Chi phí vượt quá ngân sách' }),
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          quotation: {
            findUnique: vi.fn().mockResolvedValue(pendingQuotation),
            update: vi.fn().mockResolvedValue(rejectedQuotation),
          },
          workOrder: {
            update: vi.fn().mockResolvedValue({ id: 28, status: 'IN_PLANNING' }),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/quotations/12/reject')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          reason: 'Chi phí vượt quá ngân sách',
          rejectType: 'REVISE',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('REJECTED');
      expect(response.body.message).toContain('từ chối báo giá');
    });
  });

  describe('POST /api/quotations/:id/cancel (UC-40: Hủy báo giá)', () => {
    it('QUOT-API-07: Cố vấn dịch vụ hủy báo giá đang chờ phản hồi thành công', async () => {
      const pendingQuotation = {
        id: 12,
        status: 'PENDING',
        work_order_id: 28,
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          quotation: {
            findUnique: vi.fn().mockResolvedValue(pendingQuotation),
            delete: vi.fn().mockResolvedValue(pendingQuotation),
          },
          quotationLine: {
            deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/quotations/12/cancel')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Đã hủy báo giá thành công');
    });

    it('QUOT-API-08: Chặn hủy báo giá đã ở trạng thái APPROVED', async () => {
      const approvedQuotation = {
        id: 12,
        status: 'APPROVED',
        work_order_id: 28,
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          quotation: {
            findUnique: vi.fn().mockResolvedValue(approvedQuotation),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/quotations/12/cancel')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Không thể hủy báo giá đã được phê duyệt');
    });
  });
});
