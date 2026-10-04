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
  'Chờ duyệt',
  'Đã duyệt',
  'Đang sửa',
  'Kiểm tra',
  'Chờ thanh toán',
  'Chờ giao xe',
  'Đóng'
];

const statusMap: Record<string, string> = {
  'DRAFT': 'Tiếp nhận',
  'IN_PLANNING': 'Tiếp nhận',
  'NEW_INTAKE': 'Tiếp nhận',
  'PENDING_APPROVAL': 'Chờ duyệt',
  'APPROVED': 'Đã duyệt',
  'IN_PROGRESS': 'Đang sửa',
  'REPAIRING': 'Đang sửa',
  'QC': 'Kiểm tra',
  'BILLING_REQUESTED': 'Chờ thanh toán',
  'PENDING_PAYMENT': 'Chờ thanh toán',
  'FINANCIAL_CLEARED': 'Chờ giao xe',
  'READY': 'Chờ giao xe',
  'RELEASED': 'Đóng',
  'CLOSED': 'Đóng',
  'COMPLETED': 'Đóng',
  'CANCELLED': 'Đã hủy'
};

export default function WOBadgeBar({ licensePlate, vehicleClass, vehicleName, customerName, statusBadge }: Props) {
  const mappedStatus = statusMap[statusBadge] || statusBadge;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-outline-variant bg-surface-container-lowest gap-6 overflow-x-auto styled-scrollbar">
      <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
        {/* License Plate */}
        <span className="px-2.5 py-1 border border-outline-variant rounded text-label-md font-bold font-code-mono text-on-surface shadow-sm uppercase whitespace-nowrap">
          {licensePlate}
        </span>
        
        {/* Vehicle Class (PHV, Normal, etc) */}
        <span className="px-2 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded text-label-sm font-bold uppercase tracking-wide whitespace-nowrap">
          {vehicleClass}
        </span>
        
        {/* Vehicle Name & Customer */}
        <div className="flex items-center gap-2 text-body-md whitespace-nowrap">
          <span className="font-semibold text-on-surface">{vehicleName}</span>
          <span className="text-outline font-bold">·</span>
          <span className="text-on-surface-variant">{customerName}</span>
        </div>
      </div>
      
      {/* Status Pipeline */}
      <div className="flex-shrink-0">
        <ChevronPipeline statuses={STATUS_PIPELINE} currentStatus={mappedStatus} />
      </div>
    </div>
  );
}
