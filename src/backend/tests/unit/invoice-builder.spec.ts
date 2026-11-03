import { describe, it, expect } from 'vitest';
import { buildInvoiceLinesFromQuotations } from '../../src/utils/invoice-builder.util';

describe('Unit Test - Invoice Builder & Quotation Reconciliation (SPEC-INV / UC-27)', () => {
  it('INV-BLD-01: Gộp đầy đủ các dòng từ báo giá PRIMARY và SUPPLEMENTARY đã APPROVED', () => {
    const mockApprovedQuotes = [
      {
        id: 1,
        quotation_number: 'QUO-WO01-01',
        quotation_type: 'PRIMARY',
        status: 'APPROVED',
        discount_amount: 50000,
        lines: [
          {
            id: 101,
            line_type: 'LABOUR',
            description: 'Công thay dầu động cơ',
            quantity: 1,
            snapshot_unit_price: 150000,
            wo_service_id: 10,
            job_id: 20,
          },
          {
            id: 102,
            line_type: 'PART',
            description: 'Dầu Castrol 5W-30',
            quantity: 4,
            snapshot_unit_price: 120000,
            wo_service_id: 10,
            job_id: 20,
          },
        ],
      },
      {
        id: 2,
        quotation_number: 'QUO-WO01-02',
        quotation_type: 'SUPPLEMENTARY',
        status: 'APPROVED',
        discount_amount: 30000,
        lines: [
          {
            id: 103,
            line_type: 'PART',
            description: 'Lọc gió điều hòa',
            quantity: 1,
            snapshot_unit_price: 250000,
            wo_service_id: 11,
            job_id: 21,
          },
        ],
      },
    ];

    const result = buildInvoiceLinesFromQuotations(mockApprovedQuotes);

    expect(result.lines).toHaveLength(3);
    // Subtotal: 150.000 + (4 * 120.000) + 250.000 = 880.000
    expect(result.subtotal).toBe(880000);
    // Default discount: 50.000 + 30.000 = 80.000
    expect(result.defaultDiscount).toBe(80000);
    // Total (Zero-Tax): 880.000 - 80.000 = 800.000
    expect(result.totalAmount).toBe(800000);
    expect(result.amountDue).toBe(800000);
    expect(result.taxAmount).toBe(0);
    expect(result.sourceQuotationNumbers).toEqual(['QUO-WO01-01', 'QUO-WO01-02']);
  });

  it('INV-BLD-02: Bỏ qua các báo giá không ở trạng thái APPROVED (ví dụ REJECTED, DRAFT)', () => {
    const mockQuotes = [
      {
        id: 1,
        quotation_number: 'QUO-WO02-01',
        status: 'APPROVED',
        discount_amount: 0,
        lines: [
          {
            id: 201,
            line_type: 'LABOUR',
            description: 'Tiền công kiểm tra',
            quantity: 1,
            snapshot_unit_price: 100000,
          },
        ],
      },
      {
        id: 2,
        quotation_number: 'QUO-WO02-02',
        status: 'REJECTED',
        discount_amount: 50000,
        lines: [
          {
            id: 202,
            line_type: 'PART',
            description: 'Bugi bạch kim (Khách từ chối)',
            quantity: 4,
            snapshot_unit_price: 300000,
          },
        ],
      },
    ];

    const result = buildInvoiceLinesFromQuotations(mockQuotes);

    expect(result.lines).toHaveLength(1);
    expect(result.subtotal).toBe(100000);
    expect(result.sourceQuotationNumbers).toEqual(['QUO-WO02-01']);
  });

  it('INV-BLD-03: Áp dụng đối soát số lượng phụ tùng thực tế xuất dùng (Case D: used = issued - returned)', () => {
    const mockQuotes = [
      {
        id: 1,
        quotation_number: 'QUO-WO03-01',
        status: 'APPROVED',
        discount_amount: 0,
        lines: [
          {
            id: 301,
            line_type: 'PART',
            description: 'Bugi Denso Iridium',
            quantity: 4, // Dự kiến 4 cái
            snapshot_unit_price: 200000,
            job_part: {
              planned_quantity: 4,
              issued_quantity: 4,
              returned_quantity: 2, // Thực tế hoàn trả kho 2 cái -> thực dùng = 2
            },
          },
        ],
      },
    ];

    const result = buildInvoiceLinesFromQuotations(mockQuotes);

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].quantity).toBe(2);
    expect(result.lines[0].plannedQuantity).toBe(4);
    expect(result.lines[0].isAdjustedFromQuotation).toBe(true);
    expect(result.lines[0].amount).toBe(400000); // 2 * 200.000 = 400.000
    expect(result.subtotal).toBe(400000);
    expect(result.reconciliationNotes.length).toBeGreaterThan(0);
    expect(result.reconciliationNotes[0]).toContain('Số lượng thực dùng là 2');
  });

  it('INV-BLD-04: Đảm bảo chiết khấu mặc định không vượt quá tổng tiền Subtotal', () => {
    const mockQuotes = [
      {
        id: 1,
        quotation_number: 'QUO-WO04-01',
        status: 'APPROVED',
        discount_amount: 500000, // Chiết khấu lớn hơn tổng bill
        lines: [
          {
            id: 401,
            line_type: 'LABOUR',
            description: 'Vệ sinh khoang máy',
            quantity: 1,
            snapshot_unit_price: 300000,
          },
        ],
      },
    ];

    const result = buildInvoiceLinesFromQuotations(mockQuotes);

    expect(result.subtotal).toBe(300000);
    expect(result.defaultDiscount).toBe(300000); // Bị chặn bằng Subtotal
    expect(result.totalAmount).toBe(0);
    expect(result.amountDue).toBe(0);
  });

  it('INV-BLD-05: Đảm bảo toàn vẹn tính truy vết (BR-INV-01: quotationLineId, woServiceId, jobId)', () => {
    const mockQuotes = [
      {
        id: 1,
        quotation_number: 'QUO-WO05-01',
        status: 'APPROVED',
        discount_amount: 0,
        lines: [
          {
            id: 501,
            line_type: 'PACKAGE',
            description: 'Gói bảo dưỡng cấp 4 vạn',
            quantity: 1,
            snapshot_unit_price: 2500000,
            wo_service_id: 100,
            job_id: 200,
          },
        ],
      },
    ];

    const result = buildInvoiceLinesFromQuotations(mockQuotes);

    const line = result.lines[0];
    expect(line.quotationLineId).toBe(501);
    expect(line.woServiceId).toBe(100);
    expect(line.jobId).toBe(200);
    expect(line.lineType).toBe('PACKAGE');
    expect(line.sortOrder).toBe(0);
  });
});

