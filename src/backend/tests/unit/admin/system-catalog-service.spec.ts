import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SystemCatalogService } from '../../../src/services/system-catalog.service';
import prisma from '../../../src/utils/prisma';

describe('Unit - SystemCatalogService (TICKET-ADM-07)', () => {
  const service = new SystemCatalogService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-SYSCAT-UT-01: getCatalogs', () => {
    it('lọc theo search, catalogType, phân trang và trả đúng typeCounts', async () => {
      const countSpy = vi.spyOn(prisma.systemCatalog, 'count').mockResolvedValue(1);
      const findManySpy = vi.spyOn(prisma.systemCatalog, 'findMany').mockResolvedValue([
        {
          id: 1,
          catalog_type: 'UOM',
          name: 'Lít',
          description: 'Đơn vị thể tích',
          is_active: true,
          sort_order: 1,
        } as any,
      ]);
      vi.spyOn(prisma.systemCatalog, 'groupBy').mockResolvedValue([
        { catalog_type: 'UOM', _count: { id: 5 } },
        { catalog_type: 'CANCEL_REASON', _count: { id: 3 } },
        { catalog_type: 'TERMS', _count: { id: 2 } },
      ] as any);

      const result = await service.getCatalogs('Lít', 'UOM', 2, 5);

      expect(countSpy).toHaveBeenCalledWith({
        where: { name: { contains: 'Lít' }, catalog_type: 'UOM' },
      });
      expect(findManySpy).toHaveBeenCalledWith({
        where: { name: { contains: 'Lít' }, catalog_type: 'UOM' },
        skip: 5,
        take: 5,
        orderBy: [{ catalog_type: 'asc' }, { sort_order: 'asc' }],
      });
      expect(result.data).toEqual([
        {
          id: 1,
          catalogType: 'UOM',
          name: 'Lít',
          description: 'Đơn vị thể tích',
          isActive: true,
          sortOrder: 1,
        },
      ]);
      expect(result.pagination).toEqual({
        totalRecords: 1,
        totalPages: 1,
        currentPage: 2,
        limit: 5,
      });
      expect(result.typeCounts).toEqual({
        UOM: 5,
        CANCEL_REASON: 3,
        ADJUST_REASON: 0,
        TERMS: 2,
      });
    });
  });

  describe('ADM-SYSCAT-UT-02: createCatalog', () => {
    it('chặn tạo khi trùng cặp (catalog_type, name)', async () => {
      const findFirstSpy = vi
        .spyOn(prisma.systemCatalog, 'findFirst')
        .mockResolvedValue({ id: 2, catalog_type: 'UOM', name: 'Cái' } as any);
      const createSpy = vi.spyOn(prisma.systemCatalog, 'create');

      await expect(
        service.createCatalog({
          catalogType: 'UOM' as any,
          name: 'Cái',
          description: 'Đơn vị đếm',
          sortOrder: 1,
        })
      ).rejects.toThrow('Tên danh mục đã tồn tại trong nhóm này.');

      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { catalog_type: 'UOM', name: 'Cái' },
      });
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('cho phép tạo khi cùng name nhưng khác catalog_type', async () => {
      const findFirstSpy = vi.spyOn(prisma.systemCatalog, 'findFirst').mockResolvedValue(null);
      const created = {
        id: 15,
        catalog_type: 'TERMS',
        name: 'Khác',
        description: 'Điều khoản khác',
        sort_order: 4,
        is_active: true,
      };
      const createSpy = vi.spyOn(prisma.systemCatalog, 'create').mockResolvedValue(created as any);

      const result = await service.createCatalog({
        catalogType: 'TERMS' as any,
        name: 'Khác',
        description: 'Điều khoản khác',
        sortOrder: 4,
      });

      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { catalog_type: 'TERMS', name: 'Khác' },
      });
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          catalog_type: 'TERMS',
          name: 'Khác',
          description: 'Điều khoản khác',
          sort_order: 4,
        },
      });
      expect(result).toEqual(created);
    });
  });

  describe('ADM-SYSCAT-UT-03: updateCatalog', () => {
    it('ném lỗi "Không tìm thấy danh mục chung." khi ID không tồn tại', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue(null);

      await expect(service.updateCatalog(999, { name: 'Bộ' })).rejects.toThrow(
        'Không tìm thấy danh mục chung.'
      );
    });

    it('chặn cập nhật khi đổi sang tên đã tồn tại trong cùng catalog_type', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue({
        id: 3,
        catalog_type: 'UOM',
        name: 'Cái',
      } as any);
      vi.spyOn(prisma.systemCatalog, 'findFirst').mockResolvedValue({
        id: 1,
        catalog_type: 'UOM',
        name: 'Bộ',
      } as any);
      const updateSpy = vi.spyOn(prisma.systemCatalog, 'update');

      await expect(service.updateCatalog(3, { name: 'Bộ' })).rejects.toThrow(
        'Tên danh mục đã tồn tại trong nhóm này.'
      );
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('cập nhật name, description, isActive, sortOrder thành công', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue({
        id: 3,
        catalog_type: 'UOM',
        name: 'Cái',
      } as any);
      vi.spyOn(prisma.systemCatalog, 'findFirst').mockResolvedValue(null);
      const updated = {
        id: 3,
        catalog_type: 'UOM',
        name: 'Chiếc',
        description: 'Đơn vị chiếc',
        is_active: false,
        sort_order: 9,
      };
      const updateSpy = vi.spyOn(prisma.systemCatalog, 'update').mockResolvedValue(updated as any);

      const result = await service.updateCatalog(3, {
        name: 'Chiếc',
        description: 'Đơn vị chiếc',
        isActive: false,
        sortOrder: 9,
      });

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 3 },
        data: {
          name: 'Chiếc',
          description: 'Đơn vị chiếc',
          is_active: false,
          sort_order: 9,
        },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('ADM-SYSCAT-UT-04: toggleCatalog', () => {
    it('đảo trạng thái is_active từ true sang false', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue({
        id: 4,
        is_active: true,
      } as any);
      const updateSpy = vi.spyOn(prisma.systemCatalog, 'update').mockResolvedValue({
        id: 4,
        is_active: false,
      } as any);

      const result = await service.toggleCatalog(4);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { is_active: false },
      });
      expect(result).toEqual({ isActive: false });
    });

    it('ném lỗi khi không tìm thấy danh mục', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue(null);

      await expect(service.toggleCatalog(404)).rejects.toThrow('Không tìm thấy danh mục chung.');
    });
  });

  describe('ADM-SYSCAT-UT-05: deleteCatalog (Business Guard)', () => {
    it('ném lỗi khi không tìm thấy danh mục', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteCatalog(404)).rejects.toThrow('Không tìm thấy danh mục chung.');
    });

    it('chặn xóa khi _count.part_categories > 0 hoặc _count.brand_items > 0', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue({
        id: 5,
        name: 'Lít',
        _count: { part_categories: 2, brand_items: 0 },
      } as any);
      const deleteSpy = vi.spyOn(prisma.systemCatalog, 'delete');

      await expect(service.deleteCatalog(5)).rejects.toThrow(
        'Không thể xóa danh mục này do đã phát sinh liên kết dữ liệu trong hệ thống. Bạn có thể chọn vô hiệu hóa thay thế.'
      );
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('hard-delete thành công khi part_categories === 0 và brand_items === 0', async () => {
      vi.spyOn(prisma.systemCatalog, 'findUnique').mockResolvedValue({
        id: 8,
        name: 'Danh mục nháp',
        _count: { part_categories: 0, brand_items: 0 },
      } as any);
      const deleteSpy = vi.spyOn(prisma.systemCatalog, 'delete').mockResolvedValue({ id: 8 } as any);

      const result = await service.deleteCatalog(8);

      expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 8 } });
      expect(result).toEqual({ id: 8, name: 'Danh mục nháp' });
    });
  });
});
