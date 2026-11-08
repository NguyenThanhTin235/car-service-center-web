'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store';
import LogoutButton from '@/components/shared/LogoutButton';

export interface SaaSNavChildItem {
  label: string;
  href: string;
  badge?: number | string;
}

export interface SaaSNavItem {
  label: string;
  href?: string;
  icon: string;
  badge?: number | string;
  urgent?: boolean;
  children?: SaaSNavChildItem[];
}

export interface SaaSTelemetryDotItem {
  label: string;
  value: string | number;
  dotColor: string; // hex color e.g. '#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#818cf8'
  href?: string;
}

export interface SaaSDashboardShellProps {
  roleTitle: string;
  roleBadge: string;
  brandSubtitle: string;
  navSectionTitle?: string;
  navItems: SaaSNavItem[];
  telemetryTitle?: string;
  telemetryItems: SaaSTelemetryDotItem[];
  defaultRoleLabel: string;
  defaultInitials: string;
  searchPlaceholder?: string;
  onGlobalSearch?: (query: string) => void;
  children: React.ReactNode;
}

type SidebarTone = 'sapphire' | 'light';

export default function SaaSDashboardShell({
  roleTitle,
  roleBadge,
  brandSubtitle,
  navSectionTitle = 'Điều hướng',
  navItems,
  telemetryTitle = 'Trạng thái hệ thống',
  telemetryItems,
  defaultRoleLabel,
  defaultInitials,
  searchPlaceholder = 'Tìm chức năng, biển số...',
  onGlobalSearch,
  children,
}: SaaSDashboardShellProps) {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);

  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [sidebarTone, setSidebarTone] = useState<SidebarTone>('sapphire');

  useEffect(() => {
    setMounted(true);
    const savedTone = window.localStorage.getItem('autocare_sidebar_tone') as SidebarTone | null;
    if (savedTone === 'sapphire' || savedTone === 'light') {
      setSidebarTone(savedTone);
    }
    const initialGroups: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children) {
        initialGroups[item.label] = true;
      }
    });
    setOpenGroups(initialGroups);
  }, [navItems]);

  const toggleSidebarTone = () => {
    const nextTone: SidebarTone = sidebarTone === 'sapphire' ? 'light' : 'sapphire';
    setSidebarTone(nextTone);
    window.localStorage.setItem('autocare_sidebar_tone', nextTone);
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus sidebar search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCollapsed(false);
        const inputEl = document.getElementById('saas-sidebar-search-input');
        inputEl?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isHrefActive = (href?: string) => {
    if (!href) return false;
    if (href === '/staff' || href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Determine current active page title and icon for Top Context Bar
  const activePageMeta = useMemo(() => {
    for (const item of navItems) {
      if (item.href && isHrefActive(item.href)) {
        return { label: item.label, icon: item.icon };
      }
      if (item.children) {
        for (const child of item.children) {
          if (isHrefActive(child.href)) {
            return { label: child.label, icon: item.icon, parentLabel: item.label };
          }
        }
      }
    }
    return { label: navItems[0]?.label || 'Tổng quan', icon: navItems[0]?.icon || 'grid_view' };
  }, [navItems, pathname]);

  // Filter nav items when typing in sidebar quick search
  const filteredNavItems = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    if (!q) return navItems;
    return navItems
      .map((item) => {
        const matchesSelf = item.label.toLowerCase().includes(q);
        if (item.children) {
          const matchingChildren = item.children.filter((c) =>
            c.label.toLowerCase().includes(q)
          );
          if (matchesSelf || matchingChildren.length > 0) {
            return {
              ...item,
              children: matchingChildren.length > 0 ? matchingChildren : item.children,
            };
          }
          return null;
        }
        return matchesSelf ? item : null;
      })
      .filter(Boolean) as SaaSNavItem[];
  }, [navItems, sidebarSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onGlobalSearch && sidebarSearch.trim()) {
      onGlobalSearch(sidebarSearch.trim());
    }
  };

  const formatRoleLabel = (roleStr?: string): string => {
    if (!roleStr) return '';
    const r = roleStr.toUpperCase().trim().replace(/[\s-]+/g, '_');
    if (r === 'ADMIN' || r === 'ADMINISTRATOR') return 'Quản trị viên';
    if (r === 'MANAGER') return 'Quản lý xưởng';
    if (r === 'SA' || r === 'ADVISOR' || r === 'SERVICE_ADVISOR') return 'Cố vấn dịch vụ';
    if (r === 'DESK_STAFF' || r === 'DESKSTAFF' || r === 'FRONT_DESK' || r === 'STAFF') return 'Nhân viên lễ tân';
    if (r === 'CUSTOMER') return 'Khách hàng';
    if (r === 'TECHNICIAN') return 'Kỹ thuật viên';
    if (r === 'QC_STAFF') return 'Nhân viên KCS';
    return roleStr;
  };

  const displayName = mounted ? user?.fullName || defaultRoleLabel : defaultRoleLabel;
  const displayRole = mounted ? formatRoleLabel(user?.roles?.[0]) || roleTitle : roleTitle;
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || defaultInitials;

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isLight = sidebarTone === 'light';

  const renderSidebarContent = (isMobileDrawer = false) => {
    const isMini = collapsed && !isMobileDrawer;

    return (
      <div
        className={`flex flex-col h-full justify-between select-none ${
          isLight ? 'text-slate-700' : 'text-slate-200'
        }`}
      >
        {/* TOP SECTION: Brand + Search + Navigation */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar">
          {/* 1. Brand Header + Collapse Button */}
          <div
            className={`h-16 px-4 flex items-center shrink-0 border-b ${
              isLight ? 'border-slate-200/80' : 'border-blue-900/40'
            } ${isMini ? 'justify-center' : 'justify-between'}`}
          >
            <Link
              href={navItems[0]?.href || navItems[0]?.children?.[0]?.href || '/'}
              className="flex items-center gap-2.5 min-w-0 group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0866ff] to-[#0050cd] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
              </div>
              {!isMini && (
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[15px] font-bold tracking-tight truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    AutoCare
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider border ${
                      isLight
                        ? 'bg-blue-50 border-blue-200 text-[#0050cd]'
                        : 'bg-[#0866ff]/25 border-[#60a5fa]/40 text-white'
                    }`}
                  >
                    {roleBadge}
                  </span>
                </div>
              )}
            </Link>

            {isMobileDrawer ? (
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Đóng menu"
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            ) : (
              !isMini && (
                <button
                  type="button"
                  data-testid="saas-sidebar-collapse-btn"
                  onClick={() => setCollapsed(true)}
                  title="Thu gọn thanh bên"
                  aria-label="Thu gọn thanh bên"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    isLight
                      ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">dock_to_right</span>
                </button>
              )
            )}
          </div>

          {/* Expand button when collapsed on Desktop */}
          {isMini && (
            <div className="px-3 pt-3 flex justify-center">
              <button
                type="button"
                data-testid="saas-sidebar-expand-btn"
                onClick={() => setCollapsed(false)}
                title="Mở rộng thanh bên"
                aria-label="Mở rộng thanh bên"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-[#0866ff] text-slate-600 hover:text-white'
                    : 'bg-white/10 hover:bg-[#0866ff] text-slate-300 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">dock_to_left</span>
              </button>
            </div>
          )}

          {/* 2. Integrated Quick Search Box with ⌘K Keycaps */}
          {!isMini && (
            <div className="px-3.5 pt-3.5 pb-2">
              <form
                onSubmit={handleSearchSubmit}
                className={`flex items-center gap-2 h-9 px-3 rounded-xl transition-all focus-within:border-[#0866ff] ${
                  isLight
                    ? 'bg-slate-100/80 border border-slate-200/90'
                    : 'bg-[#132644]/80 border border-blue-800/40'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[17px] shrink-0 ${
                    isLight ? 'text-slate-500' : 'text-slate-300'
                  }`}
                >
                  search
                </span>
                <input
                  id="saas-sidebar-search-input"
                  data-testid="saas-sidebar-search"
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={`flex-1 min-w-0 bg-transparent text-xs focus:outline-none ${
                    isLight
                      ? 'text-slate-800 placeholder:text-slate-500'
                      : 'text-slate-100 placeholder:text-slate-300'
                  }`}
                />
                <span
                  className={`font-mono text-xs font-semibold shrink-0 ${
                    isLight ? 'text-slate-500' : 'text-slate-300'
                  }`}
                >
                  ⌘K
                </span>
              </form>
            </div>
          )}

          {/* 3. Navigation Group */}
          <div className="px-3 py-3">
            {!isMini && (
              <div
                className={`px-2.5 pb-2 text-xs font-semibold tracking-wide ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                {navSectionTitle}
              </div>
            )}

            <nav className="space-y-1" aria-label={navSectionTitle}>
              {filteredNavItems.map((item) => {
                if (item.children && item.children.length > 0) {
                  const hasActiveChild = item.children.some((c) => isHrefActive(c.href));
                  const isOpen = openGroups[item.label] ?? true;

                  if (isMini) {
                    const firstHref = item.children[0].href;
                    return (
                      <Link
                        key={item.label}
                        href={firstHref}
                        title={item.label}
                        className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all ${
                          hasActiveChild
                            ? 'bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white shadow-xs'
                            : isLight
                            ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            : 'text-slate-200 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.label)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                          hasActiveChild
                            ? isLight
                              ? 'text-[#0050cd] bg-blue-50/80 font-semibold'
                              : 'text-white bg-white/10 font-semibold'
                            : isLight
                            ? 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                            : 'text-slate-200 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[19px] ${
                            hasActiveChild
                              ? isLight
                                ? 'text-[#0866ff]'
                                : 'text-[#60a5fa]'
                              : isLight
                              ? 'text-slate-500'
                              : 'text-slate-300'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        <span
                          className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                            isLight ? 'text-slate-500' : 'text-slate-300'
                          } ${isOpen ? 'rotate-180' : ''}`}
                        >
                          expand_more
                        </span>
                      </button>

                      {isOpen && (
                        <div className="pl-9 pr-1 space-y-0.5">
                          {item.children.map((child) => {
                            const childActive = isHrefActive(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  childActive
                                    ? 'bg-[#0866ff] text-white font-semibold shadow-xs'
                                    : isLight
                                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                <span className="truncate">{child.label}</span>
                                {child.badge !== undefined && (
                                  <span
                                    className={`font-mono tabular-nums text-xs px-1.5 py-0.5 rounded ${
                                      childActive
                                        ? 'bg-white/20 text-white'
                                        : isLight
                                        ? 'bg-slate-100 text-slate-700'
                                        : 'bg-white/10 text-slate-200'
                                    }`}
                                  >
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = isHrefActive(item.href);

                if (isMini) {
                  return (
                    <Link
                      key={item.href || item.label}
                      href={item.href || '#'}
                      title={item.label}
                      className={`relative w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all ${
                        active
                          ? 'bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white shadow-xs'
                          : isLight
                          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      {item.badge !== undefined && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#0866ff] text-white font-mono text-xs font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href || item.label}
                    href={item.href || '#'}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all ${
                      active
                        ? 'bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white font-semibold shadow-xs border border-blue-400/30'
                        : isLight
                        ? 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 font-medium'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[19px] ${
                        active
                          ? 'text-white'
                          : isLight
                          ? 'text-slate-500'
                          : 'text-slate-300'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`font-mono tabular-nums text-xs px-2 py-0.5 rounded-md ${
                          active
                            ? 'bg-white/20 text-white font-bold'
                            : item.urgent
                            ? isLight
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'bg-amber-500/25 text-amber-200 font-bold'
                            : isLight
                            ? 'text-slate-600 bg-slate-100'
                            : 'text-slate-200 bg-white/10'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 4. Bottom Status / Telemetry Group */}
          {!isMini && telemetryItems.length > 0 && (
            <div
              data-testid="saas-sidebar-telemetry"
              className={`mt-2 pt-4 px-3.5 border-t ${
                isLight ? 'border-slate-200/80' : 'border-blue-900/40'
              }`}
            >
              <div
                className={`px-2 pb-2.5 text-xs font-semibold tracking-wide ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                {telemetryTitle}
              </div>
              <div className="space-y-1.5">
                {telemetryItems.map((tItem) => {
                  const content = (
                    <div
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
                        isLight ? 'hover:bg-slate-100/80' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: tItem.dotColor,
                          }}
                        />
                        <span
                          className={`text-xs truncate ${
                            isLight ? 'text-slate-700' : 'text-slate-200'
                          }`}
                        >
                          {tItem.label}
                        </span>
                      </div>
                      <span
                        className={`font-mono tabular-nums text-xs font-semibold ${
                          isLight ? 'text-slate-800' : 'text-white'
                        }`}
                      >
                        {tItem.value}
                      </span>
                    </div>
                  );

                  return tItem.href ? (
                    <Link key={tItem.label} href={tItem.href} className="block">
                      {content}
                    </Link>
                  ) : (
                    <div key={tItem.label}>{content}</div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 5. Footer: User Profile & Logout */}
        <div
          className={`p-3 border-t shrink-0 ${
            isLight
              ? 'border-slate-200/80 bg-slate-50/80'
              : 'border-blue-900/40 bg-[#081529]/90'
          }`}
        >
          {isMini ? (
            <div className="flex flex-col items-center gap-2">
              <div
                title={displayName}
                className="w-9 h-9 rounded-full bg-[#0866ff] text-white font-mono text-xs font-bold flex items-center justify-center"
              >
                {initials}
              </div>
              <LogoutButton
                iconOnly
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                    : 'text-slate-300 hover:bg-rose-500/20 hover:text-rose-300'
                }`}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#0866ff] to-[#0050cd] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                  {initials}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ${
                      isLight ? 'ring-white' : 'ring-[#081529]'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-xs font-semibold truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {displayName}
                  </div>
                  <div
                    className={`text-xs truncate ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {brandSubtitle}
                  </div>
                </div>
              </div>
              <LogoutButton
                iconOnly
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                  isLight
                    ? 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                    : 'text-slate-300 hover:bg-rose-500/20 hover:text-rose-300'
                }`}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const sidebarSurfaceClass = isLight
    ? 'bg-gradient-to-b from-white via-[#f9fbff] to-[#f2f7ff] border-slate-200/85 shadow-[2px_0_16px_-6px_rgba(15,23,42,0.05)]'
    : 'bg-gradient-to-b from-[#0c1c36] via-[#0e2140] to-[#0a182e] border-blue-950/60';

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900 font-[Be_Vietnam_Pro,sans-serif] flex flex-col antialiased overflow-x-clip">
      {/* DESKTOP SIDEBAR (lg >= 1024px) */}
      <aside
        data-testid="saas-sidebar"
        aria-label={`Thanh điều hướng ${roleTitle}`}
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-40 border-r flex-col transition-all duration-200 ${sidebarSurfaceClass} ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* MOBILE & TABLET SLIDE-OVER DRAWER (< 1024px) */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside
            data-testid="saas-mobile-drawer"
            className={`relative w-72 max-w-[85vw] h-full z-10 flex flex-col shadow-2xl ${sidebarSurfaceClass}`}
          >
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* MAIN WORKSPACE WRAPPER */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          collapsed ? 'lg:ml-[76px]' : 'lg:ml-64'
        }`}
      >
        {/* TOP CONTEXT BAR */}
        <header
          data-testid="saas-topbar"
          className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-3"
        >
          {/* Left: Mobile Drawer Button + Breadcrumb Icon & Active Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              data-testid="saas-mobile-menu-btn"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Mở menu điều hướng"
              className="lg:hidden w-11 h-11 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:text-[#0866ff] flex items-center justify-center shadow-2xs shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 min-w-0">
              <span className="material-symbols-outlined text-[20px] text-[#0866ff] shrink-0">
                {activePageMeta.icon}
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {activePageMeta.label}
              </span>
            </div>
          </div>

          {/* Right: Sidebar Tone Switcher + Live Operational Badge + User Info */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              data-testid="saas-sidebar-tone-toggle"
              onClick={toggleSidebarTone}
              title={
                isLight
                  ? 'Chuyển thanh bên sang tông Sapphire Tối'
                  : 'Chuyển thanh bên sang tông Slate Sáng'
              }
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 text-xs font-semibold text-slate-700 hover:text-[#0050cd] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0866ff]">
                {isLight ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="hidden xl:inline">
                {isLight ? 'Sidebar Sáng' : 'Sidebar Sapphire'}
              </span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-xs font-semibold text-[#0050cd]">
              <span className="w-2 h-2 rounded-full bg-[#0866ff]" />
              <span>Ca trực • Hệ thống ổn định</span>
            </div>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0866ff] to-[#0050cd] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-xs font-bold text-slate-900 max-w-[130px] truncate">
                  {displayName}
                </span>
                <span className="text-xs font-mono text-[#0050cd] font-semibold">
                  {displayRole}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
