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

export interface CompletedWorkOrderOption {
  id: number;
  woNumber: string;
  completedDate: string;
  releaseOdo: number | null;
  servicesSummary?: string;
}

export interface GoodwillClaimItem {
  id: number;
  vehicle_id: number;
  customer_id: number;
  parent_wo_id: number;
  intake_id?: number | null;
  overdue_days?: number | null;
  overdue_km?: number | null;
  complaint: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  support_type: 'FULL' | 'LABOUR_ONLY' | 'PERCENTAGE' | null;
  support_pct: number | null;
  approval_note: string | null;
  created_at: string;
  approved_at?: string | null;
  vehicle?: {
    id: number;
    license_plate: string;
    make: string;
    model: string;
    year?: number | null;
  };
  customer?: {
    id: number;
    full_name: string;
    phone: string;
    email?: string | null;
  };
  created_by?: {
    id: number;
    full_name: string;
  };
  approved_by?: {
    id: number;
    full_name: string;
  } | null;
  parent_wo?: {
    id: number;
    wo_number: string;
    completed_at?: string | null;
    released_at?: string | null;
    odometer_at_release?: number | null;
    odometer_reading?: number | null;
  };
}

export interface GoodwillClaimsListResponse {
  claims: GoodwillClaimItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GoodwillClaimDetailResponse {
  claim: GoodwillClaimItem;
  customerStats: {
    totalCompletedOrders: number;
    isLoyalCustomer: boolean;
    historyOrders: Array<{
      id: number;
      wo_number: string;
      status: string;
      completed_at?: string | null;
      created_at?: string;
    }>;
  };
}

export const getWarrantyCompositeKey = (item: Pick<WarrantyItem, 'type' | 'id'>): string =>
  `${item.type}-${item.id}`;

export const warrantyApi = {
  /**
   * UC-81: Tra cứu thông tin bảo hành phương tiện
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
   * UC-81: Tra cứu linh hoạt theo biển số hoặc vehicleId
   */
  lookupWarranty: async (
    params: { licensePlate?: string; vehicleId?: number; odometer?: number },
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

  /**
   * UC-83: Xác thực chống tua lùi ODO khi tiếp nhận xe bảo hành
   */
  validateOdoIntake: async (
    data: { parentWoId: number; intakeOdo: number },
    signal?: AbortSignal
  ): Promise<{
    valid: boolean;
    parentWoId: number;
    woNumber?: string;
    lastRecordedOdo: number;
    intakeOdo: number;
    message: string;
  }> => {
    const response = await axiosInstance.post('/api/warranty/validate-odo', data, { signal });
    return response.data.data;
  },

  /**
   * UC-86: Đề xuất hồ sơ bảo hành thiện chí khi quá hạn nhẹ
   */
  createGoodwillClaim: async (data: {
    vehicleId: number;
    customerId?: number;
    parentWoId: number;
    intakeId?: number | null;
    overdueDays?: number | null;
    overdueKm?: number | null;
    complaint: string;
  }): Promise<GoodwillClaimItem> => {
    const response = await axiosInstance.post('/api/warranty/goodwill-claims', data);
    return response.data.data;
  },

  /**
   * UC-86: Danh sách hồ sơ bảo hành thiện chí (Dành cho Quản lý & Admin)
   */
  listGoodwillClaims: async (
    params?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
    signal?: AbortSignal
  ): Promise<GoodwillClaimsListResponse> => {
    const response = await axiosInstance.get('/api/warranty/goodwill-claims', { params, signal });
    return response.data.data;
  },

  /**
   * UC-86: Xem hồ sơ thẩm định chi tiết bảo hành thiện chí
   */
  getGoodwillClaimDetail: async (
    claimId: number,
    signal?: AbortSignal
  ): Promise<GoodwillClaimDetailResponse> => {
    const response = await axiosInstance.get(`/api/warranty/goodwill-claims/${claimId}`, {
      signal,
    });
    return response.data.data;
  },

  /**
   * UC-86: Quản lý phê duyệt hồ sơ thiện chí
   */
  approveGoodwillClaim: async (
    claimId: number,
    data: {
      supportType: 'FULL' | 'LABOUR_ONLY' | 'PERCENTAGE';
      supportPct?: number;
      approvalNote: string;
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
      approvalNote: string;
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
  getWarrantyReport: async (
    params?: {
      startDate?: string;
      endDate?: string;
      groupBy?: 'TECHNICIAN' | 'CATEGORY' | 'PART';
    },
    signal?: AbortSignal
  ) => {
    const response = await axiosInstance.get('/api/reports/warranty', { params, signal });
    return response.data.data;
  },
};

export default warrantyApi;
