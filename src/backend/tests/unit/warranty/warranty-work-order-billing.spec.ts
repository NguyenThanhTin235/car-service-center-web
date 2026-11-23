import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock, sendEmailMock, sendInAppMock } = vi.hoisted(() => {
  const mock: any = {
    user: {
      findUnique: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
    },
    workOrder: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    woService: {
      findFirst: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    jobPart: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    inventoryItem: {
      findUnique: vi.fn(),
    },
    quotation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    quotationLine: {
      createMany: vi.fn(),
    },
    invoice: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    goodwillClaim: {
      findUnique: vi.fn(),
    },
    intakeRecord: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    checkIn: {
      updateMany: vi.fn(),
    },
  };
  mock.$transaction = vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mock));

  return {
    prismaMock: mock,
    sendEmailMock: vi.fn().mockResolvedValue(true),
    sendInAppMock: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../../src/utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('../../../src/services/notification.service', () => ({
  notificationService: {
    sendEmail: sendEmailMock,
    notifyAndEmail: vi.fn().mockResolvedValue(undefined),
    sendInAppToRoles: vi.fn().mockResolvedValue(undefined),
    sendInApp: sendInAppMock,
  },
}));

import { WorkOrderService } from '../../../src/services/work-order.service';
import { QuotationService } from '../../../src/services/quotation.service';
import { InvoiceService } from '../../../src/services/invoice.service';

describe('Warranty Work Order, Quotation 0đ & Invoice 0đ (UC-84 & UC-85)', () => {
  let workOrderService: WorkOrderService;
  let quotationService: QuotationService;
  let invoiceService: InvoiceService;

  beforeEach(() => {
    vi.clearAllMocks();
    sendEmailMock.mockResolvedValue(true);
    prismaMock.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock));
    workOrderService = new WorkOrderService();
    quotationService = new QuotationService();
    invoiceService = new InvoiceService();
  });

  // =========================================================================
  // UC-84: TẠO PHIẾU CÔNG VIỆC BẢO HÀNH & BÁO GIÁ 0 ĐỒNG
  // =========================================================================
  describe('UC-84: Phiếu công việc bảo hành & Báo giá 0 đồng', () => {
    it('WAR-WO-01: Tạo Work Order từ IntakeRecord loại WARRANTY kế thừa parent_work_order_id và goodwillClaim', async () => {
      prismaMock.intakeRecord.findUnique.mockResolvedValue({
        id: 100,
        customer_id: 10,
        vehicle_id: 20,
        intake_type: 'WARRANTY',
        status: 'QUEUED',
        notes: '[TIẾP NHẬN BẢO HÀNH] Phiếu dịch vụ gốc: #WO-2026-00050\nHiện tượng sự cố: Lỗi thước lái rung lắc',
        services: [],
      });

      // Tìm thấy goodwill claim liên kết
      prismaMock.goodwillClaim.findUnique.mockResolvedValue({
        id: 7,
        parent_wo_id: 50,
        approved_by_id: 88,
        complaint: 'Hỗ trợ thay thước lái',
      });

      // Mock repo
      const createdWo = {
        id: 201,
        wo_number: 'WO-2026-00201',
        customer_id: 10,
        vehicle_id: 20,
        order_type: 'WARRANTY',
        parent_work_order_id: 50,
        claim_approved_by_id: 88,
        warranty_reason: 'Hỗ trợ thay thước lái',
        status: 'DRAFT',
      };
      prismaMock.workOrder.create = vi.fn().mockResolvedValue(createdWo);
      prismaMock.workOrder.findFirst.mockResolvedValue(null); // không trùng

      const result = await workOrderService.createWorkOrder(100, 99);

      expect(prismaMock.intakeRecord.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { status: 'CONVERTED' },
      });
      expect(result.order_type).toBe('WARRANTY');
      expect(result.parent_work_order_id).toBe(50);
    });

    it('WAR-WO-02: Thêm phụ tùng vào công việc tự động thừa hưởng cờ is_warranty từ Job nếu không chỉ định', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 201,
        status: 'DRAFT',
      });
      // Job có cờ is_warranty: true
      prismaMock.job.findFirst.mockResolvedValue({
        id: 501,
        name: 'Thay thước lái bảo hành',
        status: 'PLANNED',
        is_warranty: true,
      });
      prismaMock.inventoryItem.findUnique.mockResolvedValue({
        id: 10,
        selling_price: 3500000,
        is_active: true,
        warranty_months: 12,
        warranty_mileage: 10000,
        part_category: { name: 'Thước lái điện', uom: { name: 'Cái' } },
        brand: { name: 'Toyota OEM' },
      });

      prismaMock.jobPart.create.mockResolvedValue({
        id: 801,
        job_id: 501,
        item_id: 10,
        planned_quantity: 1,
        unit_price: 3500000,
        is_warranty: true,
      });

      const part = await workOrderService.addPartToJob(201, 501, {
        item_id: 10,
        planned_quantity: 1,
        // Không truyền is_warranty, mong đợi tự động thừa hưởng is_warranty: true từ Job
      });

      expect(prismaMock.jobPart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            is_warranty: true,
            warranty_months: 12,
            warranty_mileage: 10000,
          }),
        })
      );
    });

    it('WAR-QTO-01: Sinh báo giá 0 đồng khi tất cả các Job và Part có cờ is_warranty = true (UC-84 Bước 6-7)', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 201,
        wo_number: 'WO-201',
        order_type: 'WARRANTY',
        status: 'IN_PLANNING',
        customer: { id: 10, full_name: 'Nguyễn Văn A' },
        vehicle: { id: 20, license_plate: '51G-123.45', vehicle_size: 'MEDIUM' },
        services: [
          {
            id: 1,
            name: 'Hệ thống lái',
            pricing_type: 'LABOUR_PARTS',
            jobs: [
              {
                id: 501,
                name: 'Thay thế thước lái',
                is_warranty: true,
                labours: [
                  { id: 11, description: 'Công thay thước lái', price: 450000 },
                ],
                parts: [
                  {
                    id: 801,
                    is_warranty: true,
                    planned_quantity: 1,
                    unit_price: 3500000,
                    item: {
                      sku: 'TL-01',
                      part_category: { name: 'Thước lái' },
                      brand: { name: 'Toyota' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      });

      prismaMock.quotation.findMany.mockResolvedValue([]);
      prismaMock.quotation.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: 301,
          quotation_number: 'QTO-2026-00301',
          ...data,
          lines: data.lines.create,
        });
      });

      const quote = await quotationService.createQuotation(201, 99);

      // Đơn giá nhân công và phụ tùng bảo hành đều áp dụng 0 đồng
      expect(Number(quote.subtotal)).toBe(0);
      expect(Number(quote.taxAmount)).toBe(0);
      expect(Number(quote.grandTotal)).toBe(0);
      expect(quote.lines).toHaveLength(2);
      expect(Number(quote.lines[0].snapshotUnitPrice)).toBe(0);
      expect(Number(quote.lines[1].snapshotUnitPrice)).toBe(0);
      expect(quote.lines[0].description).toContain('[Bảo hành]');
      expect(quote.lines[1].description).toContain('[Bảo hành]');
    });

    it('WAR-QTO-02: Báo giá cho phiếu hỗn hợp (MIXED) giữ nguyên 0đ cho bảo hành và tính tiền cho dịch vụ thông thường', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 202,
        wo_number: 'WO-202',
        order_type: 'WARRANTY',
        status: 'IN_PLANNING',
        customer: { id: 10, full_name: 'Trần B' },
        vehicle: { id: 20, license_plate: '51H-999.99', vehicle_size: 'MEDIUM' },
        services: [
          {
            id: 1,
            name: 'Bảo hành & Bảo dưỡng',
            pricing_type: 'LABOUR_PARTS',
            jobs: [
              // Hạng mục 1: Bảo hành (is_warranty: true)
              {
                id: 601,
                name: 'Thay gioăng nắp giàn cò bảo hành',
                is_warranty: true,
                labours: [{ id: 21, description: 'Công thay gioăng', price: 200000 }],
                parts: [
                  {
                    id: 901,
                    is_warranty: true,
                    planned_quantity: 1,
                    unit_price: 350000,
                    item: { sku: 'G-01', part_category: { name: 'Gioăng giàn cò' }, brand: null },
                  },
                ],
              },
              // Hạng mục 2: Khách yêu cầu thêm có tính phí (is_warranty: false)
              {
                id: 602,
                name: 'Thay dầu động cơ và lọc dầu',
                is_warranty: false,
                labours: [{ id: 22, description: 'Công thay dầu', price: 100000 }],
                parts: [
                  {
                    id: 902,
                    is_warranty: false,
                    planned_quantity: 4,
                    unit_price: 150000, // 4 x 150.000 = 600.000
                    item: { sku: 'OIL-01', part_category: { name: 'Dầu Castrol 5W-30' }, brand: null },
                  },
                ],
              },
            ],
          },
        ],
      });

      prismaMock.quotation.findMany.mockResolvedValue([]);
      prismaMock.quotation.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: 302,
          quotation_number: 'QTO-2026-00302',
          ...data,
          lines: data.lines.create,
        });
      });

      const quote = await quotationService.createQuotation(202, 99);

      // Chi phí chỉ tính trên hạng mục thường: 100.000 (công) + 600.000 (dầu) = 700.000
      expect(Number(quote.subtotal)).toBe(700000);
      expect(Number(quote.grandTotal)).toBe(700000);

      // Tự động chuyển order_type sang MIXED
      expect(prismaMock.workOrder.update).toHaveBeenCalledWith({
        where: { id: 202 },
        data: { order_type: 'MIXED' },
      });
    });

    it('WAR-QTO-03: Cố vấn dịch vụ duyệt báo giá 0 đồng thay khách hàng, tự động giữ kho phụ tùng RESERVED (UC-84 Bước 8-9)', async () => {
      prismaMock.quotation.findUnique.mockResolvedValue({
        id: 301,
        work_order_id: 201,
        status: 'DRAFT',
        subtotal: 0,
        total_amount: 0,
        work_order: {
          id: 201,
          customer_id: 10,
          order_type: 'WARRANTY',
        },
        lines: [
          { id: 1, job_part_id: 801 },
        ],
      });

      prismaMock.quotation.update.mockResolvedValue({
        id: 301,
        status: 'APPROVED',
        approved_by_id: 99, // Cố vấn dịch vụ
      });

      const approved = await quotationService.approveQuotation(301, 99, 'SERVICE_ADVISOR');

      expect(prismaMock.quotation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 301 },
          data: expect.objectContaining({ status: 'APPROVED' }),
        })
      );
      // Chuyển JobPart sang RESERVED (Giữ phụ tùng kho)
      expect(prismaMock.jobPart.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [801] } },
        data: { status: 'RESERVED' },
      });
      // Chuyển Work Order sang APPROVED
      expect(prismaMock.workOrder.update).toHaveBeenCalledWith({
        where: { id: 201 },
        data: { status: 'APPROVED' },
      });
    });
  });

  // =========================================================================
  // UC-85: XỬ LÝ HÓA ĐƠN BẢO HÀNH & QUYẾT TOÁN 0 ĐỒNG
  // =========================================================================
  describe('UC-85: Hóa đơn bảo hành & Quyết toán tài chính 0 đồng', () => {
    it('WAR-INV-01: Phát hành hóa đơn 0 đồng tự động chuyển sang PAID và kích hoạt FINANCIAL_CLEARED mở khóa Cổng xuất xưởng (UC-85 Luồng cơ bản)', async () => {
      prismaMock.invoice.findUnique.mockResolvedValue({
        id: 401,
        invoice_number: 'INV-202612-001',
        work_order_id: 201,
        status: 'DRAFT',
        total_amount: 0, // Hóa đơn 0 đồng
        amount_due: 0,
        work_order: {
          id: 201,
          customer_id: 10,
          advisor_id: 99,
          status: 'BILLING_REQUESTED', // Chờ thanh toán
          order_type: 'WARRANTY',
          customer: { id: 10, full_name: 'Nguyễn Văn A', email: 'a@example.com' },
          vehicle: { license_plate: '51G-123.45', make: 'Toyota', model: 'Camry' },
          advisor: { id: 99, full_name: 'Trần Cố Vấn' },
        },
      });

      prismaMock.invoice.update.mockResolvedValue({
        id: 401,
        invoice_number: 'INV-202612-001',
        status: 'PAID',
        total_amount: 0,
        amount_due: 0,
        issued_at: new Date(),
      });

      const result = await invoiceService.issueInvoice(401, 88);

      expect(result.status).toBe('PAID');
      expect(result.isAutoPaid).toBe(true);

      // Tự động chuyển Invoice sang PAID
      expect(prismaMock.invoice.update).toHaveBeenCalledWith({
        where: { id: 401 },
        data: expect.objectContaining({
          status: 'PAID',
          amount_due: 0,
        }),
      });

      // Tự động chuyển Work Order sang FINANCIAL_CLEARED (Mở khóa Cổng xuất xưởng UC-43)
      expect(prismaMock.workOrder.update).toHaveBeenCalledWith({
        where: { id: 201 },
        data: { status: 'FINANCIAL_CLEARED' },
      });

      // Bắn thông báo VEHICLE_READY cho Cố vấn dịch vụ
      expect(sendInAppMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 99,
          type: 'VEHICLE_READY',
        })
      );
    });

    it('WAR-INV-02: Phát hành hóa đơn đơn hỗn hợp có chi phí phát sinh > 0đ giữ nguyên ISSUED và không tự động clear tài chính (UC-85 Luồng ngoại lệ)', async () => {
      prismaMock.invoice.findUnique.mockResolvedValue({
        id: 402,
        invoice_number: 'INV-202612-002',
        work_order_id: 202,
        status: 'DRAFT',
        total_amount: 700000, // Đơn hỗn hợp có phát sinh 700.000đ
        amount_due: 700000,
        work_order: {
          id: 202,
          customer_id: 10,
          advisor_id: 99,
          status: 'BILLING_REQUESTED',
          order_type: 'MIXED',
          customer: { id: 10, full_name: 'Trần B', email: 'b@example.com' },
          vehicle: { license_plate: '51H-999.99', make: 'Honda', model: 'CR-V' },
          advisor: { id: 99, full_name: 'Trần Cố Vấn' },
        },
      });

      prismaMock.invoice.update.mockResolvedValue({
        id: 402,
        invoice_number: 'INV-202612-002',
        status: 'ISSUED',
        total_amount: 700000,
        amount_due: 700000,
        issued_at: new Date(),
      });

      const result = await invoiceService.issueInvoice(402, 88);

      expect(result.status).toBe('ISSUED');
      expect(result.isAutoPaid).toBe(false);

      // Hóa đơn ở ISSUED ghi nhận công nợ
      expect(prismaMock.invoice.update).toHaveBeenCalledWith({
        where: { id: 402 },
        data: expect.objectContaining({
          status: 'ISSUED',
          amount_due: 700000,
        }),
      });

      // Work Order KHÔNG được tự động chuyển sang FINANCIAL_CLEARED (phải chờ thu tiền qua UC-28)
      expect(prismaMock.workOrder.update).not.toHaveBeenCalled();
    });
  });
});
