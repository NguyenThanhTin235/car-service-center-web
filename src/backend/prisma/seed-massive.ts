import {
  PrismaClient, Prisma,
  EmployeePosition, VehicleSize, VehicleStatus, PricingType,
  AppointmentStatus, IntakeType, IntakeStatus,
  WorkOrderSourceType, WorkOrderStatus, FuelLevel, CheckInStatus,
  ServiceStatus, InspectionStatus, InspectionResultValue,
  Severity, FindingStatus, MarkerType, JobStatus, PartAllocationStatus,
  QuotationType, QuotationStatus, LineType, QcResult,
  ItemType, ReceiptType, MovementType, ReferenceType, AdjustmentStatus,
  InvoiceStatus, PaymentMethod, PaymentStatus,
  CatalogType, InspectionTemplateType,
  NotificationType, AuditAction
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_IMAGE = "https://res.cloudinary.com/dmxxo6wgl/image/upload/v1788942602/image_dn3hj9.jpg";
const DEFAULT_PASSWORD = 'password123';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startDaysAgo: number, endDaysAgo: number): Date {
  const now = new Date();
  const start = new Date(now.getTime() - startDaysAgo * 86400000);
  const end = new Date(now.getTime() - endDaysAgo * 86400000);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function futureDate(daysAhead: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d;
}

function generateVietnamesePhone(): string {
  const prefixes = ['090', '091', '092', '093', '094', '070', '076', '077', '078', '079', '081', '082', '083', '084', '085', '088', '056', '058'];
  return `${randomFrom(prefixes)}${randomBetween(1000000, 9999999)}`;
}

function generateLicensePlate(): string {
  const cities = ['51G', '51H', '51K', '30A', '30H', '29A', '43A', '92C', '36A', '60A', '61A', '72A', '37A', '34A', '15A'];
  return `${randomFrom(cities)}-${randomBetween(100, 999)}.${randomBetween(10, 99)}`;
}

const licensePlatesUsed = new Set<string>();
function uniqueLicensePlate(): string {
  let plate: string;
  do { plate = generateLicensePlate(); } while (licensePlatesUsed.has(plate));
  licensePlatesUsed.add(plate);
  return plate;
}

const phonesUsed = new Set<string>();
function uniquePhone(): string {
  let phone: string;
  do { phone = generateVietnamesePhone(); } while (phonesUsed.has(phone));
  phonesUsed.add(phone);
  return phone;
}

// ==========================================
// DATA POOLS (Vietnamese, referenced from CSV)
// ==========================================

// Tên khách hàng Việt Nam
const CUSTOMER_NAMES = [
  'Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Dũng', 'Phạm Minh Châu',
  'Võ Thanh Tùng', 'Đặng Thu Hà', 'Bùi Quốc Huy', 'Hoàng Thị Lan',
  'Huỳnh Anh Khoa', 'Ngô Phương Linh', 'Đỗ Minh Trí', 'Vũ Thị Mai',
  'Trương Quốc Bảo', 'Lý Thị Ngọc', 'Phan Văn Đức', 'Hồ Thị Thanh',
  'Dương Minh Tuấn', 'Mai Thị Hương', 'Tô Quốc Khánh', 'Lưu Thị Yến',
  'Nguyễn Thành Long', 'Trần Văn Phú', 'Lê Thị Kim', 'Phạm Hoàng Nam',
  'Võ Thị Hồng', 'Đặng Văn Sơn', 'Bùi Thị Trang', 'Hoàng Minh Quân',
  'Huỳnh Thị Diệu', 'Ngô Văn Thắng'
];

// Tên nhân viên
const STAFF_NAMES = [
  'Trần Quốc Việt', 'Nguyễn Thị Hạnh', 'Lê Văn Mạnh', 'Phạm Thị Ngân',
  'Võ Minh Đạt', 'Đặng Văn Hải', 'Bùi Thị Oanh', 'Hoàng Văn Kiên',
  'Huỳnh Minh Phong', 'Ngô Văn Tài', 'Đỗ Quốc Trung', 'Vũ Văn Hưng',
  'Trương Minh Hoàng', 'Lý Văn Bình', 'Phan Thị Ngọc Anh', 'Hồ Văn Lâm',
  'Dương Văn Thành', 'Mai Văn Khải', 'Tô Văn Đông', 'Lưu Minh Hiếu'
];

// Xe & hãng (từ Vehicle.csv + ML_Car_Diagnostic.csv)
const VEHICLE_DATA: { make: string; models: { name: string; years: number[] }[] }[] = [
  { make: 'Toyota', models: [
    { name: 'Vios', years: [2019, 2020, 2021, 2022, 2023] },
    { name: 'Camry', years: [2018, 2019, 2020, 2021, 2022] },
    { name: 'Corolla Cross', years: [2020, 2021, 2022, 2023] },
    { name: 'Fortuner', years: [2019, 2020, 2021, 2022] },
    { name: 'Innova', years: [2018, 2019, 2020, 2021] },
    { name: 'Land Cruiser', years: [2020, 2021, 2022] },
  ]},
  { make: 'Honda', models: [
    { name: 'City', years: [2019, 2020, 2021, 2022, 2023] },
    { name: 'Civic', years: [2019, 2020, 2021, 2022] },
    { name: 'CR-V', years: [2018, 2019, 2020, 2021, 2022] },
    { name: 'Accord', years: [2019, 2020, 2021] },
    { name: 'HR-V', years: [2022, 2023] },
  ]},
  { make: 'Hyundai', models: [
    { name: 'Accent', years: [2018, 2019, 2020, 2021, 2022] },
    { name: 'Tucson', years: [2019, 2020, 2021, 2022] },
    { name: 'Santa Fe', years: [2019, 2020, 2021, 2022] },
    { name: 'Creta', years: [2022, 2023] },
  ]},
  { make: 'Kia', models: [
    { name: 'Seltos', years: [2020, 2021, 2022, 2023] },
    { name: 'Sportage', years: [2018, 2019, 2020, 2021] },
    { name: 'Carnival', years: [2021, 2022, 2023] },
    { name: 'Sorento', years: [2020, 2021, 2022] },
  ]},
  { make: 'Ford', models: [
    { name: 'Ranger', years: [2018, 2019, 2020, 2021, 2022] },
    { name: 'Everest', years: [2019, 2020, 2021, 2022, 2023] },
    { name: 'Territory', years: [2022, 2023] },
  ]},
  { make: 'Mercedes-Benz', models: [
    { name: 'C200', years: [2019, 2020, 2021, 2022] },
    { name: 'E300', years: [2020, 2021, 2022] },
    { name: 'GLC 200', years: [2020, 2021, 2022] },
    { name: 'S-Class', years: [2020, 2021] },
  ]},
  { make: 'BMW', models: [
    { name: '3 Series', years: [2019, 2020, 2021, 2022] },
    { name: '5 Series', years: [2020, 2021, 2022, 2023] },
    { name: 'X3', years: [2020, 2021, 2022] },
    { name: 'X5', years: [2021, 2022] },
  ]},
  { make: 'Nissan', models: [
    { name: 'Navara', years: [2018, 2019, 2020, 2021] },
    { name: 'X-Trail', years: [2019, 2020, 2021] },
    { name: 'Almera', years: [2021, 2022, 2023] },
  ]},
];

const COLORS = ['Trắng', 'Đen', 'Bạc', 'Xám', 'Đỏ', 'Xanh dương', 'Xanh lá', 'Nâu', 'Vàng cát'];

// Mô tả lỗi & chẩn đoán (từ ML_Car_Diagnostic.csv)
const COMPLAINTS = [
  'Đèn pha nhấp nháy', 'Lỗi cửa sổ điện', 'Động cơ bỏ máy', 'Quá nhiệt hộp số',
  'Nhanh hết bình ắc quy', 'Trượt số', 'Xe không khởi động được', 'Quá nhiệt động cơ',
  'Bàn đạp phanh nhẹ hẫng', 'Phanh kêu', 'Sáng đèn báo lỗi động cơ',
  'Kêu rột rột khi sang số', 'Khói từ ống xả', 'Phanh kêu rít', 'Đèn cảnh báo ắc quy',
  'Xe rung khi chạy tốc độ cao', 'Lái xe bị lệch hướng', 'Tiếng kêu từ gầm xe',
  'Điều hòa không mát', 'Xe có mùi khét khi chạy',
];

const DIAGNOSES = [
  'Lỏng dây điện', 'Lỗi mô tơ nâng hạ kính', 'Đứt dây đai cam', 'Dầu hộp số bị đặc',
  'Hết bình ắc quy', 'Mòn bộ ly hợp', 'Mòn bugi', 'Thiếu dầu phanh',
  'Cong vênh đĩa phanh', 'Hỏng củ đề', 'Rò rỉ nước làm mát', 'Hỏng bơm nước',
  'Mòn má phanh', 'Hỏng phuộc giảm xóc', 'Thiếu ga điều hòa',
];

// ==========================================
// MAIN SEED FUNCTION
// ==========================================

async function main() {
  console.log('🚀 ===== BẮT ĐẦU SEED DỮ LIỆU QUY MÔ LỚN =====');
  const startTime = Date.now();

  // ==========================================
  // 1. CLEAR DATABASE
  // ==========================================
  console.log('\n🧹 [1/10] Xóa toàn bộ dữ liệu cũ...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  const tables = await prisma.$queryRaw<Array<any>>`SELECT table_name as tableName FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name != '_prisma_migrations';`;
  for (const { tableName } of tables) {
    if (tableName !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${tableName}\`;`);
    }
  }
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('   ✅ Database đã được xóa sạch.');

  // ==========================================
  // 2. MASTER DATA
  // ==========================================
  console.log('\n📦 [2/10] Tạo Master Data...');

  // 2.1 Roles
  const rolesData = ['ADMIN', 'MANAGER', 'DESK STAFF', 'SA', 'CUSTOMER'];
  const createdRoles: any[] = [];
  for (const r of rolesData) createdRoles.push(await prisma.role.create({ data: { name: r } }));
  const [roleAdmin, roleManager, roleDeskStaff, roleSA, roleCustomer] = createdRoles;
  console.log('   ✅ 5 Roles');

  // 2.2 SystemCatalogs
  const catalogs: any = {};
  // UOM
  const uomNames = ['Cái', 'Bộ', 'Lít', 'Mét', 'Kg', 'Hộp', 'Chai', 'Cuộn'];
  const uomCatalogs: any[] = [];
  for (const u of uomNames) uomCatalogs.push(await prisma.systemCatalog.create({ data: { catalog_type: CatalogType.UOM, name: u } }));
  catalogs.uom = uomCatalogs;
  // CANCEL_REASON
  for (const r of ['Khách đổi ý', 'Không liên lạc được', 'Giá quá cao', 'Chuyển xưởng khác']) {
    await prisma.systemCatalog.create({ data: { catalog_type: CatalogType.CANCEL_REASON, name: r } });
  }
  // ADJUST_REASON
  for (const r of ['Hàng hỏng', 'Kiểm kê chênh lệch', 'Hết hạn sử dụng']) {
    await prisma.systemCatalog.create({ data: { catalog_type: CatalogType.ADJUST_REASON, name: r } });
  }
  console.log('   ✅ 15 SystemCatalogs');

  // 2.3 Skills
  const skillNames = [
    'Sửa chữa động cơ xăng', 'Sửa chữa động cơ diesel', 'Hệ thống điện ô tô',
    'Hệ thống phanh', 'Hệ thống treo & gầm', 'Hộp số tự động',
    'Hộp số sàn', 'Sơn ô tô', 'Gò đồng thân vỏ',
    'Chẩn đoán OBD-II', 'Điều hòa ô tô', 'Chăm sóc nội thất'
  ];
  const skills: any[] = [];
  for (const s of skillNames) skills.push(await prisma.skill.create({ data: { name: s } }));
  console.log('   ✅ 12 Skills');

  // 2.4 ServiceCategories
  const categoryData = [
    { name: 'Bảo dưỡng định kỳ', description: 'Các dịch vụ bảo dưỡng theo định kỳ km hoặc thời gian' },
    { name: 'Sửa chữa động cơ', description: 'Sửa chữa các hư hỏng liên quan đến động cơ' },
    { name: 'Sửa chữa hộp số', description: 'Bảo dưỡng và sửa chữa hộp số' },
    { name: 'Hệ thống phanh', description: 'Kiểm tra, sửa chữa và thay thế hệ thống phanh' },
    { name: 'Hệ thống điện & Ắc quy', description: 'Sửa chữa hệ thống điện, máy phát, ắc quy' },
    { name: 'Hệ thống treo & Gầm', description: 'Sửa chữa giảm xóc, thước lái, rotuyn' },
    { name: 'Sơn & Đồng', description: 'Sơn lại, gò nắn thân vỏ xe' },
    { name: 'Chăm sóc & Vệ sinh', description: 'Vệ sinh nội thất, detailing, phủ ceramic' },
  ];
  const serviceCategories: any[] = [];
  for (let i = 0; i < categoryData.length; i++) {
    serviceCategories.push(await prisma.serviceCategory.create({
      data: { name: categoryData[i].name, description: categoryData[i].description, sort_order: i + 1 }
    }));
  }
  console.log('   ✅ 8 ServiceCategories');

  // 2.5 ServiceTemplates + VehicleSizePrices
  const serviceData: { catIdx: number; name: string; pricingType: PricingType; fixedPrice?: number; basePrice: number }[] = [
    // Cat 0: Bảo dưỡng định kỳ
    { catIdx: 0, name: 'Thay dầu máy', pricingType: PricingType.VEHICLE_SIZE, basePrice: 350000 },
    { catIdx: 0, name: 'Bảo dưỡng 10.000 km', pricingType: PricingType.VEHICLE_SIZE, basePrice: 800000 },
    { catIdx: 0, name: 'Bảo dưỡng 40.000 km', pricingType: PricingType.VEHICLE_SIZE, basePrice: 2500000 },
    // Cat 1: Sửa chữa động cơ
    { catIdx: 1, name: 'Sửa chữa quá nhiệt động cơ', pricingType: PricingType.LABOUR_PARTS, basePrice: 3000000 },
    { catIdx: 1, name: 'Thay bugi & bô bin', pricingType: PricingType.FIXED, fixedPrice: 1200000, basePrice: 1200000 },
    { catIdx: 1, name: 'Sửa chữa động cơ bỏ máy', pricingType: PricingType.LABOUR_PARTS, basePrice: 4500000 },
    // Cat 2: Sửa chữa hộp số
    { catIdx: 2, name: 'Thay dầu hộp số', pricingType: PricingType.VEHICLE_SIZE, basePrice: 600000 },
    { catIdx: 2, name: 'Đại tu hộp số', pricingType: PricingType.LABOUR_PARTS, basePrice: 8000000 },
    { catIdx: 2, name: 'Sửa trượt số', pricingType: PricingType.LABOUR_PARTS, basePrice: 5000000 },
    // Cat 3: Hệ thống phanh
    { catIdx: 3, name: 'Thay má phanh trước', pricingType: PricingType.VEHICLE_SIZE, basePrice: 500000 },
    { catIdx: 3, name: 'Thay đĩa phanh', pricingType: PricingType.VEHICLE_SIZE, basePrice: 1500000 },
    { catIdx: 3, name: 'Bảo dưỡng phanh tổng quát', pricingType: PricingType.VEHICLE_SIZE, basePrice: 900000 },
    // Cat 4: Hệ thống điện & Ắc quy
    { catIdx: 4, name: 'Thay bình ắc quy', pricingType: PricingType.FIXED, fixedPrice: 2000000, basePrice: 2000000 },
    { catIdx: 4, name: 'Sửa chữa hệ thống điện', pricingType: PricingType.LABOUR_PARTS, basePrice: 1500000 },
    { catIdx: 4, name: 'Thay máy phát điện', pricingType: PricingType.LABOUR_PARTS, basePrice: 5000000 },
    // Cat 5: Hệ thống treo & Gầm
    { catIdx: 5, name: 'Thay phuộc giảm xóc', pricingType: PricingType.VEHICLE_SIZE, basePrice: 3000000 },
    { catIdx: 5, name: 'Cân chỉnh thước lái', pricingType: PricingType.FIXED, fixedPrice: 400000, basePrice: 400000 },
    // Cat 6: Sơn & Đồng
    { catIdx: 6, name: 'Sơn lại panel', pricingType: PricingType.FIXED, fixedPrice: 2000000, basePrice: 2000000 },
    { catIdx: 6, name: 'Gò nắn thân xe', pricingType: PricingType.LABOUR_PARTS, basePrice: 3500000 },
    // Cat 7: Chăm sóc
    { catIdx: 7, name: 'Vệ sinh nội thất toàn bộ', pricingType: PricingType.VEHICLE_SIZE, basePrice: 500000 },
  ];

  const sizeMultipliers: Record<VehicleSize, number> = {
    [VehicleSize.SMALL]: 1.0,
    [VehicleSize.MEDIUM]: 1.2,
    [VehicleSize.LARGE]: 1.4,
    [VehicleSize.SUV]: 1.5,
    [VehicleSize.TRUCK]: 1.6,
  };

  const serviceTemplates: any[] = [];
  for (const sd of serviceData) {
    const st = await prisma.serviceTemplate.create({
      data: {
        category_id: serviceCategories[sd.catIdx].id,
        name: sd.name,
        pricing_type: sd.pricingType,
        fixed_price: sd.fixedPrice || null,
      }
    });
    serviceTemplates.push(st);

    // VehicleSizePrices
    if (sd.pricingType === PricingType.VEHICLE_SIZE) {
      for (const size of Object.values(VehicleSize)) {
        await prisma.vehicleSizePrice.create({
          data: { service_template_id: st.id, vehicle_size: size, price: Math.round(sd.basePrice * sizeMultipliers[size]) }
        });
      }
    }
  }
  console.log('   ✅ 20 ServiceTemplates + VehicleSizePrices');

  // 2.6 JobTypes
  const jobTypeData = [
    { name: 'Phòng Cơ khí', rate: 150000 },
    { name: 'Phòng Điện - Điện tử', rate: 180000 },
    { name: 'Phòng Gầm', rate: 140000 },
    { name: 'Phòng Sơn', rate: 200000 },
    { name: 'Phòng Đồng', rate: 170000 },
    { name: 'Phòng Nội thất', rate: 120000 },
    { name: 'Phòng Điều hòa', rate: 160000 },
    { name: 'Phòng Tổng hợp', rate: 130000 },
  ];
  const jobTypes: any[] = [];
  for (const jt of jobTypeData) jobTypes.push(await prisma.jobType.create({ data: { name: jt.name, hourly_rate: jt.rate } }));
  console.log('   ✅ 8 JobTypes');

  // 2.7 JobTemplates
  const jobTemplateData: { jtIdx: number; stIdx: number; name: string; hours: number }[] = [
    // Bảo dưỡng
    { jtIdx: 0, stIdx: 0, name: 'Xả và thay dầu máy', hours: 0.5 },
    { jtIdx: 0, stIdx: 0, name: 'Thay lọc dầu', hours: 0.3 },
    { jtIdx: 0, stIdx: 1, name: 'Kiểm tra và bảo dưỡng 10K', hours: 2.0 },
    { jtIdx: 0, stIdx: 2, name: 'Bảo dưỡng toàn diện 40K', hours: 4.0 },
    // Động cơ
    { jtIdx: 0, stIdx: 3, name: 'Kiểm tra hệ thống làm mát', hours: 1.5 },
    { jtIdx: 0, stIdx: 3, name: 'Thay bơm nước', hours: 2.5 },
    { jtIdx: 0, stIdx: 4, name: 'Tháo và thay bugi', hours: 1.0 },
    { jtIdx: 0, stIdx: 4, name: 'Thay bô bin đánh lửa', hours: 1.5 },
    { jtIdx: 0, stIdx: 5, name: 'Chẩn đoán lỗi OBD-II', hours: 1.0 },
    { jtIdx: 0, stIdx: 5, name: 'Thay dây đai cam', hours: 3.0 },
    // Hộp số
    { jtIdx: 0, stIdx: 6, name: 'Xả và thay dầu hộp số', hours: 1.0 },
    { jtIdx: 0, stIdx: 7, name: 'Tháo rã và đại tu hộp số', hours: 8.0 },
    { jtIdx: 0, stIdx: 8, name: 'Kiểm tra và sửa bộ ly hợp', hours: 4.0 },
    // Phanh
    { jtIdx: 2, stIdx: 9, name: 'Tháo và thay má phanh trước', hours: 1.0 },
    { jtIdx: 2, stIdx: 10, name: 'Thay đĩa phanh trước', hours: 1.5 },
    { jtIdx: 2, stIdx: 10, name: 'Thay đĩa phanh sau', hours: 1.5 },
    { jtIdx: 2, stIdx: 11, name: 'Xả khí và châm dầu phanh', hours: 0.5 },
    { jtIdx: 2, stIdx: 11, name: 'Kiểm tra tổng hệ thống phanh', hours: 1.0 },
    // Điện
    { jtIdx: 1, stIdx: 12, name: 'Tháo và lắp ắc quy mới', hours: 0.5 },
    { jtIdx: 1, stIdx: 13, name: 'Kiểm tra và sửa dây điện', hours: 2.0 },
    { jtIdx: 1, stIdx: 14, name: 'Tháo và thay máy phát điện', hours: 3.0 },
    // Gầm
    { jtIdx: 2, stIdx: 15, name: 'Thay phuộc giảm xóc trước', hours: 2.0 },
    { jtIdx: 2, stIdx: 15, name: 'Thay phuộc giảm xóc sau', hours: 2.0 },
    { jtIdx: 2, stIdx: 16, name: 'Cân chỉnh góc lái', hours: 1.0 },
    // Sơn đồng
    { jtIdx: 3, stIdx: 17, name: 'Sơn lại 1 panel', hours: 4.0 },
    { jtIdx: 4, stIdx: 18, name: 'Gò nắn cánh cửa', hours: 3.0 },
    { jtIdx: 4, stIdx: 18, name: 'Kéo nắn khung xe', hours: 5.0 },
    // Nội thất
    { jtIdx: 5, stIdx: 19, name: 'Hút bụi và vệ sinh cabin', hours: 1.5 },
    { jtIdx: 5, stIdx: 19, name: 'Giặt ghế và thảm', hours: 2.0 },
    { jtIdx: 5, stIdx: 19, name: 'Phủ nano nội thất', hours: 1.0 },
  ];

  const jobTemplates: any[] = [];
  for (const jd of jobTemplateData) {
    jobTemplates.push(await prisma.jobTemplate.create({
      data: {
        job_type_id: jobTypes[jd.jtIdx].id,
        service_template_id: serviceTemplates[jd.stIdx].id,
        name: jd.name,
        estimated_hours: jd.hours,
        requires_qc: true,
      }
    }));
  }
  console.log('   ✅ 30 JobTemplates');

  // 2.8 InspectionTemplates + Items
  const inspTemplateData: { stIdx: number; type: InspectionTemplateType; name: string; items: string[] }[] = [
    { stIdx: 1, type: InspectionTemplateType.INSPECTION, name: 'Kiểm tra bảo dưỡng 10K',
      items: ['Mức dầu máy', 'Lọc gió động cơ', 'Lọc gió điều hòa', 'Nước làm mát', 'Đèn chiếu sáng', 'Gạt mưa'] },
    { stIdx: 2, type: InspectionTemplateType.INSPECTION, name: 'Kiểm tra bảo dưỡng 40K',
      items: ['Dây đai cam', 'Bugi', 'Dầu hộp số', 'Dầu phanh', 'Lọc nhiên liệu', 'Hệ thống làm mát', 'Phuộc giảm xóc', 'Ống xả'] },
    { stIdx: 3, type: InspectionTemplateType.INSPECTION, name: 'Kiểm tra hệ thống làm mát',
      items: ['Mức nước làm mát', 'Két nước', 'Quạt làm mát', 'Ống dẫn nước', 'Bơm nước', 'Van hằng nhiệt'] },
    { stIdx: 11, type: InspectionTemplateType.INSPECTION, name: 'Kiểm tra hệ thống phanh',
      items: ['Má phanh trước', 'Má phanh sau', 'Đĩa phanh trước', 'Đĩa phanh sau', 'Dầu phanh', 'Ống dầu phanh', 'Phanh tay'] },
    { stIdx: 13, type: InspectionTemplateType.INSPECTION, name: 'Kiểm tra hệ thống điện',
      items: ['Điện áp ắc quy', 'Máy phát điện', 'Hệ thống khởi động', 'Đèn pha', 'Đèn hậu', 'Đèn xi-nhan'] },
    // QC templates
    { stIdx: 0, type: InspectionTemplateType.QC, name: 'QC Thay dầu',
      items: ['Mức dầu đạt chuẩn', 'Không rò rỉ', 'Nắp dầu siết đúng mô-men'] },
    { stIdx: 9, type: InspectionTemplateType.QC, name: 'QC Thay má phanh',
      items: ['Má phanh lắp đúng chiều', 'Độ dày má phanh đạt', 'Thử phanh không kêu', 'Lực phanh đều 2 bên'] },
    { stIdx: 12, type: InspectionTemplateType.QC, name: 'QC Thay ắc quy',
      items: ['Điện áp ắc quy ≥ 12.4V', 'Cực ắc quy siết chặt', 'Khởi động thành công'] },
    { stIdx: 15, type: InspectionTemplateType.QC, name: 'QC Thay phuộc',
      items: ['Phuộc lắp đúng chiều', 'Không rò rỉ dầu', 'Kiểm tra độ êm', 'Bu-lông siết đúng mô-men'] },
    { stIdx: 17, type: InspectionTemplateType.QC, name: 'QC Sơn',
      items: ['Bề mặt phẳng đều', 'Màu sơn khớp', 'Không bọt khí', 'Lớp clear coat đạt', 'Viền khe đều'] },
  ];

  const inspTemplates: any[] = [];
  const inspTemplateItems: any[][] = [];
  for (const itd of inspTemplateData) {
    const it = await prisma.inspectionTemplate.create({
      data: {
        service_template_id: serviceTemplates[itd.stIdx].id,
        template_type: itd.type,
        name: itd.name,
      }
    });
    inspTemplates.push(it);

    const items: any[] = [];
    for (let j = 0; j < itd.items.length; j++) {
      items.push(await prisma.inspectionTemplateItem.create({
        data: { template_id: it.id, name: itd.items[j], sort_order: j + 1 }
      }));
    }
    inspTemplateItems.push(items);
  }
  console.log('   ✅ 10 InspectionTemplates + 60 Items');

  // 2.9 Suppliers
  const supplierData = [
    { name: 'Công ty TNHH Phụ tùng Toyota Việt Nam', contact: 'Nguyễn Thanh Tâm', phone: '02838123456' },
    { name: 'Đại lý Honda Parts Sài Gòn', contact: 'Trần Minh Hoàng', phone: '02838234567' },
    { name: 'Nhà phân phối Bosch Việt Nam', contact: 'Lê Quốc Dũng', phone: '02838345678' },
    { name: 'Công ty vật tư ô tô Hòa Bình', contact: 'Phạm Văn Tuấn', phone: '02838456789' },
    { name: 'Nhà cung cấp phụ tùng BMW chính hãng', contact: 'Võ Minh Khoa', phone: '02838567890' },
    { name: 'Công ty TNHH Dầu nhớt Shell', contact: 'Đặng Thị Hương', phone: '02838678901' },
    { name: 'Kho phụ tùng Đại Nam', contact: 'Bùi Văn Phú', phone: '02838789012' },
    { name: 'Nhà phân phối Denso Việt Nam', contact: 'Hoàng Minh Trí', phone: '02838890123' },
    { name: 'Công ty TNHH lốp xe Bridgestone', contact: 'Huỳnh Văn Bảo', phone: '02838901234' },
    { name: 'Kho vật tư ô tô Phú Mỹ', contact: 'Ngô Thị Lan', phone: '02838012345' },
  ];
  const suppliers: any[] = [];
  for (const sd of supplierData) {
    suppliers.push(await prisma.supplier.create({
      data: { name: sd.name, contact_person: sd.contact, phone: sd.phone, email: `lienhe@${sd.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)}.vn` }
    }));
  }
  console.log('   ✅ 10 Suppliers');

  // ==========================================
  // 3. USERS & EMPLOYEES
  // ==========================================
  console.log('\n👤 [3/10] Tạo Users & Employees...');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 3.1 Customers (30)
  const customers: any[] = [];
  for (let i = 0; i < 30; i++) {
    const name = CUSTOMER_NAMES[i];
    const emailName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\s+/g, '.').toLowerCase();
    customers.push(await prisma.user.create({
      data: {
        email: `${emailName}${i + 1}@gmail.com`,
        phone: uniquePhone(),
        password_hash: passwordHash,
        full_name: name,
        address: `${randomBetween(1, 500)} Đường ${randomFrom(['Nguyễn Huệ', 'Lê Lợi', 'Hai Bà Trưng', 'Trần Hưng Đạo', 'Cách Mạng Tháng 8', 'Điện Biên Phủ', 'Võ Văn Tần', 'Nam Kỳ Khởi Nghĩa', 'Pasteur', 'Lý Tự Trọng'])}, ${randomFrom(['Quận 1', 'Quận 3', 'Quận 7', 'Quận Bình Thạnh', 'Quận Tân Bình', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'TP. Thủ Đức'])}, TP.HCM`,
        roles: { create: { role_id: roleCustomer.id } }
      }
    }));
  }
  console.log('   ✅ 30 Customers');

  // 3.2 Staffs (20)
  const staffRoleMap: { roleObj: any; position: EmployeePosition }[] = [
    // 2 ADMIN
    { roleObj: roleAdmin, position: EmployeePosition.OTHER },
    { roleObj: roleAdmin, position: EmployeePosition.OTHER },
    // 2 MANAGER
    { roleObj: roleManager, position: EmployeePosition.OTHER },
    { roleObj: roleManager, position: EmployeePosition.OTHER },
    // 4 SA (Advisors)
    { roleObj: roleSA, position: EmployeePosition.ADVISOR },
    { roleObj: roleSA, position: EmployeePosition.ADVISOR },
    { roleObj: roleSA, position: EmployeePosition.ADVISOR },
    { roleObj: roleSA, position: EmployeePosition.ADVISOR },
    // 4 DESK_STAFF
    { roleObj: roleDeskStaff, position: EmployeePosition.OTHER },
    { roleObj: roleDeskStaff, position: EmployeePosition.OTHER },
    { roleObj: roleDeskStaff, position: EmployeePosition.OTHER },
    { roleObj: roleDeskStaff, position: EmployeePosition.OTHER },
    // 4 TECHNICIAN (no system role, just employee)
    { roleObj: roleDeskStaff, position: EmployeePosition.TECHNICIAN },
    { roleObj: roleDeskStaff, position: EmployeePosition.TECHNICIAN },
    { roleObj: roleDeskStaff, position: EmployeePosition.TECHNICIAN },
    { roleObj: roleDeskStaff, position: EmployeePosition.TECHNICIAN },
    // 2 QC_STAFF
    { roleObj: roleDeskStaff, position: EmployeePosition.QC_STAFF },
    { roleObj: roleDeskStaff, position: EmployeePosition.QC_STAFF },
    // 2 DETAILER
    { roleObj: roleDeskStaff, position: EmployeePosition.DETAILER },
    { roleObj: roleDeskStaff, position: EmployeePosition.DETAILER },
  ];

  const staffs: any[] = [];
  const rolePrefixes = ['admin', 'admin', 'manager', 'manager', 'advisor', 'advisor', 'advisor', 'advisor', 'desk', 'desk', 'desk', 'desk', 'tech', 'tech', 'tech', 'tech', 'qc', 'qc', 'detail', 'detail'];
  for (let i = 0; i < 20; i++) {
    const name = STAFF_NAMES[i];
    const { roleObj, position } = staffRoleMap[i];
    staffs.push(await prisma.user.create({
      data: {
        email: `${rolePrefixes[i]}${i + 1}@carservice.com`,
        phone: uniquePhone(),
        password_hash: passwordHash,
        full_name: name,
        roles: { create: { role_id: roleObj.id } },
        employee: { create: { full_name: name, position } }
      },
      include: { employee: true }
    }));
  }

  // Helper references
  const advisors = staffs.filter((_, i) => staffRoleMap[i].position === EmployeePosition.ADVISOR);
  const technicians = staffs.filter((_, i) => staffRoleMap[i].position === EmployeePosition.TECHNICIAN);
  const qcStaffs = staffs.filter((_, i) => staffRoleMap[i].position === EmployeePosition.QC_STAFF);
  console.log('   ✅ 20 Staff Users + Employees');

  // 3.3 EmployeeSkills
  let empSkillCount = 0;
  for (const staff of staffs) {
    if (!staff.employee) continue;
    const numSkills = randomBetween(2, 4);
    const skillIndices = new Set<number>();
    while (skillIndices.size < numSkills) skillIndices.add(randomBetween(0, skills.length - 1));
    for (const si of skillIndices) {
      await prisma.employeeSkill.create({ data: { employee_id: staff.employee.id, skill_id: skills[si].id } });
      empSkillCount++;
    }
  }
  console.log(`   ✅ ${empSkillCount} EmployeeSkills`);

  // ==========================================
  // 4. VEHICLES
  // ==========================================
  console.log('\n🚗 [4/10] Tạo Vehicles...');
  const vehicles: any[] = [];
  const sizeByModel: Record<string, VehicleSize> = {
    'Vios': VehicleSize.SMALL, 'City': VehicleSize.SMALL, 'Accent': VehicleSize.SMALL, 'Almera': VehicleSize.SMALL,
    'Camry': VehicleSize.MEDIUM, 'Civic': VehicleSize.MEDIUM, 'Seltos': VehicleSize.MEDIUM, 'C200': VehicleSize.MEDIUM,
    'Corolla Cross': VehicleSize.MEDIUM, '3 Series': VehicleSize.MEDIUM, 'HR-V': VehicleSize.MEDIUM, 'Creta': VehicleSize.MEDIUM, 'Territory': VehicleSize.MEDIUM,
    'Accord': VehicleSize.LARGE, 'E300': VehicleSize.LARGE, '5 Series': VehicleSize.LARGE, 'S-Class': VehicleSize.LARGE,
    'CR-V': VehicleSize.SUV, 'Tucson': VehicleSize.SUV, 'Santa Fe': VehicleSize.SUV, 'Fortuner': VehicleSize.SUV,
    'Sportage': VehicleSize.SUV, 'Everest': VehicleSize.SUV, 'GLC 200': VehicleSize.SUV, 'X3': VehicleSize.SUV,
    'X5': VehicleSize.SUV, 'X-Trail': VehicleSize.SUV, 'Sorento': VehicleSize.SUV, 'Carnival': VehicleSize.LARGE,
    'Innova': VehicleSize.LARGE, 'Land Cruiser': VehicleSize.SUV,
    'Ranger': VehicleSize.TRUCK, 'Navara': VehicleSize.TRUCK,
  };

  for (const cust of customers) {
    const numVehicles = randomBetween(1, 3);
    for (let j = 0; j < numVehicles; j++) {
      const makeData = randomFrom(VEHICLE_DATA);
      const modelData = randomFrom(makeData.models);
      const year = randomFrom(modelData.years);
      const size = sizeByModel[modelData.name] || VehicleSize.MEDIUM;

      vehicles.push(await prisma.vehicle.create({
        data: {
          customer_id: cust.id,
          license_plate: uniqueLicensePlate(),
          make: makeData.make,
          model: modelData.name,
          year,
          color: randomFrom(COLORS),
          vehicle_size: size,
        }
      }));
    }
  }
  console.log(`   ✅ ${vehicles.length} Vehicles`);

  // ==========================================
  // 5. INVENTORY
  // ==========================================
  console.log('\n📦 [5/10] Tạo Inventory...');

  // 5.1 InventoryItems (40)
  const itemData: { name: string; type: ItemType; uomIdx: number; selling: number; cost: number; onHand: number }[] = [
    // PART (20)
    { name: 'Lọc gió động cơ', type: ItemType.PART, uomIdx: 0, selling: 250000, cost: 150000, onHand: 80 },
    { name: 'Lọc dầu', type: ItemType.PART, uomIdx: 0, selling: 120000, cost: 70000, onHand: 120 },
    { name: 'Má phanh trước (bộ)', type: ItemType.PART, uomIdx: 1, selling: 800000, cost: 450000, onHand: 40 },
    { name: 'Má phanh sau (bộ)', type: ItemType.PART, uomIdx: 1, selling: 700000, cost: 400000, onHand: 35 },
    { name: 'Đĩa phanh trước', type: ItemType.PART, uomIdx: 0, selling: 1200000, cost: 750000, onHand: 20 },
    { name: 'Bugi Denso Iridium', type: ItemType.PART, uomIdx: 0, selling: 180000, cost: 100000, onHand: 200 },
    { name: 'Bô bin đánh lửa', type: ItemType.PART, uomIdx: 0, selling: 450000, cost: 280000, onHand: 30 },
    { name: 'Phuộc giảm xóc trước', type: ItemType.PART, uomIdx: 0, selling: 1800000, cost: 1100000, onHand: 15 },
    { name: 'Phuộc giảm xóc sau', type: ItemType.PART, uomIdx: 0, selling: 1600000, cost: 950000, onHand: 15 },
    { name: 'Bình ắc quy 12V 60Ah', type: ItemType.PART, uomIdx: 0, selling: 1800000, cost: 1200000, onHand: 25 },
    { name: 'Dây curoa cam', type: ItemType.PART, uomIdx: 0, selling: 350000, cost: 200000, onHand: 30 },
    { name: 'Bơm nước làm mát', type: ItemType.PART, uomIdx: 0, selling: 900000, cost: 550000, onHand: 10 },
    { name: 'Lọc gió điều hòa', type: ItemType.PART, uomIdx: 0, selling: 200000, cost: 100000, onHand: 80 },
    { name: 'Bầu lọc nhiên liệu', type: ItemType.PART, uomIdx: 0, selling: 300000, cost: 180000, onHand: 40 },
    { name: 'Rotuyn lái ngoài', type: ItemType.PART, uomIdx: 0, selling: 350000, cost: 200000, onHand: 20 },
    { name: 'Rotuyn lái trong', type: ItemType.PART, uomIdx: 0, selling: 300000, cost: 170000, onHand: 20 },
    { name: 'Cao su chân máy', type: ItemType.PART, uomIdx: 0, selling: 400000, cost: 250000, onHand: 15 },
    { name: 'Máy phát điện', type: ItemType.PART, uomIdx: 0, selling: 4500000, cost: 3000000, onHand: 5 },
    { name: 'Mô tơ nâng kính', type: ItemType.PART, uomIdx: 0, selling: 600000, cost: 380000, onHand: 8 },
    { name: 'Cần gạt mưa', type: ItemType.PART, uomIdx: 1, selling: 150000, cost: 80000, onHand: 60 },
    // CONSUMABLE (7)
    { name: 'Dầu máy 5W-30 (4L)', type: ItemType.CONSUMABLE, uomIdx: 5, selling: 450000, cost: 300000, onHand: 100 },
    { name: 'Dầu máy 5W-40 (4L)', type: ItemType.CONSUMABLE, uomIdx: 5, selling: 500000, cost: 330000, onHand: 80 },
    { name: 'Dầu hộp số ATF (1L)', type: ItemType.CONSUMABLE, uomIdx: 6, selling: 200000, cost: 130000, onHand: 60 },
    { name: 'Dầu phanh DOT4 (500ml)', type: ItemType.CONSUMABLE, uomIdx: 6, selling: 120000, cost: 70000, onHand: 50 },
    { name: 'Nước làm mát (5L)', type: ItemType.CONSUMABLE, uomIdx: 6, selling: 150000, cost: 90000, onHand: 40 },
    { name: 'Mỡ bôi trơn (1Kg)', type: ItemType.CONSUMABLE, uomIdx: 5, selling: 80000, cost: 50000, onHand: 30 },
    { name: 'Dung dịch rửa kính (1L)', type: ItemType.CONSUMABLE, uomIdx: 6, selling: 50000, cost: 25000, onHand: 50 },
    // CHEMICAL (5)
    { name: 'Dung dịch tẩy rửa động cơ', type: ItemType.CHEMICAL, uomIdx: 6, selling: 180000, cost: 100000, onHand: 20 },
    { name: 'Chất vệ sinh kim phun', type: ItemType.CHEMICAL, uomIdx: 6, selling: 250000, cost: 150000, onHand: 15 },
    { name: 'Sơn lót chống gỉ', type: ItemType.CHEMICAL, uomIdx: 6, selling: 350000, cost: 220000, onHand: 10 },
    { name: 'Keo dán kính', type: ItemType.CHEMICAL, uomIdx: 7, selling: 200000, cost: 120000, onHand: 12 },
    { name: 'Chất bảo vệ sơn', type: ItemType.CHEMICAL, uomIdx: 6, selling: 400000, cost: 250000, onHand: 8 },
    // ACCESSORY (8)
    { name: 'Bóng đèn pha H4', type: ItemType.ACCESSORY, uomIdx: 0, selling: 100000, cost: 50000, onHand: 40 },
    { name: 'Bóng đèn pha LED', type: ItemType.ACCESSORY, uomIdx: 0, selling: 500000, cost: 300000, onHand: 20 },
    { name: 'Gương chiếu hậu trái', type: ItemType.ACCESSORY, uomIdx: 0, selling: 800000, cost: 500000, onHand: 5 },
    { name: 'Gương chiếu hậu phải', type: ItemType.ACCESSORY, uomIdx: 0, selling: 800000, cost: 500000, onHand: 5 },
    { name: 'Tấm che nắng', type: ItemType.ACCESSORY, uomIdx: 0, selling: 200000, cost: 100000, onHand: 15 },
    { name: 'Thảm lót sàn (bộ)', type: ItemType.ACCESSORY, uomIdx: 1, selling: 350000, cost: 200000, onHand: 20 },
    { name: 'Bọc vô lăng da', type: ItemType.ACCESSORY, uomIdx: 0, selling: 250000, cost: 130000, onHand: 25 },
    { name: 'Nước hoa ô tô', type: ItemType.ACCESSORY, uomIdx: 0, selling: 150000, cost: 70000, onHand: 50 },
  ];

  const inventoryItems: any[] = [];
  for (let i = 0; i < itemData.length; i++) {
    const d = itemData[i];
    inventoryItems.push(await prisma.inventoryItem.create({
      data: {
        sku: `VT-${String(i + 1).padStart(3, '0')}`,
        name: d.name,
        item_type: d.type,
        uom_id: catalogs.uom[d.uomIdx].id,
        selling_price: d.selling,
        average_cost: d.cost,
        on_hand: d.onHand,
        reorder_level: Math.round(d.onHand * 0.2),
      }
    }));
  }
  console.log(`   ✅ ${inventoryItems.length} InventoryItems`);

  // JobTemplateParts (liên kết job template với vật tư)
  const jtpMappings: { jtIdx: number; itemIdx: number; qty: number }[] = [
    { jtIdx: 0, itemIdx: 20, qty: 1 }, // Thay dầu -> Dầu máy
    { jtIdx: 1, itemIdx: 1, qty: 1 },  // Thay lọc dầu -> Lọc dầu
    { jtIdx: 2, itemIdx: 0, qty: 1 },  // Bảo dưỡng 10K -> Lọc gió
    { jtIdx: 2, itemIdx: 1, qty: 1 },  // Bảo dưỡng 10K -> Lọc dầu
    { jtIdx: 2, itemIdx: 20, qty: 1 }, // Bảo dưỡng 10K -> Dầu máy
    { jtIdx: 5, itemIdx: 11, qty: 1 }, // Thay bơm nước -> Bơm nước
    { jtIdx: 6, itemIdx: 5, qty: 4 },  // Thay bugi -> Bugi (4 cái)
    { jtIdx: 7, itemIdx: 6, qty: 4 },  // Thay bô bin -> Bô bin
    { jtIdx: 9, itemIdx: 10, qty: 1 }, // Thay dây đai cam -> Dây curoa cam
    { jtIdx: 10, itemIdx: 22, qty: 4 },// Thay dầu hộp số -> Dầu hộp số ATF
    { jtIdx: 13, itemIdx: 2, qty: 1 }, // Thay má phanh trước -> Má phanh trước
    { jtIdx: 14, itemIdx: 4, qty: 2 }, // Thay đĩa phanh -> Đĩa phanh
    { jtIdx: 16, itemIdx: 23, qty: 1 },// Xả dầu phanh -> Dầu phanh
    { jtIdx: 18, itemIdx: 9, qty: 1 }, // Thay ắc quy -> Bình ắc quy
    { jtIdx: 20, itemIdx: 17, qty: 1 },// Thay máy phát -> Máy phát
    { jtIdx: 21, itemIdx: 7, qty: 2 }, // Thay phuộc trước -> Phuộc trước
    { jtIdx: 22, itemIdx: 8, qty: 2 }, // Thay phuộc sau -> Phuộc sau
  ];
  for (const m of jtpMappings) {
    await prisma.jobTemplatePart.create({
      data: { job_template_id: jobTemplates[m.jtIdx].id, item_id: inventoryItems[m.itemIdx].id, default_quantity: m.qty }
    });
  }
  console.log(`   ✅ ${jtpMappings.length} JobTemplateParts`);

  // 5.2 GoodsReceipts + Items + StockMovements
  let grCount = 0;
  let smCount = 0;
  for (let i = 0; i < 15; i++) {
    const gr = await prisma.goodsReceipt.create({
      data: {
        receipt_number: `GR-${String(i + 1).padStart(4, '0')}`,
        supplier_id: suppliers[i % suppliers.length].id,
        receipt_type: i === 0 ? ReceiptType.OPENING_STOCK : ReceiptType.PURCHASE,
        received_date: randomDate(60, 5),
        notes: `Phiếu nhập kho số ${i + 1}`,
        created_by_id: staffs[0].id,
      }
    });
    grCount++;

    // Each receipt has 2-4 items
    const numItems = randomBetween(2, 4);
    const usedItemIds = new Set<number>();
    for (let j = 0; j < numItems; j++) {
      let itemIdx: number;
      do { itemIdx = randomBetween(0, inventoryItems.length - 1); } while (usedItemIds.has(itemIdx));
      usedItemIds.add(itemIdx);

      const qty = randomBetween(10, 50);
      const unitCost = itemData[itemIdx].cost;

      await prisma.goodsReceiptItem.create({
        data: { receipt_id: gr.id, item_id: inventoryItems[itemIdx].id, quantity: qty, unit_cost: unitCost }
      });

      await prisma.stockMovement.create({
        data: {
          item_id: inventoryItems[itemIdx].id,
          movement_type: i === 0 ? MovementType.OPENING : MovementType.RECEIPT,
          reference_type: ReferenceType.GOODS_RECEIPT,
          reference_id: gr.id,
          quantity: qty,
          unit_cost: unitCost,
          balance_after: itemData[itemIdx].onHand + qty,
          created_by_id: staffs[0].id,
        }
      });
      smCount++;
    }
  }
  console.log(`   ✅ ${grCount} GoodsReceipts + ${smCount} StockMovements`);

  // 5.4 StockAdjustments
  for (let i = 0; i < 10; i++) {
    const statuses = [AdjustmentStatus.APPROVED, AdjustmentStatus.APPROVED, AdjustmentStatus.PENDING, AdjustmentStatus.REJECTED];
    const st = randomFrom(statuses);
    await prisma.stockAdjustment.create({
      data: {
        item_id: inventoryItems[randomBetween(0, inventoryItems.length - 1)].id,
        adjustment_quantity: randomBetween(-5, -1),
        reason: randomFrom(['Hàng hỏng trong kho', 'Kiểm kê chênh lệch', 'Hết hạn sử dụng', 'Mất mát', 'Sai số lượng nhập']),
        status: st,
        requested_by_id: staffs[randomBetween(8, 11)].id,
        approved_by_id: st !== AdjustmentStatus.PENDING ? staffs[randomBetween(2, 3)].id : null,
        approved_at: st !== AdjustmentStatus.PENDING ? new Date() : null,
        reject_reason: st === AdjustmentStatus.REJECTED ? 'Cần kiểm tra lại số lượng' : null,
      }
    });
  }
  console.log('   ✅ 10 StockAdjustments');

  // ==========================================
  // 6. APPOINTMENTS
  // ==========================================
  console.log('\n📅 [6/10] Tạo Appointments...');

  const appointmentStatuses: { status: AppointmentStatus; count: number }[] = [
    { status: AppointmentStatus.REQUESTED, count: 10 },
    { status: AppointmentStatus.CONFIRMED, count: 12 },
    { status: AppointmentStatus.RESCHEDULED, count: 5 },
    { status: AppointmentStatus.ARRIVED, count: 8 },
    { status: AppointmentStatus.CANCELLED, count: 5 },
  ];

  const cancelReasons = ['Khách đổi ý', 'Bận công việc', 'Chuyển xưởng khác', 'Tự sửa được rồi', 'Không liên lạc được'];
  const appointmentNotes = [
    'Khách yêu cầu làm nhanh', 'Lần đầu đến xưởng', 'Khách VIP - ưu tiên', 'Xe đang bị kêu phanh',
    'Cần kiểm tra tổng quát', 'Đặt lịch bảo dưỡng định kỳ', 'Xe mới mua, cần kiểm tra', 'Khách muốn chờ lấy xe trong ngày',
    null, null, null, null, // Some without notes
  ];

  const appointments: any[] = [];
  let apptIdx = 0;
  for (const { status, count } of appointmentStatuses) {
    for (let i = 0; i < count; i++) {
      const cust = customers[apptIdx % customers.length];
      const custVehicles = vehicles.filter(v => v.customer_id === cust.id);
      const veh = custVehicles.length > 0 ? randomFrom(custVehicles) : vehicles[apptIdx % vehicles.length];
      const adv = randomFrom(advisors);

      const scheduledDate = status === AppointmentStatus.ARRIVED
        ? randomDate(14, 0) // past 2 weeks
        : status === AppointmentStatus.CANCELLED
          ? randomDate(14, 0)
          : futureDate(randomBetween(1, 14)); // future

      const hours = randomBetween(7, 16);
      const scheduledTime = new Date(Date.UTC(1970, 0, 1, hours - 7, randomFrom([0, 30]))); // VN time -> UTC

      const appt = await prisma.appointment.create({
        data: {
          customer_id: cust.id,
          vehicle_id: veh.id,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          status,
          cancel_reason: status === AppointmentStatus.CANCELLED ? randomFrom(cancelReasons) : null,
          notes: randomFrom(appointmentNotes),
          created_by_id: randomFrom([adv.id, null]),
        }
      });
      appointments.push(appt);

      // AppointmentServices (1-3 per appointment)
      const numServices = randomBetween(1, 3);
      const usedServiceIds = new Set<number>();
      for (let s = 0; s < numServices; s++) {
        let stIdx: number;
        do { stIdx = randomBetween(0, serviceTemplates.length - 1); } while (usedServiceIds.has(stIdx));
        usedServiceIds.add(stIdx);
        await prisma.appointmentService.create({
          data: { appointment_id: appt.id, service_template_id: serviceTemplates[stIdx].id }
        });
      }
      apptIdx++;
    }
  }
  console.log(`   ✅ ${appointments.length} Appointments + Services`);

  // ==========================================
  // 7. INTAKE RECORDS
  // ==========================================
  console.log('\n📝 [7/10] Tạo IntakeRecords...');

  const intakeData: { status: IntakeStatus; type: IntakeType; count: number }[] = [
    { status: IntakeStatus.QUEUED, type: IntakeType.WALK_IN, count: 3 },
    { status: IntakeStatus.QUEUED, type: IntakeType.TOW_IN, count: 2 },
    { status: IntakeStatus.QUEUED, type: IntakeType.APPOINTMENT, count: 1 },
    { status: IntakeStatus.CONVERTED, type: IntakeType.WALK_IN, count: 8 },
    { status: IntakeStatus.CONVERTED, type: IntakeType.APPOINTMENT, count: 5 },
    { status: IntakeStatus.CONVERTED, type: IntakeType.TOW_IN, count: 2 },
    { status: IntakeStatus.CANCELLED, type: IntakeType.WALK_IN, count: 3 },
    { status: IntakeStatus.CANCELLED, type: IntakeType.TOW_IN, count: 1 },
  ];

  const intakeRecords: any[] = [];
  let intakeIdx = 0;
  for (const { status, type, count } of intakeData) {
    for (let i = 0; i < count; i++) {
      const cust = customers[(intakeIdx + 5) % customers.length];
      const custVehicles = vehicles.filter(v => v.customer_id === cust.id);
      const veh = custVehicles.length > 0 ? randomFrom(custVehicles) : vehicles[intakeIdx % vehicles.length];
      const adv = randomFrom(advisors);

      const arrivedAt = status === IntakeStatus.QUEUED
        ? new Date(Date.now() - randomBetween(5, 60) * 60000) // within last hour
        : randomDate(30, 1);

      const ir = await prisma.intakeRecord.create({
        data: {
          customer_id: cust.id,
          vehicle_id: veh.id,
          intake_type: type,
          status,
          arrived_at: arrivedAt,
          tow_company: type === IntakeType.TOW_IN ? randomFrom(['Cứu hộ Sài Gòn', 'Cứu hộ 24h', 'Dịch vụ kéo xe Thành Phát']) : null,
          notes: randomFrom([null, 'Xe không nổ máy', 'Khách báo xe bị rung', 'Đang có tiếng kêu lạ', 'Khách muốn kiểm tra tổng quát']),
          created_by_id: adv.id,
        }
      });
      intakeRecords.push(ir);

      // IntakeServices
      const numServices = randomBetween(1, 2);
      const usedSvcIds = new Set<number>();
      for (let s = 0; s < numServices; s++) {
        let stIdx: number;
        do { stIdx = randomBetween(0, serviceTemplates.length - 1); } while (usedSvcIds.has(stIdx));
        usedSvcIds.add(stIdx);
        await prisma.intakeService.create({
          data: { intake_id: ir.id, service_template_id: serviceTemplates[stIdx].id }
        });
      }
      intakeIdx++;
    }
  }
  console.log(`   ✅ ${intakeRecords.length} IntakeRecords + Services`);

  // ==========================================
  // 8. FULL OPERATIONS FLOW (20 Work Orders)
  // ==========================================
  console.log('\n🔧 [8/10] Tạo Work Orders (full lifecycle)...');

  // WO status distribution
  const woStatuses: { status: WorkOrderStatus; count: number }[] = [
    { status: WorkOrderStatus.DRAFT, count: 2 },
    { status: WorkOrderStatus.IN_PLANNING, count: 2 },
    { status: WorkOrderStatus.PENDING_APPROVAL, count: 2 },
    { status: WorkOrderStatus.APPROVED, count: 2 },
    { status: WorkOrderStatus.IN_PROGRESS, count: 4 },
    { status: WorkOrderStatus.BILLING_REQUESTED, count: 2 },
    { status: WorkOrderStatus.FINANCIAL_CLEARED, count: 2 },
    { status: WorkOrderStatus.CLOSED, count: 4 },
  ];

  // Get CONVERTED intakes for WO linking
  const convertedIntakes = intakeRecords.filter(ir => ir.status === IntakeStatus.CONVERTED);
  const arrivedAppointments = appointments.filter(a => a.status === AppointmentStatus.ARRIVED);

  let woIndex = 0;
  let totalJobs = 0;
  let totalQuo = 0;
  let totalInv = 0;
  let totalPay = 0;
  let totalRelease = 0;

  for (const { status: woStatus, count } of woStatuses) {
    for (let i = 0; i < count; i++) {
      const custIdx = (woIndex * 3 + 2) % customers.length;
      const cust = customers[custIdx];
      const custVehicles = vehicles.filter(v => v.customer_id === cust.id);
      const veh = custVehicles.length > 0 ? custVehicles[0] : vehicles[woIndex % vehicles.length];
      const adv = advisors[woIndex % advisors.length];
      const tech = technicians[woIndex % technicians.length];
      const qc = qcStaffs[woIndex % qcStaffs.length];

      // Link to intake or appointment
      const linkedIntake = woIndex < convertedIntakes.length ? convertedIntakes[woIndex] : null;
      const linkedAppt = !linkedIntake && woIndex < arrivedAppointments.length ? arrivedAppointments[woIndex] : null;

      const sourceType = linkedAppt
        ? WorkOrderSourceType.APPOINTMENT
        : linkedIntake?.intake_type === IntakeType.TOW_IN
          ? WorkOrderSourceType.TOW_IN
          : WorkOrderSourceType.WALK_IN;

      const wo = await prisma.workOrder.create({
        data: {
          wo_number: `WO-${String(woIndex + 1).padStart(4, '0')}`,
          customer_id: cust.id,
          vehicle_id: veh.id,
          advisor_id: adv.id,
          source_type: sourceType,
          appointment_id: linkedAppt?.id || null,
          intake_record_id: linkedIntake?.id || null,
          status: woStatus,
          created_by_id: adv.id,
          created_at: randomDate(30, 1),
        }
      });

      // ---- CHECKIN (all except DRAFT) ----
      if (woStatus !== WorkOrderStatus.DRAFT) {
        await prisma.checkIn.create({
          data: {
            work_order_id: wo.id,
            mileage: randomBetween(5000, 150000),
            fuel_level: randomFrom([FuelLevel.EMPTY, FuelLevel.QUARTER, FuelLevel.HALF, FuelLevel.THREE_QUARTER, FuelLevel.FULL]),
            complaint: randomFrom(COMPLAINTS),
            belongings: randomFrom([null, 'Túi xách trên ghế sau', 'Laptop trong cốp', 'Không có', 'Ô dù và áo mưa']),
            exterior_condition: randomFrom(['Bình thường', 'Có xước nhẹ cánh cửa trái', 'Trầy xước ba-đờ-xốc trước', 'Móp nhẹ nắp ca-pô', 'Tốt, không hư hại']),
            status: CheckInStatus.CONFIRMED,
            evidence_urls: [DEFAULT_IMAGE],
            created_by_id: adv.id,
            confirmed_by_customer_id: cust.id,
            confirmed_at: new Date(),
          }
        });
      }

      // ---- WO SERVICES ----
      const numWoServices = randomBetween(1, 3);
      const woServices: any[] = [];
      const usedWoServiceIds = new Set<number>();
      for (let s = 0; s < numWoServices; s++) {
        let stIdx: number;
        do { stIdx = randomBetween(0, serviceTemplates.length - 1); } while (usedWoServiceIds.has(stIdx));
        usedWoServiceIds.add(stIdx);

        const svcStatus = woStatus === WorkOrderStatus.DRAFT || woStatus === WorkOrderStatus.IN_PLANNING
          ? ServiceStatus.PENDING
          : woStatus === WorkOrderStatus.IN_PROGRESS
            ? (s === 0 ? ServiceStatus.IN_PROGRESS : ServiceStatus.PENDING)
            : ServiceStatus.COMPLETED;

        const wos = await prisma.woService.create({
          data: {
            work_order_id: wo.id,
            service_template_id: serviceTemplates[stIdx].id,
            name: serviceData[stIdx].name,
            pricing_type: serviceData[stIdx].pricingType,
            status: svcStatus,
            sort_order: s + 1,
          }
        });
        woServices.push({ wos, stIdx });
      }

      // ---- JOBS (for IN_PLANNING and beyond) ----
      const allJobs: any[] = [];
      if (woStatus !== WorkOrderStatus.DRAFT) {
        for (const { wos, stIdx } of woServices) {
          // Find matching job templates
          const matchingJTs = jobTemplateData
            .map((jtd, idx) => ({ ...jtd, idx }))
            .filter(jtd => jtd.stIdx === stIdx)
            .slice(0, 2);

          if (matchingJTs.length === 0) {
            // Fallback: create a generic job
            matchingJTs.push({ jtIdx: 7, stIdx, name: `Công việc cho ${serviceData[stIdx].name}`, hours: 1.5, idx: -1 });
          }

          for (const mjt of matchingJTs) {
            let jobStatus: JobStatus;
            if (woStatus === WorkOrderStatus.IN_PROGRESS) {
              jobStatus = randomFrom([JobStatus.IN_PROGRESS, JobStatus.PLANNED, JobStatus.COMPLETED]);
            } else if (([WorkOrderStatus.BILLING_REQUESTED, WorkOrderStatus.FINANCIAL_CLEARED, WorkOrderStatus.CLOSED] as WorkOrderStatus[]).includes(woStatus)) {
              jobStatus = JobStatus.PASSED;
            } else if (woStatus === WorkOrderStatus.PENDING_APPROVAL || woStatus === WorkOrderStatus.APPROVED) {
              jobStatus = JobStatus.COMPLETED;
            } else {
              jobStatus = JobStatus.PLANNED;
            }

            const job = await prisma.job.create({
              data: {
                wo_service_id: wos.id,
                job_type_id: jobTypes[mjt.jtIdx].id,
                job_template_id: mjt.idx >= 0 ? jobTemplates[mjt.idx].id : null,
                name: mjt.name,
                estimated_hours: mjt.hours,
                actual_hours: (jobStatus === JobStatus.COMPLETED || jobStatus === JobStatus.PASSED) ? mjt.hours + (Math.random() - 0.5) : null,
                status: jobStatus,
                result_notes: (jobStatus === JobStatus.COMPLETED || jobStatus === JobStatus.PASSED) ? 'Đã hoàn thành theo quy trình' : null,
                created_by_id: tech.id,
                started_at: jobStatus !== JobStatus.PLANNED ? randomDate(10, 2) : null,
                completed_at: (jobStatus === JobStatus.COMPLETED || jobStatus === JobStatus.PASSED) ? randomDate(2, 0) : null,
              }
            });
            allJobs.push(job);
            totalJobs++;

            // JobLabour
            await prisma.jobLabour.create({
              data: {
                job_id: job.id,
                job_type_id: jobTypes[mjt.jtIdx].id,
                employee_id: tech.employee?.id,
                description: `Thợ thực hiện: ${mjt.name}`,
                estimated_hours: mjt.hours,
                billable_hours: (jobStatus === JobStatus.COMPLETED || jobStatus === JobStatus.PASSED) ? mjt.hours : null,
                hourly_rate: jobTypeData[mjt.jtIdx].rate,
              }
            });

            // JobPart (50% chance)
            if (Math.random() > 0.4) {
              const partIdx = randomBetween(0, 19); // Only PART type items
              await prisma.jobPart.create({
                data: {
                  job_id: job.id,
                  item_id: inventoryItems[partIdx].id,
                  status: (jobStatus === JobStatus.COMPLETED || jobStatus === JobStatus.PASSED)
                    ? PartAllocationStatus.USED
                    : jobStatus === JobStatus.IN_PROGRESS
                      ? PartAllocationStatus.ISSUED
                      : PartAllocationStatus.PLANNED,
                  planned_quantity: randomBetween(1, 4),
                  issued_quantity: jobStatus !== JobStatus.PLANNED ? randomBetween(1, 4) : 0,
                  unit_price: itemData[partIdx].selling,
                }
              });
            }
          }
        }
      }

      // ---- INSPECTIONS (IN_PLANNING and beyond) ----
      if (woStatus !== WorkOrderStatus.DRAFT && woStatus !== WorkOrderStatus.IN_PLANNING) {
        for (let si = 0; si < Math.min(woServices.length, 2); si++) {
          const { wos } = woServices[si];
          // Find matching inspection template
          const matchingIT = inspTemplates.find((_, idx) =>
            inspTemplateData[idx].type === InspectionTemplateType.INSPECTION &&
            inspTemplateData[idx].stIdx < serviceTemplates.length
          );

          if (matchingIT) {
            const matchIdx = inspTemplates.indexOf(matchingIT);
            const insp = await prisma.inspection.create({
              data: {
                work_order_id: wo.id,
                wo_service_id: wos.id,
                template_id: matchingIT.id,
                status: InspectionStatus.COMPLETED,
                created_by_id: tech.id,
              }
            });

            // InspectionResults
            for (const item of inspTemplateItems[matchIdx]) {
              await prisma.inspectionResult.create({
                data: {
                  inspection_id: insp.id,
                  template_item_id: item.id,
                  item_name: item.name,
                  result: randomFrom([InspectionResultValue.PASS, InspectionResultValue.PASS, InspectionResultValue.PASS, InspectionResultValue.FAIL, InspectionResultValue.MONITOR]),
                  notes: Math.random() > 0.7 ? 'Cần theo dõi thêm' : null,
                }
              });
            }

            // Findings (1-2 per inspection)
            const numFindings = randomBetween(1, 2);
            for (let fi = 0; fi < numFindings; fi++) {
              const finding = await prisma.finding.create({
                data: {
                  inspection_id: insp.id,
                  status: allJobs.length > 0 ? FindingStatus.LINKED_TO_JOB : FindingStatus.NEW,
                  description: randomFrom(COMPLAINTS),
                  severity: randomFrom([Severity.LOW, Severity.MEDIUM, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL]),
                  recommendation: randomFrom(DIAGNOSES),
                  evidence_urls: [DEFAULT_IMAGE],
                  marker_type: randomFrom([MarkerType.DAMAGE, MarkerType.SCRATCH, MarkerType.DENT, MarkerType.RUST, MarkerType.OTHER]),
                  created_by_id: tech.id,
                }
              });

              // Link finding to job
              if (allJobs.length > 0) {
                await prisma.jobFinding.create({
                  data: { job_id: allJobs[fi % allJobs.length].id, finding_id: finding.id }
                });
              }
            }
          }
        }
      }

      // ---- QC RECORDS (IN_PROGRESS and beyond) ----
      if (([WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.BILLING_REQUESTED, WorkOrderStatus.FINANCIAL_CLEARED, WorkOrderStatus.CLOSED, WorkOrderStatus.RELEASED] as WorkOrderStatus[]).includes(woStatus)) {
        for (const { wos } of woServices) {
          const qcResult = woStatus === WorkOrderStatus.IN_PROGRESS ? randomFrom([QcResult.PASS, QcResult.FAIL]) : QcResult.PASS;
          const qcr = await prisma.qcRecord.create({
            data: {
              wo_service_id: wos.id,
              overall_result: qcResult,
              notes: qcResult === QcResult.FAIL ? 'Cần kiểm tra và sửa lại' : 'Đạt yêu cầu chất lượng',
              inspector_id: qc.id,
            }
          });

          // QcItems
          const qcItemNames = ['Kiểm tra chức năng', 'Kiểm tra ngoại quan', 'Kiểm tra an toàn', 'Kiểm tra rò rỉ'];
          for (const qcItemName of qcItemNames.slice(0, randomBetween(2, 4))) {
            await prisma.qcItem.create({
              data: {
                qc_record_id: qcr.id,
                item_name: qcItemName,
                result: qcResult === QcResult.FAIL && qcItemName === 'Kiểm tra chức năng' ? QcResult.FAIL : QcResult.PASS,
                notes: null,
              }
            });
          }
        }
      }

      // ---- QUOTATIONS (PENDING_APPROVAL and beyond) ----
      if (([WorkOrderStatus.PENDING_APPROVAL, WorkOrderStatus.APPROVED, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.BILLING_REQUESTED, WorkOrderStatus.FINANCIAL_CLEARED, WorkOrderStatus.CLOSED, WorkOrderStatus.RELEASED] as WorkOrderStatus[]).includes(woStatus)) {
        const quoStatus = woStatus === WorkOrderStatus.PENDING_APPROVAL
          ? QuotationStatus.SENT
          : QuotationStatus.APPROVED;

        let subtotal = 0;
        const quoLines: { wo_service_id: number; line_type: LineType; description: string; quantity: number; price: number }[] = [];

        for (const { wos, stIdx } of woServices) {
          // PACKAGE line
          const price = serviceData[stIdx].basePrice;
          subtotal += price;
          quoLines.push({
            wo_service_id: wos.id,
            line_type: LineType.PACKAGE,
            description: serviceData[stIdx].name,
            quantity: 1,
            price,
          });
        }

        const taxRate = 0.1;
        const taxAmount = Math.round(subtotal * taxRate);
        const grandTotal = subtotal + taxAmount;

        const quo = await prisma.quotation.create({
          data: {
            work_order_id: wo.id,
            quotation_number: `QUO-${String(woIndex + 1).padStart(4, '0')}`,
            quotation_type: QuotationType.PRIMARY,
            status: quoStatus,
            subtotal,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            grand_total: grandTotal,
            sent_at: new Date(),
            approved_at: quoStatus === QuotationStatus.APPROVED ? new Date() : null,
            approved_by_id: quoStatus === QuotationStatus.APPROVED ? cust.id : null,
            created_by_id: adv.id,
            lines: {
              create: quoLines.map((ql, idx) => ({
                wo_service_id: ql.wo_service_id,
                line_type: ql.line_type,
                description: ql.description,
                quantity: ql.quantity,
                snapshot_unit_price: ql.price,
                amount: ql.price * ql.quantity,
                sort_order: idx + 1,
              }))
            }
          }
        });
        totalQuo++;
      }

      // ---- INVOICES (BILLING_REQUESTED and beyond) ----
      if (([WorkOrderStatus.BILLING_REQUESTED, WorkOrderStatus.FINANCIAL_CLEARED, WorkOrderStatus.CLOSED, WorkOrderStatus.RELEASED] as WorkOrderStatus[]).includes(woStatus)) {
        let invSubtotal = 0;
        const invLines: { line_type: LineType; description: string; quantity: number; unit_price: number }[] = [];

        for (const { wos, stIdx } of woServices) {
          const price = serviceData[stIdx].basePrice;
          invSubtotal += price;
          invLines.push({
            line_type: LineType.PACKAGE,
            description: serviceData[stIdx].name,
            quantity: 1,
            unit_price: price,
          });
        }

        const taxAmt = Math.round(invSubtotal * 0.1);
        const totalAmt = invSubtotal + taxAmt;
        const isPaid = ([WorkOrderStatus.FINANCIAL_CLEARED, WorkOrderStatus.CLOSED, WorkOrderStatus.RELEASED] as WorkOrderStatus[]).includes(woStatus);

        const invStatus = isPaid ? InvoiceStatus.PAID : InvoiceStatus.ISSUED;
        const inv = await prisma.invoice.create({
          data: {
            work_order_id: wo.id,
            invoice_number: `INV-${String(woIndex + 1).padStart(4, '0')}`,
            status: invStatus,
            subtotal: invSubtotal,
            tax_amount: taxAmt,
            total_amount: totalAmt,
            amount_due: isPaid ? 0 : totalAmt,
            issued_at: new Date(),
            created_by_id: adv.id,
            lines: {
              create: invLines.map((il, idx) => ({
                line_type: il.line_type,
                description: il.description,
                quantity: il.quantity,
                unit_price: il.unit_price,
                amount: il.unit_price * il.quantity,
                sort_order: idx + 1,
              }))
            }
          }
        });
        totalInv++;

        // ---- PAYMENTS ----
        if (isPaid) {
          await prisma.payment.create({
            data: {
              invoice_id: inv.id,
              payment_method: randomFrom([PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.QR_TRANSFER]),
              amount: totalAmt,
              transaction_ref: `TXN-${String(woIndex + 1).padStart(4, '0')}-${Date.now()}`,
              status: PaymentStatus.SUCCESS,
              paid_at: new Date(),
              received_by_id: staffs[randomBetween(8, 11)].id,
            }
          });
          totalPay++;
        }
      }

      // ---- VEHICLE RELEASE (CLOSED) ----
      if (woStatus === WorkOrderStatus.CLOSED) {
        await prisma.vehicleRelease.create({
          data: {
            work_order_id: wo.id,
            release_notes: randomFrom(['Xe đã sửa xong, bàn giao khách', 'Hoàn tất tất cả dịch vụ', 'Khách hài lòng, nhận xe']),
            released_by_id: adv.id,
            released_at: new Date(),
            confirmed_by_customer_id: cust.id,
            confirmed_at: new Date(),
          }
        });
        totalRelease++;
      }

      woIndex++;
    }
  }
  console.log(`   ✅ ${woIndex} WorkOrders`);
  console.log(`   ✅ ${totalJobs} Jobs + Labours + Parts`);
  console.log(`   ✅ ${totalQuo} Quotations`);
  console.log(`   ✅ ${totalInv} Invoices`);
  console.log(`   ✅ ${totalPay} Payments`);
  console.log(`   ✅ ${totalRelease} VehicleReleases`);

  // ==========================================
  // 9. NOTIFICATIONS
  // ==========================================
  console.log('\n🔔 [9/10] Tạo Notifications...');

  const notifData: { type: NotificationType; title: string; message: string }[] = [
    { type: NotificationType.APPOINTMENT_CONFIRMED, title: 'Lịch hẹn đã xác nhận', message: 'Lịch hẹn của bạn đã được xác nhận. Vui lòng đến đúng giờ.' },
    { type: NotificationType.APPOINTMENT_CANCELLED, title: 'Lịch hẹn đã hủy', message: 'Lịch hẹn của bạn đã bị hủy. Liên hệ xưởng để biết thêm chi tiết.' },
    { type: NotificationType.CHECKIN_READY, title: 'Sẵn sàng tiếp nhận', message: 'Xe của bạn đã sẵn sàng để tiếp nhận. Vui lòng xác nhận biên bản.' },
    { type: NotificationType.QUOTATION_SENT, title: 'Báo giá đã gửi', message: 'Báo giá sửa chữa đã được gửi. Vui lòng xem và phê duyệt.' },
    { type: NotificationType.QUOTATION_APPROVED, title: 'Báo giá đã duyệt', message: 'Khách hàng đã phê duyệt báo giá. Bắt đầu thực hiện sửa chữa.' },
    { type: NotificationType.QUOTATION_REJECTED, title: 'Báo giá bị từ chối', message: 'Khách hàng đã từ chối báo giá. Cần trao đổi lại.' },
    { type: NotificationType.INVOICE_ISSUED, title: 'Hóa đơn đã xuất', message: 'Hóa đơn sửa chữa đã được xuất. Vui lòng thanh toán.' },
    { type: NotificationType.PAYMENT_SUCCESS, title: 'Thanh toán thành công', message: 'Thanh toán đã được ghi nhận. Cảm ơn quý khách.' },
    { type: NotificationType.VEHICLE_READY, title: 'Xe đã sẵn sàng bàn giao', message: 'Xe của bạn đã sửa xong. Vui lòng đến nhận xe.' },
    { type: NotificationType.BILLING_REQUEST, title: 'Yêu cầu thanh toán', message: 'Có yêu cầu thanh toán mới cần xử lý.' },
    { type: NotificationType.GENERAL, title: 'Chào mừng đến Car Service Center', message: 'Chào mừng bạn đến với hệ thống quản lý dịch vụ ô tô.' },
  ];

  let notifCount = 0;
  for (let i = 0; i < 50; i++) {
    const nd = notifData[i % notifData.length];
    const isStaffNotif = ([NotificationType.QUOTATION_APPROVED, NotificationType.QUOTATION_REJECTED, NotificationType.BILLING_REQUEST] as NotificationType[]).includes(nd.type);
    const userId = isStaffNotif ? staffs[randomBetween(0, 7)].id : customers[i % customers.length].id;
    const isRead = Math.random() > 0.5;

    await prisma.notification.create({
      data: {
        user_id: userId,
        notification_type: nd.type,
        title: nd.title,
        message: nd.message,
        entity_type: randomFrom(['WORK_ORDER', 'APPOINTMENT', 'QUOTATION', 'INVOICE', null]),
        entity_id: randomBetween(1, 20),
        is_read: isRead,
        read_at: isRead ? randomDate(5, 0) : null,
      }
    });
    notifCount++;
  }
  console.log(`   ✅ ${notifCount} Notifications`);

  // ==========================================
  // 10. AUDIT LOGS
  // ==========================================
  console.log('\n📋 [10/10] Tạo AuditLogs...');

  const auditData: { action: AuditAction; entityType: string }[] = [
    { action: AuditAction.CREATE, entityType: 'WORK_ORDER' },
    { action: AuditAction.CREATE, entityType: 'APPOINTMENT' },
    { action: AuditAction.STATUS_CHANGE, entityType: 'WORK_ORDER' },
    { action: AuditAction.STATUS_CHANGE, entityType: 'QUOTATION' },
    { action: AuditAction.UPDATE, entityType: 'CHECK_IN' },
    { action: AuditAction.UPDATE, entityType: 'WORK_ORDER' },
    { action: AuditAction.CREATE, entityType: 'INVOICE' },
    { action: AuditAction.STATUS_CHANGE, entityType: 'INVOICE' },
    { action: AuditAction.DELETE, entityType: 'APPOINTMENT' },
    { action: AuditAction.CREATE, entityType: 'QUOTATION' },
  ];

  for (let i = 0; i < 30; i++) {
    const ad = auditData[i % auditData.length];
    await prisma.auditLog.create({
      data: {
        user_id: staffs[randomBetween(0, 7)].id,
        action: ad.action,
        entity_type: ad.entityType,
        entity_id: randomBetween(1, 20),
        before_data: ad.action === AuditAction.STATUS_CHANGE ? { status: 'DRAFT' } : Prisma.JsonNull,
        after_data: ad.action === AuditAction.STATUS_CHANGE ? { status: 'IN_PROGRESS' } : Prisma.JsonNull,
        ip_address: `192.168.1.${randomBetween(10, 250)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
  }
  console.log('   ✅ 30 AuditLogs');

  // ==========================================
  // SUMMARY
  // ==========================================
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 ===== SEED HOÀN TẤT trong ${elapsed}s =====`);
  console.log('📊 Tổng kết:');
  console.log(`   - 5 Roles, 15 SystemCatalogs, 12 Skills`);
  console.log(`   - 30 Customers, 20 Staff/Employees`);
  console.log(`   - ${vehicles.length} Vehicles`);
  console.log(`   - 8 ServiceCategories, 20 ServiceTemplates, 8 JobTypes, 30 JobTemplates`);
  console.log(`   - ${inventoryItems.length} InventoryItems, 10 Suppliers`);
  console.log(`   - ${appointments.length} Appointments, ${intakeRecords.length} IntakeRecords`);
  console.log(`   - ${woIndex} WorkOrders (full lifecycle)`);
  console.log(`   - ${totalJobs} Jobs, ${totalQuo} Quotations, ${totalInv} Invoices, ${totalPay} Payments`);
  console.log(`   - ${totalRelease} VehicleReleases`);
  console.log(`   - ${notifCount} Notifications, 30 AuditLogs`);
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
