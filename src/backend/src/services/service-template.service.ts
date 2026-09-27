import { PrismaClient, PricingType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateServiceTemplateDto {
  categoryId: number;
  name: string;
  description?: string;
  pricingType: PricingType;
  fixedPrice?: number;
  sizePrices?: { vehicleSize: string; price: number }[];
}

export interface UpdateServiceTemplateDto {
  categoryId?: number;
  name?: string;
  description?: string;
  pricingType?: PricingType;
  fixedPrice?: number;
  isActive?: boolean;
  sizePrices?: { vehicleSize: string; price: number }[];
}

export class ServiceTemplateService {
  /**
   * UC-59: Lấy danh sách danh mục dịch vụ
   */
  async getServiceTemplates(search?: string, categoryId?: number, page = 1, limit = 10) {
    const where: any = {};
    if (search) where.name = { contains: search };
    if (categoryId) where.category_id = categoryId;

    const skip = (page - 1) * limit;
    const [totalRecords, templates] = await Promise.all([
      prisma.serviceTemplate.count({ where }),
      prisma.serviceTemplate.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          size_prices: true,
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const data = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      pricingType: t.pricing_type,
      fixedPrice: t.fixed_price,
      isActive: t.is_active,
      category: { id: t.category.id, name: t.category.name },
      sizePrices: t.size_prices.map((s) => ({ vehicleSize: s.vehicle_size, price: s.price })),
      createdAt: t.created_at,
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
   * Lấy danh sách category (cho dropdown)
   */
  async getCategories() {
    return prisma.serviceCategory.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });
  }

  /**
   * UC-58: Tạo danh mục dịch vụ mới
   */
  async createServiceTemplate(data: CreateServiceTemplateDto) {
    const category = await prisma.serviceCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new Error('Không tìm thấy danh mục cha.');

    return prisma.$transaction(async (tx) => {
      const template = await tx.serviceTemplate.create({
        data: {
          category_id: data.categoryId,
          name: data.name,
          description: data.description,
          pricing_type: data.pricingType,
          fixed_price: data.fixedPrice ?? null,
        },
      });

      if (data.pricingType === 'VEHICLE_SIZE' && data.sizePrices && data.sizePrices.length > 0) {
        await tx.vehicleSizePrice.createMany({
          data: data.sizePrices.map((s) => ({
            service_template_id: template.id,
            vehicle_size: s.vehicleSize as any,
            price: s.price,
          })),
          skipDuplicates: true,
        });
      }

      return tx.serviceTemplate.findUnique({
        where: { id: template.id },
        include: { category: true, size_prices: true },
      });
    });
  }

  /**
   * UC-60: Cập nhật danh mục dịch vụ
   */
  async updateServiceTemplate(id: number, data: UpdateServiceTemplateDto) {
    const existing = await prisma.serviceTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy danh mục dịch vụ.');

    return prisma.$transaction(async (tx) => {
      await tx.serviceTemplate.update({
        where: { id },
        data: {
          category_id: data.categoryId,
          name: data.name,
          description: data.description,
          pricing_type: data.pricingType,
          fixed_price: data.fixedPrice ?? null,
          is_active: data.isActive,
        },
      });

      if (data.sizePrices !== undefined) {
        await tx.vehicleSizePrice.deleteMany({ where: { service_template_id: id } });
        if (data.sizePrices.length > 0) {
          await tx.vehicleSizePrice.createMany({
            data: data.sizePrices.map((s) => ({
              service_template_id: id,
              vehicle_size: s.vehicleSize as any,
              price: s.price,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.serviceTemplate.findUnique({
        where: { id },
        include: { category: true, size_prices: true },
      });
    });
  }

  /**
   * UC-61: Vô hiệu hóa / Khôi phục danh mục dịch vụ (soft delete)
   */
  async toggleServiceTemplate(id: number) {
    const existing = await prisma.serviceTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy danh mục dịch vụ.');

    await prisma.serviceTemplate.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });
    return { isActive: !existing.is_active };
  }
}
