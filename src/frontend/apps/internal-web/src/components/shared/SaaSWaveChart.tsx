'use client';

import React, { useId, useState } from 'react';

export interface WaveSeriesItem {
  label: string;
  value: string | number;
  color: string;
  peakRatio?: number; // 0 to 1.0 (computed from numeric value if omitted)
}

export interface SaaSWaveChartProps {
  title: string;
  primaryMetric: string;
  deltaText: string;
  deltaPositive?: boolean;
  comparisonText?: string;
  xLabels?: string[];
  yLabels?: string[];
  series: WaveSeriesItem[];
  darkTheme?: boolean;
  testId?: string;
  periodOptions?: string[];
  defaultPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const SaaSWaveChart = React.memo(function SaaSWaveChart({
  title,
  primaryMetric,
  deltaText,
  deltaPositive = true,
  comparisonText = 'so với kỳ trước',
  xLabels,
  yLabels,
  series,
  darkTheme = false,
  testId = 'saas-wave-chart',
  periodOptions = [],
  defaultPeriod,
  onPeriodChange,
}: SaaSWaveChartProps) {
  const uid = useId().replace(/:/g, '');
  const glowFilterId = `blueWaveGlow-${uid}`;
  const areaGradId = `primaryBlueArea-${uid}`;

  const [activePeriod, setActivePeriod] = useState(defaultPeriod || periodOptions[0] || '');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Extract real numeric values from series to drive accurate proportional heights & Y-axis
  const numericValues = series.map((s) => {
    if (typeof s.value === 'number') return Math.max(0, s.value);
    const parsed = Number(String(s.value).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  });
  const maxVal = Math.max(0, ...numericValues);
  const axisTop = maxVal > 0 ? Math.max(4, Math.ceil(maxVal / 4) * 4) : 4;

  const resolvedYLabels =
    yLabels && yLabels.length === 5
      ? yLabels
      : [
          String(axisTop),
          String(Math.round(axisTop * 0.75)),
          String(Math.round(axisTop * 0.5)),
          String(Math.round(axisTop * 0.25)),
          '0',
        ];

  const resolvedXLabels =
    xLabels && xLabels.length > 0
      ? xLabels
      : series.length > 0
      ? series.map((s) => s.label)
      : ['—'];

  const getSeriesRatio = (item: WaveSeriesItem, idx: number): number => {
    const num = numericValues[idx] ?? 0;
    if (maxVal > 0) {
      return num > 0 ? Math.max(0.08, Math.min(1, num / axisTop)) : 0;
    }
    if (typeof item.peakRatio === 'number') {
      return Math.max(0, Math.min(1, item.peakRatio));
    }
    return 0;
  };

  // Generate smooth bell/wave SVG path above baseline (y=130) strictly proportional to data
  const buildUpperWavePath = (ratio: number, index: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    const peakY = 130 - clamped * 102;
    const shiftX = (index % 2 === 0 ? 1 : -1) * (index * 4);
    const peakX = 250 + shiftX;
    return `M 48 130 C 125 130, ${peakX - 75} ${peakY}, ${peakX} ${peakY} C ${peakX + 75} ${peakY}, 375 130, 460 130`;
  };

  // Generate subtle mirrored reflection wave below baseline (y=142) proportional to data
  const buildMirrorWavePath = (ratio: number, index: number) => {
    const clamped = Math.max(0, Math.min(0.95, ratio));
    const troughY = 142 + clamped * 58;
    const shiftX = 28 + index * 8;
    const troughX = 270 + shiftX;
    return `M 140 142 C 200 142, ${troughX - 60} ${troughY}, ${troughX} ${troughY} C ${troughX + 60} ${troughY}, 410 142, 468 142`;
  };

  return (
    <div
      data-testid={testId}
      className={`rounded-2xl p-5 sm:p-6 border transition-all flex flex-col justify-between overflow-hidden relative ${
        darkTheme
          ? 'bg-[#091526] border-blue-900/50 text-white shadow-sm'
          : 'bg-white border-slate-200/80 text-slate-900 shadow-xs'
      }`}
    >
      {/* Top subtle blue radial glow */}
      <div
        className={`pointer-events-none absolute -top-20 right-10 w-64 h-64 rounded-full blur-3xl ${
          darkTheme ? 'bg-[#0866ff]/15' : 'bg-[#0866ff]/6'
        }`}
      />

      {/* Header Row: Metric + Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 relative z-10">
        <div>
          <span
            className={`text-xs font-semibold tracking-wide ${
              darkTheme ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {title}
          </span>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <span className="font-mono tabular-nums text-2xl sm:text-3xl font-extrabold tracking-tight">
              {primaryMetric}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs font-mono tabular-nums">
            <span
              className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-md ${
                deltaPositive
                  ? darkTheme
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-emerald-50 text-emerald-800'
                  : darkTheme
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-amber-50 text-amber-800'
              }`}
            >
              {deltaText} {deltaPositive ? '↑' : '↓'}
            </span>
            <span className={darkTheme ? 'text-slate-300' : 'text-slate-600'}>
              {comparisonText}
            </span>
          </div>
        </div>

        {/* Unboxed Period Tabs (Only rendered when periodOptions are explicitly provided) */}
        {periodOptions.length > 0 && (
          <div
            className={`inline-flex items-center gap-4 border-b self-start ${
              darkTheme ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            {periodOptions.map((opt) => {
              const active = activePeriod === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setActivePeriod(opt);
                    onPeriodChange?.(opt);
                  }}
                  className={`pb-2 text-xs font-semibold transition-all cursor-pointer border-b-2 -mb-px ${
                    active
                      ? darkTheme
                        ? 'border-[#38bdf8] text-blue-400 font-bold'
                        : 'border-[#0866ff] text-[#0050cd] font-bold'
                      : darkTheme
                      ? 'border-transparent text-slate-300 hover:text-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Multi-Curve Bezier Wave SVG (Ember SaaS Style with Mirror Reflection) */}
      <div className="mt-4 relative z-10">
        <svg
          viewBox="0 0 485 215"
          className="w-full h-44 sm:h-48 overflow-visible select-none"
          role="img"
          aria-label={title}
        >
          <defs>
            <filter id={glowFilterId} x="-10%" y="-20%" width="120%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0866ff" stopOpacity={darkTheme ? '0.26' : '0.16'} />
              <stop offset="100%" stopColor="#0866ff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Upper Horizontal Grid Lines & Y-Axis Labels */}
          {[28, 54, 80, 106, 130].map((yPos, idx) => (
            <g key={`upper-grid-${yPos}`}>
              <line
                x1="44"
                y1={yPos}
                x2="468"
                y2={yPos}
                stroke={darkTheme ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.22)'}
                strokeDasharray={idx === 4 ? undefined : '3 3'}
                strokeWidth="1"
              />
              <text
                x="34"
                y={yPos + 3}
                textAnchor="end"
                className="font-mono text-[10px]"
                fill={darkTheme ? '#64748b' : '#94a3b8'}
              >
                {resolvedYLabels[idx] ?? ''}
              </text>
            </g>
          ))}

          {/* Lower Mirrored Y-Axis Grid Labels (Ember signature reflection axis) */}
          {[142, 164, 186, 206].map((yPos, idx) => (
            <g key={`lower-grid-${yPos}`}>
              <line
                x1="44"
                y1={yPos}
                x2="468"
                y2={yPos}
                stroke={darkTheme ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.12)'}
                strokeDasharray="2 4"
                strokeWidth="1"
              />
              <text
                x="34"
                y={yPos + 3}
                textAnchor="end"
                className="font-mono text-[9px]"
                fill={darkTheme ? '#475569' : '#cbd5e1'}
              >
                {idx === 0 ? '0' : resolvedYLabels[3 - idx] ?? ''}
              </text>
            </g>
          ))}

          {/* X-Axis Labels */}
          {resolvedXLabels.map((lbl, idx) => {
            const step = 400 / Math.max(1, resolvedXLabels.length - 1);
            const xPos = resolvedXLabels.length === 1 ? 258 : 58 + idx * step;
            return (
              <text
                key={`${lbl}-${idx}`}
                x={xPos}
                y={139}
                textAnchor="middle"
                className="font-mono text-[10px] font-medium"
                fill={darkTheme ? '#94a3b8' : '#64748b'}
              >
                {lbl}
              </text>
            );
          })}

          {/* Subtle Area Fill under Primary Wave */}
          {series.length > 0 && (
            <path
              d={`${buildUpperWavePath(getSeriesRatio(series[0], 0), 0)} L 460 130 L 48 130 Z`}
              fill={`url(#${areaGradId})`}
            />
          )}

          {/* Lower Mirrored Reflection Curves */}
          {series.map((item, idx) => {
            const ratio = getSeriesRatio(item, idx);
            return (
              <path
                key={`mirror-${item.label}`}
                d={buildMirrorWavePath(ratio, idx)}
                fill="none"
                stroke={darkTheme ? 'rgba(148, 163, 184, 0.22)' : 'rgba(100, 116, 139, 0.22)'}
                strokeWidth={hoveredIdx === idx ? '2' : '1.25'}
                strokeLinecap="round"
              />
            );
          })}

          {/* Upper Multi-Colored Glowing Bezier Waves */}
          {series.map((item, idx) => {
            const ratio = getSeriesRatio(item, idx);
            const isHighlighted = hoveredIdx === null || hoveredIdx === idx;
            return (
              <path
                key={`wave-${item.label}`}
                d={buildUpperWavePath(ratio, idx)}
                fill="none"
                stroke={item.color}
                strokeWidth={hoveredIdx === idx ? '3' : '2.25'}
                strokeOpacity={isHighlighted ? 1 : 0.35}
                strokeLinecap="round"
                filter={idx === 0 ? `url(#${glowFilterId})` : undefined}
                className="transition-all duration-200"
              />
            );
          })}
        </svg>
      </div>

      {/* Bottom Interactive Legend Pills with Colored Dots & Tabular Counts */}
      <div
        className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
          darkTheme ? 'border-slate-800/80' : 'border-slate-100'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {series.map((item, idx) => (
            <button
              key={item.label}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                hoveredIdx === idx
                  ? darkTheme
                    ? 'bg-slate-800 text-white'
                    : 'bg-blue-50/80 text-slate-900'
                  : darkTheme
                  ? 'text-slate-300 hover:bg-slate-800/50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: item.color,
                }}
              />
              <span className="font-medium">{item.label}</span>
              <span
                className={`font-mono tabular-nums font-bold ${
                  darkTheme ? 'text-white' : 'text-slate-900'
                }`}
              >
                {item.value}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default SaaSWaveChart;

