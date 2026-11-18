import api from '@/lib/axios';

export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_RESCHEDULED'
  | 'INTAKE_CREATED'
  | 'QUOTATION_SENT'
  | 'QUOTATION_APPROVED'
  | 'QUOTATION_REJECTED'
  | 'WORK_ORDER_STARTED'
  | 'SERVICE_ITEM_STARTED'
  | 'SERVICE_ITEM_COMPLETED'
  | 'VEHICLE_READY'
  | 'VEHICLE_HANDOVER'
  | 'INVOICE_ISSUED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'QC_PASSED'
  | 'QC_FAILED'
  | 'LOW_STOCK_ALERT'
  | 'GENERAL';

export interface NotificationItem {
  id: number;
  userId: number;
  type: NotificationType | string;
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

interface ApiEnvelope<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  meta?: NotificationMeta;
  timestamp: string;
}

export async function getNotifications(
  params: GetNotificationsParams = {}
): Promise<{ items: NotificationItem[]; meta: NotificationMeta }> {
  const response = await api.get<ApiEnvelope<NotificationItem[]>>('/api/notifications', {
    params: {
      ...(params.page !== undefined ? { page: params.page } : {}),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
      ...(params.unreadOnly !== undefined ? { unreadOnly: params.unreadOnly } : {}),
      ...(params.since ? { since: params.since } : {}),
    },
  });

  return {
    items: response.data.data ?? [],
    meta: response.data.meta ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      total: response.data.data?.length ?? 0,
      totalPages: 1,
    },
  };
}

export async function getUnreadCount(): Promise<number> {
  const response = await api.get<ApiEnvelope<{ count: number }>>(
    '/api/notifications/unread-count'
  );
  return response.data.data?.count ?? 0;
}

export async function markNotificationRead(id: number): Promise<NotificationItem> {
  const response = await api.patch<ApiEnvelope<NotificationItem>>(
    `/api/notifications/${id}/read`
  );
  return response.data.data;
}

export async function markAllNotificationsRead(): Promise<{ updatedCount: number }> {
  const response = await api.patch<ApiEnvelope<{ updatedCount: number }>>(
    '/api/notifications/read-all'
  );
  return response.data.data;
}

export async function deleteNotification(id: number): Promise<{ id: number }> {
  const response = await api.delete<ApiEnvelope<{ id: number }>>(
    `/api/notifications/${id}`
  );
  return response.data.data;
}
