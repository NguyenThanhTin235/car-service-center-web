import React, { useEffect } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDanger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={loading ? undefined : onCancel} aria-hidden="true" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm border border-surface-container-highest overflow-hidden">
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-status-danger-soft text-status-danger' : 'bg-accent-soft text-accent'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }} aria-hidden="true">
              {isDanger ? 'warning' : 'help'}
            </span>
          </div>
          <h3 id="confirm-modal-title" className="font-bold text-on-surface text-lg mb-2">{title}</h3>
          <p className="text-sm text-on-surface-variant mb-3">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 min-h-[44px] py-2.5 border border-surface-container-highest text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container-low disabled:opacity-60 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 active:scale-[0.98] transition-all cursor-pointer ${
              isDanger ? 'bg-error text-on-error hover:bg-error/90' : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            {loading ? (
              <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isDanger ? 'border-on-error' : 'border-on-primary'}`} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
            )}
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
