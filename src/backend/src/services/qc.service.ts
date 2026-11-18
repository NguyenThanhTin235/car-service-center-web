import prisma from '../utils/prisma';
import { QcResult, JobStatus, ServiceStatus, WorkOrderStatus, InspectionTemplateType } from '@prisma/client';
import { SubmitQcDto } from '../dtos/qc.dto';
import { notificationService } from './notification.service';

// Danh sách các tiêu chí kiểm định KCS ô tô tiêu chuẩn mặc định khi dịch vụ chưa gán template
const DEFAULT_AUTOMOTIVE_QC_ITEMS = [
  'Lực siết bu-lông bánh xe và các mối ghép gầm đúng mô-men',
  'Mức dầu phanh, dầu máy và nước làm mát đạt chuẩn vạch Full',
  'Độ chụm và áp suất lốp xe đúng thông số kỹ thuật',
  'Hệ thống phanh: Thử phanh êm, không lệch, phanh tay nhạy',
  'Hệ thống đèn chiếu sáng, đèn xi-nhan và còi hoạt động chuẩn',
  'Không có hiện tượng rò rỉ dung dịch dưới gầm xe sau thử nghiệm',
  'Vệ sinh khoang máy và nội ngoại thất xe sạch sẽ',
];

/**
 * Loại bỏ chuỗi chồng lặp cũ nếu có dạng (Sửa lại: ...)
 */
function cleanQcNote(str?: string | null): string {
  if (!str) return '';
  return str.split(/\s*\(Sửa lại:/i)[0].trim();
}

export class QcService {
  /**
   * Lấy chi tiết thông tin kiểm định chất lượng (QC / KCS) của Phiếu công việc
   */
  async getQcDetails(workOrderId: number) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: true,
        customer: { select: { id: true, full_name: true, phone: true } },
        advisor: { select: { id: true, full_name: true, phone: true } },
        services: {
          orderBy: { sort_order: 'asc' },
          include: {
            service: {
              include: {
                inspection_tpls: {
                  where: { template_type: InspectionTemplateType.QC, is_active: true },
                  include: {
                    items: { orderBy: { sort_order: 'asc' } },
                  },
                },
              },
            },
            jobs: {
              orderBy: { id: 'asc' },
              include: {
                labours: {
                  include: {
                    employee: { select: { id: true, full_name: true, position: true } },
                  },
                },
                rework_qc_item: true,
              },
            },
            qc_records: {
              orderBy: { created_at: 'desc' },
              include: {
                inspector: { select: { id: true, full_name: true } },
                items: {
                  orderBy: { id: 'asc' },
                  include: {
                    rework_jobs: { select: { id: true, name: true, status: true, description: true } },
                  },
                },
              },
            },
          },
        },
        quotations: {
          where: { status: 'APPROVED' },
          select: { id: true, quotation_number: true, grand_total: true },
        },
      },
    });

    if (!workOrder) {
      throw new Error('Không tìm thấy phiếu công việc');
    }

    // Tính toán số liệu thống kê tổng thể
    let totalJobs = 0;
    let completedJobs = 0;
    let passedJobs = 0;
    let reworkJobs = 0;
    let totalServices = workOrder.services.length;
    let passedServices = 0;

    const formattedServices = workOrder.services.map((wos) => {
      const jobs = wos.jobs;
      totalJobs += jobs.length;
      completedJobs += jobs.filter((j) => j.status === JobStatus.COMPLETED).length;
      passedJobs += jobs.filter((j) => j.status === JobStatus.PASSED).length;
      reworkJobs += jobs.filter((j) => j.status === JobStatus.REWORK || (j.is_rework && j.status !== JobStatus.PASSED && j.status !== JobStatus.COMPLETED)).length;

      // Lấy bản ghi QC mới nhất
      const latestQc = wos.qc_records.length > 0 ? wos.qc_records[0] : null;
      const isServicePassed = latestQc?.overall_result === QcResult.PASS;
      if (isServicePassed) passedServices++;

      // Mẫu kiểm tra áp dụng: ưu tiên template của service, fallback danh mục mặc định
      const template = wos.service?.inspection_tpls?.[0];
      const templateItems = template?.items?.map((ti) => ({
        id: ti.id,
        name: ti.name,
      })) || DEFAULT_AUTOMOTIVE_QC_ITEMS.map((name, idx) => ({
        id: -(idx + 1), // ID âm cho default item
        name,
      }));

      return {
        id: wos.id,
        serviceId: wos.service_id,
        name: wos.name,
        status: wos.status,
        pricingType: wos.pricing_type,
        jobs: wos.jobs.map((j) => ({
          id: j.id,
          name: j.name,
          status: j.status,
          isRework: j.is_rework,
          parentJobId: j.parent_job_id,
          reworkSourceQcItemId: j.rework_source_qc_item_id,
          technician: j.labours?.[0]?.employee?.full_name || 'Chưa phân công',
        })),
        template: {
          id: template?.id || null,
          name: template?.name || 'Tiêu chuẩn nghiệm thu kỹ thuật xưởng',
          items: templateItems,
        },
        latestQc: latestQc
          ? {
              id: latestQc.id,
              overallResult: latestQc.overall_result,
              notes: latestQc.notes,
              createdAt: latestQc.created_at,
              inspectorName: latestQc.inspector.full_name,
              items: latestQc.items.map((item) => {
                const reworkDesc = cleanQcNote(item.rework_jobs?.[0]?.description);
                const itemNote = cleanQcNote(item.notes);
                return {
                  id: item.id,
                  templateItemId: item.template_item_id,
                  itemName: item.item_name,
                  result: item.result,
                  notes: itemNote || null,
                  reworkDescription: reworkDesc,
                  reworkJobCount: item.rework_jobs.length,
                  reworkJob: item.rework_jobs?.[0] || null,
                };
              }),
            }
          : null,
      };
    });

    // Điều kiện Billing Gate: WO phải IN_PROGRESS, có ít nhất 1 service, 100% services pass QC, và không còn job REWORK nào
    const hasApprovedQuotation = workOrder.quotations.length > 0;
    const canRequestBilling =
      workOrder.status === WorkOrderStatus.IN_PROGRESS &&
      hasApprovedQuotation &&
      totalServices > 0 &&
      passedServices === totalServices &&
      reworkJobs === 0;

    return {
      workOrder: {
        id: workOrder.id,
        woNumber: workOrder.wo_number,
        status: workOrder.status,
        licensePlate: workOrder.vehicle.license_plate,
        vehicleModel: `${workOrder.vehicle.make} ${workOrder.vehicle.model}`,
        customerName: workOrder.customer.full_name,
        advisorName: workOrder.advisor.full_name,
      },
      stats: {
        totalServices,
        passedServices,
        totalJobs,
        completedJobs,
        passedJobs,
        reworkJobs,
        progressPercent: totalServices > 0 ? Math.round((passedServices / totalServices) * 100) : 0,
        canRequestBilling,
        isBillingRequested: workOrder.status === WorkOrderStatus.BILLING_REQUESTED,
      },
      services: formattedServices,
    };
  }

  /**
   * Helper nội bộ: Đánh giá kiểm định chất lượng cho 1 dịch vụ trong transaction
   */
  private async evaluateSingleService(
    tx: any,
    workOrder: any,
    inspectorId: number,
    dto: SubmitQcDto,
    defaultJobType: any
  ) {
    const woService = workOrder.services.find((s: any) => s.id === dto.woServiceId);
    if (!woService) {
      throw new Error(`Dịch vụ ID ${dto.woServiceId} không thuộc phiếu công việc này`);
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('Vui lòng đánh giá ít nhất một tiêu chí kiểm định');
    }

    // 2. Xác định kết quả tổng thể: FAIL nếu có ít nhất 1 tiêu chí FAIL
    const hasFailure = dto.items.some((item) => item.result === QcResult.FAIL);
    const overallResult = hasFailure ? QcResult.FAIL : QcResult.PASS;

    // 3. Tạo bản ghi QcRecord
    const qcRecord = await tx.qcRecord.create({
      data: {
        wo_service_id: dto.woServiceId,
        template_id: dto.templateId && dto.templateId > 0 ? dto.templateId : null,
        overall_result: overallResult,
        notes: dto.notes || null,
        inspector_id: inspectorId,
      },
    });

    // 4. Lưu từng QcItem và tự động sinh Job Rework nếu Không đạt
    const createdItems = [];
    const createdReworkJobs = [];

    for (const item of dto.items) {
      const itemNote = cleanQcNote(item.notes) || null;

      const qcItem = await tx.qcItem.create({
        data: {
          qc_record_id: qcRecord.id,
          template_item_id: item.templateItemId && item.templateItemId > 0 ? item.templateItemId : null,
          item_name: item.itemName,
          result: item.result,
          notes: itemNote,
        },
      });
      createdItems.push(qcItem);

      // NẾU HẠNG MỤC KHÔNG ĐẠT (FAIL) -> TỰ ĐỘNG SINH JOB REWORK HOẶC CẬP NHẬT JOB ĐANG MỞ (CHỐNG TRÙNG LẶP)
      if (item.result === QcResult.FAIL) {
        const reworkJobName = item.reworkJobName?.trim() || `[Sửa lại - KCS] ${item.itemName}`;
        const reworkDescription =
          cleanQcNote(item.reworkDescription) ||
          cleanQcNote(item.notes) ||
          `Khắc phục hạng mục chưa đạt kiểm định kỹ thuật: ${item.itemName}`;

        // Kiểm tra xem đã có Job Rework nào đang mở cho hạng mục này chưa (Chống sinh trùng lặp khi lưu nhiều lần)
        const existingOpenReworkJob = await tx.job.findFirst({
          where: {
            wo_service_id: dto.woServiceId,
            is_rework: true,
            status: { in: [JobStatus.REWORK, JobStatus.PLANNED, JobStatus.IN_PROGRESS] },
            OR: [
              { name: reworkJobName },
              { name: `[Sửa lại - KCS] ${item.itemName}` },
              { name: `[Sửa lại - QC] ${item.itemName}` },
              { name: { contains: item.itemName } },
            ],
          },
          include: { labours: true },
        });

        if (existingOpenReworkJob) {
          // ĐÃ CÓ JOB REWORK ĐANG MỞ -> CẬP NHẬT MÔ TẢ & LIÊN KẾT MỚI NHẤT, KHÔNG TẠO MỚI
          const updatedJob = await tx.job.update({
            where: { id: existingOpenReworkJob.id },
            data: {
              description: reworkDescription,
              rework_source_qc_item_id: qcItem.id,
            },
          });

          // Cập nhật thợ nếu có phân công
          if (item.assignedEmployeeId) {
            if (existingOpenReworkJob.labours && existingOpenReworkJob.labours.length > 0) {
              await tx.jobLabour.update({
                where: { id: existingOpenReworkJob.labours[0].id },
                data: { employee_id: item.assignedEmployeeId },
              });
            } else {
              await tx.jobLabour.create({
                data: {
                  job_id: existingOpenReworkJob.id,
                  job_type_id: defaultJobType?.id || 1,
                  employee_id: item.assignedEmployeeId,
                  description: `Thực hiện sửa lại: ${item.itemName}`,
                  price: 0,
                },
              });
            }
          }

          createdReworkJobs.push(updatedJob);
        } else {
          // CHƯA CÓ JOB REWORK ĐANG MỞ -> TẠO JOB REWORK MỚI
          const reworkJob = await tx.job.create({
            data: {
              wo_service_id: dto.woServiceId,
              name: reworkJobName,
              description: reworkDescription,
              job_type_id: defaultJobType?.id || 1,
              status: JobStatus.REWORK,
              is_rework: true,
              parent_job_id: item.parentJobId || null,
              rework_source_qc_item_id: qcItem.id,
              created_by_id: inspectorId,
            },
          });

          // Gán thợ sửa lại nếu có
          if (item.assignedEmployeeId) {
            await tx.jobLabour.create({
              data: {
                job_id: reworkJob.id,
                job_type_id: defaultJobType?.id || 1,
                employee_id: item.assignedEmployeeId,
                description: `Thực hiện sửa lại: ${item.itemName}`,
                price: 0, // Không tính thêm tiền khách hàng
              },
            });
          }

          createdReworkJobs.push(reworkJob);
        }
      } else if (item.result === QcResult.PASS) {
        // NẾU HẠNG MỤC NÀY ĐÃ ĐẠT (PASS) -> TỰ ĐỘNG ĐÓNG/HOÀN THÀNH CÁC JOB REWORK CŨ CỦA NÓ NẾU CÓ
        await tx.job.updateMany({
          where: {
            wo_service_id: dto.woServiceId,
            is_rework: true,
            status: { in: [JobStatus.REWORK, JobStatus.PLANNED, JobStatus.IN_PROGRESS] },
            OR: [
              { name: `[Sửa lại - KCS] ${item.itemName}` },
              { name: `[Sửa lại - QC] ${item.itemName}` },
              { name: { contains: item.itemName } },
            ],
          },
          data: { status: JobStatus.PASSED },
        });
      }
    }

    // 5. NẾU TẤT CẢ ĐỀU ĐẠT (PASS) -> CẬP NHẬT CÔNG VIỆC SANG PASSED VÀ SERVICE COMPLETED
    if (overallResult === QcResult.PASS) {
      // Cập nhật các Job thuộc service này sang PASSED
      await tx.job.updateMany({
        where: { wo_service_id: dto.woServiceId },
        data: { status: JobStatus.PASSED },
      });

      // Đánh dấu Service hoàn thành
      await tx.woService.update({
        where: { id: dto.woServiceId },
        data: { status: ServiceStatus.COMPLETED },
      });
    } else {
      // Nếu có Rework, service vẫn ở trạng thái IN_PROGRESS
      await tx.woService.update({
        where: { id: dto.woServiceId },
        data: { status: ServiceStatus.IN_PROGRESS },
      });
    }

    return {
      woServiceId: dto.woServiceId,
      qcRecordId: qcRecord.id,
      overallResult,
      totalEvaluated: dto.items.length,
      failCount: createdReworkJobs.length,
      createdReworkJobs,
    };
  }

  /**
   * Chặn nghiệm thu KCS nếu trong phiếu vẫn còn công việc chưa hoàn thành (PLANNED / IN_PROGRESS / REWORK)
   */
  private ensureAllJobsCompletedForQc(workOrder: any) {
    const incompleteJobs: string[] = [];
    for (const svc of workOrder.services || []) {
      for (const job of svc.jobs || []) {
        if (job.status !== JobStatus.COMPLETED && job.status !== JobStatus.PASSED) {
          incompleteJobs.push(job.name);
        }
      }
    }
    if (incompleteJobs.length > 0) {
      const preview = incompleteJobs.slice(0, 3).join(', ');
      const suffix = incompleteJobs.length > 3 ? '...' : '';
      throw new Error(
        `Không thể thực hiện nghiệm thu chất lượng vì trong phiếu vẫn còn ${incompleteJobs.length} công việc thi công dở dang (${preview}${suffix}).`
      );
    }
  }

  private notifyQcOutcome(params: {
    workOrderId: number;
    woNumber: string;
    advisorId: number | null;
    overallResult: QcResult;
    serviceLabel: string;
    technicianUserIds: number[];
  }) {
    const { workOrderId, woNumber, advisorId, overallResult, serviceLabel, technicianUserIds } = params;
    const isPass = overallResult === QcResult.PASS;
    const type = isPass ? 'QC_PASSED' : 'QC_FAILED';
    const title = isPass
      ? `Kiểm định KCS đạt chuẩn (${woNumber})`
      : `Kiểm định KCS chưa đạt - Cần sửa lại (${woNumber})`;
    const message = isPass
      ? `Dịch vụ [${serviceLabel}] của phiếu ${woNumber} đã đạt kiểm định chất lượng KCS.`
      : `Dịch vụ [${serviceLabel}] của phiếu ${woNumber} không đạt KCS và cần thực hiện sửa lại (Rework).`;

    if (advisorId) {
      notificationService
        .sendInApp({
          userId: advisorId,
          type,
          title,
          message,
          entityType: 'WORK_ORDER',
          entityId: workOrderId,
        })
        .catch((err) => console.error('Failed to notify advisor on QC outcome:', err));
    } else {
      notificationService
        .sendInAppToRoles(['SA'], {
          type,
          title,
          message,
          entityType: 'WORK_ORDER',
          entityId: workOrderId,
        })
        .catch((err) => console.error('Failed to notify SA on QC outcome:', err));
    }

    if (!isPass) {
      for (const techUserId of technicianUserIds) {
        notificationService
          .sendInApp({
            userId: techUserId,
            type: 'QC_FAILED',
            title,
            message,
            entityType: 'WORK_ORDER',
            entityId: workOrderId,
          })
          .catch((err) => console.error('Failed to notify technician on QC failure:', err));
      }
    }
  }

  /**
   * Lưu kết quả đánh giá kiểm định chất lượng (QC / KCS) và tự động xử lý Rework nếu có lỗi
   */
  async submitQcEvaluation(workOrderId: number, inspectorId: number, dto: SubmitQcDto) {
    const { evaluation, woNumber, advisorId, serviceName, technicianUserIds } = await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra Work Order hợp lệ
      const workOrder = await tx.workOrder.findUnique({
        where: { id: workOrderId },
        include: {
          services: {
            include: {
              jobs: {
                include: {
                  labours: {
                    include: { employee: { select: { user_id: true } } },
                  },
                },
              },
            },
          },
        },
      });

      if (!workOrder) {
        throw new Error('Không tìm thấy phiếu công việc');
      }

      if (
        workOrder.status !== WorkOrderStatus.IN_PROGRESS &&
        workOrder.status !== WorkOrderStatus.APPROVED
      ) {
        throw new Error(
          `Phiếu công việc đang ở trạng thái ${workOrder.status}, chỉ có thể kiểm định QC khi đang thi công (IN_PROGRESS).`
        );
      }

      this.ensureAllJobsCompletedForQc(workOrder);

      const defaultJobType = await tx.jobType.findFirst({ select: { id: true } });
      const evaluation = await this.evaluateSingleService(tx, workOrder, inspectorId, dto, defaultJobType);

      const woService = workOrder.services.find((s: any) => s.id === dto.woServiceId);
      const techUserIds = new Set<number>();
      for (const job of woService?.jobs || []) {
        for (const lab of (job as any).labours || []) {
          if (lab.employee?.user_id) techUserIds.add(lab.employee.user_id);
        }
      }
      if (dto.items) {
        const assignedEmpIds = dto.items.map((i) => i.assignedEmployeeId).filter((id): id is number => Boolean(id));
        if (assignedEmpIds.length > 0) {
          const emps = await tx.employee.findMany({
            where: { id: { in: assignedEmpIds }, user_id: { not: null } },
            select: { user_id: true },
          });
          for (const emp of emps) {
            if (emp.user_id) techUserIds.add(emp.user_id);
          }
        }
      }

      return {
        evaluation,
        woNumber: workOrder.wo_number,
        advisorId: workOrder.advisor_id,
        serviceName: woService?.name || `Dịch vụ #${dto.woServiceId}`,
        technicianUserIds: Array.from(techUserIds),
      };
    });

    this.notifyQcOutcome({
      workOrderId,
      woNumber,
      advisorId,
      overallResult: evaluation.overallResult,
      serviceLabel: serviceName,
      technicianUserIds,
    });

    return evaluation;
  }

  /**
   * Lưu kết quả đánh giá kiểm định chất lượng (QC / KCS) cho toàn bộ các dịch vụ trong phiếu
   */
  async submitBatchQcEvaluation(workOrderId: number, inspectorId: number, dtos: SubmitQcDto[]) {
    if (!dtos || dtos.length === 0) {
      throw new Error('Danh sách đánh giá kiểm định không được rỗng');
    }

    const { batchResult, woNumber, advisorId, serviceLabel, overallResult, technicianUserIds } = await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { id: workOrderId },
        include: {
          services: {
            include: {
              jobs: {
                include: {
                  labours: {
                    include: { employee: { select: { user_id: true } } },
                  },
                },
              },
            },
          },
        },
      });

      if (!workOrder) {
        throw new Error('Không tìm thấy phiếu công việc');
      }

      if (
        workOrder.status !== WorkOrderStatus.IN_PROGRESS &&
        workOrder.status !== WorkOrderStatus.APPROVED
      ) {
        throw new Error(
          `Phiếu công việc đang ở trạng thái ${workOrder.status}, chỉ có thể kiểm định QC khi đang thi công (IN_PROGRESS).`
        );
      }

      this.ensureAllJobsCompletedForQc(workOrder);

      const defaultJobType = await tx.jobType.findFirst({ select: { id: true } });

      let overallPassCount = 0;
      let totalFailCount = 0;
      const allCreatedReworkJobs: any[] = [];
      const results: any[] = [];

      for (const dto of dtos) {
        const res = await this.evaluateSingleService(tx, workOrder, inspectorId, dto, defaultJobType);
        if (res.overallResult === QcResult.PASS) {
          overallPassCount++;
        }
        totalFailCount += res.failCount;
        allCreatedReworkJobs.push(...res.createdReworkJobs);
        results.push(res);
      }

      const techUserIds = new Set<number>();
      for (const svc of workOrder.services || []) {
        for (const job of svc.jobs || []) {
          for (const lab of (job as any).labours || []) {
            if (lab.employee?.user_id) techUserIds.add(lab.employee.user_id);
          }
        }
      }

      return {
        batchResult: {
          successCount: results.length,
          overallPassCount,
          totalFailCount,
          allCreatedReworkJobs,
          results,
        },
        woNumber: workOrder.wo_number,
        advisorId: workOrder.advisor_id,
        serviceLabel: `${results.length} dịch vụ`,
        overallResult: totalFailCount > 0 ? QcResult.FAIL : QcResult.PASS,
        technicianUserIds: Array.from(techUserIds),
      };
    });

    this.notifyQcOutcome({
      workOrderId,
      woNumber,
      advisorId,
      overallResult,
      serviceLabel,
      technicianUserIds,
    });

    return batchResult;
  }

  /**
   * Kích hoạt Billing Gate: Chốt nghiệm thu KCS và gửi yêu cầu lập hóa đơn (UC-41 -> BILLING_REQUESTED)
   */
  async requestBilling(workOrderId: number, advisorId: number, notes?: string) {
    const result = await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { id: workOrderId },
        include: {
          services: {
            include: {
              jobs: true,
              qc_records: { orderBy: { created_at: 'desc' }, take: 1 },
            },
          },
          quotations: { where: { status: 'APPROVED' } },
        },
      });

      if (!workOrder) {
        throw new Error('Không tìm thấy phiếu công việc');
      }

      if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
        throw new Error(
          `Phiếu công việc đang ở trạng thái ${workOrder.status}, chỉ có thể gửi yêu cầu thanh toán khi đang thi công (IN_PROGRESS).`
        );
      }

      if (workOrder.quotations.length === 0) {
        throw new Error('Phiếu công việc chưa có báo giá được phê duyệt');
      }

      if (workOrder.services.length === 0) {
        throw new Error('Phiếu công việc chưa có dịch vụ nào');
      }

      // Kiểm tra 100% services phải có kết quả QC PASS
      const unpassedServices = workOrder.services.filter(
        (s) => !s.qc_records.length || s.qc_records[0].overall_result !== QcResult.PASS
      );

      if (unpassedServices.length > 0) {
        const names = unpassedServices.map((s) => s.name).join(', ');
        throw new Error(
          `Chưa thể yêu cầu thanh toán: Các dịch vụ sau chưa đạt kiểm định chất lượng: ${names}`
        );
      }

      // Kiểm tra không còn Job nào ở trạng thái REWORK hoặc PLANNED
      const openReworkJobs = workOrder.services
        .flatMap((s) => s.jobs)
        .filter((j) => j.status === JobStatus.REWORK || j.status === JobStatus.PLANNED);

      if (openReworkJobs.length > 0) {
        throw new Error(
          `Còn ${openReworkJobs.length} công việc chưa hoàn thành hoặc đang trong vòng lặp sửa lại (Rework).`
        );
      }

      // Chuyển trạng thái Work Order sang BILLING_REQUESTED
      const updatedWorkOrder = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: WorkOrderStatus.BILLING_REQUESTED,
        },
        include: {
          customer: true,
          vehicle: true,
        },
      });

      return {
        workOrderId: updatedWorkOrder.id,
        woNumber: updatedWorkOrder.wo_number,
        licensePlate: updatedWorkOrder.vehicle.license_plate,
        status: updatedWorkOrder.status,
        message: 'Đã hoàn tất nghiệm thu KCS và gửi yêu cầu phát hành hóa đơn thành công.',
      };
    });

    // Tạo thông báo cho quầy thu ngân (DESK STAFF)
    notificationService
      .sendInAppToRoles(['DESK STAFF'], {
        type: 'BILLING_REQUEST',
        title: `Yêu cầu thanh toán xe ${result.licensePlate}`,
        message: `Phiếu công việc ${result.woNumber} đã hoàn tất kiểm định chất lượng KCS 100%. Sẵn sàng phát hành hóa đơn.`,
        entityType: 'WORK_ORDER',
        entityId: workOrderId,
      })
      .catch((err) => console.error('Failed to notify DESK STAFF on billing request:', err));

    return {
      workOrderId: result.workOrderId,
      woNumber: result.woNumber,
      status: result.status,
      message: result.message,
    };
  }
}

export const qcService = new QcService();

