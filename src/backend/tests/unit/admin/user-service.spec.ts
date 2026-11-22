import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { UserService } from '../../../src/services/user.service';
import prisma from '../../../src/utils/prisma';
import { setCache, deleteCache } from '../../../src/utils/redis.util';

vi.mock('../../../src/utils/prisma', () => ({
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

vi.mock('../../../src/utils/redis.util', () => ({
  setCache: vi.fn(),
  deleteCache: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: vi.fn(),
  },
}));

describe('Unit - UserService (IAM Accounts)', () => {
  const userService = new UserService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-USR-UT-01: getUsers & getUserById', () => {
    it('lọc theo search, status (active/true/inactive/false) và chuẩn hóa alias role', async () => {
      (prisma.user.count as any).mockResolvedValue(1);
      (prisma.user.findMany as any).mockResolvedValue([
        {
          id: 10,
          email: 'advisor@carservice.vn',
          full_name: 'Trần Cố Vấn',
          phone: '0901234567',
          address: 'TP.HCM',
          is_active: true,
          roles: [{ role: { name: 'SA' } }],
          employee: { id: 3, position: 'ADVISOR' },
          created_at: new Date('2026-11-01T00:00:00Z'),
        },
      ]);

      const res = await userService.getUsers('Trần', 'SA', 2, 5, 'active');

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          is_active: true,
          roles: {
            some: {
              role: {
                name: {
                  in: expect.arrayContaining(['SA', 'ADVISOR', 'advisor', 'sa', 'Service Advisor']),
                },
              },
            },
          },
          OR: [
            { full_name: { contains: 'Trần' } },
            { phone: { contains: 'Trần' } },
            { email: { contains: 'Trần' } },
          ],
        },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
      expect(res.data).toHaveLength(1);
      expect(res.data[0]).toMatchObject({
        id: 10,
        fullName: 'Trần Cố Vấn',
        roles: ['SA'],
        employee: { id: 3, position: 'ADVISOR' },
      });
      expect(res.pagination).toEqual({
        totalRecords: 1,
        totalPages: 1,
        currentPage: 2,
        limit: 5,
      });
    });

    it.each([
      ['true', true],
      ['inactive', false],
      ['false', false],
    ])('hỗ trợ status="%s" -> is_active=%s', async (statusInput, expectedActive) => {
      (prisma.user.count as any).mockResolvedValue(0);
      (prisma.user.findMany as any).mockResolvedValue([]);

      await userService.getUsers(undefined, undefined, 1, 10, statusInput);

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { is_active: expectedActive },
      });
    });

    it.each([
      ['DESK_STAFF', ['DESK_STAFF', 'FRONT_DESK', 'DESK STAFF']],
      ['TECH', ['TECH', 'TECHNICIAN']],
      ['KY_THUAT_VIEN', ['KY_THUAT_VIEN', 'TECHNICIAN']],
    ])('chuẩn hóa alias role "%s" trong getUsers', async (roleInput, expectedInList) => {
      (prisma.user.count as any).mockResolvedValue(0);
      (prisma.user.findMany as any).mockResolvedValue([]);

      await userService.getUsers(undefined, roleInput, 1, 10);

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          roles: {
            some: {
              role: {
                name: {
                  in: expect.arrayContaining(expectedInList),
                },
              },
            },
          },
        },
      });
    });

    it('getUserById trả về chi tiết kèm employee.skills và ném lỗi khi không tìm thấy', async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        id: 7,
        email: 'tech@carservice.vn',
        full_name: 'KTV Minh',
        phone: '0908889999',
        address: 'Quận 7',
        is_active: true,
        roles: [{ role: { name: 'TECHNICIAN' } }],
        employee: {
          id: 12,
          position: 'TECHNICIAN',
          is_active: true,
          skills: [{ skill: { id: 1, name: 'Điện ô tô' } }],
        },
        created_at: new Date('2026-11-01T00:00:00Z'),
      });

      const detail = await userService.getUserById(7);
      expect(detail.employee?.skills).toEqual([{ id: 1, name: 'Điện ô tô' }]);

      (prisma.user.findUnique as any).mockResolvedValueOnce(null);
      await expect(userService.getUserById(999)).rejects.toThrow('Không tìm thấy tài khoản.');
    });
  });

  describe('ADM-USR-UT-02: createUser', () => {
    it('kiểm tra trùng email, trùng SĐT, resolve alias role và hash mật khẩu bcrypt 10 rounds', async () => {
      // 1. Trùng email
      (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 1, email: 'dup@test.vn' });
      await expect(
        userService.createUser({
          email: 'dup@test.vn',
          password: 'password123',
          fullName: 'User A',
          role: 'ADVISOR',
        })
      ).rejects.toThrow('Email đã tồn tại trong hệ thống.');

      // 2. Trùng phone
      (prisma.user.findUnique as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, phone: '0909111222' });
      await expect(
        userService.createUser({
          email: 'new@test.vn',
          password: 'password123',
          fullName: 'User B',
          phone: '0909111222',
          role: 'ADVISOR',
        })
      ).rejects.toThrow('Số điện thoại đã tồn tại trong hệ thống.');

      // 3. Role không hợp lệ
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.role.findUnique as any).mockResolvedValue(null);
      await expect(
        userService.createUser({
          email: 'new2@test.vn',
          password: 'password123',
          fullName: 'User C',
          role: 'UNKNOWN_ROLE',
        })
      ).rejects.toThrow('Vai trò "UNKNOWN_ROLE" không hợp lệ.');

      // 4. Tạo thành công với alias ADVISOR -> SA
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.role.findUnique as any)
        .mockResolvedValueOnce(null) // exact 'ADVISOR' not found
        .mockResolvedValueOnce({ id: 4, name: 'SA' }); // candidate 'SA' found
      (bcrypt.hash as any).mockResolvedValue('hashed_pw_10');
      (prisma.user.create as any).mockResolvedValue({
        id: 55,
        email: 'sa@carservice.vn',
        full_name: 'Nguyễn Cố Vấn',
        phone: '0911222333',
        is_active: true,
        roles: [{ role: { name: 'SA' } }],
        created_at: new Date('2026-11-10T00:00:00Z'),
      });

      const created = await userService.createUser({
        email: 'sa@carservice.vn',
        password: 'password123',
        fullName: 'Nguyễn Cố Vấn',
        phone: '0911222333',
        address: 'TP.HCM',
        role: 'ADVISOR',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'sa@carservice.vn',
            password_hash: 'hashed_pw_10',
            roles: { create: { role: { connect: { id: 4 } } } },
          }),
        })
      );
      expect(created).toMatchObject({
        id: 55,
        email: 'sa@carservice.vn',
        roles: ['SA'],
      });
    });
  });

  describe('ADM-USR-UT-03: updateUser', () => {
    it('kiểm tra trùng SĐT khi thay đổi; khi đổi role xóa UserRole khác CUSTOMER và gán role mới trong $transaction', async () => {
      // 1. User không tồn tại
      (prisma.user.findUnique as any).mockResolvedValueOnce(null);
      await expect(userService.updateUser(99, { fullName: 'X' })).rejects.toThrow(
        'Không tìm thấy tài khoản.'
      );

      // 2. Trùng phone khi thay đổi
      (prisma.user.findUnique as any)
        .mockResolvedValueOnce({ id: 5, phone: '0900000001' })
        .mockResolvedValueOnce({ id: 9, phone: '0900000002' });
      await expect(
        userService.updateUser(5, { phone: '0900000002' })
      ).rejects.toThrow('Số điện thoại đã tồn tại.');

      // 3. Cập nhật thành công và đổi role trong $transaction
      (prisma.user.findUnique as any)
        .mockResolvedValueOnce({ id: 5, phone: '0900000001' })
        .mockResolvedValueOnce(null); // new phone unique

      const txMock = {
        user: {
          update: vi.fn().mockResolvedValue({
            id: 5,
            email: 'staff@carservice.vn',
            full_name: 'Nhân Viên Mới',
            phone: '0900000099',
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
          create: vi.fn().mockResolvedValue({ user_id: 5, role_id: 2 }),
        },
      };

      (prisma.$transaction as any).mockImplementation(async (cb: any) => cb(txMock));

      const updated = await userService.updateUser(5, {
        fullName: 'Nhân Viên Mới',
        phone: '0900000099',
        role: 'MANAGER',
      });

      expect(txMock.userRole.deleteMany).toHaveBeenCalledWith({
        where: {
          user_id: 5,
          role: { name: { not: 'CUSTOMER' } },
        },
      });
      expect(txMock.userRole.create).toHaveBeenCalledWith({
        data: { user_id: 5, role_id: 2 },
      });
      expect(updated.fullName).toBe('Nhân Viên Mới');
    });
  });

  describe('ADM-USR-UT-04 & ADM-USR-UT-05: deactivateUser & reactivateUser', () => {
    it('ADM-USR-UT-04: chặn vô hiệu hóa tài khoản ADMIN và chặn nếu đã inactive', async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        id: 1,
        is_active: true,
        roles: [{ role: { name: 'ADMIN' } }],
      });

      await expect(userService.deactivateUser(1)).rejects.toThrow(
        'Không thể vô hiệu hóa tài khoản Quản trị viên hệ thống.'
      );

      (prisma.user.findUnique as any).mockResolvedValueOnce({
        id: 8,
        is_active: false,
        roles: [{ role: { name: 'TECHNICIAN' } }],
      });

      await expect(userService.deactivateUser(8)).rejects.toThrow(
        'Tài khoản đã bị vô hiệu hóa trước đó.'
      );
    });

    it('ADM-USR-UT-05: deactivateUser set is_active=false + ghi Redis TTL 7d; reactivateUser set is_active=true + xóa Redis', async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        id: 15,
        is_active: true,
        roles: [{ role: { name: 'TECHNICIAN' } }],
      });
      (prisma.user.update as any).mockResolvedValueOnce({ id: 15, is_active: false });

      await userService.deactivateUser(15);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 15 },
        data: { is_active: false },
      });
      expect(setCache).toHaveBeenCalledWith('revoked_user:15', 'true', 86400 * 7);

      // Reactivate
      (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 15, is_active: false });
      (prisma.user.update as any).mockResolvedValueOnce({ id: 15, is_active: true });

      await userService.reactivateUser(15);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 15 },
        data: { is_active: true },
      });
      expect(deleteCache).toHaveBeenCalledWith('revoked_user:15');
    });
  });

  describe('ADM-USR-UT-06: resetPassword', () => {
    it('hash mật khẩu mới và ném lỗi khi không tìm thấy user', async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce(null);
      await expect(userService.resetPassword(404, 'newpass123')).rejects.toThrow(
        'Không tìm thấy tài khoản.'
      );

      (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 12 });
      (bcrypt.hash as any).mockResolvedValue('new_hash_value');
      (prisma.user.update as any).mockResolvedValueOnce({ id: 12 });

      await userService.resetPassword(12, 'newpass123');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: { password_hash: 'new_hash_value' },
      });
    });
  });
});
