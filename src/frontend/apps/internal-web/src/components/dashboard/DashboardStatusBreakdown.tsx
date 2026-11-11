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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800 rounded"></div>
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2"></div>
        <div className="space-y-3 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const total = (data || []).reduce((acc, curr) => acc + curr.count, 0);
  const maxCount = Math.max(1, ...(data || []).map((d) => d.count));

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">bar_chart</span>
          <p className="text-xs">Không có dữ liệu phân bổ</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between"
      style={height ? { minHeight: height } : undefined}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Tổng: {total}
            </span>
            {selectedCategory && onSelectCategory && (
              <button
                onClick={() => onSelectCategory('')}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5 hover:underline"
              >
                ✕ Hủy lọc
              </button>
            )}
          </div>
        </div>

        {/* 1. Segmented Linear Composition Bar (Thanh phân đoạn lũy tiến 100%) */}
        <div className="mb-4">
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner">
            {data.map((item, idx) => {
              const pct = (item.count / total) * 100;
              const fill = item.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
              const isSelected = selectedCategory === item.category;
              return (
                <div
                  key={idx}
                  style={{ width: `${pct}%`, backgroundColor: fill }}
                  className={`h-full transition-all duration-300 relative group cursor-pointer ${
                    selectedCategory && !isSelected ? 'opacity-30' : 'opacity-100'
                  }`}
                  onClick={() => onSelectCategory && onSelectCategory(isSelected ? '' : item.category)}
                  title={`${item.label || item.category}: ${item.count} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
            <span>0%</span>
            <span>Tỷ trọng toàn cảnh 100%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 2. Horizontal Ranked Bars (Thanh đo ngang so sánh trực quan) */}
        <div className="space-y-2.5">
          {data.map((item, idx) => {
            const isSelected = selectedCategory === item.category;
            const pctOfTotal = ((item.count / total) * 100).toFixed(1);
            const barWidthPct = (item.count / maxCount) * 100;
            const fill = item.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];

            return (
              <div
                key={idx}
                onClick={() => onSelectCategory && onSelectCategory(isSelected ? '' : item.category)}
                className={`p-2 rounded-lg transition-all ${
                  onSelectCategory ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60' : ''
                } ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 shadow-xs'
                    : 'border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: fill }}
                    ></span>
                    <span
                      className={`truncate font-medium ${
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
                    <span className="text-slate-400 text-[11px]">({pctOfTotal}%)</span>
                  </div>
                </div>

                {/* Horizontal Progress Bar Track */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
        <div className="text-[11px] text-slate-400 text-center pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
          💡 Nhấp vào bất kỳ thanh phân loại nào để lọc chéo dữ liệu danh sách
        </div>
      )}
    </div>
  );
};
