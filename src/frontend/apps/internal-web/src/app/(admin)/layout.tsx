'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import SaaSDashboardShell, {
  SaaSNavItem,
  SaaSTelemetryDotItem,
} from '@/components/layout/SaaSDashboardShell';

const ADMIN_NAV_ITEMS: SaaSNavItem[] = [
  {
    label: 'Tổng quan hệ thống',
    href: '/admin',
    icon: 'dashboard',
  },
  {
    label: 'Tài khoản & Phân quyền',
    href: '/accounts',
    icon: 'manage_accounts',
  },
  {
    label: 'Hồ sơ Nhân viên',
    href: '/employees',
    icon: 'engineering',
  },
  {
    label: 'Quản lý Dịch vụ',
    icon: 'build_circle',
    children: [
      { label: 'Dịch vụ', href: '/services' },
      { label: 'Danh mục dịch vụ', href: '/service-categories' },
    ],
  },
  {
    label: 'Loại công việc',
    href: '/job-types',
    icon: 'work',
  },
  {
    label: 'Danh mục chung',
    href: '/catalogs',
    icon: 'category',
  },
];

const ADMIN_TELEMETRY_ITEMS: SaaSTelemetryDotItem[] = [
  {
    label: 'Định danh IAM',
    value: 'RBAC',
    dotColor: '#0866ff',
    href: '/accounts',
  },
  {
    label: 'Nhân sự kỹ thuật',
    value: 'HR',
    dotColor: '#38bdf8',
    href: '/employees',
  },
  {
    label: 'Bảng giá dịch vụ',
    value: '3 cỡ xe',
    dotColor: '#10b981',
    href: '/services',
  },
  {
    label: 'Chuẩn công việc',
    value: 'SLA',
    dotColor: '#f59e0b',
    href: '/job-types',
  },
  {
    label: 'Server Uptime',
    value: '99.9%',
    dotColor: '#818cf8',
    href: '/catalogs',
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <SaaSDashboardShell
      roleTitle="Quản Trị Viên"
      roleBadge="QUẢN TRỊ"
      brandSubtitle="Phân quyền & Danh mục gốc"
      navSectionTitle="Phân hệ quản trị"
      navItems={ADMIN_NAV_ITEMS}
      telemetryTitle="Trạng thái hạ tầng"
      telemetryItems={ADMIN_TELEMETRY_ITEMS}
      defaultRoleLabel="Quản trị viên"
      defaultInitials="QT"
      searchPlaceholder="Tìm chức năng quản trị..."
      onGlobalSearch={(q) => router.push(`/accounts?search=${encodeURIComponent(q)}`)}
    >
      <AuthGuard>{children}</AuthGuard>
    </SaaSDashboardShell>
  );
}
