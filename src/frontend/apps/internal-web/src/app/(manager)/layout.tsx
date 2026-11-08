'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import AuthGuard from '@/components/auth/AuthGuard';
import SaaSDashboardShell, {
  SaaSNavItem,
  SaaSTelemetryDotItem,
} from '@/components/layout/SaaSDashboardShell';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { items: inventoryItems, categories: partCategories } = useAppSelector(
    (state) => state.inventory
  );

  const lowStockCount = useMemo(
    () => inventoryItems.filter((i) => i.onHand < i.reorderLevel).length,
    [inventoryItems]
  );

  const navItems: SaaSNavItem[] = useMemo(
    () => [
      { label: 'Bảng điều hành', href: '/dashboard', icon: 'grid_view' },
      {
        label: 'Quản lý vật tư',
        icon: 'inventory_2',
        children: [
          {
            label: 'Kho phụ tùng',
            href: '/inventory',
            badge: lowStockCount > 0 ? `${lowStockCount}!` : inventoryItems.length || undefined,
          },
          {
            label: 'Danh mục phụ tùng',
            href: '/part-categories',
            badge: partCategories.length > 0 ? partCategories.length : undefined,
          },
        ],
      },
      { label: 'Báo cáo vận hành', href: '/reports', icon: 'monitoring' },
    ],
    [lowStockCount, inventoryItems.length, partCategories.length]
  );

  const telemetryItems: SaaSTelemetryDotItem[] = useMemo(
    () => [
      {
        label: 'Điều hành xưởng',
        value: 'LIVE',
        dotColor: '#0866ff',
        href: '/dashboard',
      },
      {
        label: 'Mã phụ tùng (SKU)',
        value: inventoryItems.length || '—',
        dotColor: '#38bdf8',
        href: '/inventory',
      },
      {
        label: 'Cảnh báo tồn kho',
        value: lowStockCount,
        dotColor: '#f59e0b',
        href: '/inventory',
      },
      {
        label: 'Nhóm vật tư',
        value: partCategories.length || '—',
        dotColor: '#818cf8',
        href: '/part-categories',
      },
      {
        label: 'Báo cáo doanh thu',
        value: '24/7',
        dotColor: '#10b981',
        href: '/reports',
      },
    ],
    [inventoryItems.length, lowStockCount, partCategories.length]
  );

  return (
    <SaaSDashboardShell
      roleTitle="Quản Lý Dịch Vụ"
      roleBadge="MANAGER"
      brandSubtitle="Service & Warehouse"
      navSectionTitle="Điều hướng"
      navItems={navItems}
      telemetryTitle="Chỉ số Kho & Xưởng"
      telemetryItems={telemetryItems}
      defaultRoleLabel="Quản lý dịch vụ"
      defaultInitials="MG"
      searchPlaceholder="Tìm phiếu RO, mã phụ tùng..."
      onGlobalSearch={(q) => router.push(`/dashboard?search=${encodeURIComponent(q)}`)}
    >
      <AuthGuard>{children}</AuthGuard>
    </SaaSDashboardShell>
  );
}
