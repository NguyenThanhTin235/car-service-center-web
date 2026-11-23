import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock, sendEmailMock, warrantyServiceMock } = vi.hoisted(() => {
  const mock: any = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    appointment: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    appointmentService: {
      createMany: vi.fn(),
    },
    service: {
      findMany: vi.fn(),
    },
    intakeRecord: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    intakeService: {
      createMany: vi.fn(),
    },
    workOrder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    goodwillClaim: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  mock.$transaction = vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mock));

  return {
    prismaMock: mock,
    sendEmailMock: vi.fn().mockResolvedValue(true),
    warrantyServiceMock: {
      checkVehicleWarrantyEligibility: vi.fn(),
      validateOdoIntake: vi.fn(),
    },
  };
});

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('../../../src/services/notification.service', () => ({
  notificationService: {
    sendEmail: sendEmailMock,
  },
}));

vi.mock('../../../src/services/warranty.service', () => ({
  WarrantyService: vi.fn(function () {
    return warrantyServiceMock;
  }),
  warrantyService: warrantyServiceMock,
}));

import { AppointmentService } from '../../../src/services/appointment.service';
import { IntakeService } from '../../../src/services/intake.service';
import { createAppointmentSchema } from '../../../src/dtos/appointment.dto';
import { createIntakeSchema } from '../../../src/dtos/intake.dto';

describe('Warranty Appointment & Intake Unit Tests (UC-82 & UC-83)', () => {
  let appointmentService: AppointmentService;
  let intakeService: IntakeService;

  beforeEach(() => {
    vi.clearAllMocks();
    sendEmailMock.mockResolvedValue(true);
    prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock));
    appointmentService = new AppointmentService();
    intakeService = new IntakeService();
  });

  // =========================================================================
  // PHẦN 1: UC-82 – ĐẶT LỊCH HẸN BẢO HÀNH (APPOINTMENT)
  // =========================================================================
  describe('UC-82: Đặt lịch hẹn bảo hành', () => {
    it('WAR-APT-01: Đặt lịch hẹn bảo hành thành công khi thỏa mãn điều kiện và gửi email xác nhận bảo hành', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Nguyễn Văn A', email: 'a@example.com' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51G-123.45', make: 'Toyota', model: 'Vios' });
      prismaMock.appointment.findFirst.mockResolvedValue(null);

      // Mock xe có hạng mục bảo hành hợp lệ
      warrantyServiceMock.checkVehicleWarrantyEligibility.mockResolvedValue({
        hasHistory: true,
        summary: { totalItems: 2, validItems: 1, expiredItems: 1, overdueLightItems: 0 },
        items: [{ id: 1, status: 'VALID' }],
      });

      prismaMock.appointment.create.mockResolvedValue({
        id: 101,
        customer_id: 10,
        vehicle_id: 20,
        scheduled_date: new Date('2026-12-01T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T09:00:00.000Z'),
        status: 'REQUESTED',
        is_warranty: true,
        notes: '[ĐẶT LỊCH BẢO HÀNH]\nHiện tượng sự cố: Động cơ rung giật\nHạng mục bảo hành yêu cầu: PART-1',
      });

      const result = await appointmentService.createAppointment({
        customer_id: 10,
        vehicle_id: 20,
        scheduled_date: '2026-12-01',
        scheduled_time: '09:00',
        is_warranty: true,
        warranty_item_ids: ['PART-1'],
        symptoms_description: 'Động cơ rung giật',
        evidence_urls: ['https://example.com/video1.mp4'],
      });

      expect(result.id).toBe(101);
      expect(prismaMock.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            is_warranty: true,
            status: 'REQUESTED',
            notes: expect.stringContaining('Động cơ rung giật'),
          }),
        })
      );
      // Gửi email xác nhận bảo hành
      expect(sendEmailMock).toHaveBeenCalledWith(
        'a@example.com',
        expect.stringContaining('Xác nhận đặt lịch bảo hành'),
        expect.any(String)
      );
    });

    it('WAR-APT-02: Đặt lịch bảo hành kết hợp làm thêm dịch vụ thông thường có tính phí (Luồng thay thế)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Trần Thị B', email: 'b@example.com' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51H-567.89', make: 'Honda', model: 'City' });
      prismaMock.appointment.findFirst.mockResolvedValue(null);

      warrantyServiceMock.checkVehicleWarrantyEligibility.mockResolvedValue({
        hasHistory: true,
        summary: { totalItems: 1, validItems: 1, expiredItems: 0, overdueLightItems: 0 },
        items: [{ id: 5, status: 'VALID' }],
      });

      prismaMock.appointment.create.mockResolvedValue({
        id: 102,
        customer_id: 10,
        vehicle_id: 20,
        is_warranty: true,
        status: 'REQUESTED',
      });
      prismaMock.service.findMany.mockResolvedValue([{ name: 'Thay dầu động cơ' }]);

      const result = await appointmentService.createAppointment({
        customer_id: 10,
        vehicle_id: 20,
        scheduled_date: '2026-12-02',
        scheduled_time: '10:00',
        is_warranty: true,
        warranty_item_ids: [5],
        symptoms_description: 'Kêu cọt kẹt gầm trước',
        service_ids: [100], // Làm thêm thay dầu tính phí
      });

      expect(result.id).toBe(102);
      expect(prismaMock.appointmentService.createMany).toHaveBeenCalledWith({
        data: [{ appointment_id: 102, service_id: 100 }],
      });
    });

    it('WAR-APT-03: Báo lỗi khi đặt lịch bảo hành mà thiếu hạng mục bảo hành (Luồng ngoại lệ)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Nguyễn Văn A' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51G-123.45' });
      prismaMock.appointment.findFirst.mockResolvedValue(null);

      await expect(
        appointmentService.createAppointment({
          customer_id: 10,
          vehicle_id: 20,
          scheduled_date: '2026-12-01',
          scheduled_time: '09:00',
          is_warranty: true,
          warranty_item_ids: [], // Rỗng
          symptoms_description: 'Tiếng kêu lạ',
        })
      ).rejects.toThrow('Vui lòng chọn ít nhất một hạng mục dịch vụ hoặc phụ tùng còn bảo hành.');
    });

    it('WAR-APT-04: Báo lỗi khi đặt lịch bảo hành mà để trống mô tả sự cố (Luồng ngoại lệ)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Nguyễn Văn A' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51G-123.45' });
      prismaMock.appointment.findFirst.mockResolvedValue(null);

      await expect(
        appointmentService.createAppointment({
          customer_id: 10,
          vehicle_id: 20,
          scheduled_date: '2026-12-01',
          scheduled_time: '09:00',
          is_warranty: true,
          warranty_item_ids: [1],
          symptoms_description: '   ', // Trống
        })
      ).rejects.toThrow('Vui lòng nhập mô tả chi tiết hiện tượng sự cố.');
    });

    it('WAR-APT-05: Báo lỗi khi xe không có hạng mục nào còn hạn bảo hành (Luồng ngoại lệ)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Nguyễn Văn A' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51G-123.45' });
      prismaMock.appointment.findFirst.mockResolvedValue(null);

      // Xe không có lịch sử hoặc tất cả đã hết hạn và không có quá hạn nhẹ
      warrantyServiceMock.checkVehicleWarrantyEligibility.mockResolvedValue({
        hasHistory: true,
        summary: { totalItems: 3, validItems: 0, expiredItems: 3, overdueLightItems: 0 },
        items: [],
      });

      await expect(
        appointmentService.createAppointment({
          customer_id: 10,
          vehicle_id: 20,
          scheduled_date: '2026-12-01',
          scheduled_time: '09:00',
          is_warranty: true,
          warranty_item_ids: [1],
          symptoms_description: 'Hỏng hóc phát sinh',
        })
      ).rejects.toThrow('Phương tiện không có hạng mục nào còn trong thời hạn bảo hành để đặt lịch.');
    });

    it('WAR-APT-06: Schema DTO validate chặt chẽ trường hợp is_warranty = true', () => {
      // Thiếu warranty_item_ids
      const res1 = createAppointmentSchema.validate({
        customer_id: 1,
        vehicle_id: 2,
        scheduled_date: '2026-12-01',
        scheduled_time: '09:00',
        is_warranty: true,
        symptoms_description: 'Tiếng kêu',
      });
      expect(res1.error?.message).toContain('Vui lòng chọn ít nhất một hạng mục dịch vụ hoặc phụ tùng còn bảo hành');

      // Thiếu symptoms_description
      const res2 = createAppointmentSchema.validate({
        customer_id: 1,
        vehicle_id: 2,
        scheduled_date: '2026-12-01',
        scheduled_time: '09:00',
        is_warranty: true,
        warranty_item_ids: [1],
      });
      expect(res2.error?.message).toContain('Vui lòng nhập mô tả chi tiết hiện tượng sự cố');

      // Hợp lệ
      const res3 = createAppointmentSchema.validate({
        customer_id: 1,
        vehicle_id: 2,
        scheduled_date: '2026-12-01',
        scheduled_time: '09:00',
        is_warranty: true,
        warranty_item_ids: [1],
        symptoms_description: 'Tiếng kêu láp',
      });
      expect(res3.error).toBeUndefined();
    });

    it('WAR-APT-07: Tiếp nhận xe từ lịch hẹn bảo hành (arriveAppointment) chuyển intakeType = WARRANTY và bắt buộc ODO', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 200,
        customer_id: 10,
        vehicle_id: 20,
        status: 'CONFIRMED',
        is_warranty: true,
        notes: 'Triệu chứng lỗi cảm biến',
      });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      // Thử tiếp nhận mà không truyền ODO
      await expect(
        appointmentService.arriveAppointment(200, 99)
      ).rejects.toThrow('Vui lòng nhập số km ODO hiện tại của xe khi tiếp nhận bảo hành.');

      // Tiếp nhận có ODO và parentWorkOrderId
      prismaMock.appointment.update.mockResolvedValue({
        id: 200,
        status: 'ARRIVED',
        services: [],
      });
      prismaMock.intakeRecord.create.mockResolvedValue({
        id: 301,
        customer_id: 10,
        vehicle_id: 20,
        intake_type: 'WARRANTY',
        status: 'QUEUED',
        odometer_reading: 25000,
      });

      const arrivalResult = await appointmentService.arriveAppointment(200, 99, {
        odometerReading: 25000,
        parentWorkOrderId: 10,
        goodwillClaimId: 5,
        symptoms: 'Cảm biến ABS báo đèn',
      });

      expect(warrantyServiceMock.validateOdoIntake).toHaveBeenCalledWith(10, 25000);
      expect(prismaMock.intakeRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            intake_type: 'WARRANTY',
            odometer_reading: 25000,
          }),
        })
      );
      expect(prismaMock.goodwillClaim.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { intake_id: 301 },
      });
    });
  });

  // =========================================================================
  // PHẦN 2: UC-83 – TIẾP NHẬN BẢO HÀNH (INTAKE)
  // =========================================================================
  describe('UC-83: Tiếp nhận bảo hành', () => {
    it('WAR-INT-01: Tạo tiếp nhận bảo hành thành công với đầy đủ ODO và phiếu gốc hợp lệ', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Lê Văn C' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51F-111.22' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        wo_number: 'WO-2026-00050',
        vehicle_id: 20,
        release: { odometer_at_release: 20000 },
      });

      // Đối chiếu còn hạng mục hợp lệ
      warrantyServiceMock.checkVehicleWarrantyEligibility.mockResolvedValue({
        hasHistory: true,
        summary: { totalItems: 2, validItems: 1, expiredItems: 1, overdueLightItems: 0 },
        items: [{ workOrderId: 50, status: 'VALID' }],
      });
      warrantyServiceMock.validateOdoIntake.mockResolvedValue({ isValid: true });

      prismaMock.intakeRecord.create.mockResolvedValue({
        id: 401,
        customer_id: 10,
        vehicle_id: 20,
        intake_type: 'WARRANTY',
        status: 'QUEUED',
        odometer_reading: 22000,
      });

      const intake = await intakeService.createIntake(
        {
          customerId: 10,
          vehicleId: 20,
          intakeType: 'WARRANTY',
          arrivedAt: '2026-12-01T08:30:00.000Z',
          odometerReading: 22000,
          parentWorkOrderId: 50,
          symptoms: 'Thước lái rung mạnh khi phanh',
          evidenceUrls: ['https://example.com/img1.jpg'],
        },
        99
      );

      expect(intake.id).toBe(401);
      expect(warrantyServiceMock.validateOdoIntake).toHaveBeenCalledWith(50, 22000);
      expect(prismaMock.intakeRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            intake_type: 'WARRANTY',
            odometer_reading: 22000,
            notes: expect.stringContaining('WO-2026-00050'),
          }),
        })
      );
    });

    it('WAR-INT-02: Báo lỗi khi tiếp nhận bảo hành mà thiếu ODO tiếp nhận', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Lê Văn C' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51F-111.22' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      await expect(
        intakeService.createIntake(
          {
            customerId: 10,
            vehicleId: 20,
            intakeType: 'WARRANTY',
            arrivedAt: '2026-12-01T08:30:00.000Z',
            parentWorkOrderId: 50,
          },
          99
        )
      ).rejects.toThrow('Vui lòng nhập số km ODO hiện tại của xe khi tiếp nhận bảo hành.');
    });

    it('WAR-INT-03: Báo lỗi khi tiếp nhận bảo hành mà thiếu phiếu dịch vụ gốc', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Lê Văn C' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51F-111.22' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      await expect(
        intakeService.createIntake(
          {
            customerId: 10,
            vehicleId: 20,
            intakeType: 'WARRANTY',
            arrivedAt: '2026-12-01T08:30:00.000Z',
            odometerReading: 25000,
          },
          99
        )
      ).rejects.toThrow('Vui lòng chọn phiếu dịch vụ gốc liên quan đến khiếu nại bảo hành.');
    });

    it('WAR-INT-04: Báo lỗi khi phiếu dịch vụ gốc không thuộc về xe đang tiếp nhận', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Lê Văn C' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51F-111.22' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        wo_number: 'WO-50',
        vehicle_id: 999, // Thuộc xe khác!
      });

      await expect(
        intakeService.createIntake(
          {
            customerId: 10,
            vehicleId: 20,
            intakeType: 'WARRANTY',
            arrivedAt: '2026-12-01T08:30:00.000Z',
            odometerReading: 25000,
            parentWorkOrderId: 50,
          },
          99
        )
      ).rejects.toThrow('Phiếu dịch vụ gốc không thuộc về phương tiện này.');
    });

    it('WAR-INT-05: Chống tua lùi ODO - Ném lỗi khi ODO tiếp nhận nhỏ hơn ODO xuất xưởng phiếu trước (UC-83 Ngoại lệ)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Lê Văn C' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51F-111.22' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        wo_number: 'WO-50',
        vehicle_id: 20,
      });

      // Giả lập warrantyService.validateOdoIntake ném lỗi chống tua lùi
      warrantyServiceMock.validateOdoIntake.mockRejectedValue(
        new Error('Số ODO tiếp nhận không được nhỏ hơn ODO xuất xưởng của phiếu dịch vụ trước (30.000 km).')
      );

      await expect(
        intakeService.createIntake(
          {
            customerId: 10,
            vehicleId: 20,
            intakeType: 'WARRANTY',
            arrivedAt: '2026-12-01T08:30:00.000Z',
            odometerReading: 28000, // Tua lùi từ 30.000 xuống 28.000
            parentWorkOrderId: 50,
          },
          99
        )
      ).rejects.toThrow('Số ODO tiếp nhận không được nhỏ hơn ODO xuất xưởng của phiếu dịch vụ trước');
    });

    it('WAR-INT-06: Tiếp nhận xe bảo hành thiện chí đã được Quản lý duyệt trước (Luồng thay thế 6a)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Lê Văn C' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51F-111.22' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        wo_number: 'WO-50',
        vehicle_id: 20,
      });
      warrantyServiceMock.validateOdoIntake.mockResolvedValue({ isValid: true });

      // Claim thiện chí đã duyệt
      prismaMock.goodwillClaim.findUnique.mockResolvedValue({
        id: 8,
        vehicle_id: 20,
        parent_wo_id: 50,
        status: 'APPROVED',
        intake_id: null,
      });

      prismaMock.intakeRecord.create.mockResolvedValue({
        id: 402,
        customer_id: 10,
        vehicle_id: 20,
        intake_type: 'WARRANTY',
        status: 'QUEUED',
      });

      const intake = await intakeService.createIntake(
        {
          customerId: 10,
          vehicleId: 20,
          intakeType: 'WARRANTY',
          arrivedAt: '2026-12-01T08:30:00.000Z',
          odometerReading: 32000,
          parentWorkOrderId: 50,
          goodwillClaimId: 8,
        },
        99
      );

      expect(intake.id).toBe(402);
      expect(prismaMock.goodwillClaim.update).toHaveBeenCalledWith({
        where: { id: 8 },
        data: { intake_id: 402 },
      });
    });

    it('WAR-INT-07: Từ chối tiếp nhận thiện chí nếu claim chưa được duyệt (status !== APPROVED)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Lê Văn C' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51F-111.22' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        wo_number: 'WO-50',
        vehicle_id: 20,
      });
      warrantyServiceMock.validateOdoIntake.mockResolvedValue({ isValid: true });

      // Claim còn đang PENDING
      prismaMock.goodwillClaim.findUnique.mockResolvedValue({
        id: 8,
        vehicle_id: 20,
        parent_wo_id: 50,
        status: 'PENDING',
        intake_id: null,
      });

      await expect(
        intakeService.createIntake(
          {
            customerId: 10,
            vehicleId: 20,
            intakeType: 'WARRANTY',
            arrivedAt: '2026-12-01T08:30:00.000Z',
            odometerReading: 32000,
            parentWorkOrderId: 50,
            goodwillClaimId: 8,
          },
          99
        )
      ).rejects.toThrow('Yêu cầu bảo hành thiện chí chưa được Quản lý dịch vụ phê duyệt.');
    });

    it('WAR-INT-08: Tự động nhận diện Goodwill Claim đã duyệt khi không truyền goodwillClaimId', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Lê Văn C' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51F-111.22' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        wo_number: 'WO-50',
        vehicle_id: 20,
      });
      warrantyServiceMock.validateOdoIntake.mockResolvedValue({ isValid: true });

      // Tự động tìm thấy claim APPROVED
      prismaMock.goodwillClaim.findFirst.mockResolvedValue({
        id: 9,
        vehicle_id: 20,
        parent_wo_id: 50,
        status: 'APPROVED',
        intake_id: null,
      });

      prismaMock.intakeRecord.create.mockResolvedValue({
        id: 403,
        customer_id: 10,
        vehicle_id: 20,
        intake_type: 'WARRANTY',
        status: 'QUEUED',
      });

      await intakeService.createIntake(
        {
          customerId: 10,
          vehicleId: 20,
          intakeType: 'WARRANTY',
          arrivedAt: '2026-12-01T08:30:00.000Z',
          odometerReading: 32000,
          parentWorkOrderId: 50,
          // Không truyền goodwillClaimId
        },
        99
      );

      expect(prismaMock.goodwillClaim.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: { intake_id: 403 },
      });
    });

    it('WAR-INT-09: Chặn tiếp nhận bảo hành thường nếu phiếu gốc đã hết hạn và chưa có thiện chí (Luồng ngoại lệ)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Lê Văn C' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51F-111.22' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        wo_number: 'WO-50',
        vehicle_id: 20,
      });
      warrantyServiceMock.validateOdoIntake.mockResolvedValue({ isValid: true });
      prismaMock.goodwillClaim.findFirst.mockResolvedValue(null); // Không có claim

      // Tất cả hạng mục đều EXPIRED
      warrantyServiceMock.checkVehicleWarrantyEligibility.mockResolvedValue({
        hasHistory: true,
        summary: { totalItems: 2, validItems: 0, expiredItems: 2, overdueLightItems: 0 },
        items: [
          { workOrderId: 50, status: 'EXPIRED' },
          { workOrderId: 50, status: 'EXPIRED' },
        ],
      });

      await expect(
        intakeService.createIntake(
          {
            customerId: 10,
            vehicleId: 20,
            intakeType: 'WARRANTY',
            arrivedAt: '2026-12-01T08:30:00.000Z',
            odometerReading: 40000,
            parentWorkOrderId: 50,
          },
          99
        )
      ).rejects.toThrow('Các hạng mục trong phiếu dịch vụ gốc đã hết hạn bảo hành. Vui lòng tạo yêu cầu bảo hành thiện chí để được Quản lý xem xét.');
    });

    it('WAR-INT-10: Tiếp nhận xe bảo hành kết hợp thêm dịch vụ tính phí (Luồng kết hợp)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Lê Văn C' });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10, license_plate: '51F-111.22' });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);

      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 50,
        wo_number: 'WO-50',
        vehicle_id: 20,
      });
      warrantyServiceMock.validateOdoIntake.mockResolvedValue({ isValid: true });
      warrantyServiceMock.checkVehicleWarrantyEligibility.mockResolvedValue({
        hasHistory: true,
        summary: { totalItems: 1, validItems: 1, expiredItems: 0, overdueLightItems: 0 },
        items: [{ workOrderId: 50, status: 'VALID' }],
      });

      prismaMock.intakeRecord.create.mockResolvedValue({
        id: 405,
        customer_id: 10,
        vehicle_id: 20,
        intake_type: 'WARRANTY',
        status: 'QUEUED',
      });

      await intakeService.createIntake(
        {
          customerId: 10,
          vehicleId: 20,
          intakeType: 'WARRANTY',
          arrivedAt: '2026-12-01T08:30:00.000Z',
          odometerReading: 21000,
          parentWorkOrderId: 50,
          serviceIds: [10, 20], // Thêm 2 dịch vụ tính phí
        },
        99
      );

      expect(prismaMock.intakeService.createMany).toHaveBeenCalledWith({
        data: [
          { intake_id: 405, service_id: 10 },
          { intake_id: 405, service_id: 20 },
        ],
      });
    });

    it('WAR-INT-11: Schema DTO validate chặt chẽ intakeType = WARRANTY', () => {
      // Thiếu odometerReading
      const res1 = createIntakeSchema.validate({
        customerId: 1,
        vehicleId: 2,
        intakeType: 'WARRANTY',
        arrivedAt: '2026-12-01T08:00:00.000Z',
        parentWorkOrderId: 5,
      });
      expect(res1.error?.message).toContain('Vui lòng nhập số km ODO hiện tại');

      // Thiếu parentWorkOrderId
      const res2 = createIntakeSchema.validate({
        customerId: 1,
        vehicleId: 2,
        intakeType: 'WARRANTY',
        arrivedAt: '2026-12-01T08:00:00.000Z',
        odometerReading: 15000,
      });
      expect(res2.error?.message).toContain('Vui lòng chọn phiếu dịch vụ gốc');

      // Hợp lệ
      const res3 = createIntakeSchema.validate({
        customerId: 1,
        vehicleId: 2,
        intakeType: 'WARRANTY',
        arrivedAt: '2026-12-01T08:00:00.000Z',
        odometerReading: 15000,
        parentWorkOrderId: 5,
      });
      expect(res3.error).toBeUndefined();
    });
  });
});
