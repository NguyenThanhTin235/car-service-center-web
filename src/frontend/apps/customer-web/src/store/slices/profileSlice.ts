'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';
import { setCredentials } from './authSlice';

export interface ProfileData {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  roles: string[];
}

interface ProfileState {
  data: ProfileData | null;
  loading: boolean;
  error: string | null;
  updateLoading: boolean;
  updateError: string | null;
  updateSuccess: boolean;
}

const initialState: ProfileState = {
  data: null,
  loading: false,
  error: null,
  updateLoading: false,
  updateError: null,
  updateSuccess: false,
};

// Async Thunks
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/auth/me');
      return data.data as ProfileData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải hồ sơ.');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (dto: { fullName?: string; phone?: string; email?: string; address?: string }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put('/api/auth/me', dto);
      // Sync auth slice user info
      dispatch(setCredentials({
        user: {
          id: data.data.id,
          email: data.data.email,
          fullName: data.data.fullName,
          roles: [], // preserve existing — will be updated on next fetchProfile
        }
      }));
      return data.data as ProfileData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ.');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearUpdateStatus: (state) => {
      state.updateError = null;
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = true;
        state.data = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload as string;
      });
  },
});

export const { clearUpdateStatus } = profileSlice.actions;
export default profileSlice.reducer;
