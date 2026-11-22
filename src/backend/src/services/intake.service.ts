import { IntakeType, IntakeStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { IntakeRepository, IntakeFilters } from '../repositories/intake.repository';
import { WarrantyService } from './warranty.service';

const intakeRepo = new IntakeRepository();
const warrantyService = new WarrantyService();

export interface CreateIntakeDto {
  customerId: number;
  vehicleId: number;
  intakeType: IntakeType;
  arrivedAt: string;
  towCompany?: string;
  notes?: string;
  serviceIds?: number[];
  odometerReading?: number;
  parentWorkOrderId?: number;
  goodwillClaimId?: number;
  symptoms?: string;
  evidenceUrls?: string[];
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

      // UC-83: Nghiệp vụ Tiếp nhận bảo hành
      let resolvedGoodwillClaimId: number | null = null;
      let parentWoNumber: string | null = null;

      if (dto.intakeType === 'WARRANTY') {
        if (
          dto.odometerReading === undefined ||
          dto.odometerReading === null ||
          isNaN(dto.odometerReading) ||
          dto.odometerReading < 0
        ) {
          throw new Error('Vui lòng nhập số km ODO hiện tại của xe khi tiếp nhận bảo hành.');
        }

        if (!dto.parentWorkOrderId) {
          throw new Error('Vui lòng chọn phiếu dịch vụ gốc liên quan đến khiếu nại bảo hành.');
        }

        const parentWo = await tx.workOrder.findUnique({
          where: { id: dto.parentWorkOrderId },
          include: { release: true, check_in: true },
        });
        if (!parentWo) {
          throw new Error('Không tìm thấy phiếu dịch vụ gốc được chọn.');
        }
        if (parentWo.vehicle_id !== vehicleId) {
          throw new Error('Phiếu dịch vụ gốc không thuộc về phương tiện này.');
        }
        parentWoNumber = parentWo.wo_number;

        // Chống tua lùi ODO (UC-83 Luồng ngoại lệ)
        await warrantyService.validateOdoIntake(dto.parentWorkOrderId, dto.odometerReading);

        // Kiểm tra thiện chí & điều kiện bảo hành (UC-83 Luồng cơ bản & thay thế)
        if (dto.goodwillClaimId) {
          const claim = await tx.goodwillClaim.findUnique({
            where: { id: dto.goodwillClaimId },
          });
          if (!claim || claim.vehicle_id !== vehicleId || claim.parent_wo_id !== dto.parentWorkOrderId) {
            throw new Error('Yêu cầu bảo hành thiện chí không hợp lệ với phương tiện hoặc phiếu dịch vụ gốc.');
          }
          if (claim.status !== 'APPROVED') {
            throw new Error('Yêu cầu bảo hành thiện chí chưa được Quản lý dịch vụ phê duyệt.');
          }
          if (claim.intake_id) {
            throw new Error('Yêu cầu bảo hành thiện chí này đã được sử dụng cho một lượt tiếp nhận khác.');
          }
          resolvedGoodwillClaimId = claim.id;
        } else {
          // Tự động nhận diện quyết định phê duyệt thiện chí (UC-83 Luồng thay thế 6a)
          const autoClaim = await tx.goodwillClaim.findFirst({
            where: {
              vehicle_id: vehicleId,
              parent_wo_id: dto.parentWorkOrderId,
              status: 'APPROVED',
              intake_id: null,
            },
            orderBy: { id: 'desc' },
          });
          if (autoClaim) {
            resolvedGoodwillClaimId = autoClaim.id;
          }
        }

        // Nếu KHÔNG có hồ sơ thiện chí đã duyệt: Phải có ít nhất 1 hạng mục của phiếu gốc còn hạn
        if (!resolvedGoodwillClaimId) {
          const eligibility = await warrantyService.checkVehicleWarrantyEligibility(
            { vehicleId },
            dto.odometerReading
          );
          const parentWoItems = eligibility.items.filter((it) => it.workOrderId === dto.parentWorkOrderId);
          const hasValidItem = parentWoItems.some((it) => it.status === 'VALID');
          if (parentWoItems.length > 0 && !hasValidItem) {
            throw new Error(
              'Các hạng mục trong phiếu dịch vụ gốc đã hết hạn bảo hành. Vui lòng tạo yêu cầu bảo hành thiện chí để được Quản lý xem xét.'
            );
          }
        }
      }

      // Xây dựng ghi chú tiếp nhận
      let finalNotes = dto.notes || '';
      if (dto.intakeType === 'WARRANTY') {
        const warrantyLines = [
          parentWoNumber ? `[TIẾP NHẬN BẢO HÀNH] Phiếu dịch vụ gốc: #${parentWoNumber}` : `[TIẾP NHẬN BẢO HÀNH]`,
          `ODO tiếp nhận: ${dto.odometerReading?.toLocaleString('vi-VN')} km`,
          dto.symptoms ? `Hiện tượng sự cố: ${dto.symptoms.trim()}` : null,
          dto.evidenceUrls && dto.evidenceUrls.length > 0 ? `Minh chứng hiện trạng: ${dto.evidenceUrls.join('; ')}` : null,
          resolvedGoodwillClaimId ? `Bảo hành thiện chí: Đã duyệt (Claim #${resolvedGoodwillClaimId})` : null,
        ].filter(Boolean).join('\n');
        finalNotes = finalNotes ? `${finalNotes}\n\n${warrantyLines}` : warrantyLines;
      }

      // Tạo IntakeRecord
      const intakeRecord = await intakeRepo.createInTransaction(tx, {
        customer_id: customerId,
        vehicle_id: vehicleId,
        intake_type: dto.intakeType,
        status: 'QUEUED',
        arrived_at: new Date(dto.arrivedAt),
        tow_company: dto.towCompany || null,
        notes: finalNotes || null,
        odometer_reading: dto.odometerReading ?? null,
        created_by_id: createdById,
      });

      // Liên kết hồ sơ thiện chí nếu có
      if (resolvedGoodwillClaimId) {
        await tx.goodwillClaim.update({
          where: { id: resolvedGoodwillClaimId },
          data: { intake_id: intakeRecord.id },
        });
      }

      // Tạo IntakeService nếu có chọn dịch vụ
      if (dto.serviceIds && dto.serviceIds.length > 0) {
        await tx.intakeService.createMany({
          data: dto.serviceIds.map((serviceId) => ({
            intake_id: intakeRecord.id,
            service_id: serviceId,
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
  async cancelIntake(id: number, reason?: string) {
    const record = await intakeRepo.findById(id);
    if (!record) throw new Error('Không tìm thấy phiếu tiếp nhận.');

    if (record.status !== 'QUEUED') {
      throw new Error(`Chỉ có thể hủy phiếu đang ở trạng thái QUEUED. Trạng thái hiện tại: ${record.status}`);
    }

    const trimmedReason = reason?.trim();
    const updatedNotes = trimmedReason
      ? record.notes
        ? `${record.notes}\n\n[Lý do hủy]: ${trimmedReason}`
        : `[Lý do hủy]: ${trimmedReason}`
      : undefined;

    return intakeRepo.updateStatus(id, 'CANCELLED', updatedNotes);
  }
}
