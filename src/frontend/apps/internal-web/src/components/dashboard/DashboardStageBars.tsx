'use client';

import React from 'react';

export interface StageBarItem {
  key: string;
  label: string;
  count: number;
  highlight?: boolean;
  targetQuota?: number; // Định mức dự kiến (nếu có)
  subLabel?: string;
}

export interface DashboardStageBarsProps {
  title: string;
  subtitle?: string;
  stages: StageBarItem[];
  highlightTooltipTitle?: string;
  highlightTooltipPrimaryText?: string;
  highlightTooltipSecondaryText?: string;
  onSelectStage?: (key: string) => void;
  isLoading?: boolean;
}

export const DashboardStageBars: React.FC<DashboardStageBarsProps> = ({
  title,
  subtitle,
  stages = [],
  highlightTooltipTitle,
  highlightTooltipPrimaryText,
  highlightTooltipSecondaryText,
  onSelectStage,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-xs border border-slate-200/70 dark:border-slate-800 animate-pulse space-y-4">
        <div className="h-5 w-56 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-3 w-80 bg-slate-100 dark:bg-slate-800 rounded"></div>
        <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 rounded-xl mt-4"></div>
      </div>
    );
  }

  const totalCount = stages.reduce((acc, curr) => acc + curr.count, 0);
  const maxCount = Math.max(1, ...stages.map((s) => s.count));

  // Tính chiều cao cột cân đối để hiển thị số lượng rõ ràng trên đỉnh mỗi cột
  const computedBars = stages.map((s, idx) => {
    const totalHeightPct =
      totalCount > 0
        ? Math.max(22, Math.min(68, Math.round((s.count / maxCount) * 60) + 8))
        : [35, 55, 30, 45, 60, 28][idx % 6];
    const hatchHeightPct = 25;
    const solidHeightPct = 75;

    return {
      ...s,
      totalHeightPct,
      solidHeightPct,
      hatchHeightPct,
    };
  });

  const highlightedItem = stages.find((s) => s.highlight) || stages[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-xs border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-diagonal-stripes inline-block shrink-0" />
            Định mức chuẩn
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0c2340] dark:bg-slate-300 inline-block shrink-0" />
            Thực tế ({totalCount})
          </span>
          <span className="flex items-center gap-1.5 text-[#0050cd] dark:text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0050cd] inline-block shrink-0" />
            Trọng tâm xử lý
          </span>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div
        className="grid gap-2 sm:gap-4 items-end h-52 pt-10 sm:pt-12 px-1 sm:px-3 border-b border-slate-100 dark:border-slate-800 pb-3 relative"
        style={{ gridTemplateColumns: `repeat(${stages.length > 0 ? stages.length : 8}, minmax(0, 1fr))` }}
      >
        {computedBars.map((bar) => {
          if (bar.highlight) {
            return (
              <div
                key={bar.key}
                onClick={() => onSelectStage && onSelectStage(bar.key)}
                className="flex flex-col items-center h-full justify-end relative cursor-pointer group"
              >
                {/* Floating Dark Callout Tooltip */}
                <div className="absolute -top-8 sm:-top-9 left-1/2 -translate-x-1/2 z-10 bg-[#0c2340] text-white rounded-2xl px-3 py-1.5 text-[11px] shadow-lg pointer-events-none whitespace-nowrap">
                  <div className="font-bold text-zinc-200 text-center">
                    {highlightTooltipTitle || bar.label}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span>
                      {highlightTooltipPrimaryText || `Thực tế: ${bar.count} ${bar.label.toLowerCase()}`}
                    </span>
                  </div>
                  {highlightTooltipSecondaryText && (
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] shrink-0" />
                      <span>{highlightTooltipSecondaryText}</span>
                    </div>
                  )}
                </div>

                {/* Số lượng duy nhất hiển thị trên đỉnh cột */}
                <span className="font-mono text-xs sm:text-sm font-extrabold text-[#0050cd] dark:text-blue-400 mb-1.5 tabular-nums">
                  {bar.count}
                </span>

                <div className="w-full max-w-[70px] sm:max-w-[78px] h-[78%] flex flex-col rounded-xl overflow-hidden border border-[#0050cd]/40 dark:border-blue-500/40 shadow-xs">
                  <div className="w-full bg-diagonal-stripes flex-1 opacity-80 min-h-[22px]" />
                  <div className="bg-[#0050cd] text-white h-7 flex items-center justify-center text-[10px] sm:text-[11px] font-bold tracking-tight">
                    Ưu tiên
                  </div>
                </div>

                <span className="text-[10px] sm:text-[11px] font-bold text-[#0050cd] dark:text-blue-400 mt-2 truncate max-w-full text-center">
                  {bar.label}
                </span>
              </div>
            );
          }

          return (
            <div
              key={bar.key}
              onClick={() => onSelectStage && onSelectStage(bar.key)}
              className="flex flex-col items-center h-full justify-end cursor-pointer group"
              title={`${bar.label}: ${bar.count}`}
            >
              {/* Số lượng hiển thị trên đỉnh cột */}
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-[#0050cd] group-hover:scale-110 transition-all mb-1.5 tabular-nums">
                {bar.count}
              </span>

              <div
                style={{ height: `${bar.totalHeightPct}%` }}
                className="w-4 sm:w-5 flex flex-col items-center justify-end gap-0.5"
              >
                <div
                  style={{ height: `${bar.hatchHeightPct}%` }}
                  className="w-full bg-diagonal-stripes rounded-t-xs opacity-75 group-hover:opacity-100 transition-opacity"
                />
                <div
                  style={{ height: `${bar.solidHeightPct}%` }}
                  className="w-full bg-[#0c2340] group-hover:bg-[#0050cd] rounded-b-xs transition-colors"
                />
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-2 truncate max-w-full text-center">
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardStageBars;
