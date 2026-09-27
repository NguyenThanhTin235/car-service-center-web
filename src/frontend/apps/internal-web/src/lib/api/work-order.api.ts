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
    };
  }[];
  created_by: {
    id: number;
    full_name: string;
  };
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
  advisor: {
    id: number;
    full_name: string;
    phone: string;
  };
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
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<IntakeQueueItem[]>> {
  const response = await api.get('/api/work-orders/intake-queue', { params });
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
