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
        count: vi.fn(),
        groupBy: vi.fn(),
        findMany: vi.fn(),
      },
      userRole: {
        groupBy: vi.fn(),
      },
      role: {
        findMany: vi.fn(),
      },
      employee: {
        findUnique: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      service: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      serviceCategory: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      jobType: {
        count: vi.fn(),
      },
      systemCatalog: {
        count: vi.fn(),
      },
      workOrder: {
        count: vi.fn(),
        findMany: vi.fn(),
        groupBy: vi.fn(),
      },
      job: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      invoice: {
        aggregate: vi.fn(),
        findMany: vi.fn(),
      },
      quotation: {
        count: vi.fn(),
      },
      appointment: {
        count: vi.fn(),
      },
      inventoryItem: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

describe('Integration API - Multi-Portal Dashboard Engine (/api/dashboard/:portal)', () => {
  const adminToken = generateToken({
    id: 1,
    email: 'admin@carservice.vn',
    fullName: 'Quản Trị Viên',
    roles: ['ADMIN'],
  });

  const managerToken = generateToken({
    id: 2,
    email: 'manager@carservice.vn',
    fullName: 'Giám Đốc Dịch Vụ',
    roles: ['MANAGER'],
  });

  const saToken = generateToken({
    id: 3,
    email: 'advisor@carservice.vn',
    fullName: 'Cố Vấn Dịch Vụ',
    roles: ['SERVICE ADVISOR'],
  });

  const staffToken = generateToken({
    id: 4,
    email: 'tech@carservice.vn',
    fullName: 'Kỹ Thuật Viên',
    roles: ['TECHNICIAN'],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/dashboard/admin', () => {
    it('DASH-01: Admin lấy dữ liệu dashboard thành công với đủ KPI, biểu đồ và audit logs', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 1,
        is_active: true,
        roles: [{ role: { name: 'ADMIN' } }],
      });

      (prisma.user.count as any).mockResolvedValueOnce(50).mockResolvedValueOnce(45);
      (prisma.employee.count as any).mockResolvedValue(20);
      (prisma.service.count as any).mockResolvedValue(35);
      (prisma.serviceCategory.count as any).mockResolvedValue(8);
      (prisma.jobType.count as any).mockResolvedValue(12);

      (prisma.userRole.groupBy as any).mockResolvedValue([
        { role_id: 1, _count: { user_id: 5 } },
        { role_id: 2, _count: { user_id: 15 } },
      ]);
      (prisma.role.findMany as any).mockResolvedValue([
        { id: 1, name: 'ADMIN' },
        { id: 2, name: 'TECHNICIAN' },
      ]);
      (prisma.user.findMany as any).mockResolvedValue([
        { id: 10, full_name: 'Nguyễn Văn Mới', email: 'moi@test.vn', is_active: true, created_at: new Date() },
      ]);

      const res = await request(app)
        .get('/api/dashboard/admin?period=7days')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.portal).toBe('admin');
      expect(res.body.data.kpis).toBeDefined();
      expect(Array.isArray(res.body.data.kpis)).toBe(true);
      expect(res.body.data.charts).toBeDefined();
      expect(res.body.data.charts.rbacDistribution).toBeDefined();
      expect(res.body.data.actionableList).toBeDefined();
    });

    it.each(['today', '30days', 'this_month'] as const)(
      'ADM-DASH-API-01: Admin lấy dữ liệu dashboard với period=%s trả 200 OK cùng KPIs, rbacDistribution và actionableList',
      async (period) => {
        (prisma.user.findUnique as any).mockResolvedValue({
          id: 1,
          is_active: true,
          roles: [{ role: { name: 'ADMIN' } }],
        });

        (prisma.user.count as any).mockResolvedValue(40);
        (prisma.employee.count as any).mockResolvedValue(15);
        (prisma.service.count as any).mockResolvedValue(28);
        (prisma.serviceCategory.count as any).mockResolvedValue(6);
        (prisma.jobType.count as any).mockResolvedValue(10);

        (prisma.userRole.groupBy as any).mockResolvedValue([
          { role_id: 1, _count: { user_id: 2 } },
          { role_id: 2, _count: { user_id: 12 } },
        ]);
        (prisma.role.findMany as any).mockResolvedValue([
          { id: 1, name: 'ADMIN' },
          { id: 2, name: 'TECHNICIAN' },
        ]);
        (prisma.user.findMany as any).mockResolvedValue([
          {
            id: 21,
            full_name: 'Trần Bảo An',
            email: 'an.tran@carservice.vn',
            is_active: true,
            created_at: new Date('2026-11-12T08:00:00Z'),
          },
        ]);

        const res = await request(app)
          .get(`/api/dashboard/admin?period=${period}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.portal).toBe('admin');
        expect(res.body.data.period.key).toBe(period);
        expect(res.body.data.kpis).toHaveLength(4);
        expect(res.body.data.charts.rbacDistribution).toEqual([
          { role: 'ADMIN', label: 'Quản trị viên', count: 2 },
          { role: 'TECHNICIAN', label: 'Kỹ thuật viên', count: 12 },
        ]);
        expect(res.body.data.actionableList).toHaveLength(1);
        expect(res.body.data.actionableList[0]).toMatchObject({
          id: 21,
          title: 'Trần Bảo An',
          subtitle: 'an.tran@carservice.vn',
          status: 'ACTIVE',
        });
      }
    );
  });

  describe('GET /api/dashboard/workshop', () => {
    it('ADM-DASH-API-02: Admin có quyền truy cập chéo GET /api/dashboard/workshop trả 200 OK', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 1,
        is_active: true,
        roles: [{ role: { name: 'ADMIN' } }],
      });

      (prisma.workOrder.findMany as any).mockResolvedValue([
        {
          id: 501,
          wo_number: 'WO-2026-501',
          status: 'IN_PROGRESS',
          created_at: new Date('2026-11-12T09:00:00Z'),
          customer: { id: 10, full_name: 'Nguyễn Minh Quân' },
          vehicle: { license_plate: '51G-777.66', make: 'Hyundai', model: 'SantaFe', year: 2023 },
          advisor: { id: 3, full_name: 'Trần Cố Vấn' },
          services: [
            {
              id: 1,
              name: 'Bảo dưỡng phanh',
              status: 'IN_PROGRESS',
              service: { name: 'Bảo dưỡng phanh' },
              jobs: [
                {
                  id: 11,
                  name: 'Thay má phanh trước',
                  status: 'IN_PROGRESS',
                  started_at: new Date(),
                  estimated_hours: 1.5,
                },
              ],
            },
          ],
        },
      ]);
      (prisma.workOrder.count as any)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);
      (prisma.job.count as any).mockResolvedValue(0);

      const res = await request(app)
        .get('/api/dashboard/workshop')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toEqual({
        totalActive: 6,
        pendingApproval: 2,
        billingRequested: 1,
        overdueJobs: 0,
      });
      expect(res.body.data.workOrders).toHaveLength(1);
      expect(res.body.data.workOrders[0]).toMatchObject({
        id: 501,
        woNumber: 'WO-2026-501',
        customerName: 'Nguyễn Minh Quân',
        vehiclePlate: '51G-777.66',
      });
    });
  });

  describe('GET /api/dashboard/manager', () => {
    it('DASH-02: Manager lấy dữ liệu dashboard thành công gồm doanh thu, thông lượng xe và SLA', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 2,
        is_active: true,
        roles: [{ role: { name: 'MANAGER' } }],
      });

      (prisma.invoice.aggregate as any).mockResolvedValue({
        _sum: { total_amount: 150000000 },
      });
      (prisma.workOrder.count as any).mockResolvedValue(18);
      (prisma.job.count as any).mockResolvedValue(2);
      (prisma.invoice.findMany as any).mockResolvedValue([
        { issued_at: new Date('2026-11-10T10:00:00Z'), total_amount: 25000000 },
        { issued_at: new Date('2026-11-11T10:00:00Z'), total_amount: 35000000 },
      ]);
      (prisma.workOrder.groupBy as any).mockResolvedValue([
        { status: 'IN_PROGRESS', _count: { id: 10 } },
        { status: 'APPROVED', _count: { id: 8 } },
      ]);
      (prisma.workOrder.findMany as any).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/dashboard/manager?period=7days')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.portal).toBe('manager');
      expect(res.body.data.kpis.length).toBeGreaterThan(0);
      expect(res.body.data.charts.trend).toBeDefined();
      expect(res.body.data.charts.distribution).toBeDefined();
    });
  });

  describe('GET /api/dashboard/sa', () => {
    it('DASH-03: Service Advisor lấy dữ liệu theo scope cá nhân (my) và toàn xưởng (workshop)', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 3,
        is_active: true,
        roles: [{ role: { name: 'SERVICE ADVISOR' } }],
      });

      (prisma.quotation.count as any).mockResolvedValue(5);
      (prisma.workOrder.count as any).mockResolvedValue(12);
      (prisma.appointment.count as any).mockResolvedValue(4);
      (prisma.workOrder.findMany as any).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/dashboard/sa?scope=my')
        .set('Authorization', `Bearer ${saToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.portal).toBe('sa');
      expect(res.body.data.kpis).toBeDefined();
    });
  });

  describe('GET /api/dashboard/staff', () => {
    it('DASH-04: Staff / Kỹ thuật viên lấy dashboard công việc và tiếp nhận', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 4,
        is_active: true,
        roles: [{ role: { name: 'TECHNICIAN' } }],
      });
      (prisma.employee.findUnique as any).mockResolvedValue({ id: 101, user_id: 4 });

      (prisma.appointment.count as any).mockResolvedValue(7);
      (prisma.job.count as any).mockResolvedValue(3);
      (prisma.inventoryItem.count as any).mockResolvedValue(1);
      (prisma.job.findMany as any).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/dashboard/staff?scope=my')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.portal).toBe('staff');
    });
  });

  describe('Validation & Role Guards', () => {
    it('DASH-05: Trả về 400 Bad Request nếu param :portal không hợp lệ', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 1,
        is_active: true,
        roles: [{ role: { name: 'ADMIN' } }],
      });

      const res = await request(app)
        .get('/api/dashboard/invalid_portal')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('DASH-06: Trả về 403 Forbidden nếu user không có quyền truy cập portal tương ứng', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 4,
        is_active: true,
        roles: [{ role: { name: 'TECHNICIAN' } }],
      });

      // Technician cố tình gọi vào admin dashboard
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
