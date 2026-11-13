import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';

describe('Integration API - System Catalogs (/api/system-catalogs & /api/catalogs)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-SYSCAT-API-01: GET /api/system-catalogs & /api/catalogs', () => {
    it('GET /api/system-catalogs trả 200 kèm typeCounts và phân trang', async () => {
      vi.spyOn(prisma.systemCatalog, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.systemCatalog, 'findMany').mockResolvedValue([
        {
          id: 1,
          catalog_type: 'UOM',
          name: 'Cái',
          description: 'Đơn vị cái',
          is_active: true,
          sort_order: 1,
        } as any,
      ]);
      vi.spyOn(prisma.systemCatalog, 'groupBy').mockResolvedValue([
        { catalog_type: 'UOM', _count: { id: 4 } },
        { catalog_type: 'CANCEL_REASON', _count: { id: 2 } },
      ] as any);

      const res = await request(app).get('/api/system-catalogs?catalogType=UOM&page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toEqual([
        {
          id: 1,
          catalogType: 'UOM',
          name: 'Cái',
          description: 'Đơn vị cái',
          isActive: true,
          sortOrder: 1,
        },
      ]);
      expect(res.body.typeCounts).toEqual({
        UOM: 4,
        CANCEL_REASON: 2,
        ADJUST_REASON: 0,
        TERMS: 0,
      });
    });

    it('alias GET /api/catalogs cũng trả 200 kèm typeCounts', async () => {
      vi.spyOn(prisma.systemCatalog, 'count').mockResolvedValue(0);
      vi.spyOn(prisma.systemCatalog, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.systemCatalog, 'groupBy').mockResolvedValue([] as any);

      const res = await request(app).get('/api/catalogs');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.typeCounts).toEqual({
        UOM: 0,
        CANCEL_REASON: 0,
        ADJUST_REASON: 0,
        TERMS: 0,
      });
    });

    it('trả 500 khi DB gặp lỗi', async () => {
      vi.spyOn(prisma.systemCatalog, 'count').mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/system-catalogs');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ status: 'error', message: 'Database error' });
    });
  });

  describe('ADM-SYSCAT-API-02: POST /api/system-catalogs & /api/catalogs', () => {
    it('POST /api/system-catalogs trả 201 khi tạo hợp lệ', async () => {
      vi.spyOn(prisma.systemCatalog, 'findFirst').mockResolvedValue(null);
      const created = {
        id: 21,
        catalog_type: 'CANCEL_REASON',
        name: 'Khách đổi lịch',
        description: 'Hủy trước giờ hẹn',
        sort_order: 1,
        is_active: true,
      };
      vi.spyOn(prisma.systemCatalog, 'create').mockResolvedValue(created as any);

      const res = await request(app).post('/api/system-catalogs').send({
        catalogType: 'CANCEL_REASON',
        name: 'Khách đổi lịch',
        description: 'Hủy trước giờ hẹn',
        sortOrder: 1,
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Tạo danh mục chung thành công',
        data: created,
      });
    });

    it('POST /api/catalogs trả 400 khi trùng (catalog_type, name)', async () => {
      vi.spyOn(prisma.systemCatalog, 'findFirst').mockResolvedValue({
        id: 1,
        catalog_type: 'UOM',
        name: 'Lít',
      } as any);

      const res = await request(app).post('/api/catalogs').send({
        catalogType: 'UOM',
        name: 'Lít',
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Tên danh mục đã tồn tại trong nhóm này.',
      });
    });
  });

  describe('ADM-SYSCAT-API-03: PUT /api/system-catalogs/:id', () => {
    it('trả 200 khi cập nhật thành công', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue({
        id: 5,
        catalog_type: 'ADJUST_REASON',
        name: 'Hao hụt kho',
      } as any);
      vi.spyOn(prisma.systemCatalog, 'findFirst').mockResolvedValue(null);
      const updated = {
        id: 5,
        catalog_type: 'ADJUST_REASON',
        name: 'Kiểm kê định kỳ',
        description: 'Điều chỉnh sau kiểm kê',
        is_active: true,
        sort_order: 2,
      };
      vi.spyOn(prisma.systemCatalog, 'update').mockResolvedValue(updated as any);

      const res = await request(app).put('/api/system-catalogs/5').send({
        name: 'Kiểm kê định kỳ',
        description: 'Điều chỉnh sau kiểm kê',
        sortOrder: 2,
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Cập nhật danh mục chung thành công',
        data: updated,
      });
    });

    it('trả 400 khi trùng tên trong cùng catalog_type', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue({
        id: 5,
        catalog_type: 'UOM',
        name: 'Cái',
      } as any);
      vi.spyOn(prisma.systemCatalog, 'findFirst').mockResolvedValue({
        id: 2,
        catalog_type: 'UOM',
        name: 'Bộ',
      } as any);

      const res = await request(app).put('/api/system-catalogs/5').send({ name: 'Bộ' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Tên danh mục đã tồn tại trong nhóm này.',
      });
    });

    it('trả 404 khi không tìm thấy ID', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue(null);

      const res = await request(app).put('/api/system-catalogs/999').send({ name: 'Mới' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy danh mục chung.',
      });
    });
  });

  describe('ADM-SYSCAT-API-04: PATCH /api/system-catalogs/:id/toggle', () => {
    it('trả 200 khi toggle thành công', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue({
        id: 6,
        is_active: false,
      } as any);
      vi.spyOn(prisma.systemCatalog, 'update').mockResolvedValue({
        id: 6,
        is_active: true,
      } as any);

      const res = await request(app).patch('/api/system-catalogs/6/toggle');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Kích hoạt thành công',
        data: { isActive: true },
      });
    });

    it('trả 404 khi không tìm thấy ID', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue(null);

      const res = await request(app).patch('/api/system-catalogs/999/toggle');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy danh mục chung.',
      });
    });
  });

  describe('ADM-SYSCAT-API-05: DELETE /api/system-catalogs/:id', () => {
    it('trả 200 khi không có tham chiếu', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue({
        id: 10,
        name: 'Hộp',
        _count: { part_categories: 0, brand_items: 0 },
      } as any);
      vi.spyOn(prisma.systemCatalog, 'delete').mockResolvedValue({ id: 10 } as any);

      const res = await request(app).delete('/api/system-catalogs/10');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        message: 'Xóa danh mục thành công',
        data: { id: 10, name: 'Hộp' },
      });
    });

    it('trả 400 khi còn part_categories hoặc brand_items', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue({
        id: 11,
        name: 'Lít',
        _count: { part_categories: 0, brand_items: 3 },
      } as any);

      const res = await request(app).delete('/api/system-catalogs/11');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        message:
          'Không thể xóa danh mục này do đã phát sinh liên kết dữ liệu trong hệ thống. Bạn có thể chọn vô hiệu hóa thay thế.',
      });
    });

    it('trả 404 khi không tìm thấy ID', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue(null);

      const res = await request(app).delete('/api/system-catalogs/999');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy danh mục chung.',
      });
    });
  });
});
