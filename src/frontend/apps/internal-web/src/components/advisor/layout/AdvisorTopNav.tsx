'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/components/shared/LogoutButton';
import NotificationBell from '@/components/notifications/NotificationBell';
import UserAvatarMenu from '@/components/layout/UserAvatarMenu';
import toast from 'react-hot-toast';

export interface NavItemConfig {
  name: string;
  shortName: string;
  href: string;
  icon: string;
  comingSoon?: boolean;
}

export const SA_NAV_ITEMS: NavItemConfig[] = [
  { name: 'Trang chủ', shortName: 'Trang chủ', href: '/advisor', icon: 'space_dashboard' },
  { name: 'Danh sách xe đang chờ', shortName: 'Hàng chờ', href: '/advisor/intake-queue', icon: 'directions_car' },
  { name: 'Phiếu công việc', shortName: 'Phiếu CV', href: '/advisor/work-orders', icon: 'assignment' },
  { name: 'Khách hàng', shortName: 'Khách hàng', href: '/advisor/customers', icon: 'group', comingSoon: true },
  { name: 'Phân tích & KPI', shortName: 'Phân tích', href: '/advisor/dashboard', icon: 'monitoring' },
];

export default function AdvisorTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [quickSearch, setQuickSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const isItemActive = (item: NavItemConfig) => {
    if (item.href === '/advisor') return pathname === '/advisor';
    if (item.href === '/advisor/work-orders') {
      return pathname.startsWith('/advisor/work-order');
    }
    return pathname.startsWith(item.href);
  };

  const handleNavClick = (e: React.MouseEvent, item: NavItemConfig) => {
    if (item.comingSoon) {
      e.preventDefault();
      toast(`Phân hệ "${item.name}" đang được hoàn thiện cho kỳ phát hành tiếp theo.`, {
        icon: 'ℹ️',
      });
    }
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) {
      router.push('/advisor/work-orders');
      return;
    }
    router.push(`/advisor/work-orders?search=${encodeURIComponent(quickSearch.trim())}`);
  };

  return (
    <>
      {/* 1. LEFT VERTICAL ICON RAIL (Tablet & Desktop >= 768px) — Matches Uploaded Reference UI */}
      <aside
        data-testid="sa-icon-rail"
        aria-label="Điều hướng chính Cố vấn dịch vụ"
        className="hidden md:flex fixed top-0 left-0 bottom-0 w-[76px] z-40 flex-col items-center justify-between py-5 px-2 select-none"
      >
        {/* Top Brand Icon Pill */}
        <Link
          href="/advisor"
          title="AutoCare Pro — Cố vấn dịch vụ"
          className="w-12 h-12 rounded-2xl bg-[#0050cd] hover:bg-[#0866ff] text-white flex items-center justify-center shadow-md shadow-[#0050cd]/25 transition-all active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
        >
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">directions_car</span>
        </Link>

        {/* Center 5-Tab Navigation Pill */}
        <nav className="bg-white rounded-[26px] p-1.5 shadow-sm border border-slate-200/80 flex flex-col items-center gap-2">
          {SA_NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.href}
                href={item.comingSoon ? '#' : item.href}
                onClick={(e) => handleNavClick(e, item)}
                title={item.comingSoon ? `${item.name} (Sắp ra mắt)` : item.name}
                aria-label={item.name}
                className={`group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40 ${
                  active
                    ? 'bg-[#0c2340] text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                {active && (
                  <span className="absolute -left-1.5 w-1 h-5 rounded-r-full bg-[#0050cd]" />
                )}
                <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
                {item.comingSoon && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 absolute top-2 right-2" />
                )}

                {/* Floating Tooltip on Hover */}
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#0c2340] text-white text-xs font-semibold whitespace-nowrap shadow-lg z-50">
                  {item.name}
                  {item.comingSoon ? ' • Sắp mở' : ''}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Utility & Logout Pill */}
        <div className="bg-white rounded-[24px] p-1.5 shadow-sm border border-slate-200/80 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => toast('Trung tâm trợ giúp Cố vấn dịch vụ AutoCare Pro v2.4', { icon: '🛠️' })}
            title="Hỗ trợ vận hành"
            aria-label="Hỗ trợ vận hành"
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>

          <LogoutButton
            iconOnly={true}
            className="w-11 h-11 rounded-2xl justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
          />
        </div>
      </aside>

      {/* 2. TOP MINIMALIST HEADER — Matches Uploaded Reference UI */}
      <header className="sticky top-0 z-30 md:ml-[76px] px-3 sm:px-5 lg:px-6 pt-4 pb-2 bg-[#f2f4f8]/90 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
          {/* Left: Brand Title & Active Section */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Brand Icon (<768px) */}
            <Link
              href="/advisor"
              className="md:hidden w-11 h-11 rounded-2xl bg-[#0050cd] text-white flex items-center justify-center shadow-sm shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
            >
              <span className="material-symbols-outlined text-[22px]">directions_car</span>
            </Link>

            <div className="leading-tight min-w-0">
              <div className="text-base font-bold text-zinc-900 tracking-[-0.02em] truncate">
                AutoCare Pro
              </div>
              <div className="text-xs font-medium text-slate-500 truncate">
                Service Advisor
              </div>
            </div>
          </div>

          {/* Right: Pill Controls (Shift Badge, Search, Notification with Dark Counter, User Avatar) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Shift Status Pill (like the currency/region pill in reference image) */}
            <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200/80 rounded-full px-3.5 py-2 shadow-2xs text-xs font-bold text-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>VN • Ca trực</span>
            </div>

            {/* Expandable Quick Search Pill */}
            <form onSubmit={handleQuickSearchSubmit} className="relative flex items-center">
              {searchOpen ? (
                <div className="flex items-center bg-white border border-[#0050cd] rounded-full pl-3.5 pr-1.5 py-1 shadow-xs transition-all">
                  <span className="material-symbols-outlined text-[18px] text-[#0050cd] mr-1.5">search</span>
                  <input
                    type="text"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    placeholder="Biển số, mã WO, khách..."
                    autoFocus
                    className="w-44 sm:w-56 md:w-64 text-xs font-medium text-zinc-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setQuickSearch('');
                    }}
                    className="w-9 h-9 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-slate-400 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
                    title="Đóng tìm kiếm"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  title="Tìm nhanh biển số hoặc phiếu công việc"
                  aria-label="Tìm nhanh"
                  className="w-11 h-11 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-zinc-700 shadow-2xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
                >
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </button>
              )}
            </form>

            {/* Real-time Notification Bell Pill */}
            <NotificationBell variant="pill" />

            {/* User Avatar Pill & Dropdown */}
            <UserAvatarMenu
              variant="pill"
              defaultRoleLabel="Cố vấn dịch vụ"
              defaultInitials="SA"
              extraLinks={[
                { href: '/advisor/intake-queue', label: 'Hàng đợi tiếp nhận', icon: 'directions_car' },
                { href: '/advisor/work-orders', label: 'Danh sách Phiếu công việc', icon: 'assignment' },
              ]}
            />
          </div>
        </div>
      </header>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (< 768px) — Touch-friendly 44x44px targets */}
      <nav
        aria-label="Điều hướng di động"
        className="md:hidden fixed bottom-0 left-0 right-0 min-h-16 pt-1 pb-[env(safe-area-inset-bottom)] bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 flex items-center justify-around px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
      >
        {SA_NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          return (
            <Link
              key={item.href}
              href={item.comingSoon ? '#' : item.href}
              onClick={(e) => handleNavClick(e, item)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-2 py-1 rounded-2xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40 ${
                active ? 'text-[#0050cd] font-bold' : 'text-slate-500 hover:text-zinc-900 font-medium'
              }`}
            >
              <span
                className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                  active ? 'bg-[#0050cd] text-white shadow-xs' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
              </span>
              <span className="text-[11px] mt-0.5 leading-tight truncate max-w-[64px]">
                {item.shortName}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
