import { setCache, deleteCache } from '../utils/redis.util';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: string; // e.g. 'ADMIN', 'ADVISOR', 'FRONT_DESK', 'MANAGER'
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  role?: string;
}

export class UserService {
  /**
   * UC-51: Lấy danh sách tài khoản với tìm kiếm và phân trang
   */
  async getUsers(
    searchQuery?: string,
    role?: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ) {
    let whereClause: Prisma.UserWhereInput = {};

    if (status !== undefined && status !== null && status !== '') {
      if (status === 'active' || status === 'true') {
        whereClause.is_active = true;
      } else if (status === 'inactive' || status === 'false') {
        whereClause.is_active = false;
      }
    }

    if (role) {
      const normalizedRoles = [role];
      const rUpper = role.toUpperCase().trim().replace(/[\s-]+/g, '_');
      if (rUpper === 'ADVISOR' || rUpper === 'SA' || rUpper === 'SERVICE_ADVISOR') {
        normalizedRoles.push('ADVISOR', 'SA', 'advisor', 'sa', 'Service Advisor');
      }
      if (rUpper === 'FRONT_DESK' || rUpper === 'DESK_STAFF' || rUpper === 'DESKSTAFF') {
        normalizedRoles.push('FRONT_DESK', 'DESK STAFF', 'DESK_STAFF', 'front_desk', 'desk staff');
      }
      if (rUpper === 'MANAGER') {
        normalizedRoles.push('MANAGER', 'Manager', 'manager');
      }
      if (rUpper === 'ADMIN') {
        normalizedRoles.push('ADMIN', 'Admin', 'admin');
      }
      if (rUpper === 'TECHNICIAN' || rUpper === 'TECH' || rUpper === 'KY_THUAT_VIEN') {
        normalizedRoles.push('TECHNICIAN', 'technician', 'Tech', 'TECH');
      }
      if (rUpper === 'CUSTOMER') {
        normalizedRoles.push('CUSTOMER', 'Customer', 'customer');
      }

      whereClause = {
        ...whereClause,
        roles: {
          some: {
            role: { name: { in: Array.from(new Set(normalizedRoles)) } },
          },
        },
      };
    }

    if (searchQuery) {
      whereClause = {
        ...whereClause,
        OR: [
          { full_name: { contains: searchQuery } },
          { phone: { contains: searchQuery } },
          { email: { contains: searchQuery } },
        ],
      };
    }

    const skip = (page - 1) * limit;

    const [totalRecords, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          roles: {
            include: { role: true },
          },
          employee: true,
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const data = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      phone: u.phone,
      address: u.address,
      isActive: u.is_active,
      roles: u.roles.map((ur) => ur.role.name),
      employee: u.employee
        ? {
            id: u.employee.id,
            position: u.employee.position,
          }
        : null,
      createdAt: u.created_at,
    }));

    return {
      data,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Lấy chi tiết 1 tài khoản
   */
  async getUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        employee: { include: { skills: { include: { skill: true } } } },
      },
    });

    if (!user) throw new Error('Không tìm thấy tài khoản.');

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      address: user.address,
      isActive: user.is_active,
      roles: user.roles.map((ur) => ur.role.name),
      employee: user.employee
        ? {
            id: user.employee.id,
            position: user.employee.position,
            isActive: user.employee.is_active,
            skills: user.employee.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
          }
        : null,
      createdAt: user.created_at,
    };
  }

  /**
   * UC-50: Tạo tài khoản mới (cho Staff/Admin)
   */
  async createUser(data: CreateUserDto) {
    // Kiểm tra email đã tồn tại
    const existingByEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingByEmail) throw new Error('Email đã tồn tại trong hệ thống.');

    // Kiểm tra SĐT nếu có
    if (data.phone) {
      const existingByPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existingByPhone) throw new Error('Số điện thoại đã tồn tại trong hệ thống.');
    }

    // Kiểm tra role có hợp lệ không
    let role = await prisma.role.findUnique({ where: { name: data.role } });
    if (!role) {
      const rUpper = data.role.toUpperCase().trim().replace(/[\s-]+/g, '_');
      const candidates =
        rUpper === 'ADVISOR' || rUpper === 'SA'
          ? ['SA', 'ADVISOR']
          : rUpper === 'FRONT_DESK' || rUpper === 'DESK_STAFF'
          ? ['DESK STAFF', 'FRONT_DESK', 'DESK_STAFF']
          : rUpper === 'MANAGER'
          ? ['MANAGER', 'Manager']
          : rUpper === 'TECHNICIAN' || rUpper === 'TECH' || rUpper === 'KY_THUAT_VIEN'
          ? ['TECHNICIAN', 'technician']
          : [];
      for (const c of candidates) {
        role = await prisma.role.findUnique({ where: { name: c } });
        if (role) break;
      }
    }
    if (!role) throw new Error(`Vai trò "${data.role}" không hợp lệ.`);

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password_hash: passwordHash,
        full_name: data.fullName,
        phone: data.phone,
        address: data.address,
        roles: {
          create: {
            role: { connect: { id: role.id } },
          },
        },
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
      phone: newUser.phone,
      isActive: newUser.is_active,
      roles: newUser.roles.map((ur) => ur.role.name),
      createdAt: newUser.created_at,
    };
  }

  /**
   * UC-52: Cập nhật thông tin tài khoản
   */
  async updateUser(id: number, data: UpdateUserDto) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Không tìm thấy tài khoản.');

    // Kiểm tra SĐT unique nếu thay đổi
    if (data.phone && data.phone !== user.phone) {
      const existingByPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existingByPhone) throw new Error('Số điện thoại đã tồn tại.');
    }

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          full_name: data.fullName,
          phone: data.phone,
          address: data.address,
          is_active: data.isActive,
        },
        include: {
          roles: { include: { role: true } },
        },
      });

      // Thay đổi role nếu có
      if (data.role) {
        let role = await tx.role.findUnique({ where: { name: data.role } });
        if (!role) {
          const rUpper = data.role.toUpperCase().trim().replace(/[\s-]+/g, '_');
          const candidates =
            rUpper === 'ADVISOR' || rUpper === 'SA'
              ? ['SA', 'ADVISOR']
              : rUpper === 'FRONT_DESK' || rUpper === 'DESK_STAFF'
              ? ['DESK STAFF', 'FRONT_DESK', 'DESK_STAFF']
              : rUpper === 'MANAGER'
              ? ['MANAGER', 'Manager']
              : rUpper === 'TECHNICIAN' || rUpper === 'TECH' || rUpper === 'KY_THUAT_VIEN'
              ? ['TECHNICIAN', 'technician']
              : [];
          for (const c of candidates) {
            role = await tx.role.findUnique({ where: { name: c } });
            if (role) break;
          }
        }
        if (!role) throw new Error(`Vai trò "${data.role}" không hợp lệ.`);

        // Xóa role cũ (ngoại trừ CUSTOMER) và gán role mới
        await tx.userRole.deleteMany({
          where: {
            user_id: id,
            role: { name: { not: 'CUSTOMER' } },
          },
        });

        // Kiểm tra role mới đã tồn tại chưa
        const existingUserRole = await tx.userRole.findFirst({
          where: { user_id: id, role_id: role.id },
        });
        if (!existingUserRole) {
          await tx.userRole.create({
            data: { user_id: id, role_id: role.id },
          });
        }
      }

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        phone: updatedUser.phone,
        isActive: updatedUser.is_active,
        roles: updatedUser.roles.map((ur) => ur.role.name),
      };
    });
  }

  /**
   * UC-53: Vô hiệu hóa tài khoản (soft delete)
   */
  async deactivateUser(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new Error('Không tìm thấy tài khoản.');
    const isAdmin = user.roles?.some((ur) => ur.role?.name?.toUpperCase() === 'ADMIN');
    if (isAdmin) throw new Error('Không thể vô hiệu hóa tài khoản Quản trị viên hệ thống.');
    if (!user.is_active) throw new Error('Tài khoản đã bị vô hiệu hóa trước đó.');

    await prisma.user.update({
      where: { id },
      data: { is_active: false },
    });

    // Thu hồi token lập tức qua Redis / In-memory blacklist
    await setCache(`revoked_user:${id}`, 'true', 86400 * 7);
  }

  /**
   * Khôi phục tài khoản
   */
  async reactivateUser(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Không tìm thấy tài khoản.');

    await prisma.user.update({
      where: { id },
      data: { is_active: true },
    });

    // Xóa cờ thu hồi token trong Redis khi kích hoạt lại
    await deleteCache(`revoked_user:${id}`);
  }

  /**
   * Đặt lại mật khẩu (Admin reset)
   */
  async resetPassword(id: number, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Không tìm thấy tài khoản.');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password_hash: passwordHash },
    });
  }
}
