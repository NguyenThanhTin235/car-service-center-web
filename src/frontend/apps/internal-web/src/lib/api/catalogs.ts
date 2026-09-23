import api from '../axios';

export interface CatalogData {
  id: number;
  catalogType: 'UOM' | 'CANCEL_REASON' | 'ADJUST_REASON' | 'TERMS';
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export const catalogApi = {
  getAll: (params?: { search?: string; catalogType?: string; page?: number; limit?: number }) =>
    api.get('/api/catalogs', { params }),

  create: (data: { catalogType: string; name: string; description?: string; sortOrder?: number }) =>
    api.post('/api/catalogs', data),

  update: (id: number, data: { name?: string; description?: string; isActive?: boolean; sortOrder?: number }) =>
    api.put(`/api/catalogs/${id}`, data),

  toggle: (id: number) =>
    api.patch(`/api/catalogs/${id}/toggle`),
};
