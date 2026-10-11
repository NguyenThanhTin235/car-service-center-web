import api from '@/lib/axios';
import { ApiResponse } from './work-order.api';

export type MarkerType = 'DAMAGE' | 'RUST' | 'DENT' | 'SCRATCH' | 'MISSING' | 'OTHER';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FindingStatus = 'NEW' | 'LINKED_TO_JOB' | 'RESOLVED';

export interface FindingJob {
  id: number;
  name: string;
  status: string;
}

export interface JobFindingRelation {
  id: number;
  job_id: number;
  finding_id: number;
  job: FindingJob;
}

export interface InspectionFinding {
  id: number;
  inspection_id: number;
  status: FindingStatus;
  description: string;
  severity: Severity;
  recommendation?: string | null;
  evidence_urls: string[] | null;
  is_visible_to_customer: boolean;
  marker_type: MarkerType;
  part_name: string;
  coordinates: {
    x: number;
    y: number;
    part_id?: string;
  };
  created_by_id: number;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    full_name: string;
  };
  job_findings?: JobFindingRelation[];
}

export interface InspectionData {
  id: number;
  work_order_id: number;
  status: string;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    full_name: string;
  };
  findings: InspectionFinding[];
}

export interface CreateFindingPayload {
  marker_type: MarkerType;
  part_id: string;
  part_name: string;
  coordinates: {
    x: number;
    y: number;
    part_id?: string;
  };
  description?: string;
  severity?: Severity;
  evidence_urls?: string[];
  recommendation?: string;
  is_visible_to_customer?: boolean;
}

export interface UpdateFindingPayload {
  description?: string;
  severity?: Severity;
  evidence_urls?: string[];
  recommendation?: string;
  is_visible_to_customer?: boolean;
  job_id?: number | null;
}

/**
 * Lấy thông tin biên bản kiểm tra xe và danh sách findings
 */
export async function getInspection(workOrderId: number): Promise<ApiResponse<InspectionData>> {
  const response = await api.get(`/api/work-orders/${workOrderId}/inspection`);
  return response.data;
}

/**
 * Thêm một Finding / Marker mới trên sơ đồ xe
 */
export async function createFinding(
  workOrderId: number,
  data: CreateFindingPayload
): Promise<ApiResponse<InspectionFinding>> {
  const response = await api.post(`/api/work-orders/${workOrderId}/inspection/findings`, data);
  return response.data;
}

/**
 * Cập nhật thông tin Finding (ghi chú, hình ảnh minh chứng, mức độ)
 */
export async function updateFinding(
  workOrderId: number,
  findingId: number,
  data: UpdateFindingPayload
): Promise<ApiResponse<InspectionFinding>> {
  const response = await api.patch(
    `/api/work-orders/${workOrderId}/inspection/findings/${findingId}`,
    data
  );
  return response.data;
}

/**
 * Xóa Finding khỏi Inspection (có kiểm tra ràng buộc Job)
 */
export async function deleteFinding(
  workOrderId: number,
  findingId: number
): Promise<ApiResponse<{ id: number }>> {
  const response = await api.delete(
    `/api/work-orders/${workOrderId}/inspection/findings/${findingId}`
  );
  return response.data;
}

/**
 * Upload ảnh bằng chứng hư hỏng
 */
export async function uploadFindingPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'car_service/inspections');

  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.url;
}
