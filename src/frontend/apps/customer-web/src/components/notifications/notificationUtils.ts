import { NotificationItem } from '@/lib/api/notification.api';

export function getNotificationHref(item: NotificationItem): string {
  const entity = (item.entityType || '').toUpperCase();
  const type = (item.type || '').toUpperCase();

  if (entity === 'APPOINTMENT' || type.startsWith('APPOINTMENT_')) {
    return '/customer/appointments';
  }
  if (
    entity === 'QUOTATION' ||
    entity === 'WORK_ORDER' ||
    type.startsWith('QUOTATION_') ||
    type.startsWith('WORK_ORDER_') ||
    type.startsWith('SERVICE_ITEM_') ||
    type.startsWith('CHECKIN_') ||
    type.startsWith('QC_') ||
    type.startsWith('VEHICLE_')
  ) {
    return '/customer/profile?tab=tracking';
  }
  if (
    entity === 'INVOICE' ||
    type.startsWith('INVOICE_') ||
    type.startsWith('PAYMENT_')
  ) {
    return '/customer/profile?tab=invoices';
  }
  return '/customer/notifications';
}

export function getNotificationIcon(type: string): {
  icon: string;
  bgClass: string;
  textClass: string;
} {
  const normalized = type.toUpperCase();
  if (normalized.startsWith('APPOINTMENT_CANCELLED') || normalized === 'QUOTATION_REJECTED') {
    return {
      icon: 'event_busy',
      bgClass: 'bg-error-container/40',
      textClass: 'text-error',
    };
  }
  if (normalized.startsWith('APPOINTMENT_')) {
    return {
      icon: 'calendar_month',
      bgClass: 'bg-primary-fixed',
      textClass: 'text-primary',
    };
  }
  if (normalized.startsWith('QUOTATION_')) {
    return {
      icon: 'request_quote',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-700',
    };
  }
  if (normalized.startsWith('INVOICE_') || normalized.startsWith('PAYMENT_')) {
    return {
      icon: 'receipt_long',
      bgClass: 'bg-emerald-100',
      textClass: 'text-emerald-700',
    };
  }
  return {
    icon: 'build',
    bgClass: 'bg-secondary-container',
    textClass: 'text-on-secondary-container',
  };
}

export function formatRelativeTimeVi(dateInput: string): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Vừa xong';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
