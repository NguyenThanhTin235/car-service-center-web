'use client';

import React from 'react';
import NotificationCenterView, {
  NotificationCategoryTab,
} from '@/components/notifications/NotificationCenterView';

const STAFF_CATEGORIES: NotificationCategoryTab[] = [
  { key: 'all', label: 'Tất cả' },
  {
    key: 'appointments',
    label: 'Lịch hẹn',
    types: [
      'APPOINTMENT_CONFIRMED',
      'APPOINTMENT_CANCELLED',
      'APPOINTMENT_REMINDER',
      'APPOINTMENT_RESCHEDULED',
    ],
  },
  {
    key: 'billing',
    label: 'Yêu cầu Thu ngân',
    types: ['INVOICE_ISSUED'],
  },
  {
    key: 'payments',
    label: 'Thanh toán',
    types: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED'],
  },
  {
    key: 'tasks',
    label: 'Công việc KTV',
    types: [
      'INTAKE_CREATED',
      'WORK_ORDER_STARTED',
      'SERVICE_ITEM_STARTED',
      'SERVICE_ITEM_COMPLETED',
      'TASK_ASSIGNED',
      'VEHICLE_READY',
      'VEHICLE_HANDOVER',
    ],
  },
];

export default function StaffNotificationsPage() {
  return (
    <NotificationCenterView
      portalName="Quầy Dịch Vụ"
      subtitle="Theo dõi lịch hẹn khách hàng, tiếp nhận xe, yêu cầu thu ngân và tiến độ sửa chữa."
      categories={STAFF_CATEGORIES}
    />
  );
}
