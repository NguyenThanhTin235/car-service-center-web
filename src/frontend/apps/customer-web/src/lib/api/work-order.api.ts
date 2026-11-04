import api from '../axios';

/**
 * Tải file PDF Biên bản bàn giao xe theo Work Order ID (trả về Blob)
 */
export async function downloadHandoverPdfBlob(workOrderId: number): Promise<Blob> {
  const res = await api.get(`/api/work-orders/${workOrderId}/handover-pdf`, {
    responseType: 'blob',
  });
  return res.data;
}

