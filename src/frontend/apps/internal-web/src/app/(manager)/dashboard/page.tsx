'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KPICard, KPICardVariant } from '@/components/dashboard/KPICard';
import { formatVND } from '@/lib/utils/formatters';
import { DashboardFilterBar } from '@/components/dashboard/DashboardFilterBar';
import { DashboardStatusBreakdown } from '@/components/dashboard/DashboardStatusBreakdown';
import { DashboardStageBars } from '@/components/dashboard/DashboardStageBars';
import { DashboardTelemetryMiniBars } from '@/components/dashboard/DashboardTelemetryMiniBars';
import { DashboardActionTable, TableColumn } from '@/components/dashboard/DashboardActionTable';

const DashboardTrendChart = dynamic(
  () => import('@/components/dashboard/DashboardTrendChart').then((mod) => mod.DashboardTrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
        <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800 rounded mb-6" />
        <div className="h-[360px] w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg" />
      </div>
    ),
  }
);

const WO_STATUS_CONFIG: Record<string, { label: string; badgeCls: string; dotColor: string }> = {
  IN_PLANNING: { label: 'Lập kế hoạch', badgeCls: 'bg-slate-100 text-slate-700 border-slate-200', dotColor: '#64748b' },
  PENDING_APPROVAL: { label: 'Chờ duyệt báo giá', badgeCls: 'bg-amber-50 text-amber-700 border-amber-200/80', dotColor: '#f59e0b' },
  APPROVED: { label: 'Đã duyệt giá', badgeCls: 'bg-blue-50 text-[#0050cd] border-blue-200/80', dotColor: '#0866ff' },
  IN_PROGRESS: { label: 'Đang sửa chữa', badgeCls: 'bg-sky-50 text-sky-700 border-sky-200/80', dotColor: '#0ea5e9' },
  BILLING_REQUESTED: { label: 'Chờ thanh toán', badgeCls: 'bg-purple-50 text-purple-700 border-purple-200/80', dotColor: '#8b5cf6' },
  FINANCIAL_CLEARED: { label: 'Đã thanh toán', badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dotColor: '#10b981' },
};

const TELEMETRY_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'ACTIVE', label: 'Đang sửa' },
  { id: 'WAITING', label: 'Chờ duyệt' },
];

const MANAGER_DASHBOARD_COLUMNS: TableColumn<any>[] = [
  {
    key: 'woNumber',
    label: 'Mã hồ sơ',
    sortable: true,
    render: (row) => (
      <span className="font-mono font-bold text-[#0050cd] dark:text-blue-400">
        {row.woNumber}
      </span>
    ),
  },
  {
    key: 'customerName',
    label: 'Khách hàng',
    sortable: true,
    render: (row) => (
      <div className="font-medium text-slate-900 dark:text-white">
        {row.customerName}
      </div>
    ),
  },
  {
    key: 'vehiclePlate',
    label: 'Biển số xe',
    sortable: true,
    render: (row) => (
      <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg">
        {row.vehiclePlate}
      </span>
    ),
  },
  {
    key: 'advisorName',
    label: 'Cố vấn (SA)',
    sortable: true,
    render: (row) => (
      <span className="text-slate-600 dark:text-slate-400">{row.advisorName}</span>
    ),
  },
  {
    key: 'status',
    label: 'Trạng thái',
    sortable: true,
    render: (row) => {
      const conf = WO_STATUS_CONFIG[row.status] || {
        label: row.status,
        badgeCls: 'bg-slate-100 text-slate-700 border-slate-200',
        dotColor: '#94a3b8',
      };
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${conf.badgeCls}`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: conf.dotColor }}
          ></span>
          {conf.label}
        </span>
      );
    },
  },
  {
    key: 'updatedAt',
    label: 'Cập nhật',
    sortable: true,
    render: (row) => (
      <span className="text-slate-400 text-xs font-mono">
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
    render: (row) => (
      <Link
        href={`/advisor?woId=${row.id}`}
        className="text-xs font-semibold text-[#0050cd] hover:underline"
      >
        Theo dõi →
      </Link>
    ),
  },
];

export default function ManagerDashboardPage() {
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
    portal: 'manager',
    initialPeriod: '7days',
  });

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [telemetryTab, setTelemetryTab] = useState<'ALL' | 'ACTIVE' | 'WAITING'>('ALL');
  const [urlSearchQuery, setUrlSearchQuery] = useState<string>('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('search') || '';
      setUrlSearchQuery(q.trim());
    }
  }, []);

  // Cross-filtering applied to actionableList
  const filteredWorkOrders = useMemo(() => {
    let list = data?.actionableList || [];
    if (selectedStatusFilter) {
      list = list.filter((item: any) => item.status === selectedStatusFilter);
    }
    if (urlSearchQuery) {
      const kw = urlSearchQuery.toLowerCase();
      list = list.filter(
        (item: any) =>
          String(item.woNumber || '').toLowerCase().includes(kw) ||
          String(item.customerName || '').toLowerCase().includes(kw) ||
          String(item.vehiclePlate || '').toLowerCase().includes(kw)
      );
    }
    return list;
  }, [data?.actionableList, selectedStatusFilter, urlSearchQuery]);

  // Map Breakdown data (Horizontal Ranked Bars)
  const statusBreakdownData = useMemo(
    () =>
      (data?.charts?.distribution || []).map((item: any) => {
        const conf = WO_STATUS_CONFIG[item.category];
        return {
          category: item.category,
          label: conf?.label || item.category,
          count: item.count,
          color: conf?.dotColor,
        };
      }),
    [data?.charts?.distribution]
  );

  // 8 giai đoạn phân bổ quy trình xưởng từ nguồn dữ liệu đơn nhất (không cộng trùng, không fallback số giả)
  const managerStageBars = useMemo(() => {
    const countsByStatus: Record<string, number> = {};
    const dist = data?.charts?.distribution || [];
    if (dist.length > 0) {
      dist.forEach((item: any) => {
        countsByStatus[item.category] = Number(item.count) || 0;
      });
    } else {
      (data?.actionableList || []).forEach((wo: any) => {
        countsByStatus[wo.status] = (countsByStatus[wo.status] || 0) + 1;
      });
    }

    return [
      { key: 'DRAFT', label: 'Tiếp nhận', count: countsByStatus['DRAFT'] ?? 0 },
      { key: 'IN_PLANNING', label: 'Kế hoạch', count: countsByStatus['IN_PLANNING'] ?? 0, highlight: true },
      { key: 'PENDING_APPROVAL', label: 'Chờ duyệt', count: countsByStatus['PENDING_APPROVAL'] ?? 0 },
      { key: 'APPROVED', label: 'Đã duyệt', count: countsByStatus['APPROVED'] ?? 0 },
      { key: 'IN_PROGRESS', label: 'Đang sửa', count: countsByStatus['IN_PROGRESS'] ?? 0 },
      { key: 'BILLING_REQUESTED', label: 'Chờ TT', count: countsByStatus['BILLING_REQUESTED'] ?? 0 },
      { key: 'FINANCIAL_CLEARED', label: 'Chờ giao', count: countsByStatus['FINANCIAL_CLEARED'] ?? 0 },
      { key: 'CLOSED', label: 'Hoàn tất', count: countsByStatus['CLOSED'] ?? 0 },
    ];
  }, [data?.charts?.distribution, data?.actionableList]);

  // Tỷ trọng giai đoạn lệnh xe thực tế từ API (Telemetry Mini-Bars)
  const intakeTelemetry = useMemo(() => {
    const activeKeys = ['IN_PLANNING', 'APPROVED', 'IN_PROGRESS'];
    const waitingKeys = ['DRAFT', 'PENDING_APPROVAL', 'BILLING_REQUESTED', 'FINANCIAL_CLEARED'];

    const filteredStages =
      telemetryTab === 'ACTIVE'
        ? managerStageBars.filter((s) => activeKeys.includes(s.key))
        : telemetryTab === 'WAITING'
        ? managerStageBars.filter((s) => waitingKeys.includes(s.key))
        : managerStageBars.slice(0, 5);

    const totalStageCount = managerStageBars.reduce((acc, s) => acc + s.count, 0);
    const denominator = Math.max(1, totalStageCount);

    return filteredStages.map((stage) => ({
      label: stage.label,
      count: stage.count,
      pct: totalStageCount > 0 ? Math.round((stage.count / denominator) * 100) : 0,
    }));
  }, [managerStageBars, telemetryTab]);

  return (
    <div className="flex flex-col min-w-0 w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Trung Tâm Điều Hành & Giám Sát Xưởng Dịch Vụ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi doanh thu, thông lượng sửa chữa, cảnh báo trễ SLA và điều phối năng suất xưởng thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/inventory"
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition-colors"
          >
            Quản lý kho phụ tùng
          </Link>
          <Link
            href="/reports"
            className="px-3.5 py-2 text-xs font-semibold bg-[#0050cd] hover:bg-blue-700 text-white rounded-xl transition-colors shadow-xs"
          >
            Báo cáo chi tiết
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilterBar
        period={period}
        onPeriodChange={setPeriod}
        onRefresh={refetch}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-800">
            <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
            <span>Không thể tải dữ liệu điều hành xưởng: {error}</span>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="h-9 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(data?.kpis || []).map((kpi, index) => {
          const variants: KPICardVariant[] = ['navy', 'royal', 'slate'];
          const cardVariant = variants[index % variants.length];

          const trendSeries = data?.charts?.trend || [];
          const realSparklinePoints =
            trendSeries.length >= 2
              ? trendSeries.slice(-5).map((t: any) => Number(t.value) || 0)
              : undefined;
          const realWaveLabels =
            trendSeries.length >= 2
              ? trendSeries.slice(-5).map((t: any) => String(t.label || ''))
              : ['Tiếp nhận', 'Báo giá', 'Thi công', 'KCS', 'Quyết toán'];

          const inExecCount = managerStageBars
            .filter((s) => ['IN_PLANNING', 'APPROVED', 'IN_PROGRESS'].includes(s.key))
            .reduce((acc, s) => acc + s.count, 0);
          const totalStageCount = managerStageBars.reduce((acc, s) => acc + s.count, 0);
          const realSplitPct =
            totalStageCount > 0
              ? Math.round((inExecCount / totalStageCount) * 100)
              : Number(kpi.value) > 0
              ? 100
              : 0;

          let sparklineCallout: string | undefined;
          let splitPercentage = realSplitPct;
          let splitLeftLabel: string | undefined;
          let splitRightLabel: string | undefined;
          let subtitle: string | undefined;

          if (index === 0) {
            sparklineCallout = formatVND(Number(kpi.value), true);
            subtitle = 'Doanh số hóa đơn dịch vụ đã quyết toán';
          } else if (index === 1) {
            splitLeftLabel = 'Đang xử lý';
            splitRightLabel = 'Chờ duyệt / TT';
            subtitle = 'Lưu lượng xe đang hoạt động trong xưởng';
          } else if (index === 2) {
            sparklineCallout = `${kpi.value} quá hạn`;
            subtitle = 'Cảnh báo tiến độ công việc vượt SLA';
          }

          return (
            <KPICard
              key={kpi.key}
              label={kpi.label}
              value={kpi.value}
              prevValue={kpi.prevValue}
              format={kpi.format}
              unit={kpi.unit}
              trendInverted={kpi.trendInverted}
              isLoading={isLoading}
              variant={cardVariant}
              sparklineCallout={sparklineCallout}
              sparklinePoints={index === 0 ? realSparklinePoints : undefined}
              splitPercentage={splitPercentage}
              splitLeftLabel={splitLeftLabel}
              splitRightLabel={splitRightLabel}
              subtitle={subtitle}
              waveLabels={realWaveLabels}
              icon={
                kpi.key === 'totalRevenue'
                  ? 'payments'
                  : kpi.key === 'activeWorkOrders'
                  ? 'car_repair'
                  : 'timer_off'
              }
            />
          );
        })}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardTrendChart
            title="Biểu đồ Doanh thu Quyết toán Thực tế"
            subtitle="Doanh số các hóa đơn đã được thanh toán qua quầy và SePay theo mốc thời gian"
            data={data?.charts?.trend || []}
            format="currency"
            height={360}
            isLoading={isLoading}
          />
        </div>
        <div>
          <DashboardStatusBreakdown
            title="Cơ cấu Lệnh xe Đang Mở"
            subtitle="Click vào từng trạng thái để lọc nhanh danh sách xe bên dưới"
            data={statusBreakdownData}
            selectedCategory={selectedStatusFilter}
            onSelectCategory={setSelectedStatusFilter}
            height={360}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Bento Row: Phân bổ 8 giai đoạn quy trình xưởng & Lưu lượng kênh tiếp nhận (Phong cách SA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <DashboardStageBars
            title="Phân bổ phiếu công việc theo 8 giai đoạn quy trình xưởng"
            subtitle="Theo dõi mật độ xe tại từng khâu trong quy trình dịch vụ từ tiếp nhận đến xuất xưởng"
            stages={managerStageBars}
            highlightTooltipTitle="Kế hoạch thi công"
            highlightTooltipPrimaryText={`Thực tế: ${managerStageBars.find((s) => s.highlight)?.count || 0} xe`}
            highlightTooltipSecondaryText="Ưu tiên bố trí khoang"
            onSelectStage={(key) => setSelectedStatusFilter(key)}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-4">
          <DashboardTelemetryMiniBars
            title="Tỷ trọng giai đoạn lệnh xe"
            subtitle="Tỷ lệ phân bổ thực tế theo khâu xử lý"
            items={intakeTelemetry}
            activeTab={telemetryTab}
            onTabChange={(tabId) => setTelemetryTab(tabId as 'ALL' | 'ACTIVE' | 'WAITING')}
            tabs={TELEMETRY_TABS}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Active Work Orders Action Table */}
      <div>
        {selectedStatusFilter && (
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-700 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
            <span>Đang lọc theo trạng thái: <strong className="text-[#0050cd] dark:text-blue-400">{WO_STATUS_CONFIG[selectedStatusFilter]?.label || selectedStatusFilter}</strong></span>
            <button
              onClick={() => setSelectedStatusFilter('')}
              className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
            >
              ✕ Hủy lọc
            </button>
          </div>
        )}
        <DashboardActionTable
          title="Hàng Đợi Lệnh Sửa Chữa Đang Xử Lý"
          subtitle="Danh sách các xe đang trong quy trình khám, báo giá, sửa chữa hoặc chờ thanh toán"
          columns={MANAGER_DASHBOARD_COLUMNS}
          data={filteredWorkOrders}
          searchPlaceholder="Tìm kiếm theo mã hồ sơ, tên khách hoặc biển số..."
          searchFilterKey="woNumber"
          pageSize={10}
          isLoading={isLoading}
          emptyMessage="Không có lệnh sửa chữa nào phù hợp với bộ lọc hiện tại"
        />
      </div>
    </div>
  );
}
