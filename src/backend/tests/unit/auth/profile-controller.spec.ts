import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  employee: {
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

const notificationMock = vi.hoisted(() => ({
  sendInApp: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/services/notification.service', () => ({
  notificationService: notificationMock,
}));

vi.mock('../../../src/utils/redis.util', () => ({
  getCache: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
  deleteCache: vi.fn().mockResolvedValue(undefined),
  deleteCacheByPrefix: vi.fn().mockResolvedValue(undefined),
  mgetCache: vi.fn().mockResolvedValue([]),
}));

import { authController } from '../../../src/controllers/auth.controller';
import { authService } from '../../../src/services/auth.service';

function createMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((payload: any) => {
    res.body = payload;
    return res;
  });
  return res;
}

describe('AuthController — Internal Profile & Change Password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
  });

  describe('getMe', () => {
    it('returns profile with linked employee info and skills', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        full_name: 'Nguyễn Văn An',
        phone: '0901234567',
        email: 'advisor@autocare.vn',
        address: '123 Lê Lợi, Q.1',
        is_active: true,
        created_at: new Date('2026-01-10T08:00:00Z'),
        updated_at: new Date('2026-11-18T10:00:00Z'),
        roles: [{ role: { name: 'ADVISOR' } }],
        employee: {
          id: 5,
          position: 'ADVISOR',
          is_active: true,
          created_at: new Date('2026-01-10T08:00:00Z'),
          skills: [{ skill: { id: 1, name: 'Chẩn đoán OBD-II' } }],
        },
      });

      const req: any = { user: { id: 2, roles: ['ADVISOR'] } };
      const res = createMockRes();

      await authController.getMe(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.fullName).toBe('Nguyễn Văn An');
      expect(res.body.data.employee).toEqual({
        id: 5,
        position: 'ADVISOR',
        isActive: true,
        createdAt: new Date('2026-01-10T08:00:00Z'),
        skills: ['Chẩn đoán OBD-II'],
      });
    });
  });

  describe('updateMe', () => {
    it('rejects email modification for internal accounts with 403', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        full_name: 'Nguyễn Văn An',
        phone: '0901234567',
        email: 'advisor@autocare.vn',
        address: 'Q.1',
        is_active: true,
        roles: [{ role: { name: 'ADVISOR' } }],
        employee: null,
      });

      const req: any = {
        user: { id: 2, roles: ['ADVISOR'] },
        body: { fullName: 'Nguyễn Văn An', email: 'hacked@autocare.vn' },
      };
      const res = createMockRes();

      await authController.updateMe(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('updates profile and syncs linked employee.full_name inside transaction', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({
          id: 2,
          full_name: 'Nguyễn Văn An',
          phone: '0901234567',
          email: 'advisor@autocare.vn',
          address: 'Q.1',
          is_active: true,
          roles: [{ role: { name: 'ADVISOR' } }],
          employee: {
            id: 5,
            position: 'ADVISOR',
            is_active: true,
            created_at: new Date('2026-01-10T08:00:00Z'),
            skills: [],
          },
        })
        .mockResolvedValueOnce(null); // unique phone check

      prismaMock.user.update.mockResolvedValue({
        id: 2,
        full_name: 'Nguyễn Văn Bình',
        phone: '0912345678',
        email: 'advisor@autocare.vn',
        address: '456 Nguyễn Huệ, Q.1',
        is_active: true,
        created_at: new Date('2026-01-10T08:00:00Z'),
        updated_at: new Date('2026-11-19T08:00:00Z'),
      });
      prismaMock.employee.update.mockResolvedValue({ id: 5, full_name: 'Nguyễn Văn Bình' });

      const req: any = {
        user: { id: 2, roles: ['ADVISOR'] },
        body: {
          fullName: 'Nguyễn Văn Bình',
          phone: '0912345678',
          address: '456 Nguyễn Huệ, Q.1',
        },
      };
      const res = createMockRes();

      await authController.updateMe(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.fullName).toBe('Nguyễn Văn Bình');
      expect(prismaMock.employee.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { full_name: 'Nguyễn Văn Bình' },
      });
      expect(notificationMock.sendInApp).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2,
          type: 'SYSTEM_ALERT',
          entityType: 'USER',
          entityId: 2,
        })
      );
    });

    it('rejects changing full name to one with digits or special characters', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 2,
        full_name: 'Nguyễn Văn An',
        phone: '0901234567',
        email: 'staff@autocare.vn',
        address: null,
        is_active: true,
        roles: [{ role: { name: 'STAFF' } }],
        employee: null,
      });

      const req: any = {
        user: { id: 2, roles: ['STAFF'] },
        body: { fullName: 'Nguyễn Văn An 99' },
      };
      const res = createMockRes();

      await authController.updateMe(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe(
        'Vui lòng nhập họ và tên hợp lệ, không nhập số hoặc ký tự đặc biệt.'
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('allows updating other fields when an existing legacy name is unchanged', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({
          id: 7,
          full_name: 'Nhân Viên 7',
          phone: '0811111107',
          email: 'staff2@carservice.com',
          address: null,
          is_active: true,
          roles: [{ role: { name: 'TECHNICIAN' } }],
          employee: null,
        })
        .mockResolvedValueOnce(null);
      prismaMock.user.update.mockResolvedValue({
        id: 7,
        full_name: 'Nhân Viên 7',
        phone: '0912345670',
        email: 'staff2@carservice.com',
        address: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const req: any = {
        user: { id: 7, roles: ['TECHNICIAN'] },
        body: { fullName: 'Nhân Viên 7', phone: '0912345670' },
      };
      const res = createMockRes();

      await authController.updateMe(req, res);

      expect(res.statusCode).toBe(200);
      expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    });

    it('rejects duplicate phone number with 400', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({
          id: 2,
          full_name: 'Nguyễn Văn An',
          phone: '0901234567',
          email: 'advisor@autocare.vn',
          address: null,
          is_active: true,
          roles: [{ role: { name: 'STAFF' } }],
          employee: null,
        })
        .mockResolvedValueOnce({ id: 99, phone: '0988888888' });

      const req: any = {
        user: { id: 2, roles: ['STAFF'] },
        body: { fullName: 'Nguyễn Văn An', phone: '0988888888' },
      };
      const res = createMockRes();

      await authController.updateMe(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Không thể cập nhật thông tin liên hệ này');
    });
  });

  describe('changePassword', () => {
    it('rejects wrong current password with 400', async () => {
      const hash = await bcrypt.hash('OldPass123', 4);
      prismaMock.user.findUnique.mockResolvedValue({ id: 2, password_hash: hash });

      const req: any = {
        user: { id: 2, roles: ['ADMIN'] },
        body: {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        },
      };
      const res = createMockRes();

      await authController.changePassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Mật khẩu hiện tại không chính xác');
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('rejects when newPassword equals currentPassword', async () => {
      const req: any = {
        user: { id: 2, roles: ['ADMIN'] },
        body: {
          currentPassword: 'SamePassword123',
          newPassword: 'SamePassword123',
          confirmPassword: 'SamePassword123',
        },
      };
      const res = createMockRes();

      await authController.changePassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('không được trùng');
    });

    it('updates password hash when valid', async () => {
      const hash = await bcrypt.hash('OldPass123', 4);
      prismaMock.user.findUnique.mockResolvedValue({ id: 2, password_hash: hash });
      prismaMock.user.update.mockResolvedValue({ id: 2 });
      const revokeSpy = vi.spyOn(authService, 'revokeAllUserTokens').mockResolvedValue(undefined);

      const req: any = {
        user: { id: 2, roles: ['MANAGER'] },
        body: {
          currentPassword: 'OldPass123',
          newPassword: 'NewStrongPass123',
          confirmPassword: 'NewStrongPass123',
        },
      };
      const res = createMockRes();

      await authController.changePassword(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
      const updatedHash = prismaMock.user.update.mock.calls[0][0].data.password_hash;
      expect(await bcrypt.compare('NewStrongPass123', updatedHash)).toBe(true);
      expect(revokeSpy).toHaveBeenCalledWith(2);
      revokeSpy.mockRestore();
    });
  });
});
