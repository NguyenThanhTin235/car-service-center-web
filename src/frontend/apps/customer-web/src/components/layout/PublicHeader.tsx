'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import LogoutButton from '@/components/shared/LogoutButton';
import { getDashboardPathByRole } from '@/utils/roleRedirect';

const NotificationBell = dynamic(
  () => import('@/components/notifications/NotificationBell'),
  { ssr: false }
);

const PUBLIC_NAV_LINKS = [
  { href: '/home', label: 'Trang chủ', sectionId: 'top' },
  { href: '/home#services', label: 'Dịch vụ', sectionId: 'services' },
  { href: '/home#process', label: 'Quy trình', sectionId: 'process' },
  { href: '/home#contact', label: 'Liên hệ', sectionId: 'contact' },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    setMobileMenuOpen(false);
    if (pathname !== '/home' && pathname !== '/') return;

    e.preventDefault();
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState(null, '', '/home');
      return;
    }

    const target = document.getElementById(sectionId);
    if (target) {
      const headerOffset = 64;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      window.history.replaceState(null, '', `/home#${sectionId}`);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!profileOpen && !mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileOpen, mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  const isCustomer = Boolean(user?.roles?.includes('CUSTOMER'));
  const bookingHref = mounted && isAuthenticated ? '/customer/profile?tab=appointments' : '/login';
  const profileHref = isCustomer
    ? '/customer/profile?tab=profile'
    : getDashboardPathByRole(user?.roles || []);
  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'K';

  const handleCustomerTabClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    tabKey: string
  ) => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    if (pathname === '/customer/profile' && typeof window !== 'undefined') {
      e.preventDefault();
      window.history.replaceState(null, '', `/customer/profile?tab=${tabKey}`);
      window.dispatchEvent(new CustomEvent('csc:switch-tab', { detail: tabKey }));
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 w-full bg-surface-elevated border-b border-hairline no-print">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center gap-6 xl:gap-8 shrink-0">
          <Link href="/home" className="flex items-center gap-2.5 group min-h-[44px] shrink-0">
            <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-[1.03]">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                directions_car
              </span>
            </div>
            <span className="font-bold text-base tracking-[-0.02em] text-ink-primary whitespace-nowrap">
              AutoCare Pro
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Điều hướng công khai">
            {PUBLIC_NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.sectionId)}
                className="min-h-[44px] px-3.5 rounded-xl text-sm font-medium text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors inline-flex items-center whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Trailing Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href={bookingHref}
            onClick={(e) => {
              if (mounted && isAuthenticated) {
                handleCustomerTabClick(e, 'appointments');
              }
            }}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold active:scale-[0.98] transition-all duration-150 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              calendar_add_on
            </span>
            <span>Đặt lịch ngay</span>
          </Link>

          <div className="flex items-center gap-2 sm:pl-2 sm:border-l sm:border-hairline">
            {!mounted ? (
              <div
                className="w-24 h-10 bg-surface-subtle animate-pulse rounded-xl"
                aria-hidden="true"
              />
            ) : isAuthenticated && user ? (
              <>
                <NotificationBell />
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 min-h-[44px] px-1.5 rounded-xl hover:bg-surface-subtle transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-accent-soft text-accent font-bold text-sm flex items-center justify-center shrink-0">
                      {userInitial}
                    </div>
                    <span className="hidden lg:inline-block text-sm font-semibold text-ink-primary max-w-[140px] truncate">
                      {user.fullName || 'Khách hàng'}
                    </span>
                    <span
                      className="material-symbols-outlined text-lg text-ink-muted hidden lg:inline-block"
                      aria-hidden="true"
                    >
                      expand_more
                    </span>
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileOpen(false)}
                        aria-hidden="true"
                      />
                      <div
                        role="menu"
                        className="absolute top-full right-0 mt-2 w-64 bg-surface-elevated rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-hairline">
                          <p className="text-sm font-semibold text-ink-primary truncate">
                            {user.fullName || 'Khách hàng'}
                          </p>
                          <p className="text-xs text-ink-muted truncate mt-0.5">{user.email}</p>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/customer/profile?tab=overview"
                            role="menuitem"
                            onClick={(e) => handleCustomerTabClick(e, 'overview')}
                            className="flex items-center gap-2.5 px-4 min-h-[44px] text-sm font-semibold text-accent hover:bg-accent-soft/60 transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg" aria-hidden="true">
                              home
                            </span>
                            <span>Tổng quan</span>
                          </Link>
                          <Link
                            href="/customer/profile?tab=tracking"
                            role="menuitem"
                            onClick={(e) => handleCustomerTabClick(e, 'tracking')}
                            className="flex items-center gap-2.5 px-4 min-h-[44px] text-sm text-ink-primary hover:bg-surface-subtle transition-colors"
                          >
                            <span
                              className="material-symbols-outlined text-lg text-ink-secondary"
                              aria-hidden="true"
                            >
                              timeline
                            </span>
                            <span>Tiến độ sửa chữa</span>
                          </Link>
                          <Link
                            href="/customer/profile?tab=appointments"
                            role="menuitem"
                            onClick={(e) => handleCustomerTabClick(e, 'appointments')}
                            className="flex items-center gap-2.5 px-4 min-h-[44px] text-sm text-ink-primary hover:bg-surface-subtle transition-colors"
                          >
                            <span
                              className="material-symbols-outlined text-lg text-ink-secondary"
                              aria-hidden="true"
                            >
                              calendar_month
                            </span>
                            <span>Lịch hẹn dịch vụ</span>
                          </Link>
                          <Link
                            href="/customer/profile?tab=warranty"
                            role="menuitem"
                            onClick={(e) => handleCustomerTabClick(e, 'warranty')}
                            className="flex items-center gap-2.5 px-4 min-h-[44px] text-sm text-ink-primary hover:bg-surface-subtle transition-colors"
                          >
                            <span
                              className="material-symbols-outlined text-lg text-ink-secondary"
                              aria-hidden="true"
                            >
                              verified_user
                            </span>
                            <span>Bảo hành &amp; Hậu mãi</span>
                          </Link>
                          <Link
                            href="/customer/profile?tab=invoices"
                            role="menuitem"
                            onClick={(e) => handleCustomerTabClick(e, 'invoices')}
                            className="flex items-center gap-2.5 px-4 min-h-[44px] text-sm text-ink-primary hover:bg-surface-subtle transition-colors"
                          >
                            <span
                              className="material-symbols-outlined text-lg text-ink-secondary"
                              aria-hidden="true"
                            >
                              receipt_long
                            </span>
                            <span>Hóa đơn &amp; SePay</span>
                          </Link>
                          <Link
                            href={profileHref}
                            role="menuitem"
                            onClick={(e) => {
                              if (isCustomer) {
                                handleCustomerTabClick(e, 'profile');
                              } else {
                                setProfileOpen(false);
                              }
                            }}
                            className="flex items-center gap-2.5 px-4 min-h-[44px] text-sm text-ink-primary hover:bg-surface-subtle transition-colors"
                          >
                            <span
                              className="material-symbols-outlined text-lg text-ink-secondary"
                              aria-hidden="true"
                            >
                              person
                            </span>
                            <span>Hồ sơ cá nhân</span>
                          </Link>
                        </div>

                        <div className="pt-1 border-t border-hairline">
                          <LogoutButton
                            iconOnly={false}
                            className="w-full px-4 min-h-[44px] text-status-danger hover:bg-status-danger-soft text-left"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center min-h-[44px] px-3.5 rounded-xl text-sm font-semibold text-ink-primary hover:bg-surface-subtle transition-colors whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl border border-hairline-strong bg-surface-elevated text-ink-primary text-sm font-semibold hover:bg-surface-subtle transition-colors whitespace-nowrap"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile & Tablet Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu điều hướng"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                menu
              </span>
            </button>
          </div>
        </div>
      </div>
      </header>

      {/* Mobile & Tablet Slide-Over Drawer (Root z-50 above z-40 Chat Widget) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
          <div
            className="fixed inset-0 bg-ink-primary/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-[min(320px,88vw)] bg-surface-elevated border-l border-hairline flex flex-col justify-between p-5 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-hairline">
                <Link
                  href="/home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px]"
                >
                  <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">
                      directions_car
                    </span>
                  </div>
                  <span className="font-bold text-base tracking-[-0.02em] text-ink-primary">
                    AutoCare Pro
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Đóng menu"
                  className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-ink-secondary hover:bg-surface-subtle hover:text-ink-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                    close
                  </span>
                </button>
              </div>

              <nav className="space-y-1" aria-label="Điều hướng di động">
                {PUBLIC_NAV_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.sectionId)}
                    className="flex items-center min-h-[44px] px-3.5 rounded-xl text-sm font-semibold text-ink-primary hover:bg-surface-subtle transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-5 border-t border-hairline space-y-2.5 mt-6">
              <Link
                href={bookingHref}
                onClick={(e) => {
                  if (mounted && isAuthenticated) {
                    handleCustomerTabClick(e, 'appointments');
                  } else {
                    setMobileMenuOpen(false);
                  }
                }}
                className="w-full min-h-[44px] px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  calendar_add_on
                </span>
                <span>Đặt lịch bảo dưỡng</span>
              </Link>

              {mounted && isAuthenticated && user ? (
                <div className="pt-1">
                  <LogoutButton
                    iconOnly={false}
                    className="w-full justify-center min-h-[44px] px-4 rounded-xl text-status-danger bg-status-danger-soft/60 hover:bg-status-danger-soft"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] px-3 rounded-xl border border-hairline-strong bg-surface-elevated text-ink-primary text-sm font-semibold flex items-center justify-center hover:bg-surface-subtle transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] px-3 rounded-xl bg-surface-subtle text-ink-primary text-sm font-semibold flex items-center justify-center hover:bg-surface-muted transition-colors"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
