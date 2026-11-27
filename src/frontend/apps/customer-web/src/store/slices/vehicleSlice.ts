import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface Vehicle {
  id: number;
  licensePlate: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  vehicleSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'SUV' | 'TRUCK' | 'XL' | null;
  isActive: boolean;
  hasTransactions?: boolean;
  activeWorkOrder?: {
    id: number;
    woNumber: string;
    status: string;
  } | null;
  createdAt: string;
}

interface VehicleState {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  actionError: string | null;
}

const initialState: VehicleState = {
  vehicles: [],
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
};

function getApiError(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  return fallback;
}

// Async Thunks
export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/vehicles');
      return data.data as Vehicle[];
    } catch (error: unknown) {
      return rejectWithValue(getApiError(error, 'Lỗi khi tải danh sách xe.'));
    }
  }
);

export const createVehicle = createAsyncThunk(
  'vehicles/createVehicle',
  async (dto: { licensePlate: string; make: string; model: string; year?: number; color?: string; vehicleSize?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/vehicles', dto);
      return data.data as Vehicle;
    } catch (error: unknown) {
      return rejectWithValue(getApiError(error, 'Lỗi khi thêm xe.'));
    }
  }
);

export const updateVehicle = createAsyncThunk(
  'vehicles/updateVehicle',
  async ({ id, dto }: { id: number; dto: { make?: string; model?: string; year?: number; color?: string; vehicleSize?: string } }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/vehicles/${id}`, dto);
      return data.data as Vehicle;
    } catch (error: unknown) {
      return rejectWithValue(getApiError(error, 'Lỗi khi cập nhật xe.'));
    }
  }
);

export const deleteVehicle = createAsyncThunk(
  'vehicles/deleteVehicle',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/api/vehicles/${id}`);
      return { id, deactivated: data.deactivated, message: data.message as string | undefined };
    } catch (error: unknown) {
      return rejectWithValue(getApiError(error, 'Lỗi khi xóa xe.'));
    }
  }
);

export const restoreVehicle = createAsyncThunk(
  'vehicles/restoreVehicle',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/api/vehicles/${id}/restore`);
      return { id, message: data.message as string | undefined };
    } catch (error: unknown) {
      return rejectWithValue(getApiError(error, 'Lỗi khi kích hoạt lại xe.'));
    }
  }
);

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createVehicle.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.vehicles.unshift(action.payload);
      })
      .addCase(createVehicle.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      // Update
      .addCase(updateVehicle.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.vehicles.findIndex((v) => v.id === action.payload.id);
        if (idx !== -1) {
          state.vehicles[idx] = { ...state.vehicles[idx], ...action.payload };
        }
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      // Delete
      .addCase(deleteVehicle.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { id, deactivated } = action.payload;
        if (deactivated) {
          // Soft delete — mark inactive
          const idx = state.vehicles.findIndex((v) => v.id === id);
          if (idx !== -1) state.vehicles[idx].isActive = false;
        } else {
          // Hard delete — remove from list
          state.vehicles = state.vehicles.filter((v) => v.id !== id);
        }
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      // Restore
      .addCase(restoreVehicle.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(restoreVehicle.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.vehicles.findIndex((v) => v.id === action.payload.id);
        if (idx !== -1) state.vehicles[idx].isActive = true;
      })
      .addCase(restoreVehicle.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });
  },
});

export default vehicleSlice.reducer;
