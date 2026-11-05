import api from '@/lib/axios';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

export interface InvoiceLine {
  id: number;
  lineType: 'PACKAGE' | 'LABOUR' | 'PART' | 'MATERIAL' | 'FEE';
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
  quotationNumber?: string | null;
  serviceName?: string | null;
  jobName?: string | null;
}

export interface InvoicePaymentRecord {
  id: number;
  paymentMethod: 'CASH' | 'CARD' | 'QR_TRANSFER';
  amount: number;
  tenderedAmount?: number | null;
  paidAt?: string | null;
  transactionRef?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  failureReason?: string | null;
  createdAt: string;
}

export interface InvoiceDetail {
  id: number;
  workOrderId: number;
  woNumber: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  discountAmount: number;
  discountReason?: string | null;
  taxAmount: number;
  totalAmount: number;
  amountDue: number;
  notes?: string | null;
  issuedAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    fullName: string;
    phone?: string;
    email?: string;
  };
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
    year: number;
    color?: string;
  };
  advisor: {
    id: number;
    fullName: string;
    phone?: string;
  };
  createdBy?: { id: number; full_name: string; email: string };
  issuedBy?: { id: number; full_name: string; email: string };
  lines: InvoiceLine[];
  payments: InvoicePaymentRecord[];
}

export interface BillingQueueSummary {
  pendingCount: number;
  draftCount: number;
  issuedCount: number;
  paidTodayCount: number;
  paidTodayRevenue: number;
}

export interface BillingQueueRecord {
  type: 'WORK_ORDER' | 'INVOICE';
  // Dành cho WORK_ORDER (Tab PENDING)
  workOrderId?: number;
  woNumber?: string;
  estimatedTotal?: number;
  services?: Array<{ id: number; name: string; pricing_type: string }>;
  quotations?: Array<{ id: number; quotation_number: string; grand_total: number }>;
  updatedAt?: string;
  // Dành cho INVOICE (Tab DRAFT, ISSUED, PAID, ALL)
  id?: number;
  invoiceNumber?: string;
  subtotal?: number;
  discountAmount?: number;
  discountReason?: string | null;
  totalAmount?: number;
  amountDue?: number;
  issuedAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  notes?: string | null;
  status?: InvoiceStatus | string;
  createdAt?: string;
  customer: {
    id: number;
    fullName: string;
    phone?: string;
    email?: string;
  };
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
    year: number;
  };
  advisor?: {
    id: number;
    fullName: string;
    phone?: string;
  };
  lastPayment?: {
    id: number;
    payment_method: string;
    amount: number;
    status: string;
    paid_at?: string;
  } | null;
}

export interface BillingQueueResponse {
  tab: 'PENDING' | 'DRAFT' | 'ISSUED' | 'PAID' | 'ALL';
  summary: BillingQueueSummary;
  records: BillingQueueRecord[];
  pagination: {
    total: number;
    count: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  };
}

export interface InvoicePreview {
  workOrderId: number;
  woNumber: string;
  customer: {
    id: number;
    fullName: string;
    phone?: string;
    email?: string;
  };
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
    year: number;
  };
  advisor: {
    id: number;
    fullName: string;
    phone?: string;
  };
  sourceQuotationNumbers: string[];
  subtotal: number;
  defaultDiscount: number;
  taxAmount: number;
  totalAmount: number;
  amountDue: number;
  reconciliationNotes: string[];
  lines: Array<{
    quotationLineId: number;
    woServiceId?: number | null;
    jobId?: number | null;
    lineType: 'PACKAGE' | 'LABOUR' | 'PART' | 'MATERIAL' | 'FEE';
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    sortOrder: number;
    serviceName?: string;
    quotationNumber?: string;
    isAdjustedFromQuotation?: boolean;
    plannedQuantity?: number;
  }>;
}

/**
 * Lấy danh sách hàng chờ và hóa đơn theo tab
 */
export async function getBillingQueue(params: {
  tab?: 'PENDING' | 'DRAFT' | 'ISSUED' | 'PAID' | 'ALL';
  search?: string;
  page?: number;
  limit?: number;
}) {
  const res = await api.get<{
    success: boolean;
    data: {
      tab: 'PENDING' | 'DRAFT' | 'ISSUED' | 'PAID' | 'ALL';
      summary: BillingQueueSummary;
      records: BillingQueueRecord[];
    };
    meta: {
      pagination: {
        total: number;
        count: number;
        totalPages: number;
        currentPage: number;
        perPage: number;
      };
    };
  }>('/api/invoices/billing-queue', { params });

  return {
    ...res.data.data,
    pagination: res.data.meta.pagination,
  };
}

/**
 * Xem trước bảng kê chi phí và các dòng hóa đơn dự kiến trước khi tạo nháp
 */
export async function getInvoicePreview(workOrderId: number) {
  const res = await api.get<{
    success: boolean;
    data: InvoicePreview;
  }>('/api/invoices/preview', { params: { workOrderId } });
  return res.data.data;
}

/**
 * Tạo hóa đơn nháp
 */
export async function createInvoiceDraft(payload: { workOrderId: number; notes?: string }) {
  const res = await api.post<{
    success: boolean;
    data: any;
    message: string;
  }>('/api/invoices', payload);
  return res.data;
}

/**
 * Cập nhật chiết khấu cho hóa đơn nháp
 */
export async function updateInvoiceDraft(
  id: number,
  payload: {
    discountAmount?: number;
    discountPercent?: number;
    discountReason: string;
    notes?: string;
  }
) {
  const res = await api.patch<{
    success: boolean;
    data: any;
    message: string;
  }>(`/api/invoices/${id}`, payload);
  return res.data;
}

/**
 * Phát hành hóa đơn chính thức
 */
export async function issueInvoice(id: number) {
  const res = await api.post<{
    success: boolean;
    data: any;
    message: string;
  }>(`/api/invoices/${id}/issue`);
  return res.data;
}

/**
 * Hủy hóa đơn
 */
export async function cancelInvoice(id: number, reason: string) {
  const res = await api.post<{
    success: boolean;
    data: any;
    message: string;
  }>(`/api/invoices/${id}/cancel`, { reason });
  return res.data;
}

/**
 * Lấy chi tiết hóa đơn theo ID
 */
export async function getInvoiceById(id: number) {
  const res = await api.get<{
    success: boolean;
    data: InvoiceDetail;
  }>(`/api/invoices/${id}`);
  return res.data.data;
}

/**
 * Tải file PDF hóa đơn
 */
export async function downloadInvoicePdfBlob(id: number) {
  const res = await api.get(`/api/invoices/${id}/pdf`, {
    responseType: 'blob',
  });
  return res.data;
}

