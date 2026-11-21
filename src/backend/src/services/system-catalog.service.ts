import { CatalogType } from '@prisma/client';
import prisma from '../utils/prisma';

export interface CreateCatalogDto {
  catalogType: CatalogType;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCatalogDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export class SystemCatalogService {
  /**
   * UC-71: Lấy danh sách danh mục chung
   */
  async getCatalogs(search?: string, catalogType?: string, page = 1, limit = 10) {
    const where: any = {};
    if (search) where.name = { contains: search };
    if (catalogType) where.catalog_type = catalogType as CatalogType;

    const skip = (page - 1) * limit;
    const [totalRecords, catalogs, groupCounts] = await Promise.all([
      prisma.systemCatalog.count({ where }),
      prisma.systemCatalog.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ catalog_type: 'asc' }, { sort_order: 'asc' }],
      }),
      prisma.systemCatalog.groupBy({
        by: ['catalog_type'],
        _count: { id: true },
      }),
    ]);

    const typeCounts: Record<string, number> = {
      UOM: 0,
      CANCEL_REASON: 0,
      ADJUST_REASON: 0,
      TERMS: 0,
    };
    for (const g of groupCounts) {
      typeCounts[g.catalog_type] = g._count.id;
    }

    const data = catalogs.map((c) => ({
      id: c.id,
      catalogType: c.catalog_type,
      name: c.name,
      description: c.description,
      isActive: c.is_active,
      sortOrder: c.sort_order,
    }));

    return {
      data,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
      typeCounts,
    };
  }

  /**
   * UC-70: Tạo danh mục chung
   */
  async createCatalog(data: CreateCatalogDto) {
    const existing = await prisma.systemCatalog.findFirst({
      where: { catalog_type: data.catalogType, name: data.name },
    });
    if (existing) throw new Error('Tên danh mục đã tồn tại trong nhóm này.');

    return prisma.systemCatalog.create({
      data: {
        catalog_type: data.catalogType,
        name: data.name,
        description: data.description,
        sort_order: data.sortOrder ?? 0,
      },
    });
  }

  /**
   * UC-72: Cập nhật danh mục chung
   */
  async updateCatalog(id: number, data: UpdateCatalogDto) {
    const existing = await prisma.systemCatalog.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy danh mục chung.');

    if (data.name && data.name !== existing.name) {
      const dup = await prisma.systemCatalog.findFirst({
        where: { catalog_type: existing.catalog_type, name: data.name },
      });
      if (dup) throw new Error('Tên danh mục đã tồn tại trong nhóm này.');
    }

    return prisma.systemCatalog.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        is_active: data.isActive,
        sort_order: data.sortOrder,
      },
    });
  }

  /**
   * UC-73: Toggle active/inactive danh mục chung
   */
  async toggleCatalog(id: number) {
    const existing = await prisma.systemCatalog.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy danh mục chung.');

    await prisma.systemCatalog.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });
    return { isActive: !existing.is_active };
  }

  /**
   * UC-74: Xóa danh mục chung (chỉ xóa được khi chưa phát sinh liên kết / giao dịch)
   */
  async deleteCatalog(id: number) {
    const existing = await prisma.systemCatalog.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            part_categories: true,
            brand_items: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Không tìm thấy danh mục chung.');
    }

    if (existing._count.part_categories > 0 || existing._count.brand_items > 0) {
      throw new Error(
        'Không thể xóa danh mục này do đã phát sinh liên kết dữ liệu trong hệ thống. Bạn có thể chọn vô hiệu hóa thay thế.'
      );
    }

    await prisma.systemCatalog.delete({
      where: { id },
    });

    return { id, name: existing.name };
  }
}
