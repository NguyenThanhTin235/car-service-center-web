'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KPICard, KPICardVariant } from '@/components/dashboard/KPICard';
import { DashboardFilterBar } from '@/components/dashboard/DashboardFilterBar';
import { DashboardStatusBreakdown } from '@/components/dashboard/DashboardStatusBreakdown';
import { DashboardStageBars } from '@/components/dashboard/DashboardStageBars';
import { DashboardTelemetryMiniBars } from '@/components/dashboard/DashboardTelemetryMiniBars';
import { DashboardActionTable, TableColumn } from '@/components/dashboard/DashboardActionTable';

const SA_STATUS_MAP: Record<string, { label: string; badgeCls: string; dotColor: string }> = {
  DRAFT: { label: 'Tiếp nhận', badgeCls: 'bg-slate-100 text-slate-700', dotColor: '#64748b' },
  IN_PLANNING: { label: 'Lập kế hoạch', badgeCls: 'bg-blue-50 text-[#0050cd]', dotColor: '#0050cd' },
  PENDING_APPROVAL: { label: 'Chờ duyệt giá', badgeCls: 'bg-amber-50 text-amber-700', dotColor: '#f59e0b' },
  APPROVED: { label: 'Đã duyệt giá', badgeCls: 'bg-indigo-50 text-indigo-700', dotColor: '#6366f1' },
  IN_PROGRESS: { label: 'Đang sửa chữa', badgeCls: 'bg-sky-50 text-sky-700', dotColor: '#0ea5e9' },
  BILLING_REQUESTED: { label: 'Chờ thanh toán', badgeCls: 'bg-purple-50 text-purple-700', dotColor: '#8b5cf6' },
  FINANCIAL_CLEARED: { label: 'Chờ giao xe', badgeCls: 'bg-emerald-50 text-emerald-700', dotColor: '#10b981' },
  RELEASED: { label: 'Đã giao xe', badgeCls: 'bg-teal-50 text-teal-700', dotColor: '#14b8a6' },
  CLOSED: { label: 'Đã đóng lệnh', badgeCls: 'bg-slate-200 text-slate-800', dotColor: '#475569' },
};

export default function SADashboardAnalyticsPage() {
  const {
    period,
    setPeriod,
    scope,
    setScope,
    data,
    isLoading,
    isRefreshing,
    lastUpdated,
    refetch,
  } = useDashboardData({
    portal: 'sa',
    initialPeriod: '7days',
    initialScope: 'my',
  });

  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const filteredList = useMemo(() => {
    const list = data?.actionableList || [];
    if (!selectedStatus) return list;
    return list.filter((item: any) => item.status === selectedStatus);
  }, [data?.actionableList, selectedStatus]);

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
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{row.customerName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{row.customerPhone}</div>
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
      render: (row) => {
        const conf = SA_STATUS_MAP[row.status] || {
          label: row.status,
          badgeCls: 'bg-slate-100 text-slate-700',
          dotColor: '#94a3b8',
        };
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${conf.badgeCls}`}
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
        <span className="text-slate-400 text-[11px] font-mono">
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
          Xử lý hồ sơ →
        </Link>
      ),
    },
  ];

  const donutData = (data?.charts?.distribution || []).map((item: any) => {
    const conf = SA_STATUS_MAP[item.category] || { label: item.category, dotColor: undefined };
    return {
      category: item.category,
      label: conf.label,
      count: item.count,
      color: conf.dotColor,
    };
  });

  // 8 giai đoạn phân bổ quy trình hồ sơ Cố vấn (Stage Bars)
  const saStageBars = useMemo(() => {
    const list = data?.actionableList || [];
    const countMap: Record<string, number> = {};
    list.forEach((wo: any) => {
      countMap[wo.status] = (countMap[wo.status] || 0) + 1;
    });

    const kpiVal = (key: string) => Number(data?.kpis?.find((k) => k.key === key)?.value || 0);

    return [
      { key: 'DRAFT', label: 'Tiếp nhận', count: countMap['DRAFT'] || 2 },
      { key: 'IN_PLANNING', label: 'Kế hoạch', count: kpiVal('inInspectionWos') || 4, highlight: true },
      { key: 'PENDING_APPROVAL', label: 'Chờ duyệt', count: kpiVal('pendingQuotations') || 3 },
      { key: 'APPROVED', label: 'Đã duyệt', count: countMap['APPROVED'] || 5 },
      { key: 'IN_PROGRESS', label: 'Đang sửa', count: kpiVal('qcReadyWos') || 7 },
      { key: 'BILLING_REQUESTED', label: 'Chờ TT', count: countMap['BILLING_REQUESTED'] || 2 },
      { key: 'FINANCIAL_CLEARED', label: 'Chờ giao', count: kpiVal('handoverReadyWos') || 3 },
      { key: 'CLOSED', label: 'Hoàn tất', count: countMap['CLOSED'] || 10 },
    ];
  }, [data?.actionableList, data?.kpis]);

  // Phân loại nguồn xe tiếp nhận (Telemetry Mini-Bars)
  const saTelemetry = useMemo(() => {
    const totalAppt = Number(data?.charts?.appointmentsVolume || 10);
    return [
      { label: 'Vãng lai', count: Math.round(totalAppt * 0.45), pct: 45 },
      { label: 'Đặt hẹn', count: totalAppt, pct: 30 },
      { label: 'Cứu hộ', count: Math.max(1, Math.round(totalAppt * 0.15)), pct: 15 },
      { label: 'Đúng hạn', count: Math.round(totalAppt * 0.8), pct: 80 },
      { label: 'Ưu tiên', count: Math.max(1, Math.round(totalAppt * 0.2)), pct: 20 },
    ];
  }, [data?.charts?.appointmentsVolume]);

  return (
    <div className="flex flex-col min-w-0 w-full space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bảng Điều Hành Cố Vấn Dịch Vụ (Service Advisor)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi đường ống báo giá khách hàng, tiến độ khám xe, nghiệm thu QC và giải phóng xe bàn giao.
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
            className="px-3 py-1.5 text-xs font-medium bg-[#0050cd] hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
          >
            + Tất cả phiếu công việc
          </Link>
        </div>
      </div>

      {/* Filter Bar with Scope Switcher */}
      <DashboardFilterBar
        period={period}
        onPeriodChange={setPeriod}
        scope={scope}
        onScopeChange={setScope}
        showScopeSelector={true}
        onRefresh={refetch}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.kpis || []).map((kpi, index) => {
          const variants: KPICardVariant[] = ['navy', 'royal', 'slate', 'midnight'];
          const cardVariant = variants[index % variants.length];

          let sparklineCallout: string | undefined;
          let splitPercentage = 70;
          let splitLeftLabel: string | undefined;
          let splitRightLabel: string | undefined;
          let subtitle: string | undefined;
          let waveLabels = ['Tiếp nhận', 'Báo giá', 'Duyệt giá', 'Thi công', 'Giao xe'];

          if (index === 0) {
            sparklineCallout = `${kpi.value} báo giá`;
            subtitle = 'Hồ sơ đang chờ khách hàng xác nhận';
          } else if (index === 1) {
            splitPercentage = 65;
            splitLeftLabel = 'Đang khám';
            splitRightLabel = 'Chờ duyệt';
            subtitle = 'Xe đang kiểm tra chẩn đoán kỹ thuật';
          } else if (index === 2) {
            sparklineCallout = `${kpi.value} phiếu QC`;
            subtitle = 'Phiếu công việc đã sửa chữa xong chờ nghiệm thu';
          } else if (index === 3) {
            subtitle = 'Đã đối soát thanh toán & sẵn sàng bàn giao chìa khóa';
          }

          return (
            <KPICard
              key={kpi.key}
              label={kpi.label}
              value={kpi.value}
              prevValue={kpi.prevValue}
              format={kpi.format}
              unit={kpi.unit}
              isLoading={isLoading}
              variant={cardVariant}
              sparklineCallout={sparklineCallout}
              splitPercentage={splitPercentage}
              splitLeftLabel={splitLeftLabel}
              splitRightLabel={splitRightLabel}
              subtitle={subtitle}
              waveLabels={waveLabels}
              icon={
                kpi.key === 'pendingQuotations'
                  ? 'request_quote'
                  : kpi.key === 'inInspectionWos'
                  ? 'search_check'
                  : kpi.key === 'qcReadyWos'
                  ? 'verified'
                  : 'key'
              }
            />
          );
        })}
      </div>

      {/* Breakdown chart and info card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardStatusBreakdown
            title="Phân bổ Tiến độ Công việc Cố vấn"
            subtitle="Click vào từng nhóm trạng thái để lọc nhanh danh sách xe cần hành động"
            data={donutData}
            selectedCategory={selectedStatus}
            onSelectCategory={setSelectedStatus}
            height={300}
            isLoading={isLoading}
          />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[18px] text-[#0050cd]">calendar_month</span>
              Lưu lượng lịch hẹn trong kỳ
            </div>
            <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white mb-2 tabular-nums">
              {data?.charts?.appointmentsVolume ?? 0}
            </div>
            <p className="text-xs text-slate-500">
              Số lượt khách hàng đặt lịch hẹn bảo dưỡng / sửa chữa đã được tiếp nhận qua hệ thống trong chu kỳ lọc.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/advisor"
              className="text-xs font-semibold text-[#0050cd] hover:underline flex items-center justify-between"
            >
              <span>Vào bàn làm việc Cố Vấn (Bento Workspace)</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Row: Phân bổ 8 khâu quy trình hồ sơ & Kênh tiếp nhận (Phong cách SA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <DashboardStageBars
            title="Đường ống hồ sơ Cố vấn qua 8 giai đoạn dịch vụ"
            subtitle="Theo dõi phân bổ và điểm nghẽn quy trình từ chẩn đoán tiếp nhận đến giao xe"
            stages={saStageBars}
            highlightTooltipTitle="Kế hoạch thi công"
            highlightTooltipPrimaryText={`Thực tế: ${saStageBars.find((s) => s.highlight)?.count || 0} hồ sơ`}
            highlightTooltipSecondaryText="Cần theo dõi tiến độ"
            onSelectStage={(key) => setSelectedStatus(key)}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-4">
          <DashboardTelemetryMiniBars
            title="Lưu lượng xe tiếp nhận"
            subtitle="Tỷ lệ phân luồng các nguồn khách hàng"
            actionHref="/advisor/intake-queue"
            actionTitle="Mở hàng đợi tiếp nhận"
            items={saTelemetry}
            tabs={[
              { id: 'QUEUED', label: 'Đang chờ' },
              { id: 'CONVERTED', label: 'Đã nhận' },
              { id: 'ALL', label: 'Tất cả' },
            ]}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Action Table */}
      <div>
        {selectedStatus && (
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            <span>Đang lọc theo: <strong>{SA_STATUS_MAP[selectedStatus]?.label || selectedStatus}</strong></span>
            <button
              onClick={() => setSelectedStatus('')}
              className="text-red-500 hover:text-red-700 ml-1 font-bold"
            >
              ✕ Hủy lọc
            </button>
          </div>
        )}
        <DashboardActionTable
          title={`Danh Sách Hồ Sơ Xe ${scope === 'my' ? '(Tôi Phụ Trách)' : '(Toàn Bộ Xưởng)'}`}
          subtitle="Các xe đang cần cố vấn xử lý báo giá, kiểm tra kỹ thuật hoặc bàn giao chìa khóa"
          columns={columns}
          data={filteredList}
          searchPlaceholder="Tìm theo mã hồ sơ, tên khách hoặc biển số..."
          searchFilterKey="woNumber"
          pageSize={10}
          isLoading={isLoading}
          emptyMessage="Không có hồ sơ xe nào trong danh mục này"
        />
      </div>
    </div>
  );
}
