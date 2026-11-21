import { GoodwillClaimStatus, GoodwillSupportType, NotificationType } from '@prisma/client';
import prisma from '../utils/prisma';

export interface CreateGoodwillClaimDto {
  vehicleId: number;
  customerId?: number;
  parentWoId: number;
  intakeId?: number | null;
  overdueDays?: number | null;
  overdueKm?: number | null;
  complaint: string;
}

export interface ApproveGoodwillClaimDto {
  supportType: GoodwillSupportType;
  supportPct?: number;
  approvalNote: string;
}

export interface RejectGoodwillClaimDto {
  approvalNote: string;
}

export interface GoodwillClaimsFilter {
  status?: GoodwillClaimStatus;
  search?: string;
  page?: number;
  limit?: number;
}

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
  completedOdo: number;
  warrantyMonths: number;
  warrantyMileage: number;
  expirationDate: Date | null;
  expirationMileage: number | null;
  daysRemaining: number | null;
  kmRemaining: number | null;
  isValid: boolean;
  isOverdueLight: boolean;
  overdueDays: number;
  overdueKm: number;
  status: 'VALID' | 'OVERDUE_LIGHT' | 'EXPIRED';
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
  currentOdo: number | null;
  summary: {
    totalItems: number;
    validItems: number;
    expiredItems: number;
    overdueLightItems: number;
  };
  items: WarrantyItemEligibility[];
}

export class WarrantyService {
  /**
   * UC-81: Tra cứu thông tin bảo hành của phương tiện
   * Đối chiếu ngày xuất xưởng và ODO xuất xưởng với snapshot hạn bảo hành của dịch vụ/phụ tùng
   */
  async checkVehicleWarrantyEligibility(
    identifier: { vehicleId?: number; licensePlate?: string },
    currentOdo?: number,
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

    // 2. Phân quyền: Nếu là khách hàng (CUSTOMER), chỉ được tra cứu xe của chính mình
    if (userContext) {
      const isStaffOrAdmin = userContext.roles.some((r) =>
        ['ADMIN', 'SYSTEM_ADMIN', 'SERVICE_ADVISOR', 'SERVICE_MANAGER', 'STAFF', 'TECHNICIAN'].includes(r.toUpperCase())
      );
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
        check_in: true,
        services: {
          include: {
            service: { select: { id: true, name: true, warranty_months: true, warranty_mileage: true } },
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

    // Luồng ngoại lệ: Chưa có phiếu sửa chữa nào hoàn thành
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
        currentOdo: currentOdo ?? null,
        summary: {
          totalItems: 0,
          validItems: 0,
          expiredItems: 0,
          overdueLightItems: 0,
        },
        items: [],
      };
    }

    const now = new Date();
    const items: WarrantyItemEligibility[] = [];

    // 4. Lặp qua các phiếu dịch vụ đã hoàn tất để trích xuất dịch vụ và phụ tùng đã làm
    for (const wo of completedWorkOrders) {
      // Mốc ngày xuất xưởng & ODO xuất xưởng
      const completedDate = wo.release?.released_at ?? wo.updated_at ?? wo.created_at;
      const completedOdo = wo.release?.odometer_at_release ?? wo.check_in?.mileage ?? 0;

      // 4.1. Hạng mục Dịch vụ (WoService)
      for (const svc of wo.services) {
        // Lấy snapshot warranty terms (fallback sang catalog service nếu snapshot = 0)
        const warrantyMonths = svc.warranty_months > 0 ? svc.warranty_months : (svc.service?.warranty_months ?? 0);
        const warrantyMileage = svc.warranty_mileage > 0 ? svc.warranty_mileage : (svc.service?.warranty_mileage ?? 0);

        // Bỏ qua nếu dịch vụ không có bất kỳ cấu hình bảo hành nào
        if (warrantyMonths <= 0 && warrantyMileage <= 0) {
          continue;
        }

        // Tính ngày hết hạn
        let expirationDate: Date | null = null;
        let daysRemaining: number | null = null;
        let isDateValid = true;

        if (warrantyMonths > 0) {
          expirationDate = new Date(completedDate);
          expirationDate.setMonth(expirationDate.getMonth() + warrantyMonths);
          const diffMs = expirationDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          isDateValid = daysRemaining >= 0;
        }

        // Tính ODO hết hạn
        let expirationMileage: number | null = null;
        let kmRemaining: number | null = null;
        let isMileageValid = true;

        if (warrantyMileage > 0) {
          expirationMileage = completedOdo + warrantyMileage;
          if (currentOdo !== undefined && currentOdo !== null) {
            kmRemaining = expirationMileage - currentOdo;
            isMileageValid = kmRemaining >= 0;
          }
        }

        // Đánh giá hiệu lực
        const isValid = isDateValid && isMileageValid;
        const overdueDays = daysRemaining !== null && daysRemaining < 0 ? Math.abs(daysRemaining) : 0;
        const overdueKm = kmRemaining !== null && kmRemaining < 0 ? Math.abs(kmRemaining) : 0;

        // Quá hạn nhẹ (UC-83 & UC-86): quá hạn <= 30 ngày hoặc <= 1.000 km
        const isOverdueLight = !isValid && (overdueDays <= 30 || overdueKm <= 1000);

        let status: 'VALID' | 'OVERDUE_LIGHT' | 'EXPIRED' = 'EXPIRED';
        let statusLabel = 'Hết hạn bảo hành';

        if (isValid) {
          status = 'VALID';
          statusLabel = 'Còn bảo hành';
        } else if (isOverdueLight) {
          status = 'OVERDUE_LIGHT';
          statusLabel = 'Hết hạn bảo hành (Quá hạn nhẹ)';
        }

        items.push({
          type: 'SERVICE',
          id: svc.id,
          name: svc.name,
          workOrderId: wo.id,
          woNumber: wo.wo_number,
          completedDate,
          completedOdo,
          warrantyMonths,
          warrantyMileage,
          expirationDate,
          expirationMileage,
          daysRemaining,
          kmRemaining,
          isValid,
          isOverdueLight,
          overdueDays,
          overdueKm,
          status,
          statusLabel,
          terms: `Bảo hành tay nghề kỹ thuật và chất lượng dịch vụ ${warrantyMonths > 0 ? `${warrantyMonths} tháng` : ''}${warrantyMonths > 0 && warrantyMileage > 0 ? ' hoặc ' : ''}${warrantyMileage > 0 ? `${warrantyMileage.toLocaleString('vi-VN')} km` : ''} tùy điều kiện nào đến trước.`,
        });

        // 4.2. Hạng mục Phụ tùng (JobPart)
        for (const job of svc.jobs) {
          for (const part of job.parts) {
            // Không tính phụ tùng đã bị hoàn trả kho
            if (part.status === 'RETURNED') {
              continue;
            }

            const partMonths = part.warranty_months > 0 ? part.warranty_months : (part.item?.warranty_months ?? 0);
            const partMileage = part.warranty_mileage > 0 ? part.warranty_mileage : (part.item?.warranty_mileage ?? 0);

            if (partMonths <= 0 && partMileage <= 0) {
              continue;
            }

            let partExpDate: Date | null = null;
            let partDaysRemaining: number | null = null;
            let isPartDateValid = true;

            if (partMonths > 0) {
              partExpDate = new Date(completedDate);
              partExpDate.setMonth(partExpDate.getMonth() + partMonths);
              const diffMs = partExpDate.getTime() - now.getTime();
              partDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              isPartDateValid = partDaysRemaining >= 0;
            }

            let partExpMileage: number | null = null;
            let partKmRemaining: number | null = null;
            let isPartMileageValid = true;

            if (partMileage > 0) {
              partExpMileage = completedOdo + partMileage;
              if (currentOdo !== undefined && currentOdo !== null) {
                partKmRemaining = partExpMileage - currentOdo;
                isPartMileageValid = partKmRemaining >= 0;
              }
            }

            const isPartValid = isPartDateValid && isPartMileageValid;
            const partOverdueDays = partDaysRemaining !== null && partDaysRemaining < 0 ? Math.abs(partDaysRemaining) : 0;
            const partOverdueKm = partKmRemaining !== null && partKmRemaining < 0 ? Math.abs(partKmRemaining) : 0;
            const isPartOverdueLight = !isPartValid && (partOverdueDays <= 30 || partOverdueKm <= 1000);

            let partStatus: 'VALID' | 'OVERDUE_LIGHT' | 'EXPIRED' = 'EXPIRED';
            let partStatusLabel = 'Hết hạn bảo hành';

            if (isPartValid) {
              partStatus = 'VALID';
              partStatusLabel = 'Còn bảo hành';
            } else if (isPartOverdueLight) {
              partStatus = 'OVERDUE_LIGHT';
              partStatusLabel = 'Hết hạn bảo hành (Quá hạn nhẹ)';
            }

            const partName = part.item?.part_category?.name || part.item?.sku || 'Phụ tùng thay thế';

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
              completedOdo,
              warrantyMonths: partMonths,
              warrantyMileage: partMileage,
              expirationDate: partExpDate,
              expirationMileage: partExpMileage,
              daysRemaining: partDaysRemaining,
              kmRemaining: partKmRemaining,
              isValid: isPartValid,
              isOverdueLight: isPartOverdueLight,
              overdueDays: partOverdueDays,
              overdueKm: partOverdueKm,
              status: partStatus,
              statusLabel: partStatusLabel,
              terms: `Cam kết bảo hành chính hãng đối với linh kiện ${partMonths > 0 ? `${partMonths} tháng` : ''}${partMonths > 0 && partMileage > 0 ? ' hoặc ' : ''}${partMileage > 0 ? `${partMileage.toLocaleString('vi-VN')} km` : ''} áp dụng cho lỗi nhà sản xuất hoặc lỗi lắp đặt.`,
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
      currentOdo: currentOdo ?? null,
      summary: {
        totalItems: items.length,
        validItems: items.filter((i) => i.status === 'VALID').length,
        expiredItems: items.filter((i) => i.status === 'EXPIRED').length,
        overdueLightItems: items.filter((i) => i.status === 'OVERDUE_LIGHT').length,
      },
      items,
    };
  }

  /**
   * UC-83: Kiểm tra chống tua lùi ODO khi tiếp nhận xe diện bảo hành
   * Rule: ODO tiếp nhận không được nhỏ hơn ODO xuất xưởng của phiếu dịch vụ trước
   */
  async validateOdoIntake(parentWoId: number, intakeOdo: number) {
    if (!parentWoId || isNaN(parentWoId)) {
      throw new Error('Mã phiếu dịch vụ gốc không hợp lệ.');
    }
    if (intakeOdo === undefined || intakeOdo === null || isNaN(intakeOdo) || intakeOdo < 0) {
      throw new Error('Số km ODO tiếp nhận phải là số nguyên dương hợp lệ.');
    }

    const parentWo = await prisma.workOrder.findUnique({
      where: { id: parentWoId },
      include: {
        release: true,
        check_in: true,
        vehicle: { select: { id: true, license_plate: true } },
      },
    });

    if (!parentWo) {
      throw new Error('Không tìm thấy phiếu dịch vụ gốc được chọn.');
    }

    const lastRecordedOdo = parentWo.release?.odometer_at_release ?? parentWo.check_in?.mileage ?? 0;

    if (intakeOdo < lastRecordedOdo) {
      throw new Error(
        `Số ODO tiếp nhận không được nhỏ hơn ODO xuất xưởng của phiếu dịch vụ trước (${lastRecordedOdo.toLocaleString('vi-VN')} km).`
      );
    }

    return {
      valid: true,
      parentWoId,
      parentWoNumber: parentWo.wo_number,
      vehicleId: parentWo.vehicle_id,
      licensePlate: parentWo.vehicle?.license_plate,
      lastRecordedOdo,
      intakeOdo,
      odoDifference: intakeOdo - lastRecordedOdo,
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
        check_in: true,
        services: {
          select: {
            id: true,
            name: true,
            warranty_months: true,
            warranty_mileage: true,
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
      releasedAt: wo.release?.released_at ?? wo.updated_at,
      releaseOdo: wo.release?.odometer_at_release ?? wo.check_in?.mileage ?? null,
      services: wo.services,
    }));
  }

  // ==========================================
  // PHẦN 3: BẢO HÀNH THIỆN CHÍ (UC-86)
  // ==========================================

  /**
   * UC-86 / UC-83: Tạo yêu cầu đề xuất bảo hành thiện chí (Goodwill Claim)
   */
  async createGoodwillClaim(data: CreateGoodwillClaimDto, createdById: number) {
    if (!data.vehicleId || isNaN(Number(data.vehicleId))) {
      throw new Error('Mã phương tiện (vehicleId) không hợp lệ.');
    }
    if (!data.parentWoId || isNaN(Number(data.parentWoId))) {
      throw new Error('Mã phiếu dịch vụ gốc (parentWoId) không hợp lệ.');
    }
    if (!data.complaint || !data.complaint.trim()) {
      throw new Error('Vui lòng nhập mô tả hiện tượng sự cố phản ánh và lý do đề xuất.');
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(data.vehicleId) },
      include: { customer: true },
    });
    if (!vehicle) {
      throw new Error('Không tìm thấy phương tiện trong hệ thống.');
    }

    const parentWo = await prisma.workOrder.findUnique({
      where: { id: Number(data.parentWoId) },
    });
    if (!parentWo) {
      throw new Error('Không tìm thấy phiếu dịch vụ gốc.');
    }

    const customerId = data.customerId || vehicle.customer_id;

    const claim = await prisma.goodwillClaim.create({
      data: {
        vehicle_id: Number(data.vehicleId),
        customer_id: customerId,
        parent_wo_id: Number(data.parentWoId),
        intake_id: data.intakeId ? Number(data.intakeId) : null,
        overdue_days: data.overdueDays !== undefined && data.overdueDays !== null ? Number(data.overdueDays) : null,
        overdue_km: data.overdueKm !== undefined && data.overdueKm !== null ? Number(data.overdueKm) : null,
        complaint: data.complaint.trim(),
        status: GoodwillClaimStatus.PENDING,
        created_by_id: createdById,
      },
      include: {
        vehicle: { select: { id: true, license_plate: true, make: true, model: true } },
        customer: { select: { id: true, full_name: true, phone: true } },
        created_by: { select: { id: true, full_name: true } },
        parent_wo: { select: { id: true, wo_number: true } },
      },
    });

    return claim;
  }

  /**
   * UC-86: Lấy danh sách hồ sơ bảo hành thiện chí (có phân trang và bộ lọc)
   */
  async listGoodwillClaims(filter: GoodwillClaimsFilter = {}) {
    const page = filter.page && Number(filter.page) > 0 ? Number(filter.page) : 1;
    const limit = filter.limit && Number(filter.limit) > 0 ? Number(filter.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.search && filter.search.trim()) {
      const s = filter.search.trim();
      where.OR = [
        { vehicle: { license_plate: { contains: s } } },
        { customer: { full_name: { contains: s } } },
        { customer: { phone: { contains: s } } },
        { complaint: { contains: s } },
      ];
    }

    const [claims, total] = await Promise.all([
      prisma.goodwillClaim.findMany({
        where,
        include: {
          vehicle: { select: { id: true, license_plate: true, make: true, model: true } },
          customer: { select: { id: true, full_name: true, phone: true } },
          created_by: { select: { id: true, full_name: true } },
          approved_by: { select: { id: true, full_name: true } },
          parent_wo: { select: { id: true, wo_number: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.goodwillClaim.count({ where }),
    ]);

    return {
      claims,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * UC-86: Xem hồ sơ thẩm định toàn diện bảo hành thiện chí
   * Bao gồm thông tin xe, lịch sử dịch vụ của khách hàng, số lần sửa chữa và chi tiết phiếu gốc
   */
  async getGoodwillClaimDetail(claimId: number) {
    if (!claimId || isNaN(Number(claimId))) {
      throw new Error('Mã hồ sơ bảo hành thiện chí không hợp lệ.');
    }

    const claim = await prisma.goodwillClaim.findUnique({
      where: { id: Number(claimId) },
      include: {
        vehicle: true,
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            address: true,
            created_at: true,
          },
        },
        created_by: { select: { id: true, full_name: true, email: true, phone: true } },
        approved_by: { select: { id: true, full_name: true, email: true, phone: true } },
        parent_wo: {
          include: {
            release: true,
            check_in: true,
            services: {
              include: {
                jobs: {
                  include: {
                    parts: {
                      include: {
                        item: {
                          include: {
                            part_category: { select: { name: true } },
                            brand: { select: { name: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!claim) {
      throw new Error('Không tìm thấy hồ sơ yêu cầu bảo hành thiện chí.');
    }

    // Thống kê lịch sử tuân thủ dịch vụ của khách hàng (UC-86 Bước 3)
    const customerCompletedOrders = await prisma.workOrder.findMany({
      where: {
        customer_id: claim.customer_id,
        status: { in: ['RELEASED', 'CLOSED'] },
      },
      select: {
        id: true,
        wo_number: true,
        order_type: true,
        status: true,
        created_at: true,
        release: { select: { released_at: true, odometer_at_release: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    const totalCompletedOrders = await prisma.workOrder.count({
      where: {
        customer_id: claim.customer_id,
        status: { in: ['RELEASED', 'CLOSED'] },
      },
    });

    return {
      claim,
      customerStats: {
        totalCompletedOrders,
        isLoyalCustomer: totalCompletedOrders >= 3,
        historyOrders: customerCompletedOrders,
      },
    };
  }

  /**
   * UC-86: Quản lý phê duyệt bảo hành thiện chí
   * Hỗ trợ 3 mức: FULL (100%), LABOUR_ONLY (miễn công), PERCENTAGE (giảm %)
   */
  async approveGoodwillClaim(claimId: number, managerId: number, dto: ApproveGoodwillClaimDto) {
    if (!claimId || isNaN(Number(claimId))) {
      throw new Error('Mã hồ sơ bảo hành thiện chí không hợp lệ.');
    }

    // Luồng ngoại lệ: Bắt buộc nhập lý do giải trình khi duyệt
    if (!dto.approvalNote || !dto.approvalNote.trim()) {
      throw new Error('Vui lòng nhập lý do giải trình phê duyệt/từ chối');
    }

    const claim = await prisma.goodwillClaim.findUnique({
      where: { id: Number(claimId) },
    });
    if (!claim) {
      throw new Error('Không tìm thấy hồ sơ yêu cầu bảo hành thiện chí.');
    }
    if (claim.status !== GoodwillClaimStatus.PENDING) {
      throw new Error(`Hồ sơ bảo hành thiện chí này đã ở trạng thái ${claim.status}, không thể phê duyệt lại.`);
    }

    const validTypes: GoodwillSupportType[] = ['FULL', 'LABOUR_ONLY', 'PERCENTAGE'];
    if (!dto.supportType || !validTypes.includes(dto.supportType)) {
      throw new Error('Mức độ hỗ trợ thiện chí không hợp lệ (FULL, LABOUR_ONLY, PERCENTAGE).');
    }

    if (dto.supportType === 'PERCENTAGE') {
      const pct = Number(dto.supportPct);
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        throw new Error('Tỷ lệ phần trăm hỗ trợ thiện chí phải từ 1% đến 100%.');
      }
    }

    const updatedClaim = await prisma.goodwillClaim.update({
      where: { id: Number(claimId) },
      data: {
        status: GoodwillClaimStatus.APPROVED,
        support_type: dto.supportType,
        support_pct: dto.supportType === 'PERCENTAGE' ? Number(dto.supportPct) : null,
        approval_note: dto.approvalNote.trim(),
        approved_by_id: managerId,
        approved_at: new Date(),
      },
      include: {
        vehicle: { select: { id: true, license_plate: true } },
        customer: { select: { id: true, full_name: true } },
        approved_by: { select: { id: true, full_name: true } },
      },
    });

    // Thông báo cho nhân viên tạo đề xuất (Cố vấn/Lễ tân)
    const supportLabel =
      dto.supportType === 'FULL'
        ? 'Miễn phí 100% (công + phụ tùng)'
        : dto.supportType === 'LABOUR_ONLY'
        ? 'Miễn phí 100% tiền công'
        : `Hỗ trợ ${dto.supportPct}% chi phí`;

    await prisma.notification
      .create({
        data: {
          user_id: claim.created_by_id,
          notification_type: NotificationType.GENERAL,
          title: `Yêu cầu bảo hành thiện chí #${claim.id} đã được phê duyệt`,
          message: `Quản lý đã phê duyệt hỗ trợ bảo hành thiện chí cho xe ${updatedClaim.vehicle.license_plate} với mức: ${supportLabel}. Ghi chú: ${dto.approvalNote.trim()}`,
          entity_type: 'GOODWILL_CLAIM',
          entity_id: claim.id,
        },
      })
      .catch(() => {});

    return updatedClaim;
  }

  /**
   * UC-86: Quản lý từ chối bảo hành thiện chí
   */
  async rejectGoodwillClaim(claimId: number, managerId: number, dto: RejectGoodwillClaimDto) {
    if (!claimId || isNaN(Number(claimId))) {
      throw new Error('Mã hồ sơ bảo hành thiện chí không hợp lệ.');
    }

    // Luồng ngoại lệ: Bắt buộc nhập lý do từ chối
    if (!dto.approvalNote || !dto.approvalNote.trim()) {
      throw new Error('Vui lòng nhập lý do giải trình phê duyệt/từ chối');
    }

    const claim = await prisma.goodwillClaim.findUnique({
      where: { id: Number(claimId) },
    });
    if (!claim) {
      throw new Error('Không tìm thấy hồ sơ yêu cầu bảo hành thiện chí.');
    }
    if (claim.status !== GoodwillClaimStatus.PENDING) {
      throw new Error(`Hồ sơ bảo hành thiện chí này đã ở trạng thái ${claim.status}, không thể từ chối.`);
    }

    const updatedClaim = await prisma.goodwillClaim.update({
      where: { id: Number(claimId) },
      data: {
        status: GoodwillClaimStatus.REJECTED,
        approval_note: dto.approvalNote.trim(),
        approved_by_id: managerId,
        approved_at: new Date(),
      },
      include: {
        vehicle: { select: { id: true, license_plate: true } },
        customer: { select: { id: true, full_name: true } },
        approved_by: { select: { id: true, full_name: true } },
      },
    });

    // Thông báo cho nhân viên tạo đề xuất để giải thích với khách (UC-86 Bước 6b)
    await prisma.notification
      .create({
        data: {
          user_id: claim.created_by_id,
          notification_type: NotificationType.GENERAL,
          title: `Yêu cầu bảo hành thiện chí #${claim.id} bị từ chối`,
          message: `Quản lý từ chối yêu cầu bảo hành thiện chí cho xe ${updatedClaim.vehicle.license_plate}. Lý do: ${dto.approvalNote.trim()}`,
          entity_type: 'GOODWILL_CLAIM',
          entity_id: claim.id,
        },
      })
      .catch(() => {});

    return updatedClaim;
  }
}

