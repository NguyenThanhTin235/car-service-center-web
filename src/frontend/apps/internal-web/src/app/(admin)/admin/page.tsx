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

const ADMIN_KPI_VARIANTS: KPICardVariant[] = ['navy', 'royal', 'slate', 'midnight'];

export default function AdminDashboardPage() {
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
    portal: 'admin',
    initialPeriod: '7days',
  });

  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [telemetryTab, setTelemetryTab] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');

  const recentUserColumns = useMemo<TableColumn<any>[]>(() => [
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
  ], []);

  // Phân bổ vai trò người dùng hệ thống theo chuẩn Stage Bars từ dữ liệu API thực tế
  const adminStageBars = useMemo(() => {
    const rbac = data?.charts?.rbacDistribution || [];
    const countMap: Record<string, number> = {};
    rbac.forEach((item: any) => {
      countMap[item.role] = Number(item.count) || 0;
    });

    return [
      { key: 'ADMIN', label: 'Quản trị viên', count: countMap['ADMIN'] ?? 0 },
      { key: 'MANAGER', label: 'Quản lý xưởng', count: countMap['MANAGER'] ?? 0 },
      { key: 'DESK_STAFF', label: 'Lễ tân', count: countMap['DESK STAFF'] ?? countMap['FRONT_DESK'] ?? countMap['DESK_STAFF'] ?? 0 },
      { key: 'SA', label: 'Cố vấn DV', count: countMap['SA'] ?? countMap['ADVISOR'] ?? countMap['SERVICE ADVISOR'] ?? 0 },
      { key: 'TECHNICIAN', label: 'Kỹ thuật viên', count: countMap['TECHNICIAN'] ?? 0, highlight: true },
      { key: 'CUSTOMER', label: 'Khách hàng', count: countMap['CUSTOMER'] ?? 0 },
    ];
  }, [data?.charts?.rbacDistribution]);

  // Tỷ trọng phân bổ nhóm định danh theo trạng thái thực tế từ API (Telemetry Mini-Bars)
  const iamTelemetry = useMemo(() => {
    const totalKpi = Number(data?.kpis?.find((k) => k.key === 'totalUsers')?.value ?? 0);
    const activeKpi = Number(data?.kpis?.find((k) => k.key === 'activeUsers')?.value ?? 0);
    const lockedKpi = Math.max(0, totalKpi - activeKpi);

    const activeRatio = totalKpi > 0 ? activeKpi / totalKpi : 1;
    const lockedRatio = totalKpi > 0 ? lockedKpi / totalKpi : 0;
    const ratio = telemetryTab === 'ACTIVE' ? activeRatio : telemetryTab === 'LOCKED' ? lockedRatio : 1;

    const totalStageCount = adminStageBars.reduce((acc, s) => acc + s.count, 0);
    const denominator = Math.max(1, totalStageCount || totalKpi);

    return adminStageBars.slice(0, 5).map((stage) => {
      const scaledCount = Math.round(stage.count * ratio);
      const pct = totalStageCount > 0 || totalKpi > 0 ? Math.round((scaledCount / denominator) * 100) : 0;
      return {
        label: stage.label,
        count: scaledCount,
        pct,
      };
    });
  }, [adminStageBars, data?.kpis, telemetryTab]);

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
        <div className="flex flex-wrap items-center gap-2.5">
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

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-800">
            <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
            <span>Không thể tải dữ liệu bảng điều hành: {error}</span>
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
          const cardVariant = ADMIN_KPI_VARIANTS[index % ADMIN_KPI_VARIANTS.length];

          const totalUsersVal = Number(data?.kpis?.find((k) => k.key === 'totalUsers')?.value ?? 0);
          const activeUsersVal = Number(data?.kpis?.find((k) => k.key === 'activeUsers')?.value ?? 0);
          const realActiveSplit =
            totalUsersVal > 0
              ? Math.round((activeUsersVal / totalUsersVal) * 100)
              : activeUsersVal > 0
              ? 100
              : 0;

          let splitPercentage = realActiveSplit;
          let splitLeftLabel: string | undefined;
          let splitRightLabel: string | undefined;
          let subtitle: string | undefined;

          if (index === 0) {
            subtitle = 'Phân quyền RBAC & an ninh người dùng';
          } else if (index === 1) {
            splitLeftLabel = 'Khả dụng';
            splitRightLabel = 'Tạm dừng';
            subtitle = 'Tài khoản hoạt động trong hệ thống';
          } else if (index === 2) {
            subtitle = 'Đội ngũ kỹ thuật & điều phối xưởng';
          } else if (index === 3) {
            subtitle = 'Danh mục dịch vụ đang niêm yết';
          }

          return (
            <KPICard
              key={kpi.key}
              label={kpi.label}
              value={kpi.value ?? 0}
              prevValue={kpi.prevValue}
              format={kpi.format}
              unit={kpi.unit}
              trendInverted={kpi.trendInverted}
              isLoading={isLoading}
              variant={cardVariant}
              splitPercentage={splitPercentage}
              splitLeftLabel={splitLeftLabel}
              splitRightLabel={splitRightLabel}
              subtitle={subtitle}
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

      {/* Bento Row: Phân bổ nhân sự theo chức năng & Tỷ trọng định danh */}
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
            title="Tỷ trọng Định danh & Trạng thái IAM"
            subtitle="Tỷ lệ phân bổ tài khoản thực tế theo nhóm vai trò"
            items={iamTelemetry}
            activeTab={telemetryTab}
            onTabChange={(tabId) => setTelemetryTab(tabId as 'ALL' | 'ACTIVE' | 'LOCKED')}
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
      {showUserModal && selectedUserDetail && (
        <UserDetailModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUserDetail(null);
          }}
          userId={selectedUserDetail?.id || null}
          fallbackData={selectedUserDetail}
        />
      )}
    </div>
  );
}
