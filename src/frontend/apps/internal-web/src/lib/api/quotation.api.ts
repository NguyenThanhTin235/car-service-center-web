import api from '@/lib/axios';

export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface QuotationLine {
  id: number;
  lineType: 'PACKAGE' | 'LABOUR' | 'PART' | 'MATERIAL' | 'FEE';
  description: string;
  quantity: number;
  snapshotUnitPrice: number;
  amount: number;
  sortOrder: number;
  woServiceId?: number;
  woServiceName?: string;
  jobId?: number;
  jobName?: string;
  jobLabourId?: number;
  jobPartId?: number;
  partItem?: {
    id: number;
    sku: string;
    name: string;
  } | null;
}

export interface Quotation {
  id: number;
  workOrderId: number;
  quotationNumber: string;
  quotationType: 'PRIMARY' | 'SUPPLEMENTARY';
  parentQuotationId: number | null;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  sentAt: string | null;
  approvedAt: string | null;
  approvedBy: { id: number; full_name: string } | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  snapshotAt: string | null;
  createdBy: { id: number; full_name: string; phone?: string };
  createdAt: string;
  updatedAt: string;
  lines: QuotationLine[];
  workOrder?: any;
}

export interface CreateQuotationPayload {
  discountAmount?: number;
  discountPercent?: number;
  quotationType?: 'PRIMARY' | 'SUPPLEMENTARY';
  parentQuotationId?: number;
}

export interface UpdateQuotationPayload {
  discountAmount?: number;
  discountPercent?: number;
  lines?: any[];
}

/**
 * Lấy danh sách toàn bộ báo giá của Phiếu công việc
 */
export async function getWOQuotations(workOrderId: number): Promise<ApiResponse<Quotation[]>> {
  const response = await api.get(`/api/quotations/work-orders/${workOrderId}`);
  return response.data;
}

/**
 * Lấy chi tiết một Báo giá
 */
export async function getQuotationById(id: number): Promise<ApiResponse<Quotation>> {
  const response = await api.get(`/api/quotations/${id}`);
  return response.data;
}

/**
 * Tạo báo giá tự động từ kế hoạch công việc (UC-37)
 */
export async function createQuotation(
  workOrderId: number,
  payload?: CreateQuotationPayload
): Promise<ApiResponse<Quotation>> {
  const response = await api.post(`/api/quotations/work-orders/${workOrderId}`, payload || {});
  return response.data;
}

/**
 * Cập nhật báo giá (chiết khấu, ghi chú) (UC-39)
 */
export async function updateQuotation(
  id: number,
  payload: UpdateQuotationPayload
): Promise<ApiResponse<Quotation>> {
  const response = await api.patch(`/api/quotations/${id}`, payload);
  return response.data;
}

/**
 * Gửi báo giá cho khách hàng xem xét
 */
export async function sendQuotation(id: number): Promise<ApiResponse<Quotation>> {
  const response = await api.post(`/api/quotations/${id}/send`);
  return response.data;
}

/**
 * Phê duyệt báo giá (UC-39)
 */
export async function approveQuotation(id: number): Promise<ApiResponse<Quotation>> {
  const response = await api.post(`/api/quotations/${id}/approve`);
  return response.data;
}

/**
 * Từ chối báo giá (UC-39)
 */
export async function rejectQuotation(id: number, reason: string): Promise<ApiResponse<Quotation>> {
  const response = await api.post(`/api/quotations/${id}/reject`, { reason });
  return response.data;
}

/**
 * Hủy báo giá nháp (UC-40)
 */
export async function cancelQuotation(id: number): Promise<ApiResponse<any>> {
  const response = await api.post(`/api/quotations/${id}/cancel`);
  return response.data;
}

/**
 * Lấy link tải / in trực tiếp file PDF
 */
export function getQuotationPdfUrl(id: number): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return `${baseUrl}/api/quotations/${id}/pdf`;
}

/**
 * Xuất hoặc In trực tiếp file PDF Báo giá (kèm Bearer token)
 */
export async function exportOrPrintQuotationPdf(
  id: number,
  quotationNumber: string,
  action: 'print' | 'download' = 'print'
): Promise<void> {
  const response = await api.get(`/api/quotations/${id}/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const fileUrl = window.URL.createObjectURL(blob);

  if (action === 'print') {
    const printWindow = window.open(fileUrl, '_blank');
    if (!printWindow) {
      // Fallback nếu trình duyệt chặn popup
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = `Bao_Gia_${quotationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } else {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `Bao_Gia_${quotationNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

