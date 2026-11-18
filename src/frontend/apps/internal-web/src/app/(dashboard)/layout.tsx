'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import AuthGuard from '@/components/auth/AuthGuard';
import SaaSDashboardShell, {
  SaaSNavItem,
  SaaSTelemetryDotItem,
} from '@/components/layout/SaaSDashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { records: intakeRecords } = useAppSelector((state) => state.intake);
  const { appointments } = useAppSelector((state) => state.appointments);
  const { summary: billingSummary } = useAppSelector((state) => state.billing);

  const queuedIntakeCount = useMemo(
    () => intakeRecords.filter((r) => r.status === 'QUEUED').length,
    [intakeRecords]
  );

  const activeAptCount = useMemo(
    () =>
      appointments.filter((a) =>
        ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'].includes(a.status)
      ).length,
    [appointments]
  );

  const navItems: SaaSNavItem[] = useMemo(
    () => [
      { label: 'Tổng quan', href: '/staff', icon: 'grid_view' },
      {
        label: 'Quản lý lịch hẹn',
        href: '/staff/appointments',
        icon: 'calendar_today',
        badge: activeAptCount > 0 ? activeAptCount : undefined,
      },
      {
        label: 'Tiếp nhận xe',
        href: '/staff/intake',
        icon: 'car_repair',
        badge: queuedIntakeCount > 0 ? queuedIntakeCount : undefined,
        urgent: queuedIntakeCount > 0,
      },
      {
        label: 'Hóa đơn & Thu ngân',
        href: '/staff/billing',
        icon: 'receipt_long',
        badge:
          (billingSummary?.pendingCount || 0) + (billingSummary?.issuedCount || 0) > 0
            ? (billingSummary?.pendingCount || 0) + (billingSummary?.issuedCount || 0)
            : undefined,
      },
      { label: 'Quản lý Khách hàng', href: '/staff/customers', icon: 'group' },
    ],
    [activeAptCount, queuedIntakeCount, billingSummary]
  );

  const telemetryItems: SaaSTelemetryDotItem[] = useMemo(
    () => [
      {
        label: 'Xe chờ tiếp nhận',
        value: queuedIntakeCount,
        dotColor: '#f59e0b',
        href: '/staff/intake',
      },
      {
        label: 'Lịch hẹn chờ đón',
        value: activeAptCount,
        dotColor: '#38bdf8',
        href: '/staff/appointments',
      },
      {
        label: 'Chờ lập hóa đơn',
        value: billingSummary?.pendingCount || 0,
        dotColor: '#818cf8',
        href: '/staff/billing',
      },
      {
        label: 'Chờ thu tiền',
        value: billingSummary?.issuedCount || 0,
        dotColor: '#f43f5e',
        href: '/staff/billing',
      },
      {
        label: 'Đã thu trong ngày',
        value: billingSummary?.paidTodayCount || 0,
        dotColor: '#10b981',
        href: '/staff/billing',
      },
    ],
    [queuedIntakeCount, activeAptCount, billingSummary]
  );

  return (
    <SaaSDashboardShell
      roleTitle="Quầy Dịch Vụ"
      roleBadge="STAFF"
      brandSubtitle="Lễ tân & Thu ngân"
      navSectionTitle="Điều hướng"
      navItems={navItems}
      telemetryTitle="Trạng thái quầy"
      telemetryItems={telemetryItems}
      defaultRoleLabel="Nhân viên Lễ tân"
      defaultInitials="ST"
      searchPlaceholder="Tìm biển số, khách hàng..."
      onGlobalSearch={(q) => router.push(`/staff/intake?search=${encodeURIComponent(q)}`)}
    >
      <AuthGuard>{children}</AuthGuard>
    </SaaSDashboardShell>
  );
}
