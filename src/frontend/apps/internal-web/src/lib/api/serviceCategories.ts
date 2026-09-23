import api from '../axios';

export interface ServiceCategoryData {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  templatesCount: number;
}

export interface CreateServiceCategoryPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export const serviceCategoryApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/api/service-categories', { params }),

  create: (data: CreateServiceCategoryPayload) =>
    api.post('/api/service-categories', data),

  update: (id: number, data: Partial<CreateServiceCategoryPayload>) =>
    api.put(`/api/service-categories/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/service-categories/${id}`),
};
