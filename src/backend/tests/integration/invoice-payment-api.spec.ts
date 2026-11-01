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
      invoice: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      workOrder: {
        findUnique: vi.fn(),
      },
    },
  };
});

describe('Integration API - Invoice & Payment Portal (SPEC-INV / UC-16, UC-27, UC-28)', () => {
  const customer101Token = generateToken({
    id: 101,
    email: 'customer1@example.com',
    fullName: 'Trần Văn Khách 1',
    roles: ['CUSTOMER'],
  });

  const customer102Token = generateToken({
    id: 102,
    email: 'customer2@example.com',
    fullName: 'Trần Văn Khách 2',
    roles: ['CUSTOMER'],
  });

  const saToken = generateToken({
    id: 50,
    email: 'advisor@carservice.vn',
    fullName: 'Lê Cố Vấn',
    roles: ['SA'],
  });

  const staffToken = generateToken({
    id: 15,
    email: 'receptionist@carservice.vn',
    fullName: 'Nguyễn Lễ Tân',
    roles: ['DESK STAFF'],
  });

  beforeEach(() => {
    vi.clearAllMocks();

    (prisma.user.findUnique as any).mockImplementation(({ where }: any) => {
      if (where.id === 101) {
        return Promise.resolve({
          id: 101,
          email: 'customer1@example.com',
          full_name: 'Trần Văn Khách 1',
          is_active: true,
          roles: [{ role: { name: 'CUSTOMER' } }],
        });
      }
      if (where.id === 102) {
        return Promise.resolve({
          id: 102,
          email: 'customer2@example.com',
          full_name: 'Trần Văn Khách 2',
          is_active: true,
          roles: [{ role: { name: 'CUSTOMER' } }],
        });
      }
      if (where.id === 50) {
        return Promise.resolve({
          id: 50,
          email: 'advisor@carservice.vn',
          full_name: 'Lê Cố Vấn',
          is_active: true,
          roles: [{ role: { name: 'SA' } }],
        });
      }
      if (where.id === 15) {
        return Promise.resolve({
          id: 15,
          email: 'receptionist@carservice.vn',
          full_name: 'Nguyễn Lễ Tân',
          is_active: true,
          roles: [{ role: { name: 'DESK STAFF' } }],
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('GET /api/invoices/my-invoices (UC-16: Khách hàng xem danh sách hóa đơn)', () => {
    it('INV-API-01: Khách hàng lấy danh sách hóa đơn và thống kê Bento thành công -> 200 OK', async () => {
      // Mock stats
      (prisma.invoice.findMany as any).mockResolvedValueOnce([
        { status: 'PAID', total_amount: 5000000, amount_due: 0 },
        { status: 'ISSUED', total_amount: 2500000, amount_due: 2500000 },
      ]);

      // Mock list query
      (prisma.invoice.count as any).mockResolvedValue(1);
      (prisma.invoice.findMany as any).mockResolvedValueOnce([
        {
          id: 201,
          work_order_id: 10,
          invoice_number: 'INV-202611-001',
          status: 'ISSUED',
          subtotal: 2500000,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: 2500000,
          amount_due: 2500000,
          issued_at: new Date('2026-11-01T10:00:00.000Z'),
          created_at: new Date('2026-11-01T10:00:00.000Z'),
          work_order: {
            vehicle: {
              id: 1,
              license_plate: '51F-123.45',
              make: 'Toyota',
              model: 'Cross',
              year: 2022,
              color: 'Trắng',
            },
            services: [{ id: 1, name: 'Bảo dưỡng định kỳ' }],
          },
          payments: [],
        },
      ]);

      const res = await request(app)
        .get('/api/invoices/my-invoices')
        .set('Authorization', `Bearer ${customer101Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalSpent).toBe(5000000);
      expect(res.body.data.summary.pendingAmount).toBe(2500000);
      expect(res.body.data.summary.pendingCount).toBe(1);
      expect(res.body.data.summary.rewardPoints).toBe(500); // 5.000.000 / 10.000
      expect(res.body.data.invoices).toHaveLength(1);
      expect(res.body.data.invoices[0].invoiceNumber).toBe('INV-202611-001');
    });

    it('INV-API-02: Báo lỗi 401 Unauthorized khi không gửi Access Token', async () => {
      const res = await request(app).get('/api/invoices/my-invoices');

      expect(res.status).toBe(401);
    });

    it('INV-API-03: Chặn nhân viên (SA) truy cập endpoint /my-invoices của khách hàng -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/invoices/my-invoices')
        .set('Authorization', `Bearer ${saToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/invoices/:id (Chi tiết hóa đơn & Security Ownership Check)', () => {
    it('INV-API-04: Khách hàng xem chi tiết hóa đơn của chính mình -> 200 OK', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue({
        id: 201,
        work_order_id: 10,
        invoice_number: 'INV-202611-001',
        status: 'PAID',
        subtotal: 1000000,
        discount_amount: 100000,
        tax_amount: 0,
        total_amount: 900000,
        amount_due: 0,
        issued_at: new Date('2026-11-01T10:00:00.000Z'),
        created_at: new Date('2026-11-01T10:00:00.000Z'),
        work_order: {
          customer_id: 101, // Thuộc customer 101
          customer: { id: 101, full_name: 'Trần Văn Khách 1', phone: '0901234567', email: 'customer1@example.com' },
          vehicle: { id: 1, license_plate: '51F-123.45', make: 'Toyota', model: 'Cross', year: 2022, color: 'Trắng' },
          advisor: { id: 50, full_name: 'Lê Cố Vấn', phone: '0911223344' },
        },
        lines: [
          { id: 1, item_name: 'Thay dầu động cơ', quantity: 1, unit_price: 500000, total_price: 500000, line_type: 'LABOUR' },
          { id: 2, item_name: 'Dầu nhớt Castrol 5W-30', quantity: 4, unit_price: 125000, total_price: 500000, line_type: 'PART' },
        ],
        payments: [
          { id: 1, payment_method: 'VIETQR', amount: 900000, paid_at: new Date('2026-11-01T11:00:00.000Z') },
        ],
      });

      const res = await request(app)
        .get('/api/invoices/201')
        .set('Authorization', `Bearer ${customer101Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoiceNumber).toBe('INV-202611-001');
      expect(res.body.data.taxAmount).toBe(0); // Zero-Tax
      expect(res.body.data.totalAmount).toBe(900000);
    });

    it('INV-API-05: Chặn Customer xem hóa đơn của khách hàng khác -> 403 Forbidden', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue({
        id: 201,
        work_order: {
          customer_id: 101, // Hóa đơn của user 101
        },
      });

      // User 102 cố truy cập
      const res = await request(app)
        .get('/api/invoices/201')
        .set('Authorization', `Bearer ${customer102Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Bạn không có quyền truy cập hóa đơn này');
    });

    it('INV-API-06: Nhân viên (SA hoặc Desk Staff) được phép xem hóa đơn của bất kỳ khách nào -> 200 OK', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue({
        id: 201,
        work_order_id: 10,
        invoice_number: 'INV-202611-001',
        status: 'PAID',
        subtotal: 900000,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 900000,
        amount_due: 0,
        issued_at: new Date('2026-11-01T10:00:00.000Z'),
        created_at: new Date('2026-11-01T10:00:00.000Z'),
        work_order: {
          customer_id: 101,
          customer: { id: 101, full_name: 'Trần Văn Khách 1', phone: '0901234567', email: 'customer1@example.com' },
          vehicle: { id: 1, license_plate: '51F-123.45', make: 'Toyota', model: 'Cross', year: 2022, color: 'Trắng' },
          advisor: { id: 50, full_name: 'Lê Cố Vấn', phone: '0911223344' },
        },
        lines: [],
        payments: [],
      });

      const res = await request(app)
        .get('/api/invoices/201')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(201);
    });

    it('INV-API-07: Báo lỗi 400 khi ID hóa đơn trên URL không hợp lệ', async () => {
      const res = await request(app)
        .get('/api/invoices/invalid-id')
        .set('Authorization', `Bearer ${customer101Token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Mã hóa đơn không hợp lệ');
    });

    it('INV-API-08: Trả về 404 khi không tìm thấy hóa đơn', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/invoices/99999')
        .set('Authorization', `Bearer ${customer101Token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Không tìm thấy hóa đơn');
    });
  });
});
