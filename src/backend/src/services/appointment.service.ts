import { PrismaClient, Prisma, AppointmentStatus } from '@prisma/client';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export interface CreateAppointmentDto {
  customer_id: number;
  vehicle_id: number;
  scheduled_date: Date;
  scheduled_time: string;
  notes?: string;
  service_ids?: number[];
}

export interface UpdateAppointmentDto {
  scheduled_date?: Date;
  scheduled_time?: string;
  notes?: string;
}

export class AppointmentService {
  /**
   * Lấy danh sách lịch hẹn
   */
  async getAppointments(
    searchQuery?: string, 
    page: number = 1, 
    limit: number = 50,
    startDate?: string,
    endDate?: string,
    status?: string
  ) {
    let whereClause: Prisma.AppointmentWhereInput = {};

    if (searchQuery) {
      whereClause = {
        ...whereClause,
        OR: [
          { customer: { full_name: { contains: searchQuery } } },
          { customer: { phone: { contains: searchQuery } } },
          { vehicle: { license_plate: { contains: searchQuery } } },
        ],
      };
    }

    if (startDate || endDate) {
      whereClause.scheduled_date = {};
      if (startDate) {
        whereClause.scheduled_date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.scheduled_date.lte = new Date(endDate);
      }
    }

    if (status) {
      whereClause.status = status as AppointmentStatus;
    }

    const skip = (page - 1) * limit;

    const [totalRecords, appointments] = await Promise.all([
      prisma.appointment.count({ where: whereClause }),
      prisma.appointment.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, full_name: true, phone: true } },
          vehicle: { select: { id: true, license_plate: true, make: true, model: true } },
          services: {
            include: {
              service_template: { select: { id: true, name: true, pricing_type: true } }
            }
          }
        },
        orderBy: [
          { scheduled_date: 'asc' },
          { scheduled_time: 'asc' }
        ],
      }),
    ]);

    // Parse data to frontend friendly format
    const data = appointments.map((apt: any) => ({
      ...apt,
      // Provide an easy string for scheduled_time (originally stored as DateTime @db.Time)
      // Node.js Prisma returns time as a Date object set to 1970-01-01
      scheduled_time_str: apt.scheduled_time.toISOString().substring(11, 16),
      services: apt.services.map((s: any) => s.service_template)
    }));

    return {
      data,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Lấy chi tiết lịch hẹn
   */
  async getAppointmentById(id: number) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        services: {
          include: {
            service_template: true
          }
        },
        created_by: { select: { id: true, full_name: true } }
      },
    });

    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    const aptAny = appointment as any;
    return {
      ...aptAny,
      scheduled_time_str: aptAny.scheduled_time.toISOString().substring(11, 16),
      services: aptAny.services.map((s: any) => s.service_template)
    };
  }

  /**
   * Tạo lịch hẹn mới (UC-17)
   */
  async createAppointment(data: CreateAppointmentDto, createdById?: number) {
    // Validate customer and vehicle exist
    const customer = await prisma.user.findUnique({ where: { id: data.customer_id } });
    if (!customer) throw new Error('Khách hàng không tồn tại');

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicle_id } });
    if (!vehicle) throw new Error('Phương tiện không tồn tại');
    if (vehicle.customer_id !== data.customer_id) throw new Error('Phương tiện không thuộc về khách hàng này');

    // Validate duplicate appointment for the same vehicle on the same date
    const reqDate = new Date(data.scheduled_date);
    const startOfDay = new Date(reqDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(reqDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        vehicle_id: data.vehicle_id,
        scheduled_date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'ARRIVED']
        }
      }
    });

    if (existingAppointment) {
      throw new Error('Xe này đã có lịch hẹn hoặc đang được tiếp nhận trong ngày hôm nay. Vui lòng chọn ngày khác.');
    }

    // Convert time string "HH:mm" to Date object for Prisma @db.Time
    const timeParts = data.scheduled_time.split(':');
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    
    if (hour < 8 || hour > 17 || (hour === 17 && minute > 0)) {
      throw new Error('Chỉ có thể đặt lịch trong giờ hành chính (8:00 - 17:00)');
    }

    const timeDate = new Date();
    timeDate.setUTCHours(hour, minute, 0, 0);

    return prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          customer_id: data.customer_id,
          vehicle_id: data.vehicle_id,
          scheduled_date: new Date(data.scheduled_date),
          scheduled_time: timeDate,
          notes: data.notes,
          status: 'REQUESTED',
          created_by_id: createdById,
        },
      });

      // Create appointment services if provided
      if (data.service_ids && data.service_ids.length > 0) {
        const serviceData = data.service_ids.map(serviceId => ({
          appointment_id: appointment.id,
          service_template_id: serviceId
        }));

        await tx.appointmentService.createMany({
          data: serviceData
        });
      }

      return appointment;
    });
  }

  /**
   * Dời lịch hẹn (UC-19)
   */
  async updateAppointment(id: number, data: UpdateAppointmentDto) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    if (appointment.status !== 'REQUESTED' && appointment.status !== 'CONFIRMED' && appointment.status !== 'RESCHEDULED') {
      throw new Error(`Không thể dời lịch hẹn đang ở trạng thái ${appointment.status}`);
    }

    const updateData: any = {
      notes: data.notes !== undefined ? data.notes : undefined,
    };

    if (data.scheduled_date || data.scheduled_time) {
      updateData.status = 'RESCHEDULED'; // Status transition
      
      if (data.scheduled_date) {
        const reqDate = new Date(data.scheduled_date);
        
        // Validate duplicate for reschedule
        const startOfDay = new Date(reqDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(reqDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        
        const existingAppointment = await prisma.appointment.findFirst({
          where: {
            vehicle_id: appointment.vehicle_id,
            id: { not: id }, // ignore self
            scheduled_date: {
              gte: startOfDay,
              lte: endOfDay
            },
            status: {
              in: ['REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'ARRIVED']
            }
          }
        });

        if (existingAppointment) {
          throw new Error('Xe này đã có lịch hẹn khác trong ngày được chọn. Vui lòng chọn ngày khác.');
        }

        updateData.scheduled_date = reqDate;
      }
      if (data.scheduled_time) {
        const timeParts = data.scheduled_time.split(':');
        const hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1]);
        
        if (hour < 8 || hour > 17 || (hour === 17 && minute > 0)) {
          throw new Error('Chỉ có thể đặt lịch trong giờ hành chính (8:00 - 17:00)');
        }

        const timeDate = new Date();
        timeDate.setUTCHours(hour, minute, 0, 0);
        updateData.scheduled_time = timeDate;
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { full_name: true, email: true } }
      }
    });

    if (data.scheduled_date && updated.customer?.email) {
      const dateStr = new Date(updated.scheduled_date).toLocaleDateString('vi-VN');
      await notificationService.sendEmail(
        updated.customer.email,
        'Thông báo dời lịch hẹn - Car Service Center',
        `<p>Kính chào ${updated.customer.full_name},</p><p>Lịch hẹn của quý khách đã được dời sang ngày <b>${dateStr}</b>.</p><p>Vui lòng sắp xếp thời gian đến đúng giờ.</p>`
      );
    }

    return updated;
  }

  /**
   * Xác nhận lịch hẹn (Lễ tân gọi điện xác nhận)
   */
  async confirmAppointment(id: number) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    if (appointment.status !== 'REQUESTED' && appointment.status !== 'RESCHEDULED') {
      throw new Error(`Chỉ có thể xác nhận lịch hẹn ở trạng thái REQUESTED hoặc RESCHEDULED. Trạng thái hiện tại: ${appointment.status}`);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        customer: { select: { full_name: true, email: true } }
      }
    });

    if (updated.customer?.email) {
      const dateStr = new Date(updated.scheduled_date).toLocaleDateString('vi-VN');
      await notificationService.sendEmail(
        updated.customer.email,
        'Xác nhận lịch hẹn thành công - Car Service Center',
        `<p>Kính chào ${updated.customer.full_name},</p><p>Lịch hẹn của quý khách vào ngày <b>${dateStr}</b> đã được xác nhận thành công.</p><p>Hân hạnh được đón tiếp quý khách.</p>`
      );
    }

    return updated;
  }

  /**
   * Hủy lịch hẹn (UC-20)
   */
  async cancelAppointment(id: number, cancelReason: string) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    if (appointment.status === 'ARRIVED') {
      throw new Error('Không thể hủy lịch hẹn khi khách đã mang xe đến xưởng');
    }
    if (appointment.status === 'CANCELLED') {
      throw new Error('Lịch hẹn đã bị hủy trước đó');
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        cancel_reason: cancelReason
      },
      include: {
        customer: { select: { full_name: true, email: true } }
      }
    });

    if (updated.customer?.email) {
      const dateStr = new Date(updated.scheduled_date).toLocaleDateString('vi-VN');
      await notificationService.sendEmail(
        updated.customer.email,
        'Thông báo hủy lịch hẹn - Car Service Center',
        `<p>Kính chào ${updated.customer.full_name},</p><p>Lịch hẹn của quý khách vào ngày <b>${dateStr}</b> đã bị hủy.</p><p>Lý do: <i>${cancelReason}</i></p>`
      );
    }

    return updated;
  }

  /**
   * Đánh dấu lịch hẹn đã đến (Tiếp nhận xe) – UC-21 Luồng chính
   * Chuyển Appointment → ARRIVED + Tạo IntakeRecord → QUEUED trong cùng transaction
   */
  async arriveAppointment(id: number, createdById?: number) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, full_name: true } },
        vehicle: { select: { id: true, license_plate: true } },
      },
    });
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    if (appointment.status !== 'CONFIRMED') {
      throw new Error(`Chỉ có thể tiếp nhận xe từ lịch hẹn đã được xác nhận (CONFIRMED). Trạng thái hiện tại: ${appointment.status}`);
    }

    // Kiểm tra xe đã có trong hàng đợi chưa
    const existingIntake = await prisma.intakeRecord.findFirst({
      where: { vehicle_id: appointment.vehicle_id, status: 'QUEUED' },
    });
    if (existingIntake) {
      throw new Error('Xe này đang trong hàng đợi tiếp nhận. Không thể tạo phiếu trùng.');
    }

    return prisma.$transaction(async (tx) => {
      // Cập nhật trạng thái lịch hẹn → ARRIVED
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: { status: 'ARRIVED' },
        include: {
          customer: { select: { id: true, full_name: true, phone: true } },
          vehicle: { select: { id: true, license_plate: true, make: true, model: true } },
          services: { include: { service_template: { select: { id: true, name: true } } } },
        },
      });

      // Tạo IntakeRecord → QUEUED
      const intakeRecord = await tx.intakeRecord.create({
        data: {
          customer_id: appointment.customer_id,
          vehicle_id: appointment.vehicle_id,
          intake_type: 'APPOINTMENT',
          status: 'QUEUED',
          arrived_at: new Date(),
          notes: appointment.notes,
          created_by_id: createdById || appointment.customer_id,
        },
        include: {
          customer: { select: { id: true, full_name: true, phone: true } },
          vehicle: { select: { id: true, license_plate: true, make: true, model: true } },
          created_by: { select: { id: true, full_name: true } },
          services: { include: { service_template: true } },
        },
      });

      // Copy services từ Appointment sang IntakeRecord
      if (updatedAppointment.services && updatedAppointment.services.length > 0) {
        await tx.intakeService.createMany({
          data: updatedAppointment.services.map((svc) => ({
            intake_id: intakeRecord.id,
            service_template_id: svc.service_template_id,
          })),
        });
        
        // Cần fetch lại để include services cho chuẩn, hoặc mutate object
        const finalIntakeRecord = await tx.intakeRecord.findUnique({
          where: { id: intakeRecord.id },
          include: {
            customer: { select: { id: true, full_name: true, phone: true } },
            vehicle: { select: { id: true, license_plate: true, make: true, model: true } },
            created_by: { select: { id: true, full_name: true } },
            services: { include: { service_template: true } },
          }
        });
        return { appointment: updatedAppointment, intakeRecord: finalIntakeRecord };
      }

      return { appointment: updatedAppointment, intakeRecord };
    });
  }
}
