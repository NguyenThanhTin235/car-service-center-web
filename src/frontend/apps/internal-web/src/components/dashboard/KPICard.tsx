'use client';

import React from 'react';
import { formatVND, formatNumber } from '@/lib/utils/formatters';

export type KPICardVariant = 'navy' | 'royal' | 'slate' | 'midnight';

export interface KPICardProps {
  label: string;
  value: string | number;
  prevValue?: number;
  format?: 'currency' | 'number' | 'percent';
  icon?: string;
  unit?: string;
  subtitle?: string;
  badgeText?: string;
  badgeIcon?: string;
  badgePositive?: boolean;
  trendInverted?: boolean;
  isLoading?: boolean;
  variant?: KPICardVariant;
  sparklineCallout?: string;
  splitPercentage?: number;
  splitLeftLabel?: string;
  splitRightLabel?: string;
  waveLabels?: string[];
  sparklinePoints?: number[];
  heatmapHighlightCol?: number;
  slaPercentage?: number;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  prevValue,
  format = 'number',
  icon = 'tune',
  unit,
  subtitle,
  badgeText,
  badgeIcon = 'north_east',
  badgePositive = true,
  trendInverted = false,
  isLoading = false,
  variant = 'navy',
  sparklineCallout,
  splitPercentage = 75,
  splitLeftLabel,
  splitRightLabel,
  waveLabels = ['Tiếp nhận', 'Kế hoạch', 'Thi công', 'KCS', 'Giao xe'],
  sparklinePoints,
  heatmapHighlightCol,
  slaPercentage,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 min-h-[220px] bg-slate-200 dark:bg-slate-800 animate-pulse flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 bg-slate-300 dark:bg-slate-700 rounded-md"></div>
          <div className="w-8 h-8 rounded-xl bg-slate-300 dark:bg-slate-700"></div>
        </div>
        <div className="h-10 w-36 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-12 w-full bg-slate-300 dark:bg-slate-700 rounded-2xl"></div>
      </div>
    );
  }

  const numVal = typeof value === 'number' ? value : Number(value);
  const hasDelta = typeof prevValue === 'number' && !isNaN(numVal) && prevValue > 0;
  const delta = hasDelta ? ((numVal - prevValue) / prevValue) * 100 : null;

  const isPositive = delta !== null ? delta > 0 : badgePositive;
  const isGood = trendInverted ? !isPositive : isPositive;

  const formattedValue =
    typeof value === 'number'
      ? format === 'currency'
        ? formatVND(value, true)
        : formatNumber(value)
      : value;

  // Determine badge text to display
  const displayBadgeText =
    badgeText ||
    (delta !== null
      ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
      : 'Thời gian thực');

  const displayBadgeIcon =
    badgeIcon ||
    (delta !== null
      ? delta > 0
        ? 'north_east'
        : 'south_east'
      : 'trending_up');

  // Dynamic SVG curve generation from sparklinePoints or fallback
  const points =
    sparklinePoints && sparklinePoints.length >= 2
      ? sparklinePoints
      : [22, 34, 26, 46, 32];

  const minP = Math.min(...points);
  const maxP = Math.max(...points);
  const rangeP = maxP === minP ? 1 : maxP - minP;

  // 5 standard x coordinates across 240 width
  const xCoords = [15, 65, 115, 165, 215];
  const yCoords = points.slice(0, 5).map((p: number) => {
    return Math.round(40 - ((p - minP) / rangeP) * 28);
  });
  while (yCoords.length < 5) {
    yCoords.push(26);
  }

  // Peak point for callout & indicator
  const peakIdx = points.indexOf(maxP);
  const safePeakIdx = Math.min(Math.max(0, peakIdx), 4);
  const peakX = xCoords[safePeakIdx] ?? 165;
  const peakY = yCoords[safePeakIdx] ?? 14;

  // Build cubic bezier curve string
  let pathD = `M ${xCoords[0]} ${yCoords[0]}`;
  for (let i = 0; i < xCoords.length - 1; i++) {
    const x0 = xCoords[i];
    const y0 = yCoords[i];
    const x1 = xCoords[i + 1];
    const y1 = yCoords[i + 1];
    const midX = (x0 + x1) / 2;
    pathD += ` C ${midX} ${y0}, ${midX} ${y1}, ${x1} ${y1}`;
  }

  // ================= VARIANT 1: DARK NAVY (#0c2340) =================
  if (variant === 'navy') {
    return (
      <div className="bg-[#0c2340] text-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col justify-between min-h-[220px] shadow-md hover:shadow-lg transition-all relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between text-zinc-300 text-xs font-semibold tracking-wide">
            <span>{label}</span>
            <span className="material-symbols-outlined text-[20px] text-zinc-400 group-hover:text-white transition-colors">
              {icon}
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white">
              {formattedValue}
            </span>
            {unit && <span className="text-xs font-medium text-zinc-300">{unit}</span>}
            <span
              className={`text-[11px] font-bold flex items-center gap-0.5 ${
                isGood ? 'text-[#60a5fa]' : 'text-rose-400'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {displayBadgeIcon}
              </span>
              {displayBadgeText}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
            {subtitle || 'Dữ liệu vận hành đồng bộ trực tiếp'}
          </p>
        </div>

        {/* Wave Sparkline & Callout Pill */}
        <div className="mt-3 relative pt-4">
          <div className="absolute right-8 top-0 bg-white text-zinc-900 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-extrabold shadow-md pointer-events-none">
            {sparklineCallout || `${formattedValue} ${unit || ''}`.trim()}
          </div>

          <svg viewBox="0 0 240 50" className="w-full h-12 overflow-visible">
            {[15, 65, 115, 165, 215].map((x) => (
              <line
                key={x}
                x1={x}
                y1="5"
                x2={x}
                y2="45"
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="2 2"
              />
            ))}
            <line x1="165" y1="2" x2="165" y2="45" stroke="#ffffff" strokeWidth="1.5" />
            <path
              d="M 5 34 C 40 22, 65 42, 110 32 C 140 24, 155 36, 165 14 C 185 8, 205 18, 235 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="165" cy="14" r="3.5" fill="#0050cd" stroke="#ffffff" strokeWidth="2" />
          </svg>

          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium mt-0.5 px-0.5">
            {waveLabels.map((lbl, idx) => (
              <span key={idx} className="truncate">{lbl}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================= VARIANT 2: VIBRANT ROYAL BLUE (#0050cd) =================
  if (variant === 'royal') {
    const splitLeft = Math.max(15, Math.min(85, Math.round(splitPercentage)));
    const splitRight = 100 - splitLeft;

    return (
      <div className="bg-[#0050cd] text-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col justify-between min-h-[220px] shadow-md shadow-[#0050cd]/20 hover:shadow-lg transition-all relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between text-blue-100 text-xs font-semibold tracking-wide">
            <span>{label}</span>
            <span className="material-symbols-outlined text-[20px] text-blue-200 group-hover:text-white transition-colors">
              {icon}
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white">
              {formattedValue}
            </span>
            {unit && <span className="text-xs font-medium text-blue-100">{unit}</span>}
            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">{displayBadgeIcon}</span>
              {displayBadgeText}
            </span>
          </div>
          <p className="text-[11px] text-blue-100/80 mt-1 line-clamp-1">
            {subtitle || 'Sẵn sàng vận hành không gián đoạn'}
          </p>
        </div>

        {/* 2-Tone Split Bar Inside Deep Navy Container */}
        <div className="mt-3">
          <div className="bg-[#07192e] rounded-2xl p-1.5 flex items-stretch h-12 gap-1.5">
            <div
              style={{ width: `${splitLeft}%` }}
              className="bg-white text-zinc-900 rounded-xl px-2.5 py-1 flex items-end font-mono font-extrabold text-xs tabular-nums transition-all"
            >
              {splitLeft}%
            </div>
            <div className="flex-1 text-white px-2.5 py-1 flex items-end justify-end font-mono font-extrabold text-xs tabular-nums">
              {splitRight}%
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-blue-100 font-medium mt-1.5 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
              {splitLeftLabel || `Tỷ lệ (${splitLeft}%)`}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#07192e] shrink-0" />
              {splitRightLabel || `Còn lại (${splitRight}%)`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ================= VARIANT 3: SOFT COOL SLATE (#e4e7ec) =================
  if (variant === 'slate') {
    return (
      <div className="bg-[#e4e7ec] text-zinc-900 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col justify-between min-h-[220px] shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between text-slate-700 text-xs font-semibold tracking-wide">
            <span>{label}</span>
            <span className="material-symbols-outlined text-[20px] text-slate-500 group-hover:text-zinc-900 transition-colors">
              {icon}
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-zinc-900">
              {formattedValue}
            </span>
            {unit && <span className="text-xs font-medium text-slate-600">{unit}</span>}
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">{displayBadgeIcon}</span>
              {displayBadgeText}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
            {subtitle || 'Đảm bảo nguồn lực ca trực liên tục'}
          </p>
        </div>

        {/* Micro-Block Matrix Grid with Dark Callout Pill */}
        <div className="mt-3 relative pt-4">
          <div className="absolute right-4 top-0 bg-[#0c2340] text-white px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-extrabold shadow-sm pointer-events-none">
            {sparklineCallout || `${formattedValue} ${unit || ''}`.trim()}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, colIdx) => {
              const isPeakCol = colIdx === 4 || colIdx === 5;
              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div className="w-full grid grid-cols-2 gap-0.5">
                    {[0, 1, 2, 3].map((cell) => (
                      <span
                        key={cell}
                        className={`h-2 rounded-xs transition-colors ${
                          isPeakCol
                            ? 'bg-[#0c2340]'
                            : cell < 2
                            ? 'bg-slate-400'
                            : 'bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 font-semibold">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================= VARIANT 4: MIDNIGHT / DEEP INDIGO (#111827) =================
  return (
    <div className="bg-[#111827] text-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col justify-between min-h-[220px] shadow-md hover:shadow-lg transition-all relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between text-slate-300 text-xs font-semibold tracking-wide">
          <span>{label}</span>
          <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-white transition-colors">
            {icon}
          </span>
        </div>

        <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
          <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white">
            {formattedValue}
          </span>
          {unit && <span className="text-xs font-medium text-slate-300">{unit}</span>}
          <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[13px]">{displayBadgeIcon}</span>
            {displayBadgeText}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
          {subtitle || 'Đã kiểm duyệt quy chuẩn niêm yết'}
        </p>
      </div>

      {/* SLA Tier Progress Indicators */}
      <div className="mt-3 bg-[#1e293b] rounded-2xl p-2.5 space-y-1.5">
        <div className="flex justify-between text-[10px] text-slate-300 font-mono">
          <span>Tiêu chuẩn dịch vụ</span>
          <span className="text-cyan-400 font-bold">100% SLA</span>
        </div>
        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-blue-500 to-cyan-400 rounded-full w-4/5" />
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-0.5">
          <span>Sửa chữa lớn</span>
          <span>Bảo dưỡng nhanh</span>
          <span>Chăm sóc xe</span>
        </div>
      </div>
    </div>
  );
};

export default KPICard;
