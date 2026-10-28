import { describe, it, expect } from 'vitest';
import {
  calculatePricingTotals,
  PricingLineItemInput,
} from '../../src/utils/pricing-calculator.util';

describe('Pricing Calculator (Zero-Tax Policy & Fixed Labour Price)', () => {
  it('TH-01: Tính giá cơ bản không chiết khấu, không thuế', () => {
    const lines: PricingLineItemInput[] = [
      {
        lineType: 'LABOUR',
        description: 'Tiền công bảo dưỡng',
        quantity: 1,
        unitPrice: 200000, // Cố định
      },
      {
        lineType: 'PART',
        description: 'Lọc nhớt chính hãng',
        quantity: 1,
        unitPrice: 150000,
      },
      {
        lineType: 'PART',
        description: 'Dầu động cơ 4L',
        quantity: 4,
        unitPrice: 120000,
      },
    ];

    const result = calculatePricingTotals({ lines });

    expect(result.subtotal).toBe(200000 + 150000 + 4 * 120000); // 830,000
    expect(result.discountAmount).toBe(0);
    expect(result.taxRate).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.grandTotal).toBe(830000);
    expect(result.breakdown.totalLabour).toBe(200000);
    expect(result.breakdown.totalParts).toBe(630000);
  });

  it('TH-02: Chiết khấu tiền mặt cố định và chặn âm', () => {
    const lines: PricingLineItemInput[] = [
      {
        lineType: 'LABOUR',
        description: 'Tiền công sửa chữa',
        quantity: 1,
        unitPrice: 500000,
      },
    ];

    // Chiết khấu 100k
    const res1 = calculatePricingTotals({ lines, discountAmount: 100000 });
    expect(res1.subtotal).toBe(500000);
    expect(res1.discountAmount).toBe(100000);
    expect(res1.grandTotal).toBe(400000);

    // Chiết khấu vượt quá Subtotal -> phải bị chặn tại Subtotal, GrandTotal = 0
    const res2 = calculatePricingTotals({ lines, discountAmount: 700000 });
    expect(res2.subtotal).toBe(500000);
    expect(res2.discountAmount).toBe(500000);
    expect(res2.grandTotal).toBe(0);
  });

  it('TH-03: Chiết khấu phần trăm làm tròn nguyên VND', () => {
    const lines: PricingLineItemInput[] = [
      {
        lineType: 'PACKAGE',
        description: 'Gói chăm sóc xe chuyên sâu',
        quantity: 1,
        unitPrice: 1250000,
      },
    ];

    // Giảm 15% của 1,250,000 = 187,500
    const result = calculatePricingTotals({ lines, discountPercent: 15 });
    expect(result.subtotal).toBe(1250000);
    expect(result.discountAmount).toBe(187500);
    expect(result.grandTotal).toBe(1250000 - 187500);
    expect(result.taxAmount).toBe(0);
  });

  it('TH-04: Chiết khấu theo hạng thành viên Member Tier', () => {
    const lines: PricingLineItemInput[] = [
      {
        lineType: 'LABOUR',
        description: 'Tiền công đồng sơn',
        quantity: 1,
        unitPrice: 1000000,
      },
      {
        lineType: 'PART',
        description: 'Sơn lót & Vật tư',
        quantity: 1,
        unitPrice: 2000000,
      },
    ];

    // SILVER: Giảm 5% tiền công = 50,000
    const resSilver = calculatePricingTotals({ lines, memberTier: 'SILVER' });
    expect(resSilver.discountAmount).toBe(50000);
    expect(resSilver.grandTotal).toBe(3000000 - 50000);

    // GOLD: Giảm 10% tiền công = 100,000
    const resGold = calculatePricingTotals({ lines, memberTier: 'GOLD' });
    expect(resGold.discountAmount).toBe(100000);
    expect(resGold.grandTotal).toBe(3000000 - 100000);

    // VIP: Giảm 15% tiền công (150,000) + 5% phụ tùng (100,000) = 250,000
    const resVip = calculatePricingTotals({ lines, memberTier: 'VIP' });
    expect(resVip.discountAmount).toBe(250000);
    expect(resVip.grandTotal).toBe(3000000 - 250000);
  });

  it('TH-05: Hàng bảo hành / quà tặng đơn giá 0 đ', () => {
    const lines: PricingLineItemInput[] = [
      {
        lineType: 'PART',
        description: 'Bảo hành thay còi xe',
        quantity: 1,
        unitPrice: 0,
      },
      {
        lineType: 'LABOUR',
        description: 'Công kiểm tra bảo hành',
        quantity: 1,
        unitPrice: 0,
      },
    ];

    const result = calculatePricingTotals({ lines });
    expect(result.subtotal).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  it('TH-06: Bất biến tài chính (Zero-Tax Invariant)', () => {
    const lines: PricingLineItemInput[] = [
      { lineType: 'PACKAGE', description: 'Gói định kỳ', quantity: 1, unitPrice: 850000 },
      { lineType: 'FEE', description: 'Phí cứu hộ', quantity: 1, unitPrice: 300000 },
    ];

    const result = calculatePricingTotals({ lines, discountPercent: 10 });
    // Bất biến: GrandTotal + DiscountAmount === Subtotal
    expect(result.grandTotal + result.discountAmount).toBe(result.subtotal);
    // Bất biến: Tax luôn bằng 0
    expect(result.taxAmount).toBe(0);
    expect(result.taxRate).toBe(0);
  });
});
