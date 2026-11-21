import React from 'react';
import { InvoiceStatus } from '@/lib/api/invoice.api';

interface Props {
  status: InvoiceStatus | string;
  className?: string;
}

const STATUS_TEXT_MAP: Record<string, string> = {
  DRAFT: 'Bản nháp',
  ISSUED: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
  PENDING: 'Chờ xử lý',
  OVERDUE: 'Quá hạn',
};

export default function InvoiceStatusBadge({ status, className = '' }: Props) {
  switch (status) {
    case 'DRAFT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Bản nháp
        </span>
      );
    case 'ISSUED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0866ff] animate-pulse"></span>
          Chờ thanh toán
        </span>
      );
    case 'PAID':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          Đã thanh toán
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <span className="material-symbols-outlined text-[14px]">cancel</span>
          Đã hủy
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          {STATUS_TEXT_MAP[status] || status}
        </span>
      );
  }
}
