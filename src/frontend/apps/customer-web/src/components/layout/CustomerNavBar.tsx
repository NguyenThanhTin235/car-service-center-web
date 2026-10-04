'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import api from '@/lib/axios';
import ConfirmModal from '@/components/shared/ConfirmModal';

const navLinks = [
  { href: '/customer', label: 'Tổng quan', icon: 'home' },
  { href: '/customer/vehicles', label: 'Xe của tôi', icon: 'directions_car' },
  { href: '/customer/appointments', label: 'Đặt lịch', icon: 'calendar_today' },
  { href: '/customer/profile', label: 'Hồ sơ cá nhân', icon: 'account_circle' },
];

export default function CustomerNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const requestLogout = () => {
    setConfirmLogout(true);
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore errors
    } finally {
      dispatch(logout());
      setTimeout(() => router.replace('/login'), 50);
      setLogoutLoading(false);
      setConfirmLogout(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/customer') return pathname === '/customer';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* TOP APP BAR */}
      <header className="sticky top-0 z-50 h-16 w-full bg-surface-container-lowest border-b border-surface-container-highest shadow-sm">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 flex items-center justify-between h-full gap-4">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>directions_car</span>
            </div>
            <span className="font-bold text-on-surface tracking-tight whitespace-nowrap text-base hidden sm:block">
              Car Service Center
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center h-full gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(link.href)
                    ? 'bg-primary-fixed text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: isActive(link.href) ? "'FILL' 1" : "'FILL' 0" }}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Notification + Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* CTA Đặt lịch */}
            <Link
              href="/customer/appointments"
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
            >
              Đặt lịch ngay
            </Link>

            {/* Notification */}
            <button className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors" title="Thông báo">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>notifications</span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative flex items-center pl-2 border-l border-surface-container-highest gap-2">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm border border-outline-variant">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-on-surface leading-tight">
                    {mounted ? (user?.fullName || 'Khách hàng') : 'Khách hàng'}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">Thành viên</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant hidden xl:block" style={{ fontSize: '16px' }}>
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-surface-container-lowest border border-surface-container-highest rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                  <div className="px-4 py-3 border-b border-surface-container-high">
                    <p className="text-sm font-semibold text-on-surface truncate">{mounted ? (user?.fullName || 'Khách hàng') : ''}</p>
                    <p className="text-xs text-on-surface-variant truncate">{mounted ? user?.email : ''}</p>
                  </div>
                  <Link
                    href="/customer/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>manage_accounts</span>
                    Hồ sơ cá nhân
                  </Link>
                  <button
                    onClick={requestLogout}
                    disabled={logoutLoading}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors"
                  >
                    {logoutLoading ? (
                      <div className="w-4 h-4 border-2 border-error border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                    )}
                    {logoutLoading ? 'Đang đăng xuất...' : 'Đăng xuất'}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                {mobileOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-surface-container-lowest border-b border-surface-container-highest shadow-lg z-40 py-2 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  isActive(link.href)
                    ? 'bg-primary-fixed text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: isActive(link.href) ? "'FILL' 1" : "'FILL' 0" }}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
            <div className="mt-2 pt-2 border-t border-surface-container-high">
              <button
                onClick={requestLogout}
                className="flex items-center gap-3 px-3 py-3 text-sm text-error w-full text-left"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Backdrop for profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}

      {/* Logout Confirmation */}
      <ConfirmModal
        isOpen={confirmLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?"
        confirmText="Đăng xuất"
        isDanger={true}
        loading={logoutLoading}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
