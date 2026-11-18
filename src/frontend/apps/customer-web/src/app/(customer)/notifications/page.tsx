'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { NotificationItem } from '@/lib/api/notification.api';
import {
  fetchNotifications,
  markAllAsRead,
  markAsRead,
  removeNotification,
} from '@/store/slices/notificationSlice';
import {
  formatRelativeTimeVi,
  getNotificationIcon,
} from '@/components/notifications/notificationUtils';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';

type ReadFilter = 'all' | 'unread';
type CategoryKey = 'all' | 'appointments' | 'service' | 'billing';

interface CategoryTab {
  key: CategoryKey;
  label: string;
  types?: string[];
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', label: 'Tất cả' },
  {
    key: 'appointments',
    label: 'Lịch hẹn',
    types: [
      'APPOINTMENT_CONFIRMED',
      'APPOINTMENT_RESCHEDULED',
      'APPOINTMENT_CANCELLED',
      'APPOINTMENT_REMINDER',
    ],
  },
  {
    key: 'service',
    label: 'Báo giá & Sửa chữa',
    types: [
      'QUOTATION_SENT',
      'WORK_ORDER_STARTED',
      'SERVICE_ITEM_STARTED',
      'VEHICLE_READY',
      'VEHICLE_HANDOVER',
    ],
  },
  {
    key: 'billing',
    label: 'Hóa đơn & Thanh toán',
    types: ['INVOICE_ISSUED', 'PAYMENT_SUCCESS'],
  },
];

const PAGE_LIMIT = 20;

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const { items, unreadCount, loading, error, hasMore, page } = useAppSelector(
    (state) => state.notifications
  );
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [category, setCategory] = useState<CategoryKey>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(
    null
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeTypes = CATEGORY_TABS.find((tab) => tab.key === category)?.types;

  useEffect(() => {
    dispatch(
      fetchNotifications({
        page: 1,
        limit: PAGE_LIMIT,
        unreadOnly: readFilter === 'unread',
        types: activeTypes,
        search: debouncedSearch || undefined,
      })
    );
  }, [dispatch, readFilter, activeTypes, debouncedSearch]);

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    dispatch(
      fetchNotifications({
        page: page + 1,
        limit: PAGE_LIMIT,
        unreadOnly: readFilter === 'unread',
        types: activeTypes,
        search: debouncedSearch || undefined,
        append: true,
      })
    );
  };

  const handleRetry = () => {
    dispatch(
      fetchNotifications({
        page: 1,
        limit: PAGE_LIMIT,
        unreadOnly: readFilter === 'unread',
        types: activeTypes,
        search: debouncedSearch || undefined,
      })
    );
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      dispatch(markAsRead(item.id));
    }
    setSelectedNotification({ ...item, isRead: true });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    dispatch(removeNotification(id));
  };

  const displayedItems =
    readFilter === 'unread' ? items.filter((item) => !item.isRead) : items;

  const hasActiveFilters =
    readFilter === 'unread' || category !== 'all' || Boolean(debouncedSearch);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            Lịch sử thông báo
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Theo dõi cập nhật lịch hẹn, báo giá, tiến độ sửa chữa và hóa đơn dịch vụ.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => dispatch(markAllAsRead())}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-fixed text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              done_all
            </span>
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-container-highest pb-3">
        {CATEGORY_TABS.map((tab) => {
          const isActive = category === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCategory(tab.key)}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Read-Status Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            style={{ fontSize: '18px' }}
          >
            search
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung thông báo..."
            aria-label="Tìm kiếm thông báo"
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Xóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                close
              </span>
            </button>
          )}
        </div>

        <div className="inline-flex items-center p-1 rounded-xl bg-surface-container-low border border-surface-container-highest self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setReadFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              readFilter === 'all'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setReadFilter('unread')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              readFilter === 'unread'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Chưa đọc
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-fixed text-primary">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content Card (4-State UI) */}
      <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl shadow-sm overflow-hidden">
        {loading && displayedItems.length === 0 ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-container-high rounded w-1/2" />
                  <div className="h-3.5 bg-surface-container-low rounded w-5/6" />
                  <div className="h-3 bg-surface-container-low rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error && displayedItems.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <span
              className="material-symbols-outlined text-error"
              style={{ fontSize: '40px' }}
            >
              error_outline
            </span>
            <p className="text-sm font-medium text-on-surface">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Thử lại
            </button>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span
              className="material-symbols-outlined text-on-surface-variant/60"
              style={{ fontSize: '44px' }}
            >
              notifications_none
            </span>
            <p className="text-base font-semibold text-on-surface">
              {hasActiveFilters
                ? 'Không tìm thấy thông báo phù hợp'
                : 'Chưa có thông báo nào'}
            </p>
            <p className="text-sm text-on-surface-variant">
              {hasActiveFilters
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm thông báo.'
                : 'Các thông báo về lịch hẹn, báo giá và hóa đơn sẽ xuất hiện tại đây.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-container-high">
            {displayedItems.map((item) => {
              const { icon, bgClass, textClass } = getNotificationIcon(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                  className={`w-full text-left px-5 py-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-surface-container-low ${
                    item.isRead ? 'bg-surface-container-lowest' : 'bg-primary-fixed/15'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgClass} ${textClass}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {icon}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm sm:text-base leading-snug ${
                          item.isRead
                            ? 'font-medium text-on-surface'
                            : 'font-bold text-on-surface'
                        }`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {!item.isRead && (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-primary"
                            title="Chưa đọc"
                          />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item.id)}
                          aria-label="Xóa thông báo"
                          title="Xóa thông báo"
                          className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '18px' }}
                          >
                            delete_outline
                          </span>
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                      {item.message}
                    </p>
                    <p className="text-xs text-on-surface-variant/80 mt-1.5">
                      {formatRelativeTimeVi(item.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-sm font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Đang tải...
              </>
            ) : (
              'Xem thêm thông báo'
            )}
          </button>
        </div>
      )}

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
}
