import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';

describe('Integration API - Services (/api/services) (TICKET-ADM-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-SRV-API-01: GET /api/services/categories & GET /api/services', () => {
    it('GET /api/services/categories trả 200 với danh sách danh mục active', async () => {
      vi.spyOn(prisma.serviceCategory, 'findMany').mockResolvedValue([
        { id: 1, name: 'Bảo dưỡng', is_active: true, sort_order: 1 } as any,
      ]);

      const response = await request(app).get('/api/services/categories');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(1);
    });

    it('GET /api/services trả 200 và hỗ trợ search, categoryId, limit=all', async () => {
      vi.spyOn(prisma.service, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.service, 'findMany').mockResolvedValue([
        {
          id: 11,
          name: 'Thay dầu động cơ',
          description: 'Dầu tổng hợp 5W-30',
          pricing_type: 'FIXED',
          fixed_price: 650000,
          is_active: true,
          category: { id: 1, name: 'Bảo dưỡng' },
          size_prices: [],
          created_at: new Date('2026-01-01T00:00:00Z'),
        } as any,
      ]);

      const response = await request(app).get('/api/services?search=Thay&categoryId=1&limit=all');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data[0]).toMatchObject({
        id: 11,
        name: 'Thay dầu động cơ',
        pricingType: 'FIXED',
        fixedPrice: 650000,
      });
      expect(response.body.pagination.totalPages).toBe(1);
    });

    it('trả 500 khi DB lỗi', async () => {
      vi.spyOn(prisma.service, 'count').mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/services');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Database error',
      });
    });
  });

  describe('ADM-SRV-API-02: POST /api/services', () => {
    it('trả 201 cho FIXED, VEHICLE_SIZE và LABOUR_PARTS khi hợp lệ', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue({ id: 1 } as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          service: {
            create: vi.fn().mockResolvedValue({ id: 21 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 21,
              name: 'Cân chỉnh thước lái',
              pricing_type: 'FIXED',
              fixed_price: 450000,
              category: { id: 1, name: 'Bảo dưỡng' },
              size_prices: [],
            }),
          },
          vehicleSizePrice: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        });
      });

      const resFixed = await request(app).post('/api/services').send({
        categoryId: 1,
        name: 'Cân chỉnh thước lái',
        pricingType: 'FIXED',
        fixedPrice: 450000,
      });
      expect(resFixed.status).toBe(201);
      expect(resFixed.body.status).toBe('success');

      const resSize = await request(app)
        .post('/api/services')
        .send({
          categoryId: 1,
          name: 'Rửa xe',
          pricingType: 'VEHICLE_SIZE',
          sizePrices: [
            { vehicleSize: 'SMALL', price: 80000 },
            { vehicleSize: 'SUV', price: 120000 },
          ],
        });
      expect(resSize.status).toBe(201);

      const resLabour = await request(app).post('/api/services').send({
        categoryId: 1,
        name: 'Đại tu máy',
        pricingType: 'LABOUR_PARTS',
      });
      expect(resLabour.status).toBe(201);
    });

    it('trả 400 khi categoryId không tồn tại, giá < 1000, giá lẻ hoặc sizePrices rỗng', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValueOnce(null);
      const resNoCat = await request(app).post('/api/services').send({
        categoryId: 999,
        name: 'Test',
        pricingType: 'FIXED',
        fixedPrice: 100000,
      });
      expect(resNoCat.status).toBe(400);
      expect(resNoCat.body.message).toBe('Không tìm thấy danh mục cha.');

      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue({ id: 1 } as any);

      const resMinPrice = await request(app).post('/api/services').send({
        categoryId: 1,
        name: 'Test',
        pricingType: 'FIXED',
        fixedPrice: 500,
      });
      expect(resMinPrice.status).toBe(400);

      const resOddPrice = await request(app).post('/api/services').send({
        categoryId: 1,
        name: 'Test',
        pricingType: 'FIXED',
        fixedPrice: 12500,
      });
      expect(resOddPrice.status).toBe(400);

      const resEmptySizes = await request(app).post('/api/services').send({
        categoryId: 1,
        name: 'Test',
        pricingType: 'VEHICLE_SIZE',
        sizePrices: [],
      });
      expect(resEmptySizes.status).toBe(400);
    });
  });

  describe('ADM-SRV-API-03: PUT /api/services/:id', () => {
    it('trả 200 khi cập nhật hợp lệ', async () => {
      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({ id: 5 } as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          service: {
            update: vi.fn().mockResolvedValue({ id: 5 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 5,
              name: 'Thay má phanh trước',
              pricing_type: 'FIXED',
              fixed_price: 800000,
              category: { id: 1, name: 'Phanh' },
              size_prices: [],
            }),
          },
          vehicleSizePrice: { deleteMany: vi.fn(), createMany: vi.fn() },
        });
      });

      const response = await request(app).put('/api/services/5').send({
        name: 'Thay má phanh trước',
        pricingType: 'FIXED',
        fixedPrice: 800000,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Cập nhật danh mục dịch vụ thành công');
    });

    it('trả 400 khi sai rule giá', async () => {
      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({ id: 5 } as any);

      const response = await request(app).put('/api/services/5').send({
        pricingType: 'FIXED',
        fixedPrice: 1550,
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('trả 404 khi không tìm thấy dịch vụ', async () => {
      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(null);

      const response = await request(app).put('/api/services/9999').send({
        name: 'Không tồn tại',
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy danh mục dịch vụ.',
      });
    });
  });

  describe('ADM-SRV-API-04: PATCH /api/services/:id/toggle', () => {
    it('trả 200 khi đổi trạng thái is_active', async () => {
      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({
        id: 10,
        is_active: true,
      } as any);
      vi.spyOn(prisma.service, 'update').mockResolvedValue({
        id: 10,
        is_active: false,
      } as any);

      const response = await request(app).patch('/api/services/10/toggle');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        message: 'Vô hiệu hóa thành công',
        data: { isActive: false },
      });
    });

    it('trả 404 khi không tìm thấy dịch vụ', async () => {
      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(null);

      const response = await request(app).patch('/api/services/9999/toggle');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Không tìm thấy danh mục dịch vụ.',
      });
    });
  });
});
