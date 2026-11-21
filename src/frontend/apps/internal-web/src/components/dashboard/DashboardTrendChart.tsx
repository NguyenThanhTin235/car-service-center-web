'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
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

export const DashboardTrendChart: React.FC<DashboardTrendChartProps> = ({
  title,
  subtitle,
  data,
  format = 'currency',
  color = '#0050cd',
  height = 280,
  isLoading = false,
}) => {
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

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const pt = payload[0].payload as TrendDataPoint;
      return (
        <div className="bg-slate-900/95 text-white text-xs rounded-lg px-3 py-2 shadow-lg backdrop-blur border border-slate-700">
          <div className="font-semibold text-slate-300 mb-1">Ngày {label}</div>
          <div className="text-emerald-400 font-mono font-bold">
            {format === 'currency' ? formatVND(val) : formatNumber(val)}
          </div>
          {pt.count !== undefined && (
            <div className="text-[11px] text-slate-400 mt-0.5">Số giao dịch: {pt.count}</div>
          )}
        </div>
      );
    }
    return null;
  };

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

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => (format === 'currency' ? formatVND(val, true) : formatNumber(val))}
            />
            <Tooltip content={customTooltip} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#trendGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
