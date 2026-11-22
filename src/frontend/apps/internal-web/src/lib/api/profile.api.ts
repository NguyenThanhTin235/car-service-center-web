import api from '@/lib/axios';

export interface InternalEmployeeInfo {
  id: number;
  position: string;
  isActive: boolean;
  createdAt?: string;
  skills: string[];
}

export interface InternalUserProfile {
  id: number;
  fullName: string;
  phone: string | null;
  email: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  roles: string[];
  employee: InternalEmployeeInfo | null;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone: string | null;
  address: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const profileApi = {
  async getMyProfile(): Promise<InternalUserProfile> {
    const res = await api.get('/api/auth/me');
    return res.data?.data ?? res.data;
  },

  async updateMyProfile(payload: UpdateProfilePayload): Promise<InternalUserProfile> {
    const res = await api.put('/api/auth/me', payload);
    return res.data?.data ?? res.data;
  },

  async changeMyPassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const res = await api.put('/api/auth/change-password', payload);
    return { message: res.data?.message || 'Đổi mật khẩu thành công.' };
  },
};
