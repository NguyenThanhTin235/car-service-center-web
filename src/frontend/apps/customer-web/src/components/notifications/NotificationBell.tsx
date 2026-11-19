'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { NotificationItem } from '@/lib/api/notification.api';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import {
  clearLatestRealtime,
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  markAsRead,
} from '@/store/slices/notificationSlice';
import {
  formatRelativeTimeVi,
  getNotificationIcon,
} from './notificationUtils';
import NotificationDetailModal from './NotificationDetailModal';

export default function NotificationBell() {
  useNotificationSocket();

  const dispatch = useAppDispatch();
  const { items, unreadCount, loading, error, latestRealtime } = useAppSelector(
    (state) => state.notifications
  );
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications({ page: 1, limit: 10 }));
    }
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    if (!latestRealtime) return;
    const timer = setTimeout(() => {
      dispatch(clearLatestRealtime());
    }, 5000);
    return () => clearTimeout(timer);
  }, [dispatch, latestRealtime]);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && items.length === 0 && !loading) {
      dispatch(fetchNotifications({ page: 1, limit: 10 }));
    }
  };

  const handleRetry = () => {
    dispatch(fetchNotifications({ page: 1, limit: 10 }));
    dispatch(fetchUnreadCount());
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      dispatch(markAsRead(item.id));
    }
    setOpen(false);
    dispatch(clearLatestRealtime());
    setSelectedNotification({ ...item, isRead: true });
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const previewItems = items.slice(0, 10);
  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Thông báo"
        title="Thông báo"
        className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-surface-container-lowest">
            {badgeText}
          </span>
        )}
      </button>

      {/* Subtle Real-time Toast Banner */}
      {latestRealtime && !open && (
        <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-surface-container-lowest border border-primary/30 rounded-xl shadow-lg p-3.5 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              notifications_active
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleItemClick(latestRealtime)}
            className="flex-1 text-left min-w-0"
          >
            <p className="text-xs font-semibold text-primary">Thông báo mới</p>
            <p className="text-sm font-semibold text-on-surface truncate">
              {latestRealtime.title}
            </p>
            <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
              {latestRealtime.message}
            </p>
          </button>
          <button
            type="button"
            onClick={() => dispatch(clearLatestRealtime())}
            aria-label="Đóng thông báo"
            className="text-on-surface-variant hover:text-on-surface p-0.5 rounded"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              close
            </span>
          </button>
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest border border-surface-container-highest rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-container-high flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-on-surface">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-[11px] font-semibold">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-surface-container-high">
            {loading && previewItems.length === 0 ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="flex items-start gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-surface-container-high shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-surface-container-high rounded w-3/4" />
                      <div className="h-3 bg-surface-container-low rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error && previewItems.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <span
                  className="material-symbols-outlined text-error"
                  style={{ fontSize: '32px' }}
                >
                  error_outline
                </span>
                <p className="text-sm text-on-surface-variant">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Thử lại
                </button>
              </div>
            ) : previewItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <span
                  className="material-symbols-outlined text-on-surface-variant/60"
                  style={{ fontSize: '36px' }}
                >
                  notifications_off
                </span>
                <p className="text-sm font-semibold text-on-surface">
                  Chưa có thông báo nào
                </p>
                <p className="text-xs text-on-surface-variant">
                  Cập nhật về lịch hẹn, báo giá và hóa đơn sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              previewItems.map((item) => {
                const { icon, bgClass, textClass } = getNotificationIcon(item.type);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-surface-container-low ${
                      item.isRead ? 'bg-surface-container-lowest' : 'bg-primary-fixed/20'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bgClass} ${textClass}`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '18px' }}
                      >
                        {icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            item.isRead
                              ? 'font-medium text-on-surface'
                              : 'font-bold text-on-surface'
                          }`}
                        >
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                        {item.message}
                      </p>
                      <p className="text-[11px] text-on-surface-variant/80 mt-1">
                        {formatRelativeTimeVi(item.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
}
