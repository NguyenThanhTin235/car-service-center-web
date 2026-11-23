'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KPICard, KPICardVariant } from '@/components/dashboard/KPICard';
import { DashboardFilterBar } from '@/components/dashboard/DashboardFilterBar';
import { DashboardStatusBreakdown } from '@/components/dashboard/DashboardStatusBreakdown';
import { DashboardStageBars } from '@/components/dashboard/DashboardStageBars';
import { DashboardTelemetryMiniBars } from '@/components/dashboard/DashboardTelemetryMiniBars';
import { DashboardActionTable, TableColumn } from '@/components/dashboard/DashboardActionTable';
import { WO_STATUS_META } from '@/components/advisor/work-order/work-order.constants';

const SOURCE_TYPE_LABELS: Record<string, string> = {
  APPOINTMENT: 'Đặt hẹn',
  WALK_IN: 'Vãng lai',
  TOW_IN: 'Cứu hộ',
};

const STAGE_LABELS: Record<string, string> = {
  DRAFT: 'Tiếp nhận',
  IN_PLANNING: 'Kế hoạch',
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  IN_PROGRESS: 'Đang sửa',
  BILLING_REQUESTED: 'Chờ TT',
  FINANCIAL_CLEARED: 'Chờ giao',
  CLOSED: 'Hoàn tất',
};

export default function SADashboardAnalyticsPage() {
  const {
    period,
    setPeriod,
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refetch,
  } = useDashboardData({
    portal: 'sa',
    initialPeriod: '7days',
    initialScope: 'my',
  });

  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const handleToggleStatus = useCallback((status: string) => {
    setSelectedStatus((prev) => (prev === status ? '' : status));
  }, []);

  const filteredList = useMemo(() => {
    const list = data?.actionableList || [];
    if (!selectedStatus) return list;
    return list.filter((item: any) => item.status === selectedStatus);
  }, [data?.actionableList, selectedStatus]);

  const columns: TableColumn<any>[] = useMemo(() => [
    {
      key: 'woNumber',
      label: 'Mã hồ sơ',
      sortable: true,
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => (
        <span className="font-mono font-bold text-[#0050cd] dark:text-blue-400 whitespace-nowrap tabular-nums">
          {row.woNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      label: 'Khách hàng',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{row.customerName}</div>
          <div className="text-xs text-slate-600 font-mono tabular-nums">{row.customerPhone}</div>
        </div>
      ),
    },
    {
      key: 'vehiclePlate',
      label: 'Xe & Biển số',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
            {row.vehiclePlate}
          </span>
          <div className="text-[11px] text-slate-500 mt-0.5">{row.vehicleModel}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      sortable: true,
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => {
        const conf = WO_STATUS_META[row.status] || {
          label: row.status,
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          dotColor: '#94a3b8',
        };
        return (
          <div className="flex flex-col items-start gap-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${conf.bg} ${conf.text}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: conf.dotColor }}
              ></span>
              {conf.label}
            </span>
            {row.updatedAt && (
              <span className="md:hidden text-slate-400 text-[11px] font-mono whitespace-nowrap tabular-nums">
                {new Date(row.updatedAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'updatedAt',
      label: 'Cập nhật',
      sortable: true,
      headerClassName: 'hidden md:table-cell whitespace-nowrap',
      cellClassName: 'hidden md:table-cell whitespace-nowrap',
      render: (row) => (
        <span className="text-slate-400 text-[11px] font-mono whitespace-nowrap tabular-nums">
          {new Date(row.updatedAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Thao tác',
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => (
        <Link
          href={`/advisor/work-orders/${row.id}`}
          className="text-xs font-semibold text-[#0050cd] hover:underline whitespace-nowrap"
        >
          {row.status === 'CLOSED' ? 'Xem hồ sơ →' : 'Xử lý hồ sơ →'}
        </Link>
      ),
    },
  ], []);

  const summary = data?.charts?.summary || {
    pendingApprovalCount: 0,
    inInspectionCount: 0,
    inProgressCount: 0,
    handoverReadyCount: 0,
    approvedQuotations: 0,
    totalQuotations: 0,
    totalPeriodIntake: 0,
  };

  const revenueSparkline = useMemo(() => {
    const trend = data?.charts?.revenueTrend || [];
    if (trend.length < 2) return undefined;
    return trend.slice(-5).map((item: any) => Number(item.value || 0));
  }, [data?.charts?.revenueTrend]);

  const revenueWaveLabels = useMemo(() => {
    const trend = data?.charts?.revenueTrend || [];
    if (trend.length < 2) return ['Kỳ 1', 'Kỳ 2', 'Kỳ 3', 'Kỳ 4', 'Kỳ 5'];
    return trend.slice(-5).map((item: any) => item.label);
  }, [data?.charts?.revenueTrend]);

  const donutData = useMemo(() => {
    return (data?.charts?.distribution || []).map((item: any) => {
      const conf = WO_STATUS_META[item.category] || { label: item.category, dotColor: undefined };
      return {
        category: item.category,
        label: conf.label,
        count: Number(item.count || 0),
        color: conf.dotColor,
      };
    });
  }, [data?.charts?.distribution]);

  const saStageBars = useMemo(() => {
    const pipeline = data?.charts?.stagePipeline || [];
    if (pipeline.length === 0) {
      return Object.entries(STAGE_LABELS).map(([key, label]) => ({
        key,
        label,
        count: 0,
      }));
    }

    return pipeline.map((stage: any) => ({
      key: stage.status,
      label: STAGE_LABELS[stage.status] || WO_STATUS_META[stage.status]?.shortLabel || stage.status,
      count: Number(stage.count || 0),
    }));
  }, [data?.charts?.stagePipeline]);

  const saTelemetry = useMemo(() => {
    const sources = data?.charts?.sourceBreakdown || [];
    return sources.map((item: any) => ({
      label: SOURCE_TYPE_LABELS[item.sourceType] || item.sourceType,
      count: Number(item.count || 0),
      pct: Number(item.pct || 0),
    }));
  }, [data?.charts?.sourceBreakdown]);

  return (
    <div className="flex flex-col min-w-0 w-full space-y-6 py-4 sm:py-6 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Phân tích &amp; KPI Cá nhân
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi doanh thu quyết toán, tỷ lệ chốt báo giá và tiến độ các hồ sơ do bạn trực tiếp phụ trách.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/advisor/intake-queue"
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors"
          >
            Hàng chờ tiếp nhận
          </Link>
          <Link
            href="/advisor/work-orders"
            className="sa-press px-3 py-1.5 text-xs font-medium bg-[#0050cd] hover:bg-[#0866ff] text-white rounded-lg transition-colors shadow-xs"
          >
            + Hồ sơ của tôi
          </Link>
        </div>
      </div>

      {/* Filter Bar (Personal SA scope locked on server, no scope switcher) */}
      <DashboardFilterBar
        period={period}
        onPeriodChange={setPeriod}
        showScopeSelector={false}
        onRefresh={refetch}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {/* Error State Banner */}
      {error && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 4 Personal KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.kpis || []).map((kpi, index) => {
          const variants: KPICardVariant[] = ['navy', 'royal', 'slate', 'midnight'];
          const cardVariant = variants[index % variants.length];

          let icon = 'analytics';
          let sparklineCallout: string | undefined;
          let splitPercentage = 0;
          let splitLeftLabel: string | undefined;
          let splitRightLabel: string | undefined;
          let subtitle: string | undefined;
          let sparklinePoints: number[] | undefined;
          let waveLabels: string[] | undefined;

          if (kpi.key === 'personalRevenue') {
            icon = 'payments';
            sparklinePoints = revenueSparkline;
            waveLabels = revenueWaveLabels;
            subtitle = 'Tổng hóa đơn đã thanh toán từ hồ sơ bạn phụ trách';
          } else if (kpi.key === 'quotationApprovalRate') {
            icon = 'fact_check';
            splitPercentage = Math.min(100, Math.max(0, Number(kpi.value || 0)));
            splitLeftLabel = `Đã duyệt (${summary.approvedQuotations})`;
            splitRightLabel = `Tổng (${summary.totalQuotations})`;
            subtitle =
              summary.totalQuotations > 0
                ? `${summary.approvedQuotations}/${summary.totalQuotations} báo giá được khách hàng duyệt`
                : 'Chưa phát sinh báo giá trong kỳ lọc';
          } else if (kpi.key === 'completedWos') {
            icon = 'task_alt';
            sparklineCallout = `${kpi.value} hồ sơ`;
            subtitle = 'Phiếu công việc bạn phụ trách đã đóng & bàn giao';
          } else if (kpi.key === 'activeWosCount') {
            icon = 'assignment_ind';
            subtitle = `${summary.pendingApprovalCount} chờ duyệt • ${summary.handoverReadyCount} chờ giao xe`;
          }

          return (
            <div key={kpi.key} className="sa-enter" style={{ animationDelay: `${index * 35}ms` }}>
              <KPICard
                label={kpi.label}
                value={kpi.value}
                prevValue={kpi.prevValue}
                format={kpi.format}
                unit={kpi.unit}
                isLoading={isLoading}
                variant={cardVariant}
                sparklineCallout={sparklineCallout}
                sparklinePoints={sparklinePoints}
                waveLabels={waveLabels}
                splitPercentage={splitPercentage}
                splitLeftLabel={splitLeftLabel}
                splitRightLabel={splitRightLabel}
                subtitle={subtitle}
                icon={icon}
              />
            </div>
          );
        })}
      </div>

      {/* Breakdown chart and Personal Summary Card */}
      <div className="sa-enter grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ animationDelay: '120ms' }}>
        <div className="lg:col-span-2">
          <DashboardStatusBreakdown
            title="Phân bổ Tiến độ Hồ sơ Cá nhân"
            subtitle="Click vào từng trạng thái để lọc nhanh danh sách xe bạn đang phụ trách"
            data={donutData}
            selectedCategory={selectedStatus}
            onSelectCategory={handleToggleStatus}
            height={300}
            isLoading={isLoading}
          />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0050cd]/10 text-[#0050cd] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">person_check</span>
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Tóm tắt hiệu suất cá nhân
              </h3>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#f4f7fc] to-[#eaf1fb] dark:from-slate-800/80 dark:to-slate-800/40 border border-[#dce6f7] dark:border-slate-700 p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#0c2340] dark:text-white tabular-nums">
                  {summary.totalPeriodIntake}
                </span>
                <span className="text-xs font-semibold text-[#0050cd] dark:text-blue-400">
                  hồ sơ
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Tiếp nhận &amp; khởi tạo trong kỳ lọc hiện tại
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[16px] text-[#0050cd]">fact_check</span>
                  <span>Báo giá đã duyệt / tổng</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {summary.approvedQuotations} / {summary.totalQuotations}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[16px] text-[#0284c7]">search_check</span>
                  <span>Đang khám / lập kế hoạch</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {summary.inInspectionCount} xe
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[16px] text-[#059669]">key</span>
                  <span>Sẵn sàng bàn giao</span>
                </div>
                <span className="font-mono font-bold text-[#059669] dark:text-emerald-400 tabular-nums">
                  {summary.handoverReadyCount} xe
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/advisor"
            className="sa-press w-full rounded-xl bg-[#0c2340] hover:bg-[#0050cd] text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors shadow-xs"
          >
            <span>Vào bàn làm việc Cố vấn</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Bento Row: 8-Stage Pipeline & Personal Intake Sources */}
      <div className="sa-enter grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" style={{ animationDelay: '180ms' }}>
        <div className="lg:col-span-8">
          <DashboardStageBars
            title="Đường ống hồ sơ cá nhân qua 8 giai đoạn"
            subtitle="Số liệu thực tế từ các phiếu công việc do bạn trực tiếp phụ trách"
            stages={saStageBars}
            selectedStageKey={selectedStatus}
            onSelectStage={handleToggleStatus}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-4">
          <DashboardTelemetryMiniBars
            title="Nguồn tiếp nhận cá nhân"
            subtitle="Phân bổ theo kênh tiếp nhận trong kỳ"
            actionHref="/advisor/intake-queue"
            actionTitle="Mở hàng đợi tiếp nhận"
            items={saTelemetry}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Action Table */}
      <div>
        {selectedStatus && (
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            <span>
              Đang lọc theo: <strong>{WO_STATUS_META[selectedStatus]?.label || selectedStatus}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedStatus('')}
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 ml-1 font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              <span>Hủy lọc</span>
            </button>
          </div>
        )}
        <DashboardActionTable
          title="Danh Sách Hồ Sơ Xe Tôi Phụ Trách"
          subtitle="Toàn bộ hồ sơ đang xử lý và đã đóng do bạn trực tiếp phụ trách"
          columns={columns}
          data={filteredList}
          headerExtra={
            <select
              aria-label="Lọc theo trạng thái hồ sơ"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0050cd]/40 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.keys(STAGE_LABELS).map((statusKey) => (
                <option key={statusKey} value={statusKey}>
                  {WO_STATUS_META[statusKey]?.label || STAGE_LABELS[statusKey]}
                </option>
              ))}
            </select>
          }
          searchPlaceholder="Tìm theo mã hồ sơ, tên khách hoặc biển số..."
          searchFilterKey="woNumber"
          pageSize={10}
          isLoading={isLoading}
          emptyMessage="Không có hồ sơ xe nào phù hợp với bộ lọc hiện tại"
        />
      </div>
    </div>
  );
}
