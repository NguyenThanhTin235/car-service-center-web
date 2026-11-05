import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';
import { WorkOrderTrackingDto } from './trackingSlice';

export interface RepairHistoryItem {
  id: number;
  woNumber: string;
  status: 'CLOSED' | 'CANCELLED' | 'RELEASED';
  createdAt: string;
  closedAt: string | null;
  releasedAt: string | null;
  vehicle: { id: number; license_plate: string; make: string; model: string; year: number | null; color: string | null };
  advisor: { id: number; full_name: string } | null;
  complaint: string | null;
  mileageIn: number | null;
  mileageOut: number | null;
  warrantyTerms: string | null;
  services: { id: number; name: string; status: string }[];
  invoice: { id: number; invoice_number: string; status: string; total_amount: string | number } | null;
  hasHandoverPdf: boolean;
}

export interface HistoryFilters {
  vehicleId?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface HistoryState {
  items: RepairHistoryItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  detail: WorkOrderTrackingDto | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
}

const initialState: HistoryState = {
  items: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  detail: null,
  loading: false,
  detailLoading: false,
  error: null,
};

export const fetchMyHistory = createAsyncThunk(
  'history/fetchMyHistory',
  async (filters: HistoryFilters, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/work-orders/my-history', { params: filters });
      return response.data.data as { items: RepairHistoryItem[]; pagination: HistoryState['pagination'] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải lịch sử sửa chữa');
    }
  }
);

export const fetchHistoryDetail = createAsyncThunk(
  'history/fetchHistoryDetail',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/work-orders/my-history/${id}`);
      return response.data.data as WorkOrderTrackingDto;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải chi tiết hồ sơ');
    }
  }
);

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    clearHistoryDetail: (state) => {
      state.detail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchHistoryDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchHistoryDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchHistoryDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearHistoryDetail } = historySlice.actions;
export default historySlice.reducer;

