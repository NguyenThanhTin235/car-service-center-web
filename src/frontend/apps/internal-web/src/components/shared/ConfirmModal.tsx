import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-6">
          <h2 className="text-title-lg font-bold text-on-surface mb-2">{title}</h2>
          <p className="text-body-md text-secondary">{message}</p>
        </div>
        <div className="p-4 bg-surface-container-lowest flex justify-end gap-3 border-t border-outline-variant">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-semibold text-secondary hover:bg-surface-container rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
              isDestructive
                ? 'bg-error text-on-error hover:bg-error-container hover:text-on-error-container'
                : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
