import React, { useState } from 'react';

interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  invoiceNumber: string;
}

export default function CancelInvoiceModal({
  isOpen,
  onClose,
  onConfirm,
  invoiceNumber,
}: CancelInvoiceModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError('Vui lòng nhập lý do hủy chi tiết (tối thiểu 3 ký tự)');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(trimmed);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi hủy hóa đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full flex flex-col shadow-2xl border border-outline-variant overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-error-container/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
            </div>
            <div>
              <h2 className="text-title-md font-bold text-on-surface">Xác nhận hủy hóa đơn</h2>
              <p className="text-xs text-on-surface-variant font-mono">Mã: {invoiceNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <span className="material-symbols-outlined text-[18px] shrink-0 text-amber-600 mt-0.5">warning</span>
            <div>
              <p className="font-semibold">Hành động này không thể hoàn tác!</p>
              <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                Hóa đơn sẽ bị hủy vĩnh viễn. Lệnh sửa chữa liên quan sẽ được đưa trở lại hàng đợi để có thể lập hóa đơn mới.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
              Lý do hủy hóa đơn <span className="text-error">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nhập cụ thể lý do hủy (ví dụ: Khách hàng yêu cầu đổi gói dịch vụ, sai sót số lượng phụ tùng...)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all resize-none"
              autoFocus
            />
            {error && (
              <p className="text-xs text-error mt-1 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">error</span>
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors disabled:opacity-50"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 3}
              className="px-5 py-2 rounded-xl bg-error hover:bg-error/90 text-on-error text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  <span>Xác nhận hủy</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

