import api from '../axios';

export interface ServiceTemplateData {
  id: number;
  name: string;
  description?: string;
  pricingType: 'FIXED' | 'VEHICLE_SIZE' | 'LABOUR_PARTS';
  fixedPrice?: number | null;
  isActive: boolean;
  category: { id: number; name: string };
  sizePrices: { vehicleSize: string; price: number }[];
  createdAt: string;
}

export interface CategoryData {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface CreateServiceTemplatePayload {
  categoryId: number;
  name: string;
  description?: string;
  pricingType: string;
  fixedPrice?: number;
  sizePrices?: { vehicleSize: string; price: number }[];
}

export const serviceTemplateApi = {
  getAll: (params?: { search?: string; categoryId?: number; page?: number; limit?: number }) =>
    api.get('/api/services', { params }),

  getCategories: () => api.get('/api/services/categories'),

  create: (data: CreateServiceTemplatePayload) =>
    api.post('/api/services', data),

  update: (id: number, data: Partial<CreateServiceTemplatePayload> & { isActive?: boolean }) =>
    api.put(`/api/services/${id}`, data),

  toggle: (id: number) =>
    api.patch(`/api/services/${id}/toggle`),
};
