'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store';
import LogoutButton from '@/components/shared/LogoutButton';
import { resolveNotificationCenterHref } from '@/components/notifications/notificationUtils';
import {
  formatRoleLabelVi,
  getInitials,
  resolveProfileHref,
} from '@/components/profile/profileUtils';

export interface UserAvatarMenuExtraLink {
  href: string;
  label: string;
  icon: string;
}

export interface UserAvatarMenuProps {
  variant?: 'default' | 'pill';
  defaultRoleLabel?: string;
  defaultInitials?: string;
  extraLinks?: UserAvatarMenuExtraLink[];
}

export default function UserAvatarMenu({
  variant = 'default',
  defaultRoleLabel = 'Nhân viên',
  defaultInitials = 'NV',
  extraLinks = [],
}: UserAvatarMenuProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const displayName = mounted ? user?.fullName || defaultRoleLabel : defaultRoleLabel;
  const displayEmail = mounted ? user?.email || '' : '';
  const displayRole = mounted
    ? formatRoleLabelVi(user?.roles?.[0]) || defaultRoleLabel
    : defaultRoleLabel;
  const initials = getInitials(displayName, defaultInitials);

  const profileHref = resolveProfileHref(user?.roles || []);
  const notificationsHref = resolveNotificationCenterHref(user?.roles || []);

  const triggerClass =
    variant === 'pill'
      ? 'flex items-center gap-2 min-h-[44px] bg-white hover:bg-slate-50 border border-slate-200/85 rounded-full p-1 pr-2.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40'
      : 'flex items-center gap-2.5 min-h-[40px] rounded-xl px-2 py-1 hover:bg-slate-100/90 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        data-testid="user-avatar-menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Tài khoản ${displayName}`}
        title={displayName}
        className={triggerClass}
      >
        <div
          className={`w-8 h-8 rounded-full text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
            variant === 'pill'
              ? 'bg-[#0c2340]'
              : 'bg-gradient-to-br from-[#0866ff] to-[#0050cd]'
          }`}
        >
          {initials}
        </div>

        {variant === 'pill' ? (
          <span className="hidden lg:inline text-xs font-bold text-slate-900 max-w-[130px] truncate">
            {displayName}
          </span>
        ) : (
          <div className="hidden md:flex flex-col items-start leading-tight text-left">
            <span className="text-xs font-bold text-slate-900 max-w-[135px] truncate">
              {displayName}
            </span>
            <span className="text-[11px] font-semibold text-[#0050cd] truncate">
              {displayRole}
            </span>
          </div>
        )}

        <span
          className={`material-symbols-outlined text-[16px] text-slate-500 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          role="menu"
          data-testid="user-avatar-dropdown"
          className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50"
        >
          {/* User Identity Header */}
          <div className="px-4 py-2.5 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0050cd] text-[10px] font-bold shrink-0">
                {displayRole}
              </span>
            </div>
            {displayEmail && (
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{displayEmail}</p>
            )}
          </div>

          {/* Primary Actions */}
          <div className="py-1">
            <Link
              href={profileHref}
              role="menuitem"
              data-testid="avatar-menu-profile-link"
              onClick={() => setOpen(false)}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-blue-50/70 flex items-center gap-2.5 text-slate-800 hover:text-[#0050cd] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-[#0050cd]">
                account_circle
              </span>
              <span>Thông tin cá nhân</span>
            </Link>

            <Link
              href={notificationsHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">
                notifications
              </span>
              <span>Trung tâm thông báo</span>
            </Link>

            {extraLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-500">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="pt-1 border-t border-slate-100">
            <LogoutButton className="w-full text-left px-4 py-2 text-xs hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 transition-colors font-bold cursor-pointer" />
          </div>
        </div>
      )}
    </div>
  );
}
