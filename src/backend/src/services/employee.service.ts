import { PrismaClient, EmployeePosition } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateEmployeeDto {
  fullName: string;
  position: EmployeePosition;
  userId?: number; // optional: link to existing user account
  skillIds?: number[];
}

export interface UpdateEmployeeDto {
  fullName?: string;
  position?: EmployeePosition;
  userId?: number | null;
  isActive?: boolean;
  skillIds?: number[];
}

export class EmployeeService {
  /**
   * UC-55: Lấy danh sách nhân viên
   */
  async getEmployees(searchQuery?: string, position?: string, page: number = 1, limit: number = 10) {
    let whereClause: any = {};

    if (position) {
      whereClause.position = position as EmployeePosition;
    }

    if (searchQuery) {
      whereClause.full_name = { contains: searchQuery };
    }

    const skip = (page - 1) * limit;

    const [totalRecords, employees] = await Promise.all([
      prisma.employee.count({ where: whereClause }),
      prisma.employee.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, phone: true, is_active: true },
          },
          skills: {
            include: { skill: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const data = employees.map((e) => ({
      id: e.id,
      fullName: e.full_name,
      position: e.position,
      isActive: e.is_active,
      user: e.user
        ? {
            id: e.user.id,
            email: e.user.email,
            phone: e.user.phone,
            isActive: e.user.is_active,
          }
        : null,
      skills: e.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
      createdAt: e.created_at,
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
   * Lấy chi tiết 1 nhân viên
   */
  async getEmployeeById(id: number) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, phone: true, is_active: true, address: true },
        },
        skills: { include: { skill: true } },
      },
    });

    if (!employee) throw new Error('Không tìm thấy nhân viên.');

    return {
      id: employee.id,
      fullName: employee.full_name,
      position: employee.position,
      isActive: employee.is_active,
      user: employee.user
        ? {
            id: employee.user.id,
            email: employee.user.email,
            phone: employee.user.phone,
            address: employee.user.address,
          }
        : null,
      skills: employee.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
      createdAt: employee.created_at,
    };
  }

  /**
   * UC-54: Tạo nhân viên mới
   */
  async createEmployee(data: CreateEmployeeDto) {
    // Nếu có userId, kiểm tra user tồn tại và chưa liên kết nhân viên
    if (data.userId) {
      const user = await prisma.user.findUnique({ where: { id: data.userId } });
      if (!user) throw new Error('Không tìm thấy tài khoản hệ thống được chỉ định.');

      const existingEmployee = await prisma.employee.findUnique({ where: { user_id: data.userId } });
      if (existingEmployee) throw new Error('Tài khoản này đã được liên kết với nhân viên khác.');
    }

    return prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          full_name: data.fullName,
          position: data.position,
          user_id: data.userId,
        },
      });

      // Gán kỹ năng nếu có
      if (data.skillIds && data.skillIds.length > 0) {
        const skillCreateData = data.skillIds.map((skillId) => ({
          employee_id: employee.id,
          skill_id: skillId,
        }));
        await tx.employeeSkill.createMany({ data: skillCreateData, skipDuplicates: true });
      }

      return tx.employee.findUnique({
        where: { id: employee.id },
        include: {
          user: { select: { id: true, email: true, phone: true } },
          skills: { include: { skill: true } },
        },
      });
    });
  }

  /**
   * UC-56: Cập nhật thông tin nhân viên
   */
  async updateEmployee(id: number, data: UpdateEmployeeDto) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new Error('Không tìm thấy nhân viên.');

    // Kiểm tra userId nếu thay đổi
    if (data.userId !== undefined && data.userId !== null && data.userId !== employee.user_id) {
      const user = await prisma.user.findUnique({ where: { id: data.userId } });
      if (!user) throw new Error('Không tìm thấy tài khoản hệ thống được chỉ định.');

      const existingEmployee = await prisma.employee.findUnique({ where: { user_id: data.userId } });
      if (existingEmployee && existingEmployee.id !== id) {
        throw new Error('Tài khoản này đã được liên kết với nhân viên khác.');
      }
    }

    return prisma.$transaction(async (tx) => {
      const updatedEmployee = await tx.employee.update({
        where: { id },
        data: {
          full_name: data.fullName,
          position: data.position,
          is_active: data.isActive,
          user_id: data.userId,
        },
      });

      // Cập nhật kỹ năng nếu có
      if (data.skillIds !== undefined) {
        // Xóa tất cả kỹ năng cũ
        await tx.employeeSkill.deleteMany({ where: { employee_id: id } });

        // Thêm kỹ năng mới
        if (data.skillIds.length > 0) {
          await tx.employeeSkill.createMany({
            data: data.skillIds.map((skillId) => ({ employee_id: id, skill_id: skillId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.employee.findUnique({
        where: { id: updatedEmployee.id },
        include: {
          user: { select: { id: true, email: true, phone: true } },
          skills: { include: { skill: true } },
        },
      });
    });
  }

  /**
   * UC-57: Vô hiệu hóa nhân viên (soft delete)
   */
  async deactivateEmployee(id: number) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new Error('Không tìm thấy nhân viên.');
    if (!employee.is_active) throw new Error('Nhân viên đã bị vô hiệu hóa trước đó.');

    await prisma.employee.update({
      where: { id },
      data: { is_active: false },
    });
  }

  /**
   * Khôi phục nhân viên
   */
  async reactivateEmployee(id: number) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new Error('Không tìm thấy nhân viên.');
    if (employee.is_active) throw new Error('Nhân viên đang hoạt động.');

    await prisma.employee.update({
      where: { id },
      data: { is_active: true },
    });
  }

  /**
   * Lấy danh sách kỹ năng (để chọn khi tạo/sửa nhân viên)
   */
  async getSkills() {
    return prisma.skill.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }
}
