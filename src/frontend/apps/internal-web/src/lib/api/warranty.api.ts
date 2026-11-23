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

export interface GoodwillClaimItem {
  id: number;
  claim_number: string;
  parent_work_order_id: number;
  vehicle_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  support_type: 'FULL' | 'LABOUR_ONLY' | 'PERCENTAGE' | null;
  support_percentage: number | null;
  fault_description: string;
  justification_notes: string;
  approval_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  vehicle?: {
    id: number;
    license_plate: string;
    make: string;
    model: string;
  };
  customer?: {
    id: number;
    full_name: string;
    phone: string;
  };
  proposed_by?: {
    id: number;
    full_name: string;
  };
  approved_by?: {
    id: number;
    full_name: string;
  };
  parent_work_order?: {
    id: number;
    wo_number: string;
    closed_at: string;
  };
}

export const warrantyApi = {
  /**
   * UC-81: Tra cứu thông tin bảo hành phương tiện
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
   * UC-83: Lấy danh sách phiếu dịch vụ đã hoàn thành của xe để chọn phiếu gốc
   */
  getCompletedWorkOrders: async (vehicleId: number) => {
    const response = await axiosInstance.get(`/api/warranty/vehicles/${vehicleId}/history`);
    return response.data.data;
  },

  /**
   * UC-83: Xác thực chống tua lùi ODO khi tiếp nhận xe bảo hành
   */
  validateOdoIntake: async (data: {
    parentWoId: number;
    currentOdometer: number;
  }): Promise<{ isValid: boolean; message: string; data?: any }> => {
    const response = await axiosInstance.post('/api/warranty/validate-odo', data);
    return response.data;
  },

  /**
   * UC-86: Đề xuất hồ sơ bảo hành thiện chí khi quá hạn nhẹ
   */
  createGoodwillClaim: async (data: {
    vehicleId: number;
    parentWoId: number;
    faultDescription: string;
    justificationNotes: string;
    currentOdometer?: number;
  }) => {
    const response = await axiosInstance.post('/api/warranty/goodwill-claims', data);
    return response.data.data;
  },

  /**
   * UC-86: Danh sách hồ sơ bảo hành thiện chí (Dành cho Quản lý & Admin)
   */
  listGoodwillClaims: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await axiosInstance.get('/api/warranty/goodwill-claims', { params });
    return response.data.data;
  },

  /**
   * UC-86: Xem hồ sơ thẩm định chi tiết bảo hành thiện chí
   */
  getGoodwillClaimDetail: async (claimId: number) => {
    const response = await axiosInstance.get(`/api/warranty/goodwill-claims/${claimId}`);
    return response.data.data;
  },

  /**
   * UC-86: Quản lý phê duyệt hồ sơ thiện chí
   */
  approveGoodwillClaim: async (
    claimId: number,
    data: {
      supportType: 'FULL' | 'LABOUR_ONLY' | 'PERCENTAGE';
      supportPercentage?: number;
      approvalNotes: string;
    }
  ) => {
    const response = await axiosInstance.patch(
      `/api/warranty/goodwill-claims/${claimId}/approve`,
      data
    );
    return response.data;
  },

  /**
   * UC-86: Quản lý từ chối hồ sơ thiện chí
   */
  rejectGoodwillClaim: async (
    claimId: number,
    data: {
      rejectionReason: string;
    }
  ) => {
    const response = await axiosInstance.patch(
      `/api/warranty/goodwill-claims/${claimId}/reject`,
      data
    );
    return response.data;
  },

  /**
   * UC-87: Báo cáo Thống kê & Phân tích Quản trị Bảo hành (Quản lý & Admin)
   */
  getWarrantyReport: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'TECHNICIAN' | 'CATEGORY' | 'PART';
  }) => {
    const response = await axiosInstance.get('/api/reports/warranty', { params });
    return response.data.data;
  },
};

export default warrantyApi;

