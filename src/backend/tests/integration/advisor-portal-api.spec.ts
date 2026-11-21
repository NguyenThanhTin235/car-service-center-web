import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { prismaMock, notificationMock } = vi.hoisted(() => {
  const mock: any = {
    user: {
      findUnique: vi.fn(),
    },
    workOrder: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    checkIn: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    inspection: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    finding: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    woService: {
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    service: {
      findFirst: vi.fn(),
    },
    jobPart: {
      update: vi.fn(),
    },
    vehicleRelease: {
      upsert: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  };
  mock.$transaction = vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mock));

  const notif = {
    sendEmail: vi.fn().mockResolvedValue(undefined),
    notifyAndEmail: vi.fn().mockResolvedValue(undefined),
    sendInAppToRoles: vi.fn().mockResolvedValue({ count: 0, userIds: [] }),
    sendInApp: vi.fn().mockResolvedValue(undefined),
  };

  return { prismaMock: mock, notificationMock: notif };
});

vi.mock('../../src/utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('../../src/services/notification.service', () => ({
  notificationService: notificationMock,
}));

import app from '../../src/app';
import { generateToken } from '../../src/utils/jwt.util';

describe('Integration API - Advisor Portal (SA-API-01..03)', () => {
  const saToken = generateToken({
    id: 33,
    email: 'advisor@carservice.vn',
    fullName: 'Hoàng Cố Vấn',
    roles: ['SA'],
  });

  const customerToken = generateToken({
    id: 88,
    email: 'khachhang@gmail.com',
    fullName: 'Khách Hàng A',
    roles: ['CUSTOMER'],
  });

  const mockSaAuth = () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 33,
      is_active: true,
      roles: [{ role: { name: 'SA' } }],
    });
  };

  const mockCustomerAuth = () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 88,
      is_active: true,
      roles: [{ role: { name: 'CUSTOMER' } }],
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock));
    notificationMock.sendEmail.mockResolvedValue(undefined);
    notificationMock.notifyAndEmail.mockResolvedValue(undefined);
    notificationMock.sendInAppToRoles.mockResolvedValue({ count: 0, userIds: [] });
    notificationMock.sendInApp.mockResolvedValue(undefined);
  });

  describe('SA-API-01: RBAC Guard (SA vs CUSTOMER -> 403 Forbidden)', () => {
    it('chặn CUSTOMER gọi các endpoint Check-in, Inspection, Handover, Cancel-Release, Close -> 403', async () => {
      const endpoints = [
        { method: 'post', path: '/api/work-orders/50/check-in' },
        { method: 'post', path: '/api/work-orders/50/check-in/confirm' },
        { method: 'post', path: '/api/work-orders/50/inspection/findings' },
        { method: 'post', path: '/api/work-orders/50/handover' },
        { method: 'post', path: '/api/work-orders/50/cancel-release' },
        { method: 'post', path: '/api/work-orders/50/close' },
      ];

      for (const ep of endpoints) {
        mockCustomerAuth();
        const res = await (request(app) as any)[ep.method](ep.path)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({});

        expect(res.status).toBe(403);
        expect(res.body.status).toBe('error');
      }
    });

    it('chặn request không có token -> 401 Unauthorized', async () => {
      const res = await request(app).post('/api/work-orders/50/handover').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('SA-API-02: HTTP Contracts cho Check-in, Inspection, Handover/Release & Close', () => {
    it('POST /api/work-orders/:id/check-in trả về 400 khi thiếu dữ liệu bắt buộc', async () => {
      mockSaAuth();

      const res = await request(app)
        .post('/api/work-orders/50/check-in')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ mileage: -5 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /api/work-orders/:id/check-in & /confirm trả về 200 với envelope chuẩn', async () => {
      mockSaAuth();
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        status: 'DRAFT',
        check_in: null,
      });
      prismaMock.checkIn.create.mockResolvedValue({
        id: 11,
        work_order_id: 50,
        mileage: 25000,
        fuel_level: 'HALF',
        status: 'PENDING_CONFIRMATION',
      });
      prismaMock.workOrder.update.mockResolvedValue({ id: 50, status: 'IN_PLANNING' });

      const saveRes = await request(app)
        .post('/api/work-orders/50/check-in')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          mileage: 25000,
          fuel_level: 'HALF',
          complaint: 'Kiểm tra phanh trước',
          exterior_condition: 'Không trầy xước',
        });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);
      expect(saveRes.body.code).toBe(200);
      expect(saveRes.body.data.id).toBe(11);

      mockSaAuth();
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        status: 'IN_PLANNING',
        check_in: { id: 11, status: 'PENDING_CONFIRMATION' },
      });
      prismaMock.checkIn.update.mockResolvedValue({
        id: 11,
        status: 'CONFIRMED',
      });

      const confirmRes = await request(app)
        .post('/api/work-orders/50/check-in/confirm')
        .set('Authorization', `Bearer ${saToken}`);

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);
      expect(confirmRes.body.data.status).toBe('CONFIRMED');
    });

    it('POST /api/work-orders/:id/inspection/findings trả về 201 khi tạo Finding hợp lệ', async () => {
      mockSaAuth();
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        status: 'IN_PLANNING',
        advisor_id: 33,
      });
      prismaMock.inspection.findFirst.mockResolvedValue({
        id: 5,
        work_order_id: 50,
        findings: [],
      });
      prismaMock.finding.create.mockResolvedValue({
        id: 101,
        inspection_id: 5,
        marker_type: 'SCRATCH',
        part_name: 'Cửa phải',
        severity: 'MEDIUM',
      });
      prismaMock.woService.findFirst.mockResolvedValue(null);
      prismaMock.woService.aggregate.mockResolvedValue({ _max: { sort_order: 0 } });
      prismaMock.service.findFirst.mockResolvedValue(null);
      prismaMock.woService.create.mockResolvedValue({ id: 201 });

      const res = await request(app)
        .post('/api/work-orders/50/inspection/findings')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          marker_type: 'SCRATCH',
          part_id: 'front_right_door',
          part_name: 'Cửa phải',
          coordinates: { x: 45, y: 60 },
          description: 'Xước nhẹ',
          severity: 'MEDIUM',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe(201);
      expect(res.body.data.id).toBe(101);
    });

    it('POST /api/work-orders/:id/handover trả về 200 khi FINANCIAL_CLEARED và 400 khi chưa quyết toán', async () => {
      mockSaAuth();
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        status: 'IN_PROGRESS',
        check_in: { mileage: 25000 },
        services: [],
      });

      const failRes = await request(app)
        .post('/api/work-orders/50/handover')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ returnMileage: 25010 });

      expect(failRes.status).toBe(400);
      expect(failRes.body.success).toBe(false);

      mockSaAuth();
      const woCleared = {
        id: 50,
        wo_number: 'WO-261116-010',
        status: 'FINANCIAL_CLEARED',
        customer_id: 88,
        check_in: { mileage: 25000, fuel_level: 'HALF' },
        vehicle: { license_plate: '51F-999.00', make: 'Mazda', model: 'CX-5' },
        customer: { id: 88, full_name: 'Khách A', email: 'a@test.vn' },
        advisor: { id: 33, full_name: 'Hoàng Cố Vấn' },
        release: null,
        invoices: [{ status: 'PAID', payments: [] }],
        services: [{ jobs: [{ status: 'COMPLETED', parts: [] }] }],
      };
      const woReleased = { ...woCleared, status: 'RELEASED', release: { id: 12 } };
      prismaMock.workOrder.findUnique
        .mockResolvedValueOnce(woCleared)
        .mockResolvedValueOnce(woReleased);
      prismaMock.vehicleRelease.upsert.mockResolvedValue({ id: 12 });
      prismaMock.workOrder.update
        .mockResolvedValueOnce(woReleased)
        .mockResolvedValueOnce({ ...woReleased, status: 'CLOSED' });
      prismaMock.notification.create.mockResolvedValue({ id: 1 });

      const okRes = await request(app)
        .post('/api/work-orders/50/handover')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          returnMileage: 25015,
          returnFuel: 'HALF',
          customerSignature: 'data:image/png;base64,sig',
        });

      expect(okRes.status).toBe(200);
      expect(okRes.body.success).toBe(true);
      expect(okRes.body.code).toBe(200);
      expect(okRes.body.data.release.id).toBe(12);
    });

    it('POST /api/work-orders/:id/cancel-release & /close trả về 200 với envelope chuẩn', async () => {
      mockSaAuth();
      const woDraft = {
        id: 51,
        wo_number: 'WO-261116-011',
        status: 'IN_PLANNING',
        customer_id: 88,
        check_in: { mileage: 10000 },
        vehicle: { license_plate: '51G-111.22', make: 'Kia', model: 'Seltos' },
        customer: { id: 88, full_name: 'Khách B', email: null },
        advisor: { id: 33, full_name: 'Hoàng Cố Vấn' },
        release: null,
        services: [],
      };
      const woReleased = { ...woDraft, status: 'RELEASED', release: { id: 15 }, invoices: [] };
      prismaMock.workOrder.findUnique
        .mockResolvedValueOnce(woDraft)
        .mockResolvedValueOnce(woReleased);
      prismaMock.vehicleRelease.upsert.mockResolvedValue({ id: 15 });
      prismaMock.workOrder.update
        .mockResolvedValueOnce(woReleased)
        .mockResolvedValueOnce({ ...woReleased, status: 'CLOSED' });
      prismaMock.notification.create.mockResolvedValue({ id: 2 });

      const cancelRes = await request(app)
        .post('/api/work-orders/51/cancel-release')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ releaseNotes: 'Khách hủy làm dịch vụ', diagnosticFee: 150000 });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.release.id).toBe(15);

      mockSaAuth();
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 52,
        wo_number: 'WO-261116-012',
        status: 'RELEASED',
        customer_id: 88,
        release: { id: 16 },
        vehicle: { license_plate: '51H-333.44' },
        invoices: [{ status: 'PAID' }],
        services: [],
      });
      prismaMock.workOrder.update.mockResolvedValue({
        id: 52,
        status: 'CLOSED',
        close_type: 'MANUAL',
      });
      prismaMock.notification.create.mockResolvedValue({ id: 3 });

      const closeRes = await request(app)
        .post('/api/work-orders/52/close')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ notes: 'Đóng hồ sơ thủ công' });

      expect(closeRes.status).toBe(200);
      expect(closeRes.body.success).toBe(true);
      expect(closeRes.body.data.status).toBe('CLOSED');
    });
  });

  describe('SA-API-03: GET /api/work-orders (WorkOrderRepository.findAll lighter payload)', () => {
    it('sử dụng workOrderListInclude nhẹ (không include inspections/release/invoices/jobs) và trả về pagination', async () => {
      mockSaAuth();
      prismaMock.workOrder.count.mockResolvedValue(1);
      prismaMock.workOrder.findMany.mockResolvedValue([
        {
          id: 50,
          wo_number: 'WO-261116-001',
          status: 'IN_PLANNING',
          customer: { id: 88, full_name: 'Khách A', phone: '0901234567', email: 'a@test.vn' },
          vehicle: { id: 2, license_plate: '51F-999.00', make: 'Mazda', model: 'CX-5' },
          check_in: { id: 11, status: 'CONFIRMED', mileage: 25000, fuel_level: 'HALF' },
          services: [{ id: 1, name: 'Bảo dưỡng', status: 'PENDING', pricing_type: 'FIXED' }],
        },
      ]);

      const res = await request(app)
        .get('/api/work-orders?page=1&limit=10')
        .set('Authorization', `Bearer ${saToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.pagination).toEqual(
        expect.objectContaining({
          total: 1,
          currentPage: 1,
          perPage: 10,
        })
      );

      const findManyArg = prismaMock.workOrder.findMany.mock.calls[0][0];
      expect(findManyArg.include).toBeDefined();
      expect(findManyArg.include.inspections).toBeUndefined();
      expect(findManyArg.include.release).toBeUndefined();
      expect(findManyArg.include.invoices).toBeUndefined();
      expect(findManyArg.include.services.select.jobs).toBeUndefined();
      expect(findManyArg.include.check_in.select).toEqual({
        id: true,
        status: true,
        mileage: true,
        fuel_level: true,
      });
    });
  });
});
