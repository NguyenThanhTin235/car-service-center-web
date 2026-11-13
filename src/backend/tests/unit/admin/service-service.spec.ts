import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceService } from '../../../src/services/service.service';
import prisma from '../../../src/utils/prisma';

describe('Unit - ServiceService (TICKET-ADM-05)', () => {
  const service = new ServiceService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-SRV-UT-01: getCategories & getServices', () => {
    it('getCategories lấy ServiceCategory active sắp xếp theo sort_order asc', async () => {
      const findManySpy = vi.spyOn(prisma.serviceCategory, 'findMany').mockResolvedValue([
        { id: 1, name: 'Bảo dưỡng', is_active: true, sort_order: 1 } as any,
      ]);

      const result = await service.getCategories();

      expect(findManySpy).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
      });
      expect(result).toHaveLength(1);
    });

    it('getServices hỗ trợ search, categoryId, isActive và all=true', async () => {
      const countSpy = vi.spyOn(prisma.service, 'count').mockResolvedValue(2);
      const findManySpy = vi.spyOn(prisma.service, 'findMany').mockResolvedValue([
        {
          id: 10,
          name: 'Rửa xe chi tiết',
          description: 'Rửa xe 3 bước',
          pricing_type: 'VEHICLE_SIZE',
          fixed_price: null,
          is_active: true,
          category: { id: 2, name: 'Chăm sóc xe' },
          size_prices: [
            { vehicle_size: 'SMALL', price: 100000 },
            { vehicle_size: 'SUV', price: 150000 },
          ],
          created_at: new Date('2026-01-01T00:00:00Z'),
        } as any,
      ]);

      const result = await service.getServices('Rửa xe', 2, 1, 10, true, true);

      expect(countSpy).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Rửa xe' },
          category_id: 2,
          is_active: true,
        },
      });
      expect(findManySpy).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Rửa xe' },
          category_id: 2,
          is_active: true,
        },
        skip: undefined,
        take: undefined,
        include: {
          category: true,
          size_prices: true,
        },
        orderBy: { name: 'asc' },
      });
      expect(result.data[0]).toMatchObject({
        id: 10,
        name: 'Rửa xe chi tiết',
        pricingType: 'VEHICLE_SIZE',
        isActive: true,
        category: { id: 2, name: 'Chăm sóc xe' },
        sizePrices: [
          { vehicleSize: 'SMALL', price: 100000 },
          { vehicleSize: 'SUV', price: 150000 },
        ],
      });
      expect(result.pagination).toEqual({
        totalRecords: 2,
        totalPages: 1,
        currentPage: 1,
        limit: 2,
      });
    });
  });

  describe('ADM-SRV-UT-02: createService (categoryId, FIXED, LABOUR_PARTS)', () => {
    it('ném lỗi khi categoryId không tồn tại', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createService({
          categoryId: 999,
          name: 'Thay nhớt',
          pricingType: 'FIXED',
          fixedPrice: 500000,
        })
      ).rejects.toThrow('Không tìm thấy danh mục cha.');
    });

    it('FIXED: chặn fixedPrice < 1000, số thập phân, hoặc không chia hết cho 1000', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue({ id: 1 } as any);

      await expect(
        service.createService({
          categoryId: 1,
          name: 'Dịch vụ A',
          pricingType: 'FIXED',
          fixedPrice: 500,
        })
      ).rejects.toThrow('Đơn giá cố định tối thiểu phải từ 1.000 ₫ trở lên.');

      await expect(
        service.createService({
          categoryId: 1,
          name: 'Dịch vụ A',
          pricingType: 'FIXED',
          fixedPrice: 1500.5,
        })
      ).rejects.toThrow('Đơn giá cố định phải là số nguyên (VNĐ), không được là số thập phân.');

      await expect(
        service.createService({
          categoryId: 1,
          name: 'Dịch vụ A',
          pricingType: 'FIXED',
          fixedPrice: 1000232,
        })
      ).rejects.toThrow('Đơn giá cố định phải tròn theo đơn vị nghìn đồng');
    });

    it('FIXED & LABOUR_PARTS: tạo thành công trong $transaction', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue({ id: 1 } as any);

      const txCreate = vi.fn().mockResolvedValue({ id: 15 });
      const txFindUnique = vi.fn().mockResolvedValue({
        id: 15,
        name: 'Kiểm tra tổng quát',
        pricing_type: 'FIXED',
        fixed_price: 200000,
      });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          service: { create: txCreate, findUnique: txFindUnique },
          vehicleSizePrice: { createMany: vi.fn() },
        });
      });

      const createdFixed = await service.createService({
        categoryId: 1,
        name: 'Kiểm tra tổng quát',
        pricingType: 'FIXED',
        fixedPrice: 200000,
      });

      expect(txCreate).toHaveBeenCalledWith({
        data: {
          category_id: 1,
          name: 'Kiểm tra tổng quát',
          description: undefined,
          pricing_type: 'FIXED',
          fixed_price: 200000,
        },
      });
      expect(createdFixed?.id).toBe(15);

      await service.createService({
        categoryId: 1,
        name: 'Sửa chữa động cơ',
        pricingType: 'LABOUR_PARTS',
      });

      expect(txCreate).toHaveBeenLastCalledWith({
        data: {
          category_id: 1,
          name: 'Sửa chữa động cơ',
          description: undefined,
          pricing_type: 'LABOUR_PARTS',
          fixed_price: null,
        },
      });
    });
  });

  describe('ADM-SRV-UT-03: createService (VEHICLE_SIZE)', () => {
    it('yêu cầu sizePrices không rỗng và từng giá phải là bội số 1000 >= 1000', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue({ id: 1 } as any);

      await expect(
        service.createService({
          categoryId: 1,
          name: 'Rửa xe',
          pricingType: 'VEHICLE_SIZE',
          sizePrices: [],
        })
      ).rejects.toThrow('Vui lòng nhập đơn giá cho ít nhất một cỡ xe.');

      await expect(
        service.createService({
          categoryId: 1,
          name: 'Rửa xe',
          pricingType: 'VEHICLE_SIZE',
          sizePrices: [{ vehicleSize: 'SMALL', price: 500 }],
        })
      ).rejects.toThrow('Đơn giá cho cỡ xe SMALL tối thiểu phải từ 1.000 ₫ trở lên.');

      await expect(
        service.createService({
          categoryId: 1,
          name: 'Rửa xe',
          pricingType: 'VEHICLE_SIZE',
          sizePrices: [{ vehicleSize: 'SUV', price: 125500 }],
        })
      ).rejects.toThrow('Đơn giá cho cỡ xe SUV phải tròn theo đơn vị nghìn đồng');
    });

    it('lưu bản ghi VehicleSizePrice vào DB trong $transaction khi hợp lệ', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue({ id: 2 } as any);

      const txCreate = vi.fn().mockResolvedValue({ id: 30 });
      const txSizeCreateMany = vi.fn().mockResolvedValue({ count: 2 });
      const txFindUnique = vi.fn().mockResolvedValue({
        id: 30,
        name: 'Phủ gầm chống rỉ',
        pricing_type: 'VEHICLE_SIZE',
        size_prices: [
          { vehicle_size: 'SMALL', price: 2500000 },
          { vehicle_size: 'SUV', price: 3500000 },
        ],
      });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          service: { create: txCreate, findUnique: txFindUnique },
          vehicleSizePrice: { createMany: txSizeCreateMany },
        });
      });

      const result = await service.createService({
        categoryId: 2,
        name: 'Phủ gầm chống rỉ',
        pricingType: 'VEHICLE_SIZE',
        sizePrices: [
          { vehicleSize: 'SMALL', price: 2500000 },
          { vehicleSize: 'SUV', price: 3500000 },
        ],
      });

      expect(txSizeCreateMany).toHaveBeenCalledWith({
        data: [
          { service_id: 30, vehicle_size: 'SMALL', price: 2500000 },
          { service_id: 30, vehicle_size: 'SUV', price: 3500000 },
        ],
        skipDuplicates: true,
      });
      expect(result?.size_prices).toHaveLength(2);
    });
  });

  describe('ADM-SRV-UT-04: updateService', () => {
    it('ném lỗi khi không tìm thấy dịch vụ', async () => {
      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue(null);

      await expect(service.updateService(999, { name: 'Test' })).rejects.toThrow(
        'Không tìm thấy danh mục dịch vụ.'
      );
    });

    it('validate giá khi cập nhật sang FIXED hoặc VEHICLE_SIZE', async () => {
      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({ id: 5 } as any);

      await expect(
        service.updateService(5, { pricingType: 'FIXED', fixedPrice: 1200 })
      ).rejects.toThrow('Đơn giá cố định phải tròn theo đơn vị nghìn đồng');

      await expect(
        service.updateService(5, { pricingType: 'VEHICLE_SIZE', sizePrices: [] })
      ).rejects.toThrow('Vui lòng nhập đơn giá cho ít nhất một cỡ xe.');
    });

    it('thay thế toàn bộ VehicleSizePrice (deleteMany + createMany) trong $transaction', async () => {
      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({ id: 5 } as any);

      const txUpdate = vi.fn().mockResolvedValue({ id: 5 });
      const txDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
      const txCreateMany = vi.fn().mockResolvedValue({ count: 2 });
      const txFindUnique = vi.fn().mockResolvedValue({
        id: 5,
        name: 'Đánh bóng xe',
        pricing_type: 'VEHICLE_SIZE',
        size_prices: [
          { vehicle_size: 'MEDIUM', price: 1200000 },
          { vehicle_size: 'LARGE', price: 1500000 },
        ],
      });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          service: { update: txUpdate, findUnique: txFindUnique },
          vehicleSizePrice: { deleteMany: txDeleteMany, createMany: txCreateMany },
        });
      });

      const result = await service.updateService(5, {
        name: 'Đánh bóng xe',
        pricingType: 'VEHICLE_SIZE',
        sizePrices: [
          { vehicleSize: 'MEDIUM', price: 1200000 },
          { vehicleSize: 'LARGE', price: 1500000 },
        ],
      });

      expect(txDeleteMany).toHaveBeenCalledWith({ where: { service_id: 5 } });
      expect(txCreateMany).toHaveBeenCalledWith({
        data: [
          { service_id: 5, vehicle_size: 'MEDIUM', price: 1200000 },
          { service_id: 5, vehicle_size: 'LARGE', price: 1500000 },
        ],
        skipDuplicates: true,
      });
      expect(result?.id).toBe(5);
    });
  });
});
