import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface WorkOrderStep {
  stepIndex: number;
  title: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  time?: string;
  description: string;
}

export interface WorkOrderServiceItem {
  id: number;
  name: string;
  status: string;
  pricingType?: string;
  categoryName: string;
}

export interface WorkOrderFinding {
  id: number;
  description: string;
  severity: string;
  recommendation?: string;
  evidenceUrls?: any;
  partName?: string;
  createdAt: string;
}

export interface WorkOrderTrackingDto {
  id: number;
  woNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
    year?: number;
    color?: string;
    vehicleSize?: string;
    mileage?: number;
  };
  advisor: {
    id: number;
    fullName: string;
    phone?: string;
  };
  mechanic?: {
    id: number;
    fullName: string;
    position: string;
    skills: string[];
  } | null;
  services: WorkOrderServiceItem[];
  findings: WorkOrderFinding[];
  checkIn?: {
    id?: number;
    mileage: number;
    fuelLevel: string;
    complaint: string;
    belongings?: string | null;
    exteriorCondition: string;
    status?: string;
    confirmedAt?: string | null;
    evidenceUrls?: string[] | null;
    createdAt?: string;
  } | null;
  steps: WorkOrderStep[];
  currentStep: number;
  progressPercent: number;
  activeQuotation?: {
    id: number;
    quotationNumber: string;
    quotationType: string;
    version: number;
    status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    subtotal: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    grandTotal: number;
    rejectReason?: string | null;
    sentAt?: string | null;
    approvedAt?: string | null;
    createdAt: string;
    lines: Array<{
      id: number;
      lineType: 'LABOUR' | 'PART';
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      sortOrder: number;
    }>;
  } | null;
  invoice?: {
    id: number;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
    amountDue: number;
    issuedAt?: string;
  } | null;
}

interface TrackingState {
  orders: WorkOrderTrackingDto[];
  selectedOrder: WorkOrderTrackingDto | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: TrackingState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  detailLoading: false,
  error: null,
  lastUpdated: null,
};

export const fetchMyTrackingOrders = createAsyncThunk(
  'tracking/fetchMyTrackingOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/work-orders/my-tracking');
      return response.data.data as WorkOrderTrackingDto[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải tiến độ sửa chữa');
    }
  }
);

export const fetchTrackingDetail = createAsyncThunk(
  'tracking/fetchTrackingDetail',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/work-orders/my-tracking/${id}`);
      return response.data.data as WorkOrderTrackingDto;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải chi tiết tiến độ');
    }
  }
);

const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    setSelectedOrder: (state, action: PayloadAction<WorkOrderTrackingDto | null>) => {
      state.selectedOrder = action.payload;
    },
    clearTrackingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all tracking orders
      .addCase(fetchMyTrackingOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTrackingOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.lastUpdated = new Date().toISOString();
        // Tự động chọn phiếu đầu tiên nếu chưa chọn hoặc phiếu hiện tại không còn trong danh sách
        if (!state.selectedOrder && action.payload.length > 0) {
          state.selectedOrder = action.payload[0];
        } else if (state.selectedOrder) {
          const updated = action.payload.find((o) => o.id === state.selectedOrder?.id);
          if (updated) state.selectedOrder = updated;
        }
      })
      .addCase(fetchMyTrackingOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch detail
      .addCase(fetchTrackingDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchTrackingDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchTrackingDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedOrder, clearTrackingError } = trackingSlice.actions;
export default trackingSlice.reducer;
