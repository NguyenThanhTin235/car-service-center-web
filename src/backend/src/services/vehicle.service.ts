import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateVehicleDto {
  licensePlate: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  vehicleSize?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
}

export interface UpdateVehicleDto {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  vehicleSize?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
}

export class VehicleService {
  /**
   * UC-08: Lấy danh sách xe của khách hàng đang đăng nhập
   */
  async getMyVehicles(customerId: number) {
    const vehicles = await prisma.vehicle.findMany({
      where: { customer_id: customerId },
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
      isActive: v.is_active,
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
      isActive: vehicle.is_active,
      createdAt: vehicle.created_at,
    };
  }

  /**
   * UC-09: Cập nhật thông tin xe (chỉ chủ xe mới được sửa)
   */
  async updateVehicle(vehicleId: number, customerId: number, data: UpdateVehicleDto) {
    // Kiểm tra xe tồn tại và thuộc về customer
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new Error('Không tìm thấy xe.');
    }
    if (vehicle.customer_id !== customerId) {
      throw new Error('Bạn không có quyền chỉnh sửa xe này.');
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
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
      isActive: updated.is_active,
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

    // Kiểm tra xem xe đã có lịch hẹn hoặc phiếu tiếp nhận chưa
    const appointmentCount = await prisma.appointment.count({
      where: { vehicle_id: vehicleId },
    });
    const intakeCount = await prisma.intake.count({
      where: { vehicle_id: vehicleId },
    });

    const hasHistory = appointmentCount > 0 || intakeCount > 0;

    if (hasHistory) {
      // Soft delete: vô hiệu hóa xe
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { is_active: false },
      });
      return { deleted: false, deactivated: true, message: 'Xe đã có lịch sử dịch vụ, đã được vô hiệu hóa thay vì xóa.' };
    } else {
      // Hard delete: xóa hoàn toàn
      await prisma.vehicle.delete({ where: { id: vehicleId } });
      return { deleted: true, deactivated: false, message: 'Xóa xe thành công.' };
    }
  }
}
