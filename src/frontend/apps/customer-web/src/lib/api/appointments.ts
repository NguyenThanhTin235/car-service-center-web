import axiosInstance from '../axios';

export interface CreateAppointmentDto {
  vehicle_id: number;
  service_ids?: number[];
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  scheduled_date?: string;
  scheduled_time?: string;
  notes?: string;
}

export interface Appointment {
  id: number;
  customer_id: number;
  vehicle_id: number;
  scheduled_date: string;
  scheduled_time_str: string; // from backend format
  status: 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'ARRIVED' | 'CANCELLED';
  cancel_reason?: string;
  notes?: string;
  vehicle: {
    id: number;
    license_plate: string;
    make: string;
    model: string;
  };
  services: {
    id: number;
    name: string;
    pricing_type: string;
  }[];
}

export const appointmentApi = {
  getMyAppointments: async () => {
    const response = await axiosInstance.get('/appointments');
    return response.data; // { status: 'success', data: Appointment[], pagination: ... }
  },

  getAppointmentById: async (id: number) => {
    const response = await axiosInstance.get(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (data: CreateAppointmentDto) => {
    const response = await axiosInstance.post('/appointments', data);
    return response.data;
  },

  rescheduleAppointment: async (id: number, data: UpdateAppointmentDto) => {
    const response = await axiosInstance.put(`/appointments/${id}`, data);
    return response.data;
  },

  cancelAppointment: async (id: number, reason: string) => {
    const response = await axiosInstance.patch(`/appointments/${id}/cancel`, { cancel_reason: reason });
    return response.data;
  }
};
