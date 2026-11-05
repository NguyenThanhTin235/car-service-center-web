import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { generateToken } from '../../src/utils/jwt.util';
import prisma from '../../src/utils/prisma';

vi.mock('../../src/utils/prisma', () => {
  const mockPrisma: any = {
    user: {
      findUnique: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    workOrder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  mockPrisma.$transaction = vi.fn((cb: any) => cb(mockPrisma));
  return {
    __esModule: true,
    default: mockPrisma,
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
      (prisma.invoice.findMany as any).mockResolvedValueOnce([
        { status: 'PAID', total_amount: 5000000, amount_due: 0 },
        { status: 'ISSUED', total_amount: 2500000, amount_due: 2500000 },
      ]);

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
      expect(res.body.data.summary.rewardPoints).toBe(500);
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
          customer_id: 101,
          customer: { id: 101, full_name: 'Trần Văn Khách 1', phone: '0901234567', email: 'customer1@example.com' },
          vehicle: { id: 1, license_plate: '51F-123.45', make: 'Toyota', model: 'Cross', year: 2022, color: 'Trắng' },
          advisor: { id: 50, full_name: 'Lê Cố Vấn', phone: '0911223344' },
        },
        lines: [
          { id: 1, description: 'Thay dầu động cơ', quantity: 1, unit_price: 500000, amount: 500000, line_type: 'LABOUR', sort_order: 0 },
          { id: 2, description: 'Dầu nhớt Castrol 5W-30', quantity: 4, unit_price: 125000, amount: 500000, line_type: 'PART', sort_order: 1 },
        ],
        payments: [
          { id: 1, payment_method: 'QR_TRANSFER', amount: 900000, paid_at: new Date('2026-11-01T11:00:00.000Z') },
        ],
      });

      const res = await request(app)
        .get('/api/invoices/201')
        .set('Authorization', `Bearer ${customer101Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoiceNumber).toBe('INV-202611-001');
      expect(res.body.data.taxAmount).toBe(0);
      expect(res.body.data.totalAmount).toBe(900000);
    });

    it('INV-API-05: Chặn Customer xem hóa đơn của khách hàng khác -> 403 Forbidden', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue({
        id: 201,
        work_order: {
          customer_id: 101,
        },
      });

      const res = await request(app)
        .get('/api/invoices/201')
        .set('Authorization', `Bearer ${customer102Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Bạn không có quyền truy cập hóa đơn này');
    });

    it('INV-API-06: Nhân viên (DESK STAFF) được phép xem hóa đơn của bất kỳ khách nào -> 200 OK', async () => {
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

  describe('GET /api/invoices/billing-queue (UC-27: Hàng chờ lập hóa đơn)', () => {
    it('INV-API-09: Nhân viên quầy lấy danh sách hàng chờ và counters thành công -> 200 OK', async () => {
      (prisma.workOrder.count as any).mockResolvedValue(2);
      (prisma.invoice.count as any).mockResolvedValue(1);
      (prisma.invoice.findMany as any).mockResolvedValueOnce([
        { total_amount: 1500000 },
      ]);

      (prisma.workOrder.findMany as any).mockResolvedValueOnce([
        {
          id: 10,
          wo_number: 'WO-202611-001',
          status: 'BILLING_REQUESTED',
          customer: { id: 101, full_name: 'Trần Văn Khách 1' },
          vehicle: { id: 1, license_plate: '51F-123.45', make: 'Toyota', model: 'Cross' },
          advisor: { id: 50, full_name: 'Lê Cố Vấn' },
          services: [{ id: 1, name: 'Bảo dưỡng', pricing_type: 'FIXED' }],
          quotations: [{ id: 1, quotation_number: 'QUO-01', grand_total: 1500000 }],
          updated_at: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/invoices/billing-queue?tab=PENDING')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.pendingCount).toBe(2);
      expect(res.body.data.records).toHaveLength(1);
      expect(res.body.data.records[0].woNumber).toBe('WO-202611-001');
    });

    it('INV-API-10: Chặn Khách hàng truy cập hàng chờ lập hóa đơn -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/invoices/billing-queue')
        .set('Authorization', `Bearer ${customer101Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/invoices/preview (UC-27: Xem trước hóa đơn dự kiến)', () => {
    it('INV-API-11: Lấy thông tin preview thành công khi Work Order đủ điều kiện -> 200 OK', async () => {
      (prisma.workOrder.findUnique as any).mockResolvedValue({
        id: 10,
        wo_number: 'WO-202611-001',
        status: 'BILLING_REQUESTED',
        customer: { id: 101, full_name: 'Trần Văn Khách 1' },
        vehicle: { id: 1, license_plate: '51F-123.45', make: 'Toyota', model: 'Cross' },
        advisor: { id: 50, full_name: 'Lê Cố Vấn' },
        services: [
          {
            id: 1,
            name: 'Bảo dưỡng định kỳ',
            qc_records: [{ overall_result: 'PASS' }],
            jobs: [{ id: 10, status: 'COMPLETED' }],
          },
        ],
        quotations: [
          {
            id: 1,
            quotation_number: 'QUO-01',
            status: 'APPROVED',
            discount_amount: 50000,
            lines: [
              {
                id: 101,
                line_type: 'LABOUR',
                description: 'Công thay dầu',
                quantity: 1,
                snapshot_unit_price: 200000,
              },
            ],
          },
        ],
        invoices: [],
      });

      const res = await request(app)
        .get('/api/invoices/preview?workOrderId=10')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subtotal).toBe(200000);
      expect(res.body.data.defaultDiscount).toBe(50000);
      expect(res.body.data.totalAmount).toBe(150000);
    });

    it('INV-API-12: Báo lỗi 400 khi thiếu workOrderId hoặc workOrderId không hợp lệ', async () => {
      const res = await request(app)
        .get('/api/invoices/preview')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/invoices (UC-27: Tạo hóa đơn nháp)', () => {
    it('INV-API-13: Tạo hóa đơn nháp thành công -> 201 Created', async () => {
      (prisma.workOrder.findUnique as any).mockResolvedValue({
        id: 10,
        wo_number: 'WO-202611-001',
        status: 'BILLING_REQUESTED',
        customer: { id: 101, full_name: 'Trần Văn Khách 1' },
        vehicle: { id: 1, license_plate: '51F-123.45', make: 'Toyota', model: 'Cross' },
        advisor: { id: 50, full_name: 'Lê Cố Vấn' },
        services: [
          {
            id: 1,
            name: 'Bảo dưỡng định kỳ',
            qc_records: [{ overall_result: 'PASS' }],
            jobs: [{ id: 10, status: 'COMPLETED' }],
          },
        ],
        quotations: [
          {
            id: 1,
            quotation_number: 'QUO-01',
            status: 'APPROVED',
            discount_amount: 0,
            lines: [
              {
                id: 101,
                line_type: 'LABOUR',
                description: 'Công thay dầu',
                quantity: 1,
                snapshot_unit_price: 200000,
              },
            ],
          },
        ],
        invoices: [],
      });

      (prisma.invoice.findFirst as any).mockResolvedValue(null);
      (prisma.invoice.create as any).mockResolvedValue({
        id: 301,
        work_order_id: 10,
        invoice_number: 'INV-202611-001',
        status: 'DRAFT',
        subtotal: 200000,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 200000,
        amount_due: 200000,
        notes: 'Hóa đơn dịch vụ đợt 1',
        created_at: new Date(),
        lines: [],
      });

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          workOrderId: 10,
          notes: 'Hóa đơn dịch vụ đợt 1',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.invoiceNumber).toBe('INV-202611-001');
    });
  });

  describe('POST /api/invoices/:id/issue (UC-27: Phát hành hóa đơn)', () => {
    it('INV-API-14: Phát hành hóa đơn nháp thành công -> 200 OK', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue({
        id: 301,
        invoice_number: 'INV-202611-001',
        status: 'DRAFT',
        total_amount: 500000,
        work_order: {
          customer_id: 101,
          customer: { full_name: 'Trần Văn Khách 1', email: 'customer1@example.com' },
          vehicle: { license_plate: '51F-123.45', make: 'Toyota', model: 'Cross' },
          advisor: { full_name: 'Lê Cố Vấn' },
        },
      });

      (prisma.invoice.update as any).mockResolvedValue({
        id: 301,
        invoice_number: 'INV-202611-001',
        status: 'ISSUED',
        issued_at: new Date(),
        total_amount: 500000,
        amount_due: 500000,
      });

      const res = await request(app)
        .post('/api/invoices/301/issue')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ISSUED');
    });
  });

  describe('POST /api/invoices/:id/payments (UC-28: Ghi nhận thanh toán thủ công)', () => {
    it('INV-API-15: Ghi nhận thanh toán tiền mặt thành công -> 201 Created', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue({
        id: 301,
        invoice_number: 'INV-202611-001',
        status: 'ISSUED',
        total_amount: 1000000,
        amount_due: 1000000,
        work_order_id: 10,
        work_order: {
          id: 10,
          status: 'BILLING_REQUESTED',
          customer_id: 101,
          advisor_id: 50,
          customer: { full_name: 'Trần Văn Khách 1', email: 'customer1@example.com' },
          vehicle: { license_plate: '51F-123.45', make: 'Toyota', model: 'Cross' },
          advisor: { full_name: 'Lê Cố Vấn' },
        },
      });

      (prisma.payment.create as any).mockResolvedValue({
        id: 501,
        amount: 1000000,
        status: 'PENDING',
      });

      (prisma.payment.update as any).mockResolvedValue({
        id: 501,
        status: 'SUCCESS',
        paid_at: new Date(),
      });

      (prisma.invoice.update as any).mockResolvedValue({
        id: 301,
        invoice_number: 'INV-202611-001',
        status: 'PAID',
        amount_due: 0,
        work_order: {
          status: 'BILLING_REQUESTED',
          advisor_id: 50,
          customer_id: 101,
          vehicle: { license_plate: '51F-123.45', make: 'Toyota', model: 'Cross' },
          customer: { full_name: 'Trần Văn Khách 1' },
        },
      });

      (prisma.workOrder.update as any).mockResolvedValue({
        id: 10,
        status: 'FINANCIAL_CLEARED',
      });

      const res = await request(app)
        .post('/api/invoices/301/payments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          paymentMethod: 'CASH',
          amount: 1000000,
          tenderedAmount: 1200000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.changeAmount).toBe(200000);
      expect(res.body.data.invoiceStatus).toBe('PAID');
    });

    it('INV-API-16: Báo lỗi 422 khi số tiền thanh toán không bằng amount_due', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue({
        id: 301,
        status: 'ISSUED',
        amount_due: 1000000,
        work_order: {},
      });

      const res = await request(app)
        .post('/api/invoices/301/payments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          paymentMethod: 'CASH',
          amount: 500000, // Thanh toán thiếu -> Báo lỗi MVP full payment
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toContain('Số tiền thanh toán phải bằng đúng số tiền còn phải trả');
    });

    it('INV-API-17: Chặn SA ghi nhận thanh toán -> 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/invoices/301/payments')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          paymentMethod: 'CASH',
          amount: 1000000,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/invoices/:id/payments/sepay (SPEC-SEPAY: Tạo phiên thanh toán SePay)', () => {
    it('INV-API-18: Khởi tạo phiên thanh toán SePay thành công -> 201 Created', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue({
        id: 301,
        invoice_number: 'INV-202611-001',
        status: 'ISSUED',
        amount_due: 1425000,
        work_order: {
          customer_id: 101,
          vehicle: { license_plate: '51F-123.45' },
        },
      });

      (prisma.payment.updateMany as any).mockResolvedValue({ count: 0 });
      (prisma.payment.create as any).mockResolvedValue({
        id: 801,
        amount: 1425000,
        transaction_ref: 'INV-202611-001-9999',
        payment_url: 'https://pay-sandbox.sepay.vn/v1/checkout/init',
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/invoices/301/payments/sepay')
        .set('Authorization', `Bearer ${customer101Token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.checkoutUrl).toContain('sepay.vn');
      expect(res.body.data.fields.merchant).toBeDefined();
      expect(res.body.data.fields.signature).toBeDefined();
      expect(res.body.data.amount).toBe(1425000);
    });

    it('INV-API-19: Chặn khách hàng khác tạo thanh toán cho hóa đơn không thuộc về mình -> 403 Forbidden', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue({
        id: 301,
        invoice_number: 'INV-202611-001',
        status: 'ISSUED',
        amount_due: 1425000,
        work_order: {
          customer_id: 101, // Thuộc customer 101
        },
      });

      const res = await request(app)
        .post('/api/invoices/301/payments/sepay')
        .set('Authorization', `Bearer ${customer102Token}`); // Customer 102 gọi

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/payments/sepay/ipn (SPEC-SEPAY: Webhook IPN)', () => {
    it('INV-API-20: Xử lý IPN thành công khi X-Secret-Key hợp lệ -> 200 OK & FINANCIAL_CLEARED', async () => {
      process.env.SEPAY_SECRET_KEY = 'test_secret_key_12345';

      (prisma.payment.findUnique as any).mockResolvedValue({
        id: 801,
        amount: 1425000,
        status: 'PENDING',
        transaction_ref: 'INV-202611-001-9999',
        invoice: {
          id: 301,
          invoice_number: 'INV-202611-001',
          work_order_id: 10,
          work_order: {
            status: 'BILLING_REQUESTED',
            advisor_id: 50,
            customer_id: 101,
            vehicle: { license_plate: '51F-123.45' },
            customer: { full_name: 'Trần Văn Khách 1', email: 'customer1@example.com' },
            advisor: { id: 50, full_name: 'Advisor Test' },
          },
        },
      });

      (prisma.payment.update as any).mockResolvedValue({ id: 801, status: 'SUCCESS' });
      (prisma.invoice.update as any).mockResolvedValue({
        id: 301,
        invoice_number: 'INV-202611-001',
        work_order_id: 10,
        work_order: {
          status: 'BILLING_REQUESTED',
          advisor_id: 50,
          customer_id: 101,
          vehicle: { license_plate: '51F-123.45' },
          customer: { full_name: 'Trần Văn Khách 1', email: 'customer1@example.com' },
          advisor: { id: 50, full_name: 'Advisor Test' },
        },
      });
      (prisma.workOrder.update as any).mockResolvedValue({ id: 10, status: 'FINANCIAL_CLEARED' });
      (prisma.auditLog.create as any).mockResolvedValue({ id: 1 });
      (prisma.notification.create as any).mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post('/api/payments/sepay/ipn')
        .set('X-Secret-Key', 'test_secret_key_12345')
        .send({
          timestamp: Math.floor(Date.now() / 1000),
          notification_type: 'ORDER_PAID',
          order: {
            order_invoice_number: 'INV-202611-001-9999',
            order_amount: 1425000,
            order_status: 'CAPTURED',
          },
          transaction: {
            transaction_id: 'TXN-SEPAY-123456',
            payment_method: 'BANK_TRANSFER',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('INV-API-21: Từ chối xử lý khi X-Secret-Key không khớp -> 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/payments/sepay/ipn')
        .set('X-Secret-Key', 'WRONG_SECRET_KEY')
        .send({
          notification_type: 'ORDER_PAID',
          order: { order_invoice_number: 'INV-001' },
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/invoices/:id/payments/status (Kiểm tra trạng thái hóa đơn)', () => {
    it('INV-API-22: Lấy trạng thái hóa đơn thành công -> 200 OK', async () => {
      (prisma.invoice.findUnique as any).mockResolvedValue({
        id: 301,
        invoice_number: 'INV-202611-001',
        status: 'PAID',
        amount_due: 0,
        total_amount: 1425000,
        work_order: {
          customer_id: 101,
          status: 'FINANCIAL_CLEARED',
        },
        payments: [
          {
            id: 801,
            status: 'SUCCESS',
            amount: 1425000,
            payment_method: 'QR_TRANSFER',
            transaction_ref: 'TXN-1234',
            paid_at: new Date(),
          },
        ],
      });

      const res = await request(app)
        .get('/api/invoices/301/payments/status')
        .set('Authorization', `Bearer ${customer101Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isPaid).toBe(true);
      expect(res.body.data.status).toBe('PAID');
    });
  });
});
