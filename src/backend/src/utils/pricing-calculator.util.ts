/**
 * Module Tính Giá Báo Giá & Hóa Đơn (Pricing Calculator)
 * Quy chế Zero-Tax: Thuế suất = 0%, Tiền thuế = 0 đ.
 * Tiền công: Fix cứng trọn gói (Fixed price), không tính theo giờ.
 * 100% phụ tùng: Xuất từ kho của trung tâm.
 */

export type LineType = 'PACKAGE' | 'LABOUR' | 'PART' | 'MATERIAL' | 'FEE';

export interface PricingLineItemInput {
  id?: number;
  lineType: LineType;
  description: string;
  quantity: number;
  unitPrice: number;
  woServiceId?: number;
  jobId?: number;
  jobLabourId?: number;
  jobPartId?: number;
  sortOrder?: number;
}

export type MemberTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'VIP';

export interface PricingCalculationInput {
  lines: PricingLineItemInput[];
  discountAmount?: number;
  discountPercent?: number;
  memberTier?: MemberTier;
}

export interface CalculatedLineItem extends PricingLineItemInput {
  amount: number;
}

export interface PricingCalculationResult {
  subtotal: number;
  discountAmount: number;
  taxRate: number; // Luôn bằng 0
  taxAmount: number; // Luôn bằng 0
  grandTotal: number;
  lines: CalculatedLineItem[];
  breakdown: {
    totalLabour: number;
    totalParts: number;
    totalPackage: number;
    totalFees: number;
  };
}

/**
 * Tính toán chi phí, chiết khấu và tổng thanh toán theo chuẩn Zero-Tax
 */
export function calculatePricingTotals(input: PricingCalculationInput): PricingCalculationResult {
  let subtotal = 0;
  let totalLabour = 0;
  let totalParts = 0;
  let totalPackage = 0;
  let totalFees = 0;

  // 1. Tính toán thành tiền từng dòng
  const lines: CalculatedLineItem[] = (input.lines || []).map((line, index) => {
    const qty = Math.max(0, Number(line.quantity) || 0);
    const unitPrice = Math.max(0, Number(line.unitPrice) || 0);
    const amount = Math.round(qty * unitPrice);

    subtotal += amount;

    if (line.lineType === 'LABOUR') {
      totalLabour += amount;
    } else if (line.lineType === 'PART' || line.lineType === 'MATERIAL') {
      totalParts += amount;
    } else if (line.lineType === 'PACKAGE') {
      totalPackage += amount;
    } else if (line.lineType === 'FEE') {
      totalFees += amount;
    }

    return {
      ...line,
      quantity: qty,
      unitPrice,
      amount,
      sortOrder: line.sortOrder !== undefined ? line.sortOrder : index,
    };
  });

  // 2. Tính toán chiết khấu
  let calculatedDiscount = 0;

  // Ưu tiên 1: Chiết khấu trực tiếp theo %
  if (input.discountPercent !== undefined && input.discountPercent > 0) {
    const validPct = Math.min(Math.max(0, Number(input.discountPercent)), 100);
    calculatedDiscount = Math.round((subtotal * validPct) / 100);
  }
  // Ưu tiên 2: Chiết khấu theo hạng thành viên (Member Tier)
  else if (input.memberTier && input.memberTier !== 'STANDARD') {
    switch (input.memberTier) {
      case 'SILVER':
        // Giảm 5% tiền công
        calculatedDiscount = Math.round(totalLabour * 0.05);
        break;
      case 'GOLD':
        // Giảm 10% tiền công
        calculatedDiscount = Math.round(totalLabour * 0.10);
        break;
      case 'VIP':
        // Giảm 15% tiền công + 5% phụ tùng
        calculatedDiscount = Math.round(totalLabour * 0.15) + Math.round(totalParts * 0.05);
        break;
    }
  }
  // Ưu tiên 3: Chiết khấu số tiền mặt cố định
  else if (input.discountAmount !== undefined && input.discountAmount > 0) {
    calculatedDiscount = Math.round(Number(input.discountAmount));
  }

  // Chặn trần chiết khấu: không vượt quá Subtotal và không âm
  const finalDiscount = Math.max(0, Math.min(calculatedDiscount, subtotal));

  // 3. Tổng thanh toán cuối cùng (Không thuế: Tax = 0)
  const grandTotal = Math.max(0, subtotal - finalDiscount);

  return {
    subtotal,
    discountAmount: finalDiscount,
    taxRate: 0,
    taxAmount: 0,
    grandTotal,
    lines,
    breakdown: {
      totalLabour,
      totalParts,
      totalPackage,
      totalFees,
    },
  };
}
