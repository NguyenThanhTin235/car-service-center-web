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
}
