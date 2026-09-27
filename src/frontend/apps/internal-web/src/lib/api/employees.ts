import api from '../axios';

export interface EmployeeData {
  id: number;
  fullName: string;
  position: string;
  isActive: boolean;
  user?: { id: number; email: string; phone?: string; isActive: boolean } | null;
  skills: { id: number; name: string }[];
  createdAt: string;
}

export interface CreateEmployeePayload {
  fullName: string;
  position: string;
  userId?: number;
  skillIds?: number[];
}

export interface UpdateEmployeePayload {
  fullName?: string;
  position?: string;
  userId?: number | null;
  isActive?: boolean;
  skillIds?: number[];
}

export const employeeApi = {
  getAll: (params?: { search?: string; position?: string; page?: number; limit?: number }) =>
    api.get('/api/employees', { params }),

  getById: (id: number) =>
    api.get(`/api/employees/${id}`),

  create: (data: CreateEmployeePayload) =>
    api.post('/api/employees', data),

  update: (id: number, data: UpdateEmployeePayload) =>
    api.put(`/api/employees/${id}`, data),

  deactivate: (id: number) =>
    api.delete(`/api/employees/${id}`),

  reactivate: (id: number) =>
    api.patch(`/api/employees/${id}/reactivate`),

  getSkills: () =>
    api.get('/api/employees/skills'),
};
