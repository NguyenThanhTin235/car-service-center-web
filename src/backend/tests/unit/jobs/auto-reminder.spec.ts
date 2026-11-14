import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAppointmentReminderCheck } from '../../../src/jobs/appointment-reminder.job';
import prisma from '../../../src/utils/prisma';
import { notificationService } from '../../../src/services/notification.service';

vi.mock('../../../src/services/notification.service', () => ({
  notificationService: {
    sendEmail: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    appointment: {
      findMany: vi.fn(),
    },
  },
}));

describe('Unit Test - Auto Reminder Background Job (UC-78)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('REMIND-01: Quét và gửi email nhắc nhở cho các lịch hẹn trong khoảng 24h tới', async () => {
    const mockUpcoming = [
      {
        id: 10,
        customer_id: 1,
        vehicle_id: 2,
        scheduled_date: new Date('2026-11-03T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T09:30:00.000Z'),
        status: 'CONFIRMED',
        customer: {
          id: 1,
          full_name: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
        },
        vehicle: {
          id: 2,
          license_plate: '51F-123.45',
          make: 'Toyota',
          model: 'Corolla Cross',
        },
      },
      {
        id: 11,
        customer_id: 2,
        vehicle_id: 3,
        scheduled_date: new Date('2026-11-03T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T14:00:00.000Z'),
        status: 'REQUESTED',
        customer: {
          id: 2,
          full_name: 'Trần Thị B',
          email: 'tranthib@example.com',
        },
        vehicle: {
          id: 3,
          license_plate: '30A-999.88',
          make: 'Honda',
          model: 'CR-V',
        },
      },
    ];

    (prisma.appointment.findMany as any).mockResolvedValue(mockUpcoming);

    const count = await runAppointmentReminderCheck();

    expect(count).toBe(2);
    expect(notificationService.sendEmail).toHaveBeenCalledTimes(2);
    expect(notificationService.sendEmail).toHaveBeenCalledWith(
      'nguyenvana@example.com',
      expect.stringContaining('Nhắc nhở: Lịch hẹn bảo dưỡng ngày mai'),
      expect.any(String)
    );
    expect(notificationService.sendEmail).toHaveBeenCalledWith(
      'tranthib@example.com',
      expect.stringContaining('Nhắc nhở: Lịch hẹn bảo dưỡng ngày mai'),
      expect.any(String)
    );
  });

  it('REMIND-02: Không gửi email nếu không có lịch hẹn nào sắp tới trong khung giờ 24h', async () => {
    (prisma.appointment.findMany as any).mockResolvedValue([]);

    const count = await runAppointmentReminderCheck();

    expect(count).toBe(0);
    expect(notificationService.sendEmail).not.toHaveBeenCalled();
  });

  it('REMIND-03: Bỏ qua không gửi nếu khách hàng không có địa chỉ email', async () => {
    (prisma.appointment.findMany as any).mockResolvedValue([
      {
        id: 12,
        customer: { id: 3, full_name: 'Khách Không Mail', email: null },
        vehicle: { license_plate: '59C-111.22', make: 'Ford', model: 'Ranger' },
        scheduled_date: new Date(),
        scheduled_time: new Date(),
      },
    ]);

    const count = await runAppointmentReminderCheck();

    expect(count).toBe(1);
    expect(notificationService.sendEmail).not.toHaveBeenCalled();
  });
});

