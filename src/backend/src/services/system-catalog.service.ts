import { PrismaClient, CatalogType } from '@prisma/client';

const prisma = new PrismaClient();

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
    const [totalRecords, catalogs] = await Promise.all([
      prisma.systemCatalog.count({ where }),
      prisma.systemCatalog.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ catalog_type: 'asc' }, { sort_order: 'asc' }],
      }),
    ]);

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
}
