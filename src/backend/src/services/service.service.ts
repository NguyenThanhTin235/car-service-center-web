import { PricingType } from '@prisma/client';
import prisma from '../utils/prisma';

export interface CreateServiceDto {
  categoryId: number;
  name: string;
  description?: string;
  pricingType: PricingType;
  fixedPrice?: number;
  sizePrices?: { vehicleSize: string; price: number }[];
}

export interface UpdateServiceDto {
  categoryId?: number;
  name?: string;
  description?: string;
  pricingType?: PricingType;
  fixedPrice?: number;
  isActive?: boolean;
  sizePrices?: { vehicleSize: string; price: number }[];
}

export class ServiceService {
  /**
   * UC-59: Lấy danh sách danh mục dịch vụ
   */
  async getServices(search?: string, categoryId?: number, page = 1, limit = 10, all = false, isActive?: boolean) {
    const where: any = {};
    if (search) where.name = { contains: search };
    if (categoryId) where.category_id = categoryId;
    if (isActive !== undefined) where.is_active = isActive;

    const skip = all ? undefined : (page - 1) * limit;
    const take = all ? undefined : limit;

    const [totalRecords, templates] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany({
        where,
        skip,
        take,
        include: {
          category: true,
          size_prices: true,
        },
        orderBy: { name: 'asc' },
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
        totalPages: all ? 1 : Math.ceil(totalRecords / (limit || 10)),
        currentPage: page,
        limit: all ? totalRecords : limit,
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
  async createService(data: CreateServiceDto) {
    const category = await prisma.serviceCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new Error('Không tìm thấy danh mục cha.');

    // Ràng buộc kiểm tra đơn giá
    if (data.pricingType === 'FIXED') {
      if (data.fixedPrice === undefined || data.fixedPrice === null || isNaN(Number(data.fixedPrice))) {
        throw new Error('Vui lòng nhập đơn giá cố định hợp lệ.');
      }
      const fp = Number(data.fixedPrice);
      if (!Number.isInteger(fp)) {
        throw new Error('Đơn giá cố định phải là số nguyên (VNĐ), không được là số thập phân.');
      }
      if (fp < 1000) {
        throw new Error('Đơn giá cố định tối thiểu phải từ 1.000 ₫ trở lên.');
      }
      if (fp % 1000 !== 0) {
        throw new Error('Đơn giá cố định phải tròn theo đơn vị nghìn đồng (bội số của 1.000 ₫, VD: 1.000.000 ₫, không được lẻ như 1.000.232 ₫).');
      }
    } else if (data.pricingType === 'VEHICLE_SIZE') {
      if (!data.sizePrices || data.sizePrices.length === 0) {
        throw new Error('Vui lòng nhập đơn giá cho ít nhất một cỡ xe.');
      }
      for (const sp of data.sizePrices) {
        if (sp.price === undefined || sp.price === null || isNaN(Number(sp.price))) {
          throw new Error(`Đơn giá cho cỡ xe ${sp.vehicleSize} không hợp lệ.`);
        }
        const p = Number(sp.price);
        if (!Number.isInteger(p)) {
          throw new Error(`Đơn giá cho cỡ xe ${sp.vehicleSize} phải là số nguyên (VNĐ), không được là số thập phân.`);
        }
        if (p < 1000) {
          throw new Error(`Đơn giá cho cỡ xe ${sp.vehicleSize} tối thiểu phải từ 1.000 ₫ trở lên.`);
        }
        if (p % 1000 !== 0) {
          throw new Error(`Đơn giá cho cỡ xe ${sp.vehicleSize} phải tròn theo đơn vị nghìn đồng (bội số của 1.000 ₫, VD: 1.000.000 ₫, không được lẻ như 1.000.232 ₫).`);
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      const template = await tx.service.create({
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
            service_id: template.id,
            vehicle_size: s.vehicleSize as any,
            price: s.price,
          })),
          skipDuplicates: true,
        });
      }

      return tx.service.findUnique({
        where: { id: template.id },
        include: { category: true, size_prices: true },
      });
    });
  }

  /**
   * UC-60: Cập nhật danh mục dịch vụ
   */
  async updateService(id: number, data: UpdateServiceDto) {
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy danh mục dịch vụ.');

    // Ràng buộc kiểm tra đơn giá
    if (data.pricingType === 'FIXED') {
      if (data.fixedPrice === undefined || data.fixedPrice === null || isNaN(Number(data.fixedPrice))) {
        throw new Error('Vui lòng nhập đơn giá cố định hợp lệ.');
      }
      const fp = Number(data.fixedPrice);
      if (!Number.isInteger(fp)) {
        throw new Error('Đơn giá cố định phải là số nguyên (VNĐ), không được là số thập phân.');
      }
      if (fp < 1000) {
        throw new Error('Đơn giá cố định tối thiểu phải từ 1.000 ₫ trở lên.');
      }
      if (fp % 1000 !== 0) {
        throw new Error('Đơn giá cố định phải tròn theo đơn vị nghìn đồng (bội số của 1.000 ₫, VD: 1.000.000 ₫, không được lẻ như 1.000.232 ₫).');
      }
    } else if (data.pricingType === 'VEHICLE_SIZE') {
      if (data.sizePrices !== undefined) {
        if (!data.sizePrices || data.sizePrices.length === 0) {
          throw new Error('Vui lòng nhập đơn giá cho ít nhất một cỡ xe.');
        }
        for (const sp of data.sizePrices) {
          if (sp.price === undefined || sp.price === null || isNaN(Number(sp.price))) {
            throw new Error(`Đơn giá cho cỡ xe ${sp.vehicleSize} không hợp lệ.`);
          }
          const p = Number(sp.price);
          if (!Number.isInteger(p)) {
            throw new Error(`Đơn giá cho cỡ xe ${sp.vehicleSize} phải là số nguyên (VNĐ), không được là số thập phân.`);
          }
          if (p < 1000) {
            throw new Error(`Đơn giá cho cỡ xe ${sp.vehicleSize} tối thiểu phải từ 1.000 ₫ trở lên.`);
          }
          if (p % 1000 !== 0) {
            throw new Error(`Đơn giá cho cỡ xe ${sp.vehicleSize} phải tròn theo đơn vị nghìn đồng (bội số của 1.000 ₫, VD: 1.000.000 ₫, không được lẻ như 1.000.232 ₫).`);
          }
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.service.update({
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
        await tx.vehicleSizePrice.deleteMany({ where: { service_id: id } });
        if (data.sizePrices.length > 0) {
          await tx.vehicleSizePrice.createMany({
            data: data.sizePrices.map((s) => ({
              service_id: id,
              vehicle_size: s.vehicleSize as any,
              price: s.price,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.service.findUnique({
        where: { id },
        include: { category: true, size_prices: true },
      });
    });
  }

  /**
   * UC-61: Vô hiệu hóa / Khôi phục danh mục dịch vụ (soft delete)
   */
  async toggleService(id: number) {
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy danh mục dịch vụ.');

    await prisma.service.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });
    return { isActive: !existing.is_active };
  }

  /**
   * UC-61b: Xóa dịch vụ
   * - Trường hợp 1: Chặn xóa vĩnh viễn dịch vụ đã từng được sử dụng trong phiếu sửa chữa của khách hàng
   *   -> Từ chối xóa vĩnh viễn và chuyển dịch vụ sang trạng thái Ngừng cung cấp để bảo toàn lịch sử.
   * - Trường hợp 2: Xóa vĩnh viễn dịch vụ vừa tạo nhầm chưa từng phát sinh bất kỳ giao dịch nào
   *   -> Xóa hoàn toàn khỏi cơ sở dữ liệu.
   */
  async deleteService(id: number) {
    const existing = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            wo_services: true,
            appt_services: true,
            intake_services: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Không tìm thấy danh mục dịch vụ.');
    }

    const hasHistory =
      existing._count.wo_services > 0 ||
      existing._count.appt_services > 0 ||
      existing._count.intake_services > 0;

    if (hasHistory) {
      // Trường hợp 1: Chặn xóa vĩnh viễn dịch vụ đã từng được sử dụng trong phiếu sửa chữa của khách hàng
      await prisma.service.update({
        where: { id },
        data: { is_active: false },
      });

      return {
        deleted: false,
        isDeactivated: true,
        message:
          'Không thể xóa dịch vụ này vì đã có lịch sử sửa chữa của khách hàng tham chiếu. Hệ thống sẽ chuyển dịch vụ sang trạng thái Ngừng cung cấp để bảo toàn lịch sử.',
        data: { id, isActive: false },
      };
    }

    // Trường hợp 2: Xóa vĩnh viễn dịch vụ vừa tạo nhầm chưa từng phát sinh bất kỳ giao dịch nào
    await prisma.$transaction(async (tx) => {
      // Xóa cấu hình đơn giá theo cỡ xe nếu có
      await tx.vehicleSizePrice.deleteMany({
        where: { service_id: id },
      });

      // Ngắt liên kết các mẫu công việc / kiểm định nếu có
      await tx.jobTemplate.updateMany({
        where: { service_id: id },
        data: { service_id: null },
      });

      await tx.inspectionTemplate.updateMany({
        where: { service_id: id },
        data: { service_id: null },
      });

      // Xóa vĩnh viễn dịch vụ
      await tx.service.delete({
        where: { id },
      });
    });

    return {
      deleted: true,
      isDeactivated: false,
      message: 'Đã xóa dịch vụ thành công',
      data: { id },
    };
  }
}
