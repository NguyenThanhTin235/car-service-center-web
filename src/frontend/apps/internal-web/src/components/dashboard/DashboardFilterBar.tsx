'use client';

import React from 'react';
import { DashboardPeriod, DashboardScope } from '@/hooks/useDashboardData';

export interface DashboardFilterBarProps {
  period: DashboardPeriod;
  onPeriodChange: (p: DashboardPeriod) => void;
  scope?: DashboardScope;
  onScopeChange?: (s: DashboardScope) => void;
  showScopeSelector?: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
}

const PERIOD_OPTIONS: { key: DashboardPeriod; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7days', label: '7 ngày qua' },
  { key: '30days', label: '30 ngày' },
  { key: 'this_month', label: 'Tháng này' },
];

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  period,
  onPeriodChange,
  scope = 'my',
  onScopeChange,
  showScopeSelector = false,
  onRefresh,
  isRefreshing = false,
  lastUpdated,
}) => {
  const formatTime = (d?: Date) => {
    if (!d) return '';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Quick Period Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onPeriodChange(opt.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === opt.key
                  ? 'bg-white dark:bg-slate-700 text-[#0050cd] dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Scope Selector for SA & Staff */}
        {showScopeSelector && onScopeChange && (
          <div className="flex items-center bg-blue-50/70 dark:bg-blue-950/40 p-1 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <button
              onClick={() => onScopeChange('my')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                scope === 'my'
                  ? 'bg-[#0050cd] text-white shadow-xs'
                  : 'text-blue-700 dark:text-blue-300 hover:text-blue-900'
              }`}
            >
              Việc của tôi
            </button>
            <button
              onClick={() => onScopeChange('workshop')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                scope === 'workshop'
                  ? 'bg-[#0050cd] text-white shadow-xs'
                  : 'text-blue-700 dark:text-blue-300 hover:text-blue-900'
              }`}
            >
              Toàn bộ xưởng
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500">
        {lastUpdated && (
          <span className="text-[11px] text-slate-400 hidden md:inline">
            Đồng bộ lúc: {formatTime(lastUpdated)}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>
            sync
          </span>
          {isRefreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>
    </div>
  );
};
