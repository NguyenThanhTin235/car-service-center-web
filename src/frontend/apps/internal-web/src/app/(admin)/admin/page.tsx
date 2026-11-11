'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KPICard, KPICardVariant } from '@/components/dashboard/KPICard';
import { DashboardFilterBar } from '@/components/dashboard/DashboardFilterBar';
import { DashboardStageBars } from '@/components/dashboard/DashboardStageBars';
import { DashboardTelemetryMiniBars } from '@/components/dashboard/DashboardTelemetryMiniBars';
import { DashboardActionTable, TableColumn } from '@/components/dashboard/DashboardActionTable';

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
        <Link
          href={`/accounts?search=${encodeURIComponent(row.subtitle)}`}
          className="text-xs font-semibold text-[#0050cd] hover:underline"
        >
          Chi tiết →
        </Link>
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

          let sparklineCallout: string | undefined;
          let splitPercentage = 85;
          let splitLeftLabel: string | undefined;
          let splitRightLabel: string | undefined;
          let subtitle: string | undefined;
          let waveLabels = ['Khởi tạo', 'Xác thực', 'Phân quyền', 'Hoạt động', 'Khóa'];

          if (index === 0) {
            sparklineCallout = `${kpi.value} tài khoản`;
            subtitle = 'Phân quyền RBAC & an ninh người dùng';
          } else if (index === 1) {
            splitPercentage = 100;
            splitLeftLabel = 'Khả dụng';
            splitRightLabel = 'Tạm dừng';
            subtitle = 'Tài khoản hoạt động trong hệ thống';
          } else if (index === 2) {
            sparklineCallout = `${kpi.value} nhân viên`;
            subtitle = 'Đội ngũ kỹ thuật & điều phối xưởng';
          } else if (index === 3) {
            subtitle = 'Danh mục dịch vụ & định mức kỹ thuật';
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
    </div>
  );
}
