import { EmployeePosition, JobStatus, WorkOrderStatus } from '@prisma/client';
import prisma from '../utils/prisma';

export type CanonicalPosition = 'MANAGER' | 'TECHNICIAN' | 'ADVISOR' | 'FRONT_DESK';

export interface CreateEmployeeDto {
  fullName: string;
  position: EmployeePosition | string;
  userId?: number; // optional: link to existing user account
  skillIds?: number[];
}

export interface UpdateEmployeeDto {
  fullName?: string;
  position?: EmployeePosition | string;
  userId?: number | null;
  isActive?: boolean;
  skillIds?: number[];
}

function normalizePosition(pos: EmployeePosition | string, user?: any): CanonicalPosition {
  const roles: string[] = (user?.roles || []).map((r: any) => String(r.role?.name || '').toUpperCase());
  const email = String(user?.email || '').toLowerCase();
  const raw = String(pos || '').toUpperCase();

  if (raw === 'MANAGER' || roles.some((r) => r.includes('MANAGE') || r.includes('ADMIN')) || email.includes('manager')) {
    return 'MANAGER';
  }
  if (
    raw === 'FRONT_DESK' ||
    raw === 'RECEPTIONIST' ||
    roles.some((r) => r.includes('DESK') || r.includes('RECEPT') || r.includes('LỄ TÂN') || r.includes('LE TAN')) ||
    email.includes('desk')
  ) {
    return 'FRONT_DESK';
  }
  if (raw === 'ADVISOR' || roles.some((r) => r === 'SA' || r.includes('ADVISOR')) || email.includes('advisor')) {
    return 'ADVISOR';
  }
  return 'TECHNICIAN';
}

function mapPositionToEnum(position?: string): EmployeePosition {
  if (!position) return EmployeePosition.TECHNICIAN;
  const p = position.toUpperCase();
  if (p === 'MANAGER') return EmployeePosition.OTHER;
  if (p === 'FRONT_DESK' || p === 'RECEPTIONIST') return EmployeePosition.OTHER;
  if (p === 'ADVISOR') return EmployeePosition.ADVISOR;
  if (p === 'TECHNICIAN') return EmployeePosition.TECHNICIAN;
  if (Object.values(EmployeePosition).includes(p as EmployeePosition)) {
    return p as EmployeePosition;
  }
  return EmployeePosition.OTHER;
}

export function isTechnicianRole(position?: string, rawEnumPosition?: EmployeePosition): boolean {
  if (position) {
    const p = position.toUpperCase().trim();
    if (['TECHNICIAN', 'TECH', 'DETAILER', 'QC_STAFF'].includes(p)) return true;
    if (['MANAGER', 'ADVISOR', 'FRONT_DESK', 'RECEPTIONIST', 'OTHER', 'ADMIN'].includes(p)) return false;
  }
  if (rawEnumPosition) {
    const techPositions: EmployeePosition[] = [EmployeePosition.TECHNICIAN, EmployeePosition.DETAILER, EmployeePosition.QC_STAFF];
    if (techPositions.includes(rawEnumPosition)) {
      return true;
    }
  }
  return false;
}

export class EmployeeService {
  /**
   * UC-55: Lấy danh sách nhân viên
   */
  async getEmployees(
    searchQuery?: string,
    position?: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ) {
    const conditions: any[] = [];

    if (position) {
      const p = position.toUpperCase();
      if (p === 'MANAGER') {
        conditions.push({
          OR: [
            { position: EmployeePosition.OTHER, user: { roles: { some: { role: { name: { in: ['MANAGER', 'ADMIN'] } } } } } },
            { user: { email: { contains: 'manager' } } },
          ],
        });
      } else if (p === 'FRONT_DESK' || p === 'RECEPTIONIST') {
        conditions.push({
          OR: [
            { position: EmployeePosition.OTHER, user: { roles: { some: { role: { name: { in: ['DESK STAFF', 'DESK_STAFF'] } } } } } },
            { user: { email: { contains: 'desk' } } },
          ],
        });
      } else if (p === 'ADVISOR') {
        conditions.push({
          OR: [
            { position: EmployeePosition.ADVISOR },
            { user: { roles: { some: { role: { name: { in: ['SA', 'ADVISOR'] } } } } } },
            { user: { email: { contains: 'advisor' } } },
          ],
        });
      } else if (p === 'TECHNICIAN') {
        conditions.push({
          OR: [
            { position: { in: [EmployeePosition.TECHNICIAN, EmployeePosition.DETAILER, EmployeePosition.QC_STAFF] } },
            { user: { roles: { some: { role: { name: { in: ['TECHNICIAN', 'TECH'] } } } } } },
          ],
        });
      } else if (Object.values(EmployeePosition).includes(p as EmployeePosition)) {
        conditions.push({ position: p as EmployeePosition });
      }
    }

    if (searchQuery) {
      conditions.push({ full_name: { contains: searchQuery } });
    }

    if (status !== undefined && status !== '') {
      const isActiveBool = status === 'active' || status === 'true';
      conditions.push({ is_active: isActiveBool });
    }

    const whereClause = conditions.length > 0 ? { AND: conditions } : {};

    const skip = (page - 1) * limit;

    const [totalRecords, employees] = await Promise.all([
      prisma.employee.count({ where: whereClause }),
      prisma.employee.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              is_active: true,
              roles: {
                select: {
                  role: { select: { id: true, name: true } },
                },
              },
            },
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
      position: normalizePosition(e.position, e.user),
      rawPosition: e.position,
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
          select: {
            id: true,
            email: true,
            phone: true,
            is_active: true,
            address: true,
            roles: {
              select: {
                role: { select: { id: true, name: true } },
              },
            },
          },
        },
        skills: { include: { skill: true } },
      },
    });

    if (!employee) throw new Error('Không tìm thấy nhân viên.');

    return {
      id: employee.id,
      fullName: employee.full_name,
      position: normalizePosition(employee.position, employee.user),
      rawPosition: employee.position,
      isActive: employee.is_active,
      user: employee.user
        ? {
            id: employee.user.id,
            email: employee.user.email,
            phone: employee.user.phone,
            isActive: employee.user.is_active,
            address: employee.user.address,
            roles: employee.user.roles?.map((r) => r.role.name) || [],
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
      const positionEnum = mapPositionToEnum(data.position as string);
      const isTech = isTechnicianRole(data.position, positionEnum);

      const employee = await tx.employee.create({
        data: {
          full_name: data.fullName,
          position: positionEnum,
          user_id: data.userId,
        },
      });

      // Chỉ gán kỹ năng nếu nhân viên có vai trò Kỹ thuật viên
      if (isTech && data.skillIds && data.skillIds.length > 0) {
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

    // Nếu chuyển sang ngừng hoạt động, kiểm tra ràng buộc công việc đang phân công
    if (data.isActive === false && employee.is_active) {
      await this.checkEmployeeActiveWorkConstraints(id, employee.user_id);
    }

    return prisma.$transaction(async (tx) => {
      const targetPosition = data.position !== undefined ? mapPositionToEnum(data.position as string) : employee.position;
      const isTech = isTechnicianRole(data.position, targetPosition);

      const updatedEmployee = await tx.employee.update({
        where: { id },
        data: {
          full_name: data.fullName,
          position: data.position !== undefined ? targetPosition : undefined,
          is_active: data.isActive,
          user_id: data.userId,
        },
      });

      // Cập nhật kỹ năng:
      // Nếu vị trí KHÔNG PHẢI kỹ thuật viên, tự động dọn sạch mọi kỹ năng
      if (!isTech) {
        await tx.employeeSkill.deleteMany({ where: { employee_id: id } });
      } else if (data.skillIds !== undefined) {
        // Xóa tất cả kỹ năng cũ
        await tx.employeeSkill.deleteMany({ where: { employee_id: id } });

        // Thêm kỹ năng mới nếu có
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
   * UC-57: Vô hiệu hóa nhân viên (chuyển sang Ngừng hoạt động)
   */
  async deactivateEmployee(id: number) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new Error('Không tìm thấy nhân viên.');
    if (!employee.is_active) throw new Error('Nhân viên đã ở trạng thái ngừng hoạt động trước đó.');

    // Kiểm tra ràng buộc công việc đang được phân công chưa hoàn thành
    await this.checkEmployeeActiveWorkConstraints(id, employee.user_id);

    await prisma.employee.update({
      where: { id },
      data: { is_active: false },
    });
  }

  /**
   * Kiểm tra các công việc và lệnh sửa chữa đang phân công trước khi cho phép ngừng hoạt động
   */
  async checkEmployeeActiveWorkConstraints(employeeId: number, userId?: number | null) {
    // 1. Kiểm tra công việc phân công cho Kỹ thuật viên qua JobLabour
    const activeJobs = await prisma.jobLabour.findMany({
      where: {
        employee_id: employeeId,
        job: {
          status: { in: [JobStatus.PLANNED, JobStatus.IN_PROGRESS, JobStatus.REWORK] },
          wo_service: {
            work_order: {
              status: { notIn: [WorkOrderStatus.CLOSED, WorkOrderStatus.RELEASED, WorkOrderStatus.CANCELLED] },
            },
          },
        },
      },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            status: true,
            wo_service: {
              select: {
                work_order: {
                  select: {
                    id: true,
                    wo_number: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (activeJobs.length > 0) {
      const jobSample = activeJobs
        .slice(0, 3)
        .map((j) => `"${j.job.name}" (${j.job.wo_service.work_order.wo_number})`)
        .join(', ');
      const extra = activeJobs.length > 3 ? ` và ${activeJobs.length - 3} công việc khác` : '';
      throw new Error(
        `Không thể ngừng hoạt động nhân sự vì nhân viên đang được phân công ${activeJobs.length} công việc chưa hoàn thành: ${jobSample}${extra}. Vui lòng hoàn tất hoặc điều phối lại công việc cho nhân sự khác trước khi vô hiệu hóa.`
      );
    }

    // 2. Kiểm tra nếu nhân sự có tài khoản User là Cố vấn dịch vụ đang phụ trách Lệnh sửa chữa chưa hoàn tất
    if (userId) {
      const activeAdvisorWOs = await prisma.workOrder.findMany({
        where: {
          advisor_id: userId,
          status: { notIn: [WorkOrderStatus.CLOSED, WorkOrderStatus.RELEASED, WorkOrderStatus.CANCELLED] },
        },
        select: { id: true, wo_number: true, status: true },
      });

      if (activeAdvisorWOs.length > 0) {
        const woSample = activeAdvisorWOs.slice(0, 3).map((w) => w.wo_number).join(', ');
        const extra = activeAdvisorWOs.length > 3 ? ` và ${activeAdvisorWOs.length - 3} lệnh khác` : '';
        throw new Error(
          `Không thể ngừng hoạt động nhân sự vì Cố vấn đang trực tiếp phụ trách ${activeAdvisorWOs.length} lệnh sửa chữa chưa đóng (${woSample}${extra}). Vui lòng bàn giao lệnh sửa chữa trước khi vô hiệu hóa.`
        );
      }
    }
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
