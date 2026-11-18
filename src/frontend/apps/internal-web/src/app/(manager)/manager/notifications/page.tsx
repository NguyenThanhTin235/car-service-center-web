'use client';

import React from 'react';
import NotificationCenterView, {
  NotificationCategoryTab,
} from '@/components/notifications/NotificationCenterView';

const MANAGER_CATEGORIES: NotificationCategoryTab[] = [
  { key: 'all', label: 'Tất cả' },
  {
    key: 'inventory',
    label: 'Cảnh báo Tồn kho',
    types: ['LOW_STOCK_ALERT'],
  },
  {
    key: 'operations',
    label: 'Vận hành & QC',
    types: [
      'WORK_ORDER_STARTED',
      'QC_PASSED',
      'QC_FAILED',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'SYSTEM_ALERT',
    ],
  },
];

export default function ManagerNotificationsPage() {
  return (
    <NotificationCenterView
      portalName="Quản Lý Dịch Vụ"
      subtitle="Giám sát cảnh báo tồn kho phụ tùng, chất lượng QC và tình hình vận hành xưởng."
      categories={MANAGER_CATEGORIES}
    />
  );
}
