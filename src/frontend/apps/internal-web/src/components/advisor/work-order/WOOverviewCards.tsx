'use client';
import React from 'react';

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
    <div className="grid grid-cols-5 border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest shadow-sm mb-6">
      {/* Check-in */}
      <div className="p-4 border-r border-outline-variant/60 flex flex-col justify-between">
        <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          Tiếp nhận
        </span>
        <div className="text-title-md font-bold text-on-surface leading-tight">{data.checkInTime}</div>
        <div className="text-body-sm text-on-surface-variant mt-2">{data.bay}</div>
      </div>

      {/* Jobs */}
      <div className="p-4 border-r border-outline-variant/60 flex flex-col justify-between">
        <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2">
          Hạng mục
        </span>
        <div className="text-title-md font-bold text-on-surface leading-tight">{data.jobsTotal} công việc</div>
        <div className="text-body-sm text-on-surface-variant mt-2">
          {data.jobsInProgress} đang làm · {data.jobsPending} chờ
        </div>
      </div>

      {/* Parts */}
      <div className="p-4 border-r border-outline-variant/60 flex flex-col justify-between">
        <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2">
          Phụ tùng
        </span>
        <div className="text-title-md font-bold text-on-surface leading-tight">{data.partsIn} / {data.partsTotal}</div>
        <div className="text-body-sm text-on-surface-variant mt-2">
          {data.partsIn === data.partsTotal ? 'đã đủ phụ tùng' : 'đang chờ phụ tùng'}
        </div>
      </div>

      {/* Quotation */}
      <div className="p-4 border-r border-outline-variant/60 flex flex-col justify-start">
        <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2">
          Báo giá
        </span>
        <div className="text-headline-sm font-bold text-primary leading-tight mt-1 whitespace-nowrap">S$ {data.quotationTotal.toLocaleString()}</div>
      </div>
      
      {/* Billing */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2">
          Thanh toán
        </span>
        <div className="text-title-md font-bold text-on-surface leading-tight">S$ {data.billingCollected.toLocaleString()} đã thu</div>
        <div className="text-body-sm text-on-surface-variant mt-2 leading-tight">
          {data.billingInvoices} hóa đơn · S$ {data.billingInsurer.toLocaleString()} BH trả
        </div>
      </div>
    </div>
  );
}
