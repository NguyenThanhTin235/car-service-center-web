import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface Service {
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
  services?: Service[];
}

export interface AppointmentState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  loading: false,
  error: null,
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

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload.data;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Reschedule
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = { ...state.appointments[index], ...action.payload };
        }
      })
      // Cancel
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = { ...state.appointments[index], ...action.payload };
        }
      });
  },
});

export default appointmentSlice.reducer;
