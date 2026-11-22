'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export type DashboardPeriod = 'today' | '7days' | '30days' | 'this_month' | 'custom';
export type DashboardScope = 'my' | 'workshop';

export interface KPIMetric {
  key: string;
  label: string;
  value: number | string;
  prevValue?: number;
  format?: 'currency' | 'number' | 'percent';
  trendInverted?: boolean;
  unit?: string;
}

export interface DashboardData {
  portal: 'admin' | 'manager' | 'sa' | 'staff';
  period: {
    key: DashboardPeriod;
    startDate: string;
    endDate: string;
  };
  kpis: KPIMetric[];
  charts: Record<string, any>;
  actionableList: any[];
}

interface UseDashboardDataOptions {
  portal: 'admin' | 'manager' | 'sa' | 'staff';
  initialPeriod?: DashboardPeriod;
  initialScope?: DashboardScope;
  autoRefreshInterval?: number; // milliseconds, default 60000 (60s)
}

export function useDashboardData({
  portal,
  initialPeriod = '7days',
  initialScope = 'my',
  autoRefreshInterval = 60000,
}: UseDashboardDataOptions) {
  const [period, setPeriod] = useState<DashboardPeriod>(initialPeriod);
  const [scope, setScope] = useState<DashboardScope>(initialScope);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchData = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setIsLoading(true);
        setIsRefreshing(true);
        setError(null);

        const res = await api.get(`/api/dashboard/${portal}`, {
          params: { period, scope },
        });

        if (res.data && res.data.success) {
          setData(res.data.data);
          setLastUpdated(new Date());
        } else {
          setError(res.data?.message || 'Không thể lấy dữ liệu bảng điều khiển.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [portal, period, scope]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchData(true);
    }, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, autoRefreshInterval]);

  const refetch = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  return {
    period,
    setPeriod,
    scope,
    setScope,
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refetch,
  };
}
