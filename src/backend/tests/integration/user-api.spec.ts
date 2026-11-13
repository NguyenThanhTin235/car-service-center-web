import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { setCache, deleteCache } from '../../src/utils/redis.util';

vi.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    userRole: {
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../src/utils/redis.util', () => ({
  setCache: vi.fn(),
  deleteCache: vi.fn(),
  getCache: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password_10'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe('Integration API - IAM Accounts (/api/users)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-USR-API-01: GET /api/users', () => {
    it('trả về 200 kèm danh sách tài khoản, phân trang và lọc theo role, status, search', async () => {
      (prisma.user.count as any).mockResolvedValue(1);
      (prisma.user.findMany as any).mockResolvedValue([
        {
          id: 2,
          email: 'advisor@autocare.vn',
          full_name: 'Trần Cố Vấn',
          phone: '0902000888',
          address: 'TP.HCM',
          is_active: true,
          roles: [{ role: { name: 'SA' } }],
          employee: { id: 2, position: 'ADVISOR' },
          created_at: new Date('2026-11-01T00:00:00Z'),
        },
      ]);

      const res = await request(app).get(
        '/api/users?search=Trần&role=ADVISOR&status=active&page=1&limit=10'
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        id: 2,
        email: 'advisor@autocare.vn',
        fullName: 'Trần Cố Vấn',
        isActive: true,
        roles: ['SA'],
      });
      expect(res.body.pagination).toEqual({
        totalRecords: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
      });
    });

    it('trả về 500 khi DB gặp lỗi', async () => {
      (prisma.user.count as any).mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app).get('/api/users');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        status: 'error',
        message: 'DB connection lost',
      });
    });
  });

  describe('ADM-USR-API-02: GET /api/users/:id', () => {
    it('trả về 200 kèm roles và employee.skills', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 10,
        email: 'tech@autocare.vn',
        full_name: 'Lê Kỹ Thuật',
        phone: '0903334444',
        address: 'Quận 1',
        is_active: true,
        roles: [{ role: { name: 'TECHNICIAN' } }],
        employee: {
          id: 5,
          position: 'TECHNICIAN',
          is_active: true,
          skills: [{ skill: { id: 1, name: 'Gầm & Phanh' } }],
        },
        created_at: new Date('2026-11-01T00:00:00Z'),
      });

      const res = await request(app).get('/api/users/10');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toMatchObject({
        id: 10,
        roles: ['TECHNICIAN'],
        employee: {
          id: 5,
          position: 'TECHNICIAN',
          skills: [{ id: 1, name: 'Gầm & Phanh' }],
        },
      });
    });

    it('trả về 404 khi không tìm thấy tài khoản', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const res = await request(app).get('/api/users/9999');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy tài khoản.',
      });
    });
  });

  describe('ADM-USR-API-03: POST /api/users', () => {
    it('trả về 201 khi tạo tài khoản hợp lệ', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.role.findUnique as any).mockResolvedValue({ id: 3, name: 'ADVISOR' });
      (prisma.user.create as any).mockResolvedValue({
        id: 25,
        email: 'newstaff@autocare.vn',
        full_name: 'Nguyễn Nhân Viên',
        phone: '0909555666',
        is_active: true,
        roles: [{ role: { name: 'ADVISOR' } }],
        created_at: new Date('2026-11-10T00:00:00Z'),
      });

      const res = await request(app).post('/api/users').send({
        email: 'newstaff@autocare.vn',
        password: 'password123',
        fullName: 'Nguyễn Nhân Viên',
        phone: '0909555666',
        role: 'ADVISOR',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Tạo tài khoản thành công');
      expect(res.body.data).toMatchObject({
        id: 25,
        email: 'newstaff@autocare.vn',
        roles: ['ADVISOR'],
      });
    });

    it('trả về 400 khi trùng email hoặc role không tồn tại', async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 1, email: 'dup@autocare.vn' });

      const resDup = await request(app).post('/api/users').send({
        email: 'dup@autocare.vn',
        password: 'password123',
        fullName: 'Dup User',
        role: 'ADVISOR',
      });

      expect(resDup.status).toBe(400);
      expect(resDup.body).toEqual({
        status: 'error',
        message: 'Email đã tồn tại trong hệ thống.',
      });

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.role.findUnique as any).mockResolvedValue(null);

      const resRole = await request(app).post('/api/users').send({
        email: 'ok@autocare.vn',
        password: 'password123',
        fullName: 'Role Invalid',
        role: 'SUPER_ALIEN',
      });

      expect(resRole.status).toBe(400);
      expect(resRole.body.status).toBe('error');
      expect(resRole.body.message).toContain('không hợp lệ');
    });
  });

  describe('ADM-USR-API-04: PUT /api/users/:id', () => {
    it('trả về 200 khi cập nhật thành công', async () => {
      (prisma.user.findUnique as any)
        .mockResolvedValueOnce({ id: 10, phone: '0901111111' })
        .mockResolvedValueOnce(null);

      const txMock = {
        user: {
          update: vi.fn().mockResolvedValue({
            id: 10,
            email: 'tech@autocare.vn',
            full_name: 'Lê Kỹ Thuật Updated',
            phone: '0902222222',
            is_active: true,
            roles: [{ role: { name: 'MANAGER' } }],
          }),
        },
        role: {
          findUnique: vi.fn().mockResolvedValue({ id: 2, name: 'MANAGER' }),
        },
        userRole: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ user_id: 10, role_id: 2 }),
        },
      };
      (prisma.$transaction as any).mockImplementation(async (cb: any) => cb(txMock));

      const res = await request(app).put('/api/users/10').send({
        fullName: 'Lê Kỹ Thuật Updated',
        phone: '0902222222',
        role: 'MANAGER',
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.fullName).toBe('Lê Kỹ Thuật Updated');
    });

    it('trả về 400 khi trùng SĐT và 404 khi không tìm thấy', async () => {
      (prisma.user.findUnique as any)
        .mockResolvedValueOnce({ id: 10, phone: '0901111111' })
        .mockResolvedValueOnce({ id: 11, phone: '0909999999' });

      const resDup = await request(app).put('/api/users/10').send({
        phone: '0909999999',
      });
      expect(resDup.status).toBe(400);
      expect(resDup.body).toEqual({
        status: 'error',
        message: 'Số điện thoại đã tồn tại.',
      });

      (prisma.user.findUnique as any).mockResolvedValueOnce(null);
      const resNotFound = await request(app).put('/api/users/999').send({
        fullName: 'Missing',
      });
      expect(resNotFound.status).toBe(404);
      expect(resNotFound.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy tài khoản.',
      });
    });
  });

  describe('ADM-USR-API-05: DELETE /api/users/:id', () => {
    it('trả về 204 (empty body) khi vô hiệu hóa thành công', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 12,
        is_active: true,
        roles: [{ role: { name: 'TECHNICIAN' } }],
      });
      (prisma.user.update as any).mockResolvedValue({ id: 12, is_active: false });

      const res = await request(app).delete('/api/users/12');

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
      expect(setCache).toHaveBeenCalledWith('revoked_user:12', 'true', 86400 * 7);
    });

    it('trả về 400 khi khóa ADMIN hoặc tài khoản đã khóa, và 404 khi không tìm thấy', async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        id: 1,
        is_active: true,
        roles: [{ role: { name: 'ADMIN' } }],
      });
      const resAdmin = await request(app).delete('/api/users/1');
      expect(resAdmin.status).toBe(400);
      expect(resAdmin.body.message).toBe('Không thể vô hiệu hóa tài khoản Quản trị viên hệ thống.');

      (prisma.user.findUnique as any).mockResolvedValueOnce({
        id: 13,
        is_active: false,
        roles: [{ role: { name: 'ADVISOR' } }],
      });
      const resAlready = await request(app).delete('/api/users/13');
      expect(resAlready.status).toBe(400);

      (prisma.user.findUnique as any).mockResolvedValueOnce(null);
      const resNotFound = await request(app).delete('/api/users/999');
      expect(resNotFound.status).toBe(404);
    });
  });

  describe('ADM-USR-API-06: PATCH /api/users/:id/reactivate', () => {
    it('trả về 200 khi mở khóa thành công và 404 khi không tìm thấy', async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 12, is_active: false });
      (prisma.user.update as any).mockResolvedValueOnce({ id: 12, is_active: true });

      const resOk = await request(app).patch('/api/users/12/reactivate');
      expect(resOk.status).toBe(200);
      expect(resOk.body).toEqual({
        status: 'success',
        message: 'Khôi phục tài khoản thành công',
      });
      expect(deleteCache).toHaveBeenCalledWith('revoked_user:12');

      (prisma.user.findUnique as any).mockResolvedValueOnce(null);
      const resNotFound = await request(app).patch('/api/users/999/reactivate');
      expect(resNotFound.status).toBe(404);
    });
  });

  describe('ADM-USR-API-07: PATCH /api/users/:id/reset-password', () => {
    it('trả về 200 khi newPassword >= 6 ký tự và 400 ở controller nếu < 6 ký tự', async () => {
      const resShort = await request(app)
        .patch('/api/users/12/reset-password')
        .send({ newPassword: '123' });

      expect(resShort.status).toBe(400);
      expect(resShort.body).toEqual({
        status: 'error',
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      });

      (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 12 });
      (prisma.user.update as any).mockResolvedValueOnce({ id: 12 });

      const resOk = await request(app)
        .patch('/api/users/12/reset-password')
        .send({ newPassword: 'newpassword123' });

      expect(resOk.status).toBe(200);
      expect(resOk.body).toEqual({
        status: 'success',
        message: 'Đặt lại mật khẩu thành công',
      });
    });
  });
});
