'use client';

import React from 'react';

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  subText?: string;
  subTextColor?: string;
  iconBgClass?: string;
}

function StatsCard({ icon, label, value, subText, subTextColor, iconBgClass }: StatsCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass || 'bg-primary/10 text-primary'}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-display-sm font-display-sm font-bold text-on-surface">{value}</span>
        {typeof value === 'number' && <span className="text-body-md font-body-md text-on-surface-variant">xe</span>}
      </div>
      {subText && (
        <span className={`text-label-sm font-label-sm ${subTextColor || 'text-on-surface-variant'}`}>
          {subText}
        </span>
      )}
    </div>
  );
}

interface IntakeQueueStatsProps {
  totalQueue: number;
  avgWaitMinutes: number;
  urgentCount: number;
}

export default function IntakeQueueStats({ totalQueue, avgWaitMinutes, urgentCount }: IntakeQueueStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        icon="directions_car"
        label="Tổng xe chờ tiếp nhận"
        value={totalQueue}
        subText={totalQueue > 0 ? `+${Math.min(totalQueue, 2)} xe mới đến` : 'Không có xe đang chờ'}
        subTextColor="text-secondary"
        iconBgClass="bg-primary/10 text-primary"
      />
      <StatsCard
        icon="schedule"
        label="Thời gian chờ TB"
        value={`${avgWaitMinutes}`}
        subText="phút"
        iconBgClass="bg-surface-container text-on-surface-variant"
      />
      <StatsCard
        icon="priority_high"
        label="Ưu tiên cao / Khẩn hẹn"
        value={urgentCount}
        subText={urgentCount > 0 ? `${urgentCount} xe cần xử lý gấp` : 'Không có xe khẩn cấp'}
        subTextColor={urgentCount > 0 ? 'text-error' : 'text-on-surface-variant'}
        iconBgClass={urgentCount > 0 ? 'bg-error-container text-error' : 'bg-surface-container text-on-surface-variant'}
      />
      <StatsCard
        icon="support_agent"
        label="Cố vấn khả dụng"
        value="3/5"
        subText="Đang trực ca sáng"
        subTextColor="text-secondary"
        iconBgClass="bg-secondary-container/30 text-secondary"
      />
    </div>
  );
}
