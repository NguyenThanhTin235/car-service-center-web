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
    types: ['BILLING_REQUEST', 'INVOICE_ISSUED'],
  },
  {
    key: 'payments',
    label: 'Thanh toán',
    types: ['PAYMENT_SUCCESS'],
  },
  {
    key: 'tasks',
    label: 'Công việc KTV',
    types: [
      'CHECKIN_READY',
      'WORK_ORDER_STARTED',
      'SERVICE_ITEM_STARTED',
      'TASK_ASSIGNED',
      'VEHICLE_READY',
      'VEHICLE_HANDOVER',
    ],
  },
];

export default function StaffNotificationsPage() {
  return (
    <div className="flex flex-col gap-5 max-w-[1440px] mx-auto w-full">
      <NotificationCenterView
        portalName="Quầy Dịch Vụ"
        subtitle="Theo dõi lịch hẹn khách hàng, tiếp nhận xe, yêu cầu thu ngân và tiến độ sửa chữa."
        categories={STAFF_CATEGORIES}
        actionsPlacement="below-filters"
        hideHeader
      />
    </div>
  );
}
