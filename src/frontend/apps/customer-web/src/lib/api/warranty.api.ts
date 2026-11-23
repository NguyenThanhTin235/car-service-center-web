import axiosInstance from '../axios';

export type WarrantyStatus = 'VALID' | 'OVERDUE_LIGHT' | 'EXPIRED';

export interface WarrantyItem {
  id: number;
  type: 'SERVICE' | 'PART';
  name: string;
  woNumber: string;
  workOrderId: number;
  completedDate: string;
  completedOdo: number | null;
  warrantyMonths: number;
  warrantyMileage: number;
  expirationDate: string | null;
  expirationMileage: number | null;
  daysRemaining: number | null;
  kmRemaining: number | null;
  status: WarrantyStatus;
  overdueDays: number;
  overdueKm: number;
  reason: string;
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
  currentOdo: number | null;
  summary: {
    totalItems: number;
    validItems: number;
    overdueLightItems: number;
    expiredItems: number;
  };
  items: WarrantyItem[];
}

export const getWarrantyCompositeKey = (item: Pick<WarrantyItem, 'type' | 'id'>): string =>
  `${item.type}-${item.id}`;

export const warrantyApi = {
  /**
   * UC-81: Tra cứu thông tin hạn bảo hành của một phương tiện
   */
  getVehicleWarrantyEligibility: async (
    vehicleId: number,
    odometer?: number,
    signal?: AbortSignal
  ): Promise<VehicleWarrantyEligibility> => {
    const params: Record<string, any> = {};
    if (odometer !== undefined && odometer !== null && !Number.isNaN(odometer)) {
      params.odometer = odometer;
    }
    const response = await axiosInstance.get(`/api/warranty/vehicles/${vehicleId}/eligibility`, {
      params,
      signal,
    });
    return response.data.data;
  },

  /**
   * UC-81: Tra cứu bảo hành linh hoạt theo biển số hoặc ID
   */
  lookupWarranty: async (
    params: {
      licensePlate?: string;
      vehicleId?: number;
      odometer?: number;
    },
    signal?: AbortSignal
  ): Promise<VehicleWarrantyEligibility> => {
    const response = await axiosInstance.get('/api/warranty/lookup', {
      params,
      signal,
    });
    return response.data.data;
  },
};

export default warrantyApi;
