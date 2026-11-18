import api from '../axios';

/**
 * Tải file PDF hóa đơn theo ID (trả về Blob)
 */
export async function downloadInvoicePdfBlob(id: number): Promise<Blob> {
  const res = await api.get(`/api/invoices/${id}/pdf`, {
    responseType: 'blob',
  });
  return res.data;
}

