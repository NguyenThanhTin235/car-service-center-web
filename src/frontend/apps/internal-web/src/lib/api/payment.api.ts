import api from '@/lib/axios';

export interface ManualPaymentPayload {
  paymentMethod: 'CASH' | 'CARD';
  amount: number;
  tenderedAmount?: number;
  transactionRef?: string;
}

export interface ManualPaymentResponse {
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  paymentMethod: string;
  amount: number;
  tenderedAmount: number;
  changeAmount: number;
  transactionRef: string;
  paidAt: string;
  invoiceStatus: string;
  workOrderStatus: string;
  message: string;
}

export interface VnpayPaymentResponse {
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  txnRef: string;
  paymentUrl: string;
  amount: number;
  expiresAt: string;
  message: string;
}

export interface PaymentStatusResponse {
  id: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number;
  failureReason?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
    amountDue: number;
  };
  workOrder: {
    id: number;
    woNumber: string;
    status: string;
  };
}

/**
 * Ghi nhận thanh toán thủ công (Tiền mặt / Thẻ ngân hàng)
 */
export async function recordManualPayment(invoiceId: number, payload: ManualPaymentPayload) {
  const res = await api.post<{
    success: boolean;
    data: ManualPaymentResponse;
    message: string;
  }>(`/api/invoices/${invoiceId}/payments`, payload);
  return res.data.data;
}

/**
 * Tạo mã QR / URL thanh toán VNPay
 */
export async function createVnpayPayment(invoiceId: number) {
  const res = await api.post<{
    success: boolean;
    data: VnpayPaymentResponse;
    message: string;
  }>(`/api/invoices/${invoiceId}/payments/vnpay`);
  return res.data.data;
}

/**
 * Tra cứu trạng thái thanh toán (hỗ trợ polling UI)
 */
export async function getPaymentStatus(paymentId: number) {
  const res = await api.get<{
    success: boolean;
    data: PaymentStatusResponse;
  }>(`/api/payments/${paymentId}/status`);
  return res.data.data;
}

/**
 * Hủy giao dịch thanh toán đang ở trạng thái PENDING
 */
export async function cancelPendingPayment(paymentId: number, reason?: string) {
  const res = await api.post<{
    success: boolean;
    data: any;
    message: string;
  }>(`/api/payments/${paymentId}/cancel`, { reason });
  return res.data;
}

/**
 * Giả lập thanh toán VNPay QR thành công (chỉ cho dev / test)
 */
export async function simulateQrSuccess(paymentId: number) {
  const res = await api.post<{
    success: boolean;
    data: any;
    message: string;
  }>(`/api/payments/${paymentId}/simulate-success`);
  return res.data;
}

/**
 * Xác thực kết quả thanh toán Return URL từ VNPay
 */
export async function verifyVnpayReturn(params: Record<string, string>) {
  const res = await api.get<{
    success: boolean;
    code: number;
    message: string;
    data: {
      isSuccess: boolean;
      paymentId: number;
      invoiceId: number;
      invoiceNumber: string;
      amount: number;
      transactionRef: string;
      vnpayTransactionNo?: string | null;
      responseCode: string;
      message: string;
    };
  }>('/api/payments/vnpay/return', { params });
  return res.data.data;
}

