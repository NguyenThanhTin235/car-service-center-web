import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeePosition, JobStatus, WorkOrderStatus } from '@prisma/client';
import { EmployeeService, isTechnicianRole } from '../../../src/services/employee.service';
import prisma from '../../../src/utils/prisma';

describe('EmployeeService — Unit Tests (TICKET-ADM-03)', () => {
  const service = new EmployeeService();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ADM-EMP-UT-01: getSkills & getEmployees filtering, normalization, pagination', () => {
    it('getSkills trả danh sách kỹ năng đang active sắp xếp theo tên tăng dần', async () => {
      const mockSkills = [
        { id: 1, name: 'Chẩn đoán OBD-II', is_active: true },
        { id: 2, name: 'Sửa chữa động cơ', is_active: true },
      ];
      const findManySpy = vi.spyOn(prisma.skill, 'findMany').mockResolvedValue(mockSkills as any);

      const result = await service.getSkills();

      expect(findManySpy).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockSkills);
    });

    it('getEmployees lọc theo search, position (MANAGER, FRONT_DESK, ADVISOR, TECHNICIAN) và status', async () => {
      const mockEmployees = [
        {
          id: 10,
          full_name: 'Nguyễn Kỹ Thuật',
          position: EmployeePosition.TECHNICIAN,
          is_active: true,
          created_at: new Date('2026-11-01T08:00:00Z'),
          user: {
            id: 101,
            email: 'tech@autocare.vn',
            phone: '0901112222',
            is_active: true,
            roles: [{ role: { id: 4, name: 'TECHNICIAN' } }],
          },
          skills: [{ skill: { id: 1, name: 'Chẩn đoán OBD-II' } }],
        },
      ];

      const countSpy = vi.spyOn(prisma.employee, 'count').mockResolvedValue(1);
      const findManySpy = vi.spyOn(prisma.employee, 'findMany').mockResolvedValue(mockEmployees as any);

      const result = await service.getEmployees('Kỹ Thuật', 'TECHNICIAN', 1, 10, 'active');

      expect(countSpy).toHaveBeenCalledTimes(1);
      const whereArg = countSpy.mock.calls[0][0]?.where as any;
      expect(whereArg.AND).toHaveLength(3);
      expect(whereArg.AND[0].OR).toBeDefined();
      expect(whereArg.AND[1]).toEqual({ full_name: { contains: 'Kỹ Thuật' } });
      expect(whereArg.AND[2]).toEqual({ is_active: true });

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { created_at: 'desc' },
        })
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 10,
        fullName: 'Nguyễn Kỹ Thuật',
        position: 'TECHNICIAN',
        rawPosition: EmployeePosition.TECHNICIAN,
        isActive: true,
        user: {
          id: 101,
          email: 'tech@autocare.vn',
          phone: '0901112222',
          isActive: true,
        },
        skills: [{ id: 1, name: 'Chẩn đoán OBD-II' }],
      });
      expect(result.pagination).toEqual({
        totalRecords: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
      });
    });

    it('getEmployees hỗ trợ lọc position MANAGER, FRONT_DESK/RECEPTIONIST, ADVISOR và status inactive/false', async () => {
      const countSpy = vi.spyOn(prisma.employee, 'count').mockResolvedValue(0);
      vi.spyOn(prisma.employee, 'findMany').mockResolvedValue([]);

      await service.getEmployees(undefined, 'MANAGER', 2, 5, 'false');
      let whereArg = countSpy.mock.calls[0][0]?.where as any;
      expect(whereArg.AND[0].OR[0].user.roles.some.role.name.in).toEqual(['MANAGER', 'ADMIN']);
      expect(whereArg.AND[1]).toEqual({ is_active: false });

      await service.getEmployees(undefined, 'RECEPTIONIST', 1, 10, 'inactive');
      whereArg = countSpy.mock.calls[1][0]?.where as any;
      expect(whereArg.AND[0].OR[0].user.roles.some.role.name.in).toEqual(['DESK STAFF', 'DESK_STAFF']);
      expect(whereArg.AND[1]).toEqual({ is_active: false });

      await service.getEmployees(undefined, 'ADVISOR', 1, 10, 'true');
      whereArg = countSpy.mock.calls[2][0]?.where as any;
      expect(whereArg.AND[0].OR[0]).toEqual({ position: EmployeePosition.ADVISOR });
      expect(whereArg.AND[1]).toEqual({ is_active: true });
    });

    it('getEmployeeById trả chi tiết nhân viên hoặc ném lỗi khi không tìm thấy', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValueOnce(null);
      await expect(service.getEmployeeById(999)).rejects.toThrow('Không tìm thấy nhân viên.');

      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValueOnce({
        id: 5,
        full_name: 'Trần Cố Vấn',
        position: EmployeePosition.ADVISOR,
        is_active: true,
        created_at: new Date('2026-11-01T00:00:00Z'),
        user: {
          id: 50,
          email: 'advisor@autocare.vn',
          phone: '0905556666',
          is_active: true,
          address: 'TP.HCM',
          roles: [{ role: { id: 3, name: 'ADVISOR' } }],
        },
        skills: [],
      } as any);

      const emp = await service.getEmployeeById(5);
      expect(emp.position).toBe('ADVISOR');
      expect(emp.user?.roles).toEqual(['ADVISOR']);
      expect(emp.user?.address).toBe('TP.HCM');
    });
  });

  describe('ADM-EMP-UT-02: createEmployee validation & skill attachment theo isTechnicianRole', () => {
    it('isTechnicianRole nhận diện đúng tech roles và non-tech roles', () => {
      expect(isTechnicianRole('TECHNICIAN')).toBe(true);
      expect(isTechnicianRole('TECH')).toBe(true);
      expect(isTechnicianRole('DETAILER')).toBe(true);
      expect(isTechnicianRole('QC_STAFF')).toBe(true);
      expect(isTechnicianRole('ADVISOR')).toBe(false);
      expect(isTechnicianRole('MANAGER')).toBe(false);
      expect(isTechnicianRole('FRONT_DESK')).toBe(false);
    });

    it('ném lỗi nếu userId không tồn tại', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createEmployee({ fullName: 'Nguyễn Văn A', position: 'TECHNICIAN', userId: 999 })
      ).rejects.toThrow('Không tìm thấy tài khoản hệ thống được chỉ định.');
    });

    it('ném lỗi nếu userId đã được liên kết với nhân viên khác', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 12 } as any);
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({ id: 3, user_id: 12 } as any);

      await expect(
        service.createEmployee({ fullName: 'Nguyễn Văn A', position: 'TECHNICIAN', userId: 12 })
      ).rejects.toThrow('Tài khoản này đã được liên kết với nhân viên khác.');
    });

    it('gắn skillIds khi vị trí là tech role (TECHNICIAN / DETAILER / QC_STAFF)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 15 } as any);
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(null);

      const createEmployeeMock = vi.fn().mockResolvedValue({ id: 20, full_name: 'KTV Mới' });
      const createManySkillsMock = vi.fn().mockResolvedValue({ count: 2 });
      const findUniqueTxMock = vi.fn().mockResolvedValue({
        id: 20,
        full_name: 'KTV Mới',
        position: EmployeePosition.DETAILER,
        skills: [{ skill: { id: 1, name: 'Detailing' } }, { skill: { id: 2, name: 'Phủ Ceramic' } }],
      });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          employee: { create: createEmployeeMock, findUnique: findUniqueTxMock },
          employeeSkill: { createMany: createManySkillsMock },
        });
      });

      const created = await service.createEmployee({
        fullName: 'KTV Mới',
        position: 'DETAILER',
        userId: 15,
        skillIds: [1, 2],
      });

      expect(createEmployeeMock).toHaveBeenCalledWith({
        data: {
          full_name: 'KTV Mới',
          position: EmployeePosition.DETAILER,
          user_id: 15,
        },
      });
      expect(createManySkillsMock).toHaveBeenCalledWith({
        data: [
          { employee_id: 20, skill_id: 1 },
          { employee_id: 20, skill_id: 2 },
        ],
        skipDuplicates: true,
      });
      expect(created?.id).toBe(20);
    });

    it('KHÔNG gắn skillIds nếu vị trí là non-tech role (ADVISOR)', async () => {
      const createEmployeeMock = vi.fn().mockResolvedValue({ id: 21, full_name: 'Cố Vấn Mới' });
      const createManySkillsMock = vi.fn();
      const findUniqueTxMock = vi.fn().mockResolvedValue({
        id: 21,
        full_name: 'Cố Vấn Mới',
        position: EmployeePosition.ADVISOR,
        skills: [],
      });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          employee: { create: createEmployeeMock, findUnique: findUniqueTxMock },
          employeeSkill: { createMany: createManySkillsMock },
        });
      });

      await service.createEmployee({
        fullName: 'Cố Vấn Mới',
        position: 'ADVISOR',
        skillIds: [1, 2],
      });

      expect(createManySkillsMock).not.toHaveBeenCalled();
    });
  });

  describe('ADM-EMP-UT-03: updateEmployee skill cleanup, replacement & deactivation constraint check', () => {
    it('ném lỗi khi không tìm thấy nhân viên cần cập nhật', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(null);

      await expect(service.updateEmployee(404, { fullName: 'ABC' })).rejects.toThrow(
        'Không tìm thấy nhân viên.'
      );
    });

    it('ném lỗi khi đổi userId sang tài khoản đã liên kết nhân viên khác', async () => {
      vi.spyOn(prisma.employee, 'findUnique')
        .mockResolvedValueOnce({ id: 1, user_id: 10, position: EmployeePosition.TECHNICIAN, is_active: true } as any)
        .mockResolvedValueOnce({ id: 2, user_id: 20 } as any);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 20 } as any);

      await expect(service.updateEmployee(1, { userId: 20 })).rejects.toThrow(
        'Tài khoản này đã được liên kết với nhân viên khác.'
      );
    });

    it('xóa toàn bộ employeeSkill nếu chuyển sang non-tech role', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({
        id: 1,
        user_id: 10,
        position: EmployeePosition.TECHNICIAN,
        is_active: true,
      } as any);

      const updateMock = vi.fn().mockResolvedValue({ id: 1 });
      const deleteManyMock = vi.fn().mockResolvedValue({ count: 2 });
      const createManyMock = vi.fn();
      const findUniqueTxMock = vi.fn().mockResolvedValue({ id: 1, position: EmployeePosition.ADVISOR, skills: [] });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          employee: { update: updateMock, findUnique: findUniqueTxMock },
          employeeSkill: { deleteMany: deleteManyMock, createMany: createManyMock },
        });
      });

      await service.updateEmployee(1, { position: 'ADVISOR', skillIds: [1, 2] });

      expect(deleteManyMock).toHaveBeenCalledWith({ where: { employee_id: 1 } });
      expect(createManyMock).not.toHaveBeenCalled();
    });

    it('thay thế skillIds khi là tech role', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({
        id: 1,
        user_id: 10,
        position: EmployeePosition.TECHNICIAN,
        is_active: true,
      } as any);

      const updateMock = vi.fn().mockResolvedValue({ id: 1 });
      const deleteManyMock = vi.fn().mockResolvedValue({ count: 1 });
      const createManyMock = vi.fn().mockResolvedValue({ count: 2 });
      const findUniqueTxMock = vi.fn().mockResolvedValue({ id: 1, position: EmployeePosition.QC_STAFF });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          employee: { update: updateMock, findUnique: findUniqueTxMock },
          employeeSkill: { deleteMany: deleteManyMock, createMany: createManyMock },
        });
      });

      await service.updateEmployee(1, { position: 'QC_STAFF', skillIds: [3, 4] });

      expect(deleteManyMock).toHaveBeenCalledWith({ where: { employee_id: 1 } });
      expect(createManyMock).toHaveBeenCalledWith({
        data: [
          { employee_id: 1, skill_id: 3 },
          { employee_id: 1, skill_id: 4 },
        ],
        skipDuplicates: true,
      });
    });

    it('gọi checkEmployeeActiveWorkConstraints khi updateEmployee với isActive === false', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({
        id: 7,
        user_id: 70,
        position: EmployeePosition.TECHNICIAN,
        is_active: true,
      } as any);

      const constraintSpy = vi
        .spyOn(service, 'checkEmployeeActiveWorkConstraints')
        .mockRejectedValue(new Error('Không thể ngừng hoạt động nhân sự vì nhân viên đang được phân công'));

      await expect(service.updateEmployee(7, { isActive: false })).rejects.toThrow(
        'Không thể ngừng hoạt động nhân sự'
      );
      expect(constraintSpy).toHaveBeenCalledWith(7, 70);
    });
  });

  describe('ADM-EMP-UT-04: checkEmployeeActiveWorkConstraints (Real Logic + Mocked Prisma)', () => {
    it('chặn vô hiệu hóa khi KTV có JobLabour ở PLANNED/IN_PROGRESS/REWORK trên Work Order đang mở', async () => {
      const jobLabourSpy = vi.spyOn(prisma.jobLabour, 'findMany').mockResolvedValue([
        {
          job: {
            id: 11,
            name: 'Thay má phanh trước',
            status: JobStatus.IN_PROGRESS,
            wo_service: { work_order: { id: 100, wo_number: 'WO-202611-001', status: WorkOrderStatus.IN_PROGRESS } },
          },
        },
        {
          job: {
            id: 12,
            name: 'Căn chỉnh thước lái',
            status: JobStatus.PLANNED,
            wo_service: { work_order: { id: 101, wo_number: 'WO-202611-002', status: WorkOrderStatus.APPROVED } },
          },
        },
        {
          job: {
            id: 13,
            name: 'Kiểm tra gầm',
            status: JobStatus.REWORK,
            wo_service: { work_order: { id: 102, wo_number: 'WO-202611-003', status: WorkOrderStatus.QC_PENDING } },
          },
        },
        {
          job: {
            id: 14,
            name: 'Thay dầu hộp số',
            status: JobStatus.PLANNED,
            wo_service: { work_order: { id: 103, wo_number: 'WO-202611-004', status: WorkOrderStatus.IN_PROGRESS } },
          },
        },
      ] as any);

      const workOrderSpy = vi.spyOn(prisma.workOrder, 'findMany');

      await expect(service.checkEmployeeActiveWorkConstraints(10, 100)).rejects.toThrow(
        'Không thể ngừng hoạt động nhân sự vì nhân viên đang được phân công 4 công việc chưa hoàn thành: "Thay má phanh trước" (WO-202611-001), "Căn chỉnh thước lái" (WO-202611-002), "Kiểm tra gầm" (WO-202611-003) và 1 công việc khác.'
      );

      expect(jobLabourSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            employee_id: 10,
            job: {
              status: { in: [JobStatus.PLANNED, JobStatus.IN_PROGRESS, JobStatus.REWORK] },
              wo_service: {
                work_order: {
                  status: { notIn: [WorkOrderStatus.CLOSED, WorkOrderStatus.RELEASED, WorkOrderStatus.CANCELLED] },
                },
              },
            },
          },
        })
      );
      expect(workOrderSpy).not.toHaveBeenCalled();
    });

    it('chặn vô hiệu hóa khi userId đang là advisor_id của Work Order đang mở', async () => {
      vi.spyOn(prisma.jobLabour, 'findMany').mockResolvedValue([]);
      const workOrderSpy = vi.spyOn(prisma.workOrder, 'findMany').mockResolvedValue([
        { id: 201, wo_number: 'WO-202611-008', status: WorkOrderStatus.IN_PROGRESS },
        { id: 202, wo_number: 'WO-202611-009', status: WorkOrderStatus.ESTIMATING },
      ] as any);

      await expect(service.checkEmployeeActiveWorkConstraints(5, 99)).rejects.toThrow(
        'Không thể ngừng hoạt động nhân sự vì Cố vấn đang trực tiếp phụ trách 2 lệnh sửa chữa chưa đóng (WO-202611-008, WO-202611-009).'
      );

      expect(workOrderSpy).toHaveBeenCalledWith({
        where: {
          advisor_id: 99,
          status: { notIn: [WorkOrderStatus.CLOSED, WorkOrderStatus.RELEASED, WorkOrderStatus.CANCELLED] },
        },
        select: { id: true, wo_number: true, status: true },
      });
    });

    it('cho phép vô hiệu hóa khi không có JobLabour mở và không phụ trách Work Order mở', async () => {
      vi.spyOn(prisma.jobLabour, 'findMany').mockResolvedValue([]);
      const workOrderSpy = vi.spyOn(prisma.workOrder, 'findMany').mockResolvedValue([]);

      await expect(service.checkEmployeeActiveWorkConstraints(5, 99)).resolves.toBeUndefined();
      expect(workOrderSpy).toHaveBeenCalledTimes(1);

      // Khi userId là null thì không cần query workOrder
      workOrderSpy.mockClear();
      await expect(service.checkEmployeeActiveWorkConstraints(5, null)).resolves.toBeUndefined();
      expect(workOrderSpy).not.toHaveBeenCalled();
    });
  });

  describe('ADM-EMP-UT-05: deactivateEmployee & reactivateEmployee status guards', () => {
    it('deactivateEmployee ném lỗi nếu không tìm thấy hoặc đã ở trạng thái ngừng hoạt động', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValueOnce(null);
      await expect(service.deactivateEmployee(999)).rejects.toThrow('Không tìm thấy nhân viên.');

      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValueOnce({ id: 2, is_active: false } as any);
      await expect(service.deactivateEmployee(2)).rejects.toThrow(
        'Nhân viên đã ở trạng thái ngừng hoạt động trước đó.'
      );
    });

    it('deactivateEmployee kiểm tra ràng buộc thật và cập nhật is_active = false khi hợp lệ', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({
        id: 3,
        user_id: 33,
        is_active: true,
      } as any);
      vi.spyOn(prisma.jobLabour, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.workOrder, 'findMany').mockResolvedValue([]);
      const updateSpy = vi.spyOn(prisma.employee, 'update').mockResolvedValue({ id: 3, is_active: false } as any);

      await service.deactivateEmployee(3);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { is_active: false },
      });
    });

    it('reactivateEmployee ném lỗi nếu không tìm thấy hoặc nhân viên đang hoạt động', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValueOnce(null);
      await expect(service.reactivateEmployee(999)).rejects.toThrow('Không tìm thấy nhân viên.');

      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValueOnce({ id: 4, is_active: true } as any);
      await expect(service.reactivateEmployee(4)).rejects.toThrow('Nhân viên đang hoạt động.');
    });

    it('reactivateEmployee cập nhật is_active = true khi nhân viên đang ngừng hoạt động', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({ id: 4, is_active: false } as any);
      const updateSpy = vi.spyOn(prisma.employee, 'update').mockResolvedValue({ id: 4, is_active: true } as any);

      await service.reactivateEmployee(4);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { is_active: true },
      });
    });
  });
});
