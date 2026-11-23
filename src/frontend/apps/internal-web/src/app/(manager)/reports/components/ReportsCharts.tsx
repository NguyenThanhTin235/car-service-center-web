'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis
          tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
          tick={{ fontSize: 11, fill: '#64748b' }}
        />
        <Tooltip
          formatter={(val: any) => [`${fmtCurrency(Number(val || 0))} ₫`, 'Doanh thu']}
          contentStyle={{
            fontSize: '12px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        />
        <Bar dataKey="totalRevenue" fill="#0866ff" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ServicesBarChart({ data }: { data: ServiceChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 20, left: 8, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis
          dataKey="serviceName"
          type="category"
          width={120}
          tick={{ fontSize: 11, fill: '#334155' }}
          tickFormatter={(v: string) => (v && v.length > 16 ? `${v.slice(0, 15)}…` : v)}
        />
        <Tooltip
          formatter={(val: any) => [`${val} lượt`, 'Số lần']}
          contentStyle={{ fontSize: '12px', borderRadius: '10px' }}
        />
        <Bar dataKey="count" fill="#0050cd" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
