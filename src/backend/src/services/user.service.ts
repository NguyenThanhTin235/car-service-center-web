import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
  async getUsers(searchQuery?: string, role?: string, page: number = 1, limit: number = 10) {
    let whereClause: Prisma.UserWhereInput = {};

    if (role) {
      whereClause = {
        ...whereClause,
        roles: {
          some: {
            role: { name: role },
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
    const role = await prisma.role.findUnique({ where: { name: data.role } });
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
            role: { connect: { name: data.role } },
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
        const role = await tx.role.findUnique({ where: { name: data.role } });
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
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Không tìm thấy tài khoản.');
    if (!user.is_active) throw new Error('Tài khoản đã bị vô hiệu hóa trước đó.');

    await prisma.user.update({
      where: { id },
      data: { is_active: false },
    });
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
