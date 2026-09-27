import { Prisma, WorkOrderStatus } from '@prisma/client';
import prisma from '../utils/prisma';

const workOrderInclude = {
  customer: { select: { id: true, full_name: true, phone: true, email: true } },
  vehicle: { select: { id: true, license_plate: true, make: true, model: true, year: true, color: true, vehicle_size: true } },
  advisor: { select: { id: true, full_name: true, phone: true } },
  created_by: { select: { id: true, full_name: true } },
  intake_record: {
    select: {
      id: true,
      intake_type: true,
      arrived_at: true,
      notes: true,
      services: { include: { service_template: { select: { id: true, name: true } } } },
    },
  },
  appointment: { select: { id: true, scheduled_date: true, scheduled_time: true } },
  check_in: true,
} satisfies Prisma.WorkOrderInclude;

export interface WorkOrderFilters {
  status?: WorkOrderStatus;
  advisorId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export class WorkOrderRepository {
  /**
   * Sinh mã Work Order tự động theo ngày: WO-YYMMDD-XXX
   */
  async generateWoNumber(tx: Prisma.TransactionClient): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `WO-${yy}${mm}${dd}`;

    // Đếm số WO đã tạo trong ngày để tăng sequence
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const count = await tx.workOrder.count({
      where: {
        created_at: { gte: startOfDay, lt: endOfDay },
      },
    });

    const seq = String(count + 1).padStart(3, '0');
    return `${prefix}-${seq}`;
  }

  /**
   * Tạo Work Order mới trong transaction
   */
  async createInTransaction(
    tx: Prisma.TransactionClient,
    data: Prisma.WorkOrderUncheckedCreateInput
  ) {
    return tx.workOrder.create({
      data,
      include: workOrderInclude,
    });
  }

  /**
   * Tìm Work Order theo ID
   */
  async findById(id: number) {
    return prisma.workOrder.findUnique({
      where: { id },
      include: workOrderInclude,
    });
  }

  /**
   * Tìm Work Order theo intake_record_id
   */
  async findByIntakeRecordId(intakeRecordId: number) {
    return prisma.workOrder.findUnique({
      where: { intake_record_id: intakeRecordId },
    });
  }

  /**
   * Kiểm tra xe đã có Work Order đang mở chưa
   * (status khác CLOSED và CANCELLED)
   */
  async findActiveByVehicleId(vehicleId: number) {
    return prisma.workOrder.findFirst({
      where: {
        vehicle_id: vehicleId,
        status: {
          notIn: ['CLOSED', 'CANCELLED'],
        },
      },
      select: { id: true, wo_number: true, status: true },
    });
  }

  /**
   * Lấy danh sách Work Order với bộ lọc
   */
  async findAll(filters: WorkOrderFilters) {
    const { status, advisorId, search, page = 1, limit = 20 } = filters;
    const where: Prisma.WorkOrderWhereInput = {};

    if (status) where.status = status;
    if (advisorId) where.advisor_id = advisorId;

    if (search) {
      where.OR = [
        { wo_number: { contains: search } },
        { customer: { full_name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { vehicle: { license_plate: { contains: search } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      prisma.workOrder.count({ where }),
      prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        include: workOrderInclude,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      data: records,
      pagination: {
        total,
        count: records.length,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };
  }
}
