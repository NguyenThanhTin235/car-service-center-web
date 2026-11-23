'use client';

import React, { useState } from 'react';

export interface StageBarItem {
  key: string;
  label: string;
  count: number;
  highlight?: boolean;
  targetQuota?: number;
  subLabel?: string;
}

export interface DashboardStageBarsProps {
  title: string;
  subtitle?: string;
  stages: StageBarItem[];
  selectedStageKey?: string;
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
  selectedStageKey,
  onSelectStage,
  isLoading = false,
}) => {
  const [internalSelected, setInternalSelected] = useState<string>('');
  const activeKey = selectedStageKey !== undefined ? selectedStageKey : internalSelected;

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

  const handleBarClick = (key: string) => {
    if (selectedStageKey === undefined) {
      setInternalSelected((prev) => (prev === key ? '' : key));
    }
    onSelectStage?.(key);
  };

  const selectedStage = stages.find((s) => s.key === activeKey);
  const selectedPct =
    selectedStage && totalCount > 0 ? ((selectedStage.count / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-xs border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between h-full">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
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
            <span className="w-2.5 h-2.5 rounded-full bg-[#0c2340] dark:bg-slate-300 inline-block shrink-0" />
            Thực tế ({totalCount})
          </span>
          <span className="flex items-center gap-1.5 text-[#0050cd] dark:text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0050cd] inline-block shrink-0" />
            Đang chọn
          </span>
        </div>
      </div>

      {/* Uniform Bar Chart Area */}
      <div
        className="grid gap-2 sm:gap-4 items-end h-52 pt-14 px-1 sm:px-3 border-b border-slate-100 dark:border-slate-800 pb-3 relative"
        style={{ gridTemplateColumns: `repeat(${stages.length > 0 ? stages.length : 8}, minmax(0, 1fr))` }}
      >
        {stages.map((bar, idx) => {
          const isSelected = activeKey === bar.key;
          const heightPct =
            bar.count === 0 ? 10 : Math.max(24, Math.round((bar.count / maxCount) * 82));
          const pct = totalCount > 0 ? ((bar.count / totalCount) * 100).toFixed(1) : '0.0';
          const tooltipAlignClass =
            idx === 0
              ? 'left-0'
              : idx === stages.length - 1
              ? 'right-0'
              : 'left-1/2 -translate-x-1/2';

          return (
            <button
              key={bar.key}
              type="button"
              onClick={() => handleBarClick(bar.key)}
              aria-pressed={isSelected}
              className="flex flex-col items-center h-full justify-end cursor-pointer group focus-visible:outline-none relative"
            >
              {/* Bar + Direct Top Number + Hover Dark Card */}
              <div className="flex-1 w-full flex flex-col items-center justify-end relative">
                {/* Hover-only dark navy card */}
                <div
                  className={`origin-bottom absolute -top-12 ${tooltipAlignClass} z-20 bg-[#0c2340] text-white rounded-2xl px-3.5 py-2 text-[11px] shadow-lg pointer-events-none whitespace-nowrap opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-[opacity,transform] duration-150 ease-out`}
                >
                  <div className="font-bold text-white text-center">{bar.label}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 justify-center text-slate-200 font-mono tabular-nums">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span>Thực tế: {bar.count} hồ sơ</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center text-blue-300 font-mono tabular-nums">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] shrink-0" />
                    <span>Tỷ trọng: {pct}%</span>
                  </div>
                </div>

                {/* Count directly above bar */}
                <span
                  className={`font-mono text-xs sm:text-sm font-bold mb-1 tabular-nums transition-transform group-hover:scale-110 ${
                    isSelected
                      ? 'text-[#0050cd] dark:text-blue-400'
                      : bar.count > 0
                      ? 'text-slate-800 dark:text-slate-200 group-hover:text-[#0050cd]'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {bar.count}
                </span>

                {/* Bar column */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-6 sm:w-8 rounded-t-lg transition-all duration-300 ${
                    isSelected
                      ? 'bg-[#0050cd] shadow-sm shadow-[#0050cd]/30 ring-2 ring-[#0050cd]/25'
                      : bar.count > 0
                      ? 'bg-[#0c2340] dark:bg-slate-300 group-hover:bg-[#0050cd]'
                      : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300'
                  }`}
                />
              </div>

              {/* Stage label */}
              <span
                className={`text-[10px] sm:text-[11px] font-semibold mt-2 truncate max-w-full text-center transition-colors ${
                  isSelected
                    ? 'text-[#0050cd] dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                }`}
              >
                {bar.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Click-to-Reveal Detail Panel or Subtle Hint */}
      {selectedStage ? (
        <div className="sa-enter mt-4 rounded-2xl bg-[#0c2340] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="font-bold text-sm text-white">{selectedStage.label}</span>
            <span className="inline-flex items-center gap-1.5 text-slate-200 font-mono tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" />
              Thực tế: <strong className="text-white">{selectedStage.count}</strong> hồ sơ
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-300 font-mono tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Tỷ trọng: <strong className="text-white">{selectedPct}%</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleBarClick(selectedStage.key)}
            className="sa-press text-xs font-semibold text-blue-300 hover:text-white transition-colors cursor-pointer"
          >
            ✕ Đóng
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-3 mt-1">
          <span className="material-symbols-outlined text-[15px] text-slate-400">touch_app</span>
          <span>Nhấp vào từng cột giai đoạn để xem chi tiết và lọc danh sách</span>
        </div>
      )}
    </div>
  );
};

export default DashboardStageBars;
