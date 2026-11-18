import { NotificationItem } from '@/lib/api/notification.api';

export function resolveNotificationCenterHref(roles: string[] = []): string {
  const normalizedRoles = roles.map((r) =>
    r.toUpperCase().trim().replace(/[\s-]+/g, '_')
  );

  if (normalizedRoles.some((r) => ['ADMIN', 'ADMINISTRATOR'].includes(r))) {
    return '/admin/notifications';
  }
  if (normalizedRoles.includes('MANAGER')) {
    return '/manager/notifications';
  }
  if (normalizedRoles.some((r) => ['SA', 'ADVISOR', 'SERVICE_ADVISOR'].includes(r))) {
    return '/advisor/notifications';
  }
  if (normalizedRoles.some((r) => ['DESK_STAFF', 'STAFF', 'TECHNICIAN'].includes(r))) {
    return '/staff/notifications';
  }
  return '/staff/notifications';
}

export function resolveNotificationHref(
  item: NotificationItem,
  roles: string[] = []
): string {
  const normalizedRoles = roles.map((r) =>
    r.toUpperCase().trim().replace(/[\s-]+/g, '_')
  );
  const isAdvisor = normalizedRoles.some((r) =>
    ['SA', 'ADVISOR', 'SERVICE_ADVISOR'].includes(r)
  );
  const isManager = normalizedRoles.includes('MANAGER');
  const isAdmin = normalizedRoles.some((r) => ['ADMIN', 'ADMINISTRATOR'].includes(r));

  const entityType = item.entityType?.toUpperCase() || '';
  const entityId = item.entityId;

  switch (entityType) {
    case 'APPOINTMENT':
      return isAdvisor ? '/advisor/intake-queue' : '/staff/appointments';
    case 'INTAKE':
    case 'VEHICLE_INTAKE':
      return isAdvisor ? '/advisor/intake-queue' : '/staff/intake';
    case 'WORK_ORDER':
    case 'QUOTATION':
    case 'INSPECTION':
    case 'QC':
      if (isAdvisor) {
        return entityId ? `/advisor/work-orders/${entityId}` : '/advisor/work-orders';
      }
      return '/staff/intake';
    case 'INVOICE':
      return entityId ? `/staff/billing/${entityId}` : '/staff/billing';
    case 'PAYMENT':
      return '/staff/billing';
    case 'INVENTORY':
    case 'INVENTORY_ITEM':
    case 'PART':
      return isManager || isAdmin ? '/inventory' : '/staff';
    default:
      return resolveNotificationCenterHref(roles);
  }
}

export function formatRelativeTimeVi(dateInput: string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Vừa xong';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatExactDateTimeVi(dateInput: string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  APPOINTMENT_CONFIRMED: 'Xác nhận lịch hẹn',
  APPOINTMENT_CANCELLED: 'Hủy lịch hẹn',
  APPOINTMENT_REMINDER: 'Nhắc lịch hẹn',
  APPOINTMENT_RESCHEDULED: 'Dời lịch hẹn',
  INTAKE_CREATED: 'Tiếp nhận xe',
  QUOTATION_SENT: 'Đã gửi báo giá',
  QUOTATION_APPROVED: 'Khách duyệt báo giá',
  QUOTATION_REJECTED: 'Từ chối báo giá',
  WORK_ORDER_STARTED: 'Bắt đầu sửa chữa',
  SERVICE_ITEM_STARTED: 'Bắt đầu hạng mục',
  SERVICE_ITEM_COMPLETED: 'Hoàn thành hạng mục',
  VEHICLE_READY: 'Xe sẵn sàng bàn giao',
  VEHICLE_HANDOVER: 'Đã bàn giao xe',
  INVOICE_ISSUED: 'Đã xuất hóa đơn',
  PAYMENT_SUCCESS: 'Thanh toán thành công',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  QC_PASSED: 'Kiểm tra QC đạt',
  QC_FAILED: 'Kiểm tra QC không đạt',
  LOW_STOCK_ALERT: 'Cảnh báo tồn kho',
  TASK_ASSIGNED: 'Phân công công việc',
  SYSTEM_ALERT: 'Cảnh báo hệ thống',
  GENERAL: 'Thông báo chung',
};

export function getNotificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_LABELS[type.toUpperCase()] || type;
}

export function getNotificationVisual(type: string): {
  icon: string;
  bgClass: string;
  textClass: string;
} {
  const t = type.toUpperCase();
  if (t.includes('SYSTEM_ALERT')) {
    return {
      icon: 'security',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-600',
    };
  }
  if (t.includes('TASK_ASSIGNED')) {
    return {
      icon: 'engineering',
      bgClass: 'bg-blue-50',
      textClass: 'text-[#0050cd]',
    };
  }
  if (t.includes('PAYMENT_FAILED') || t.includes('CANCELLED') || t.includes('REJECTED') || t.includes('QC_FAILED')) {
    return {
      icon: 'error',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-600',
    };
  }
  if (t.includes('LOW_STOCK')) {
    return {
      icon: 'inventory_2',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-600',
    };
  }
  if (t.includes('PAYMENT_SUCCESS') || t.includes('APPROVED') || t.includes('QC_PASSED') || t.includes('READY') || t.includes('COMPLETED')) {
    return {
      icon: 'check_circle',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-600',
    };
  }
  if (t.includes('APPOINTMENT')) {
    return {
      icon: 'calendar_today',
      bgClass: 'bg-sky-50',
      textClass: 'text-sky-600',
    };
  }
  if (t.includes('INVOICE')) {
    return {
      icon: 'receipt_long',
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-600',
    };
  }
  if (t.includes('QUOTATION') || t.includes('WORK_ORDER') || t.includes('SERVICE_ITEM')) {
    return {
      icon: 'assignment',
      bgClass: 'bg-blue-50',
      textClass: 'text-[#0050cd]',
    };
  }
  if (t.includes('INTAKE') || t.includes('VEHICLE')) {
    return {
      icon: 'directions_car',
      bgClass: 'bg-blue-50',
      textClass: 'text-[#0050cd]',
    };
  }
  return {
    icon: 'notifications',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-600',
  };
}
