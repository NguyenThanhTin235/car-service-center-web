import React from 'react';
import { InvoiceStatus } from '@/lib/api/invoice.api';

interface Props {
  status: InvoiceStatus | string;
  className?: string;
}

export default function InvoiceStatusBadge({ status, className = '' }: Props) {
  switch (status) {
    case 'DRAFT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant border border-outline-variant ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
          Bản nháp
        </span>
      );
    case 'ISSUED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          Chờ thanh toán
        </span>
      );
    case 'PAID':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${className}`}
        >
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          Đã thanh toán
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 ${className}`}
        >
          <span className="material-symbols-outlined text-[14px]">cancel</span>
          Đã hủy
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 ${className}`}
        >
          {status}
        </span>
      );
  }
}

