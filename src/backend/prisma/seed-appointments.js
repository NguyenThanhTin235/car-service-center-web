const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data cho module Lịch Hẹn...');

  // 1. Lấy Customer
  const customer1 = await prisma.user.findFirst();
  if (!customer1) {
    console.error('Không có User nào trong DB! Hãy chạy seed cơ sở dữ liệu trước.');
    return;
  }

  // 2. Lấy Vehicle
  const vehicle1 = await prisma.vehicle.findFirst();
  if (!vehicle1) {
    console.error('Không có Vehicle nào trong DB! Hãy tạo xe trong CSDL.');
    return;
  }

  // 3. Lấy ra Service Template
  const services = await prisma.serviceTemplate.findMany({ take: 2 });
  if (services.length === 0) {
    console.error('Không có ServiceTemplate nào trong DB! Hãy chạy seed cơ bản trước.');
    return;
  }

  // 4. Tạo Appointments cho Tuần Này
  // Lấy ngày hôm nay theo UTC để tránh bị lùi ngày do múi giờ
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  
  const monday = new Date(todayUTC);
  monday.setUTCDate(todayUTC.getUTCDate() - (todayUTC.getUTCDay() === 0 ? 7 : todayUTC.getUTCDay()) + 1); // Monday
  
  const wednesday = new Date(monday);
  wednesday.setUTCDate(monday.getUTCDate() + 2); // Wednesday

  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4); // Friday

  // Clear current appointments to prevent duplicates for testing
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();

  // Tạo Appointment 1 (Hôm nay/Ngày gần đây, 09:00, Trạng thái CONFIRMED)
  const time1 = new Date(Date.UTC(1970, 0, 1, 9, 0)); // 09:00
  await prisma.appointment.create({
    data: {
      customer_id: customer1.id,
      vehicle_id: vehicle1.id,
      scheduled_date: monday,
      scheduled_time: time1,
      status: 'CONFIRMED',
      notes: 'Khách yêu cầu làm nhanh',
      services: {
        create: [
          { service_template_id: services[0].id }
        ]
      }
    }
  });

  // Tạo Appointment 2 (Thứ Tư, 14:00, Trạng thái REQUESTED)
  const time2 = new Date(Date.UTC(1970, 0, 1, 14, 0)); // 14:00
  await prisma.appointment.create({
    data: {
      customer_id: customer1.id,
      vehicle_id: vehicle1.id,
      scheduled_date: wednesday,
      scheduled_time: time2,
      status: 'REQUESTED',
      notes: 'Lần đầu đến xưởng',
      services: {
        create: [
          { service_template_id: services[0].id },
          ...(services[1] ? [{ service_template_id: services[1].id }] : [])
        ]
      }
    }
  });

  // Tạo Appointment 3 (Thứ Sáu, 10:30, Trạng thái RESCHEDULED)
  const time3 = new Date(Date.UTC(1970, 0, 1, 10, 30)); // 10:30
  await prisma.appointment.create({
    data: {
      customer_id: customer1.id,
      vehicle_id: vehicle1.id,
      scheduled_date: friday,
      scheduled_time: time3,
      status: 'RESCHEDULED',
      services: {
        create: [
          { service_template_id: services[1] ? services[1].id : services[0].id }
        ]
      }
    }
  });

  console.log('Seed dữ liệu Lịch hẹn thành công!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
