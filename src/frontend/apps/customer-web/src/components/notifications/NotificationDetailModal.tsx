'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { NotificationItem } from '@/lib/api/notification.api';
import { useAppDispatch } from '@/store';
import { removeNotification } from '@/store/slices/notificationSlice';
import {
  formatExactDateTimeVi,
  formatRelativeTimeVi,
  getNotificationIcon,
  getNotificationTypeLabel,
  resolveNotificationHref,
} from './notificationUtils';

export interface NotificationDetailModalProps {
  notification: NotificationItem | null;
  onClose: () => void;
}

export default function NotificationDetailModal({
  notification,
  onClose,
}: NotificationDetailModalProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!notification) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notification, deleting, onClose]);

  if (!mounted || !notification) return null;

  const { icon, bgClass, textClass } = getNotificationIcon(notification.type);
  const typeLabel = getNotificationTypeLabel(notification.type);
  const exactTime = formatExactDateTimeVi(notification.createdAt);
  const relativeTime = formatRelativeTimeVi(notification.createdAt);
  const detailHref = resolveNotificationHref(notification);
  const hasDetailLink = detailHref !== '/customer/notifications';

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await dispatch(removeNotification(notification.id)).unwrap();
      onClose();
    } catch {
      // Keep modal open on failure so user can retry or close
    } finally {
      setDeleting(false);
    }
  };

  const handleNavigate = () => {
    onClose();
    router.push(detailHref);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-detail-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={deleting ? undefined : onClose}
        aria-hidden="true"
      />

      <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg border border-surface-container-highest overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-container-high flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgClass} ${textClass}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {icon}
              </span>
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface">
                {typeLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Status & Timestamp */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${
                notification.isRead
                  ? 'bg-surface-container-high text-on-surface-variant'
                  : 'bg-primary-fixed text-primary'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  notification.isRead ? 'bg-on-surface-variant/60' : 'bg-primary'
                }`}
              />
              {notification.isRead ? 'Đã đọc' : 'Chưa đọc'}
            </span>

            {exactTime && (
              <span className="text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  schedule
                </span>
                {exactTime}
                {relativeTime ? ` (${relativeTime})` : ''}
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            id="notification-detail-title"
            className="text-lg font-bold text-on-surface leading-snug"
          >
            {notification.title}
          </h2>

          {/* Full Message */}
          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
            {notification.message}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-low/40 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-error hover:bg-error-container/30 disabled:opacity-50 transition-colors"
          >
            {deleting ? (
              <span className="w-4 h-4 border-2 border-error border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                delete_outline
              </span>
            )}
            Xóa thông báo
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="px-4 py-2 rounded-lg border border-surface-container-highest bg-surface-container-lowest text-sm font-medium text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50 transition-colors"
            >
              Đóng
            </button>

            {hasDetailLink && (
              <button
                type="button"
                onClick={handleNavigate}
                disabled={deleting}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Đi tới chi tiết →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
