'use client';

import React, { useState } from 'react';

export interface RevenueChartRow {
  date: string;
  totalRevenue: number;
  count: number;
}

export interface ServiceChartRow {
  serviceId: number;
  serviceName: string;
  count: number;
}

const fmtCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

export function RevenueBarChart({ data }: { data: RevenueChartRow[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.map((d) => Number(d.totalRevenue || 0)), 1);
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="relative w-full h-[300px] flex select-none pt-4 pb-7 pr-2">
      {/* Y-Axis labels */}
      <div className="w-14 shrink-0 flex flex-col justify-between text-right pr-3 text-[11px] font-mono tabular-nums text-slate-500 h-full">
        {ticks.map((t) => (
          <span key={t}>{`${((maxVal * t) / 1_000_000).toFixed(1)}M`}</span>
        ))}
      </div>

      {/* Plot area */}
      <div className="relative flex-1 h-full border-l border-b border-slate-200 flex items-end gap-1.5 sm:gap-2.5 px-2">
        {/* Horizontal dashed gridlines */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
          {ticks.slice(0, -1).map((t) => (
            <div key={t} className="w-full border-t border-dashed border-slate-100" />
          ))}
          <div />
        </div>

        {data.map((row, idx) => {
          const val = Number(row.totalRevenue || 0);
          const pct = Math.max(2, (val / maxVal) * 100);
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={`${row.date}-${idx}`}
              className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onFocus={() => setHoveredIdx(idx)}
              onBlur={() => setHoveredIdx(null)}
              tabIndex={0}
              aria-label={`Ngày ${row.date}: ${fmtCurrency(val)} đồng`}
            >
              {isHovered && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap bg-slate-900 text-white text-xs rounded-[10px] border border-slate-200/20 px-3 py-1.5 shadow-lg pointer-events-none">
                  <div className="text-[11px] text-slate-300 font-mono">{row.date}</div>
                  <div className="font-mono tabular-nums font-bold text-blue-300">
                    {fmtCurrency(val)} ₫ · {row.count} HĐ
                  </div>
                </div>
              )}
              <div
                className="w-full max-w-[44px] rounded-t-[6px] transition-[opacity,filter] duration-150 bg-[#0866ff] group-hover:brightness-110"
                style={{ height: `${pct}%` }}
              />
              <span className="absolute -bottom-6 text-[11px] font-mono text-slate-500 truncate max-w-full">
                {row.date.length >= 10 ? row.date.slice(5) : row.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ServicesBarChart({ data }: { data: ServiceChartRow[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxCount = Math.max(...data.map((d) => Number(d.count || 0)), 1);
  const minHeight = Math.max(260, data.length * 40);

  return (
    <div
      className="w-full flex flex-col justify-center gap-3 py-2"
      style={{ minHeight }}
    >
      {data.map((row, idx) => {
        const count = Number(row.count || 0);
        const pct = Math.max(4, (count / maxCount) * 100);
        const shortName =
          row.serviceName && row.serviceName.length > 16
            ? `${row.serviceName.slice(0, 15)}…`
            : row.serviceName;
        const isHovered = hoveredIdx === idx;
        return (
          <div
            key={`${row.serviceId}-${idx}`}
            className="relative flex items-center gap-3 group cursor-pointer"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            title={`${row.serviceName}: ${count} lượt`}
          >
            <div className="w-[120px] shrink-0 text-right text-[11px] font-medium text-slate-700 truncate">
              {shortName}
            </div>
            <div className="flex-1 h-7 bg-slate-50 rounded-r-[6px] flex items-center relative overflow-hidden border-l border-slate-200">
              <div
                className="h-5 bg-[#0050cd] rounded-r-[6px] transition-[filter] duration-150 group-hover:brightness-110"
                style={{ width: `${pct}%` }}
              />
              <span className="ml-2 text-[11px] font-mono tabular-nums font-bold text-slate-700">
                {count}
              </span>
            </div>
            {isHovered && (
              <div className="absolute right-2 -top-8 z-20 whitespace-nowrap bg-slate-900 text-white text-xs rounded-[10px] px-2.5 py-1 shadow-md pointer-events-none">
                <span className="font-semibold">{row.serviceName}</span>:{' '}
                <span className="font-mono font-bold text-sky-300">{count} lượt</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WarrantyAnalysisBarChart({
  data,
  dataKey,
  fill,
}: {
  data: any[];
  dataKey: 'technicianName' | 'categoryName';
  fill: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const getCount = (row: any) => Number(row?.warrantyCasesCount ?? row?.count ?? 0);
  const maxVal = Math.max(...data.map(getCount), 1);
  const ticks = [1, 0.5, 0];

  return (
    <div className="relative w-full h-[280px] flex select-none pt-4 pb-7 pr-2">
      <div className="w-10 shrink-0 flex flex-col justify-between text-right pr-3 text-[11px] font-mono tabular-nums text-slate-500 h-full">
        {ticks.map((t) => (
          <span key={t}>{Math.round(maxVal * t)}</span>
        ))}
      </div>

      <div className="relative flex-1 h-full border-l border-b border-slate-200 flex items-end gap-2 sm:gap-3 px-2">
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
          {ticks.slice(0, -1).map((t) => (
            <div key={t} className="w-full border-t border-dashed border-slate-100" />
          ))}
          <div />
        </div>

        {data.map((row, idx) => {
          const val = getCount(row);
          const label = String(row?.[dataKey] ?? '');
          const pct = Math.max(3, (val / maxVal) * 100);
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={`${label}-${idx}`}
              className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap bg-slate-900 text-white text-xs rounded-[10px] border border-slate-200/20 px-3 py-1.5 shadow-lg pointer-events-none">
                  <div className="text-[11px] text-slate-300">{label}</div>
                  <div className="font-mono font-bold">{val} Số vụ bảo hành</div>
                </div>
              )}
              <div
                className="w-full max-w-[44px] rounded-t-[6px] transition-[filter] duration-150 group-hover:brightness-110"
                style={{ height: `${pct}%`, backgroundColor: fill || '#0866ff' }}
              />
              <span className="absolute -bottom-6 text-[11px] text-slate-500 truncate max-w-full">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
