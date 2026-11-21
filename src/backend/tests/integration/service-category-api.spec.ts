import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';

describe('Integration API - Service Categories (/api/service-categories) (TICKET-ADM-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-CAT-API-01: GET /api/service-categories', () => {
    it('trả 200 kèm danh sách đã map templatesCount và pagination', async () => {
      vi.spyOn(prisma.serviceCategory, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.serviceCategory, 'findMany').mockResolvedValue([
        {
          id: 1,
          name: 'Bảo dưỡng định kỳ',
          description: 'Thay nhớt, lọc gió',
          is_active: true,
          sort_order: 1,
          _count: { services: 4 },
        } as any,
      ]);

      const response = await request(app).get('/api/service-categories?search=Bảo&page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual([
        {
          id: 1,
          name: 'Bảo dưỡng định kỳ',
          description: 'Thay nhớt, lọc gió',
          isActive: true,
          sortOrder: 1,
          templatesCount: 4,
        },
      ]);
      expect(response.body.pagination).toEqual({
        totalRecords: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
      });
    });

    it('trả 500 khi DB lỗi', async () => {
      vi.spyOn(prisma.serviceCategory, 'count').mockRejectedValue(new Error('DB connection lost'));

      const response = await request(app).get('/api/service-categories');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 'error',
        message: 'DB connection lost',
      });
    });
  });

  describe('ADM-CAT-API-02: POST /api/service-categories', () => {
    it('trả 201 khi tạo nhóm dịch vụ thành công', async () => {
      vi.spyOn(prisma.serviceCategory, 'count').mockResolvedValue(3);
      vi.spyOn(prisma.serviceCategory, 'create').mockResolvedValue({
        id: 4,
        name: 'Chăm sóc xe',
        description: 'Rửa xe, phủ ceramic',
        is_active: true,
        sort_order: 4,
      } as any);

      const response = await request(app)
        .post('/api/service-categories')
        .send({ name: 'Chăm sóc xe', description: 'Rửa xe, phủ ceramic' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Tạo nhóm dịch vụ thành công');
      expect(response.body.data).toMatchObject({
        id: 4,
        name: 'Chăm sóc xe',
        sort_order: 4,
      });
    });

    it('trả 400 khi tạo thất bại', async () => {
      vi.spyOn(prisma.serviceCategory, 'count').mockRejectedValue(new Error('Invalid category payload'));

      const response = await request(app).post('/api/service-categories').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid category payload',
      });
    });
  });

  describe('ADM-CAT-API-03: PUT /api/service-categories/:id', () => {
    it('trả 200 khi cập nhật thành công', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue({
        id: 2,
        name: 'Cũ',
        is_active: true,
      } as any);
      vi.spyOn(prisma.serviceCategory, 'update').mockResolvedValue({
        id: 2,
        name: 'Mới',
        description: 'Đã cập nhật',
        is_active: false,
      } as any);

      const response = await request(app)
        .put('/api/service-categories/2')
        .send({ name: 'Mới', description: 'Đã cập nhật', isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Cập nhật nhóm dịch vụ thành công');
      expect(response.body.data.name).toBe('Mới');
    });

    it('trả 404 khi không tìm thấy nhóm dịch vụ', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue(null);

      const response = await request(app)
        .put('/api/service-categories/999')
        .send({ name: 'Không tồn tại' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy nhóm dịch vụ.',
      });
    });
  });

  describe('ADM-CAT-API-04: DELETE /api/service-categories/:id', () => {
    it('trả 200 với { deleted: false, isDeactivated: true } khi _count.services > 0', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue({
        id: 5,
        name: 'Bảo dưỡng',
        is_active: true,
        _count: { services: 3 },
      } as any);
      vi.spyOn(prisma.serviceCategory, 'update').mockResolvedValue({
        id: 5,
        is_active: false,
      } as any);

      const response = await request(app).delete('/api/service-categories/5');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.deleted).toBe(false);
      expect(response.body.data.isDeactivated).toBe(true);
    });

    it('trả 200 với { deleted: true } khi _count.services === 0', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue({
        id: 8,
        name: 'Nhóm trống',
        is_active: true,
        _count: { services: 0 },
      } as any);
      vi.spyOn(prisma.serviceCategory, 'delete').mockResolvedValue({ id: 8 } as any);

      const response = await request(app).delete('/api/service-categories/8');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.deleted).toBe(true);
    });

    it('trả 404 khi không tìm thấy nhóm dịch vụ', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue(null);

      const response = await request(app).delete('/api/service-categories/9999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy nhóm dịch vụ.',
      });
    });
  });
});
