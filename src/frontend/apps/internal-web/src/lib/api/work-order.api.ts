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
    service_template: {
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
  check_in?: CheckIn | null;
  intake_record?: {
    id: number;
    notes: string;
    services?: {
      id: number;
      service_template: {
        id: number;
        name: string;
        category?: {
          name: string;
        };
      };
    }[];
  } | null;
  services?: WoService[];
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
  services?: {
    id: number;
    name: string;
    pricing_type: string;
    status: string;
  }[] | null;
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

export interface WoService {
  id: number;
  work_order_id: number;
  service_template_id: number | null;
  name: string;
  pricing_type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  sort_order: number;
  created_at: string;
  updated_at: string;
  service_template?: {
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
  serviceTemplateId: number
): Promise<ApiResponse<WoService>> {
  const response = await api.post(`/api/work-orders/${workOrderId}/services`, {
    serviceTemplateId,
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
