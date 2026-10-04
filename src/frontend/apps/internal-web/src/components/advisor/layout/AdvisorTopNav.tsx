'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/components/shared/LogoutButton';

export default function AdvisorTopNav() {
  const { user } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: 'Trang chủ', href: '/advisor' },
    { name: 'Danh sách xe đang chờ', href: '/advisor/intake-queue' },
    { name: 'Phiếu công việc', href: '/advisor/work-orders' },
    { name: 'Khách hàng', href: '/advisor/customers' },
    { name: 'Báo cáo', href: '/advisor/reports' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-[56px] z-30 bg-primary text-on-primary shadow-md flex items-center justify-between px-4">
      {/* Left: Brand & Navigation */}
      <div className="flex items-center gap-6 h-full">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px]">directions_car</span>
          <span className="text-title-md font-bold tracking-tight">AutoCare ERP</span>
        </div>

        {/* Navigation Menu */}
        <nav className="hidden md:flex h-full items-center">
          {navItems.map((item) => {
            // Precise active logic
            const isActive = pathname === item.href || 
              (item.href !== '/advisor' && pathname.startsWith(item.href)) || 
              (item.href === '/advisor/work-orders' && pathname.startsWith('/advisor/work-order'));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`h-full px-4 flex items-center text-label-md font-semibold transition-colors border-b-4 ${
                  isActive
                    ? 'border-white text-white bg-white/10'
                    : 'border-transparent text-primary-fixed-dim hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Search, Actions, Avatar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden lg:block w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline-variant">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>
          <input
            className="w-full h-8 pl-9 pr-3 bg-white/10 border border-white/20 rounded text-body-sm font-body-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20 focus:border-white transition-all"
            placeholder="Tìm biển số, tên KH, SĐT..."
            type="text"
          />
        </div>

        {/* Notifications */}
        <button
          className="relative p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Thông báo"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full"></span>
        </button>
        
        <div className="w-px h-6 bg-white/20 mx-1"></div>

        {/* User Profile */}
        <div className="relative">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors"
            onClick={() => {
              const dropdown = document.getElementById('user-dropdown');
              if (dropdown) dropdown.classList.toggle('hidden');
            }}
          >
            <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-sm border border-white/20 overflow-hidden">
              <span className="material-symbols-outlined text-[16px]">person</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <span className="text-label-sm font-label-sm font-semibold text-white leading-tight">
                {mounted ? (user?.fullName || 'Người dùng') : 'Người dùng'}
              </span>
              <span className="material-symbols-outlined text-[18px] text-white/70">arrow_drop_down</span>
            </div>
          </div>
          
          {/* Dropdown Menu */}
          <div id="user-dropdown" className="hidden absolute right-0 top-full mt-2 w-48 bg-surface text-on-surface rounded-lg shadow-lg border border-outline-variant/50 py-1 z-50">
            <div className="px-4 py-2 border-b border-outline-variant/30">
              <p className="text-label-sm font-semibold truncate">{mounted ? (user?.fullName || 'Người dùng') : 'Người dùng'}</p>
              <p className="text-body-sm text-on-surface-variant truncate">{mounted ? (user?.email || 'advisor@autocare.vn') : 'advisor@autocare.vn'}</p>
            </div>
            <div className="py-1">
              <button className="w-full text-left px-4 py-2 text-body-md hover:bg-surface-container flex items-center gap-2 text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                Tài khoản
              </button>
            </div>
            <div className="py-1 border-t border-outline-variant/30">
              <LogoutButton className="w-full text-left px-4 py-2 text-body-md hover:bg-error-container hover:text-error flex items-center gap-2 text-error transition-colors font-medium" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
