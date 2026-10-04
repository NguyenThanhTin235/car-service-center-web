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
   */
  async getIntakeQueueForAdvisor(filters: {
    status?: any;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return intakeRepo.findAll({
      status: filters.status,
      search: filters.search,
      page: filters.page || 1,
      limit: filters.limit || 50,
    });
  }

  /**
   * Lấy danh sách Work Order
   */
  async getWorkOrders(filters: {
    status?: any;
    advisorId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return workOrderRepo.findAll(filters);
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
   * Cập nhật thông tin phiếu công việc (Ghi chú)
   */
  async updateWorkOrder(id: number, data: { notes?: string }) {
    const wo = await prisma.workOrder.findUnique({ where: { id } });
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');

    if (wo.intake_record_id && data.notes !== undefined) {
      await prisma.intakeRecord.update({
        where: { id: wo.intake_record_id },
        data: { notes: data.notes }
      });
    }

    return prisma.workOrder.findUnique({
      where: { id },
      include: {
        intake_record: true,
        check_in: true
      }
    });
  }

  // ==========================================
  // UC-31: Thêm hạng mục dịch vụ vào Work Order
  // ==========================================

  /**
   * Thêm một dịch vụ từ danh mục (ServiceTemplate) vào Work Order
   *
   * Business Rules:
   * 1. WO phải tồn tại và đang mở (status ≠ CLOSED, CANCELLED, RELEASED)
   * 2. ServiceTemplate phải tồn tại và active
   * 3. Không được thêm trùng lặp cùng service_template_id trong WO
   * 4. Tự động copy name, pricing_type từ ServiceTemplate
   * 5. sort_order = max hiện tại + 1
   */
  async addService(workOrderId: number, serviceTemplateId: number) {
    // 1. Kiểm tra WO tồn tại
    const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');

    // 2. Kiểm tra WO đang mở
    const closedStatuses = ['CLOSED', 'CANCELLED', 'RELEASED'];
    if (closedStatuses.includes(wo.status)) {
      throw new Error(`Phiếu công việc đã ${wo.status === 'CLOSED' ? 'đóng' : wo.status === 'CANCELLED' ? 'hủy' : 'giao xe'}. Không thể thêm dịch vụ.`);
    }

    // 3. Kiểm tra ServiceTemplate tồn tại và active
    const template = await prisma.serviceTemplate.findUnique({
      where: { id: serviceTemplateId },
    });
    if (!template) throw new Error('Không tìm thấy dịch vụ trong danh mục.');
    if (!template.is_active) throw new Error('Dịch vụ này đã bị vô hiệu hóa.');

    // 4. Kiểm tra trùng lặp
    const existing = await prisma.woService.findFirst({
      where: {
        work_order_id: workOrderId,
        service_template_id: serviceTemplateId,
      },
    });
    if (existing) throw new Error(`Dịch vụ "${template.name}" đã có trong phiếu công việc.`);

    // 5. Tính sort_order mới
    const maxSort = await prisma.woService.aggregate({
      where: { work_order_id: workOrderId },
      _max: { sort_order: true },
    });
    const nextSortOrder = (maxSort._max.sort_order ?? 0) + 1;

    // 6. Tạo WoService
    const woService = await prisma.woService.create({
      data: {
        work_order_id: workOrderId,
        service_template_id: serviceTemplateId,
        name: template.name,
        pricing_type: template.pricing_type,
        status: 'PENDING',
        sort_order: nextSortOrder,
      },
      include: {
        service_template: {
          select: {
            id: true,
            name: true,
            category_id: true,
            pricing_type: true,
            fixed_price: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    return woService;
  }

  // ==========================================
  // UC-32: Xóa hạng mục dịch vụ khỏi Work Order
  // ==========================================

  /**
   * Xóa một dịch vụ khỏi Work Order
   *
   * Business Rules:
   * 1. WO phải tồn tại và đang mở
   * 2. WoService phải tồn tại và thuộc về WO này
   * 3. Không xóa nếu WoService đã có Job, Inspection hoặc QuotationLine liên kết
   */
  async removeService(workOrderId: number, woServiceId: number) {
    // 1. Kiểm tra WO tồn tại
    const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');

    // 2. Kiểm tra WO đang mở
    const closedStatuses = ['CLOSED', 'CANCELLED', 'RELEASED'];
    if (closedStatuses.includes(wo.status)) {
      throw new Error(`Phiếu công việc đã ${wo.status === 'CLOSED' ? 'đóng' : wo.status === 'CANCELLED' ? 'hủy' : 'giao xe'}. Không thể xóa dịch vụ.`);
    }

    // 3. Kiểm tra WoService tồn tại và thuộc WO
    const woService = await prisma.woService.findUnique({
      where: { id: woServiceId },
      include: {
        jobs: { select: { id: true }, take: 1 },
        inspections: { select: { id: true }, take: 1 },
        quotation_lines: { select: { id: true }, take: 1 },
      },
    });

    if (!woService) throw new Error('Không tìm thấy hạng mục dịch vụ.');
    if (woService.work_order_id !== workOrderId) {
      throw new Error('Hạng mục dịch vụ không thuộc phiếu công việc này.');
    }

    // 4. Kiểm tra ràng buộc con
    if (woService.jobs.length > 0) {
      throw new Error(`Không thể xóa dịch vụ "${woService.name}" vì đã có công việc (Job) liên kết. Vui lòng xóa Job trước.`);
    }
    if (woService.inspections.length > 0) {
      throw new Error(`Không thể xóa dịch vụ "${woService.name}" vì đã có bản kiểm tra (Inspection) liên kết.`);
    }
    if (woService.quotation_lines.length > 0) {
      throw new Error(`Không thể xóa dịch vụ "${woService.name}" vì đã có dòng báo giá (Quotation) liên kết.`);
    }

    // 5. Xóa WoService
    await prisma.woService.delete({ where: { id: woServiceId } });

    return { deleted: true, serviceName: woService.name };
  }
}
