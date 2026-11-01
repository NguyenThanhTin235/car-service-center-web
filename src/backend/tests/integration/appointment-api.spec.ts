import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { generateToken } from '../../src/utils/jwt.util';
import prisma from '../../src/utils/prisma';
import { notificationService } from '../../src/services/notification.service';

vi.mock('../../src/services/notification.service', () => ({
  notificationService: {
    sendEmail: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../src/utils/prisma', () => {
  return {
    __esModule: true,
    default: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      vehicle: {
        findUnique: vi.fn(),
      },
      appointment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
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
      },
      $transaction: vi.fn(),
    },
  };
});

describe('Integration API - Appointment Lifecycle (SPEC-APPT / UC-11, UC-12, UC-13, UC-14, UC-17, UC-18, UC-21)', () => {
  const customerToken = generateToken({
    id: 101,
    email: 'customer@example.com',
    fullName: 'Trần Văn Khách',
    roles: ['CUSTOMER'],
  });

  const staffToken = generateToken({
    id: 15,
    email: 'receptionist@carservice.vn',
    fullName: 'Nguyễn Lễ Tân',
    roles: ['DESK STAFF'],
  });

  beforeEach(() => {
    vi.clearAllMocks();

    (prisma.user.findUnique as any).mockImplementation(({ where }: any) => {
      if (where.id === 101) {
        return Promise.resolve({
          id: 101,
          email: 'customer@example.com',
          full_name: 'Trần Văn Khách',
          phone: '0901234567',
          is_active: true,
          roles: [{ role: { name: 'CUSTOMER' } }],
        });
      }
      if (where.id === 15) {
        return Promise.resolve({
          id: 15,
          email: 'receptionist@carservice.vn',
          full_name: 'Nguyễn Lễ Tân',
          is_active: true,
          roles: [{ role: { name: 'DESK STAFF' } }],
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('GET /api/appointments (UC-12 & UC-18: Xem danh sách lịch hẹn)', () => {
    it('APPT-API-01: Khách hàng xem danh sách lịch hẹn của chính mình -> 200 OK', async () => {
      (prisma.appointment.count as any).mockResolvedValue(1);
      (prisma.appointment.findMany as any).mockResolvedValue([
        {
          id: 1,
          customer_id: 101,
          vehicle_id: 201,
          scheduled_date: new Date('2026-11-10T00:00:00.000Z'),
          scheduled_time: new Date('1970-01-01T09:30:00.000Z'),
          status: 'REQUESTED',
          notes: 'Kiểm tra tiếng kêu gầm',
          customer: { id: 101, full_name: 'Trần Văn Khách', phone: '0901234567' },
          vehicle: { id: 201, license_plate: '51F-123.45', make: 'Toyota', model: 'Corolla Cross' },
          services: [
            { service: { id: 10, name: 'Bảo dưỡng 20.000 km', pricing_type: 'FIXED' } },
          ],
        },
      ]);

      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].scheduled_time_str).toBe('09:30');
      expect(res.body.data[0].customer.full_name).toBe('Trần Văn Khách');
    });

    it('APPT-API-02: Nhân viên lễ tân xem toàn bộ danh sách lịch hẹn kèm phân trang -> 200 OK', async () => {
      (prisma.appointment.count as any).mockResolvedValue(2);
      (prisma.appointment.findMany as any).mockResolvedValue([
        {
          id: 1,
          customer_id: 101,
          vehicle_id: 201,
          scheduled_date: new Date('2026-11-10T00:00:00.000Z'),
          scheduled_time: new Date('1970-01-01T09:30:00.000Z'),
          status: 'CONFIRMED',
          customer: { id: 101, full_name: 'Trần Văn Khách', phone: '0901234567' },
          vehicle: { id: 201, license_plate: '51F-123.45', make: 'Toyota', model: 'Corolla Cross' },
          services: [],
        },
        {
          id: 2,
          customer_id: 102,
          vehicle_id: 202,
          scheduled_date: new Date('2026-11-10T00:00:00.000Z'),
          scheduled_time: new Date('1970-01-01T14:00:00.000Z'),
          status: 'REQUESTED',
          customer: { id: 102, full_name: 'Lê Văn An', phone: '0988776655' },
          vehicle: { id: 202, license_plate: '30A-999.88', make: 'Honda', model: 'CR-V' },
          services: [],
        },
      ]);

      const res = await request(app)
        .get('/api/appointments?page=1&limit=10&status=CONFIRMED,REQUESTED')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.totalRecords).toBe(2);
    });
  });

  describe('GET /api/appointments/:id (Chi tiết lịch hẹn)', () => {
    it('APPT-API-03: Khách hàng xem chi tiết lịch hẹn của mình -> 200 OK', async () => {
      (prisma.appointment.findUnique as any).mockResolvedValue({
        id: 1,
        customer_id: 101,
        vehicle_id: 201,
        scheduled_date: new Date('2026-11-10T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T09:30:00.000Z'),
        status: 'REQUESTED',
        customer: { id: 101, full_name: 'Trần Văn Khách' },
        vehicle: { id: 201, license_plate: '51F-123.45' },
        services: [],
        created_by: { id: 101, full_name: 'Trần Văn Khách' },
      });

      const res = await request(app)
        .get('/api/appointments/1')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(1);
    });

    it('APPT-API-04: Trả về 404 khi ID lịch hẹn không tồn tại trong hệ thống', async () => {
      (prisma.appointment.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/appointments/99999')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/appointments (UC-11: Đặt lịch hẹn mới)', () => {
    it('APPT-API-05: Khách hàng tự đặt lịch hẹn thành công -> 201 Created', async () => {
      (prisma.vehicle.findUnique as any).mockResolvedValue({
        id: 201,
        customer_id: 101,
        license_plate: '51F-123.45',
        make: 'Toyota',
        model: 'Cross',
      });
      (prisma.appointment.findFirst as any).mockResolvedValue(null); // Không bị trùng lịch

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          appointment: {
            create: vi.fn().mockResolvedValue({
              id: 10,
              customer_id: 101,
              vehicle_id: 201,
              scheduled_date: new Date('2026-11-15T00:00:00.000Z'),
              scheduled_time: new Date('1970-01-01T10:00:00.000Z'),
              status: 'REQUESTED',
              notes: 'Thay dầu và lọc gió',
            }),
          },
          appointmentService: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          service: {
            findMany: vi.fn().mockResolvedValue([{ name: 'Thay dầu động cơ' }]),
          },
          user: {
            findUnique: vi.fn().mockResolvedValue({
              id: 101,
              full_name: 'Trần Văn Khách',
              email: 'customer@example.com',
            }),
          },
        };
        return callback(tx);
      });

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vehicle_id: 201,
          scheduled_date: '2026-11-15T00:00:00.000Z',
          scheduled_time: '10:00',
          notes: 'Thay dầu và lọc gió',
          service_ids: [1],
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Tạo lịch hẹn thành công');
      expect(res.body.data.status).toBe('REQUESTED');
    });

    it('APPT-API-06: Báo lỗi 400 khi thiếu thông tin xe hoặc ngày hẹn bắt buộc', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          scheduled_time: '10:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('APPT-API-07: Báo lỗi 400 khi chọn giờ hẹn ngoài khung giờ hành chính (8:00 - 17:00)', async () => {
      (prisma.vehicle.findUnique as any).mockResolvedValue({
        id: 201,
        customer_id: 101,
      });

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vehicle_id: 201,
          scheduled_date: '2026-11-15T00:00:00.000Z',
          scheduled_time: '20:30', // Ngoài giờ làm việc
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Chỉ có thể đặt lịch trong giờ hành chính');
    });

    it('APPT-API-08: Chặn trùng lịch hẹn khi xe đã có lịch trong cùng ngày -> 400 Bad Request', async () => {
      (prisma.vehicle.findUnique as any).mockResolvedValue({
        id: 201,
        customer_id: 101,
      });
      // Đã có lịch trùng
      (prisma.appointment.findFirst as any).mockResolvedValue({
        id: 5,
        vehicle_id: 201,
        status: 'CONFIRMED',
      });

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vehicle_id: 201,
          scheduled_date: '2026-11-15T00:00:00.000Z',
          scheduled_time: '10:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('đã có lịch hẹn hoặc đang được tiếp nhận');
    });
  });

  describe('PUT /api/appointments/:id (UC-13 & UC-19: Dời lịch hẹn)', () => {
    it('APPT-API-09: Dời lịch hẹn thành công -> 200 OK & trạng thái RESCHEDULED', async () => {
      (prisma.appointment.findUnique as any).mockResolvedValue({
        id: 1,
        customer_id: 101,
        vehicle_id: 201,
        status: 'REQUESTED',
        scheduled_date: new Date('2026-11-10T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T09:00:00.000Z'),
        customer: { email: 'customer@example.com', full_name: 'Trần Văn Khách' },
        vehicle: { license_plate: '51F-123.45', make: 'Toyota', model: 'Cross' },
      });

      (prisma.appointment.findFirst as any).mockResolvedValue(null); // Không trùng

      (prisma.appointment.update as any).mockResolvedValue({
        id: 1,
        customer_id: 101,
        vehicle_id: 201,
        status: 'RESCHEDULED',
        scheduled_date: new Date('2026-11-12T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T14:00:00.000Z'),
        notes: 'Dời sang chiều ngày 12',
      });

      const res = await request(app)
        .put('/api/appointments/1')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          scheduled_date: '2026-11-12T00:00:00.000Z',
          scheduled_time: '14:00',
          notes: 'Dời sang chiều ngày 12',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Cập nhật lịch hẹn thành công');
    });
  });

  describe('PATCH /api/appointments/:id/confirm (UC-17: Lễ tân xác nhận lịch)', () => {
    it('APPT-API-10: Xác nhận lịch hẹn thành công -> Status chuyển CONFIRMED', async () => {
      (prisma.appointment.findUnique as any).mockResolvedValue({
        id: 1,
        status: 'REQUESTED',
        customer: { email: 'customer@example.com', full_name: 'Trần Văn Khách' },
        vehicle: { license_plate: '51F-123.45', make: 'Toyota', model: 'Cross' },
        scheduled_date: new Date('2026-11-10T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T09:00:00.000Z'),
      });

      (prisma.appointment.update as any).mockResolvedValue({
        id: 1,
        status: 'CONFIRMED',
      });

      const res = await request(app)
        .patch('/api/appointments/1/confirm')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Xác nhận lịch hẹn thành công');
    });
  });

  describe('PATCH /api/appointments/:id/cancel (UC-14 & UC-20: Hủy lịch hẹn)', () => {
    it('APPT-API-11: Khách hàng hủy lịch hẹn ở trạng thái REQUESTED thành công -> Status CANCELLED', async () => {
      (prisma.appointment.findUnique as any).mockResolvedValue({
        id: 1,
        customer_id: 101,
        status: 'REQUESTED', // Khi chưa confirm, khách tự hủy được
        customer: { email: 'customer@example.com', full_name: 'Trần Văn Khách' },
        vehicle: { license_plate: '51F-123.45', make: 'Toyota', model: 'Cross' },
        scheduled_date: new Date('2026-11-10T00:00:00.000Z'),
        scheduled_time: new Date('1970-01-01T09:00:00.000Z'),
      });

      (prisma.appointment.update as any).mockResolvedValue({
        id: 1,
        status: 'CANCELLED',
        cancel_reason: 'Bận công tác đột xuất',
      });

      const res = await request(app)
        .patch('/api/appointments/1/cancel')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cancel_reason: 'Bận công tác đột xuất',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Hủy lịch hẹn thành công');
    });

    it('APPT-API-12: Báo lỗi 400 khi hủy lịch mà không cung cấp lý do hủy', async () => {
      const res = await request(app)
        .patch('/api/appointments/1/cancel')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('APPT-API-13: Chặn khách hàng tự hủy khi lịch đã CONFIRMED -> Báo lỗi 400', async () => {
      (prisma.appointment.findUnique as any).mockResolvedValue({
        id: 1,
        customer_id: 101,
        status: 'CONFIRMED', // Đã xác nhận -> khách không được tự hủy
        vehicle: { license_plate: '51F-123.45' },
      });

      const res = await request(app)
        .patch('/api/appointments/1/cancel')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cancel_reason: 'Muốn hủy',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Lịch hẹn đã được xác nhận, không thể hủy');
    });
  });

  describe('PATCH /api/appointments/:id/arrive (UC-21: Tiếp nhận xe từ lịch hẹn)', () => {
    it('APPT-API-14: Đánh dấu xe đã đến xưởng -> Sinh IntakeRecord và chuyển ARRIVED', async () => {
      (prisma.appointment.findUnique as any).mockResolvedValue({
        id: 1,
        customer_id: 101,
        vehicle_id: 201,
        status: 'CONFIRMED',
        notes: 'Khách đến đúng hẹn',
      });
      (prisma.intakeRecord.findFirst as any).mockResolvedValue(null); // Chưa có trong queue

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          appointment: {
            update: vi.fn().mockResolvedValue({
              id: 1,
              status: 'ARRIVED',
              customer: { id: 101, full_name: 'Trần Văn Khách', phone: '0901234567' },
              vehicle: { id: 201, license_plate: '51F-123.45', make: 'Toyota', model: 'Cross' },
              services: [],
            }),
          },
          intakeRecord: {
            create: vi.fn().mockResolvedValue({
              id: 88,
              appointment_id: 1,
              customer_id: 101,
              vehicle_id: 201,
              status: 'QUEUED',
              intake_type: 'APPOINTMENT',
            }),
          },
        };
        return callback(tx);
      });

      const res = await request(app)
        .patch('/api/appointments/1/arrive')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Tiếp nhận xe thành công');
    });
  });
});
