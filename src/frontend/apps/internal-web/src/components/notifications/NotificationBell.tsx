'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { NotificationItem } from '@/lib/api/notification.api';
import {
  deleteNotificationThunk,
  fetchNotifications,
  markAllAsReadThunk,
  markAsReadThunk,
} from '@/store/slices/notificationSlice';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import {
  formatRelativeTimeVi,
  getNotificationVisual,
  resolveNotificationCenterHref,
} from './notificationUtils';
import NotificationDetailModal from './NotificationDetailModal';

export interface NotificationBellProps {
  variant?: 'default' | 'pill';
}

export default function NotificationBell({ variant = 'default' }: NotificationBellProps) {
  useNotificationSocket();

  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items, unreadCount, loading, error } = useAppSelector(
    (state) => state.notifications
  );

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      dispatch(fetchNotifications({ page: 1, limit: 10 }));
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      dispatch(markAsReadThunk(item.id));
    }
    setOpen(false);
    setSelectedItem(
      item.isRead ? item : { ...item, isRead: true, readAt: new Date().toISOString() }
    );
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    dispatch(deleteNotificationThunk(id));
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllAsReadThunk());
    }
  };

  const displayCount = mounted ? unreadCount : 0;
  const badgeLabel = displayCount > 99 ? '99+' : String(displayCount);
  const recentItems = items.slice(0, 8);

  const triggerClass =
    variant === 'pill'
      ? 'relative w-11 h-11 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-zinc-700 shadow-2xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40'
      : 'relative w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200/70 flex items-center justify-center text-slate-700 hover:text-[#0050cd] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866ff]/40';

  const badgeClass =
    variant === 'pill'
      ? 'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-md bg-[#0c2340] text-white text-[11px] font-extrabold tabular-nums flex items-center justify-center shadow-xs'
      : 'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0866ff] text-white text-[10px] font-extrabold tabular-nums flex items-center justify-center shadow-xs ring-2 ring-white';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        data-testid="notification-bell-trigger"
        onClick={handleToggle}
        title="Thông báo"
        aria-label="Thông báo"
        aria-expanded={open}
        className={triggerClass}
      >
        <span className="material-symbols-outlined text-[20px]">
          {displayCount > 0 ? 'notifications_active' : 'notifications'}
        </span>
        {displayCount > 0 && (
          <span data-testid="notification-unread-badge" className={badgeClass}>
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="notification-dropdown"
          className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[390px] bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Thông báo</span>
              {displayCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0050cd] text-[11px] font-bold tabular-nums">
                  {displayCount} chưa đọc
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={displayCount === 0}
              className="text-xs font-semibold text-[#0050cd] hover:text-[#0866ff] disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Đọc tất cả
            </button>
          </div>

          {/* 4-State Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading && recentItems.length === 0 ? (
              <div className="p-4 space-y-3" data-testid="notification-loading">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-start gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error && recentItems.length === 0 ? (
              <div
                className="p-6 text-center space-y-2.5"
                data-testid="notification-error"
              >
                <span className="material-symbols-outlined text-[32px] text-rose-500">
                  cloud_off
                </span>
                <p className="text-xs font-semibold text-slate-700">{error}</p>
                <button
                  type="button"
                  onClick={() => dispatch(fetchNotifications({ page: 1, limit: 10 }))}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0050cd] hover:bg-[#0866ff] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : recentItems.length === 0 ? (
              <div
                className="p-8 text-center space-y-1.5"
                data-testid="notification-empty"
              >
                <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <span className="material-symbols-outlined text-[22px]">
                    notifications_off
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800">Chưa có thông báo nào</p>
                <p className="text-[11px] text-slate-500">
                  Cập nhật lịch hẹn, phiếu công việc và thanh toán sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              recentItems.map((item) => {
                const visual = getNotificationVisual(item.type);
                return (
                  <div
                    key={item.id}
                    className={`group px-4 py-3 flex items-start gap-3 transition-colors ${
                      item.isRead
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-blue-50/45 hover:bg-blue-50/80'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className="flex-1 min-w-0 flex items-start gap-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866ff] rounded-lg"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${visual.bgClass} ${visual.textClass} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {visual.icon}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs leading-snug ${
                              item.isRead
                                ? 'font-semibold text-slate-800'
                                : 'font-bold text-slate-950'
                            }`}
                          >
                            {item.title}
                          </p>
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#0866ff] shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.message}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 mt-1 tabular-nums">
                          {formatRelativeTimeVi(item.createdAt)}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      title="Xóa thông báo"
                      aria-label="Xóa thông báo"
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 text-center">
            <Link
              href={resolveNotificationCenterHref(user?.roles || [])}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0050cd] hover:text-[#0866ff] transition-colors"
            >
              <span>Xem tất cả thông báo</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}

      {selectedItem && (
        <NotificationDetailModal
          item={selectedItem}
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          onDelete={(id) => dispatch(deleteNotificationThunk(id))}
          roles={user?.roles ?? []}
        />
      )}
    </div>
  );
}
