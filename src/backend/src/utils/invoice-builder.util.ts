import { LineType } from '@prisma/client';
import { calculatePricingTotals, PricingLineItemInput } from './pricing-calculator.util';

export interface BuiltInvoiceLine {
  quotationLineId: number;
  woServiceId?: number | null;
  jobId?: number | null;
  lineType: LineType;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
  serviceName?: string;
  quotationNumber?: string;
  isAdjustedFromQuotation?: boolean;
  plannedQuantity?: number;
}

export interface BuildInvoiceResult {
  lines: BuiltInvoiceLine[];
  subtotal: number;
  defaultDiscount: number;
  taxAmount: number; // Zero-tax
  totalAmount: number;
  amountDue: number;
  sourceQuotationNumbers: string[];
  reconciliationNotes: string[];
}

/**
 * Xây dựng danh sách các dòng hóa đơn từ các báo giá APPROVED (PRIMARY + SUPPLEMENTARY)
 * Áp dụng đối soát số lượng phụ tùng thực tế xuất dùng (Case D)
 * và tổng hợp chiết khấu mặc định
 */
export function buildInvoiceLinesFromQuotations(approvedQuotations: any[]): BuildInvoiceResult {
  const lines: BuiltInvoiceLine[] = [];
  const reconciliationNotes: string[] = [];
  const sourceQuotationNumbers: string[] = [];
  let defaultDiscount = 0;

  let globalSortOrder = 0;

  for (const quote of approvedQuotations) {
    if (quote.status !== 'APPROVED') continue;

    sourceQuotationNumbers.push(quote.quotation_number);
    defaultDiscount += Number(quote.discount_amount || 0);

    const quoteLines = quote.lines || [];
    for (const ql of quoteLines) {
      let finalQuantity = Number(ql.quantity) || 0;
      let isAdjusted = false;
      const plannedQuantity = Number(ql.quantity) || 0;

      // Case D: Đối soát số lượng phụ tùng/vật tư xuất dùng thực tế
      if ((ql.line_type === 'PART' || ql.line_type === 'MATERIAL') && ql.job_part) {
        const issued = Number(ql.job_part.issued_quantity) || 0;
        const returned = Number(ql.job_part.returned_quantity) || 0;
        const used = Math.max(0, issued - returned);

        // Nếu đã có ghi nhận xuất kho thực tế (issued > 0), tính theo số lượng thực dùng
        if (issued > 0 && used !== plannedQuantity) {
          finalQuantity = used;
          isAdjusted = true;
          reconciliationNotes.push(
            `Hạng mục "${ql.description}": Số lượng thực dùng là ${used} (dự kiến ${plannedQuantity}, xuất ${issued}, hoàn ${returned})`
          );
        }
      }

      const unitPrice = Math.round(Number(ql.snapshot_unit_price || 0));
      const amount = Math.round(finalQuantity * unitPrice);

      lines.push({
        quotationLineId: ql.id,
        woServiceId: ql.wo_service_id || null,
        jobId: ql.job_id || null,
        lineType: ql.line_type as LineType,
        description: ql.description,
        quantity: finalQuantity,
        unitPrice,
        amount,
        sortOrder: globalSortOrder++,
        serviceName: ql.wo_service?.name || ql.job?.wo_service?.name,
        quotationNumber: quote.quotation_number,
        isAdjustedFromQuotation: isAdjusted,
        plannedQuantity,
      });
    }
  }

  // Chuyển sang Pricing Calculator để tính Subtotal, Discount, Tax = 0, Total
  const pricingInput: PricingLineItemInput[] = lines.map((l) => ({
    lineType: l.lineType,
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    sortOrder: l.sortOrder,
    woServiceId: l.woServiceId || undefined,
    jobId: l.jobId || undefined,
  }));

  const pricingCalc = calculatePricingTotals({
    lines: pricingInput,
    discountAmount: defaultDiscount,
  });

  return {
    lines,
    subtotal: pricingCalc.subtotal,
    defaultDiscount: pricingCalc.discountAmount,
    taxAmount: 0,
    totalAmount: pricingCalc.grandTotal,
    amountDue: pricingCalc.grandTotal,
    sourceQuotationNumbers,
    reconciliationNotes,
  };
}

