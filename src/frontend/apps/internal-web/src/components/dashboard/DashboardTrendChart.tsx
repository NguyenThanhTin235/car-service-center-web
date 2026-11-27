'use client';

import React, { useId, useState } from 'react';
import { formatVND, formatNumber } from '@/lib/utils/formatters';

export interface TrendDataPoint {
  label: string;
  value: number;
  count?: number;
}

export interface DashboardTrendChartProps {
  title: string;
  subtitle?: string;
  data: TrendDataPoint[];
  format?: 'currency' | 'number';
  color?: string;
  height?: number;
  isLoading?: boolean;
}

export const DashboardTrendChart: React.FC<DashboardTrendChartProps> = React.memo(
  ({
    title,
    subtitle,
    data,
    format = 'currency',
    color = '#0050cd',
    height = 280,
    isLoading = false,
  }) => {
    const uid = useId().replace(/:/g, '');
    const gradId = `trendGradient-${uid}`;
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    if (isLoading) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm animate-pulse">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
          <div className="h-3 w-60 bg-slate-100 dark:bg-slate-800 rounded mb-6"></div>
          <div style={{ height }} className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg"></div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}
          <div style={{ height }} className="flex flex-col items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">show_chart</span>
            <p className="text-xs">Chưa có dữ liệu biến động trong khoảng thời gian này</p>
          </div>
        </div>
      );
    }

    const maxVal = Math.max(...data.map((d) => Number(d.value || 0)), 1);
    const width = 640;
    const svgHeight = 240;
    const padY = 12;
    const innerH = svgHeight - padY * 2;
    const n = data.length;

    const coords = data.map((pt, i) => {
      const x = n === 1 ? width / 2 : (i / (n - 1)) * width;
      const ratio = Math.max(0, Math.min(1, Number(pt.value || 0) / maxVal));
      const y = padY + innerH * (1 - ratio);
      return { x, y, pt };
    });

    const linePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const areaPath =
      coords.length === 1
        ? `M 0 ${coords[0].y.toFixed(1)} L ${width} ${coords[0].y.toFixed(1)} L ${width} ${svgHeight} L 0 ${svgHeight} Z`
        : `M ${coords[0].x.toFixed(1)} ${svgHeight} ` +
          coords.map((c) => `L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ') +
          ` L ${coords[coords.length - 1].x.toFixed(1)} ${svgHeight} Z`;

    const yTicks = [1, 0.5, 0].map((r) => {
      const v = maxVal * r;
      if (format === 'currency') return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : formatNumber(Math.round(v));
      return formatNumber(Math.round(v));
    });

    const activeCoord = hoveredIdx !== null ? coords[hoveredIdx] : null;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Xu hướng</span>
          </div>
        </div>

        <div className="relative flex pb-6" style={{ width: '100%', height }}>
          <div className="w-12 shrink-0 flex flex-col justify-between text-right pr-2.5 text-[11px] font-mono tabular-nums text-slate-400">
            {yTicks.map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>

          <div className="relative flex-1 h-full">
            <svg
              viewBox={`0 0 ${width} ${svgHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
              role="img"
              aria-label={title}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              {[0.15, 0.5, 0.85].map((r, i) => (
                <line
                  key={i}
                  x1={0}
                  x2={width}
                  y1={svgHeight * r}
                  y2={svgHeight * r}
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                />
              ))}
              <path d={areaPath} fill={`url(#${gradId})`} />
              {coords.length > 1 && (
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={linePoints}
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {activeCoord && (
                <line
                  x1={activeCoord.x}
                  x2={activeCoord.x}
                  y1={0}
                  y2={svgHeight}
                  stroke={color}
                  strokeOpacity={0.35}
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            {/* Interactive column hit zones */}
            <div className="absolute inset-0 flex">
              {coords.map((c, idx) => (
                <div
                  key={`${c.pt.label}-${idx}`}
                  className="flex-1 h-full cursor-pointer relative"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {hoveredIdx === idx && (
                    <span
                      className="absolute w-2.5 h-2.5 rounded-full border-2 border-white shadow pointer-events-none -translate-x-1/2 -translate-y-1/2"
                      style={{
                        backgroundColor: color,
                        left: '50%',
                        top: `${(c.y / svgHeight) * 100}%`,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {activeCoord && (
              <div
                className="absolute top-1 z-20 -translate-x-1/2 bg-slate-900/95 text-white text-xs rounded-lg px-3 py-2 shadow-lg backdrop-blur border border-slate-700 pointer-events-none whitespace-nowrap"
                style={{
                  left: `${Math.min(85, Math.max(15, (activeCoord.x / width) * 100))}%`,
                }}
              >
                <div className="font-semibold text-slate-300 mb-1">Ngày {activeCoord.pt.label}</div>
                <div className="text-emerald-400 font-mono tabular-nums font-bold">
                  {format === 'currency' ? formatVND(activeCoord.pt.value) : formatNumber(activeCoord.pt.value)}
                </div>
                {activeCoord.pt.count !== undefined && (
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                    Số giao dịch: {activeCoord.pt.count}
                  </div>
                )}
              </div>
            )}

            {/* X-Axis labels */}
            <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1.5">
              {data
                .filter((_, i) => data.length <= 7 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0)
                .map((pt, idx) => (
                  <span key={`${pt.label}-${idx}`}>{pt.label}</span>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DashboardTrendChart.displayName = 'DashboardTrendChart';
