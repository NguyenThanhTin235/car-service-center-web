import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock, sendEmailMock } = vi.hoisted(() => {
  const mock: any = {
    user: {
      findUnique: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
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
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    intakeService: {
      createMany: vi.fn(),
    },
  };
  mock.$transaction = vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mock));

  return {
    prismaMock: mock,
    sendEmailMock: vi.fn().mockResolvedValue(true),
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

import { AppointmentService } from '../../../src/services/appointment.service';
import { createAppointmentSchema } from '../../../src/dtos/appointment.dto';

describe('AppointmentService - Desk-Staff Unit Tests', () => {
  let service: AppointmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    sendEmailMock.mockResolvedValue(true);
    prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock));
    service = new AppointmentService();
  });

  describe('STF-APT-UT-01: Working Hours & DTO Validation', () => {
    it('creates an appointment during valid working hours (08:00 - 17:00), links services, and triggers confirmation email', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 10, full_name: 'Nguyen Van An', email: 'an@example.com' })
        .mockResolvedValueOnce({ id: 10, full_name: 'Nguyen Van An', email: 'an@example.com' });
      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 20,
        customer_id: 10,
        license_plate: '51G-123.45',
        make: 'Toyota',
        model: 'Camry',
      });
      prismaMock.appointment.findFirst.mockResolvedValue(null);
      prismaMock.appointment.create.mockResolvedValue({
        id: 101,
        customer_id: 10,
        vehicle_id: 20,
        scheduled_date: new Date('2026-12-01T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T09:30:00.000Z'),
        status: 'REQUESTED',
        notes: 'Bảo dưỡng 10.000 km',
      });
      prismaMock.service.findMany.mockResolvedValue([{ name: 'Thay nhớt tổng hợp' }]);

      const result = await service.createAppointment(
        {
          customer_id: 10,
          vehicle_id: 20,
          scheduled_date: '2026-12-01',
          scheduled_time: '09:30',
          notes: 'Bảo dưỡng 10.000 km',
          service_ids: [1],
        },
        99
      );

      expect(result.id).toBe(101);
      expect(result.status).toBe('REQUESTED');
      expect(prismaMock.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customer_id: 10,
            vehicle_id: 20,
            status: 'REQUESTED',
            created_by_id: 99,
          }),
        })
      );
      expect(prismaMock.appointmentService.createMany).toHaveBeenCalledWith({
        data: [{ appointment_id: 101, service_id: 1 }],
      });
      expect(sendEmailMock).toHaveBeenCalledWith(
        'an@example.com',
        expect.stringContaining('Xác nhận đặt lịch hẹn'),
        expect.any(String)
      );
    });

    it('accepts exact boundary hours 08:00 and 17:00', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Customer', email: null });
      prismaMock.vehicle.findUnique.mockResolvedValue({
        id: 20,
        customer_id: 10,
        license_plate: '51G-123.45',
        make: 'Honda',
        model: 'Civic',
      });
      prismaMock.appointment.findFirst.mockResolvedValue(null);
      prismaMock.appointment.create.mockResolvedValue({
        id: 102,
        customer_id: 10,
        vehicle_id: 20,
        scheduled_date: new Date('2026-12-02T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T17:00:00.000Z'),
        status: 'REQUESTED',
      });

      const morning = await service.createAppointment({
        customer_id: 10,
        vehicle_id: 20,
        scheduled_date: '2026-12-02',
        scheduled_time: '08:00',
      });
      const closing = await service.createAppointment({
        customer_id: 10,
        vehicle_id: 20,
        scheduled_date: '2026-12-02',
        scheduled_time: '17:00',
      });

      expect(morning.id).toBe(102);
      expect(closing.id).toBe(102);
    });

    it.each(['07:59', '17:01', '20:00'])(
      'rejects booking outside business hours at %s',
      async (invalidTime) => {
        prismaMock.user.findUnique.mockResolvedValue({ id: 10, full_name: 'Customer' });
        prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10 });
        prismaMock.appointment.findFirst.mockResolvedValue(null);

        await expect(
          service.createAppointment({
            customer_id: 10,
            vehicle_id: 20,
            scheduled_date: '2026-12-03',
            scheduled_time: invalidTime,
          })
        ).rejects.toThrow('Chỉ có thể đặt lịch trong giờ hành chính (8:00 - 17:00)');

        expect(prismaMock.$transaction).not.toHaveBeenCalled();
      }
    );

    it('validates ISO date & HH:mm format in createAppointmentSchema', () => {
      const valid = createAppointmentSchema.validate({
        customer_id: 10,
        vehicle_id: 20,
        scheduled_date: '2026-12-01',
        scheduled_time: '10:30',
      });
      expect(valid.error).toBeUndefined();

      const invalidTime = createAppointmentSchema.validate({
        vehicle_id: 20,
        scheduled_date: '2026-12-01',
        scheduled_time: '25:99',
      });
      expect(invalidTime.error?.message).toBe('Giờ hẹn phải theo định dạng HH:mm');

      const missingVehicle = createAppointmentSchema.validate({
        scheduled_date: '2026-12-01',
        scheduled_time: '10:00',
      });
      expect(missingVehicle.error?.message).toBe('Vui lòng chọn xe');
    });
  });

  describe('STF-APT-UT-02: Ownership & Duplicate Guards', () => {
    it('throws when customer does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createAppointment({
          customer_id: 999,
          vehicle_id: 20,
          scheduled_date: '2026-12-01',
          scheduled_time: '09:00',
        })
      ).rejects.toThrow('Khách hàng không tồn tại');
    });

    it('throws when vehicle does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10 });
      prismaMock.vehicle.findUnique.mockResolvedValue(null);

      await expect(
        service.createAppointment({
          customer_id: 10,
          vehicle_id: 999,
          scheduled_date: '2026-12-01',
          scheduled_time: '09:00',
        })
      ).rejects.toThrow('Phương tiện không tồn tại');
    });

    it('throws when vehicle belongs to another customer', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10 });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 77 });

      await expect(
        service.createAppointment({
          customer_id: 10,
          vehicle_id: 20,
          scheduled_date: '2026-12-01',
          scheduled_time: '09:00',
        })
      ).rejects.toThrow('Phương tiện không thuộc về khách hàng này');
    });

    it('prevents duplicate active appointment for the same vehicle on the same date', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 10 });
      prismaMock.vehicle.findUnique.mockResolvedValue({ id: 20, customer_id: 10 });
      prismaMock.appointment.findFirst.mockResolvedValue({ id: 55, status: 'CONFIRMED' });

      await expect(
        service.createAppointment({
          customer_id: 10,
          vehicle_id: 20,
          scheduled_date: '2026-12-01',
          scheduled_time: '10:00',
        })
      ).rejects.toThrow('Xe này đã có lịch hẹn hoặc đang được tiếp nhận trong ngày hôm nay. Vui lòng chọn ngày khác.');
    });
  });

  describe('STF-APT-UT-03: Lifecycle Transitions (Confirm, Reschedule, Cancel, Arrive)', () => {
    it('confirms REQUESTED appointment -> CONFIRMED and sends email', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({ id: 11, status: 'REQUESTED' });
      prismaMock.appointment.update.mockResolvedValue({
        id: 11,
        status: 'CONFIRMED',
        scheduled_date: new Date('2026-12-05T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T10:00:00.000Z'),
        notes: null,
        customer: { full_name: 'Tran B', email: 'b@example.com', phone: '0901234567' },
        vehicle: { license_plate: '51A-111.11', make: 'Mazda', model: 'CX-5' },
        services: [{ service: { name: 'Kiểm tra phanh' } }],
      });

      const updated = await service.confirmAppointment(11);

      expect(updated.status).toBe('CONFIRMED');
      expect(sendEmailMock).toHaveBeenCalledWith(
        'b@example.com',
        expect.stringContaining('Xác nhận lịch hẹn thành công'),
        expect.any(String)
      );
    });

    it('blocks confirmAppointment when status is CONFIRMED or ARRIVED', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({ id: 12, status: 'ARRIVED' });

      await expect(service.confirmAppointment(12)).rejects.toThrow(
        'Chỉ có thể xác nhận lịch hẹn ở trạng thái REQUESTED hoặc RESCHEDULED. Trạng thái hiện tại: ARRIVED'
      );
    });

    it('blocks customer from rescheduling CONFIRMED appointment while allowing staff reschedule', async () => {
      const confirmedApt = {
        id: 15,
        customer_id: 10,
        vehicle_id: 20,
        status: 'CONFIRMED',
        scheduled_date: new Date('2026-12-05T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T09:00:00.000Z'),
        notes: 'Check AC',
        vehicle: { license_plate: '51A-111.11', make: 'Mazda', model: 'CX-5' },
      };
      prismaMock.appointment.findUnique.mockResolvedValue(confirmedApt);

      await expect(
        service.updateAppointment(15, { scheduled_time: '11:00' }, 10, false)
      ).rejects.toThrow('Lịch hẹn đã được xác nhận, không thể dời ngày/giờ.');

      prismaMock.appointment.findFirst.mockResolvedValue(null);
      prismaMock.appointment.update.mockResolvedValue({
        id: 15,
        status: 'RESCHEDULED',
        scheduled_date: new Date('2026-12-06T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T11:00:00.000Z'),
        customer: { full_name: 'Tran B', email: 'b@example.com' },
        vehicle: { license_plate: '51A-111.11', make: 'Mazda', model: 'CX-5' },
      });

      const staffRescheduled = await service.updateAppointment(
        15,
        { scheduled_date: '2026-12-06', scheduled_time: '11:00' },
        undefined,
        true
      );
      expect(staffRescheduled.status).toBe('RESCHEDULED');
      expect(sendEmailMock).toHaveBeenCalled();
    });

    it('cancels REQUESTED appointment with reason and blocks cancelling ARRIVED or already CANCELLED', async () => {
      prismaMock.appointment.findUnique.mockResolvedValueOnce({
        id: 16,
        customer_id: 10,
        status: 'ARRIVED',
      });
      await expect(service.cancelAppointment(16, 'Bận việc', undefined, true)).rejects.toThrow(
        'Không thể hủy lịch hẹn khi khách đã mang xe đến xưởng'
      );

      prismaMock.appointment.findUnique.mockResolvedValueOnce({
        id: 17,
        customer_id: 10,
        status: 'CANCELLED',
      });
      await expect(service.cancelAppointment(17, 'Bận việc', undefined, true)).rejects.toThrow(
        'Lịch hẹn đã bị hủy trước đó'
      );

      prismaMock.appointment.findUnique.mockResolvedValueOnce({
        id: 18,
        customer_id: 10,
        status: 'CONFIRMED',
      });
      prismaMock.appointment.update.mockResolvedValue({
        id: 18,
        status: 'CANCELLED',
        cancel_reason: 'Khách đổi lịch',
        scheduled_date: new Date('2026-12-07T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T14:00:00.000Z'),
        customer: { full_name: 'Tran B', email: 'b@example.com' },
        vehicle: { license_plate: '51A-111.11', make: 'Mazda', model: 'CX-5' },
      });

      const cancelled = await service.cancelAppointment(18, 'Khách đổi lịch', undefined, true);
      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.cancel_reason).toBe('Khách đổi lịch');
    });

    it('arriveAppointment marks CONFIRMED -> ARRIVED, creates QUEUED IntakeRecord, and copies registered services', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 21,
        customer_id: 10,
        vehicle_id: 20,
        status: 'CONFIRMED',
        notes: 'Kiểm tra gầm',
      });
      prismaMock.intakeRecord.findFirst.mockResolvedValue(null);
      prismaMock.appointment.update.mockResolvedValue({
        id: 21,
        customer_id: 10,
        vehicle_id: 20,
        status: 'ARRIVED',
        notes: 'Kiểm tra gầm',
        services: [{ service_id: 3 }, { service_id: 5 }],
      });
      prismaMock.intakeRecord.create.mockResolvedValue({
        id: 901,
        customer_id: 10,
        vehicle_id: 20,
        intake_type: 'APPOINTMENT',
        status: 'QUEUED',
      });
      prismaMock.intakeRecord.findUnique.mockResolvedValue({
        id: 901,
        status: 'QUEUED',
        intake_type: 'APPOINTMENT',
        services: [{ service: { id: 3 } }, { service: { id: 5 } }],
      });

      const result = await service.arriveAppointment(21, 99);

      expect(result.appointment.status).toBe('ARRIVED');
      expect(result.intakeRecord?.id).toBe(901);
      expect(prismaMock.intakeService.createMany).toHaveBeenCalledWith({
        data: [
          { intake_id: 901, service_id: 3 },
          { intake_id: 901, service_id: 5 },
        ],
      });
    });

    it('blocks arriveAppointment when status is REQUESTED or vehicle is already QUEUED', async () => {
      prismaMock.appointment.findUnique.mockResolvedValueOnce({
        id: 22,
        vehicle_id: 20,
        status: 'REQUESTED',
      });
      await expect(service.arriveAppointment(22, 99)).rejects.toThrow(
        'Chỉ có thể tiếp nhận xe từ lịch hẹn đã được xác nhận (CONFIRMED) hoặc đã dời lịch (RESCHEDULED). Trạng thái hiện tại: REQUESTED'
      );

      prismaMock.appointment.findUnique.mockResolvedValueOnce({
        id: 23,
        vehicle_id: 20,
        status: 'CONFIRMED',
      });
      prismaMock.intakeRecord.findFirst.mockResolvedValueOnce({ id: 888, status: 'QUEUED' });
      await expect(service.arriveAppointment(23, 99)).rejects.toThrow(
        'Xe này đang trong hàng đợi tiếp nhận. Không thể tạo phiếu trùng.'
      );
    });
  });
});
