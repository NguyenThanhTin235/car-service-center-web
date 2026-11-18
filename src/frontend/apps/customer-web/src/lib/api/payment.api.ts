import api from '../axios';

export interface PaymentStatusResponse {
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number;
  paidAt?: string | null;
  transactionRef?: string | null;
  isCleared: boolean;
  failureReason?: string | null;
}

/**
 * Kiểm tra trạng thái giao dịch thanh toán
 */
export async function getPaymentStatus(paymentId: number): Promise<PaymentStatusResponse> {
  const res = await api.get(`/api/payments/${paymentId}/status`);
  return res.data.data;
}

/**
 * Hủy giao dịch thanh toán đang ở trạng thái PENDING
 */
export async function cancelPendingPayment(paymentId: number, reason?: string) {
  const res = await api.post(`/api/payments/${paymentId}/cancel`, { reason });
  return res.data.data;
}

/**
 * Giả lập thanh toán thành công (dành cho Test / Demo sandbox)
 */
export async function simulateQrSuccess(paymentId: number) {
  const res = await api.post(`/api/payments/${paymentId}/simulate-success`);
  return res.data.data;
}

export interface SepayPaymentResponse {
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  checkoutUrl: string;
  fields: Record<string, any>;
  expiresAt?: string;
  bankInfo?: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    transferContent: string;
    amount: number;
    qrCodeUrl: string;
  };
}

export interface InvoicePaymentStatusResponse {
  invoiceId: number;
  invoiceNumber: string;
  status: string;
  amountDue: number;
  totalAmount: number;
  isPaid: boolean;
  workOrderStatus?: string | null;
  payment?: {
    id: number;
    status: string;
    amount: number;
    paymentMethod: string;
    transactionRef?: string;
    paidAt?: string;
  } | null;
}

/**
 * Khởi tạo phiên thanh toán SePay (VietQR / Napas) cho hóa đơn
 */
export async function createSepayPayment(
  invoiceId: number,
  returnUrl?: string,
  cancelUrl?: string
): Promise<SepayPaymentResponse> {
  const res = await api.post(`/api/invoices/${invoiceId}/payments/sepay`, {
    returnUrl,
    cancelUrl,
  });
  return res.data.data;
}

/**
 * Tra cứu trạng thái thanh toán hiện tại của hóa đơn
 */
export async function getInvoicePaymentStatus(
  invoiceId: number
): Promise<InvoicePaymentStatusResponse> {
  const res = await api.get(`/api/invoices/${invoiceId}/payments/status`);
  return res.data.data;
}

