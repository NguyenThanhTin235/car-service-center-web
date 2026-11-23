'use client';

import React from 'react';
import NotificationCenterView, {
  NotificationCategoryTab,
} from '@/components/notifications/NotificationCenterView';

const ADMIN_CATEGORIES: NotificationCategoryTab[] = [
  { key: 'all', label: 'Tất cả' },
  {
    key: 'system',
    label: 'Hệ thống & Bảo mật',
    types: ['SYSTEM_ALERT'],
  },
  {
    key: 'general',
    label: 'Thông báo chung',
    types: ['GENERAL'],
  },
];

export default function AdminNotificationsPage() {
  return (
    <div className="flex flex-col gap-5 max-w-[1440px] mx-auto w-full">
      <NotificationCenterView
        portalName="Quản Trị Hệ Thống"
        subtitle="Theo dõi cảnh báo bảo mật, trạng thái hạ tầng và các thông báo quản trị hệ thống."
        categories={ADMIN_CATEGORIES}
        actionsPlacement="below-filters"
        hideHeader
      />
    </div>
  );
}
