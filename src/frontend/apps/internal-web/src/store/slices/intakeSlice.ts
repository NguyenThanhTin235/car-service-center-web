import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Types
export interface IntakeCustomer {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
}

export interface IntakeVehicle {
  id: number;
  license_plate: string;
  make: string;
  model: string;
  color: string | null;
  vehicle_size: string;
}

export interface IntakeRecord {
  id: number;
  customer_id: number;
  vehicle_id: number;
  intake_type: 'WALK_IN' | 'TOW_IN' | 'APPOINTMENT';
  status: 'QUEUED' | 'CONVERTED' | 'CANCELLED';
  arrived_at: string;
  tow_company: string | null;
  notes: string | null;
  created_by_id: number;
  created_at: string;
  customer: IntakeCustomer;
  vehicle: IntakeVehicle;
  created_by: { id: number; full_name: string };
  services?: Array<{
    id: number;
    intake_id: number;
    service_template_id: number;
    service_template: {
      id: number;
      name: string;
    };
  }>;
}

interface IntakeState {
  records: IntakeRecord[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  } | null;
  createLoading: boolean;
  createError: string | null;
}

const initialState: IntakeState = {
  records: [],
  loading: false,
  error: null,
  pagination: null,
  createLoading: false,
  createError: null,
};

// Async thunks
export const fetchIntakeQueue = createAsyncThunk(
  'intake/fetchQueue',
  async (params: { status?: string; date?: string; search?: string; page?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/intake', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải danh sách tiếp nhận');
    }
  }
);

export const createIntakeRecord = createAsyncThunk(
  'intake/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/intake', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tạo phiếu tiếp nhận');
    }
  }
);

export const arriveAppointment = createAsyncThunk(
  'intake/arriveAppointment',
  async (appointmentId: number, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/appointments/${appointmentId}/arrive`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi đánh dấu đã đến');
    }
  }
);

export const cancelIntakeRecord = createAsyncThunk(
  'intake/cancel',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/intake/${id}/cancel`);
      return { id, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi hủy phiếu tiếp nhận');
    }
  }
);

// Slice
const intakeSlice = createSlice({
  name: 'intake',
  initialState,
  reducers: {
    clearCreateError: (state) => {
      state.createError = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch queue
    builder
      .addCase(fetchIntakeQueue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIntakeQueue.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.data || [];
        state.pagination = action.payload.meta?.pagination || null;
      })
      .addCase(fetchIntakeQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create intake
    builder
      .addCase(createIntakeRecord.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createIntakeRecord.fulfilled, (state, action) => {
        state.createLoading = false;
        if (action.payload.data) {
          state.records.unshift(action.payload.data);
        }
      })
      .addCase(createIntakeRecord.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload as string;
      });

    // Arrive appointment (adds new intake to queue)
    builder
      .addCase(arriveAppointment.fulfilled, (state, action) => {
        if (action.payload.data?.intakeRecord) {
          state.records.unshift(action.payload.data.intakeRecord);
        }
      });

    // Cancel intake
    builder
      .addCase(cancelIntakeRecord.fulfilled, (state, action) => {
        const idx = state.records.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) {
          state.records[idx].status = 'CANCELLED';
        }
      });
  },
});

export const { clearCreateError, clearError } = intakeSlice.actions;
export default intakeSlice.reducer;
