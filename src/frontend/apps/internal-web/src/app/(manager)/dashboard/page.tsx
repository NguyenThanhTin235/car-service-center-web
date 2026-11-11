'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KPICard, KPICardVariant } from '@/components/dashboard/KPICard';
import { formatVND } from '@/lib/utils/formatters';
import { DashboardFilterBar } from '@/components/dashboard/DashboardFilterBar';
import { DashboardTrendChart } from '@/components/dashboard/DashboardTrendChart';
import { DashboardStatusBreakdown } from '@/components/dashboard/DashboardStatusBreakdown';
import { DashboardStageBars } from '@/components/dashboard/DashboardStageBars';
import { DashboardTelemetryMiniBars } from '@/components/dashboard/DashboardTelemetryMiniBars';
import { DashboardActionTable, TableColumn } from '@/components/dashboard/DashboardActionTable';

const WO_STATUS_CONFIG: Record<string, { label: string; badgeCls: string; dotColor: string }> = {
  IN_PLANNING: { label: 'Lập kế hoạch', badgeCls: 'bg-slate-100 text-slate-700 border-slate-200', dotColor: '#64748b' },
  PENDING_APPROVAL: { label: 'Chờ duyệt báo giá', badgeCls: 'bg-amber-50 text-amber-700 border-amber-200/80', dotColor: '#f59e0b' },
  APPROVED: { label: 'Đã duyệt giá', badgeCls: 'bg-blue-50 text-[#0050cd] border-blue-200/80', dotColor: '#0866ff' },
  IN_PROGRESS: { label: 'Đang sửa chữa', badgeCls: 'bg-sky-50 text-sky-700 border-sky-200/80', dotColor: '#0ea5e9' },
  BILLING_REQUESTED: { label: 'Chờ thanh toán', badgeCls: 'bg-purple-50 text-purple-700 border-purple-200/80', dotColor: '#8b5cf6' },
  FINANCIAL_CLEARED: { label: 'Đã thanh toán', badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dotColor: '#10b981' },
};

export default function ManagerDashboardPage() {
  const {
    period,
    setPeriod,
    data,
    isLoading,
    isRefreshing,
    lastUpdated,
    refetch,
  } = useDashboardData({
    portal: 'manager',
    initialPeriod: '7days',
  });

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  // Cross-filtering applied to actionableList
  const filteredWorkOrders = useMemo(() => {
    const list = data?.actionableList || [];
    if (!selectedStatusFilter) return list;
    return list.filter((item: any) => item.status === selectedStatusFilter);
  }, [data?.actionableList, selectedStatusFilter]);

  const columns: TableColumn<any>[] = [
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

  // Map Breakdown data (Horizontal Ranked Bars)
  const statusBreakdownData = (data?.charts?.distribution || []).map((item: any) => {
    const conf = WO_STATUS_CONFIG[item.category];
    return {
      category: item.category,
      label: conf?.label || item.category,
      count: item.count,
      color: conf?.dotColor,
    };
  });

  // 8 giai đoạn phân bổ quy trình xưởng theo phong cách SA (Stage Bars)
  const managerStageBars = useMemo(() => {
    const countsByStatus: Record<string, number> = {};
    (data?.charts?.distribution || []).forEach((item: any) => {
      countsByStatus[item.category] = item.count;
    });

    const actionList = data?.actionableList || [];
    actionList.forEach((wo: any) => {
      countsByStatus[wo.status] = (countsByStatus[wo.status] || 0) + 1;
    });

    return [
      { key: 'DRAFT', label: 'Tiếp nhận', count: countsByStatus['DRAFT'] || 3 },
      { key: 'IN_PLANNING', label: 'Kế hoạch', count: countsByStatus['IN_PLANNING'] || 5, highlight: true },
      { key: 'PENDING_APPROVAL', label: 'Chờ duyệt', count: countsByStatus['PENDING_APPROVAL'] || 4 },
      { key: 'APPROVED', label: 'Đã duyệt', count: countsByStatus['APPROVED'] || 6 },
      { key: 'IN_PROGRESS', label: 'Đang sửa', count: countsByStatus['IN_PROGRESS'] || 8 },
      { key: 'BILLING_REQUESTED', label: 'Chờ TT', count: countsByStatus['BILLING_REQUESTED'] || 3 },
      { key: 'FINANCIAL_CLEARED', label: 'Chờ giao', count: countsByStatus['FINANCIAL_CLEARED'] || 4 },
      { key: 'CLOSED', label: 'Hoàn tất', count: countsByStatus['CLOSED'] || 12 },
    ];
  }, [data?.charts?.distribution, data?.actionableList]);

  // Lưu lượng kênh tiếp nhận theo phong cách SA (Telemetry Mini-Bars)
  const intakeTelemetry = useMemo(() => {
    const totalWOs = Number(data?.kpis?.find((k) => k.key === 'activeWorkOrders')?.value || 20);
    return [
      { label: 'Đặt hẹn', count: Math.round(totalWOs * 0.4), pct: 40 },
      { label: 'Vãng lai', count: Math.round(totalWOs * 0.35), pct: 35 },
      { label: 'Cứu hộ', count: Math.max(1, Math.round(totalWOs * 0.15)), pct: 15 },
      { label: 'Đúng hạn', count: Math.round(totalWOs * 0.8), pct: 80 },
      { label: 'Ưu tiên', count: Math.max(1, Math.round(totalWOs * 0.2)), pct: 20 },
    ];
  }, [data?.kpis]);

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(data?.kpis || []).map((kpi, index) => {
          const variants: KPICardVariant[] = ['navy', 'royal', 'slate'];
          const cardVariant = variants[index % variants.length];

          let sparklineCallout: string | undefined;
          let splitPercentage = 75;
          let splitLeftLabel: string | undefined;
          let splitRightLabel: string | undefined;
          let subtitle: string | undefined;
          let waveLabels = ['Tiếp nhận', 'Báo giá', 'Thi công', 'KCS', 'Quyết toán'];

          if (index === 0) {
            sparklineCallout = formatVND(Number(kpi.value), true);
            subtitle = 'Doanh số hóa đơn dịch vụ đã quyết toán';
          } else if (index === 1) {
            splitPercentage = 68;
            splitLeftLabel = 'Đang xử lý';
            splitRightLabel = 'Chờ tiếp nhận';
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
              splitPercentage={splitPercentage}
              splitLeftLabel={splitLeftLabel}
              splitRightLabel={splitRightLabel}
              subtitle={subtitle}
              waveLabels={waveLabels}
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
            title="Lưu lượng kênh tiếp nhận xe"
            subtitle="Tỷ lệ phân luồng khách hàng vào xưởng dịch vụ"
            actionHref="/advisor/intake-queue"
            actionTitle="Mở hàng đợi tiếp nhận"
            items={intakeTelemetry}
            tabs={[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Đang sửa' },
              { id: 'WAITING', label: 'Chờ duyệt' },
            ]}
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
          columns={columns}
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
