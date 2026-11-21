import prisma from '../utils/prisma';

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
}

