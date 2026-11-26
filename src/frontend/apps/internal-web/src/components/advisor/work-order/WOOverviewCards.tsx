'use client';
import React from 'react';
import { formatVND } from '@/lib/utils/formatters';

type OverviewData = {
  checkInTime: string;
  bay: string;
  jobsTotal: number;
  jobsInProgress: number;
  jobsPending: number;
  partsTotal: number;
  partsIn: number;
  quotationTotal: number;
  quotationQuotes: number;
  quotationApproved: number;
  quotationPending: number;
  billingCollected: number;
  billingInvoices: number;
  billingInsurer: number;
};

export default function WOOverviewCards({ data }: { data: OverviewData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 lg:divide-x divide-outline-variant/60 border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest shadow-sm mb-6">
      {/* Check-in */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">calendar_today</span>
          Tiếp nhận
        </span>
        <div className="text-title-md font-bold text-on-surface leading-tight">{data.checkInTime}</div>
        <div className="text-body-sm text-on-surface-variant mt-2">{data.bay}</div>
      </div>

      {/* Jobs */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2">
          Hạng mục
        </span>
        <div className="text-title-md font-bold text-on-surface leading-tight">{data.jobsTotal} công việc</div>
        <div className="text-body-sm text-on-surface-variant mt-2">
          {data.jobsInProgress === 0 && data.jobsPending === 0 && data.jobsTotal > 0 ? 'Đã hoàn tất thi công' : `${data.jobsInProgress} đang làm · ${data.jobsPending} chờ`}
        </div>
      </div>

      {/* Parts */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2">
          Phụ tùng
        </span>
        <div className="text-title-md font-bold font-mono tabular-nums text-on-surface leading-tight">{data.partsIn} / {data.partsTotal}</div>
        <div className="text-body-sm text-on-surface-variant mt-2">
          {data.partsTotal === 0 ? 'không dùng phụ tùng' : data.partsIn === data.partsTotal ? 'đã cấp phát / lắp ráp đủ' : 'đang chờ xuất kho'}
        </div>
      </div>

      {/* Quotation */}
      <div className="p-4 flex flex-col justify-start">
        <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2">
          Báo giá
        </span>
        <div className="text-title-lg font-bold font-mono tabular-nums text-primary leading-tight mt-1 whitespace-nowrap">
          {formatVND(data.quotationTotal)}
        </div>
        <div className="text-body-sm text-on-surface-variant mt-2 leading-tight">
          {data.quotationQuotes} báo giá · {formatVND(data.quotationApproved)} đã duyệt
        </div>
      </div>
      
      {/* Billing */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2">
          Thanh toán
        </span>
        <div className="text-title-md font-bold font-mono tabular-nums text-on-surface leading-tight">
          {formatVND(data.billingCollected)} đã thu
        </div>
        <div className="text-body-sm text-on-surface-variant mt-2 leading-tight">
          {data.billingInvoices} hóa đơn · {formatVND(data.billingInsurer)} BH trả
        </div>
      </div>
    </div>
  );
}
