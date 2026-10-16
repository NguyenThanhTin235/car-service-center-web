import prisma from '../utils/prisma';
import { MarkerType, Severity } from '@prisma/client';

export class InspectionService {
  /**
   * Lấy hoặc tự động tạo phiên kiểm tra xe (Inspection) cho Work Order
   */
  async getOrCreateInspection(workOrderId: number, advisorId?: number) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        advisor: { select: { id: true, full_name: true } },
      },
    });

    if (!workOrder) {
      throw new Error('Không tìm thấy phiếu công việc');
    }

    // Tìm inspection hiện tại của WO
    let inspection = await prisma.inspection.findFirst({
      where: { work_order_id: workOrderId },
      include: {
        created_by: { select: { id: true, full_name: true } },
        findings: {
          include: {
            created_by: { select: { id: true, full_name: true } },
            job_findings: {
              include: {
                job: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    // Nếu chưa có, tự động tạo mới
    if (!inspection) {
      const creatorId = advisorId || workOrder.advisor_id;
      inspection = await prisma.inspection.create({
        data: {
          work_order_id: workOrderId,
          created_by_id: creatorId,
          status: 'IN_PROGRESS',
        },
        include: {
          created_by: { select: { id: true, full_name: true } },
          findings: {
            include: {
              created_by: { select: { id: true, full_name: true } },
              job_findings: {
                include: {
                  job: {
                    select: {
                      id: true,
                      name: true,
                      status: true,
                    },
                  },
                },
              },
            },
            orderBy: { created_at: 'asc' },
          },
        },
      });
    }

    return inspection;
  }

  /**
   * Thêm một vấn đề phát hiện (Finding/Marker) vào phiên kiểm tra xe
   */
  async addFinding(
    workOrderId: number,
    advisorId: number,
    data: {
      marker_type: MarkerType;
      part_id: string;
      part_name: string;
      coordinates: { x: number; y: number; part_id?: string };
      description?: string;
      severity?: Severity;
      evidence_urls?: string[];
      recommendation?: string;
      is_visible_to_customer?: boolean;
    }
  ) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      throw new Error('Không tìm thấy phiếu công việc');
    }

    const closedStatuses = ['CLOSED', 'CANCELLED', 'RELEASED'];
    if (closedStatuses.includes(workOrder.status)) {
      throw new Error(
        `Phiếu công việc đã ${
          workOrder.status === 'CLOSED'
            ? 'đóng'
            : workOrder.status === 'CANCELLED'
            ? 'hủy'
            : 'giao xe'
        }. Không thể chỉnh sửa kiểm tra xe.`
      );
    }

    const inspection = await this.getOrCreateInspection(workOrderId, advisorId);

    const finding = await prisma.finding.create({
      data: {
        inspection_id: inspection.id,
        marker_type: data.marker_type,
        part_name: data.part_name,
        coordinates: {
          x: data.coordinates.x,
          y: data.coordinates.y,
          part_id: data.part_id,
        },
        description: data.description || '',
        severity: data.severity || 'MEDIUM',
        evidence_urls: data.evidence_urls || [],
        recommendation: data.recommendation || null,
        is_visible_to_customer: data.is_visible_to_customer !== false,
        created_by_id: advisorId,
        status: 'NEW',
      },
      include: {
        created_by: { select: { id: true, full_name: true } },
        job_findings: {
          include: {
            job: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Tự động tạo Hạng mục công việc (WoService) tương ứng cho lỗi này
    const markerLabels: Record<string, string> = {
      DENT: 'Móp méo',
      SCRATCH: 'Trầy xước',
      DAMAGE: 'Hư hỏng bể vỡ',
      RUST: 'Rỉ sét',
      MISSING: 'Thiếu phụ tùng',
    };
    const markerLabel = markerLabels[data.marker_type] || data.marker_type || 'Lỗi kỹ thuật';
    const serviceName = `Khắc phục lỗi: ${markerLabel} tại ${data.part_name || 'bộ phận xe'}`;

    const existingWoService = await prisma.woService.findFirst({
      where: {
        work_order_id: workOrderId,
        name: serviceName,
      },
    });

    if (!existingWoService) {
      const maxSort = await prisma.woService.aggregate({
        where: { work_order_id: workOrderId },
        _max: { sort_order: true },
      });
      const nextSortOrder = (maxSort._max.sort_order ?? 0) + 1;

      // Tìm dịch vụ phù hợp thuộc danh mục Sơn & Đồng để liên kết
      let linkedServiceId: number | null = null;
      try {
        if (data.marker_type === 'DENT') {
          const s = await prisma.service.findFirst({ where: { name: { contains: 'Gò nắn' }, is_active: true } });
          if (s) linkedServiceId = s.id;
        } else if (data.marker_type === 'SCRATCH' || data.marker_type === 'RUST') {
          const s = await prisma.service.findFirst({ where: { name: { contains: 'Sơn' }, is_active: true } });
          if (s) linkedServiceId = s.id;
        }
        if (!linkedServiceId) {
          const s = await prisma.service.findFirst({ where: { category: { name: { contains: 'Sơn' } }, is_active: true } });
          if (s) linkedServiceId = s.id;
        }
      } catch {
        // Fallback null
      }

      await prisma.woService.create({
        data: {
          work_order_id: workOrderId,
          service_id: linkedServiceId,
          name: serviceName,
          pricing_type: 'LABOUR_PARTS',
          status: 'PENDING',
          sort_order: nextSortOrder,
        },
      });
    }

    return finding;
  }

  /**
   * Cập nhật thông tin Finding (ghi chú, hình ảnh minh chứng, mức độ)
   */
  async updateFinding(
    findingId: number,
    data: {
      description?: string;
      severity?: Severity;
      evidence_urls?: string[];
      recommendation?: string;
      is_visible_to_customer?: boolean;
      job_id?: number | null;
    }
  ) {
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        inspection: {
          include: {
            work_order: true,
          },
        },
        job_findings: true,
      },
    });

    if (!finding) {
      throw new Error('Không tìm thấy vấn đề kiểm tra (Finding)');
    }

    const closedStatuses = ['CLOSED', 'CANCELLED', 'RELEASED'];
    if (closedStatuses.includes(finding.inspection.work_order.status)) {
      throw new Error('Phiếu công việc đã kết thúc. Không thể chỉnh sửa.');
    }

    // Cập nhật liên kết Job nếu có gửi job_id
    if (data.job_id !== undefined) {
      if (data.job_id === null) {
        // Hủy liên kết Job
        await prisma.jobFinding.deleteMany({
          where: { finding_id: findingId },
        });
      } else {
        // Kiểm tra Job có tồn tại không
        const job = await prisma.job.findUnique({
          where: { id: data.job_id },
        });
        if (!job) {
          throw new Error('Không tìm thấy công việc (Job) cần liên kết');
        }

        // Tạo hoặc giữ liên kết Job
        const existingJobFinding = await prisma.jobFinding.findFirst({
          where: { finding_id: findingId, job_id: data.job_id },
        });

        if (!existingJobFinding) {
          // Xóa liên kết cũ (1 finding gắn với 1 job chính)
          await prisma.jobFinding.deleteMany({
            where: { finding_id: findingId },
          });
          await prisma.jobFinding.create({
            data: {
              finding_id: findingId,
              job_id: data.job_id,
            },
          });
        }
      }
    }

    // Cập nhật finding data
    const updateData: any = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.evidence_urls !== undefined) updateData.evidence_urls = data.evidence_urls;
    if (data.recommendation !== undefined) updateData.recommendation = data.recommendation;
    if (data.is_visible_to_customer !== undefined)
      updateData.is_visible_to_customer = data.is_visible_to_customer;

    const updatedFinding = await prisma.finding.update({
      where: { id: findingId },
      data: updateData,
      include: {
        created_by: { select: { id: true, full_name: true } },
        job_findings: {
          include: {
            job: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return updatedFinding;
  }

  /**
   * Xóa Finding khỏi Inspection và sơ đồ xe
   * Luồng ngoại lệ UC-33: Nếu Finding đã được liên kết với một Job, hệ thống từ chối xóa và hiển thị thông báo.
   */
  async deleteFinding(findingId: number) {
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        inspection: {
          include: {
            work_order: true,
          },
        },
        job_findings: {
          include: {
            job: {
              include: {
                labours: true,
              },
            },
          },
        },
      },
    });

    if (!finding) {
      throw new Error('Không tìm thấy vấn đề kiểm tra (Finding)');
    }

    const closedStatuses = ['CLOSED', 'CANCELLED', 'RELEASED'];
    if (closedStatuses.includes(finding.inspection.work_order.status)) {
      throw new Error('Phiếu công việc đã kết thúc. Không thể xóa dữ liệu.');
    }

    // Kiểm tra ràng buộc: Chỉ cho phép xóa khi chưa có việc hoặc việc chưa phân công
    if (finding.job_findings && finding.job_findings.length > 0) {
      const assignedJobs = finding.job_findings.filter(
        (jf) =>
          jf.job &&
          (jf.job.status !== 'PLANNED' ||
            (jf.job.labours && jf.job.labours.some((l) => l.employee_id !== null)))
      );
      if (assignedJobs.length > 0) {
        const jobNames = assignedJobs.map((jf) => jf.job?.name).join(', ');
        throw new Error(
          `Không thể xóa: Vết lỗi đã có công việc (${jobNames}) được phân công hoặc đang thực hiện.`
        );
      }

      // Xóa các liên kết Job chưa phân công
      for (const jf of finding.job_findings) {
        await prisma.jobFinding.delete({ where: { id: jf.id } });
        const remainingCount = await prisma.jobFinding.count({ where: { job_id: jf.job_id } });
        if (remainingCount === 0) {
          await prisma.jobLabour.deleteMany({ where: { job_id: jf.job_id } });
          await prisma.job.delete({ where: { id: jf.job_id } });
        }
      }
    }

    // Tự động xóa Hạng mục dịch vụ tương ứng (nếu chưa có việc hoặc các việc chưa phân công)
    const markerLabels: Record<string, string> = {
      DENT: 'Móp méo',
      SCRATCH: 'Trầy xước',
      DAMAGE: 'Hư hỏng bể vỡ',
      RUST: 'Rỉ sét',
      MISSING: 'Thiếu phụ tùng',
    };
    const markerLabel = markerLabels[finding.marker_type || ''] || finding.marker_type || 'Lỗi kỹ thuật';
    const serviceName = `Khắc phục lỗi: ${markerLabel} tại ${finding.part_name || 'bộ phận xe'}`;

    const autoWoService = await prisma.woService.findFirst({
      where: {
        work_order_id: finding.inspection.work_order_id,
        name: serviceName,
      },
      include: {
        jobs: {
          include: {
            labours: true,
          },
        },
      },
    });

    if (autoWoService) {
      const hasAssignedJobs = autoWoService.jobs.some(
        (j) =>
          j.status !== 'PLANNED' ||
          (j.labours && j.labours.some((l) => l.employee_id !== null))
      );
      if (!hasAssignedJobs) {
        for (const j of autoWoService.jobs) {
          await prisma.jobFinding.deleteMany({ where: { job_id: j.id } });
          await prisma.jobLabour.deleteMany({ where: { job_id: j.id } });
          await prisma.job.delete({ where: { id: j.id } });
        }
        await prisma.woService.delete({ where: { id: autoWoService.id } });
      }
    }

    await prisma.finding.delete({
      where: { id: findingId },
    });

    return { id: findingId, message: 'Đã xóa vấn đề kiểm tra thành công' };
  }
}
