import React from 'react';
import { InvoiceStatus } from '@/lib/api/invoice.api';
import StatusPill, { StatusPillTone } from '@/components/shared/StatusPill';

interface Props {
  status: InvoiceStatus | string;
  className?: string;
}

const STATUS_META: Record<string, { label: string; tone: StatusPillTone }> = {
  DRAFT: { label: 'Bản nháp', tone: 'neutral' },
  ISSUED: { label: 'Chờ thanh toán', tone: 'primary' },
  PAID: { label: 'Đã thanh toán', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
  REFUNDED: { label: 'Đã hoàn tiền', tone: 'purple' },
  PENDING: { label: 'Chờ xử lý', tone: 'warning' },
  OVERDUE: { label: 'Quá hạn', tone: 'warning' },
};

export default function InvoiceStatusBadge({ status, className = '' }: Props) {
  const conf = STATUS_META[status] || { label: String(status), tone: 'neutral' as StatusPillTone };
  return <StatusPill label={conf.label} tone={conf.tone} className={className} />;
}
