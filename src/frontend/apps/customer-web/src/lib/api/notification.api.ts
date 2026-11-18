import api from '../axios';

export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_RESCHEDULED'
  | 'CHECKIN_READY'
  | 'QUOTATION_SENT'
  | 'QUOTATION_APPROVED'
  | 'QUOTATION_REJECTED'
  | 'WORK_ORDER_STARTED'
  | 'SERVICE_ITEM_STARTED'
  | 'INVOICE_ISSUED'
  | 'PAYMENT_SUCCESS'
  | 'VEHICLE_READY'
  | 'VEHICLE_HANDOVER'
  | 'QC_PASSED'
  | (string & {});

export interface NotificationItem {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  since?: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  meta: NotificationMeta;
}

export async function getNotifications(
  params: GetNotificationsParams = {}
): Promise<NotificationsResponse> {
  const { data } = await api.get('/api/notifications', { params });
  return {
    items: data.data ?? [],
    meta: data.meta ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get('/api/notifications/unread-count');
  return data.data?.count ?? 0;
}

export async function markNotificationRead(id: number): Promise<NotificationItem> {
  const { data } = await api.patch(`/api/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead(): Promise<{ updatedCount: number }> {
  const { data } = await api.patch('/api/notifications/read-all');
  return data.data;
}

export async function deleteNotification(id: number): Promise<{ id: number }> {
  const { data } = await api.delete(`/api/notifications/${id}`);
  return data.data;
}
