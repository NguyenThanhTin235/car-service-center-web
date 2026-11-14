import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceCategoryService } from '../../../src/services/service-category.service';
import prisma from '../../../src/utils/prisma';

describe('UC-65: Service Category Deletion & Deactivation Guards', () => {
  const service = new ServiceCategoryService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Xóa nhóm danh mục dịch vụ đang chứa các dịch vụ con phụ thuộc -> không xóa, chuyển sang Vô hiệu hóa', async () => {
    const mockCategoryWithServices = {
      id: 5,
      name: 'Bảo dưỡng định kỳ',
      is_active: true,
      _count: {
        services: 4,
      },
    };

    vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue(mockCategoryWithServices as any);
    const updateSpy = vi.spyOn(prisma.serviceCategory, 'update').mockResolvedValue({
      id: 5,
      is_active: false,
    } as any);
    const deleteSpy = vi.spyOn(prisma.serviceCategory, 'delete').mockResolvedValue({} as any);

    const result = await service.deleteCategory(5);

    expect(prisma.serviceCategory.findUnique).toHaveBeenCalledWith({
      where: { id: 5 },
      include: { _count: { select: { services: true } } },
    });
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { is_active: false },
    });
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(result.deleted).toBe(false);
    expect(result.message).toBe('danh mục dịch vụ đã có dịch vụ phụ thuộc, đã được vô hiệu hóa thành công.');
  });

  it('Xóa vĩnh viễn nhóm danh mục dịch vụ không có dịch vụ nào phụ thuộc -> xóa vĩnh viễn khỏi DB', async () => {
    const mockCategoryEmpty = {
      id: 9,
      name: 'Nhóm dịch vụ mới tạo chưa có dịch vụ',
      is_active: true,
      _count: {
        services: 0,
      },
    };

    vi.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValue(mockCategoryEmpty as any);
    const updateSpy = vi.spyOn(prisma.serviceCategory, 'update');
    const deleteSpy = vi.spyOn(prisma.serviceCategory, 'delete').mockResolvedValue({} as any);

    const result = await service.deleteCategory(9);

    expect(updateSpy).not.toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith({
      where: { id: 9 },
    });
    expect(result.deleted).toBe(true);
    expect(result.message).toBe('Xóa danh mục dịch vụ thành công.');
  });
});
