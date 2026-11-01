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
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      intakeRecord: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      intakeService: {
        createMany: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe('Integration API - Vehicle Intake Management (SPEC-INTAKE / UC-21)', () => {
  const staffToken = generateToken({
    id: 15,
    email: 'receptionist@carservice.vn',
    fullName: 'Nguyễn Lễ Tân',
    roles: ['DESK STAFF'],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock auth user active with DESK STAFF
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 15,
      is_active: true,
      roles: [{ role: { name: 'DESK STAFF' } }],
    });
  });

  describe('POST /api/intake (Tạo phiếu tiếp nhận xe)', () => {
    it('INT-API-01: Tạo phiếu Walk-in thành công cho xe và khách có sẵn', async () => {
      const mockCreatedRecord = {
        id: 101,
        customer_id: 1,
        vehicle_id: 2,
        intake_type: 'WALK_IN',
        status: 'QUEUED',
        arrived_at: new Date('2026-11-01T08:30:00Z'),
        created_by_id: 15,
        customer: { id: 1, full_name: 'Trần Văn Nam', phone: '0912345678' },
        vehicle: { id: 2, license_plate: '51F-111.22', make: 'Toyota', model: 'Vios' },
      };

      // Mock transaction implementation
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          user: {
            findUnique: vi.fn().mockResolvedValue({ id: 1, full_name: 'Trần Văn Nam' }),
          },
          vehicle: {
            findUnique: vi.fn().mockResolvedValue({ id: 2, customer_id: 1, license_plate: '51F-111.22' }),
          },
          intakeRecord: {
            findFirst: vi.fn().mockResolvedValue(null), // Chưa có xe trong hàng đợi
            create: vi.fn().mockResolvedValue(mockCreatedRecord),
          },
          intakeService: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customerId: 1,
          vehicleId: 2,
          intakeType: 'WALK_IN',
          arrivedAt: '2026-11-01T08:30:00Z',
          serviceIds: [10],
          notes: 'Khách đến thay dầu',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.code).toBe(201);
      expect(response.body.data.id).toBe(101);
      expect(response.body.data.status).toBe('QUEUED');
    });

    it('INT-API-02: Tạo phiếu Tow-in thành công với thông tin đơn vị cứu hộ', async () => {
      const mockTowRecord = {
        id: 102,
        customer_id: 1,
        vehicle_id: 2,
        intake_type: 'TOW_IN',
        status: 'QUEUED',
        tow_company: 'Cứu hộ Giao thông Sài Gòn',
        arrived_at: new Date('2026-11-01T09:00:00Z'),
        created_by_id: 15,
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          user: {
            findUnique: vi.fn().mockResolvedValue({ id: 1, full_name: 'Trần Văn Nam' }),
          },
          vehicle: {
            findUnique: vi.fn().mockResolvedValue({ id: 2, customer_id: 1, license_plate: '51F-111.22' }),
          },
          intakeRecord: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockTowRecord),
          },
          intakeService: {
            createMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customerId: 1,
          vehicleId: 2,
          intakeType: 'TOW_IN',
          towCompany: 'Cứu hộ Giao thông Sài Gòn',
          arrivedAt: '2026-11-01T09:00:00Z',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.intake_type).toBe('TOW_IN');
      expect(response.body.data.tow_company).toBe('Cứu hộ Giao thông Sài Gòn');
    });

    it('INT-API-03: Báo lỗi 400 khi tiếp nhận Tow-in mà không điền đơn vị cứu hộ', async () => {
      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customerId: 1,
          vehicleId: 2,
          intakeType: 'TOW_IN',
          // Thiếu towCompany
          arrivedAt: '2026-11-01T09:00:00Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.towCompany).toContain('đơn vị bàn giao');
    });

    it('INT-API-04: Chặn tạo trùng tiếp nhận khi xe đã có trong hàng đợi QUEUED', async () => {
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          user: {
            findUnique: vi.fn().mockResolvedValue({ id: 1, full_name: 'Trần Văn Nam' }),
          },
          vehicle: {
            findUnique: vi.fn().mockResolvedValue({ id: 2, customer_id: 1, license_plate: '51F-111.22' }),
          },
          intakeRecord: {
            findFirst: vi.fn().mockResolvedValue({ id: 99, status: 'QUEUED' }), // Đã có xe trong queue
          },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customerId: 1,
          vehicleId: 2,
          intakeType: 'WALK_IN',
          arrivedAt: '2026-11-01T09:00:00Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Xe này đang trong hàng đợi tiếp nhận');
    });

    it('INT-API-05: Báo lỗi 400 khi thiếu thời điểm đến (arrivedAt)', async () => {
      const response = await request(app)
        .post('/api/intake')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customerId: 1,
          vehicleId: 2,
          intakeType: 'WALK_IN',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.arrivedAt).toBeDefined();
    });
  });

  describe('GET /api/intake/:id (Lấy chi tiết phiếu tiếp nhận)', () => {
    it('INT-API-06: Lấy chi tiết phiếu tiếp nhận thành công', async () => {
      const mockRecord = {
        id: 55,
        intake_type: 'WALK_IN',
        status: 'QUEUED',
        arrived_at: new Date('2026-11-01T08:00:00Z'),
        customer: { id: 1, full_name: 'Lê Văn C', phone: '0988776655' },
        vehicle: { id: 2, license_plate: '51F-555.66' },
      };

      (prisma.intakeRecord.findUnique as any).mockResolvedValue(mockRecord);

      const response = await request(app)
        .get('/api/intake/55')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(55);
      expect(response.body.data.vehicle.license_plate).toBe('51F-555.66');
    });

    it('INT-API-07: Trả về 404 khi ID phiếu tiếp nhận không tồn tại', async () => {
      (prisma.intakeRecord.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/intake/99999')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Không tìm thấy phiếu tiếp nhận');
    });
  });

  describe('PATCH /api/intake/:id/cancel (Hủy phiếu tiếp nhận)', () => {
    it('INT-API-08: Hủy phiếu tiếp nhận thành công khi đang ở trạng thái QUEUED', async () => {
      (prisma.intakeRecord.findUnique as any).mockResolvedValue({
        id: 70,
        status: 'QUEUED',
      });
      (prisma.intakeRecord.update as any).mockResolvedValue({
        id: 70,
        status: 'CANCELLED',
      });

      const response = await request(app)
        .patch('/api/intake/70/cancel')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('INT-API-09: Chặn hủy phiếu tiếp nhận đã chuyển đổi thành Work Order (CONVERTED)', async () => {
      (prisma.intakeRecord.findUnique as any).mockResolvedValue({
        id: 70,
        status: 'CONVERTED',
      });

      const response = await request(app)
        .patch('/api/intake/70/cancel')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Chỉ có thể hủy phiếu đang ở trạng thái QUEUED');
    });
  });
});
