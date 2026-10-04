import { FuelLevel } from '@prisma/client';
import prisma from '../utils/prisma';
import { CheckInRepository } from '../repositories/check-in.repository';
import { WorkOrderRepository } from '../repositories/work-order.repository';

const checkInRepo = new CheckInRepository();
const workOrderRepo = new WorkOrderRepository();

export class CheckInService {
  /**
   * Tạo mới hoặc cập nhật thông tin Check-in (Ghi nhận tình trạng xe)
   */
  async createOrUpdateCheckIn(
    workOrderId: number,
    data: {
      mileage?: number;
      fuel_level?: FuelLevel;
      complaint?: string;
      belongings?: string | null;
      exterior_condition?: string;
      evidence_urls?: string[];
    },
    userId: number
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Kiểm tra Work Order tồn tại
      const workOrder = await tx.workOrder.findUnique({
        where: { id: workOrderId },
        include: { check_in: true },
      });

      if (!workOrder) {
        throw new Error('Không tìm thấy phiếu công việc.');
      }

      // 2. Chỉ cho phép chỉnh sửa check-in khi WO ở trạng thái DRAFT hoặc IN_PLANNING
      if (!['DRAFT', 'IN_PLANNING'].includes(workOrder.status)) {
        throw new Error(`Không thể cập nhật tình trạng xe ở trạng thái ${workOrder.status}`);
      }

      let checkIn;

      // 3. Tạo mới nếu chưa có, cập nhật nếu đã có
      if (workOrder.check_in) {
        checkIn = await tx.checkIn.update({
          where: { id: workOrder.check_in.id },
          data: {
            ...data,
            evidence_urls: data.evidence_urls ? data.evidence_urls : undefined,
          },
        });
      } else {
        // Validation thủ công thêm cho create vì các trường này là bắt buộc theo schema DB
        if (
          data.mileage === undefined ||
          !data.fuel_level ||
          !data.complaint ||
          !data.exterior_condition
        ) {
          throw new Error('Thiếu thông tin bắt buộc để tạo ghi nhận tình trạng xe.');
        }

        checkIn = await tx.checkIn.create({
          data: {
            work_order_id: workOrderId,
            mileage: data.mileage,
            fuel_level: data.fuel_level,
            complaint: data.complaint,
            exterior_condition: data.exterior_condition,
            belongings: data.belongings,
            evidence_urls: data.evidence_urls || [],
            status: 'PENDING_CONFIRMATION',
            created_by_id: userId,
          },
        });
      }

      // Note: Trạng thái WO chỉ chuyển sang IN_PLANNING khi khách hàng đã ký xác nhận
      return checkIn;
    });
  }

  /**
   * Xác nhận CheckIn (Khách hàng ký)
   */
  async confirmCheckIn(workOrderId: number) {
    return prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { id: workOrderId },
        include: { check_in: true }
      });

      if (!workOrder) throw new Error('Không tìm thấy phiếu công việc.');
      if (!workOrder.check_in) throw new Error('Chưa có dữ liệu ghi nhận tình trạng xe.');
      
      if (workOrder.check_in.status === 'CONFIRMED') {
        throw new Error('Tình trạng xe đã được xác nhận trước đó.');
      }

      // Cập nhật trạng thái CheckIn
      const checkIn = await tx.checkIn.update({
        where: { id: workOrder.check_in.id },
        data: {
          status: 'CONFIRMED',
          confirmed_at: new Date(),
        }
      });

      // Khi khách hàng ký xác nhận, chuyển WO sang IN_PLANNING (Lập kế hoạch)
      if (workOrder.status === 'DRAFT') {
        await tx.workOrder.update({
          where: { id: workOrderId },
          data: { status: 'IN_PLANNING' }
        });
      }

      return checkIn;
    });
  }

  /**
   * Lấy chi tiết Check-in theo Work Order ID
   */
  async getCheckInByWorkOrderId(workOrderId: number) {
    return checkInRepo.findByWorkOrderId(workOrderId);
  }
}
