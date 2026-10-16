import api from '@/lib/axios';

export interface IntakeQueueItem {
  id: number;
  intake_type: 'WALK_IN' | 'TOW_IN' | 'APPOINTMENT';
  status: 'QUEUED' | 'CONVERTED' | 'CANCELLED';
  arrived_at: string;
  notes: string | null;
  customer: {
    id: number;
    full_name: string;
    phone: string;
    email: string;
  };
  vehicle: {
    id: number;
    license_plate: string;
    make: string;
    model: string;
    color: string | null;
    vehicle_size: string;
  };
  services: {
    id: number;
    service: {
      id: number;
      name: string;
      category?: {
        id: number;
        name: string;
      };
    };
  }[];
  created_by: {
    id: number;
    full_name: string;
  };
  work_order?: {
    id: number;
    wo_number: string;
    status?: string;
    services?: {
      id: number;
      name: string;
      pricing_type?: string;
      status?: string;
      service?: {
        id: number;
        name: string;
        category?: {
          id: number;
          name: string;
        };
      } | null;
    }[];
  } | null;
}

export interface WorkOrder {
  id: number;
  wo_number: string;
  status: string;
  source_type: string;
  customer: {
    id: number;
    full_name: string;
    phone: string;
    email: string;
  };
  vehicle: {
    id: number;
    license_plate: string;
    make: string;
    model: string;
    year: number | null;
    color: string | null;
    vehicle_size: string;
  };
  appointment?: {
    id: number;
    scheduled_date: string;
    scheduled_time: string;
  } | null;
  check_in?: CheckIn | null;
  intake_record?: {
    id: number;
    notes: string;
    services?: {
      id: number;
      service: {
        id: number;
        name: string;
        category?: {
          name: string;
        };
      };
    }[];
  } | null;
  services?: WoService[];
  inspections?: Array<{
    id: number;
    status: string;
    findings: Array<{
      id: number;
      marker_type: string;
      part_name: string | null;
      description: string;
      severity: string;
      status: string;
      evidence_urls: string[] | null;
      job_findings?: Array<{
        id: number;
        job_id: number;
        job?: { id: number; name: string };
      }>;
    }>;
  }>;
  advisor: {
    id: number;
    full_name: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
  invoice?: {
    id: number;
    status: string;
  } | null;
}

export interface CheckIn {
  id: number;
  work_order_id: number;
  mileage: number;
  fuel_level: 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTER' | 'FULL';
  complaint: string;
  belongings: string | null;
  exterior_condition: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED' | 'REVISION_REQUIRED';
  rejection_reason?: string | null;
  evidence_urls: string[] | null;
  confirmed_by_customer_id?: number | null;
  confirmed_at?: string | null;
  created_at: string;
}

export interface PaginationMeta {
  total: number;
  count: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  meta?: { pagination: PaginationMeta };
  timestamp: number;
}

/**
 * Lấy danh sách hàng đợi tiếp nhận (IntakeRecord status=QUEUED)
 */
export async function getIntakeQueue(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<IntakeQueueItem[]>> {
  const response = await api.get('/api/work-orders/intake-queue', { params });
  return response.data;
}

/**
 * Lấy danh sách phiếu công việc
 */
export async function getWorkOrders(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<WorkOrder[]>> {
  const response = await api.get('/api/work-orders', { params });
  return response.data;
}

/**
 * Tạo phiếu công việc từ phiếu tiếp nhận
 */
export async function createWorkOrder(intakeRecordId: number): Promise<ApiResponse<WorkOrder>> {
  const response = await api.post('/api/work-orders', { intakeRecordId });
  return response.data;
}

/**
 * Lấy chi tiết phiếu công việc
 */
export async function getWorkOrderById(id: number): Promise<ApiResponse<WorkOrder>> {
  const response = await api.get(`/api/work-orders/${id}`);
  return response.data;
}

/**
 * Lấy thông tin CheckIn theo Work Order ID
 */
export async function getCheckIn(workOrderId: number): Promise<ApiResponse<CheckIn>> {
  const response = await api.get(`/api/work-orders/${workOrderId}/check-in`);
  return response.data;
}

/**
 * Tạo mới hoặc cập nhật CheckIn
 */
export async function saveCheckIn(workOrderId: number, data: Partial<CheckIn>): Promise<ApiResponse<CheckIn>> {
  const response = await api.post(`/api/work-orders/${workOrderId}/check-in`, data);
  return response.data;
}

/**
 * Xác nhận CheckIn (Khách hàng ký)
 */
export async function confirmCheckIn(workOrderId: number): Promise<ApiResponse<CheckIn>> {
  const response = await api.post(`/api/work-orders/${workOrderId}/check-in/confirm`);
  return response.data;
}

// ==========================================
// WO SERVICE (UC-31, UC-32)
// ==========================================

export interface WoJob {
  id: number;
  name: string;
  description: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  status: string;
  job_type?: {
    id: number;
    name: string;
  } | null;
  findings?: Array<{
    id: number;
    finding: {
      id: number;
      description: string;
      severity: string;
      marker_type: string | null;
    };
  }>;
  labours?: Array<{
    id: number;
    employee_id?: number | null;
    employee?: { id: number; full_name: string } | null;
  }>;
  parts?: Array<{
    id: number;
    item?: { id: number; sku: string; part_category?: { name: string } } | null;
  }>;
}

export interface WoService {
  id: number;
  work_order_id: number;
  service_id: number | null;
  name: string;
  pricing_type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  sort_order: number;
  created_at: string;
  updated_at: string;
  service?: {
    id: number;
    name: string;
    category_id: number;
    pricing_type: string;
    fixed_price: number | null;
    category?: {
      id: number;
      name: string;
    };
  } | null;
  jobs?: WoJob[];
}


export interface ServiceTemplateOption {
  id: number;
  name: string;
  pricing_type: string;
}

/**
 * UC-31: Thêm dịch vụ vào Work Order
 */
export async function addServiceToWO(
  workOrderId: number,
  serviceId: number
): Promise<ApiResponse<WoService>> {
  const response = await api.post(`/api/work-orders/${workOrderId}/services`, {
    serviceId,
  });
  return response.data;
}

/**
 * UC-32: Xóa dịch vụ khỏi Work Order
 */
export async function removeServiceFromWO(
  workOrderId: number,
  woServiceId: number
): Promise<ApiResponse<null>> {
  const response = await api.delete(
    `/api/work-orders/${workOrderId}/services/${woServiceId}`
  );
  return response.data;
}

/**
 * Lấy danh mục dịch vụ (ServiceTemplate) để chọn khi thêm
 */
export async function getServiceCatalog(): Promise<ServiceTemplateOption[]> {
  const response = await api.get('/api/services');
  return response.data?.data || response.data;
}

/**
 * Tạo nhanh Hạng mục sửa chữa & Công việc con từ 1 vết lỗi (Finding)
 */
export async function createServiceFromFinding(
  workOrderId: number,
  findingId: number
): Promise<ApiResponse<{ service: WoService; job: WoJob }>> {
  const response = await api.post(
    `/api/work-orders/${workOrderId}/services/from-finding`,
    { finding_id: findingId }
  );
  return response.data;
}

// ==========================================
// UC-34: AI JOB PLANNER
// ==========================================

export interface AIJobFinding {
  id: number;
  marker_type: string;
  severity: string;
  description: string;
  recommendation?: string | null;
}

export interface AISuggestedJob {
  name: string;
  description: string;
  job_type_id: number;
  job_type_name: string;
  estimated_hours: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matched_finding_ids?: number[];
  matched_findings?: AIJobFinding[];
  suggested_part_category_ids?: number[];
}

export interface AISuggestedService {
  service_id?: number | null;
  service_name: string;
  category_type: 'REPAIR' | 'MAINTENANCE' | 'OTHER';
  is_existing_service?: boolean;
  finding_id?: number | null;
  finding_info?: {
    id: number;
    description: string;
    severity: string;
    marker_type?: string;
  } | null;
  jobs: AISuggestedJob[];
}

export interface AIJobPlanResponse {
  work_order_id: number;
  work_order_number: string;
  summary: string;
  risk_assessment?: string;
  suggested_services: AISuggestedService[];
  suggested_jobs: AISuggestedJob[];
  available_job_types: Array<{ id: number; name: string }>;
  retrieved_parts_count: number;
}

/**
 * Lấy danh sách công việc do AI RAG đề xuất (toàn bộ hoặc theo riêng 1 hạng mục)
 */
export async function getAIJobSuggestions(
  workOrderId: number,
  serviceId?: number
): Promise<ApiResponse<AIJobPlanResponse>> {
  const query = serviceId ? `?serviceId=${serviceId}` : '';
  const response = await api.get(`/api/work-orders/${workOrderId}/ai-job-suggestions${query}`);
  return response.data;
}

/**
 * Áp dụng danh sách Hạng mục & Jobs được SA phê duyệt vào Work Order
 */
export async function applyAIJobs(
  workOrderId: number,
  payload: {
    services?: Array<{
      service_name: string;
      category_type?: 'REPAIR' | 'MAINTENANCE' | 'OTHER';
      finding_id?: number | null;
      pricing_type?: string;
      jobs: Array<{
        name: string;
        description?: string;
        job_type_id: number;
        estimated_hours: number;
        matched_finding_ids?: number[];
      }>;
    }>;
    jobs?: Array<{
      name: string;
      description?: string;
      job_type_id: number;
      estimated_hours: number;
      matched_finding_ids?: number[];
    }>;
  } | Array<any>
): Promise<ApiResponse<{ applied_jobs_count: number; created_services_count?: number }>> {
  const body = Array.isArray(payload) ? { jobs: payload } : payload;
  const response = await api.post(`/api/work-orders/${workOrderId}/apply-ai-jobs`, body);
  return response.data;
}

export interface CreateManualJobPayload {
  finding_id?: number | null;
  finding_ids?: number[];
  wo_service_id?: number | null;
  new_service_name?: string | null;
  name: string;
  job_type_id?: number | null;
  technician_id?: number | null;
  description?: string | null;
  estimated_hours?: number | null;
  labours?: Array<{
    task_name?: string;
    employee_id?: number | null;
    start_time?: string | null;
    end_time?: string | null;
    estimated_hours?: number | null;
    price?: number | null;
    job_type_id?: number | null;
  }>;
  parts?: Array<{
    item_id: number;
    quantity: number;
    unit_price?: number;
  }>;
}

/**
 * Tạo công việc thủ công (Dispatch Job) cho Work Order
 */
export async function createManualJob(
  workOrderId: number,
  payload: CreateManualJobPayload
): Promise<ApiResponse<{ service_id: number; job: WoJob }>> {
  const response = await api.post(`/api/work-orders/${workOrderId}/jobs`, payload);
  return response.data;
}

export interface UpdateManualJobPayload {
  name?: string;
  job_type_id?: number | null;
  technician_id?: number | null;
  description?: string | null;
  estimated_hours?: number | null;
}

/**
 * Cập nhật công việc thủ công khi chưa phân công (status === 'PLANNED')
 */
export async function updateManualJob(
  workOrderId: number,
  jobId: number,
  payload: UpdateManualJobPayload
): Promise<ApiResponse<WoJob>> {
  const response = await api.patch(`/api/work-orders/${workOrderId}/jobs/${jobId}`, payload);
  return response.data;
}

/**
 * Xóa công việc khi chưa phân công (status === 'PLANNED')
 */
export async function deleteJob(
  workOrderId: number,
  jobId: number
): Promise<ApiResponse<null>> {
  const response = await api.delete(`/api/work-orders/${workOrderId}/jobs/${jobId}`);
  return response.data;
}




