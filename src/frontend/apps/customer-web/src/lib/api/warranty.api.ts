import axiosInstance from '../axios';

export type WarrantyStatus = 'VALID' | 'OVERDUE_LIGHT' | 'EXPIRED';

export interface WarrantyItem {
  id: string;
  type: 'SERVICE' | 'PART';
  itemId: number;
  name: string;
  performedAt: string;
  releaseOdometer: number;
  warrantyMonths: number;
  warrantyMileage: number;
  expireDate: string;
  expireMileage: number;
  remainingDays: number | null;
  remainingKm: number | null;
  status: WarrantyStatus;
  statusLabel: string;
  badgeColor: 'green' | 'yellow' | 'gray';
  parentWoId: number;
  parentWoNumber: string;
}

export interface VehicleWarrantyEligibility {
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
    year: number;
  };
  currentOdometer: number;
  isOdoProvided: boolean;
  summary: {
    totalItems: number;
    validCount: number;
    overdueLightCount: number;
    expiredCount: number;
  };
  items: WarrantyItem[];
}

export const warrantyApi = {
  /**
   * UC-81: Tra cứu thông tin hạn bảo hành của một phương tiện
   */
  getVehicleWarrantyEligibility: async (
    vehicleId: number,
    odometer?: number
  ): Promise<VehicleWarrantyEligibility> => {
    const params: Record<string, any> = {};
    if (odometer !== undefined && odometer !== null) {
      params.odometer = odometer;
    }
    const response = await axiosInstance.get(`/api/warranty/vehicles/${vehicleId}/eligibility`, {
      params,
    });
    return response.data.data;
  },

  /**
   * UC-81: Tra cứu bảo hành linh hoạt theo biển số hoặc ID
   */
  lookupWarranty: async (params: {
    licensePlate?: string;
    vehicleId?: number;
    odometer?: number;
  }): Promise<VehicleWarrantyEligibility> => {
    const response = await axiosInstance.get('/api/warranty/lookup', {
      params,
    });
    return response.data.data;
  },
};

export default warrantyApi;

