'use client';

import React from 'react';
import NotificationCenterView, {
  NotificationCategoryTab,
} from '@/components/notifications/NotificationCenterView';

const ADVISOR_CATEGORIES: NotificationCategoryTab[] = [
  { key: 'all', label: 'Tất cả' },
  {
    key: 'intake',
    label: 'Xe chờ tiếp nhận',
    types: ['INTAKE_CREATED', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_RESCHEDULED'],
  },
  {
    key: 'quotations',
    label: 'Báo giá',
    types: ['QUOTATION_SENT', 'QUOTATION_APPROVED', 'QUOTATION_REJECTED'],
  },
  {
    key: 'qc_handover',
    label: 'Kiểm tra QC & Bàn giao',
    types: [
      'QC_PASSED',
      'QC_FAILED',
      'VEHICLE_READY',
      'VEHICLE_HANDOVER',
      'WORK_ORDER_STARTED',
      'SERVICE_ITEM_COMPLETED',
    ],
  },
];

export default function AdvisorNotificationsPage() {
  return (
    <NotificationCenterView
      portalName="Cố Vấn Dịch Vụ"
      subtitle="Cập nhật xe chờ tiếp nhận, phản hồi báo giá từ khách hàng, kết quả QC và bàn giao."
      categories={ADVISOR_CATEGORIES}
    />
  );
}
