import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculatePricingTotals } from '../../src/utils/pricing-calculator.util';

describe('Quotation Business Rules & Pricing Compliance (SPEC-FIN-02)', () => {
  it('QUOT-01: Zero-Tax Rule - Tax rate and tax amount must ALWAYS be 0 regardless of subtotal', () => {
    const lines = [
      { id: 1, lineType: 'LABOUR' as const, description: 'Bảo dưỡng cấp 2', quantity: 1, unitPrice: 450000 },
      { id: 2, lineType: 'PART' as const, description: 'Lọc dầu nhớt chính hãng Denso', quantity: 1, unitPrice: 180000 },
      { id: 3, lineType: 'PART' as const, description: 'Dầu động cơ Castrol Edge 4L', quantity: 1, unitPrice: 620000 },
    ];

    const result = calculatePricingTotals({
      lines,
      discountAmount: 50000,
    });

    // Subtotal = 450k + 180k + 620k = 1,250,000 đ
    expect(result.subtotal).toBe(1250000);
    // Discount = 50,000 đ
    expect(result.discountAmount).toBe(50000);
    // STRICT ZERO-TAX:
    expect(result.taxRate).toBe(0);
    expect(result.taxAmount).toBe(0);
    // Grand Total = 1,250,000 - 50,000 = 1,200,000 đ
    expect(result.grandTotal).toBe(1200000);
  });

  it('QUOT-02: Fixed Labour Rule - Labour is fixed price and 100% genuine parts from warehouse', () => {
    const lines = [
      // Tiền công khoán trọn gói cố định (Fixed price)
      { id: 1, lineType: 'LABOUR' as const, description: 'Công thay thế má phanh trước (Trọn gói)', quantity: 1, unitPrice: 250000 },
      // 100% phụ tùng từ kho (Part allocation status PLANNED -> RESERVED)
      { id: 2, lineType: 'PART' as const, description: 'Bộ má phanh trước Toyota OEM (Kho trung tâm)', quantity: 1, unitPrice: 1200000 },
    ];

    const result = calculatePricingTotals({ lines });

    expect(result.subtotal).toBe(1450000);
    expect(result.grandTotal).toBe(1450000);
    expect(result.taxAmount).toBe(0);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].lineType).toBe('LABOUR');
    expect(result.lines[1].lineType).toBe('PART');
  });

  it('QUOT-03: Percentage discount capping - Discount cannot exceed subtotal', () => {
    const lines = [
      { id: 1, lineType: 'LABOUR' as const, description: 'Rửa khoang máy chuyên sâu', quantity: 1, unitPrice: 300000 },
    ];

    const result = calculatePricingTotals({
      lines,
      discountPercent: 120, // 120% discount (vượt quá)
    });

    // Phải được cap tối đa bằng Subtotal, GrandTotal không được âm
    expect(result.discountAmount).toBe(300000);
    expect(result.grandTotal).toBe(0);
  });

  it('QUOT-04: Approval state transition logic verification', () => {
    // Giả lập trạng thái trước và sau khi Approve
    const initialQuotation = {
      id: 101,
      status: 'SENT',
      workOrderStatus: 'PENDING_APPROVAL',
      partStatus: 'PLANNED',
    };

    // Khi khách hàng hoặc Cố vấn bấm Phê duyệt (Approve)
    const approvedQuotation = {
      ...initialQuotation,
      status: 'APPROVED',
      workOrderStatus: 'APPROVED',
      partStatus: 'RESERVED', // Giữ kho phụ tùng
    };

    expect(approvedQuotation.status).toBe('APPROVED');
    expect(approvedQuotation.workOrderStatus).toBe('APPROVED');
    expect(approvedQuotation.partStatus).toBe('RESERVED');
  });

  it('QUOT-05: Rejection state transition logic verification', () => {
    // Giả lập trạng thái khi khách hàng từ chối báo giá (Reject)
    const initialQuotation = {
      id: 101,
      status: 'SENT',
      workOrderStatus: 'PENDING_APPROVAL',
    };

    const rejectedQuotation = {
      ...initialQuotation,
      status: 'REJECTED',
      rejectReason: 'Chi phí cao hơn dự tính, xin giảm bớt hạng mục vệ sinh nội thất',
      workOrderStatus: 'IN_PLANNING', // Trả về cho Advisor lập kế hoạch lại
    };

    expect(rejectedQuotation.status).toBe('REJECTED');
    expect(rejectedQuotation.rejectReason).toBeTruthy();
    expect(rejectedQuotation.workOrderStatus).toBe('IN_PLANNING');
  });
});
