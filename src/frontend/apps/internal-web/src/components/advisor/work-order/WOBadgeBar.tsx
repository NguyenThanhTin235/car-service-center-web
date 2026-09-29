'use client';
import React from 'react';
import ChevronPipeline from './ChevronPipeline';

type Props = {
  licensePlate: string;
  vehicleClass: string;
  vehicleName: string;
  customerName: string;
  statusBadge: string;
};

const STATUS_PIPELINE = [
  'Tiếp nhận',
  'Lập kế hoạch',
  'Chờ duyệt',
  'Đã duyệt',
  'Đang sửa',
  'Chờ thanh toán',
  'Chờ giao xe',
  'Đóng'
];

const statusMap: Record<string, string> = {
  'DRAFT': 'Tiếp nhận',
  'IN_PLANNING': 'Lập kế hoạch',
  'PENDING_APPROVAL': 'Chờ duyệt',
  'APPROVED': 'Đã duyệt',
  'IN_PROGRESS': 'Đang sửa',
  'BILLING_REQUESTED': 'Chờ thanh toán',
  'FINANCIAL_CLEARED': 'Chờ giao xe',
  'RELEASED': 'Đóng',
  'CLOSED': 'Đóng',
  'CANCELLED': 'Đã hủy'
};

export default function WOBadgeBar({ licensePlate, vehicleClass, vehicleName, customerName, statusBadge }: Props) {
  const mappedStatus = statusMap[statusBadge] || statusBadge;

  return (
    <div className="flex items-center justify-between px-6 py-2 border-b border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center gap-3">
        {/* License Plate */}
        <span className="px-2.5 py-1 border border-outline-variant rounded text-label-md font-bold font-code-mono text-on-surface shadow-sm uppercase">
          {licensePlate}
        </span>
        
        {/* Vehicle Class (PHV, Normal, etc) */}
        <span className="px-2 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded text-label-sm font-bold uppercase tracking-wide">
          {vehicleClass}
        </span>
        
        {/* Vehicle Name & Customer */}
        <div className="flex items-center gap-2 text-body-md">
          <span className="font-semibold text-on-surface">{vehicleName}</span>
          <span className="text-outline font-bold">·</span>
          <span className="text-on-surface-variant">{customerName}</span>
        </div>
      </div>
      
      {/* Status Pipeline */}
      <div className="flex-shrink-0 ml-4">
        <ChevronPipeline statuses={STATUS_PIPELINE} currentStatus={mappedStatus} />
      </div>
    </div>
  );
}
