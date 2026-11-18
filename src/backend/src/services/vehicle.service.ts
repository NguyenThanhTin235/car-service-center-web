import { VehicleSize } from '@prisma/client';
import prisma from '../utils/prisma';

export interface CreateVehicleDto {
  licensePlate: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  vehicleSize?: VehicleSize;
}

export interface UpdateVehicleDto {
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  vehicleSize?: VehicleSize;
}

export class VehicleService {
  /**
   * UC-08: Lấy danh sách xe của khách hàng đang đăng nhập
   */
  async getMyVehicles(customerId: number) {
    const vehicles = await prisma.vehicle.findMany({
      where: { customer_id: customerId },
      include: {
        work_orders: {
          where: {
            status: { notIn: ['CLOSED', 'CANCELLED'] },
          },
          select: {
            id: true,
            wo_number: true,
            status: true,
          },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return vehicles.map((v) => ({
      id: v.id,
      licensePlate: v.license_plate,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      vehicleSize: v.vehicle_size,
      isActive: v.status === 'ACTIVE',
      activeWorkOrder: v.work_orders[0]
        ? {
            id: v.work_orders[0].id,
            woNumber: v.work_orders[0].wo_number,
            status: v.work_orders[0].status,
          }
        : null,
      createdAt: v.created_at,
    }));
  }

  /**
   * UC-07: Thêm xe mới cho khách hàng
   */
  async createVehicle(customerId: number, data: CreateVehicleDto) {
    if (!data.licensePlate || !data.make || !data.model) {
      throw new Error('Biển số, hãng xe và dòng xe là bắt buộc.');
    }

    // Kiểm tra biển số trùng
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { license_plate: data.licensePlate },
    });
    if (existingVehicle) {
      throw new Error(`Biển số ${data.licensePlate} đã tồn tại trong hệ thống.`);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        customer_id: customerId,
        license_plate: data.licensePlate,
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color,
        vehicle_size: data.vehicleSize || 'MEDIUM',
        status: 'ACTIVE',
      },
    });

    return {
      id: vehicle.id,
      licensePlate: vehicle.license_plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      vehicleSize: vehicle.vehicle_size,
      isActive: vehicle.status === 'ACTIVE',
      createdAt: vehicle.created_at,
    };
  }

  /**
   * UC-09: Cập nhật thông tin xe (chỉ chủ xe mới được sửa)
   */
  async updateVehicle(vehicleId: number, customerId: number, data: UpdateVehicleDto, isStaff = false) {
    // Kiểm tra xe tồn tại và thuộc về customer (nếu không phải nhân viên)
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new Error('Không tìm thấy xe.');
    }
    if (!isStaff && vehicle.customer_id !== customerId) {
      throw new Error('Bạn không có quyền chỉnh sửa xe này.');
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        license_plate: data.licensePlate !== undefined ? data.licensePlate : undefined,
        make: data.make !== undefined ? data.make : undefined,
        model: data.model !== undefined ? data.model : undefined,
        year: data.year !== undefined ? data.year : undefined,
        color: data.color !== undefined ? data.color : undefined,
        vehicle_size: data.vehicleSize !== undefined ? data.vehicleSize : undefined,
      },
    });

    return {
      id: updated.id,
      licensePlate: updated.license_plate,
      make: updated.make,
      model: updated.model,
      year: updated.year,
      color: updated.color,
      vehicleSize: updated.vehicle_size,
      isActive: updated.status === 'ACTIVE',
    };
  }

  /**
   * UC-10: Xóa xe (soft delete nếu có lịch sử, hard delete nếu chưa)
   */
  async deleteVehicle(vehicleId: number, customerId: number) {
    // Kiểm tra quyền sở hữu
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new Error('Không tìm thấy xe.');
    }
    if (vehicle.customer_id !== customerId) {
      throw new Error('Bạn không có quyền xóa xe này.');
    }

    // Chặn xóa nếu xe đang có Phiếu công việc đang mở tại xưởng
    const activeWorkOrder = await prisma.workOrder.findFirst({
      where: {
        vehicle_id: vehicleId,
        status: { notIn: ['CLOSED', 'CANCELLED'] },
      },
      select: { id: true, wo_number: true },
      orderBy: { created_at: 'desc' },
    });

    if (activeWorkOrder) {
      throw new Error(
        `Phương tiện đang có Phiếu công việc đang xử lý tại xưởng (${activeWorkOrder.wo_number}). Không thể xóa phương tiện này.`
      );
    }

    // Kiểm tra xem xe đã có lịch hẹn, phiếu tiếp nhận hoặc lệnh sửa chữa chưa
    const [appointmentCount, intakeCount, workOrderCount] = await Promise.all([
      prisma.appointment.count({ where: { vehicle_id: vehicleId } }),
      prisma.intakeRecord.count({ where: { vehicle_id: vehicleId } }),
      prisma.workOrder.count({ where: { vehicle_id: vehicleId } }),
    ]);

    const hasHistory = appointmentCount > 0 || intakeCount > 0 || workOrderCount > 0;

    if (hasHistory) {
      // Soft delete: vô hiệu hóa xe
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'INACTIVE' },
      });
      return { deleted: false, deactivated: true, message: 'Xe đã có lịch sử dịch vụ, đã được vô hiệu hóa thay vì xóa.' };
    } else {
      // Hard delete: xóa hoàn toàn
      await prisma.vehicle.delete({ where: { id: vehicleId } });
      return { deleted: true, deactivated: false, message: 'Xóa xe thành công.' };
    }
  }

  /**
   * Kích hoạt lại xe đã vô hiệu hóa (INACTIVE -> ACTIVE)
   */
  async restoreVehicle(vehicleId: number, customerId: number) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new Error('Không tìm thấy xe.');
    }
    if (vehicle.customer_id !== customerId) {
      throw new Error('Bạn không có quyền kích hoạt lại xe này.');
    }

    if (vehicle.status === 'ACTIVE') {
      return { restored: true, message: 'Phương tiện đang ở trạng thái hoạt động.' };
    }

    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'ACTIVE' },
    });

    return { restored: true, message: 'Đã kích hoạt lại phương tiện thành công.' };
  }
}
