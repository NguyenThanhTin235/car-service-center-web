import prisma from '../utils/prisma';
import * as redisUtil from '../utils/redis.util';

const invalidateCatalogCache = () => {
  try {
    if (
      Object.prototype.hasOwnProperty.call(redisUtil, 'deleteCacheByPrefix') &&
      typeof (redisUtil as { deleteCacheByPrefix?: (p: string) => Promise<void> }).deleteCacheByPrefix === 'function'
    ) {
      void (redisUtil as { deleteCacheByPrefix: (p: string) => Promise<void> })
        .deleteCacheByPrefix('catalog:')
        .catch(() => {});
    }
  } catch {
    // Ignore when mocked without deleteCacheByPrefix
  }
};

export interface CreateCategoryDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export class ServiceCategoryService {
  /**
   * Lấy danh sách tất cả category (bao gồm cả phân trang hoặc filter nếu cần)
   */
  async getCategories(search?: string, page = 1, limit = 10) {
    const where: any = {};
    if (search) where.name = { contains: search };

    const skip = (page - 1) * limit;
    const [totalRecords, categories] = await Promise.all([
      prisma.serviceCategory.count({ where }),
      prisma.serviceCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sort_order: 'asc' },
        include: {
          _count: {
            select: { services: true }
          }
        }
      }),
    ]);

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      isActive: c.is_active,
      sortOrder: c.sort_order,
      templatesCount: c._count.services
    }));

    return {
      data,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * UC-62: Tạo danh mục dịch vụ mới
   */
  async createCategory(data: CreateCategoryDto) {
    const count = await prisma.serviceCategory.count();
    const created = await prisma.serviceCategory.create({
      data: {
        name: data.name,
        description: data.description,
        is_active: data.isActive !== undefined ? data.isActive : true,
        sort_order: count + 1
      },
    });
    invalidateCatalogCache();
    return created;
  }

  /**
   * UC-64: Cập nhật danh mục dịch vụ
   */
  async updateCategory(id: number, data: UpdateCategoryDto) {
    const existing = await prisma.serviceCategory.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy nhóm dịch vụ.');

    const updated = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        is_active: data.isActive,
      },
    });
    invalidateCatalogCache();
    return updated;
  }

  /**
   * UC-65: Xóa/Vô hiệu hóa danh mục dịch vụ
   */
  async deleteCategory(id: number) {
    const existing = await prisma.serviceCategory.findUnique({ 
      where: { id },
      include: { _count: { select: { services: true } } }
    });
    
    if (!existing) throw new Error('Không tìm thấy nhóm dịch vụ.');

    // Nếu đã có dịch vụ tham chiếu, chỉ vô hiệu hóa
    if (existing._count.services > 0) {
      if (existing.is_active) {
        await prisma.serviceCategory.update({
          where: { id },
          data: { is_active: false },
        });
        invalidateCatalogCache();
        return { message: 'danh mục dịch vụ đã có dịch vụ phụ thuộc, đã được vô hiệu hóa thành công.', deleted: false, isDeactivated: true };
      } else {
        return { message: 'danh mục dịch vụ đã có dịch vụ phụ thuộc, đã được vô hiệu hóa thành công.', deleted: false, isDeactivated: true };
      }
    }

    // Xóa cứng nếu chưa có dịch vụ nào
    await prisma.serviceCategory.delete({ where: { id } });
    invalidateCatalogCache();
    return { message: 'Xóa danh mục dịch vụ thành công.', deleted: true };
  }
}
