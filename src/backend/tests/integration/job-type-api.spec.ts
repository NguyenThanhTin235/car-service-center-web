import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';

describe('Integration API - Job Types (/api/job-types)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-JOBT-API-01: GET /api/job-types', () => {
    it('trả 200 kèm danh sách và phân trang khi hỗ trợ search, page, limit, isActive', async () => {
      const countSpy = vi.spyOn(prisma.jobType, 'count').mockResolvedValue(2);
      const findManySpy = vi.spyOn(prisma.jobType, 'findMany').mockResolvedValue([
        { id: 1, name: 'Thay dầu động cơ', description: 'Định kỳ', is_active: true } as any,
        { id: 2, name: 'Thay dầu hộp số', description: 'Tự động', is_active: true } as any,
      ]);

      const res = await request(app).get(
        '/api/job-types?search=Thay%20d%E1%BA%A7u&page=1&limit=10&isActive=true'
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toEqual({
        id: 1,
        name: 'Thay dầu động cơ',
        description: 'Định kỳ',
        isActive: true,
      });
      expect(res.body.pagination).toEqual({
        totalRecords: 2,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
      });
      expect(countSpy).toHaveBeenCalledWith({
        where: { name: { contains: 'Thay dầu' }, is_active: true },
      });
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'Thay dầu' }, is_active: true },
          skip: 0,
          take: 10,
        })
      );
    });

    it('hỗ trợ all=true bỏ qua phân trang', async () => {
      vi.spyOn(prisma.jobType, 'count').mockResolvedValue(1);
      const findManySpy = vi.spyOn(prisma.jobType, 'findMany').mockResolvedValue([
        { id: 1, name: 'Kiểm tra gầm', description: null, is_active: true } as any,
      ]);

      const res = await request(app).get('/api/job-types?all=true');

      expect(res.status).toBe(200);
      expect(res.body.pagination.totalPages).toBe(1);
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({ skip: undefined, take: undefined })
      );
    });

    it('trả 500 khi DB gặp lỗi', async () => {
      vi.spyOn(prisma.jobType, 'count').mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app).get('/api/job-types');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ status: 'error', message: 'DB connection lost' });
    });
  });

  describe('ADM-JOBT-API-02: POST /api/job-types', () => {
    it('trả 201 khi tạo loại công việc hợp lệ', async () => {
      vi.spyOn(prisma.jobType, 'findFirst').mockResolvedValue(null);
      const created = {
        id: 12,
        name: 'Rửa khoang máy',
        description: 'Vệ sinh chuyên sâu',
        is_active: true,
      };
      vi.spyOn(prisma.jobType, 'create').mockResolvedValue(created as any);

      const res = await request(app)
        .post('/api/job-types')
        .send({ name: 'Rửa khoang máy', description: 'Vệ sinh chuyên sâu' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Tạo loại công việc thành công',
        data: created,
      });
    });

    it('trả 400 khi tên loại công việc đã tồn tại', async () => {
      vi.spyOn(prisma.jobType, 'findFirst').mockResolvedValue({ id: 1, name: 'Rửa khoang máy' } as any);

      const res = await request(app)
        .post('/api/job-types')
        .send({ name: 'Rửa khoang máy' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Tên loại công việc đã tồn tại.',
      });
    });
  });

  describe('ADM-JOBT-API-03: PUT /api/job-types/:id', () => {
    it('trả 200 khi cập nhật thành công', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue({
        id: 5,
        name: 'Bảo dưỡng phanh',
        description: 'Cũ',
        is_active: true,
      } as any);
      vi.spyOn(prisma.jobType, 'findFirst').mockResolvedValue(null);
      const updated = {
        id: 5,
        name: 'Bảo dưỡng phanh đĩa',
        description: 'Mới',
        is_active: true,
      };
      vi.spyOn(prisma.jobType, 'update').mockResolvedValue(updated as any);

      const res = await request(app)
        .put('/api/job-types/5')
        .send({ name: 'Bảo dưỡng phanh đĩa', description: 'Mới' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Cập nhật loại công việc thành công',
        data: updated,
      });
    });

    it('trả 400 khi đổi sang tên bị trùng', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue({
        id: 5,
        name: 'Bảo dưỡng phanh',
      } as any);
      vi.spyOn(prisma.jobType, 'findFirst').mockResolvedValue({
        id: 1,
        name: 'Thay dầu động cơ',
      } as any);

      const res = await request(app)
        .put('/api/job-types/5')
        .send({ name: 'Thay dầu động cơ' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Tên loại công việc đã tồn tại.',
      });
    });

    it('trả 404 khi không tìm thấy ID', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue(null);

      const res = await request(app)
        .put('/api/job-types/999')
        .send({ name: 'Không tồn tại' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy loại công việc.',
      });
    });
  });

  describe('ADM-JOBT-API-04: PATCH /api/job-types/:id/toggle', () => {
    it('trả 200 khi toggle trạng thái thành công', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue({
        id: 3,
        name: 'Điện thân xe',
        is_active: true,
      } as any);
      vi.spyOn(prisma.jobType, 'update').mockResolvedValue({
        id: 3,
        is_active: false,
      } as any);

      const res = await request(app).patch('/api/job-types/3/toggle');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Vô hiệu hóa thành công',
        data: { isActive: false },
      });
    });

    it('trả 404 khi không tìm thấy ID', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue(null);

      const res = await request(app).patch('/api/job-types/999/toggle');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy loại công việc.',
      });
    });
  });

  describe('ADM-JOBT-API-05: DELETE /api/job-types/:id', () => {
    it('trả 200 khi totalRefs === 0', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue({
        id: 7,
        name: 'Hạng mục nháp',
      } as any);
      vi.spyOn(prisma.jobTemplate, 'count').mockResolvedValue(0);
      vi.spyOn(prisma.job, 'count').mockResolvedValue(0);
      vi.spyOn(prisma.jobLabour, 'count').mockResolvedValue(0);
      vi.spyOn(prisma.jobType, 'delete').mockResolvedValue({ id: 7 } as any);

      const res = await request(app).delete('/api/job-types/7');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Xóa loại công việc thành công',
      });
    });

    it('trả 400 khi đang được tham chiếu', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue({
        id: 3,
        name: 'Sửa chữa động cơ',
      } as any);
      vi.spyOn(prisma.jobTemplate, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.job, 'count').mockResolvedValue(2);
      vi.spyOn(prisma.jobLabour, 'count').mockResolvedValue(0);

      const res = await request(app).delete('/api/job-types/3');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Không thể xóa loại công việc "Sửa chữa động cơ"');
    });

    it('trả 404 khi không tìm thấy ID', async () => {
      vi.spyOn(prisma.jobType, 'findUnique').mockResolvedValue(null);

      const res = await request(app).delete('/api/job-types/999');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy loại công việc.',
      });
    });
  });
});
