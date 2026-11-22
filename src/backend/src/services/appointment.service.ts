import { PrismaClient, Prisma, AppointmentStatus } from '@prisma/client';
import { notificationService } from './notification.service';
import { WarrantyService } from './warranty.service';
import { 
  renderAppointmentCreatedTemplate, 
  renderAppointmentRescheduledTemplate, 
  renderAppointmentCancelledTemplate,
  renderAppointmentConfirmedTemplate
} from '../utils/appointment-email.templates';

import prisma from '../utils/prisma';

const warrantyService = new WarrantyService();

export interface CreateAppointmentDto {
  customer_id: number;
  vehicle_id: number;
  scheduled_date: Date | string;
  scheduled_time: string;
  notes?: string;
  service_ids?: number[];
  is_warranty?: boolean;
  warranty_item_ids?: Array<number | string>;
  symptoms_description?: string;
  evidence_urls?: string[];
}

export interface UpdateAppointmentDto {
  scheduled_date?: Date | string;
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
    status?: string,
    customerId?: number
  ) {
    let whereClause: Prisma.AppointmentWhereInput = {};

    if (customerId) {
      whereClause.customer_id = customerId;
    }

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
        const rawStart = typeof startDate === 'string' ? startDate.substring(0, 10) : new Date(startDate).toISOString().substring(0, 10);
        whereClause.scheduled_date.gte = new Date(`${rawStart}T00:00:00.000Z`);
      }
      if (endDate) {
        const rawEnd = typeof endDate === 'string' ? endDate.substring(0, 10) : new Date(endDate).toISOString().substring(0, 10);
        whereClause.scheduled_date.lte = new Date(`${rawEnd}T23:59:59.999Z`);
      }
    }

    if (status) {
      if (status.includes(',')) {
        whereClause.status = { in: status.split(',').map((s) => s.trim() as AppointmentStatus) };
      } else {
        whereClause.status = status as AppointmentStatus;
      }
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
              service: { select: { id: true, name: true, pricing_type: true } }
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
      services: apt.services.map((s: any) => s.service)
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
  async getAppointmentById(id: number, customerId?: number) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        services: {
          include: {
            service: true
          }
        },
        created_by: { select: { id: true, full_name: true } }
      },
    });

    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');
    if (customerId && appointment.customer_id !== customerId) {
      throw new Error('Bạn không có quyền xem lịch hẹn này');
    }

    const aptAny = appointment as any;
    return {
      ...aptAny,
      scheduled_time_str: aptAny.scheduled_time.toISOString().substring(11, 16),
      services: aptAny.services.map((s: any) => s.service)
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

    // Normalize date to YYYY-MM-DD first to avoid timezone boundary issues
    const rawDateStr = typeof data.scheduled_date === 'string'
      ? data.scheduled_date.substring(0, 10)
      : new Date(data.scheduled_date).toISOString().substring(0, 10);
    const startOfDay = new Date(`${rawDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${rawDateStr}T23:59:59.999Z`);

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
      throw new Error('Xe này đã có lịch hẹn trong ngày được chọn. Vui lòng chọn ngày khác.');
    }

    // Convert time string "HH:mm" to Date object for Prisma @db.Time
    const timeParts = data.scheduled_time.split(':');
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    
    if (hour < 8 || hour > 17 || (hour === 17 && minute > 0)) {
      throw new Error('Chỉ có thể đặt lịch trong giờ hành chính (8:00 - 17:00)');
    }

    const timeDate = new Date(Date.UTC(1970, 0, 1, hour, minute, 0));

    const scheduledDateTime = new Date(
      `${rawDateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
    );
    if (scheduledDateTime < new Date()) {
      throw new Error('Không thể đặt lịch hẹn trong quá khứ.');
    }

    const scheduledDateObj = new Date(`${rawDateStr}T00:00:00.000Z`);

    // UC-82: Kiểm tra lịch hẹn bảo hành
    if (data.is_warranty) {
      if (!data.warranty_item_ids || data.warranty_item_ids.length === 0) {
        throw new Error('Vui lòng chọn ít nhất một hạng mục dịch vụ hoặc phụ tùng còn bảo hành.');
      }
      if (!data.symptoms_description || !data.symptoms_description.trim()) {
        throw new Error('Vui lòng nhập mô tả chi tiết hiện tượng sự cố.');
      }

      // Tiền điều kiện UC-82: Phương tiện phải có ít nhất 1 hạng mục dịch vụ/phụ tùng còn hạn hoặc quá hạn nhẹ
      const eligibility = await warrantyService.checkVehicleWarrantyEligibility({ vehicleId: data.vehicle_id });
      if (!eligibility.hasHistory || (eligibility.summary.validItems === 0 && eligibility.summary.overdueLightItems === 0)) {
        throw new Error('Phương tiện không có hạng mục nào còn trong thời hạn bảo hành để đặt lịch.');
      }
    }

    let finalNotes = data.notes || '';
    if (data.is_warranty) {
      const warrantyLines = [
        `[ĐẶT LỊCH BẢO HÀNH]`,
        `Hiện tượng sự cố: ${data.symptoms_description?.trim()}`,
        `Hạng mục bảo hành yêu cầu: ${data.warranty_item_ids?.join(', ')}`,
        data.evidence_urls && data.evidence_urls.length > 0 ? `Minh chứng hiện trường: ${data.evidence_urls.join('; ')}` : null,
      ].filter(Boolean).join('\n');
      finalNotes = finalNotes ? `${finalNotes}\n\n${warrantyLines}` : warrantyLines;
    }

    return prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          customer_id: data.customer_id,
          vehicle_id: data.vehicle_id,
          scheduled_date: scheduledDateObj,
          scheduled_time: timeDate,
          notes: finalNotes || null,
          is_warranty: Boolean(data.is_warranty),
          status: 'REQUESTED',
          created_by_id: createdById,
        },
      });

      // Create appointment services if provided
      let registeredServices: string[] = [];
      if (data.service_ids && data.service_ids.length > 0) {
        const serviceData = data.service_ids.map(serviceId => ({
          appointment_id: appointment.id,
          service_id: serviceId
        }));

        await tx.appointmentService.createMany({
          data: serviceData
        });

        const serviceEntities = await tx.service.findMany({
          where: { id: { in: data.service_ids } },
          select: { name: true }
        });
        registeredServices = serviceEntities.map(s => s.name);
      }

      // Gửi email xác nhận đặt lịch (UC-11 & UC-17 & UC-82)
      const customerForEmail = await tx.user.findUnique({ where: { id: appointment.customer_id } });
      if (customerForEmail?.email) {
        const dateStr = new Date(appointment.scheduled_date).toLocaleDateString('vi-VN');
        const timeStr = data.scheduled_time;
        const vehicleInfo = `${vehicle.make} ${vehicle.model}`;

        const html = renderAppointmentCreatedTemplate({
          customerName: customerForEmail.full_name,
          licensePlate: vehicle.license_plate,
          vehicleModel: vehicleInfo,
          scheduledDate: dateStr,
          scheduledTime: timeStr,
          services: registeredServices,
          notes: data.notes
        });

        const emailSubject = data.is_warranty
          ? `[Car Service Center] Xác nhận đặt lịch bảo hành ngày ${dateStr}`
          : `[Car Service Center] Xác nhận đặt lịch hẹn ngày ${dateStr}`;

        notificationService.sendEmail(
          customerForEmail.email,
          emailSubject,
          html
        ).catch(err => console.error('Failed to send email:', err));
      }

      return appointment;
    });
  }

  /**
   * Dời lịch hẹn (UC-19)
   */
  async updateAppointment(id: number, data: UpdateAppointmentDto, customerId?: number, isStaff: boolean = false) {
    const appointment = await prisma.appointment.findUnique({ 
      where: { id },
      include: {
        vehicle: true
      }
    });
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    if (customerId && appointment.customer_id !== customerId) {
      throw new Error('Bạn không có quyền chỉnh sửa lịch hẹn này');
    }

    if (appointment.status === 'ARRIVED') {
      throw new Error('Không thể dời lịch hẹn khi khách đã mang xe đến xưởng');
    }

    if (appointment.status === 'CANCELLED') {
      throw new Error('Không thể dời lịch hẹn đã bị hủy trước đó');
    }

    // Khách hàng không được phép tự ý dời lịch khi đã được xác nhận (phải liên hệ hotline)
    if (!isStaff) {
      if (appointment.status === 'CONFIRMED') {
        throw new Error('Lịch hẹn đã được xác nhận, không thể dời ngày/giờ. Vui lòng liên hệ hotline trung tâm để được hỗ trợ.');
      }

      if (appointment.status !== 'REQUESTED' && appointment.status !== 'RESCHEDULED') {
        throw new Error(`Không thể dời lịch hẹn đang ở trạng thái ${appointment.status}`);
      }
    }

    const oldDateStr = new Date(appointment.scheduled_date).toLocaleDateString('vi-VN');
    const oldTimeStr = appointment.scheduled_time.toISOString().substring(11, 16);

    const updateData: any = {
      notes: data.notes !== undefined ? data.notes : undefined,
    };

    let hasTimeOrDateChanged = false;

    if (data.scheduled_date || data.scheduled_time) {
      // Giữ nguyên trạng thái trước đó khi dời lịch (vd: CONFIRMED vẫn là CONFIRMED, REQUESTED vẫn là REQUESTED)
      hasTimeOrDateChanged = true;
      
      if (data.scheduled_date) {
        const rawDateStr = typeof data.scheduled_date === 'string'
          ? data.scheduled_date.substring(0, 10)
          : new Date(data.scheduled_date).toISOString().substring(0, 10);
        const reqDate = new Date(`${rawDateStr}T00:00:00.000Z`);
        
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

        const timeDate = new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
        updateData.scheduled_time = timeDate;
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { full_name: true, email: true } },
        vehicle: { select: { license_plate: true, make: true, model: true } }
      }
    });

    // Gửi email thông báo dời lịch (UC-13 & UC-19) nếu có thay đổi ngày hoặc giờ
    if (hasTimeOrDateChanged && updated.customer?.email) {
      const newDateStr = new Date(updated.scheduled_date).toLocaleDateString('vi-VN');
      const newTimeStr = updated.scheduled_time.toISOString().substring(11, 16);
      const vehicleInfo = updated.vehicle ? `${updated.vehicle.make} ${updated.vehicle.model}` : undefined;

      const html = renderAppointmentRescheduledTemplate({
        customerName: updated.customer.full_name,
        licensePlate: updated.vehicle?.license_plate,
        vehicleModel: vehicleInfo,
        scheduledDate: newDateStr,
        scheduledTime: newTimeStr,
        oldScheduledDate: oldDateStr,
        oldScheduledTime: oldTimeStr,
        notes: data.notes || appointment.notes || undefined
      });

      notificationService.sendEmail(
        updated.customer.email,
        `[Car Service Center] Thông báo dời lịch hẹn sang ngày ${newDateStr}`,
        html
      ).catch(err => console.error('Failed to send email:', err));
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
        customer: { select: { full_name: true, email: true, phone: true } },
        vehicle: { select: { license_plate: true, make: true, model: true } },
        services: {
          include: {
            service: { select: { name: true } }
          }
        }
      }
    });

    if (updated.customer?.email) {
      const dateStr = new Date(updated.scheduled_date).toLocaleDateString('vi-VN');
      const timeStr = updated.scheduled_time.toISOString().substring(11, 16);
      const vehicleModel = `${updated.vehicle.make} ${updated.vehicle.model}`.trim();
      const services = updated.services.map((s: any) => s.service.name);

      const html = renderAppointmentConfirmedTemplate({
        customerName: updated.customer.full_name,
        licensePlate: updated.vehicle.license_plate,
        vehicleModel,
        scheduledDate: dateStr,
        scheduledTime: timeStr,
        services,
        notes: updated.notes || undefined,
      });

      notificationService.sendEmail(
        updated.customer.email,
        `[Car Service Center] Xác nhận lịch hẹn thành công - Ngày ${dateStr}`,
        html
      ).catch(err => console.error('Failed to send email:', err));
    }

    return updated;
  }

  /**
   * Hủy lịch hẹn (UC-20)
   */
  async cancelAppointment(id: number, cancelReason: string, customerId?: number, isStaff: boolean = false) {
    const appointment = await prisma.appointment.findUnique({ 
      where: { id },
      include: {
        vehicle: true
      }
    });
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    if (customerId && appointment.customer_id !== customerId) {
      throw new Error('Bạn không có quyền hủy lịch hẹn này');
    }

    if (appointment.status === 'ARRIVED') {
      throw new Error('Không thể hủy lịch hẹn khi khách đã mang xe đến xưởng');
    }
    if (appointment.status === 'CANCELLED') {
      throw new Error('Lịch hẹn đã bị hủy trước đó');
    }

    // Khách hàng không được phép tự hủy khi lịch hẹn đã xác nhận (phải liên hệ hotline)
    if (!isStaff && appointment.status === 'CONFIRMED') {
      throw new Error('Lịch hẹn đã được xác nhận, không thể hủy. Vui lòng liên hệ hotline trung tâm để được hỗ trợ.');
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        cancel_reason: cancelReason
      },
      include: {
        customer: { select: { full_name: true, email: true } },
        vehicle: { select: { license_plate: true, make: true, model: true } }
      }
    });

    // Gửi email hủy lịch hẹn (UC-14 & UC-20)
    if (updated.customer?.email) {
      const dateStr = new Date(updated.scheduled_date).toLocaleDateString('vi-VN');
      const timeStr = updated.scheduled_time.toISOString().substring(11, 16);
      const vehicleInfo = updated.vehicle ? `${updated.vehicle.make} ${updated.vehicle.model}` : undefined;

      const html = renderAppointmentCancelledTemplate({
        customerName: updated.customer.full_name,
        licensePlate: updated.vehicle?.license_plate,
        vehicleModel: vehicleInfo,
        scheduledDate: dateStr,
        scheduledTime: timeStr,
        cancelReason: cancelReason
      });

      notificationService.sendEmail(
        updated.customer.email,
        `[Car Service Center] Thông báo hủy lịch hẹn ngày ${dateStr}`,
        html
      ).catch(err => console.error('Failed to send email:', err));
    }

    return updated;
  }

  /**
   * Đánh dấu lịch hẹn đã đến (Tiếp nhận xe) – UC-21 Luồng chính & UC-83 Tiếp nhận bảo hành từ lịch hẹn
   * Chuyển Appointment → ARRIVED + Tạo IntakeRecord → QUEUED trong cùng transaction
   */
  async arriveAppointment(
    id: number, 
    createdById?: number, 
    arrivalData?: { 
      odometerReading?: number; 
      parentWorkOrderId?: number; 
      goodwillClaimId?: number; 
      symptoms?: string; 
      evidenceUrls?: string[];
    }
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, full_name: true } },
        vehicle: { select: { id: true, license_plate: true } },
      },
    });
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    if (appointment.status !== 'CONFIRMED' && appointment.status !== 'RESCHEDULED') {
      throw new Error(`Chỉ có thể tiếp nhận xe từ lịch hẹn đã được xác nhận (CONFIRMED) hoặc đã dời lịch (RESCHEDULED). Trạng thái hiện tại: ${appointment.status}`);
    }

    // Kiểm tra xe đã có trong hàng đợi chưa
    const existingIntake = await prisma.intakeRecord.findFirst({
      where: { vehicle_id: appointment.vehicle_id, status: 'QUEUED' },
    });
    if (existingIntake) {
      throw new Error('Xe này đang trong hàng đợi tiếp nhận. Không thể tạo phiếu trùng.');
    }

    const isWarrantyApt = Boolean(appointment.is_warranty);
    const intakeType = isWarrantyApt ? 'WARRANTY' : 'APPOINTMENT';
    const odo = arrivalData?.odometerReading !== undefined ? arrivalData.odometerReading : null;

    if (isWarrantyApt) {
      if (odo === null || odo === undefined || isNaN(odo) || odo < 0) {
        throw new Error('Vui lòng nhập số km ODO hiện tại của xe khi tiếp nhận bảo hành.');
      }
      if (arrivalData?.parentWorkOrderId) {
        await warrantyService.validateOdoIntake(arrivalData.parentWorkOrderId, odo);
      }
    }

    return prisma.$transaction(async (tx) => {
      // Cập nhật trạng thái lịch hẹn → ARRIVED
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: { status: 'ARRIVED' },
        include: {
          customer: { select: { id: true, full_name: true, phone: true } },
          vehicle: { select: { id: true, license_plate: true, make: true, model: true } },
          services: { include: { service: { select: { id: true, name: true } } } },
        },
      });

      let intakeNotes = appointment.notes || '';
      if (isWarrantyApt) {
        const extraWarrantyLines = [
          `[TIẾP NHẬN BẢO HÀNH TỪ LỊCH HẸN #${appointment.id}]`,
          `ODO tiếp nhận: ${odo?.toLocaleString('vi-VN')} km`,
          arrivalData?.parentWorkOrderId ? `Phiếu dịch vụ gốc: #${arrivalData.parentWorkOrderId}` : null,
          arrivalData?.symptoms ? `Hiện tượng sự cố thực tế: ${arrivalData.symptoms.trim()}` : null,
          arrivalData?.goodwillClaimId ? `Bảo hành thiện chí Claim #${arrivalData.goodwillClaimId}` : null,
        ].filter(Boolean).join('\n');
        intakeNotes = intakeNotes ? `${intakeNotes}\n\n${extraWarrantyLines}` : extraWarrantyLines;
      }

      // Tạo IntakeRecord → QUEUED
      const intakeRecord = await tx.intakeRecord.create({
        data: {
          customer_id: appointment.customer_id,
          vehicle_id: appointment.vehicle_id,
          intake_type: intakeType,
          status: 'QUEUED',
          arrived_at: new Date(),
          notes: intakeNotes || null,
          odometer_reading: odo,
          created_by_id: createdById || appointment.customer_id,
        },
        include: {
          customer: { select: { id: true, full_name: true, phone: true } },
          vehicle: { select: { id: true, license_plate: true, make: true, model: true } },
          created_by: { select: { id: true, full_name: true } },
          services: { include: { service: true } },
        },
      });

      if (arrivalData?.goodwillClaimId) {
        await tx.goodwillClaim.update({
          where: { id: arrivalData.goodwillClaimId },
          data: { intake_id: intakeRecord.id },
        });
      }

      // Copy services từ Appointment sang IntakeRecord
      if (updatedAppointment.services && updatedAppointment.services.length > 0) {
        await tx.intakeService.createMany({
          data: updatedAppointment.services.map((svc) => ({
            intake_id: intakeRecord.id,
            service_id: svc.service_id,
          })),
        });
        
        // Cần fetch lại để include services cho chuẩn, hoặc mutate object
        const finalIntakeRecord = await tx.intakeRecord.findUnique({
          where: { id: intakeRecord.id },
          include: {
            customer: { select: { id: true, full_name: true, phone: true } },
            vehicle: { select: { id: true, license_plate: true, make: true, model: true } },
            created_by: { select: { id: true, full_name: true } },
            services: { include: { service: true } },
          }
        });
        return { appointment: updatedAppointment, intakeRecord: finalIntakeRecord };
      }

      return { appointment: updatedAppointment, intakeRecord };
    });
  }
}
