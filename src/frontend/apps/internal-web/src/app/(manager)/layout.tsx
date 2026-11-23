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
  const inventoryItemsCount = useAppSelector((state) => state.inventory.items.length);
  const partCategoriesCount = useAppSelector((state) => state.inventory.categories.length);
  const lowStockCount = useAppSelector(
    (state) => state.inventory.items.filter((i) => i.onHand < i.reorderLevel).length
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
            badge: lowStockCount > 0 ? `${lowStockCount}!` : inventoryItemsCount || undefined,
          },
          {
            label: 'Danh mục phụ tùng',
            href: '/part-categories',
            badge: partCategoriesCount > 0 ? partCategoriesCount : undefined,
          },
        ],
      },
      { label: 'Báo cáo vận hành', href: '/reports', icon: 'monitoring' },
    ],
    [lowStockCount, inventoryItemsCount, partCategoriesCount]
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
        value: inventoryItemsCount || '—',
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
        value: partCategoriesCount || '—',
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
    [inventoryItemsCount, lowStockCount, partCategoriesCount]
  );

  return (
    <SaaSDashboardShell
      roleTitle="Quản Lý Dịch Vụ"
      roleBadge="QUẢN LÝ"
      brandSubtitle="Điều hành xưởng & Kho vật tư"
      navSectionTitle="Điều hướng"
      navItems={navItems}
      telemetryTitle="Chỉ số Kho & Xưởng"
      telemetryItems={telemetryItems}
      defaultRoleLabel="Quản lý dịch vụ"
      defaultInitials="QL"
      searchPlaceholder="Tìm phiếu RO, mã phụ tùng..."
      onGlobalSearch={(q) => router.push(`/dashboard?search=${encodeURIComponent(q)}`)}
    >
      <AuthGuard>{children}</AuthGuard>
    </SaaSDashboardShell>
  );
}
