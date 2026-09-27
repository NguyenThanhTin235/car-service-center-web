import { Prisma, IntakeStatus } from '@prisma/client';
import prisma from '../utils/prisma';

export interface IntakeFilters {
  status?: IntakeStatus;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class IntakeRepository {
  /**
   * Tạo IntakeRecord mới
   */
  async create(data: Prisma.IntakeRecordUncheckedCreateInput) {
    return prisma.intakeRecord.create({
      data,
      include: {
        customer: { select: { id: true, full_name: true, phone: true, email: true } },
        vehicle: { select: { id: true, license_plate: true, make: true, model: true, color: true, vehicle_size: true } },
        created_by: { select: { id: true, full_name: true } },
        services: { include: { service_template: true } },
      },
    });
  }

  /**
   * Tạo IntakeRecord trong một transaction đang mở (dùng cho arriveAppointment)
   */
  async createInTransaction(
    tx: Prisma.TransactionClient,
    data: Prisma.IntakeRecordUncheckedCreateInput
  ) {
    return tx.intakeRecord.create({
      data,
      include: {
        customer: { select: { id: true, full_name: true, phone: true, email: true } },
        vehicle: { select: { id: true, license_plate: true, make: true, model: true, color: true, vehicle_size: true } },
        created_by: { select: { id: true, full_name: true } },
        services: { include: { service_template: true } },
      },
    });
  }

  /**
   * Lấy danh sách IntakeRecord với bộ lọc
   */
  async findAll(filters: IntakeFilters) {
    const { status, date, search, page = 1, limit = 50 } = filters;
    const where: Prisma.IntakeRecordWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      where.arrived_at = { gte: startOfDay, lte: endOfDay };
    }

    if (search) {
      where.OR = [
        { customer: { full_name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { vehicle: { license_plate: { contains: search } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      prisma.intakeRecord.count({ where }),
      prisma.intakeRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, full_name: true, phone: true, email: true } },
          vehicle: { select: { id: true, license_plate: true, make: true, model: true, color: true, vehicle_size: true } },
          created_by: { select: { id: true, full_name: true } },
          services: { include: { service_template: true } },
        },
        orderBy: { arrived_at: 'desc' },
      }),
    ]);

    return {
      data: records,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };
  }

  /**
   * Lấy chi tiết IntakeRecord
   */
  async findById(id: number) {
    return prisma.intakeRecord.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, full_name: true, phone: true, email: true, address: true } },
        vehicle: { select: { id: true, license_plate: true, make: true, model: true, year: true, color: true, vehicle_size: true } },
        created_by: { select: { id: true, full_name: true } },
        work_order: { select: { id: true, wo_number: true, status: true } },
        services: { include: { service_template: true } },
      },
    });
  }

  /**
   * Cập nhật trạng thái IntakeRecord
   */
  async updateStatus(id: number, status: IntakeStatus) {
    return prisma.intakeRecord.update({
      where: { id },
      data: { status },
    });
  }
}
