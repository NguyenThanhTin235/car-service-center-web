'use client';

import React, { useMemo, useCallback } from 'react';
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
  const allItems = useAppSelector((state) => state.inventory.allItems);
  const items = useAppSelector((state) => state.inventory.items);
  const partCategoriesCount = useAppSelector((state) => state.inventory.categories.length);
  const lowStockCount = useMemo(() => {
    const src = allItems && allItems.length > 0 ? allItems : items;
    return src.filter((i) => i.isActive !== false && i.onHand <= i.reorderLevel).length;
  }, [allItems, items]);
  const handleGlobalSearch = useCallback(
    (q: string) => router.push(`/dashboard?search=${encodeURIComponent(q)}`),
    [router]
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
        value: 'Trực tuyến',
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
        value: 'Theo kỳ',
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
      onGlobalSearch={handleGlobalSearch}
    >
      <AuthGuard>{children}</AuthGuard>
    </SaaSDashboardShell>
  );
}
