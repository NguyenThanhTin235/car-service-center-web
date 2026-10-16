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

    // Chỉ cho phép xóa khi chưa phân công (chưa có kỹ thuật viên nhận việc)
    const hasAssignedTechnician = job.labours.some((l) => l.employee_id !== null);
    if (hasAssignedTechnician) {
      throw new Error('Công việc đã được phân công kỹ thuật viên. Vui lòng hủy phân công trước khi xóa.');
    }

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
}



