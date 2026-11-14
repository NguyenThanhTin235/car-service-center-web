import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceCategoryService } from '../../../src/services/service-category.service';
import prisma from '../../../src/utils/prisma';

describe('Unit - ServiceCategoryService (TICKET-ADM-04)', () => {
  const service = new ServiceCategoryService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-CAT-UT-01: getCategories', () => {
    it('lọc theo search, phân trang và map đúng templatesCount (_count.services)', async () => {
      const countSpy = vi.spyOn(prisma.serviceCategory, 'count').mockResolvedValue(12);
      const findManySpy = vi.spyOn(prisma.serviceCategory, 'findMany').mockResolvedValue([
        {
          id: 2,
          name: 'Bảo dưỡng định kỳ',
          description: 'Các gói bảo dưỡng theo km',
          is_active: true,
          sort_order: 2,
          _count: { services: 5 },
        } as any,
        {
          id: 3,
          name: 'Bảo dưỡng phanh',
          description: null,
          is_active: false,
          sort_order: 3,
          _count: { services: 0 },
        } as any,
      ]);

      const result = await service.getCategories('Bảo dưỡng', 2, 5);

      expect(countSpy).toHaveBeenCalledWith({
        where: { name: { contains: 'Bảo dưỡng' } },
      });
      expect(findManySpy).toHaveBeenCalledWith({
        where: { name: { contains: 'Bảo dưỡng' } },
        skip: 5,
        take: 5,
        orderBy: { sort_order: 'asc' },
        include: {
          _count: {
            select: { services: true },
          },
        },
      });
      expect(result.data).toEqual([
        {
          id: 2,
          name: 'Bảo dưỡng định kỳ',
          description: 'Các gói bảo dưỡng theo km',
          isActive: true,
          sortOrder: 2,
          templatesCount: 5,
        },
        {
          id: 3,
          name: 'Bảo dưỡng phanh',
          description: null,
          isActive: false,
          sortOrder: 3,
          templatesCount: 0,
        },
      ]);
      expect(result.pagination).toEqual({
        totalRecords: 12,
        totalPages: 3,
        currentPage: 2,
        limit: 5,
      });
    });

    it('không truyền search thì where rỗng và dùng mặc định page=1, limit=10', async () => {
      const countSpy = vi.spyOn(prisma.serviceCategory, 'count').mockResolvedValue(0);
      const findManySpy = vi.spyOn(prisma.serviceCategory, 'findMany').mockResolvedValue([]);

      const result = await service.getCategories();

      expect(countSpy).toHaveBeenCalledWith({ where: {} });
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 10,
        })
      );
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        totalRecords: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10,
      });
    });
  });

  describe('ADM-CAT-UT-02: createCategory', () => {
    it('tự động tính sort_order = count + 1 và mặc định is_active = true', async () => {
      const countSpy = vi.spyOn(prisma.serviceCategory, 'count').mockResolvedValue(4);
      const createSpy = vi.spyOn(prisma.serviceCategory, 'create').mockResolvedValue({
        id: 5,
        name: 'Đồng sơn',
        description: 'Sơn sửa thân vỏ',
        is_active: true,
        sort_order: 5,
      } as any);

      const result = await service.createCategory({
        name: 'Đồng sơn',
        description: 'Sơn sửa thân vỏ',
      });

      expect(countSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          name: 'Đồng sơn',
          description: 'Sơn sửa thân vỏ',
          is_active: true,
          sort_order: 5,
        },
      });
      expect(result.sort_order).toBe(5);
      expect(result.is_active).toBe(true);
    });

    it('tôn trọng isActive = false khi được truyền tường minh', async () => {
      vi.spyOn(prisma.serviceCategory, 'count').mockResolvedValue(2);
      const createSpy = vi.spyOn(prisma.serviceCategory, 'create').mockResolvedValue({
        id: 3,
        name: 'Nhóm tạm ẩn',
        is_active: false,
        sort_order: 3,
      } as any);

      await service.createCategory({ name: 'Nhóm tạm ẩn', isActive: false });

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          name: 'Nhóm tạm ẩn',
          description: undefined,
          is_active: false,
          sort_order: 3,
        },
      });
    });
  });

  describe('ADM-CAT-UT-03: updateCategory', () => {
    it('cập nhật name, description, isActive khi nhóm dịch vụ tồn tại', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue({
        id: 7,
        name: 'Tên cũ',
        is_active: true,
      } as any);
      const updateSpy = vi.spyOn(prisma.serviceCategory, 'update').mockResolvedValue({
        id: 7,
        name: 'Tên mới',
        description: 'Mô tả mới',
        is_active: false,
      } as any);

      const result = await service.updateCategory(7, {
        name: 'Tên mới',
        description: 'Mô tả mới',
        isActive: false,
      });

      expect(prisma.serviceCategory.findUnique).toHaveBeenCalledWith({ where: { id: 7 } });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 7 },
        data: {
          name: 'Tên mới',
          description: 'Mô tả mới',
          is_active: false,
        },
      });
      expect(result.name).toBe('Tên mới');
    });

    it('ném lỗi "Không tìm thấy nhóm dịch vụ." khi ID không tồn tại', async () => {
      vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue(null);
      const updateSpy = vi.spyOn(prisma.serviceCategory, 'update');

      await expect(service.updateCategory(999, { name: 'Test' })).rejects.toThrow(
        'Không tìm thấy nhóm dịch vụ.'
      );
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
