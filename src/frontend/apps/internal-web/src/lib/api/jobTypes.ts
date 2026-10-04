import api from '../axios';

export interface JobTypeData {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export const jobTypeApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/api/job-types', { params }),

  create: (data: { name: string; description?: string }) =>
    api.post('/api/job-types', data),

  update: (id: number, data: { name?: string; description?: string; isActive?: boolean }) =>
    api.put(`/api/job-types/${id}`, data),

  toggle: (id: number) =>
    api.patch(`/api/job-types/${id}/toggle`),

  delete: (id: number) =>
    api.delete(`/api/job-types/${id}`),
};
