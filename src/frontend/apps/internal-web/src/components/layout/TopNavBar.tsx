'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { usePathname } from 'next/navigation';

const ROLE_NAME_MAP: Record<string, string> = {
  STAFF: 'Nhân viên Lễ tân',
  RECEPTIONIST: 'Nhân viên Lễ tân',
  ADVISOR: 'Cố vấn Dịch vụ',
  TECHNICIAN: 'Kỹ thuật viên',
  MANAGER: 'Quản lý Xưởng',
  ADMIN: 'Quản trị viên',
  CASHIER: 'Thu ngân',
};

export default function TopNavBar() {
  const { user } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  let pageName = 'Tổng quan';
  if (pathname.includes('/customers')) pageName = 'Quản lý Khách hàng';
  else if (pathname.includes('/appointments')) pageName = 'Quản lý lịch hẹn';
  else if (pathname.includes('/intake-inspection')) pageName = 'Tiếp nhận & Kiểm tra';
  else if (pathname.includes('/intake')) pageName = 'Tiếp nhận xe';
  else if (pathname.includes('/billing')) pageName = 'Hóa đơn & Thu ngân';
  else if (pathname.includes('/qc-record')) pageName = 'Thực hiện QC';
  else if (pathname.includes('/qc-history')) pageName = 'Lịch sử QC';
  else if (pathname.includes('/job-dispatch')) pageName = 'Kế hoạch công việc';
  else if (pathname.includes('/quotation')) pageName = 'Báo giá';
  else if (pathname.includes('/release-vehicle')) pageName = 'Thực hiện & Bàn giao';
  else if (pathname === '/advisor') pageName = 'Hàng chờ tiếp nhận';
  else if (pathname.includes('/accounts')) pageName = 'Tài khoản & Phân quyền';
  else if (pathname.includes('/employees')) pageName = 'Hồ sơ Nhân viên';
  else if (pathname.includes('/service-categories')) pageName = 'Danh mục Dịch vụ';
  else if (pathname.includes('/services')) pageName = 'Quản lý Dịch vụ';
  else if (pathname.includes('/job-types')) pageName = 'Loại công việc';
  else if (pathname.includes('/catalogs')) pageName = 'Danh mục chung';
  else if (pathname.includes('/inventory')) pageName = 'Quản lý Kho phụ tùng';
  else if (pathname.includes('/part-categories')) pageName = 'Danh mục phụ tùng';
  else if (pathname.includes('/reports')) pageName = 'Báo cáo vận hành';
  else if (pathname.includes('/dashboard')) pageName = 'Bảng điều hành xưởng';

  const userRole = user?.roles?.[0];
  const roleDisplay = userRole ? (ROLE_NAME_MAP[userRole] || userRole) : 'Nhân viên';

  return (
    <header className="fixed top-0 right-0 left-64 h-[68px] z-30 bg-white border-b border-slate-200/90 shadow-2xs flex items-center justify-between px-6">
      {/* Left: Page Context & Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Thu gọn Menu"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">menu_open</span>
        </button>

        {/* Breadcrumbs */}
        <div className="hidden lg:flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
          <span>Quầy Dịch Vụ</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-slate-900 font-bold">{pageName}</span>
        </div>

        {/* Universal Search Field */}
        <div className="relative w-full max-w-md ml-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>
          <input
            className="w-full h-9 pl-9 pr-14 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] transition-all"
            placeholder="Tìm biển số, khách hàng, mã lệnh... (Ctrl + K)"
            type="text"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
            <kbd className="text-[11px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Quick Actions, Alerts, Advisor Profile */}
      <div className="flex items-center gap-3">
        <button
          className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Thông báo xưởng"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            3
          </span>
        </button>

        {/* User Profile Card */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0050cd] to-[#0866ff] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {mounted ? (user?.fullName || user?.email || 'Nhân viên Lễ tân') : 'Nhân viên Lễ tân'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {mounted ? roleDisplay : 'Nhân viên'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
