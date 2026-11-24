import prisma from '../utils/prisma';

export type WarrantyStatus = 'VALID' | 'EXPIRED';

export interface WarrantyItemEligibility {
  type: 'SERVICE' | 'PART';
  id: number;
  itemId?: number;
  name: string;
  sku?: string;
  brand?: string;
  workOrderId: number;
  woNumber: string;
  completedDate: Date;
  warrantyMonths: number;
  expirationDate: Date | null;
  daysRemaining: number | null;
  isValid: boolean;
  overdueDays: number;
  status: WarrantyStatus;
  statusLabel: string;
  terms: string;
}

export interface VehicleWarrantyEligibilityResult {
  hasHistory: boolean;
  message?: string;
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
    year?: number | null;
    color?: string | null;
    customerId: number;
    customerName?: string;
    customerPhone?: string | null;
  };
  summary: {
    totalItems: number;
    validItems: number;
    expiredItems: number;
  };
  items: WarrantyItemEligibility[];
}

export class WarrantyService {
  /**
   * UC-81: Tra cứu thông tin bảo hành của phương tiện
   * Đối chiếu ngày hoàn tất / xuất xưởng với snapshot thời hạn bảo hành (theo tháng) của dịch vụ/phụ tùng.
   * Trạng thái chỉ gồm: VALID (Còn hạn) hoặc EXPIRED (Quá hạn).
   */
  async checkVehicleWarrantyEligibility(
    identifier: { vehicleId?: number; licensePlate?: string },
    userContext?: { userId: number; roles: string[] }
  ): Promise<VehicleWarrantyEligibilityResult> {
    // 1. Tìm phương tiện theo vehicleId hoặc licensePlate
    let vehicle = null;
    if (identifier.vehicleId) {
      vehicle = await prisma.vehicle.findUnique({
        where: { id: identifier.vehicleId },
        include: {
          customer: { select: { id: true, full_name: true, phone: true } },
        },
      });
    } else if (identifier.licensePlate) {
      const cleanPlate = identifier.licensePlate.trim().toUpperCase();
      vehicle = await prisma.vehicle.findFirst({
        where: {
          license_plate: { equals: cleanPlate },
        },
        include: {
          customer: { select: { id: true, full_name: true, phone: true } },
        },
      });
    }

    if (!vehicle) {
      throw new Error('Không tìm thấy phương tiện trong hệ thống.');
    }

    // 2. Phân quyền: Nếu là khách hàng (CUSTOMER), chỉ được tra cứu xe của chính mình.
    if (userContext) {
      const staffRoleKeywords = [
        'ADMIN',
        'SYSTEM_ADMIN',
        'MANAGER',
        'SERVICE_MANAGER',
        'SERVICE_ADVISOR',
        'SA',
        'STAFF',
        'DESK_STAFF',
        'DESK STAFF',
        'TECHNICIAN',
      ];
      const isStaffOrAdmin =
        userContext.roles.some((r) => {
          const upper = (r || '').trim().toUpperCase();
          const normalized = upper.replace(/\s+/g, '_');
          return staffRoleKeywords.includes(upper) || staffRoleKeywords.includes(normalized);
        }) || !userContext.roles.every((r) => (r || '').trim().toUpperCase() === 'CUSTOMER');

      if (!isStaffOrAdmin && vehicle.customer_id !== userContext.userId) {
        throw new Error('Bạn không có quyền truy cập dữ liệu bảo hành của phương tiện này.');
      }
    }

    // 3. Tải toàn bộ WorkOrder đã hoàn tất (RELEASED hoặc CLOSED) của xe
    const completedWorkOrders = await prisma.workOrder.findMany({
      where: {
        vehicle_id: vehicle.id,
        status: { in: ['RELEASED', 'CLOSED'] },
      },
      include: {
        release: true,
        services: {
          include: {
            service: { select: { id: true, name: true, warranty_months: true } },
            jobs: {
              include: {
                parts: {
                  include: {
                    item: {
                      include: {
                        part_category: { select: { id: true, name: true, code: true } },
                        brand: { select: { id: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!completedWorkOrders || completedWorkOrders.length === 0) {
      return {
        hasHistory: false,
        message: 'Xe chưa có lịch sử dịch vụ hoặc phụ tùng bảo hành tại trung tâm.',
        vehicle: {
          id: vehicle.id,
          licensePlate: vehicle.license_plate,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          customerId: vehicle.customer_id,
          customerName: vehicle.customer?.full_name,
          customerPhone: vehicle.customer?.phone,
        },
        summary: {
          totalItems: 0,
          validItems: 0,
          expiredItems: 0,
        },
        items: [],
      };
    }

    const now = new Date();
    const items: WarrantyItemEligibility[] = [];

    // Chính sách bảo hành chỉ áp dụng 1 lần duy nhất cho mỗi phiếu:
    // Nếu phiếu gốc đã có phiếu bảo hành hoàn tất (RELEASED/CLOSED), phiếu gốc chuyển sang Quá hạn (EXPIRED);
    // quyền bảo hành mới được tính trên chính phiếu bảo hành vừa hoàn tất đó.
    const claimedParentWoIds = new Set<number>(
      completedWorkOrders
        .filter((wo) => wo.order_type === 'WARRANTY' && wo.parent_work_order_id != null)
        .map((wo) => wo.parent_work_order_id as number)
    );

    // 4. Lặp qua các phiếu dịch vụ đã hoàn tất để trích xuất dịch vụ và phụ tùng bảo hành theo tháng
    for (const wo of completedWorkOrders) {
      const completedDate = wo.release?.released_at ?? wo.updated_at ?? wo.created_at;
      const isAlreadyClaimed = claimedParentWoIds.has(wo.id);

      // 4.1. Hạng mục Dịch vụ (WoService)
      for (const svc of wo.services) {
        const warrantyMonths =
          svc.warranty_months > 0 ? svc.warranty_months : (svc.service?.warranty_months ?? 0);

        if (warrantyMonths <= 0) {
          continue;
        }

        const expirationDate = new Date(completedDate);
        expirationDate.setMonth(expirationDate.getMonth() + warrantyMonths);
        const diffMs = expirationDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const isValid = !isAlreadyClaimed && daysRemaining >= 0;
        const overdueDays = !isAlreadyClaimed && daysRemaining < 0 ? Math.abs(daysRemaining) : 0;

        const status: WarrantyStatus = isValid ? 'VALID' : 'EXPIRED';
        const statusLabel = isValid ? 'Còn hạn' : 'Quá hạn';

        items.push({
          type: 'SERVICE',
          id: svc.id,
          name: svc.name,
          workOrderId: wo.id,
          woNumber: wo.wo_number,
          completedDate,
          warrantyMonths,
          expirationDate,
          daysRemaining: isValid ? daysRemaining : 0,
          isValid,
          overdueDays,
          status,
          statusLabel,
          terms: isAlreadyClaimed
            ? 'Đã sử dụng quyền bảo hành 1 lần duy nhất cho phiếu này; bảo hành mới áp dụng trên phiếu bảo hành kế tiếp.'
            : `Bảo hành tay nghề kỹ thuật và chất lượng dịch vụ trong ${warrantyMonths} tháng kể từ ngày hoàn tất.`,
        });

        // 4.2. Hạng mục Phụ tùng (JobPart)
        // Dịch vụ trọn gói (FIXED / VEHICLE_SIZE) chỉ bảo hành theo gói dịch vụ, không xét bảo hành phụ tùng riêng lẻ.
        const isPackageService = svc.pricing_type === 'FIXED' || svc.pricing_type === 'VEHICLE_SIZE';
        if (isPackageService) {
          continue;
        }
        for (const job of svc.jobs) {
          for (const part of job.parts) {
            if (part.status === 'RETURNED') {
              continue;
            }

            const partMonths =
              part.warranty_months > 0 ? part.warranty_months : (part.item?.warranty_months ?? 0);

            if (partMonths <= 0) {
              continue;
            }

            const partExpDate = new Date(completedDate);
            partExpDate.setMonth(partExpDate.getMonth() + partMonths);
            const partDiffMs = partExpDate.getTime() - now.getTime();
            const partDaysRemaining = Math.ceil(partDiffMs / (1000 * 60 * 60 * 24));
            const isPartValid = !isAlreadyClaimed && partDaysRemaining >= 0;
            const partOverdueDays =
              !isAlreadyClaimed && partDaysRemaining < 0 ? Math.abs(partDaysRemaining) : 0;

            const partStatus: WarrantyStatus = isPartValid ? 'VALID' : 'EXPIRED';
            const partStatusLabel = isPartValid ? 'Còn hạn' : 'Quá hạn';
            const partName =
              part.item?.part_category?.name || part.item?.sku || 'Phụ tùng thay thế';

            items.push({
              type: 'PART',
              id: part.id,
              itemId: part.item_id,
              name: partName,
              sku: part.item?.sku,
              brand: part.item?.brand?.name,
              workOrderId: wo.id,
              woNumber: wo.wo_number,
              completedDate,
              warrantyMonths: partMonths,
              expirationDate: partExpDate,
              daysRemaining: isPartValid ? partDaysRemaining : 0,
              isValid: isPartValid,
              overdueDays: partOverdueDays,
              status: partStatus,
              statusLabel: partStatusLabel,
              terms: isAlreadyClaimed
                ? 'Đã sử dụng quyền bảo hành 1 lần duy nhất cho phiếu này; bảo hành mới áp dụng trên phiếu bảo hành kế tiếp.'
                : `Cam kết bảo hành chính hãng đối với linh kiện trong ${partMonths} tháng áp dụng cho lỗi nhà sản xuất hoặc lỗi lắp đặt.`,
            });
          }
        }
      }
    }

    return {
      hasHistory: true,
      vehicle: {
        id: vehicle.id,
        licensePlate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        customerId: vehicle.customer_id,
        customerName: vehicle.customer?.full_name,
        customerPhone: vehicle.customer?.phone,
      },
      summary: {
        totalItems: items.length,
        validItems: items.filter((i) => i.status === 'VALID').length,
        expiredItems: items.filter((i) => i.status === 'EXPIRED').length,
      },
      items,
    };
  }

  /**
   * UC-83: Lấy danh sách phiếu dịch vụ đã hoàn thành của xe để nhân viên quầy chọn phiếu gốc
   */
  async getCompletedWorkOrdersForVehicle(vehicleId: number) {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        vehicle_id: vehicleId,
        status: { in: ['RELEASED', 'CLOSED'] },
      },
      include: {
        release: true,
        services: {
          select: {
            id: true,
            name: true,
            warranty_months: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return workOrders.map((wo) => ({
      id: wo.id,
      woNumber: wo.wo_number,
      status: wo.status,
      orderType: wo.order_type,
      completedDate: wo.release?.released_at ?? wo.updated_at,
      releasedAt: wo.release?.released_at ?? wo.updated_at,
      servicesSummary: wo.services.map((s) => s.name).join(', '),
      services: wo.services,
    }));
  }
}

export const warrantyService = new WarrantyService();
