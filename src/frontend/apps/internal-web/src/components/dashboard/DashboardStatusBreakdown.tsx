'use client';

import React from 'react';

export interface BreakdownItem {
  category: string;
  count: number;
  color?: string;
  label?: string;
}

export interface DashboardStatusBreakdownProps {
  title: string;
  subtitle?: string;
  data: BreakdownItem[];
  selectedCategory?: string | null;
  onSelectCategory?: (category: string) => void;
  height?: number;
  isLoading?: boolean;
}

const DEFAULT_PALETTE = [
  '#0050cd', // Blue 600
  '#0ea5e9', // Sky 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#ef4444', // Rose 500
  '#8b5cf6', // Purple 500
  '#64748b', // Slate 500
  '#06b6d4', // Cyan 500
];

export const DashboardStatusBreakdown: React.FC<DashboardStatusBreakdownProps> = ({
  title,
  subtitle,
  data = [],
  selectedCategory,
  onSelectCategory,
  height,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800 rounded"></div>
        <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2"></div>
        <div className="space-y-3 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const total = (data || []).reduce((acc, curr) => acc + curr.count, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between">
        <div>
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 mb-4">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">bar_chart</span>
          <p className="text-xs">Không có dữ liệu phân bổ</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full"
      style={height ? { minHeight: height } : undefined}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 tabular-nums">
              Tổng: {total}
            </span>
            {selectedCategory && onSelectCategory && (
              <button
                type="button"
                onClick={() => onSelectCategory('')}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                ✕ Hủy lọc
              </button>
            )}
          </div>
        </div>

        {/* 1. Segmented Linear Composition Bar (Thanh phân đoạn lũy tiến 100%) */}
        <div className="mb-5">
          <div className="h-3.5 w-full rounded-full p-0.5 bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
            {data.map((item, idx) => {
              const pct = (item.count / total) * 100;
              const fill = item.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
              const isSelected = selectedCategory === item.category;
              return (
                <div
                  key={idx}
                  style={{ width: `${pct}%`, backgroundColor: fill }}
                  className={`h-full rounded-full transition-all duration-300 relative group cursor-pointer ${
                    selectedCategory && !isSelected ? 'opacity-30' : 'opacity-100'
                  }`}
                  onClick={() => onSelectCategory && onSelectCategory(isSelected ? '' : item.category)}
                  title={`${item.label || item.category}: ${item.count} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-mono tabular-nums">
            <span>0%</span>
            <span>Tỷ trọng toàn cảnh 100%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 2. Horizontal Proportional Bars (Thanh đo ngang đúng tỷ lệ %) */}
        <div className="space-y-2">
          {data.map((item, idx) => {
            const isSelected = selectedCategory === item.category;
            const pctOfTotal = ((item.count / total) * 100).toFixed(1);
            const barWidthPct = Math.max(4, (item.count / total) * 100);
            const fill = item.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];

            return (
              <div
                key={idx}
                onClick={() => onSelectCategory && onSelectCategory(isSelected ? '' : item.category)}
                className={`sa-press px-3 py-2.5 rounded-2xl border transition-all ${
                  onSelectCategory ? 'cursor-pointer hover:bg-slate-50/90 dark:hover:bg-slate-800/60' : ''
                } ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 shadow-xs'
                    : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900"
                      style={{ backgroundColor: fill }}
                    ></span>
                    <span
                      className={`truncate font-semibold ${
                        isSelected
                          ? 'text-[#0050cd] dark:text-blue-400 font-bold'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.label || item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs tabular-nums">
                    <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                      {pctOfTotal}%
                    </span>
                  </div>
                </div>

                {/* Horizontal Progress Bar Track */}
                <div className="h-2 w-full bg-slate-100/90 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${barWidthPct}%`,
                      backgroundColor: fill,
                      opacity: selectedCategory && !isSelected ? 0.35 : 1,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {onSelectCategory && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
          <span className="material-symbols-outlined text-[15px] text-slate-400">filter_alt</span>
          <span>Nhấp vào bất kỳ thanh phân loại nào để lọc chéo dữ liệu danh sách</span>
        </div>
      )}
    </div>
  );
};
