'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAppointments } from '@/store/slices/appointmentSlice';
import { fetchIntakeQueue } from '@/store/slices/intakeSlice';
import { fetchBillingQueue } from '@/store/slices/billingSlice';
import AuthGuard from '@/components/auth/AuthGuard';
import SaaSDashboardShell, {
  SaaSNavItem,
  SaaSTelemetryDotItem,
} from '@/components/layout/SaaSDashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const prefetchedRef = useRef(false);

  const intakeQueuedCount = useAppSelector((state) => state.intake.queuedCount);
  const intakeLoading = useAppSelector((state) => state.intake.loading);
  const fallbackQueuedIntakeCount = useAppSelector(
    (state) => state.intake.records.filter((r) => r.status === 'QUEUED').length
  );
  const queuedIntakeCount = intakeQueuedCount ?? fallbackQueuedIntakeCount;

  const aptActiveCount = useAppSelector((state) => state.appointments.activeCount);
  const aptLoading = useAppSelector((state) => state.appointments.loading);
  const fallbackActiveAptCount = useAppSelector(
    (state) =>
      state.appointments.appointments.filter((a) =>
        ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'].includes(a.status)
      ).length
  );
  const activeAptCount = aptActiveCount ?? fallbackActiveAptCount;

  const billingSummary = useAppSelector((state) => state.billing.summary);
  const billingLoading = useAppSelector((state) => state.billing.loading);
  const pendingBillingCount = billingSummary?.pendingCount || 0;
  const issuedBillingCount = billingSummary?.issuedCount || 0;
  const paidTodayCount = billingSummary?.paidTodayCount || 0;

  useEffect(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    if (intakeQueuedCount === null && !intakeLoading) {
      dispatch(fetchIntakeQueue({}));
    }
    if (aptActiveCount === null && !aptLoading) {
      dispatch(fetchAppointments({}));
    }
    if (!billingSummary && !billingLoading) {
      dispatch(fetchBillingQueue({}));
    }
  }, [
    dispatch,
    intakeQueuedCount,
    intakeLoading,
    aptActiveCount,
    aptLoading,
    billingSummary,
    billingLoading,
  ]);

  const navItems: SaaSNavItem[] = useMemo(
    () => [
      { label: 'Tổng quan', href: '/staff', icon: 'grid_view' },
      { label: 'Điều phối & KPI', href: '/staff/dashboard', icon: 'speed' },
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
          pendingBillingCount + issuedBillingCount > 0
            ? pendingBillingCount + issuedBillingCount
            : undefined,
      },
      { label: 'Quản lý Khách hàng', href: '/staff/customers', icon: 'group' },
    ],
    [activeAptCount, queuedIntakeCount, pendingBillingCount, issuedBillingCount]
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
        value: pendingBillingCount,
        dotColor: '#818cf8',
        href: '/staff/billing',
      },
      {
        label: 'Chờ thu tiền',
        value: issuedBillingCount,
        dotColor: '#f43f5e',
        href: '/staff/billing',
      },
      {
        label: 'Đã thu trong ngày',
        value: paidTodayCount,
        dotColor: '#10b981',
        href: '/staff/billing',
      },
    ],
    [queuedIntakeCount, activeAptCount, pendingBillingCount, issuedBillingCount, paidTodayCount]
  );

  return (
    <SaaSDashboardShell
      roleTitle="Quầy Dịch Vụ"
      roleBadge="LỄ TÂN"
      brandSubtitle="Lễ tân & Thu ngân"
      navSectionTitle="Điều hướng"
      navItems={navItems}
      telemetryTitle="Trạng thái quầy"
      telemetryItems={telemetryItems}
      defaultRoleLabel="Nhân viên Lễ tân"
      defaultInitials="LT"
      searchPlaceholder="Tìm biển số, khách hàng..."
      onGlobalSearch={(q) => router.push(`/staff/intake?search=${encodeURIComponent(q)}`)}
    >
      <AuthGuard>{children}</AuthGuard>
    </SaaSDashboardShell>
  );
}
