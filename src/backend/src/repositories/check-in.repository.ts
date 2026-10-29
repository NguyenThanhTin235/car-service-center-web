import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

export class CheckInRepository {
  /**
   * Lấy thông tin CheckIn theo Work Order ID
   */
  async findByWorkOrderId(workOrderId: number) {
    return prisma.checkIn.findUnique({
      where: { work_order_id: workOrderId },
    });
  }

  /**
   * Tạo CheckIn mới
   */
  async create(data: Prisma.CheckInUncheckedCreateInput) {
    return prisma.checkIn.create({
      data,
    });
  }

  /**
   * Cập nhật CheckIn
   */
  async update(id: number, data: Prisma.CheckInUncheckedUpdateInput) {
    return prisma.checkIn.update({
      where: { id },
      data,
    });
  }
}
