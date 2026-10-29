import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { notificationService } from '../services/notification.service';
import { renderAppointmentReminderTemplate } from '../utils/appointment-email.templates';

const prisma = new PrismaClient();

// Run every hour to check for appointments in the next 24 hours
export const startAppointmentReminderJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('⏰ Running Appointment Reminder Job...');
      
      const now = new Date();
      // Look for appointments scheduled between 23.5 and 24.5 hours from now
      // This ensures we catch them when the hourly cron runs, without sending multiple times
      const targetStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
      const targetEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          status: { in: ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'] },
          scheduled_date: {
            gte: targetStart,
            lte: targetEnd,
          },
        },
        include: {
          customer: true,
          vehicle: true,
        },
      });

      for (const apt of upcomingAppointments) {
        if (apt.customer?.email) {
          const dateStr = new Date(apt.scheduled_date).toLocaleDateString('vi-VN');
          const timeStr = apt.scheduled_time.toISOString().substring(11, 16);
          const vehicleModel = apt.vehicle ? `${apt.vehicle.make} ${apt.vehicle.model}`.trim() : undefined;
          
          const html = renderAppointmentReminderTemplate({
            customerName: apt.customer.full_name,
            licensePlate: apt.vehicle?.license_plate,
            vehicleModel,
            scheduledDate: dateStr,
            scheduledTime: timeStr,
          });

          notificationService.sendEmail(
            apt.customer.email,
            `[Car Service Center] Nhắc nhở: Lịch hẹn bảo dưỡng ngày mai (${dateStr})`,
            html
          ).catch(err => console.error(`Failed to send reminder to ${apt.customer.email}:`, err));
        }
      }
      
      if (upcomingAppointments.length > 0) {
        console.log(`⏰ Sent reminders for ${upcomingAppointments.length} upcoming appointments.`);
      }
    } catch (error) {
      console.error('Error in Appointment Reminder Job:', error);
    }
  });
  
  console.log('⏰ Appointment Reminder Job scheduled.');
};
