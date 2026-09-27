import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={loading ? undefined : onCancel} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm border border-surface-container-highest overflow-hidden">
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-error-container' : 'bg-primary-container'}`}>
            <span className={`material-symbols-outlined ${isDanger ? 'text-error' : 'text-primary'}`} style={{ fontSize: '28px' }}>
              {isDanger ? 'warning' : 'help'}
            </span>
          </div>
          <h3 className="font-bold text-on-surface text-lg mb-2">{title}</h3>
          <p className="text-sm text-on-surface-variant mb-3">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border border-surface-container-highest text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container-low disabled:opacity-60 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 active:scale-[0.98] transition-all ${
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
