import api from '../axios';

export interface UserData {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  roles: string[];
  employee?: { id: number; position: string } | null;
  createdAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  role?: string;
}

export const userApi = {
  getAll: (params?: { search?: string; role?: string; page?: number; limit?: number }) =>
    api.get('/api/users', { params }),

  getById: (id: number) =>
    api.get(`/api/users/${id}`),

  create: (data: CreateUserPayload) =>
    api.post('/api/users', data),

  update: (id: number, data: UpdateUserPayload) =>
    api.put(`/api/users/${id}`, data),

  deactivate: (id: number) =>
    api.delete(`/api/users/${id}`),

  reactivate: (id: number) =>
    api.patch(`/api/users/${id}/reactivate`),

  resetPassword: (id: number, newPassword: string) =>
    api.patch(`/api/users/${id}/reset-password`, { newPassword }),
};
