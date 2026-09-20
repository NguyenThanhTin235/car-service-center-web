'use client';

import { useAppSelector } from '@/store';
import { usePathname } from 'next/navigation';

export default function TopNavBar() {
  const { user } = useAppSelector((state) => state.auth);
  const pathname = usePathname();

  let pageName = 'Tổng quan';
  if (pathname.includes('/customers')) pageName = 'Quản lý Khách hàng';
  else if (pathname.includes('/appointments')) pageName = 'Quản lý lịch hẹn';
  else if (pathname.includes('/intake')) pageName = 'Tiếp nhận xe';
  else if (pathname.includes('/billing')) pageName = 'Báo giá & Hóa đơn';

  return (
    <header className="fixed top-0 right-0 left-64 h-[68px] z-30 bg-surface-container-lowest dark:bg-inverse-surface border-b border-outline-variant dark:border-outline shadow-sm flex items-center justify-between px-6">
      {/* Left: Page Context & Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
          title="Thu gọn Sidebar"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">menu_open</span>
        </button>

        {/* Breadcrumbs */}
        <div className="hidden lg:flex items-center gap-1 text-label-md font-label-md text-on-surface-variant whitespace-nowrap">
          <span>Bảng điều khiển</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-semibold">{pageName}</span>
        </div>

        {/* Universal Search Field */}
        <div className="relative w-full max-w-md ml-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>
          <input
            className="w-full h-9 pl-9 pr-14 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
            placeholder="Tìm biển số, tên KH, SĐT, số RO... (Ctrl + K)"
            type="text"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
            <kbd className="text-label-sm font-label-sm font-code-mono bg-surface-container-lowest border border-outline-variant px-1.5 py-0.5 rounded text-outline shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Quick Actions, Alerts, Advisor Profile */}
      <div className="flex items-center gap-3">
        <button
          className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
          title="Thông báo xưởng"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-on-error font-label-sm text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface-container-lowest">
            3
          </span>
        </button>

        {/* User Profile Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-outline-variant">
          <div className="relative w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-md border border-outline-variant overflow-hidden">
            {/* Fallback avatar if needed */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary-container ring-1.5 ring-surface-container-lowest z-10"></span>
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-label-md font-label-md font-semibold text-on-surface leading-tight">
              {user?.fullName || 'Người dùng'}
            </span>
            <span className="text-label-sm font-label-sm text-on-surface-variant">
              {user?.roles?.[0] || 'Nhân viên'}
            </span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant hidden md:block">
            expand_more
          </span>
        </div>
      </div>
    </header>
  );
}
