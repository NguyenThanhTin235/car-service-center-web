import { PrismaClient, EmployeePosition, VehicleSize, VehicleStatus, PricingType, AppointmentStatus, IntakeType, IntakeStatus, WorkOrderSourceType, WorkOrderStatus, FuelLevel, CheckInStatus, ServiceStatus, InspectionStatus, InspectionResultValue, Severity, MarkerType, JobStatus, QuotationStatus, QuotationType, LineType, ItemType, ReceiptType, MovementType, ReferenceType, AdjustmentStatus, InvoiceStatus, PaymentMethod, PaymentStatus, QcResult, NotificationType, AuditAction, CatalogType, InspectionTemplateType, PartAllocationStatus, FindingStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_IMAGE = "https://res.cloudinary.com/dmxxo6wgl/image/upload/v1788942602/image_dn3hj9.jpg";
const DEFAULT_PASSWORD = 'password123'; 

async function main() {
  console.log('⏳ Starting FULL seed process (ALL tables)...');

  // 1. CLEAR DATABASE
  console.log('🧹 Clearing existing data...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  const tables = await prisma.$queryRaw<Array<any>>`SELECT table_name as tableName FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name != '_prisma_migrations';`;
  for (const { tableName } of tables) {
    if (tableName !== '_prisma_migrations') await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${tableName}\`;`);
  }
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('✅ Database cleared.');

  // 2. CREATE ROLES
  const rolesData = ['ADMIN', 'MANAGER', 'DESK STAFF', 'QC', 'CUSTOMER'];
  const createdRoles = [];
  for (const r of rolesData) createdRoles.push(await prisma.role.create({ data: { name: r } }));
  const [roleAdmin, roleManager, roleDeskStaff, roleQC, roleCustomer] = createdRoles;

  // 3. CREATE SYSTEM CATALOGS
  const uomCatalog = await prisma.systemCatalog.create({ data: { catalog_type: CatalogType.UOM, name: 'Cái' } });
  await prisma.systemCatalog.create({ data: { catalog_type: CatalogType.CANCEL_REASON, name: 'Khách đổi ý' } });
  await prisma.systemCatalog.create({ data: { catalog_type: CatalogType.ADJUST_REASON, name: 'Hàng hỏng' } });

  // 4. CREATE USERS & EMPLOYEES
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const customers = [];
  for (let i = 1; i <= 5; i++) {
    customers.push(await prisma.user.create({
      data: {
        email: `customer${i}@carservice.com`, phone: `091111110${i}`, password_hash: passwordHash,
        full_name: `Khách Hàng ${i}`,
        roles: { create: { role_id: roleCustomer.id } }
      }
    }));
  }

  const staffs = [];
  const positions = [EmployeePosition.ADVISOR, EmployeePosition.QC_STAFF, EmployeePosition.TECHNICIAN, EmployeePosition.DETAILER, EmployeePosition.OTHER];
  const staffRoles = [roleAdmin, roleManager, roleDeskStaff, roleQC, roleDeskStaff];
  for (let i = 1; i <= 10; i++) {
    staffs.push(await prisma.user.create({
      data: {
        email: `staff${i}@carservice.com`, phone: `08111111${i.toString().padStart(2, '0')}`,
        password_hash: passwordHash, full_name: `Nhân Viên ${i}`,
        roles: { create: { role_id: staffRoles[i % staffRoles.length].id } },
        employee: { create: { full_name: `Nhân Viên ${i}`, position: positions[i % positions.length] } }
      },
      include: { employee: true }
    }));
  }

  // 5. CREATE SKILLS & EMPLOYEE SKILLS
  const skills = [];
  for (let i = 1; i <= 5; i++) skills.push(await prisma.skill.create({ data: { name: `Kỹ năng ${i}` } }));
  
  for (let i = 0; i < 5; i++) {
    const empId = staffs[i].employee?.id;
    if (empId) {
      await prisma.employeeSkill.create({ data: { employee_id: empId, skill_id: skills[i].id } });
      await prisma.employeeSkill.create({ data: { employee_id: empId, skill_id: skills[(i+1)%5].id } });
    }
  }

  // 6. CREATE VEHICLES
  const vehicles = [];
  const sizes = [VehicleSize.SMALL, VehicleSize.MEDIUM, VehicleSize.LARGE, VehicleSize.SUV, VehicleSize.TRUCK];
  let vIndex = 0;
  for (const c of customers) {
    for (let j = 1; j <= 2; j++) {
      vIndex++;
      vehicles.push(await prisma.vehicle.create({
        data: {
          customer_id: c.id, license_plate: `51G-${100 + vIndex}`, make: 'Toyota', model: `Vios ${vIndex}`,
          year: 2020, color: 'Trắng', vehicle_size: sizes[vIndex % sizes.length]
        }
      }));
    }
  }

  // 7. CREATE CATALOGS & TEMPLATES (Service, Job, Inspection)
  const serviceCategories = [];
  for (let i = 1; i <= 5; i++) serviceCategories.push(await prisma.serviceCategory.create({ data: { name: `Danh mục Dịch vụ ${i}` } }));

  const serviceTemplates = [];
  for (let i = 1; i <= 10; i++) {
    const st = await prisma.serviceTemplate.create({
      data: { category_id: serviceCategories[i % 5].id, name: `Dịch vụ mẫu ${i}`, pricing_type: PricingType.VEHICLE_SIZE }
    });
    serviceTemplates.push(st);
    
    // VehicleSizePrice
    for (const size of sizes) {
      await prisma.vehicleSizePrice.create({ data: { service_template_id: st.id, vehicle_size: size, price: 50000 * i } });
    }
  }

  const jobTypes = [];
  for (let i = 1; i <= 5; i++) jobTypes.push(await prisma.jobType.create({ data: { name: `Phòng Kỹ Thuật ${i}`, hourly_rate: 50000 * i } }));

  const jobTemplates = [];
  for (let i = 1; i <= 10; i++) {
    jobTemplates.push(await prisma.jobTemplate.create({
      data: { job_type_id: jobTypes[i % 5].id, service_template_id: serviceTemplates[i - 1].id, name: `Công việc mẫu ${i}`, estimated_hours: 1.5, requires_qc: true }
    }));
  }

  const inspTemplates = [];
  for (let i = 1; i <= 5; i++) {
    const it = await prisma.inspectionTemplate.create({
      data: { service_template_id: serviceTemplates[i - 1].id, template_type: InspectionTemplateType.INSPECTION, name: `Mẫu kiểm tra ${i}` }
    });
    inspTemplates.push(it);
    for (let j = 1; j <= 5; j++) {
      await prisma.inspectionTemplateItem.create({ data: { template_id: it.id, name: `Hạng mục kiểm tra ${i}-${j}` } });
    }
  }

  // 8. CREATE INVENTORY (Suppliers, Items, Receipts, Movements, Adjustments)
  const suppliers = [];
  for (let i = 1; i <= 5; i++) suppliers.push(await prisma.supplier.create({ data: { name: `Nhà cung cấp ${i}`, phone: `0283333330${i}` } }));

  const inventoryItems = [];
  for (let i = 1; i <= 10; i++) {
    inventoryItems.push(await prisma.inventoryItem.create({
      data: { sku: `ITEM-${i}`, name: `Vật tư ${i}`, item_type: ItemType.PART, uom_id: uomCatalog.id, selling_price: 200000, average_cost: 150000, on_hand: 100 }
    }));
  }

  // JobTemplateParts
  for (let i = 0; i < 5; i++) {
    await prisma.jobTemplatePart.create({ data: { job_template_id: jobTemplates[i].id, item_id: inventoryItems[i].id, default_quantity: 2 } });
  }

  // GoodsReceipt & Movement
  for (let i = 0; i < 5; i++) {
    const gr = await prisma.goodsReceipt.create({
      data: { receipt_number: `GR-${i}`, supplier_id: suppliers[i].id, receipt_type: ReceiptType.PURCHASE, received_date: new Date(), created_by_id: staffs[0].id }
    });
    await prisma.goodsReceiptItem.create({ data: { receipt_id: gr.id, item_id: inventoryItems[i].id, quantity: 50, unit_cost: 100000 } });
    await prisma.stockMovement.create({
      data: { item_id: inventoryItems[i].id, movement_type: MovementType.RECEIPT, reference_type: ReferenceType.GOODS_RECEIPT, reference_id: gr.id, quantity: 50, unit_cost: 100000, balance_after: 150, created_by_id: staffs[0].id }
    });
  }

  // StockAdjustment
  for (let i = 0; i < 5; i++) {
    await prisma.stockAdjustment.create({
      data: { item_id: inventoryItems[i].id, adjustment_quantity: -2, reason: 'Hư hỏng', status: AdjustmentStatus.APPROVED, requested_by_id: staffs[0].id, approved_by_id: staffs[1].id, approved_at: new Date() }
    });
  }

  // 9. CREATE OPERATIONS FLOW
  for (let i = 0; i < 5; i++) {
    const cust = customers[i];
    const veh = vehicles[i * 2]; 
    const adv = staffs[0]; 
    const tech = staffs[2]; 
    const qc = staffs[3]; 

    // Appointment
    const appt = await prisma.appointment.create({
      data: { customer_id: cust.id, vehicle_id: veh.id, scheduled_date: new Date(), scheduled_time: new Date(), status: AppointmentStatus.ARRIVED, created_by_id: adv.id }
    });
    await prisma.appointmentService.create({ data: { appointment_id: appt.id, service_template_id: serviceTemplates[i].id } });

    // IntakeRecord
    const intake = await prisma.intakeRecord.create({
      data: { customer_id: cust.id, vehicle_id: veh.id, intake_type: IntakeType.WALK_IN, status: IntakeStatus.CONVERTED, arrived_at: new Date(), created_by_id: adv.id }
    });

    // Fake specific statuses based on i
    let woStatus: WorkOrderStatus = WorkOrderStatus.DRAFT;
    let jobStatus: JobStatus = JobStatus.PLANNED;
    let partStatus: PartAllocationStatus = PartAllocationStatus.PLANNED;
    let invStatus: InvoiceStatus = InvoiceStatus.DRAFT;

    if (i === 1) { woStatus = WorkOrderStatus.IN_PROGRESS; jobStatus = JobStatus.IN_PROGRESS; partStatus = PartAllocationStatus.ISSUED; }
    if (i === 2) { woStatus = WorkOrderStatus.PENDING_APPROVAL; }
    if (i === 3) { woStatus = WorkOrderStatus.RELEASED; jobStatus = JobStatus.REWORK; partStatus = PartAllocationStatus.USED; }
    if (i === 4) { woStatus = WorkOrderStatus.CLOSED; jobStatus = JobStatus.COMPLETED; invStatus = InvoiceStatus.PAID; }

    // WorkOrder
    const wo = await prisma.workOrder.create({
      data: { wo_number: `WO-${i+1}`, customer_id: cust.id, vehicle_id: veh.id, advisor_id: adv.id, source_type: WorkOrderSourceType.APPOINTMENT, appointment_id: appt.id, intake_record_id: intake.id, status: woStatus, created_by_id: adv.id }
    });

    // CheckIn
    await prisma.checkIn.create({
      data: { work_order_id: wo.id, mileage: 10000, fuel_level: FuelLevel.HALF, complaint: `Lỗi ${i}`, exterior_condition: 'Bình thường', status: CheckInStatus.CONFIRMED, created_by_id: adv.id, confirmed_by_customer_id: cust.id, confirmed_at: new Date(), evidence_urls: [DEFAULT_IMAGE] }
    });

    // WoService
    const wos = await prisma.woService.create({
      data: { work_order_id: wo.id, service_template_id: serviceTemplates[i].id, name: `Dịch vụ ${i}`, pricing_type: PricingType.FIXED, status: ServiceStatus.COMPLETED }
    });

    // Job, JobLabour, JobPart
    const job = await prisma.job.create({
      data: { wo_service_id: wos.id, job_type_id: jobTypes[i].id, job_template_id: jobTemplates[i].id, name: `Job ${i}`, estimated_hours: 1, status: jobStatus, created_by_id: tech.id }
    });
    
    await prisma.jobLabour.create({
      data: { job_id: job.id, job_type_id: jobTypes[i].id, employee_id: tech.employee?.id, estimated_hours: 1, billable_hours: 1, hourly_rate: 100000 }
    });

    const jPart = await prisma.jobPart.create({
      data: { job_id: job.id, item_id: inventoryItems[i].id, status: partStatus, planned_quantity: 1, issued_quantity: 1, unit_price: 200000 }
    });

    // Inspection, Result & Finding
    const insp = await prisma.inspection.create({
      data: { work_order_id: wo.id, wo_service_id: wos.id, template_id: inspTemplates[i].id, status: InspectionStatus.COMPLETED, created_by_id: tech.id }
    });

    const inspItems = await prisma.inspectionTemplateItem.findMany({ where: { template_id: inspTemplates[i].id } });
    if (inspItems.length > 0) {
      await prisma.inspectionResult.create({
        data: { inspection_id: insp.id, template_item_id: inspItems[0].id, item_name: inspItems[0].name, result: InspectionResultValue.PASS }
      });
    }

    const finding = await prisma.finding.create({
      data: { inspection_id: insp.id, status: (i > 2 ? FindingStatus.RESOLVED : FindingStatus.NEW), description: `Finding ${i}`, severity: Severity.MEDIUM, marker_type: MarkerType.OTHER, evidence_urls: [DEFAULT_IMAGE], created_by_id: tech.id }
    });

    await prisma.jobFinding.create({ data: { job_id: job.id, finding_id: finding.id } });

    // QcRecord & QcItem
    const qcr = await prisma.qcRecord.create({
      data: { wo_service_id: wos.id, overall_result: (i === 3 ? QcResult.FAIL : QcResult.PASS), inspector_id: qc.id }
    });
    await prisma.qcItem.create({
      data: { qc_record_id: qcr.id, item_name: 'Kiểm tra cơ bản', result: (i === 3 ? QcResult.FAIL : QcResult.PASS) }
    });

    // Invoicing

    if (i >= 2) {
      const quo = await prisma.quotation.create({
        data: { work_order_id: wo.id, quotation_number: `Q-${i}`, quotation_type: QuotationType.PRIMARY, status: QuotationStatus.APPROVED, subtotal: 300000, grand_total: 300000, created_by_id: adv.id,
          lines: { create: { wo_service_id: wos.id, line_type: LineType.PACKAGE, description: `Gói ${i}`, quantity: 1, snapshot_unit_price: 300000, amount: 300000 } }
        }
      });
    }

    if (i >= 3) {
      const inv = await prisma.invoice.create({
        data: { work_order_id: wo.id, invoice_number: `INV-${i}`, status: invStatus, subtotal: 300000, total_amount: 300000, amount_due: 0, created_by_id: adv.id,
          lines: { create: { line_type: LineType.PACKAGE, description: `Hóa đơn ${i}`, quantity: 1, unit_price: 300000, amount: 300000 } }
        }
      });

      if (invStatus === InvoiceStatus.PAID) {
        await prisma.payment.create({
          data: { invoice_id: inv.id, payment_method: PaymentMethod.CASH, amount: 300000, transaction_ref: `TXN-${i}`, status: PaymentStatus.SUCCESS, paid_at: new Date(), received_by_id: adv.id }
        });
      }
    }

    if (i >= 3 && woStatus === WorkOrderStatus.CLOSED || woStatus === WorkOrderStatus.RELEASED) {
      await prisma.vehicleRelease.create({
        data: { work_order_id: wo.id, released_by_id: adv.id, released_at: new Date(), confirmed_by_customer_id: cust.id, confirmed_at: new Date() }
      });
    }
  }

  // 10. SYSTEM LOGS
  for (let i = 0; i < 5; i++) {
    await prisma.notification.create({
      data: { user_id: customers[i].id, notification_type: NotificationType.GENERAL, title: 'Welcome', message: 'Welcome to Car Service Center' }
    });
    await prisma.auditLog.create({
      data: { user_id: staffs[0].id, action: AuditAction.CREATE, entity_type: 'WORK_ORDER', entity_id: i + 1 }
    });
  }

  console.log('✅ MASSIVE FULL Seed Data completed successfully! All tables seeded.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
