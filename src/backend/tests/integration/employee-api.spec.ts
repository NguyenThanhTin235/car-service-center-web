import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { EmployeePosition, JobStatus, WorkOrderStatus } from '@prisma/client';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';

describe('Integration API - Employees (/api/employees) [TICKET-ADM-03]', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ADM-EMP-API-01: GET /api/employees/skills & GET /api/employees', () => {
    it('GET /api/employees/skills trả 200 kèm danh sách kỹ năng đang active', async () => {
      const mockSkills = [
        { id: 1, name: 'Chẩn đoán OBD-II', is_active: true },
        { id: 2, name: 'Sửa chữa động cơ', is_active: true },
      ];
      vi.spyOn(prisma.skill, 'findMany').mockResolvedValue(mockSkills as any);

      const res = await request(app).get('/api/employees/skills');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        data: mockSkills,
      });
    });

    it('GET /api/employees trả 200 kèm danh sách nhân viên đã chuẩn hóa & phân trang', async () => {
      vi.spyOn(prisma.employee, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.employee, 'findMany').mockResolvedValue([
        {
          id: 1,
          full_name: 'Nguyễn Văn Kỹ Thuật',
          position: EmployeePosition.TECHNICIAN,
          is_active: true,
          created_at: new Date('2026-11-10T08:00:00Z'),
          user: {
            id: 10,
            email: 'tech1@autocare.vn',
            phone: '0901234567',
            is_active: true,
            roles: [{ role: { id: 4, name: 'TECHNICIAN' } }],
          },
          skills: [{ skill: { id: 1, name: 'Chẩn đoán OBD-II' } }],
        },
      ] as any);

      const res = await request(app).get('/api/employees?search=Kỹ&position=TECHNICIAN&status=active&page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        id: 1,
        fullName: 'Nguyễn Văn Kỹ Thuật',
        position: 'TECHNICIAN',
        isActive: true,
        user: { id: 10, email: 'tech1@autocare.vn', phone: '0901234567', isActive: true },
        skills: [{ id: 1, name: 'Chẩn đoán OBD-II' }],
      });
      expect(res.body.pagination).toEqual({
        totalRecords: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
      });
    });

    it('GET /api/employees trả 500 khi DB lỗi', async () => {
      vi.spyOn(prisma.employee, 'count').mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app).get('/api/employees');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        status: 'error',
        message: 'DB connection lost',
      });
    });
  });

  describe('ADM-EMP-API-02: GET /api/employees/:id', () => {
    it('trả 200 kèm chi tiết nhân viên, user roles và skills', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({
        id: 2,
        full_name: 'Trần Cố Vấn',
        position: EmployeePosition.ADVISOR,
        is_active: true,
        created_at: new Date('2026-11-10T08:00:00Z'),
        user: {
          id: 20,
          email: 'advisor@autocare.vn',
          phone: '0902223333',
          is_active: true,
          address: 'TP.HCM',
          roles: [{ role: { id: 3, name: 'ADVISOR' } }],
        },
        skills: [],
      } as any);

      const res = await request(app).get('/api/employees/2');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toMatchObject({
        id: 2,
        fullName: 'Trần Cố Vấn',
        position: 'ADVISOR',
        isActive: true,
        user: {
          id: 20,
          email: 'advisor@autocare.vn',
          roles: ['ADVISOR'],
        },
      });
    });

    it('trả 404 khi không tìm thấy nhân viên', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(null);

      const res = await request(app).get('/api/employees/9999');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy nhân viên.',
      });
    });
  });

  describe('ADM-EMP-API-03: POST /api/employees', () => {
    it('trả 201 khi tạo nhân viên hợp lệ', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 30 } as any);
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(null);

      const createdRecord = {
        id: 15,
        full_name: 'Lê Kỹ Thuật',
        position: EmployeePosition.TECHNICIAN,
        user_id: 30,
        is_active: true,
        user: { id: 30, email: 'le@autocare.vn', phone: '0903334444' },
        skills: [{ skill: { id: 1, name: 'Chẩn đoán OBD-II' } }],
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          employee: {
            create: vi.fn().mockResolvedValue({ id: 15 }),
            findUnique: vi.fn().mockResolvedValue(createdRecord),
          },
          employeeSkill: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        });
      });

      const res = await request(app).post('/api/employees').send({
        fullName: 'Lê Kỹ Thuật',
        position: 'TECHNICIAN',
        userId: 30,
        skillIds: [1],
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Tạo nhân viên thành công');
      expect(res.body.data.id).toBe(15);
    });

    it('trả 400 khi userId không tồn tại', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const res = await request(app).post('/api/employees').send({
        fullName: 'Lê Kỹ Thuật',
        position: 'TECHNICIAN',
        userId: 999,
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy tài khoản hệ thống được chỉ định.',
      });
    });

    it('trả 400 khi userId đã gắn cho nhân viên khác', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 30 } as any);
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({ id: 8, user_id: 30 } as any);

      const res = await request(app).post('/api/employees').send({
        fullName: 'Lê Kỹ Thuật',
        position: 'TECHNICIAN',
        userId: 30,
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Tài khoản này đã được liên kết với nhân viên khác.',
      });
    });
  });

  describe('ADM-EMP-API-04: PUT /api/employees/:id', () => {
    it('trả 200 khi cập nhật nhân viên thành công', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({
        id: 15,
        full_name: 'Lê Kỹ Thuật',
        position: EmployeePosition.TECHNICIAN,
        user_id: 30,
        is_active: true,
      } as any);

      const updatedRecord = {
        id: 15,
        full_name: 'Lê Kỹ Thuật Cao Cấp',
        position: EmployeePosition.QC_STAFF,
        user: { id: 30, email: 'le@autocare.vn', phone: '0903334444' },
        skills: [{ skill: { id: 2, name: 'Sửa chữa động cơ' } }],
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          employee: {
            update: vi.fn().mockResolvedValue({ id: 15 }),
            findUnique: vi.fn().mockResolvedValue(updatedRecord),
          },
          employeeSkill: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        });
      });

      const res = await request(app).put('/api/employees/15').send({
        fullName: 'Lê Kỹ Thuật Cao Cấp',
        position: 'QC_STAFF',
        skillIds: [2],
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Cập nhật nhân viên thành công');
      expect(res.body.data.full_name).toBe('Lê Kỹ Thuật Cao Cấp');
    });

    it('trả 400 khi cố tắt isActive: false nhưng còn việc/phiếu mở', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({
        id: 15,
        user_id: 30,
        position: EmployeePosition.TECHNICIAN,
        is_active: true,
      } as any);
      vi.spyOn(prisma.jobLabour, 'findMany').mockResolvedValue([
        {
          job: {
            id: 1,
            name: 'Thay dầu máy',
            status: JobStatus.IN_PROGRESS,
            wo_service: { work_order: { id: 10, wo_number: 'WO-202611-010', status: WorkOrderStatus.IN_PROGRESS } },
          },
        },
      ] as any);

      const res = await request(app).put('/api/employees/15').send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('đang được phân công 1 công việc chưa hoàn thành');
    });

    it('trả 404 khi không tìm thấy nhân viên', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(null);

      const res = await request(app).put('/api/employees/9999').send({ fullName: 'Test' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy nhân viên.',
      });
    });
  });

  describe('ADM-EMP-API-05: DELETE /api/employees/:id', () => {
    it('trả 204 empty body khi vô hiệu hóa hợp lệ', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({
        id: 15,
        user_id: 30,
        is_active: true,
      } as any);
      vi.spyOn(prisma.jobLabour, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.workOrder, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.employee, 'update').mockResolvedValue({ id: 15, is_active: false } as any);

      const res = await request(app).delete('/api/employees/15');

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
    });

    it('trả 400 khi nhân viên còn việc mở hoặc đã ở trạng thái ngừng hoạt động', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValueOnce({
        id: 15,
        user_id: 30,
        is_active: false,
      } as any);

      const resAlreadyInactive = await request(app).delete('/api/employees/15');
      expect(resAlreadyInactive.status).toBe(400);
      expect(resAlreadyInactive.body).toEqual({
        status: 'error',
        message: 'Nhân viên đã ở trạng thái ngừng hoạt động trước đó.',
      });

      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValueOnce({
        id: 16,
        user_id: 31,
        is_active: true,
      } as any);
      vi.spyOn(prisma.jobLabour, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.workOrder, 'findMany').mockResolvedValue([
        { id: 50, wo_number: 'WO-202611-050', status: WorkOrderStatus.IN_PROGRESS },
      ] as any);

      const resAdvisorBusy = await request(app).delete('/api/employees/16');
      expect(resAdvisorBusy.status).toBe(400);
      expect(resAdvisorBusy.body.message).toContain('Cố vấn đang trực tiếp phụ trách 1 lệnh sửa chữa chưa đóng');
    });

    it('trả 404 khi không tìm thấy nhân viên', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(null);

      const res = await request(app).delete('/api/employees/9999');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy nhân viên.',
      });
    });
  });

  describe('ADM-EMP-API-06: PATCH /api/employees/:id/reactivate', () => {
    it('trả 200 khi khôi phục nhân viên thành công', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({ id: 15, is_active: false } as any);
      vi.spyOn(prisma.employee, 'update').mockResolvedValue({ id: 15, is_active: true } as any);

      const res = await request(app).patch('/api/employees/15/reactivate');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Khôi phục nhân viên thành công',
      });
    });

    it('trả 400 nếu nhân viên đang hoạt động', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue({ id: 15, is_active: true } as any);

      const res = await request(app).patch('/api/employees/15/reactivate');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Nhân viên đang hoạt động.',
      });
    });

    it('trả 404 khi không tìm thấy nhân viên', async () => {
      vi.spyOn(prisma.employee, 'findUnique').mockResolvedValue(null);

      const res = await request(app).patch('/api/employees/9999/reactivate');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy nhân viên.',
      });
    });
  });
});
