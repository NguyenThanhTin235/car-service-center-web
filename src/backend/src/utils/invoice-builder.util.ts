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
 * Xây dựng danh sách các dòng hóa đơn từ báo giá APPROVED cuối cùng của khách hàng
 * (Tránh chồng lặp nhiều phiên bản/revision báo giá của cùng một phiếu dịch vụ)
 * Áp dụng đối soát số lượng phụ tùng thực tế xuất dùng (Case D)
 * và lấy mức chiết khấu từ báo giá đó
 */
export function buildInvoiceLinesFromQuotations(approvedQuotations: any[]): BuildInvoiceResult {
  const lines: BuiltInvoiceLine[] = [];
  const reconciliationNotes: string[] = [];
  const sourceQuotationNumbers: string[] = [];

  // Lọc danh sách báo giá APPROVED
  const approvedList = (approvedQuotations || []).filter((q) => q.status === 'APPROVED');
  if (approvedList.length === 0) {
    return {
      lines: [],
      subtotal: 0,
      defaultDiscount: 0,
      taxAmount: 0,
      totalAmount: 0,
      amountDue: 0,
      sourceQuotationNumbers: [],
      reconciliationNotes: [],
    };
  }

  // Sắp xếp tìm báo giá cuối cùng khách đã duyệt:
  // Ưu tiên 1: approved_at mới nhất
  // Ưu tiên 2: created_at mới nhất
  // Ưu tiên 3: id lớn nhất
  const sortedQuotes = [...approvedList].sort((a, b) => {
    const timeApprovedA = a.approved_at ? new Date(a.approved_at).getTime() : 0;
    const timeApprovedB = b.approved_at ? new Date(b.approved_at).getTime() : 0;
    if (timeApprovedB !== timeApprovedA) return timeApprovedB - timeApprovedA;

    const timeCreatedA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeCreatedB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeCreatedB !== timeCreatedA) return timeCreatedB - timeCreatedA;

    return (b.id || 0) - (a.id || 0);
  });

  const quote = sortedQuotes[0]; // Báo giá cuối cùng khách đã duyệt
  sourceQuotationNumbers.push(quote.quotation_number);
  const defaultDiscount = Number(quote.discount_amount || 0);

  let globalSortOrder = 0;
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
