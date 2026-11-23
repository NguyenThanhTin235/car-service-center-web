import api from '../axios';
import { downloadPdfBlob } from '@/utils/customerHelpers';

export interface ApproveQuotationResponse {
  success: boolean;
  code: string;
  message: string;
  data: any;
}

export interface RejectQuotationResponse {
  success: boolean;
  code: string;
  message: string;
  data: any;
}

/**
 * Khách hàng phê duyệt báo giá dịch vụ (Approve)
 */
export async function approveQuotation(id: number): Promise<ApproveQuotationResponse> {
  const response = await api.post(`/api/quotations/${id}/approve`);
  return response.data;
}

/**
 * Khách hàng từ chối báo giá và ghi rõ lý do (Reject)
 * rejectType: 'REVISE' (Yêu cầu điều chỉnh) hoặc 'CANCEL' (Hủy dịch vụ & Nhận lại xe)
 */
export async function rejectQuotation(
  id: number,
  rejectReason: string,
  rejectType: 'REVISE' | 'CANCEL' = 'REVISE'
): Promise<RejectQuotationResponse> {
  const response = await api.post(`/api/quotations/${id}/reject`, {
    reason: rejectReason,
    rejectReason,
    rejectType,
  });
  return response.data;
}

/**
 * Tải bản sao PDF báo giá có dấu giáp lai & cam kết kỹ thuật
 */
export async function downloadQuotationPdf(id: number, quotationNumber: string): Promise<void> {
  const response = await api.get(`/api/quotations/${id}/pdf`, {
    responseType: 'blob',
  });
  downloadPdfBlob(response.data, `Bao_Gia_${quotationNumber}.pdf`);
}
