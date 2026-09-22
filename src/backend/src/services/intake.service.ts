import { IntakeType, IntakeStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { IntakeRepository, IntakeFilters } from '../repositories/intake.repository';

const intakeRepo = new IntakeRepository();

export interface CreateIntakeDto {
  customerId: number;
  vehicleId: number;
  intakeType: IntakeType;
  arrivedAt: string;
  towCompany?: string;
  notes?: string;
  serviceTemplateIds?: number[];
  // Quick-create customer (khi KH chưa có trong hệ thống)
  newCustomer?: {
    fullName: string;
    phone: string;
    email?: string;
    address?: string;
  };
  // Quick-create vehicle (khi xe chưa có trong hệ thống)
  newVehicle?: {
    licensePlate: string;
    make: string;
    model: string;
    year?: number;
    color?: string;
    vehicleSize?: string;
  };
}

export class IntakeService {
  /**
   * Tạo phiếu tiếp nhận Walk-in hoặc Tow-in
   */
  async createIntake(dto: CreateIntakeDto, createdById: number) {
    // Validate tow_company bắt buộc khi Tow-in
    if (dto.intakeType === 'TOW_IN' && !dto.towCompany) {
      throw new Error('Vui lòng nhập tên người/đơn vị bàn giao xe khi tiếp nhận Tow-in.');
    }

    return prisma.$transaction(async (tx) => {
      let customerId = dto.customerId;
      let vehicleId = dto.vehicleId;

      // Quick-create customer nếu cần
      if (dto.newCustomer && !customerId) {
        // Kiểm tra trùng SĐT
        const existingUser = await tx.user.findFirst({
          where: { phone: dto.newCustomer.phone },
        });
        if (existingUser) {
          throw new Error(`Số điện thoại ${dto.newCustomer.phone} đã tồn tại trong hệ thống.`);
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(dto.newCustomer.phone, 10);

        const newUser = await tx.user.create({
          data: {
            full_name: dto.newCustomer.fullName,
            phone: dto.newCustomer.phone,
            email: dto.newCustomer.email || `${dto.newCustomer.phone}@placeholder.com`,
            password_hash: hashedPassword,
            address: dto.newCustomer.address,
            roles: {
              create: {
                role: { connect: { name: 'CUSTOMER' } },
              },
            },
          },
        });
        customerId = newUser.id;
      }

      // Validate customer exists
      const customer = await tx.user.findUnique({ where: { id: customerId } });
      if (!customer) throw new Error('Khách hàng không tồn tại.');

      // Quick-create vehicle nếu cần
      if (dto.newVehicle && !vehicleId) {
        const existingVehicle = await tx.vehicle.findUnique({
          where: { license_plate: dto.newVehicle.licensePlate },
        });
        if (existingVehicle) {
          throw new Error(`Biển số xe ${dto.newVehicle.licensePlate} đã tồn tại.`);
        }

        const newVehicle = await tx.vehicle.create({
          data: {
            customer_id: customerId,
            license_plate: dto.newVehicle.licensePlate,
            make: dto.newVehicle.make,
            model: dto.newVehicle.model,
            year: dto.newVehicle.year,
            color: dto.newVehicle.color,
            vehicle_size: (dto.newVehicle.vehicleSize as any) || 'MEDIUM',
          },
        });
        vehicleId = newVehicle.id;
      }

      // Validate vehicle exists & belongs to customer
      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) throw new Error('Phương tiện không tồn tại.');
      if (vehicle.customer_id !== customerId) {
        throw new Error('Phương tiện không thuộc về khách hàng này.');
      }

      // Kiểm tra xe đã có trong hàng đợi chưa (tránh trùng lặp)
      const existingIntake = await tx.intakeRecord.findFirst({
        where: {
          vehicle_id: vehicleId,
          status: 'QUEUED',
        },
      });
      if (existingIntake) {
        throw new Error('Xe này đang trong hàng đợi tiếp nhận. Không thể tạo phiếu trùng.');
      }

      // Tạo IntakeRecord
      const intakeRecord = await intakeRepo.createInTransaction(tx, {
        customer_id: customerId,
        vehicle_id: vehicleId,
        intake_type: dto.intakeType,
        status: 'QUEUED',
        arrived_at: new Date(dto.arrivedAt),
        tow_company: dto.towCompany || null,
        notes: dto.notes || null,
        created_by_id: createdById,
      });

      // Tạo IntakeService nếu có chọn dịch vụ
      if (dto.serviceTemplateIds && dto.serviceTemplateIds.length > 0) {
        await tx.intakeService.createMany({
          data: dto.serviceTemplateIds.map((serviceId) => ({
            intake_id: intakeRecord.id,
            service_template_id: serviceId,
          })),
        });
      }

      return intakeRecord;
    });
  }

  /**
   * Lấy danh sách hàng đợi tiếp nhận
   */
  async getIntakeQueue(filters: IntakeFilters) {
    return intakeRepo.findAll(filters);
  }

  /**
   * Lấy chi tiết phiếu tiếp nhận
   */
  async getIntakeById(id: number) {
    const record = await intakeRepo.findById(id);
    if (!record) throw new Error('Không tìm thấy phiếu tiếp nhận.');
    return record;
  }

  /**
   * Hủy phiếu tiếp nhận (chỉ khi đang QUEUED)
   */
  async cancelIntake(id: number) {
    const record = await intakeRepo.findById(id);
    if (!record) throw new Error('Không tìm thấy phiếu tiếp nhận.');

    if (record.status !== 'QUEUED') {
      throw new Error(`Chỉ có thể hủy phiếu đang ở trạng thái QUEUED. Trạng thái hiện tại: ${record.status}`);
    }

    return intakeRepo.updateStatus(id, 'CANCELLED');
  }
}
