'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  getNotificationVisual,
  resolveNotificationHref,
} from '@/components/notifications/notificationUtils';

type FilterTab = 'all' | 'unread';

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { items, unreadCount, meta, loading, error } = useAppSelector(
    (state) => state.notifications
  );

  const [filter, setFilter] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(
      fetchNotifications({
        page,
        limit: 20,
        unreadOnly: filter === 'unread',
      })
    );
  }, [dispatch, page, filter]);

  const handleFilterChange = (nextFilter: FilterTab) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const handleRefresh = () => {
    dispatch(
      fetchNotifications({
        page,
        limit: 20,
        unreadOnly: filter === 'unread',
      })
    );
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      dispatch(markAsReadThunk(item.id));
    }
    const href = resolveNotificationHref(item, user?.roles ?? []);
    if (href !== '/notifications') {
      router.push(href);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Trung tâm thông báo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi cập nhật lịch hẹn, tiếp nhận xe, phiếu công việc và thanh toán theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => dispatch(markAllAsReadThunk())}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[#0c2340] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => handleFilterChange('unread')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-[#0c2340] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Chưa đọc</span>
          {unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums ${
                filter === 'unread'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 text-[#0050cd]'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 4-State Notification List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-4">
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
          <div className="p-10 text-center space-y-3">
            <span className="material-symbols-outlined text-[38px] text-rose-500">
              cloud_off
            </span>
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">
                notifications_off
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              {filter === 'unread'
                ? 'Không có thông báo chưa đọc'
                : 'Chưa có thông báo nào'}
            </p>
            <p className="text-xs text-slate-500">
              {filter === 'unread'
                ? 'Bạn đã xem tất cả thông báo mới nhất.'
                : 'Mọi thông báo vận hành sẽ được lưu lại tại đây.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const visual = getNotificationVisual(item.type);
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
                  className={`px-5 py-4 flex items-start gap-4 transition-colors cursor-pointer ${
                    item.isRead
                      ? 'bg-white hover:bg-slate-50'
                      : 'bg-blue-50/40 hover:bg-blue-50/75'
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
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm ${
                          item.isRead
                            ? 'font-semibold text-slate-800'
                            : 'font-bold text-slate-950'
                        }`}
                      >
                        {item.title}
                      </h3>
                      {!item.isRead && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0050cd] text-[10px] font-bold">
                          Mới
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-medium">
                      <span>{formatRelativeTimeVi(item.createdAt)}</span>
                      {item.entityType && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                          {item.entityType}
                          {item.entityId ? ` #${item.entityId}` : ''}
                        </span>
                      )}
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
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0050cd] hover:bg-blue-50 transition-colors cursor-pointer"
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
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
    </div>
  );
}
