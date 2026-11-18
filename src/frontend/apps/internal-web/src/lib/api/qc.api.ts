import api from '@/lib/axios';

export interface QcTemplateItem {
  id: number;
  name: string;
}

export interface QcJobInfo {
  id: number;
  name: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REWORK' | 'PASSED';
  isRework: boolean;
  parentJobId: number | null;
  reworkSourceQcItemId: number | null;
  technician: string;
}

export interface QcEvaluatedItem {
  id: number;
  templateItemId: number | null;
  itemName: string;
  result: 'PASS' | 'FAIL';
  notes: string | null;
  reworkDescription?: string;
  reworkJobCount: number;
  reworkJob?: {
    id: number;
    name: string;
    status: string;
    description?: string | null;
  } | null;
}

export interface QcRecordDetail {
  id: number;
  overallResult: 'PASS' | 'FAIL';
  notes: string | null;
  createdAt: string;
  inspectorName: string;
  items: QcEvaluatedItem[];
}

export interface QcServiceItem {
  id: number;
  serviceId: number | null;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  pricingType: string;
  jobs: QcJobInfo[];
  template: {
    id: number | null;
    name: string;
    items: QcTemplateItem[];
  };
  latestQc: QcRecordDetail | null;
}

export interface QcDetailsResponse {
  workOrder: {
    id: number;
    woNumber: string;
    status: string;
    licensePlate: string;
    vehicleModel: string;
    customerName: string;
    advisorName: string;
  };
  stats: {
    totalServices: number;
    passedServices: number;
    totalJobs: number;
    completedJobs: number;
    passedJobs: number;
    reworkJobs: number;
    progressPercent: number;
    canRequestBilling: boolean;
    isBillingRequested: boolean;
  };
  services: QcServiceItem[];
}

export interface SubmitQcPayload {
  woServiceId: number;
  templateId?: number | null;
  notes?: string;
  items: Array<{
    templateItemId?: number;
    itemName: string;
    result: 'PASS' | 'FAIL';
    notes?: string;
    reworkJobName?: string;
    reworkDescription?: string;
    parentJobId?: number;
    assignedEmployeeId?: number;
  }>;
}

/**
 * Lấy chi tiết thông tin kiểm định KCS của Work Order
 */
export async function getWOQcDetails(workOrderId: number) {
  const res = await api.get<{
    success: boolean;
    message: string;
    data: QcDetailsResponse;
  }>(`/api/work-orders/${workOrderId}/qc`);
  return res.data;
}

/**
 * Gửi đánh giá kiểm định chất lượng (QC) cho một dịch vụ hoặc toàn bộ các dịch vụ (batch)
 */
export async function submitQcEvaluation(
  workOrderId: number,
  payload: SubmitQcPayload | { evaluations: SubmitQcPayload[] }
) {
  const res = await api.post<{
    success: boolean;
    message: string;
    data: any;
  }>(`/api/work-orders/${workOrderId}/qc`, payload);
  return res.data;
}

/**
 * Gửi đánh giá kiểm định chất lượng (QC) hàng loạt cho tất cả dịch vụ
 */
export async function submitBatchQcEvaluation(
  workOrderId: number,
  payload: { evaluations: SubmitQcPayload[] }
) {
  const res = await api.post<{
    success: boolean;
    message: string;
    data: any;
  }>(`/api/work-orders/${workOrderId}/qc`, payload);
  return res.data;
}

/**
 * Xác nhận nghiệm thu KCS đạt chuẩn và gửi yêu cầu lập hóa đơn (Billing Gate)
 */
export async function requestBilling(workOrderId: number, notes?: string) {
  const res = await api.post<{
    success: boolean;
    message: string;
    data: any;
  }>(`/api/work-orders/${workOrderId}/request-billing`, { notes });
  return res.data;
}

