'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { NotificationItem } from '@/lib/api/notification.api';
import {
  deleteNotificationThunk,
  fetchNotifications,
  markAllAsReadThunk,
  markAsReadThunk,
} from '@/store/slices/notificationSlice';
import {
  formatRelativeTimeVi,
  getNotificationTypeLabel,
  getNotificationVisual,
} from './notificationUtils';
import NotificationDetailModal from './NotificationDetailModal';

export interface NotificationCategoryTab {
  key: string;
  label: string;
  types?: string[];
}

export interface NotificationCenterViewProps {
  portalName: string;
  subtitle: string;
  categories: NotificationCategoryTab[];
  actionsPlacement?: 'header' | 'below-filters';
  hideHeader?: boolean;
}

type ReadFilter = 'all' | 'unread';

export default function NotificationCenterView({
  portalName,
  subtitle,
  categories,
  actionsPlacement = 'header',
  hideHeader = false,
}: NotificationCenterViewProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items, unreadCount, meta, loading, error } = useAppSelector(
    (state) => state.notifications
  );

  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>(
    categories[0]?.key || 'all'
  );
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.key === activeCategoryKey) || categories[0],
    [categories, activeCategoryKey]
  );

  const loadNotifications = useCallback(() => {
    dispatch(
      fetchNotifications({
        page,
        limit: 20,
        unreadOnly: readFilter === 'unread',
        types: activeCategory?.types,
        search: debouncedSearch || undefined,
      })
    );
  }, [dispatch, page, readFilter, activeCategory, debouncedSearch]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleCategoryChange = (key: string) => {
    setActiveCategoryKey(key);
    setPage(1);
  };

  const handleReadFilterChange = (nextFilter: ReadFilter) => {
    setReadFilter(nextFilter);
    setPage(1);
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      dispatch(markAsReadThunk(item.id));
    }
    setSelectedItem(
      item.isRead ? item : { ...item, isRead: true, readAt: new Date().toISOString() }
    );
  };

  const actionButtons = (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={loadNotifications}
        className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 active:scale-[0.98] text-xs font-bold text-zinc-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
      >
        <span className={`material-symbols-outlined text-[17px] ${loading ? 'animate-spin' : ''}`}>
          sync
        </span>
        <span>Làm mới</span>
      </button>
      <button
        type="button"
        onClick={() => dispatch(markAllAsReadThunk())}
        disabled={unreadCount === 0}
        className="inline-flex items-center gap-1.5 px-4 min-h-[40px] rounded-full bg-[#0050cd] hover:bg-[#0866ff] active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
      >
        <span className="material-symbols-outlined text-[17px]">done_all</span>
        <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
        <span className="sm:hidden">Đọc tất cả</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      {!hideHeader && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Trung tâm thông báo
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0050cd] text-[11px] font-bold">
                {portalName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>

          {actionsPlacement === 'header' && actionButtons}
        </div>
      )}

      {/* Search + Read Filter + Category Tabs */}
      <div className="bg-white rounded-[24px] border border-slate-200/70 p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 lg:max-w-md">
            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc nội dung thông báo..."
              aria-label="Tìm kiếm thông báo"
              className="w-full min-h-[40px] pl-10 pr-9 py-2 rounded-full border border-slate-200/90 bg-[#f8fafc] focus:bg-white focus:border-[#0050cd] focus:outline-none focus:ring-2 focus:ring-[#0050cd]/15 text-xs font-medium text-zinc-900 placeholder:text-slate-400 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-zinc-800 hover:bg-slate-200/60 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>

          {/* All / Unread Filter + Inline Actions */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-full">
              <button
                type="button"
                onClick={() => handleReadFilterChange('all')}
                className={`px-4 min-h-[34px] rounded-full text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40 ${
                  readFilter === 'all'
                    ? 'bg-[#0c2340] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-zinc-900'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => handleReadFilterChange('unread')}
                className={`inline-flex items-center gap-1.5 px-4 min-h-[34px] rounded-full text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40 ${
                  readFilter === 'unread'
                    ? 'bg-[#0c2340] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-zinc-900'
                }`}
              >
                <span>Chưa đọc</span>
                {unreadCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${
                      readFilter === 'unread'
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-100 text-[#0050cd]'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            {actionsPlacement === 'below-filters' && (
              <>
                <span className="hidden sm:block h-5 w-px bg-slate-200" />
                {actionButtons}
              </>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto pb-0.5">
            {categories.map((cat) => {
              const isActive = activeCategory?.key === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`px-3.5 min-h-[34px] rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40 ${
                    isActive
                      ? 'bg-[#0050cd] text-white shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-zinc-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4-State Notification List */}
      <div className="bg-white rounded-[24px] border border-slate-200/70 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-4" data-testid="notification-center-loading">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-start gap-3.5 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3" data-testid="notification-center-error">
            <span className="material-symbols-outlined text-[38px] text-rose-500">
              cloud_off
            </span>
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <button
              type="button"
              onClick={loadNotifications}
              className="px-4 py-2 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-2" data-testid="notification-center-empty">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">
                notifications_off
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              {readFilter === 'unread'
                ? 'Không có thông báo chưa đọc'
                : 'Không tìm thấy thông báo nào'}
            </p>
            <p className="text-xs text-slate-500">
              {debouncedSearch
                ? 'Hãy thử từ khóa tìm kiếm khác hoặc chuyển sang danh mục Tất cả.'
                : readFilter === 'unread'
                ? 'Bạn đã xem tất cả thông báo mới nhất.'
                : 'Mọi thông báo vận hành sẽ được lưu lại tại đây.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const visual = getNotificationVisual(item.type);
              const typeLabel = getNotificationTypeLabel(item.type);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleItemClick(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                  className={`px-4 sm:px-5 py-4 flex items-start gap-3.5 sm:gap-4 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0050cd]/40 ${
                    item.isRead
                      ? 'bg-white hover:bg-slate-50/80'
                      : 'bg-[#f4f8ff] hover:bg-[#eaf2ff]/80'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${visual.bgClass} ${visual.textClass} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {visual.icon}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.isRead && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#0866ff] shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <h3
                        className={`text-sm tracking-tight ${
                          item.isRead
                            ? 'font-semibold text-zinc-800'
                            : 'font-bold text-zinc-950'
                        }`}
                      >
                        {item.title}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        {typeLabel}
                      </span>
                      {!item.isRead && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100/90 text-[#0050cd] text-[10px] font-bold">
                          Mới
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed max-w-[70ch]">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium tabular-nums">
                      <span>{formatRelativeTimeVi(item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(markAsReadThunk(item.id));
                        }}
                        title="Đánh dấu đã đọc"
                        aria-label="Đánh dấu đã đọc"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0050cd] hover:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          mark_email_read
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(deleteNotificationThunk(item.id));
                      }}
                      title="Xóa thông báo"
                      aria-label="Xóa thông báo"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete_outline
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Trang <strong className="text-slate-900">{meta.page}</strong> /{' '}
              {meta.totalPages} ({meta.total} thông báo)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <NotificationDetailModal
        item={selectedItem}
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        onDelete={(id) => dispatch(deleteNotificationThunk(id))}
        roles={user?.roles ?? []}
      />
    </div>
  );
}
