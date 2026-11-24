import axiosInstance from '../axios';

export type WarrantyStatus = 'VALID' | 'EXPIRED';

export interface WarrantyItem {
  id: number;
  type: 'SERVICE' | 'PART';
  name: string;
  woNumber: string;
  workOrderId: number;
  completedDate: string;
  warrantyMonths: number;
  expirationDate: string | null;
  daysRemaining: number | null;
  status: WarrantyStatus;
  overdueDays: number;
  terms?: string;
}

export interface VehicleWarrantyEligibility {
  hasHistory: boolean;
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
    year: number | null;
  };
  summary: {
    totalItems: number;
    validItems: number;
    expiredItems: number;
  };
  items: WarrantyItem[];
}

export interface CompletedWorkOrderOption {
  id: number;
  woNumber: string;
  completedDate: string;
  servicesSummary?: string;
}

export const getWarrantyCompositeKey = (item: Pick<WarrantyItem, 'type' | 'id'>): string =>
  `${item.type}-${item.id}`;

export const warrantyApi = {
  /**
   * UC-81: Tra cứu thông tin bảo hành phương tiện (chỉ tính theo tháng)
   */
  getVehicleWarrantyEligibility: async (
    vehicleId: number,
    signal?: AbortSignal
  ): Promise<VehicleWarrantyEligibility> => {
    const response = await axiosInstance.get(`/api/warranty/vehicles/${vehicleId}/eligibility`, {
      signal,
    });
    return response.data.data;
  },

  /**
   * UC-81: Tra cứu linh hoạt theo biển số hoặc vehicleId
   */
  lookupWarranty: async (
    params: { licensePlate?: string; vehicleId?: number },
    signal?: AbortSignal
  ): Promise<VehicleWarrantyEligibility> => {
    const response = await axiosInstance.get('/api/warranty/lookup', { params, signal });
    return response.data.data;
  },

  /**
   * UC-83: Lấy danh sách phiếu dịch vụ đã hoàn thành của xe để chọn phiếu gốc
   */
  getCompletedWorkOrders: async (
    vehicleId: number,
    signal?: AbortSignal
  ): Promise<CompletedWorkOrderOption[]> => {
    const response = await axiosInstance.get(`/api/warranty/vehicles/${vehicleId}/history`, {
      signal,
    });
    return response.data.data;
  },
};

export default warrantyApi;
