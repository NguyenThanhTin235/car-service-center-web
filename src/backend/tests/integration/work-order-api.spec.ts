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
      workOrder: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      intakeRecord: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      woService: {
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      job: {
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe('Integration API - Work Order Lifecycle (SPEC-WO / UC-15, UC-26, UC-29)', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/work-orders (Tạo phiếu công việc từ Tiếp nhận - UC-29)', () => {
    it('WO-API-01: Cố vấn dịch vụ tạo Work Order thành công từ Intake QUEUED', async () => {
      // Mock auth SA
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 33,
        is_active: true,
        roles: [{ role: { name: 'SA' } }],
      });

      const mockWorkOrder = {
        id: 50,
        wo_number: 'WO-261101-001',
        status: 'DRAFT',
        customer_id: 1,
        vehicle_id: 2,
        advisor_id: 33,
        source_type: 'WALK_IN',
        created_at: new Date(),
      };

      (prisma.workOrder.findFirst as any).mockResolvedValue(null);

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          intakeRecord: {
            findUnique: vi.fn().mockResolvedValue({
              id: 101,
              status: 'QUEUED',
              customer_id: 1,
              vehicle_id: 2,
              intake_type: 'WALK_IN',
              customer: { id: 1 },
              vehicle: { id: 2 },
              services: [],
            }),
            update: vi.fn().mockResolvedValue({ id: 101, status: 'CONVERTED' }),
          },
          workOrder: {
            count: vi.fn().mockResolvedValue(0),
            findFirst: vi.fn().mockResolvedValue(null), // Xe không có WO mở
            create: vi.fn().mockResolvedValue(mockWorkOrder),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          intakeRecordId: 101,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.code).toBe(201);
      expect(response.body.data.id).toBe(50);
      expect(response.body.data.wo_number).toBe('WO-261101-001');
      expect(response.body.data.status).toBe('DRAFT');
    });

    it('WO-API-02: Báo lỗi 400 khi body thiếu intakeRecordId', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 33,
        is_active: true,
        roles: [{ role: { name: 'SA' } }],
      });

      const response = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${saToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.intakeRecordId).toBeDefined();
    });

    it('WO-API-03: Báo lỗi 422 khi Intake không ở trạng thái QUEUED', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 33,
        is_active: true,
        roles: [{ role: { name: 'SA' } }],
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          intakeRecord: {
            findUnique: vi.fn().mockResolvedValue({
              id: 101,
              status: 'CONVERTED', // Đã chuyển đổi rồi
              customer_id: 1,
              vehicle_id: 2,
            }),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ intakeRecordId: 101 });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không ở trạng thái chờ xử lý');
    });

    it('WO-API-04: Chặn tài khoản CUSTOMER tạo Work Order -> 403 Forbidden', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 88,
        is_active: true,
        roles: [{ role: { name: 'CUSTOMER' } }],
      });

      const response = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ intakeRecordId: 101 });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/work-orders/:id (Chi tiết phiếu công việc - UC-26)', () => {
    it('WO-API-05: Lấy thông tin chi tiết phiếu công việc thành công', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 33,
        is_active: true,
        roles: [{ role: { name: 'SA' } }],
      });

      const mockWoDetail = {
        id: 50,
        wo_number: 'WO-261101-001',
        status: 'IN_PLANNING',
        customer: { id: 1, full_name: 'Khách A', phone: '0901112233' },
        vehicle: { id: 2, license_plate: '51F-111.22' },
        services: [],
      };

      (prisma.workOrder.findUnique as any).mockResolvedValue(mockWoDetail);

      const response = await request(app)
        .get('/api/work-orders/50')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(50);
      expect(response.body.data.wo_number).toBe('WO-261101-001');
    });

    it('WO-API-06: Trả về 404 khi ID phiếu công việc không tồn tại', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 33,
        is_active: true,
        roles: [{ role: { name: 'SA' } }],
      });

      (prisma.workOrder.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/work-orders/99999')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Không tìm thấy phiếu công việc');
    });
  });

  describe('POST /api/work-orders/:id/start-work (Bắt đầu thi công)', () => {
    it('WO-API-07: Bắt đầu thi công thành công khi Work Order ở trạng thái APPROVED', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 33,
        is_active: true,
        roles: [{ role: { name: 'SA' } }],
      });

      const approvedWo = {
        id: 50,
        wo_number: 'WO-261101-001',
        status: 'APPROVED',
        quotations: [{ id: 1, status: 'APPROVED' }],
        services: [{ id: 101, status: 'PENDING', jobs: [] }],
        vehicle: { license_plate: '51F-111.22', make: 'Toyota', model: 'Camry' },
        customer: { full_name: 'Khách A', email: 'khach@example.com' },
        advisor: { full_name: 'Hoàng Cố Vấn' },
      };

      const updatedWo = {
        ...approvedWo,
        status: 'IN_PROGRESS',
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          workOrder: {
            findUnique: vi.fn().mockResolvedValue(approvedWo),
            update: vi.fn().mockResolvedValue(updatedWo),
          },
          woService: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          job: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/work-orders/50/start-work')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IN_PROGRESS');
      expect(response.body.message).toContain('bắt đầu thi công');
    });

    it('WO-API-08: Chặn bắt đầu thi công khi Work Order chưa được duyệt báo giá (DRAFT)', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 33,
        is_active: true,
        roles: [{ role: { name: 'SA' } }],
      });

      const draftWo = {
        id: 50,
        status: 'DRAFT',
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          workOrder: {
            findUnique: vi.fn().mockResolvedValue(draftWo),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/work-orders/50/start-work')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('chưa được phê duyệt báo giá');
    });
  });

  describe('GET /api/work-orders/my-tracking (UC-15: Khách hàng theo dõi tiến độ)', () => {
    it('WO-API-09: Khách hàng tra cứu danh sách tiến độ sửa chữa của mình thành công', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 88,
        is_active: true,
        roles: [{ role: { name: 'CUSTOMER' } }],
      });

      const mockTrackingData = [
        {
          id: 50,
          woNumber: 'WO-261101-001',
          status: 'IN_PROGRESS',
          vehicle: { licensePlate: '51F-111.22' },
        },
      ];

      (prisma.workOrder.findMany as any).mockResolvedValue([
        {
          id: 50,
          wo_number: 'WO-261101-001',
          status: 'IN_PROGRESS',
          customer_id: 88,
          created_at: new Date(),
          updated_at: new Date(),
          vehicle: { id: 2, license_plate: '51F-111.22', make: 'Toyota', model: 'Camry', year: 2022, color: 'Trắng', vehicle_size: 'MEDIUM' },
          advisor: { id: 33, full_name: 'Hoàng Cố Vấn', phone: '0908889999' },
          check_in: null,
          services: [],
          inspections: [],
          quotations: [],
        },
      ]);

      const response = await request(app)
        .get('/api/work-orders/my-tracking')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Lấy danh sách tiến độ');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('WO-API-10: Chặn nhân viên (SA) truy cập endpoint /my-tracking của khách hàng', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 33,
        is_active: true,
        roles: [{ role: { name: 'SA' } }],
      });

      const response = await request(app)
        .get('/api/work-orders/my-tracking')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });
});
