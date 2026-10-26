import api from '../axios';

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
 */
export async function rejectQuotation(id: number, rejectReason: string): Promise<RejectQuotationResponse> {
  const response = await api.post(`/api/quotations/${id}/reject`, {
    rejectReason,
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

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bao_Gia_${quotationNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
