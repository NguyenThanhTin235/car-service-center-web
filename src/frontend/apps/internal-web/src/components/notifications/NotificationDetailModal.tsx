'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationItem } from '@/lib/api/notification.api';
import {
  formatExactDateTimeVi,
  getNotificationTypeLabel,
  getNotificationVisual,
  resolveNotificationHref,
} from './notificationUtils';

export interface NotificationDetailModalProps {
  item: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: number) => void;
  roles?: string[];
}

export default function NotificationDetailModal({
  item,
  isOpen,
  onClose,
  onDelete,
  roles = [],
}: NotificationDetailModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const visual = getNotificationVisual(item.type);
  const typeLabel = getNotificationTypeLabel(item.type);
  const exactTimestamp = formatExactDateTimeVi(item.createdAt);
  const targetHref = resolveNotificationHref(item, roles);

  const handleGoToEntity = () => {
    onClose();
    router.push(targetHref);
  };

  const handleDelete = () => {
    onDelete?.(item.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-detail-title"
      data-testid="notification-detail-modal"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl ${visual.bgClass} ${visual.textClass} flex items-center justify-center shrink-0`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {visual.icon}
              </span>
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                {typeLabel}
              </span>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    item.isRead ? 'text-slate-500' : 'text-[#0050cd]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.isRead ? 'bg-slate-400' : 'bg-[#0866ff]'
                    }`}
                  />
                  {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                </span>
                {exactTimestamp && (
                  <>
                    <span>•</span>
                    <span className="tabular-nums">{exactTimestamp}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <h2
            id="notification-detail-title"
            className="text-base font-extrabold text-slate-900 leading-snug"
          >
            {item.title}
          </h2>

          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {item.message}
          </p>

          {(item.entityType || item.entityId !== null) && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">
                Đối tượng liên quan:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                {item.entityType || 'ENTITY'}
                {item.entityId !== null && item.entityId !== undefined
                  ? ` #${item.entityId}`
                  : ''}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2.5">
          {onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/70 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                delete_outline
              </span>
              Xóa thông báo
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleGoToEntity}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Đi tới nghiệp vụ →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
