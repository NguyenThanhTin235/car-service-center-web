import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { notificationService } from '../services/notification.service';

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
          // Ideally we should track if the reminder was already sent with a boolean field
          // but for this scope, relying on the narrow time window is a workable heuristic.
        },
        include: {
          customer: true,
        },
      });

      for (const apt of upcomingAppointments) {
        if (apt.customer?.email) {
          const dateStr = new Date(apt.scheduled_date).toLocaleDateString('vi-VN');
          const timeStr = apt.scheduled_time.toISOString().substring(11, 16);
          
          notificationService.sendEmail(
            apt.customer.email,
            'Nhắc nhở lịch hẹn - Car Service Center',
            `<p>Kính chào ${apt.customer.full_name},</p>
             <p>Bạn có một lịch hẹn sắp tới vào ngày mai, <b>${dateStr} lúc ${timeStr}</b>.</p>
             <p>Vui lòng đến đúng giờ để được phục vụ tốt nhất.</p>`
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
