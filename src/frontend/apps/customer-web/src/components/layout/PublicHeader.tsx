'use client';

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import LogoutButton from '@/components/shared/LogoutButton';
import { getDashboardPathByRole } from '@/utils/roleRedirect';

export default function PublicHeader() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-surface-container-lowest shadow-sm border-b border-surface-container-highest">
      <div className="w-full max-w-container-max mx-auto px-gutter-desktop flex items-center justify-between h-full">
        {/* Logo & Brand identity */}
        <div className="flex items-center gap-8">
          <Link className="flex items-center gap-2.5 text-on-surface" href="/">
            <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-2xl" data-icon="directions_car">directions_car</span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">Car Service Center</span>
          </Link>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 pt-4">
            <Link className="text-primary-container font-label-lg text-label-lg border-b-2 border-primary-container pb-4 active:scale-[0.98] transition-transform duration-150 ease-out" href="/">Trang chủ</Link>
            <a className="text-on-surface-variant font-label-lg text-label-lg pb-4 hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150" href="/#services">Dịch vụ</a>
            <a className="text-on-surface-variant font-label-lg text-label-lg pb-4 hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150" href="/#contact">Liên hệ</a>
          </nav>
        </div>

        {/* Trailing Action Controls */}
        <div className="flex items-center gap-4">
          <Link className="hidden sm:inline-flex items-center justify-center px-4 py-2 bg-primary-container text-on-primary-container font-label-lg text-label-lg rounded-lg shadow-sm hover:opacity-95 transition-all duration-150 active:scale-[0.98]" href="/login">
            Đặt lịch ngay
          </Link>
          
          {/* User Profile Pill or Login */}
          <div className="flex items-center gap-3 pl-2 sm:border-l border-surface-container-highest">
            {!mounted ? (
              <div className="w-24 h-9 bg-surface-container-low animate-pulse rounded-lg"></div>
            ) : isAuthenticated && user ? (
              <>
                <div className="relative flex items-center">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container-low transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container font-bold text-sm border border-outline-variant shadow-sm relative">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary ring-2 ring-surface-container-lowest"></span>
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="font-label-md text-label-md text-on-surface">{user.fullName || 'Tài khoản'}</span>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant hidden lg:block" style={{ fontSize: '18px' }}>
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {profileOpen && (
                    <div className="absolute top-full right-0 mt-1 w-52 bg-surface-container-lowest border border-surface-container-highest rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                      <div className="px-4 py-3 border-b border-surface-container-high">
                        <p className="text-sm font-semibold text-on-surface truncate">{user.fullName || 'Tài khoản'}</p>
                        <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                      </div>
                      <Link
                        href={user?.roles?.includes('CUSTOMER') ? '/customer/profile' : getDashboardPathByRole(user?.roles || [])}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>manage_accounts</span>
                        Hồ sơ của tôi
                      </Link>
                      <div className="px-4 py-2 hover:bg-red-50 cursor-pointer text-red-600 transition-colors">
                        <LogoutButton iconOnly={false} className="w-full text-left" />
                      </div>
                    </div>
                  )}
                  {/* Backdrop for profile dropdown */}
                  {profileOpen && (
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-primary-container hover:underline transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-surface-container-low text-on-surface px-4 py-2 rounded-lg hover:bg-surface-container-highest transition-colors shadow-sm border border-surface-container-highest"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
