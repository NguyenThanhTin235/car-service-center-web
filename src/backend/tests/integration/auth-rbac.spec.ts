import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { generateToken } from '../../src/utils/jwt.util';
import prisma from '../../src/utils/prisma';

// Mock Prisma for hermetic integration testing
vi.mock('../../src/utils/prisma', () => {
  return {
    __esModule: true,
    default: {
      user: {
        findUnique: vi.fn(),
      },
      intakeRecord: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe('Integration API - Authentication & RBAC Authorization (SPEC-AUTH-RBAC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Check Endpoint (Public)', () => {
    it('API-HEALTH-01: GET / trả về 200 và thông điệp server đang hoạt động', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Car Service Center API is running' });
    });
  });

  describe('Authentication Middleware (authenticate)', () => {
    it('API-AUTH-01: GET /api/intake không kèm token -> Trả về 401 Chưa đăng nhập', async () => {
      const response = await request(app).get('/api/intake');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Chưa đăng nhập');
    });

    it('API-AUTH-02: GET /api/intake với Bearer token giả mạo -> Trả về 401 Token không hợp lệ', async () => {
      const response = await request(app)
        .get('/api/intake')
        .set('Authorization', 'Bearer invalid.tampered.token');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Phiên đăng nhập không hợp lệ');
    });

    it('API-AUTH-03: Token hợp lệ nhưng tài khoản đã bị vô hiệu hóa (is_active: false) -> Trả về 401', async () => {
      const token = generateToken({
        id: 99,
        email: 'blocked@carservice.vn',
        fullName: 'Người Dùng Khóa',
        roles: ['SA'],
      });

      // Mock database trả về is_active: false
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 99,
        is_active: false,
        roles: [{ role: { name: 'SA' } }],
      });

      const response = await request(app)
        .get('/api/intake')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('đã bị vô hiệu hóa');
    });
  });

  describe('RBAC Authorization Middleware (authorize)', () => {
    it('API-RBAC-01: Tài khoản vai trò CUSTOMER cố tình truy cập /api/intake -> Trả về 403 Forbidden', async () => {
      const customerToken = generateToken({
        id: 10,
        email: 'customer@gmail.com',
        fullName: 'Nguyễn Văn Khách',
        roles: ['CUSTOMER'],
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 10,
        is_active: true,
        roles: [{ role: { name: 'CUSTOMER' } }],
      });

      const response = await request(app)
        .get('/api/intake')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Bạn không có quyền thực hiện hành động này');
    });

    it('API-RBAC-02: Header x-portal: internal ngăn chặn CUSTOMER truy cập trang quản trị nội bộ', async () => {
      const customerToken = generateToken({
        id: 10,
        email: 'customer@gmail.com',
        fullName: 'Nguyễn Văn Khách',
        roles: ['CUSTOMER'],
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 10,
        is_active: true,
        roles: [{ role: { name: 'CUSTOMER' } }],
      });

      const response = await request(app)
        .get('/api/intake')
        .set('x-portal', 'internal')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('không có quyền truy cập trang quản trị nội bộ');
    });

    it('API-RBAC-03: Vai trò DESK STAFF truy cập /api/intake -> Trả về 200 và danh sách hàng đợi', async () => {
      const deskToken = generateToken({
        id: 20,
        email: 'desk@carservice.vn',
        fullName: 'Trần Thị Lễ Tân',
        roles: ['DESK STAFF'],
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 20,
        is_active: true,
        roles: [{ role: { name: 'DESK STAFF' } }],
      });

      // Mock dữ liệu hàng đợi
      (prisma.intakeRecord.findMany as any).mockResolvedValue([
        {
          id: 1,
          intake_type: 'WALK_IN',
          status: 'QUEUED',
          customer: { full_name: 'Lê Văn An', phone: '0901234567' },
          vehicle: { license_plate: '51F-999.88', make: 'Toyota', model: 'Camry' },
          services: [],
          created_at: new Date(),
        },
      ]);
      (prisma.intakeRecord.count as any).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/intake')
        .set('Authorization', `Bearer ${deskToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].vehicle.license_plate).toBe('51F-999.88');
    });

    it('API-RBAC-04: Vai trò SA (Service Advisor) truy cập /api/intake -> Trả về 200 OK', async () => {
      const saToken = generateToken({
        id: 30,
        email: 'advisor@carservice.vn',
        fullName: 'Phạm Cố Vấn',
        roles: ['SA'],
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 30,
        is_active: true,
        roles: [{ role: { name: 'SA' } }],
      });

      (prisma.intakeRecord.findMany as any).mockResolvedValue([]);
      (prisma.intakeRecord.count as any).mockResolvedValue(0);

      const response = await request(app)
        .get('/api/intake')
        .set('Authorization', `Bearer ${saToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('API-RBAC-05: Vai trò ADMIN truy cập /api/intake -> Trả về 200 OK', async () => {
      const adminToken = generateToken({
        id: 1,
        email: 'admin@carservice.vn',
        fullName: 'Quản Trị Viên',
        roles: ['ADMIN'],
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 1,
        is_active: true,
        roles: [{ role: { name: 'ADMIN' } }],
      });

      (prisma.intakeRecord.findMany as any).mockResolvedValue([]);
      (prisma.intakeRecord.count as any).mockResolvedValue(0);

      const response = await request(app)
        .get('/api/intake')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
