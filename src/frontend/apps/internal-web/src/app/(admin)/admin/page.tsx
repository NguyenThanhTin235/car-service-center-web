'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KPICard, KPICardVariant } from '@/components/dashboard/KPICard';
import { DashboardFilterBar } from '@/components/dashboard/DashboardFilterBar';
import { DashboardStageBars } from '@/components/dashboard/DashboardStageBars';
import { DashboardTelemetryMiniBars } from '@/components/dashboard/DashboardTelemetryMiniBars';
import { DashboardActionTable, TableColumn } from '@/components/dashboard/DashboardActionTable';

const UserDetailModal = dynamic(
  () => import('@/components/admin/UserDetailModal'),
  { ssr: false }
);

const PERIOD_DATA_MAP: Record<
  string,
  {
    kpis: {
      totalUsers: { value: number; prevValue: number; badgeText: string; callout: string };
      activeUsers: { value: number; prevValue: number; badgeText: string; splitLeft: number; splitRight: number };
      totalEmployees: { value: number; prevValue: number; badgeText: string; callout: string; heatmapCol: number };
      totalServices: { value: number; prevValue: number; badgeText: string; sla: number; subtitle: string };
    };
    sparklinePoints: number[];
    waveLabels: string[];
    stageDeltas: Record<string, number>;
    telemetryMultiplier: number;
  }
> = {
  today: {
    kpis: {
      totalUsers: { value: 52, prevValue: 50, badgeText: '+4.0%', callout: '+2 mới hôm nay' },
      activeUsers: { value: 48, prevValue: 45, badgeText: '+6.7%', splitLeft: 92, splitRight: 8 },
      totalEmployees: { value: 18, prevValue: 16, badgeText: '18/20 trực ca', callout: '90% quân số', heatmapCol: 2 },
      totalServices: { value: 14, prevValue: 12, badgeText: '100% SLA', sla: 100, subtitle: '14 lượt dịch vụ tiếp nhận hôm nay' },
    },
    sparklinePoints: [32, 40, 44, 49, 52],
    waveLabels: ['08:00', '11:00', '14:00', '17:00', '20:00'],
    stageDeltas: { ADMIN: 2, MANAGER: 2, DESK_STAFF: 3, SA: 4, TECHNICIAN: 18, CUSTOMER: 22 },
    telemetryMultiplier: 0.65,
  },
  '7days': {
    kpis: {
      totalUsers: { value: 52, prevValue: 46, badgeText: '+13.0%', callout: '+6 tuần này' },
      activeUsers: { value: 50, prevValue: 44, badgeText: '+13.6%', splitLeft: 88, splitRight: 12 },
      totalEmployees: { value: 20, prevValue: 19, badgeText: '20 nhân viên', callout: '100% quân số', heatmapCol: 4 },
      totalServices: { value: 48, prevValue: 42, badgeText: '96.5% SLA', sla: 96, subtitle: '48 lượt dịch vụ trong 7 ngày qua' },
    },
    sparklinePoints: [42, 46, 41, 48, 52],
    waveLabels: ['T2', 'T3', 'T4', 'T5', 'T6'],
    stageDeltas: { ADMIN: 2, MANAGER: 2, DESK_STAFF: 4, SA: 4, TECHNICIAN: 20, CUSTOMER: 30 },
    telemetryMultiplier: 1.0,
  },
  '30days': {
    kpis: {
      totalUsers: { value: 52, prevValue: 38, badgeText: '+36.8%', callout: '+14 tháng này' },
      activeUsers: { value: 46, prevValue: 35, badgeText: '+31.4%', splitLeft: 82, splitRight: 18 },
      totalEmployees: { value: 20, prevValue: 18, badgeText: '100% định mức', callout: 'Đầy đủ ca', heatmapCol: 1 },
      totalServices: { value: 186, prevValue: 160, badgeText: '92.4% SLA', sla: 92, subtitle: '186 lượt dịch vụ trong 30 ngày qua' },
    },
    sparklinePoints: [22, 30, 38, 46, 52],
    waveLabels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5'],
    stageDeltas: { ADMIN: 2, MANAGER: 2, DESK_STAFF: 4, SA: 4, TECHNICIAN: 20, CUSTOMER: 48 },
    telemetryMultiplier: 1.8,
  },
  this_month: {
    kpis: {
      totalUsers: { value: 52, prevValue: 43, badgeText: '+20.9%', callout: '+9 trong tháng' },
      activeUsers: { value: 49, prevValue: 40, badgeText: '+22.5%', splitLeft: 90, splitRight: 10 },
      totalEmployees: { value: 20, prevValue: 19, badgeText: '2 ca/ngày', callout: '95% quân số', heatmapCol: 3 },
      totalServices: { value: 142, prevValue: 125, badgeText: '95.8% SLA', sla: 95, subtitle: '142 lượt dịch vụ trong tháng này' },
    },
    sparklinePoints: [28, 35, 42, 48, 52],
    waveLabels: ['Đầu T', 'Tuần 2', 'Giữa T', 'Tuần 4', 'Cuối T'],
    stageDeltas: { ADMIN: 2, MANAGER: 2, DESK_STAFF: 4, SA: 4, TECHNICIAN: 20, CUSTOMER: 38 },
    telemetryMultiplier: 1.35,
  },
};

export default function AdminDashboardPage() {
  const {
    period,
    setPeriod,
    data,
    isLoading,
    isRefreshing,
    lastUpdated,
    refetch,
  } = useDashboardData({
    portal: 'admin',
    initialPeriod: '7days',
  });

  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);

  const recentUserColumns: TableColumn<any>[] = [
    {
      key: 'title',
      label: 'Họ và tên',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{row.title}</div>
          <div className="text-[11px] text-slate-400">{row.subtitle}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái IAM',
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          ></span>
          {row.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
        </span>
      ),
    },
    {
      key: 'timestamp',
      label: 'Ngày khởi tạo',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-slate-500">
          {new Date(row.timestamp).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Thao tác',
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            setSelectedUserDetail(row);
            setShowUserModal(true);
          }}
          className="text-xs font-semibold text-[#0050cd] hover:underline cursor-pointer inline-flex items-center gap-1"
        >
          <span>Chi tiết</span>
          <span className="material-symbols-outlined text-[14px]">visibility</span>
        </button>
      ),
    },
  ];

  // Phân bổ vai trò người dùng hệ thống theo chuẩn Stage Bars (Phong cách SA)
  const adminStageBars = useMemo(() => {
    const rbac = data?.charts?.rbacDistribution || [];
    const countMap: Record<string, number> = {};
    rbac.forEach((item: any) => {
      countMap[item.role] = item.count;
    });

    return [
      { key: 'ADMIN', label: 'Quản trị viên', count: countMap['ADMIN'] || 2 },
      { key: 'MANAGER', label: 'Quản lý xưởng', count: countMap['MANAGER'] || 2 },
      { key: 'DESK_STAFF', label: 'Lễ tân', count: countMap['DESK STAFF'] || countMap['FRONT_DESK'] || 4 },
      { key: 'SA', label: 'Cố vấn DV', count: countMap['SA'] || countMap['ADVISOR'] || 4 },
      { key: 'TECHNICIAN', label: 'Kỹ thuật viên', count: countMap['TECHNICIAN'] || 20, highlight: true },
      { key: 'CUSTOMER', label: 'Khách hàng', count: countMap['CUSTOMER'] || 30 },
    ];
  }, [data?.charts?.rbacDistribution]);

  // Lưu lượng truy cập và phiên làm việc thiết bị (Telemetry Mini-Bars)
  const iamTelemetry = useMemo(() => {
    const totalUsers = Number(data?.kpis?.find((k) => k.key === 'totalUsers')?.value || 50);
    return [
      { label: 'Web Admin', count: Math.round(totalUsers * 0.15), pct: 15 },
      { label: 'Tablet KTV', count: Math.round(totalUsers * 0.4), pct: 40 },
      { label: 'Cố vấn POS', count: Math.round(totalUsers * 0.25), pct: 25 },
      { label: 'App Khách', count: Math.round(totalUsers * 0.8), pct: 80 },
      { label: 'API Gateway', count: Math.max(1, Math.round(totalUsers * 0.05)), pct: 5 },
    ];
  }, [data?.kpis]);

  return (
    <div className="flex flex-col min-w-0 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tổng quan Hệ thống & Phân quyền IAM
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Giám sát tài nguyên người dùng, nhân sự kỹ thuật, danh mục dịch vụ và an ninh hệ thống thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/accounts"
            className="px-3.5 py-2 text-xs font-semibold bg-[#0050cd] hover:bg-blue-700 text-white rounded-xl transition-colors shadow-xs"
          >
            + Quản lý tài khoản
          </Link>
          <Link
            href="/services"
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition-colors"
          >
            Bảng giá dịch vụ
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

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.kpis || []).map((kpi, index) => {
          const variants: KPICardVariant[] = ['navy', 'royal', 'slate', 'midnight'];
          const cardVariant = variants[index % variants.length];
          const periodConf = PERIOD_DATA_MAP[period] || PERIOD_DATA_MAP['7days'];

          let displayVal = kpi.value;
          let prevVal = kpi.prevValue;
          let badgeText: string | undefined;
          let sparklineCallout: string | undefined;
          let splitPercentage = 85;
          let splitLeftLabel: string | undefined;
          let splitRightLabel: string | undefined;
          let subtitle: string | undefined;
          let waveLabels = periodConf.waveLabels;
          let sparklinePoints = periodConf.sparklinePoints;
          let heatmapHighlightCol: number | undefined;
          let slaPercentage: number | undefined;

          if (index === 0) {
            const conf = periodConf.kpis.totalUsers;
            displayVal = kpi.value !== undefined && kpi.value !== null ? kpi.value : conf.value;
            prevVal = kpi.prevValue !== undefined && kpi.prevValue !== null ? kpi.prevValue : conf.prevValue;
            badgeText = conf.badgeText;
            sparklineCallout = conf.callout;
            subtitle = 'Phân quyền RBAC & an ninh người dùng';
          } else if (index === 1) {
            const conf = periodConf.kpis.activeUsers;
            displayVal = kpi.value !== undefined && kpi.value !== null ? kpi.value : conf.value;
            prevVal = kpi.prevValue !== undefined && kpi.prevValue !== null ? kpi.prevValue : conf.prevValue;
            badgeText = conf.badgeText;
            splitPercentage = conf.splitLeft;
            splitLeftLabel = 'Khả dụng';
            splitRightLabel = 'Tạm dừng';
            subtitle = 'Tài khoản hoạt động trong hệ thống';
          } else if (index === 2) {
            const conf = periodConf.kpis.totalEmployees;
            displayVal = kpi.value !== undefined && kpi.value !== null ? kpi.value : conf.value;
            prevVal = kpi.prevValue !== undefined && kpi.prevValue !== null ? kpi.prevValue : conf.prevValue;
            badgeText = conf.badgeText;
            sparklineCallout = conf.callout;
            heatmapHighlightCol = conf.heatmapCol;
            subtitle = 'Đội ngũ kỹ thuật & điều phối xưởng';
          } else if (index === 3) {
            const conf = periodConf.kpis.totalServices;
            displayVal = kpi.value !== undefined && kpi.value !== null ? kpi.value : conf.value;
            prevVal = kpi.prevValue !== undefined && kpi.prevValue !== null ? kpi.prevValue : conf.prevValue;
            badgeText = conf.badgeText;
            slaPercentage = conf.sla;
            subtitle = conf.subtitle;
          }

          return (
            <KPICard
              key={kpi.key}
              label={kpi.label}
              value={displayVal}
              prevValue={prevVal}
              format={kpi.format}
              unit={kpi.unit}
              trendInverted={kpi.trendInverted}
              isLoading={isLoading}
              variant={cardVariant}
              sparklineCallout={sparklineCallout}
              sparklinePoints={sparklinePoints}
              heatmapHighlightCol={heatmapHighlightCol}
              slaPercentage={slaPercentage}
              splitPercentage={splitPercentage}
              splitLeftLabel={splitLeftLabel}
              splitRightLabel={splitRightLabel}
              badgeText={badgeText}
              subtitle={subtitle}
              waveLabels={waveLabels}
              icon={
                kpi.key === 'totalUsers'
                  ? 'group'
                  : kpi.key === 'activeUsers'
                  ? 'verified_user'
                  : kpi.key === 'totalEmployees'
                  ? 'engineering'
                  : 'build_circle'
              }
            />
          );
        })}
      </div>

      {/* Bento Row: Phân bổ nhân sự theo chức năng & Lưu lượng truy cập thiết bị (Phong cách SA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <DashboardStageBars
            title="Phân bổ người dùng theo vai trò & quyền hạn (IAM Stages)"
            subtitle="Mật độ tài khoản theo từng cấp độ vận hành trong hệ thống quản lý trung tâm"
            stages={adminStageBars}
            highlightTooltipTitle="Lực lượng kỹ thuật"
            highlightTooltipPrimaryText={`Thực tế: ${adminStageBars.find((s) => s.highlight)?.count || 0} kỹ thuật viên`}
            highlightTooltipSecondaryText="Chiếm tỷ trọng chính tại xưởng"
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-4">
          <DashboardTelemetryMiniBars
            title="Lưu lượng thiết bị & Phiên làm việc"
            subtitle="Tỷ lệ phân bổ truy cập hệ thống theo nền tảng"
            items={iamTelemetry}
            tabs={[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Khả dụng' },
              { id: 'LOCKED', label: 'Tạm khóa' },
            ]}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Recent Users Table */}
      <DashboardActionTable
        title="Nhật ký tài khoản người dùng mới nhất"
        subtitle="Danh sách các tài khoản vừa được cấp quyền hoặc đăng ký vào hệ thống"
        columns={recentUserColumns}
        data={data?.actionableList || []}
        searchPlaceholder="Tìm theo tên hoặc email..."
        searchFilterKey="title"
        pageSize={5}
        isLoading={isLoading}
        emptyMessage="Không có tài khoản nào được tạo trong thời gian này"
      />

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUserDetail(null);
        }}
        userId={selectedUserDetail?.id || null}
        fallbackData={selectedUserDetail}
      />
    </div>
  );
}
