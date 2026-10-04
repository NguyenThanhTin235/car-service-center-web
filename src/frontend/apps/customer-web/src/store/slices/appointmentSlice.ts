import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface ServiceTemplate {
  id: number;
  name: string;
}

export interface Appointment {
  id: number;
  customer_id: number;
  vehicle_id: number;
  scheduled_date: string;
  scheduled_time: string;
  scheduled_time_str: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'ARRIVED' | 'CANCELLED';
  cancel_reason: string | null;
  notes: string | null;
  customer?: { id: number; full_name: string; phone: string };
  vehicle?: { id: number; license_plate: string; make: string; model: string };
  services?: {
    id?: number;
    appointment_id?: number;
    service_template_id?: number;
    service_template?: ServiceTemplate;
  }[];
}

export interface AppointmentState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: AppointmentState = {
  appointments: [],
  selectedAppointment: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    startDate: null,
    endDate: null,
    status: '',
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
  },
};

// Async Thunks
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/appointments', { params: filters });
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải dữ liệu');
    }
  }
);

export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData: any, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/appointments', appointmentData);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tạo lịch hẹn');
    }
  }
);

export const rescheduleAppointment = createAsyncThunk(
  'appointments/rescheduleAppointment',
  async ({ id, updateData }: { id: number, updateData: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/appointments/${id}`, updateData);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi dời lịch hẹn');
    }
  }
);

export const confirmAppointment = createAsyncThunk(
  'appointments/confirmAppointment',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/api/appointments/${id}/confirm`);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi xác nhận lịch hẹn');
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async ({ id, reason }: { id: number; reason: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/appointments/${id}/cancel`, { cancel_reason: reason });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Có lỗi xảy ra khi hủy lịch hẹn');
    }
  }
);

export const arriveAppointment = createAsyncThunk(
  'appointments/arriveAppointment',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/appointments/${id}/arrive`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Có lỗi xảy ra khi tiếp nhận xe');
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setSelectedAppointment: (state, action: PayloadAction<Appointment | null>) => {
      state.selectedAppointment = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<AppointmentState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload.data;
        state.pagination.total = action.payload.pagination.totalRecords;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createAppointment.fulfilled, (state, action) => {
        // Optimistically add or simply refetch (will rely on refetch from component for full relations)
      })
      // Reschedule
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = { ...state.appointments[index], ...action.payload };
          if (state.selectedAppointment?.id === action.payload.id) {
            state.selectedAppointment = state.appointments[index];
          }
        }
      })
      // Confirm
      .addCase(confirmAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index].status = 'CONFIRMED';
          if (state.selectedAppointment && state.selectedAppointment.id === action.payload.id) {
            state.selectedAppointment.status = 'CONFIRMED';
          }
        }
      })
      // Cancel
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = { ...state.appointments[index], ...action.payload };
          if (state.selectedAppointment && state.selectedAppointment.id === action.payload.id) {
            state.selectedAppointment = state.appointments[index];
          }
        }
      })
      // Arrive
      .addCase(arriveAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index].status = 'ARRIVED';
          if (state.selectedAppointment && state.selectedAppointment.id === action.payload.id) {
            state.selectedAppointment.status = 'ARRIVED';
          }
        }
      });
  },
});

export const { setSelectedAppointment, setFilters } = appointmentSlice.actions;
export default appointmentSlice.reducer;
