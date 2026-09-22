import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixIntakeTypes() {
  console.log('Bắt đầu cập nhật loại tiếp nhận cho các đơn từ Lịch hẹn...');

  const arrivedAppointments = await prisma.appointment.findMany({
    where: {
      status: 'ARRIVED'
    }
  });

  let updatedCount = 0;

  for (const apt of arrivedAppointments) {
    const startDate = new Date(apt.scheduled_date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(apt.scheduled_date);
    endDate.setHours(23, 59, 59, 999);

    const existingIntake = await prisma.intakeRecord.findFirst({
      where: {
        vehicle_id: apt.vehicle_id,
        arrived_at: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    if (existingIntake && existingIntake.intake_type !== 'APPOINTMENT') {
      await prisma.intakeRecord.update({
        where: { id: existingIntake.id },
        data: { intake_type: 'APPOINTMENT' }
      });
      updatedCount++;
    }
  }

  console.log(`Đã cập nhật ${updatedCount} bản ghi tiếp nhận thành loại APPOINTMENT (Hẹn trước).`);
}

fixIntakeTypes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
