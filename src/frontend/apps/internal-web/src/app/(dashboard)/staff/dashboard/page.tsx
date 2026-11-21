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

export default function StaffCommandDashboardPage() {
  const {
    period,
    setPeriod,
    data,
    isLoading,
    isRefreshing,
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

  const columns: TableColumn<any>[] = [
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

  const donutData = (data?.charts?.jobStatus || []).map((item: any) => ({
    category: item.category,
    count: item.count,
    color: item.category.includes('Hoàn thành') ? '#10b981' : '#0050cd',
  }));

  // 5 giai đoạn nhiệm vụ kỹ thuật (Stage Bars)
  const staffStageBars = useMemo(() => {
    const active = Number(data?.kpis?.find((k) => k.key === 'activeJobsCount')?.value || 5);
    const completed = Number(data?.kpis?.find((k) => k.key === 'completedTodayCount')?.value || 12);

    return [
      { key: 'ASSIGNED', label: 'Phân công', count: Math.max(1, Math.round(active * 0.4)) },
      { key: 'PARTS', label: 'Lấy phụ tùng', count: Math.max(1, Math.round(active * 0.3)) },
      { key: 'IN_PROGRESS', label: 'Đang sửa', count: active, highlight: true },
      { key: 'QC', label: 'KCS kiểm tra', count: Math.max(1, Math.round(completed * 0.3)) },
      { key: 'COMPLETED', label: 'Hoàn thành', count: completed },
    ];
  }, [data?.kpis]);

  // Telemetry khung giờ ca trực
  const shiftTelemetry = useMemo(() => {
    const totalAppt = Number(data?.kpis?.find((k) => k.key === 'appointmentsToday')?.value || 8);
    return [
      { label: '8h-10h', count: Math.round(totalAppt * 0.35), pct: 35 },
      { label: '10h-12h', count: Math.round(totalAppt * 0.25), pct: 25 },
      { label: '13h-15h', count: Math.round(totalAppt * 0.25), pct: 25 },
      { label: '15h-17h', count: Math.max(1, Math.round(totalAppt * 0.15)), pct: 15 },
    ];
  }, [data?.kpis]);

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

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.kpis || []).map((kpi, index) => {
          const variants: KPICardVariant[] = ['navy', 'royal', 'slate', 'midnight'];
          const cardVariant = variants[index % variants.length];

          let sparklineCallout: string | undefined;
          let splitPercentage = 80;
          let splitLeftLabel: string | undefined;
          let splitRightLabel: string | undefined;
          let subtitle: string | undefined;
          let waveLabels = ['Phân công', 'Nhận vật tư', 'Thi công', 'Kiểm tra', 'Hoàn tất'];

          if (index === 0) {
            sparklineCallout = `${kpi.value} hạng mục`;
            subtitle = 'Công việc đang thao tác trên khoang sửa chữa';
          } else if (index === 1) {
            splitPercentage = 85;
            splitLeftLabel = 'Đạt chuẩn';
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
            subtitle="Tần suất phân bổ lịch hẹn và tiếp nhận trong ngày"
            items={shiftTelemetry}
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
          columns={columns}
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
