import React from 'react';

interface ActionConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ActionConfirmDialog({
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isLoading = false,
  onConfirm,
  onClose
}: ActionConfirmDialogProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in" onClick={!isLoading ? onClose : undefined}></div>
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-xl z-50 overflow-hidden animate-in zoom-in-95 duration-200 border border-outline-variant">
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">help</span>
            </div>
            <h3 className="text-title-md font-title-md font-bold text-on-surface">
              {title}
            </h3>
          </div>
          
          <p className="text-body-md text-secondary mt-2">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-surface-container-low flex justify-end gap-3 border-t border-outline-variant/50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-label-md font-semibold text-secondary hover:bg-surface-container-highest rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-label-md font-semibold bg-primary hover:bg-primary/90 text-on-primary rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
