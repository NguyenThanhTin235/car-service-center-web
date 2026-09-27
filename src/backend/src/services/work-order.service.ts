import { IntakeType, WorkOrderSourceType } from '@prisma/client';
import prisma from '../utils/prisma';
import { WorkOrderRepository } from '../repositories/work-order.repository';
import { IntakeRepository } from '../repositories/intake.repository';

const workOrderRepo = new WorkOrderRepository();
const intakeRepo = new IntakeRepository();

/**
 * Map IntakeType → WorkOrderSourceType
 */
function mapIntakeToSourceType(intakeType: IntakeType): WorkOrderSourceType {
  const mapping: Record<IntakeType, WorkOrderSourceType> = {
    WALK_IN: 'WALK_IN',
    TOW_IN: 'TOW_IN',
    APPOINTMENT: 'APPOINTMENT',
  };
  return mapping[intakeType];
}

export class WorkOrderService {
  /**
   * Tạo Work Order từ một IntakeRecord
   *
   * Business Rules:
   * 1. IntakeRecord phải tồn tại
   * 2. IntakeRecord.status phải = QUEUED
   * 3. Xe không được có Work Order đang mở (status ≠ CLOSED/CANCELLED)
   * 4. Tự động sinh wo_number theo ngày (WO-YYMMDD-XXX)
   * 5. Sau khi tạo WO, chuyển IntakeRecord.status → CONVERTED
   */
  async createWorkOrder(intakeRecordId: number, advisorId: number) {
    return prisma.$transaction(async (tx) => {
      // 1. Tìm IntakeRecord
      const intake = await tx.intakeRecord.findUnique({
        where: { id: intakeRecordId },
        include: {
          customer: { select: { id: true } },
          vehicle: { select: { id: true } },
        },
      });

      if (!intake) {
        throw new Error('Không tìm thấy phiếu tiếp nhận.');
      }

      // 2. Kiểm tra trạng thái intake
      if (intake.status !== 'QUEUED') {
        throw new Error(
          `Phiếu tiếp nhận không ở trạng thái chờ xử lý. Trạng thái hiện tại: ${intake.status}`
        );
      }

      // 3. Kiểm tra thông tin bắt buộc
      if (!intake.customer_id || !intake.vehicle_id) {
        throw new Error(
          'Phiếu tiếp nhận thiếu thông tin khách hàng hoặc phương tiện. Không thể tạo phiếu công việc.'
        );
      }

      // 4. Kiểm tra xe chưa có WO đang mở
      const activeWo = await workOrderRepo.findActiveByVehicleId(intake.vehicle_id);
      if (activeWo) {
        throw new Error(
          `Xe này đang có phiếu công việc đang xử lý (${activeWo.wo_number} - ${activeWo.status}). Vui lòng đóng phiếu cũ trước.`
        );
      }

      // 5. Sinh mã WO
      const woNumber = await workOrderRepo.generateWoNumber(tx);

      // 6. Xác định source_type và appointment_id
      const sourceType = mapIntakeToSourceType(intake.intake_type);

      // Tìm appointment_id nếu intake có nguồn từ lịch hẹn
      let appointmentId: number | null = null;
      if (intake.intake_type === 'APPOINTMENT') {
        const appointment = await tx.appointment.findFirst({
          where: {
            customer_id: intake.customer_id,
            vehicle_id: intake.vehicle_id,
            status: 'ARRIVED',
          },
          orderBy: { created_at: 'desc' },
          select: { id: true },
        });
        appointmentId = appointment?.id ?? null;
      }

      // 7. Tạo Work Order
      const workOrder = await workOrderRepo.createInTransaction(tx, {
        wo_number: woNumber,
        customer_id: intake.customer_id,
        vehicle_id: intake.vehicle_id,
        advisor_id: advisorId,
        source_type: sourceType,
        intake_record_id: intakeRecordId,
        appointment_id: appointmentId,
        status: 'DRAFT',
        created_by_id: advisorId,
      });

      // 8. Cập nhật IntakeRecord → CONVERTED
      await tx.intakeRecord.update({
        where: { id: intakeRecordId },
        data: { status: 'CONVERTED' },
      });

      return workOrder;
    });
  }

  /**
   * Lấy danh sách hàng đợi tiếp nhận cho Advisor
   * (Chỉ lấy IntakeRecord có status = QUEUED)
   */
  async getIntakeQueueForAdvisor(filters: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return intakeRepo.findAll({
      status: 'QUEUED',
      search: filters.search,
      page: filters.page || 1,
      limit: filters.limit || 20,
    });
  }

  /**
   * Lấy chi tiết Work Order
   */
  async getWorkOrderById(id: number) {
    const wo = await workOrderRepo.findById(id);
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');
    return wo;
  }

  /**
   * Cập nhật thông tin phiếu công việc (Odometer, Ghi chú)
   */
  async updateWorkOrder(id: number, data: { notes?: string; current_km?: number | null }) {
    const wo = await prisma.workOrder.findUnique({ where: { id } });
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');

    if (wo.intake_record_id && data.notes !== undefined) {
      await prisma.intakeRecord.update({
        where: { id: wo.intake_record_id },
        data: { notes: data.notes }
      });
    }

    if (data.current_km !== undefined && data.current_km !== null) {
      const checkIn = await prisma.checkIn.findUnique({ where: { work_order_id: id } });
      if (checkIn) {
        await prisma.checkIn.update({
          where: { id: checkIn.id },
          data: { mileage: data.current_km }
        });
      } else {
        await prisma.checkIn.create({
          data: {
            work_order_id: id,
            mileage: data.current_km,
            fuel_level: 'EMPTY',
            complaint: data.notes || '',
            exterior_condition: '',
            status: 'PENDING_CONFIRMATION',
            created_by_id: wo.created_by_id
          }
        });
      }
    }

    return prisma.workOrder.findUnique({
      where: { id },
      include: {
        intake_record: true,
        check_in: true
      }
    });
  }
}
