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

const JOB_STATUS_MAP: Record<string, { label: string; badgeCls: string; dotColor: string }> = {
  PLANNED: { label: 'Chưa làm', badgeCls: 'bg-slate-100 text-slate-700', dotColor: '#64748b' },
  IN_PROGRESS: { label: 'Đang sửa', badgeCls: 'bg-blue-50 text-[#0050cd]', dotColor: '#0050cd' },
  COMPLETED: { label: 'Hoàn thành', badgeCls: 'bg-emerald-50 text-emerald-700', dotColor: '#10b981' },
  PAUSED: { label: 'Tạm dừng', badgeCls: 'bg-amber-50 text-amber-700', dotColor: '#f59e0b' },
  CANCELLED: { label: 'Đã hủy', badgeCls: 'bg-rose-50 text-rose-700', dotColor: '#ef4444' },
};

const STAFF_DASHBOARD_COLUMNS: TableColumn<any>[] = [
  {
    key: 'name',
    label: 'Hạng mục công việc',
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span>
    ),
  },
  {
    key: 'woNumber',
    label: 'Mã lệnh (WO)',
    sortable: true,
    render: (row) => (
      <span className="font-mono font-semibold text-[#0050cd] tabular-nums">
        {row.woNumber || '—'}
      </span>
    ),
  },
  {
    key: 'vehiclePlate',
    label: 'Biển số xe',
    sortable: true,
    render: (row) => (
      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
        {row.vehiclePlate || '—'}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Trạng thái',
    sortable: true,
    render: (row) => {
      const conf = JOB_STATUS_MAP[row.status] || {
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
    key: 'estimatedHours',
    label: 'Định mức SLA',
    sortable: true,
    render: (row) => (
      <span className="font-mono text-slate-600 dark:text-slate-400">
        {row.estimatedHours ? `${row.estimatedHours} giờ` : '—'}
      </span>
    ),
  },
];

export default function StaffCommandDashboardPage() {
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
    portal: 'staff',
    initialPeriod: '7days',
    initialScope: 'workshop',
  });

  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const filteredJobs = useMemo(() => {
    const list = data?.actionableList || [];
    if (!selectedStatus) return list;
    return list.filter((j: any) => j.status === selectedStatus);
  }, [data?.actionableList, selectedStatus]);

  const donutData = useMemo(
    () =>
      (data?.charts?.jobStatus || []).map((item: any) => ({
        category: item.category,
        count: item.count,
        color: item.category.includes('Hoàn thành') ? '#10b981' : '#0050cd',
      })),
    [data?.charts?.jobStatus]
  );

  // 5 giai đoạn nhiệm vụ kỹ thuật từ dữ liệu API thực tế (không nhân tỷ lệ giả)
  const staffStageBars = useMemo(() => {
    const active = Number(data?.kpis?.find((k) => k.key === 'activeJobsCount')?.value ?? 0);
    const completed = Number(data?.kpis?.find((k) => k.key === 'completedTodayCount')?.value ?? 0);
    const appointments = Number(data?.kpis?.find((k) => k.key === 'appointmentsToday')?.value ?? 0);
    const intakeQueue = Number(
      data?.kpis?.find((k) => k.key === 'intakeQueueCount' || k.key === 'lowStockCount')?.value ?? 0
    );
    const plannedFromList = (data?.actionableList || []).filter(
      (j: any) => j.status === 'PLANNED' || j.status === 'PENDING'
    ).length;

    return [
      { key: 'APPOINTMENTS', label: 'Lịch hẹn', count: appointments },
      { key: 'INTAKE', label: 'Tiếp nhận', count: intakeQueue },
      { key: 'ASSIGNED', label: 'Chờ làm', count: plannedFromList },
      { key: 'IN_PROGRESS', label: 'Đang sửa', count: active, highlight: true },
      { key: 'COMPLETED', label: 'Hoàn thành', count: completed },
    ];
  }, [data?.kpis, data?.actionableList]);

  // Tỷ trọng khối lượng công việc trong ca trực từ dữ liệu thực tế (không chia khung giờ giả)
  const shiftTelemetry = useMemo(() => {
    const totalStage = staffStageBars.reduce((acc, s) => acc + s.count, 0);
    const denom = Math.max(1, totalStage);
    return staffStageBars.slice(0, 4).map((s) => ({
      label: s.label,
      count: s.count,
      pct: totalStage > 0 ? Math.round((s.count / denom) * 100) : 0,
    }));
  }, [staffStageBars]);

  return (
    <div className="flex flex-col min-w-0 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bảng Điều Phối Kỹ Thuật Viên & Tiếp Nhận
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Giám sát nhiệm vụ sửa chữa cá nhân, tiến độ hoàn thành ca và lưu lượng tiếp nhận xe tại xưởng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/staff/intake"
            className="px-3 py-1.5 text-xs font-medium bg-[#0050cd] hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
          >
            + Tiếp nhận xe mới
          </Link>
          <Link
            href="/staff/appointments"
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors"
          >
            Lịch hẹn hôm nay
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilterBar
        period={period}
        onPeriodChange={setPeriod}
        showScopeSelector={false}
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
            <span>Không thể tải dữ liệu điều phối kỹ thuật: {error}</span>
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

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.kpis || []).map((kpi, index) => {
          const variants: KPICardVariant[] = ['navy', 'royal', 'slate', 'midnight'];
          const cardVariant = variants[index % variants.length];

          const activeJobsVal = Number(data?.kpis?.find((k) => k.key === 'activeJobsCount')?.value ?? 0);
          const completedJobsVal = Number(data?.kpis?.find((k) => k.key === 'completedTodayCount')?.value ?? 0);
          const totalJobsVal = activeJobsVal + completedJobsVal;
          const realJobSplit =
            totalJobsVal > 0
              ? Math.round((completedJobsVal / totalJobsVal) * 100)
              : completedJobsVal > 0
              ? 100
              : 0;

          let sparklineCallout: string | undefined;
          const splitPercentage = realJobSplit;
          let splitLeftLabel: string | undefined;
          let splitRightLabel: string | undefined;
          let subtitle: string | undefined;
          const waveLabels = ['Lịch hẹn', 'Tiếp nhận', 'Chờ làm', 'Thi công', 'Hoàn tất'];

          if (index === 0) {
            sparklineCallout = `${kpi.value} hạng mục`;
            subtitle = 'Công việc đang thao tác trên khoang sửa chữa';
          } else if (index === 1) {
            splitLeftLabel = 'Hoàn thành';
            splitRightLabel = 'Đang làm';
            subtitle = 'Hạng mục bảo dưỡng đã hoàn thành trong ca';
          } else if (index === 2) {
            sparklineCallout = `${kpi.value} lượt hẹn`;
            subtitle = 'Lượng xe đăng ký lịch hẹn tiếp nhận hôm nay';
          } else if (index === 3) {
            subtitle = 'Lưu lượng xe tiếp nhận qua quy trình dịch vụ';
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
                kpi.key === 'activeJobsCount'
                  ? 'construction'
                  : kpi.key === 'completedTodayCount'
                  ? 'task_alt'
                  : kpi.key === 'appointmentsToday'
                  ? 'event'
                  : 'inventory_2'
              }
            />
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardStatusBreakdown
            title="Tỷ lệ Tiến độ Công việc"
            subtitle="Tỷ lệ giữa công việc đang đảm nhiệm và công việc đã hoàn tất"
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
              <span className="material-symbols-outlined text-[18px] text-[#0050cd]">speed</span>
              Chế độ giám sát
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Toàn bộ chuyền xưởng
            </div>
            <p className="text-xs text-slate-500">
              Đang hiển thị danh sách các hạng mục công việc và lệnh sửa chữa đang thi công trong toàn phân xưởng.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/staff"
              className="text-xs font-semibold text-[#0050cd] hover:underline flex items-center justify-between"
            >
              <span>Vào trung tâm tiếp nhận xe & thu ngân</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Row: Phân bổ 5 bước nhiệm vụ kỹ thuật & Khung giờ tiếp nhận xe (Phong cách SA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <DashboardStageBars
            title="Tiến độ thực thi nhiệm vụ kỹ thuật qua các khâu"
            subtitle="Mật độ công việc tại từng giai đoạn xử lý từ tiếp nhận đến nghiệm thu kỹ thuật"
            stages={staffStageBars}
            highlightTooltipTitle="Thi công sửa chữa"
            highlightTooltipPrimaryText={`Thực tế: ${staffStageBars.find((s) => s.highlight)?.count || 0} công việc`}
            highlightTooltipSecondaryText="Đang thao tác tại khoang"
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-4">
          <DashboardTelemetryMiniBars
            title="Mật độ xe theo khung giờ ca trực"
            subtitle="Tần suất phân bổ lịch hẹn và tiếp nhận theo kỳ đang chọn"
            items={shiftTelemetry}
            activeTab={period === 'today' ? 'TODAY' : 'WEEK'}
            onTabChange={(tabId) => setPeriod(tabId === 'TODAY' ? 'today' : '7days')}
            tabs={[
              { id: 'TODAY', label: 'Hôm nay' },
              { id: 'WEEK', label: 'Tuần này' },
            ]}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Action Table */}
      <div>
        {selectedStatus && (
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            <span>Đang lọc theo: <strong>{selectedStatus}</strong></span>
            <button
              onClick={() => setSelectedStatus('')}
              className="text-red-500 hover:text-red-700 ml-1 font-bold"
            >
              ✕ Hủy lọc
            </button>
          </div>
        )}
        <DashboardActionTable
          title="Hàng Đợi Công Việc (Toàn xưởng)"
          subtitle="Danh sách các công việc cần tiến hành sửa chữa, bảo dưỡng hoặc thay thế phụ tùng"
          columns={STAFF_DASHBOARD_COLUMNS}
          data={filteredJobs}
          searchPlaceholder="Tìm theo tên công việc, biển số hoặc mã phiếu..."
          searchFilterKey="name"
          pageSize={10}
          isLoading={isLoading}
          emptyMessage="Không có công việc nào trong danh sách hiện tại"
        />
      </div>
    </div>
  );
}
