'use client';
import React from 'react';
import ChevronPipeline from './ChevronPipeline';
import { STATUS_PIPELINE, WO_STATUS_META, formatVehicleSize } from './work-order.constants';

type Props = {
  licensePlate: string;
  vehicleClass: string;
  vehicleName: string;
  customerName: string;
  statusBadge: string;
  inlineStatus?: boolean;
};

export default function WOBadgeBar({
  licensePlate,
  vehicleClass,
  vehicleName,
  customerName,
  statusBadge,
  inlineStatus = false
}: Props) {
  const mappedStatus = WO_STATUS_META[statusBadge]?.pipelineLabel || statusBadge;
  const formattedVehicleClass = formatVehicleSize(vehicleClass) === 'N/A' ? vehicleClass : formatVehicleSize(vehicleClass);

  if (inlineStatus) {
    return (
      <div className="flex items-center justify-between gap-4 px-6 py-2 border-b border-outline-variant bg-surface-container-lowest overflow-x-auto no-scrollbar">
        {/* Left: Vehicle and Customer Info */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* License Plate */}
          <span className="px-2.5 py-1 border border-outline-variant rounded text-label-md font-bold font-code-mono text-on-surface shadow-2xs uppercase whitespace-nowrap bg-surface-container-low/40">
            {licensePlate}
          </span>
          
          {/* Vehicle Class (PHV, Normal, etc) */}
          <span className="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded text-label-xs font-bold uppercase tracking-wide whitespace-nowrap">
            {formattedVehicleClass}
          </span>
          
          {/* Vehicle Name & Customer */}
          <div className="flex items-center gap-2 text-body-sm whitespace-nowrap">
            <span className="font-semibold text-on-surface">{vehicleName}</span>
            <span className="text-outline font-bold">·</span>
            <span className="text-on-surface-variant">{customerName}</span>
            {statusBadge === 'BILLING_REQUESTED' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                Chờ thanh toán
              </span>
            )}
            {statusBadge === 'FINANCIAL_CLEARED' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                Đã thanh toán
              </span>
            )}
          </div>
        </div>

        {/* Right: Status Pipeline */}
        <div className="shrink-0">
          <ChevronPipeline statuses={[...STATUS_PIPELINE]} currentStatus={mappedStatus} compact />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-6 py-3 border-b border-outline-variant bg-surface-container-lowest overflow-hidden">
      <div className="flex flex-wrap items-center gap-3">
        {/* License Plate */}
        <span className="px-2.5 py-1 border border-outline-variant rounded text-label-md font-bold font-code-mono text-on-surface shadow-sm uppercase whitespace-nowrap">
          {licensePlate}
        </span>
        
        {/* Vehicle Class (PHV, Normal, etc) */}
        <span className="px-2 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded text-label-sm font-bold uppercase tracking-wide whitespace-nowrap">
          {formattedVehicleClass}
        </span>
        
        {/* Vehicle Name & Customer */}
        <div className="flex items-center gap-2 text-body-md flex-wrap">
          <span className="font-semibold text-on-surface whitespace-nowrap">{vehicleName}</span>
          <span className="text-outline font-bold hidden sm:inline">·</span>
          <span className="text-on-surface-variant whitespace-nowrap">{customerName}</span>
          {statusBadge === 'BILLING_REQUESTED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
              Chờ thanh toán
            </span>
          )}
          {statusBadge === 'FINANCIAL_CLEARED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Đã thanh toán · Sẵn sàng bàn giao
            </span>
          )}
        </div>
      </div>
      
      {/* Status Pipeline */}
      <div className="w-full overflow-x-auto no-scrollbar pb-1">
        <div className="min-w-max">
          <ChevronPipeline statuses={[...STATUS_PIPELINE]} currentStatus={mappedStatus} />
        </div>
      </div>
    </div>
  );
}
