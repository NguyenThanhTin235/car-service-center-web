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
          services: { include: { service: true } },
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

      // 7.5. Copy dịch vụ yêu cầu từ Intake -> WoService
      if (intake.services && intake.services.length > 0) {
        let sortOrder = 0;
        for (const is of intake.services) {
          if (is.service) {
            await tx.woService.create({
              data: {
                work_order_id: workOrder.id,
                service_id: is.service.id,
                name: is.service.name,
                pricing_type: is.service.pricing_type,
                status: 'PENDING',
                sort_order: ++sortOrder,
              }
            });
          }
        }
      }

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
   * Thêm một dịch vụ từ danh mục (Service) vào Work Order
   *
   * Business Rules:
   * 1. WO phải tồn tại và đang mở (status ≠ CLOSED, CANCELLED, RELEASED)
   * 2. Service phải tồn tại và active
   * 3. Không được thêm trùng lặp cùng service_id trong WO
   * 4. Tự động copy name, pricing_type từ Service
   * 5. sort_order = max hiện tại + 1
   */
  async addService(workOrderId: number, serviceId: number) {
    // 1. Kiểm tra WO tồn tại
    const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');

    // 2. Kiểm tra WO đang mở
    const closedStatuses = ['CLOSED', 'CANCELLED', 'RELEASED'];
    if (closedStatuses.includes(wo.status)) {
      throw new Error(`Phiếu công việc đã ${wo.status === 'CLOSED' ? 'đóng' : wo.status === 'CANCELLED' ? 'hủy' : 'giao xe'}. Không thể thêm dịch vụ.`);
    }

    // 3. Kiểm tra Service tồn tại và active
    const template = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!template) throw new Error('Không tìm thấy dịch vụ trong danh mục.');
    if (!template.is_active) throw new Error('Dịch vụ này đã bị vô hiệu hóa.');

    // 4. Kiểm tra trùng lặp
    const existing = await prisma.woService.findFirst({
      where: {
        work_order_id: workOrderId,
        service_id: serviceId,
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
        service_id: serviceId,
        name: template.name,
        pricing_type: template.pricing_type,
        status: 'PENDING',
        sort_order: nextSortOrder,
      },
      include: {
        service: {
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
        jobs: {
          include: {
            labours: true,
            findings: true,
          },
        },
        inspections: { select: { id: true }, take: 1 },
        quotation_lines: { select: { id: true }, take: 1 },
      },
    });

    if (!woService) throw new Error('Không tìm thấy hạng mục dịch vụ.');
    if (woService.work_order_id !== workOrderId) {
      throw new Error('Hạng mục dịch vụ không thuộc phiếu công việc này.');
    }

    // 4. Kiểm tra ràng buộc con: Cho phép xóa nếu chưa có việc hoặc việc chưa phân công
    const assignedJobs = woService.jobs.filter(
      (j) =>
        j.status !== 'PLANNED' ||
        (j.labours && j.labours.some((l) => l.employee_id !== null))
    );
    if (assignedJobs.length > 0) {
      const jobNames = assignedJobs.map((j) => j.name).join(', ');
      throw new Error(`Không thể xóa dịch vụ "${woService.name}" vì có công việc (${jobNames}) đã được phân công hoặc đang thực hiện.`);
    }

    if (woService.quotation_lines.length > 0) {
      throw new Error(`Không thể xóa dịch vụ "${woService.name}" vì đã có dòng báo giá (Quotation) liên kết.`);
    }

    // Thu thập các vết lỗi (Finding) trên bảng kiểm tra xe liên kết với hạng mục này để xóa đồng bộ
    const findingIdsToDelete: number[] = [];

    // 1. Lấy từ các job_findings của các job thuộc hạng mục
    for (const job of woService.jobs) {
      if (job.findings) {
        for (const jf of job.findings) {
          if (!findingIdsToDelete.includes(jf.finding_id)) {
            findingIdsToDelete.push(jf.finding_id);
          }
        }
      }
    }

    // 2. Tìm vết lỗi trên sơ đồ xe có tên và vị trí khớp với hạng mục (sinh tự động)
    const woInspection = await prisma.inspection.findFirst({
      where: { work_order_id: workOrderId },
      include: { findings: true },
    });

    if (woInspection && woInspection.findings.length > 0) {
      const markerLabels: Record<string, string> = {
        DENT: 'Móp méo',
        SCRATCH: 'Trầy xước',
        DAMAGE: 'Hư hỏng bể vỡ',
        RUST: 'Rỉ sét',
        MISSING: 'Thiếu phụ tùng',
      };

      for (const f of woInspection.findings) {
        const mLabel = markerLabels[f.marker_type || ''] || f.marker_type || '';
        const exactAutoName = `Khắc phục lỗi: ${mLabel} tại ${f.part_name || 'bộ phận xe'}`;
        const isMatched =
          woService.name.trim().toLowerCase() === exactAutoName.trim().toLowerCase() ||
          (f.part_name &&
            mLabel &&
            woService.name.toLowerCase().includes(f.part_name.toLowerCase()) &&
            woService.name.toLowerCase().includes(mLabel.toLowerCase()));

        if (isMatched && !findingIdsToDelete.includes(f.id)) {
          findingIdsToDelete.push(f.id);
        }
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Dọn dẹp các job chưa phân công (nếu có) trước khi xóa WoService
      for (const job of woService.jobs) {
        await tx.jobFinding.deleteMany({ where: { job_id: job.id } });
        await tx.jobLabour.deleteMany({ where: { job_id: job.id } });
        await tx.jobPart.deleteMany({ where: { job_id: job.id } });
        await tx.job.delete({ where: { id: job.id } });
      }

      // Xóa WoService
      await tx.woService.delete({ where: { id: woServiceId } });

      // Xóa các bản ghi trên bảng kiểm tra xe (findings) liên quan đến hạng mục này
      for (const fid of findingIdsToDelete) {
        // Kiểm tra xem finding có còn liên kết với job nào thuộc hạng mục khác không
        const otherJobLinks = await tx.jobFinding.count({
          where: {
            finding_id: fid,
          },
        });
        if (otherJobLinks === 0) {
          await tx.finding.delete({
            where: { id: fid },
          });
        }
      }

      return {
        deleted: true,
        serviceName: woService.name,
        deletedFindingsCount: findingIdsToDelete.length,
      };
    });
  }

  /**
   * Cập nhật thông tin hạng mục dịch vụ (WoService)
   * Chỉ cho phép sửa khi chưa có việc hoặc việc chưa phân công
   */
  async updateService(workOrderId: number, woServiceId: number, data: { name?: string; pricing_type?: any }) {
    const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');

    const closedStatuses = ['CLOSED', 'CANCELLED', 'RELEASED'];
    if (closedStatuses.includes(wo.status)) {
      throw new Error(`Phiếu công việc đã kết thúc. Không thể sửa dịch vụ.`);
    }

    const woService = await prisma.woService.findUnique({
      where: { id: woServiceId },
      include: { jobs: { include: { labours: true } } },
    });

    if (!woService || woService.work_order_id !== workOrderId) {
      throw new Error('Không tìm thấy hạng mục dịch vụ trên phiếu.');
    }

    const assignedJobs = woService.jobs.filter(
      (j) =>
        j.status !== 'PLANNED' ||
        (j.labours && j.labours.some((l) => l.employee_id !== null))
    );
    if (assignedJobs.length > 0) {
      throw new Error(`Không thể sửa dịch vụ "${woService.name}" vì đã có công việc được phân công hoặc đang thực hiện.`);
    }

    const updated = await prisma.woService.update({
      where: { id: woServiceId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.pricing_type && { pricing_type: data.pricing_type }),
      },
    });

    return updated;
  }

  /**
   * Tạo nhanh Hạng mục sửa chữa & Công việc con từ 1 vết lỗi (Finding)
   */
  async createServiceFromFinding(workOrderId: number, findingId: number, advisorUserId: number) {
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        inspection: true,
        job_findings: true,
      },
    });

    if (!finding) throw new Error('Không tìm thấy vết lỗi kiểm tra xe.');
    if (finding.inspection.work_order_id !== workOrderId) {
      throw new Error('Vết lỗi không thuộc về phiếu công việc này.');
    }

    const markerLabel =
      finding.marker_type === 'DENT'
        ? 'Móp méo'
        : finding.marker_type === 'SCRATCH'
        ? 'Trầy xước'
        : finding.marker_type === 'DAMAGE'
        ? 'Hư hỏng bể vỡ'
        : finding.marker_type === 'RUST'
        ? 'Rỉ sét'
        : finding.marker_type === 'MISSING'
        ? 'Thiếu phụ tùng'
        : finding.marker_type || 'Lỗi kỹ thuật';

    const serviceName = `Khắc phục lỗi: ${markerLabel} tại ${finding.part_name || 'bộ phận xe'}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Tính sort_order
      const maxSort = await tx.woService.aggregate({
        where: { work_order_id: workOrderId },
        _max: { sort_order: true },
      });
      const nextSortOrder = (maxSort._max.sort_order ?? 0) + 1;

      // 2. Tạo WoService
      const woService = await tx.woService.create({
        data: {
          work_order_id: workOrderId,
          name: serviceName,
          pricing_type: 'LABOUR_PARTS',
          status: 'PENDING',
          sort_order: nextSortOrder,
        },
      });

      // 3. Lấy default job type
      const defaultJobType = await tx.jobType.findFirst();

      // 4. Tạo Job con xử lý lỗi này
      const newJob = await tx.job.create({
        data: {
          wo_service_id: woService.id,
          job_type_id: defaultJobType?.id,
          name: `Xử lý ${markerLabel.toLowerCase()} ${finding.part_name || ''}`.trim(),
          description:
            finding.description ||
            `Tiến hành kiểm tra và khắc phục ${markerLabel} tại ${finding.part_name || ''}`,
          estimated_hours: 1.0,
          status: 'PLANNED',
          created_by_id: advisorUserId,
        },
      });

      // 5. Tạo JobLabour
      if (defaultJobType) {
        await tx.jobLabour.create({
          data: {
            job_id: newJob.id,
            job_type_id: defaultJobType.id,
            estimated_hours: 1.0,
            price: 150000,
          },
        });
      }

      // 6. Liên kết JobFinding & Đổi status finding
      await tx.jobFinding.create({
        data: {
          job_id: newJob.id,
          finding_id: finding.id,
        },
      });

      await tx.finding.update({
        where: { id: finding.id },
        data: { status: 'LINKED_TO_JOB' },
      });

      return {
        service: woService,
        job: newJob,
      };
    });
  }

  /**
   * Tạo công việc thủ công (Dispatch Job) cho Work Order
   */
  async createManualJob(
    workOrderId: number,
    advisorUserId: number,
    data: {
      finding_id?: number | null;
      finding_ids?: number[];
      wo_service_id?: number | null;
      new_service_name?: string | null;
      name: string;
      job_type_id?: number | null;
      technician_id?: number | null;
      description?: string | null;
      estimated_hours?: number | null;
      labours?: Array<{
        task_name?: string;
        employee_id?: number | null;
        start_time?: string | null;
        end_time?: string | null;
        estimated_hours?: number | null;
        price?: number | null;
        job_type_id?: number | null;
      }>;
      parts?: Array<{
        item_id: number;
        quantity: number;
        unit_price?: number;
      }>;
    }
  ) {
    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { services: true },
    });

    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');
    const closedStatuses = ['CLOSED', 'CANCELLED', 'RELEASED'];
    if (closedStatuses.includes(wo.status)) {
      throw new Error(`Phiếu công việc đã ở trạng thái ${wo.status}, không thể thêm công việc.`);
    }

    if (!data.name || !data.name.trim()) {
      throw new Error('Tên công việc không được để trống.');
    }

    if (data.technician_id) {
      const tech = await prisma.employee.findUnique({
        where: { id: data.technician_id },
        select: { id: true, position: true, is_active: true },
      });
      if (!tech || tech.position !== 'TECHNICIAN') {
        throw new Error('Nhân viên được phân công phải là kỹ thuật viên (TECHNICIAN).');
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Xác định hoặc tạo WoService
      let targetServiceId = data.wo_service_id;

      if (targetServiceId) {
        const existSvc = await tx.woService.findFirst({
          where: { id: targetServiceId, work_order_id: workOrderId },
        });
        if (!existSvc) {
          targetServiceId = undefined;
        }
      }

      if (!targetServiceId) {
        // Tìm tên dịch vụ phù hợp
        let serviceName = data.new_service_name?.trim();

        if (!serviceName && data.finding_id) {
          const finding = await tx.finding.findUnique({ where: { id: data.finding_id } });
          if (finding) {
            const markerLabel =
              finding.marker_type === 'DENT'
                ? 'Móp méo'
                : finding.marker_type === 'SCRATCH'
                ? 'Trầy xước'
                : finding.marker_type === 'DAMAGE'
                ? 'Hư hỏng bể vỡ'
                : finding.marker_type === 'RUST'
                ? 'Rỉ sét'
                : finding.marker_type === 'MISSING'
                ? 'Thiếu phụ tùng'
                : finding.marker_type || 'Lỗi kỹ thuật';
            serviceName = `Khắc phục lỗi: ${markerLabel} tại ${finding.part_name || 'bộ phận xe'}`;
          }
        }

        if (!serviceName) {
          serviceName = 'Hạng mục sửa chữa & khắc phục kỹ thuật';
        }

        // Kiểm tra xem dịch vụ này đã có sẵn trong WO chưa để tái sử dụng
        const existingService = await tx.woService.findFirst({
          where: { work_order_id: workOrderId, name: serviceName },
        });

        if (existingService) {
          targetServiceId = existingService.id;
        } else {
          const maxSort = await tx.woService.aggregate({
            where: { work_order_id: workOrderId },
            _max: { sort_order: true },
          });
          const nextSortOrder = (maxSort._max.sort_order ?? 0) + 1;

          const createdService = await tx.woService.create({
            data: {
              work_order_id: workOrderId,
              name: serviceName,
              pricing_type: 'LABOUR_PARTS',
              status: 'PENDING',
              sort_order: nextSortOrder,
            },
          });
          targetServiceId = createdService.id;
        }
      }

      // 2. Lấy default job type nếu chưa có
      let finalJobTypeId = data.job_type_id;
      if (!finalJobTypeId) {
        const defaultJobType = await tx.jobType.findFirst();
        finalJobTypeId = defaultJobType?.id;
      }

      // 3. Tính tổng giờ ước tính
      let totalEstHours = data.estimated_hours ? Number(data.estimated_hours) : 0;
      if (!totalEstHours && data.labours && data.labours.length > 0) {
        totalEstHours = data.labours.reduce((sum, l) => sum + (Number(l.estimated_hours) || 0), 0);
      }
      if (!totalEstHours) totalEstHours = 1.0;

      // 4. Tạo Job
      const newJob = await tx.job.create({
        data: {
          wo_service_id: targetServiceId,
          job_type_id: finalJobTypeId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          estimated_hours: totalEstHours,
          status: 'PLANNED',
          created_by_id: advisorUserId,
        },
      });

      // 5. Gắn Finding (job_findings)
      const findingIdsToLink: number[] = [];
      if (data.finding_id) findingIdsToLink.push(data.finding_id);
      if (data.finding_ids && Array.isArray(data.finding_ids)) {
        data.finding_ids.forEach((id) => {
          if (!findingIdsToLink.includes(id)) findingIdsToLink.push(id);
        });
      }

      for (const fid of findingIdsToLink) {
        const f = await tx.finding.findUnique({ where: { id: fid } });
        if (f) {
          await tx.jobFinding.upsert({
            where: {
              job_id_finding_id: {
                job_id: newJob.id,
                finding_id: fid,
              },
            },
            create: {
              job_id: newJob.id,
              finding_id: fid,
            },
            update: {},
          });

          await tx.finding.update({
            where: { id: fid },
            data: { status: 'LINKED_TO_JOB' },
          });
        }
      }

      // 6. Gắn Labour lines
      if (data.labours && data.labours.length > 0) {
        for (const lab of data.labours) {
          await tx.jobLabour.create({
            data: {
              job_id: newJob.id,
              job_type_id: lab.job_type_id || finalJobTypeId || 1,
              description: lab.task_name || data.name,
              employee_id: lab.employee_id || data.technician_id || null,
              estimated_hours: Number(lab.estimated_hours) || 1.0,
              price: Number(lab.price) || 150000,
            },
          });
        }
      } else if (data.technician_id || finalJobTypeId) {
        // Tạo 1 dòng labour mặc định để gắn kỹ thuật viên
        await tx.jobLabour.create({
          data: {
            job_id: newJob.id,
            job_type_id: finalJobTypeId || 1,
            description: data.name,
            employee_id: data.technician_id || null,
            estimated_hours: totalEstHours,
            price: 150000,
          },
        });
      }

      // 7. Gắn Part lines
      if (data.parts && data.parts.length > 0) {
        for (const p of data.parts) {
          if (p.item_id) {
            await tx.jobPart.create({
              data: {
                job_id: newJob.id,
                item_id: p.item_id,
                planned_quantity: Number(p.quantity) || 1,
                unit_price: Number(p.unit_price) || 0,
                status: 'PLANNED',
              },
            });
          }
        }
      }

      const fullJob = await tx.job.findUnique({
        where: { id: newJob.id },
        include: {
          job_type: true,
          labours: { include: { employee: true } },
          parts: { include: { item: true } },
          findings: { include: { finding: true } },
        },
      });

      return {
        service_id: targetServiceId,
        job: fullJob,
      };
    });
  }

  /**
   * Cập nhật công việc thủ công khi chưa phân công (status === 'PLANNED')
   */
  async updateManualJob(
    workOrderId: number,
    jobId: number,
    advisorUserId: number,
    data: {
      name?: string;
      job_type_id?: number | null;
      technician_id?: number | null;
      description?: string | null;
      estimated_hours?: number | null;
    }
  ) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        wo_service: true,
        labours: true,
      },
    });

    if (!job) throw new Error('Không tìm thấy công việc.');
    if (job.wo_service.work_order_id !== workOrderId) {
      throw new Error('Công việc không thuộc phiếu công việc này.');
    }

    // Chỉ có thể sửa khi chưa phân công (status === 'PLANNED')
    if (job.status !== 'PLANNED') {
      throw new Error(
        `Không thể chỉnh sửa công việc đã ở trạng thái ${job.status}. Chỉ có thể sửa khi chưa phân công (Chờ điều phối).`
      );
    }

    if (data.technician_id) {
      const tech = await prisma.employee.findUnique({
        where: { id: data.technician_id },
        select: { id: true, position: true, is_active: true },
      });
      if (!tech || tech.position !== 'TECHNICIAN') {
        throw new Error('Nhân viên được phân công phải là kỹ thuật viên (TECHNICIAN).');
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Cập nhật Job
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          name: data.name !== undefined ? data.name.trim() : undefined,
          job_type_id: data.job_type_id !== undefined ? data.job_type_id : undefined,
          description: data.description !== undefined ? data.description?.trim() || null : undefined,
          estimated_hours:
            data.estimated_hours !== undefined ? Number(data.estimated_hours) || 1.0 : undefined,
        },
        include: {
          job_type: true,
          labours: {
            include: { employee: true },
          },
        },
      });

      // 2. Cập nhật hoặc tạo Labour line nếu có thay đổi kỹ thuật viên hoặc thông tin
      const estHours =
        data.estimated_hours !== undefined
          ? Number(data.estimated_hours) || 1.0
          : Number(job.estimated_hours) || 1.0;
      const jTypeId = data.job_type_id !== undefined ? data.job_type_id : job.job_type_id;

      if (job.labours.length > 0) {
        await tx.jobLabour.update({
          where: { id: job.labours[0].id },
          data: {
            employee_id:
              data.technician_id !== undefined ? data.technician_id : job.labours[0].employee_id,
            job_type_id: jTypeId || undefined,
            estimated_hours: estHours,
            description: data.name?.trim() || job.name,
          },
        });
      } else if (data.technician_id || jTypeId) {
        await tx.jobLabour.create({
          data: {
            job_id: jobId,
            employee_id: data.technician_id || null,
            description: data.name?.trim() || job.name,
            job_type_id: jTypeId || 1,
            estimated_hours: estHours,
            price: 150000,
          },
        });
      }

      const fullUpdatedJob = await tx.job.findUnique({
        where: { id: jobId },
        include: {
          job_type: true,
          labours: { include: { employee: true } },
          findings: { include: { finding: true } },
        },
      });

      return fullUpdatedJob;
    });
  }

  /**
   * Xóa công việc khi chưa phân công
   */
  async deleteJob(workOrderId: number, jobId: number, advisorUserId: number) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        wo_service: true,
        labours: true,
        findings: true,
      },
    });

    if (!job) throw new Error('Không tìm thấy công việc.');
    if (job.wo_service.work_order_id !== workOrderId) {
      throw new Error('Công việc không thuộc phiếu công việc này.');
    }

    // Cho phép xóa công việc khi còn ở trạng thái lập kế hoạch (PLANNED)
    if (job.status !== 'PLANNED') {
      throw new Error(`Không thể xóa công việc đang ở trạng thái ${job.status}.`);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Phục hồi trạng thái các vết lỗi (Finding) nếu có
      if (job.findings && job.findings.length > 0) {
        for (const jf of job.findings) {
          const otherLinks = await tx.jobFinding.count({
            where: {
              finding_id: jf.finding_id,
              job_id: { not: jobId },
            },
          });
          if (otherLinks === 0) {
            await tx.finding.update({
              where: { id: jf.finding_id },
              data: { status: 'NEW' },
            });
          }
        }
        await tx.jobFinding.deleteMany({
          where: { job_id: jobId },
        });
      }

      // 2. Xóa các bản ghi phụ thuộc
      await tx.jobLabour.deleteMany({ where: { job_id: jobId } });
      await tx.jobPart.deleteMany({ where: { job_id: jobId } });

      // 3. Xóa chính job
      await tx.job.delete({ where: { id: jobId } });

      return { success: true, message: `Đã xóa công việc "${job.name}"` };
    });
  }

  /**
   * Cập nhật thứ tự các công việc trong một hạng mục dịch vụ
   */
  async reorderJobs(workOrderId: number, serviceId: number, jobIds: number[]) {
    const service = await prisma.woService.findUnique({
      where: { id: serviceId },
      include: { jobs: true },
    });

    if (!service) throw new Error('Không tìm thấy hạng mục dịch vụ.');
    if (service.work_order_id !== workOrderId) {
      throw new Error('Hạng mục không thuộc phiếu sửa chữa này.');
    }

    return await prisma.$transaction(async (tx) => {
      const baseTime = new Date('2026-01-01T08:00:00.000Z').getTime();
      for (let i = 0; i < jobIds.length; i++) {
        await tx.job.update({
          where: { id: jobIds[i] },
          data: {
            created_at: new Date(baseTime + i * 1000),
          },
        });
      }
      return { success: true };
    });
  }

  // ==========================================
  // UC-15: Theo dõi tiến độ sửa chữa (Customer Tracking)
  // ==========================================

  /**
   * Lấy danh sách phiếu công việc của khách hàng
   */
  async getMyTrackingOrders(userId: number) {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        customer_id: userId,
        status: {
          notIn: ['CANCELLED'],
        },
      },
      include: {
        customer: { select: { id: true, full_name: true, phone: true, email: true } },
        vehicle: { select: { id: true, license_plate: true, make: true, model: true, year: true, color: true, vehicle_size: true } },
        advisor: { select: { id: true, full_name: true, phone: true } },
        check_in: true,
        services: {
          include: {
            service: { select: { id: true, name: true, category: { select: { name: true } } } },
            jobs: {
              include: {
                labours: {
                  include: {
                    employee: {
                      include: {
                        skills: { include: { skill: true } }
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { sort_order: 'asc' },
        },
        inspections: {
          include: {
            findings: {
              where: { is_visible_to_customer: true },
              orderBy: { created_at: 'asc' },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoice_number: true,
            status: true,
            total_amount: true,
            amount_due: true,
            issued_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return workOrders.map((wo) => this.mapToTrackingDto(wo));
  }

  /**
   * Lấy chi tiết một phiếu công việc của khách hàng (kèm kiểm tra bảo mật)
   */
  async getMyTrackingOrderDetail(id: number, userId: number) {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, full_name: true, phone: true, email: true } },
        vehicle: { select: { id: true, license_plate: true, make: true, model: true, year: true, color: true, vehicle_size: true } },
        advisor: { select: { id: true, full_name: true, phone: true } },
        check_in: true,
        services: {
          include: {
            service: { select: { id: true, name: true, category: { select: { name: true } } } },
            jobs: {
              include: {
                labours: {
                  include: {
                    employee: {
                      include: {
                        skills: { include: { skill: true } }
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { sort_order: 'asc' },
        },
        inspections: {
          include: {
            findings: {
              where: { is_visible_to_customer: true },
              orderBy: { created_at: 'asc' },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoice_number: true,
            status: true,
            total_amount: true,
            amount_due: true,
            issued_at: true,
          },
        },
      },
    });

    if (!wo) {
      throw new Error('Không tìm thấy phiếu công việc');
    }

    if (wo.customer_id !== userId) {
      const err: any = new Error('Bạn không có quyền truy cập phiếu công việc này');
      err.statusCode = 403;
      throw err;
    }

    return this.mapToTrackingDto(wo);
  }

  /**
   * Map dữ liệu Work Order sang DTO Theo dõi tiến độ cho khách hàng
   * với 4 giai đoạn kỹ thuật tổng quát
   */
  private mapToTrackingDto(wo: any) {
    const status = wo.status;
    let currentStep = 1;
    let progressPercent = 25;

    const totalServices = wo.services?.length || 0;
    const completedServices = wo.services?.filter((s: any) => s.status === 'COMPLETED').length || 0;

    if (['RELEASED', 'CLOSED'].includes(status)) {
      currentStep = 4;
      progressPercent = 100;
    } else if (['FINANCIAL_CLEARED', 'BILLING_REQUESTED'].includes(status)) {
      currentStep = 4;
      progressPercent = 95;
    } else if (status === 'IN_PROGRESS') {
      if (totalServices > 0 && completedServices === totalServices) {
        currentStep = 3;
        progressPercent = 85;
      } else {
        currentStep = 2;
        const serviceRatio = totalServices > 0 ? (completedServices / totalServices) : 0.5;
        progressPercent = Math.round(30 + serviceRatio * 45);
      }
    } else if (status === 'APPROVED') {
      currentStep = 2;
      progressPercent = 30;
    } else {
      currentStep = 1;
      progressPercent = wo.check_in?.confirmed_at ? 25 : 15;
    }

    const steps = [
      {
        stepIndex: 1,
        title: 'Tiếp nhận & Kiểm tra',
        status: currentStep > 1 ? 'COMPLETED' : (currentStep === 1 ? 'IN_PROGRESS' : 'PENDING'),
        time: wo.check_in?.confirmed_at 
          ? new Date(wo.check_in.confirmed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : (wo.created_at ? new Date(wo.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : undefined),
        description: wo.check_in 
          ? `Đã hoàn tất tiếp nhận phương tiện, ODO ghi nhận ${Number(wo.check_in.mileage).toLocaleString()} km và kiểm tra hiện trạng ban đầu.`
          : 'Đang tiếp nhận và kiểm tra hiện trạng xe.',
      },
      {
        stepIndex: 2,
        title: 'Đang thực hiện dịch vụ',
        status: currentStep > 2 ? 'COMPLETED' : (currentStep === 2 ? 'IN_PROGRESS' : 'PENDING'),
        time: currentStep >= 2 ? 'Đang triển khai' : 'Dự kiến',
        description: totalServices > 0 
          ? `Đang tiến hành thực hiện ${totalServices} hạng mục dịch vụ yêu cầu (${completedServices}/${totalServices} hạng mục đã hoàn thành).`
          : 'Kỹ thuật viên đang thực hiện các dịch vụ theo phiếu công việc.',
      },
      {
        stepIndex: 3,
        title: 'Kiểm định chất lượng (KCS)',
        status: currentStep > 3 ? 'COMPLETED' : (currentStep === 3 ? 'IN_PROGRESS' : 'PENDING'),
        time: currentStep >= 3 ? 'Đang kiểm định' : 'Chờ thực hiện',
        description: 'Kiểm tra chất lượng và nghiệm thu kỹ thuật theo tiêu chuẩn an toàn của trung tâm.',
      },
      {
        stepIndex: 4,
        title: 'Hoàn tất & Sẵn sàng bàn giao',
        status: currentStep === 4 && ['RELEASED', 'CLOSED'].includes(status) ? 'COMPLETED' : (currentStep === 4 ? 'IN_PROGRESS' : 'PENDING'),
        time: currentStep === 4 ? 'Sẵn sàng' : 'Dự kiến bàn giao',
        description: currentStep === 4 
          ? 'Phương tiện đã hoàn thiện toàn bộ dịch vụ và sẵn sàng bàn giao cho quý khách.'
          : 'Bàn giao xe và nghiệm thu hoàn tất tại sảnh tiếp nhận.',
      },
    ];

    let assignedMechanic = null;
    for (const s of (wo.services || [])) {
      for (const j of (s.jobs || [])) {
        for (const l of (j.labours || [])) {
          if (l.employee) {
            assignedMechanic = {
              id: l.employee.id,
              fullName: l.employee.full_name,
              position: l.employee.position,
              skills: (l.employee.skills || []).map((sk: any) => sk.skill?.name).filter(Boolean),
            };
            break;
          }
        }
        if (assignedMechanic) break;
      }
      if (assignedMechanic) break;
    }

    const publicFindings = [];
    for (const insp of (wo.inspections || [])) {
      for (const f of (insp.findings || [])) {
        if (f.is_visible_to_customer) {
          publicFindings.push({
            id: f.id,
            description: f.description,
            severity: f.severity,
            recommendation: f.recommendation,
            evidenceUrls: f.evidence_urls,
            partName: f.part_name,
            createdAt: f.created_at,
          });
        }
      }
    }

    return {
      id: wo.id,
      woNumber: wo.wo_number,
      status: wo.status,
      createdAt: wo.created_at,
      updatedAt: wo.updated_at,
      vehicle: {
        id: wo.vehicle.id,
        licensePlate: wo.vehicle.license_plate,
        make: wo.vehicle.make,
        model: wo.vehicle.model,
        year: wo.vehicle.year,
        color: wo.vehicle.color,
        vehicleSize: wo.vehicle.vehicle_size,
        mileage: wo.check_in?.mileage,
      },
      advisor: {
        id: wo.advisor.id,
        fullName: wo.advisor.full_name,
        phone: wo.advisor.phone,
      },
      mechanic: assignedMechanic,
      services: (wo.services || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        pricingType: s.pricing_type,
        categoryName: s.service?.category?.name || 'Dịch vụ kỹ thuật',
      })),
      findings: publicFindings,
      checkIn: wo.check_in ? {
        mileage: wo.check_in.mileage,
        fuelLevel: wo.check_in.fuel_level,
        complaint: wo.check_in.complaint,
        exteriorCondition: wo.check_in.exterior_condition,
        confirmedAt: wo.check_in.confirmed_at,
        evidenceUrls: wo.check_in.evidence_urls,
      } : null,
      steps,
      currentStep,
      progressPercent,
      invoice: wo.invoice ? {
        id: wo.invoice.id,
        invoiceNumber: wo.invoice.invoice_number,
        status: wo.invoice.status,
        totalAmount: Number(wo.invoice.total_amount),
        amountDue: Number(wo.invoice.amount_due),
        issuedAt: wo.invoice.issued_at,
      } : null,
    };
  }

  /**
   * UC-36: Lấy danh sách phụ tùng trong Work Order
   */
  async getWorkOrderParts(workOrderId: number) {
    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { id: true, status: true },
    });
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');

    const parts = await prisma.jobPart.findMany({
      where: {
        job: {
          wo_service: {
            work_order_id: workOrderId,
          },
        },
      },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            status: true,
            wo_service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        item: {
          select: {
            id: true,
            sku: true,
            selling_price: true,
            on_hand: true,
            part_category: {
              select: {
                id: true,
                code: true,
                name: true,
                item_type: true,
                uom: { select: { id: true, name: true } },
              },
            },
            brand: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return parts;
  }

  /**
   * UC-36: Khai báo thêm phụ tùng vào một Job
   */
  async addPartToJob(workOrderId: number, jobId: number, data: {
    item_id: number;
    planned_quantity: number;
    unit_price?: number;
  }) {
    // 1. Kiểm tra Work Order
    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { id: true, status: true },
    });
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');
    if (['CLOSED', 'CANCELLED', 'RELEASED'].includes(wo.status)) {
      throw new Error(`Phiếu công việc đang ở trạng thái ${wo.status}, không thể thêm phụ tùng.`);
    }

    // 2. Kiểm tra Job thuộc Work Order
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        wo_service: {
          work_order_id: workOrderId,
        },
      },
      select: { id: true, name: true },
    });
    if (!job) throw new Error('Công việc không tồn tại hoặc không thuộc phiếu công việc này.');

    // 3. Kiểm tra Inventory Item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: data.item_id },
      include: {
        part_category: { include: { uom: true } },
        brand: true,
      },
    });
    if (!item) throw new Error('Phụ tùng / vật tư không tồn tại trong kho.');
    if (!item.is_active) throw new Error('Mặt hàng này hiện đang ngưng hoạt động trong kho.');

    const unitPrice = data.unit_price !== undefined ? data.unit_price : Number(item.selling_price);

    // 4. Tạo JobPart record
    const jobPart = await prisma.jobPart.create({
      data: {
        job_id: jobId,
        item_id: data.item_id,
        planned_quantity: data.planned_quantity,
        unit_price: unitPrice,
        status: 'PLANNED',
      },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            wo_service: { select: { id: true, name: true } },
          },
        },
        item: {
          select: {
            id: true,
            sku: true,
            selling_price: true,
            on_hand: true,
            part_category: {
              select: {
                id: true,
                code: true,
                name: true,
                item_type: true,
                uom: { select: { id: true, name: true } },
              },
            },
            brand: { select: { id: true, name: true } },
          },
        },
      },
    });

    return jobPart;
  }

  /**
   * UC-36: Cập nhật thông tin phụ tùng trong Job
   */
  async updateJobPart(workOrderId: number, jobId: number, partId: number, data: {
    planned_quantity?: number;
    unit_price?: number;
    status?: any;
  }) {
    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { id: true, status: true },
    });
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');
    if (['CLOSED', 'CANCELLED', 'RELEASED'].includes(wo.status)) {
      throw new Error(`Phiếu công việc đang ở trạng thái ${wo.status}, không thể cập nhật phụ tùng.`);
    }

    const jobPart = await prisma.jobPart.findFirst({
      where: {
        id: partId,
        job_id: jobId,
        job: {
          wo_service: {
            work_order_id: workOrderId,
          },
        },
      },
    });
    if (!jobPart) throw new Error('Không tìm thấy phụ tùng trong công việc này.');

    const updated = await prisma.jobPart.update({
      where: { id: partId },
      data: {
        ...(data.planned_quantity !== undefined && { planned_quantity: data.planned_quantity }),
        ...(data.unit_price !== undefined && { unit_price: data.unit_price }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            wo_service: { select: { id: true, name: true } },
          },
        },
        item: {
          select: {
            id: true,
            sku: true,
            selling_price: true,
            on_hand: true,
            part_category: {
              select: {
                id: true,
                code: true,
                name: true,
                item_type: true,
                uom: { select: { id: true, name: true } },
              },
            },
            brand: { select: { id: true, name: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * UC-36: Xóa phụ tùng khỏi Job
   */
  async removePartFromJob(workOrderId: number, jobId: number, partId: number) {
    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { id: true, status: true },
    });
    if (!wo) throw new Error('Không tìm thấy phiếu công việc.');
    if (['CLOSED', 'CANCELLED', 'RELEASED'].includes(wo.status)) {
      throw new Error(`Phiếu công việc đang ở trạng thái ${wo.status}, không thể xóa phụ tùng.`);
    }

    const jobPart = await prisma.jobPart.findFirst({
      where: {
        id: partId,
        job_id: jobId,
        job: {
          wo_service: {
            work_order_id: workOrderId,
          },
        },
      },
    });
    if (!jobPart) throw new Error('Không tìm thấy phụ tùng cần xóa.');

    if (Number(jobPart.issued_quantity) > 0) {
      throw new Error('Phụ tùng này đã được xuất kho thi công, không thể xóa trực tiếp. Vui lòng thực hiện nhập trả kho trước.');
    }

    await prisma.jobPart.delete({
      where: { id: partId },
    });

    return { success: true, message: 'Đã xóa phụ tùng khỏi công việc thành công' };
  }
}




