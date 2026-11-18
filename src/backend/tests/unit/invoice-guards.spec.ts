import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoiceService } from '../../src/services/invoice.service';
import prisma from '../../src/utils/prisma';
import { WorkOrderStatus, InvoiceStatus, QcResult, JobStatus } from '@prisma/client';

describe('Unit Test - Invoice Guards & Validation (SPEC-INV / UC-27)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assertBillableWorkOrder()', () => {
    it('INV-GRD-01: Báo lỗi 404 khi không tìm thấy phiếu công việc', async () => {
      vi.spyOn(prisma.workOrder, 'findUnique').mockResolvedValue(null);

      await expect(invoiceService.assertBillableWorkOrder(999)).rejects.toThrow(
        'Không tìm thấy phiếu công việc'
      );
    });

    it('INV-GRD-02: Báo lỗi 422 khi Work Order chưa ở trạng thái BILLING_REQUESTED', async () => {
      vi.spyOn(prisma.workOrder, 'findUnique').mockResolvedValue({
        id: 10,
        status: WorkOrderStatus.IN_PROGRESS,
        quotations: [],
        services: [],
        invoices: [],
      } as any);

      await expect(invoiceService.assertBillableWorkOrder(10)).rejects.toThrow(
        'chỉ có thể tạo hóa đơn khi ở trạng thái Chờ thanh toán'
      );
    });

    it('INV-GRD-03: Báo lỗi 422 khi Work Order đã có một hóa đơn active (DRAFT/ISSUED/PAID)', async () => {
      vi.spyOn(prisma.workOrder, 'findUnique').mockResolvedValue({
        id: 10,
        status: WorkOrderStatus.BILLING_REQUESTED,
        invoices: [
          {
            id: 201,
            invoice_number: 'INV-202611-001',
            status: InvoiceStatus.DRAFT,
          },
        ],
        quotations: [{ id: 1 }],
        services: [],
      } as any);

      await expect(invoiceService.assertBillableWorkOrder(10)).rejects.toThrow(
        'Phiếu công việc đã có hóa đơn'
      );
    });

    it('INV-GRD-04: Báo lỗi 422 khi Work Order chưa có báo giá nào được duyệt (APPROVED)', async () => {
      vi.spyOn(prisma.workOrder, 'findUnique').mockResolvedValue({
        id: 10,
        status: WorkOrderStatus.BILLING_REQUESTED,
        invoices: [],
        quotations: [], // Chưa có approved quote
        services: [],
      } as any);

      await expect(invoiceService.assertBillableWorkOrder(10)).rejects.toThrow(
        'chưa có báo giá nào được khách hàng phê duyệt'
      );
    });

    it('INV-GRD-05: Báo lỗi 422 khi có dịch vụ chưa đạt nghiệm thu QC', async () => {
      vi.spyOn(prisma.workOrder, 'findUnique').mockResolvedValue({
        id: 10,
        status: WorkOrderStatus.BILLING_REQUESTED,
        invoices: [],
        quotations: [{ id: 1, status: 'APPROVED' }],
        services: [
          {
            id: 1,
            name: 'Bảo dưỡng gầm',
            qc_records: [{ overall_result: QcResult.FAIL }],
            jobs: [],
          },
        ],
      } as any);

      await expect(invoiceService.assertBillableWorkOrder(10)).rejects.toThrow(
        'chưa đạt nghiệm thu chất lượng'
      );
    });

    it('INV-GRD-06: Báo lỗi 422 khi còn công việc đang ở trạng thái REWORK hoặc PLANNED', async () => {
      vi.spyOn(prisma.workOrder, 'findUnique').mockResolvedValue({
        id: 10,
        status: WorkOrderStatus.BILLING_REQUESTED,
        invoices: [],
        quotations: [{ id: 1, status: 'APPROVED' }],
        services: [
          {
            id: 1,
            name: 'Sơn dặm cánh cửa',
            qc_records: [{ overall_result: QcResult.PASS }],
            jobs: [
              { id: 101, status: JobStatus.REWORK }, // Còn job rework
            ],
          },
        ],
      } as any);

      await expect(invoiceService.assertBillableWorkOrder(10)).rejects.toThrow(
        'đang trong vòng lặp làm lại (Rework)'
      );
    });
  });

  describe('updateDraft()', () => {
    it('INV-GRD-07: Chặn chỉnh sửa chiết khấu khi hóa đơn không ở trạng thái DRAFT', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          invoice: {
            findUnique: vi.fn().mockResolvedValue({
              id: 201,
              status: InvoiceStatus.ISSUED, // Đã phát hành -> khóa sửa
              lines: [],
            }),
          },
        };
        return callback(txMock);
      });

      await expect(
        invoiceService.updateDraft(201, 1, { discountAmount: 100000, discountReason: 'Khách quen' })
      ).rejects.toThrow('Chỉ có thể chỉnh sửa chiết khấu khi ở trạng thái Nháp (DRAFT)');
    });
  });

  describe('issueInvoice()', () => {
    it('INV-GRD-08: Chặn phát hành khi hóa đơn không ở trạng thái DRAFT', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          invoice: {
            findUnique: vi.fn().mockResolvedValue({
              id: 201,
              status: InvoiceStatus.PAID,
            }),
          },
        };
        return callback(txMock);
      });

      await expect(invoiceService.issueInvoice(201, 1)).rejects.toThrow(
        'Chỉ có thể phát hành khi đang ở trạng thái Nháp (DRAFT)'
      );
    });
  });

  describe('cancelInvoice()', () => {
    it('INV-GRD-09: Chặn hủy khi hóa đơn đã ở trạng thái PAID', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          invoice: {
            findUnique: vi.fn().mockResolvedValue({
              id: 201,
              status: InvoiceStatus.PAID,
              payments: [],
            }),
          },
        };
        return callback(txMock);
      });

      await expect(invoiceService.cancelInvoice(201, 1, 'Hủy nhầm')).rejects.toThrow(
        'Không thể hủy hóa đơn đã thanh toán thành công'
      );
    });

    it('INV-GRD-10: Chặn hủy khi hóa đơn đã có khoản thanh toán thành công được ghi nhận', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          invoice: {
            findUnique: vi.fn().mockResolvedValue({
              id: 201,
              status: InvoiceStatus.ISSUED,
              payments: [{ id: 1, status: 'SUCCESS' }],
            }),
          },
        };
        return callback(txMock);
      });

      await expect(invoiceService.cancelInvoice(201, 1, 'Hủy')).rejects.toThrow(
        'Không thể hủy hóa đơn đã có khoản thanh toán thành công'
      );
    });
  });
});

