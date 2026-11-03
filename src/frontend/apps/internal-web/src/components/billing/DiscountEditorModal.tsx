'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updateInvoiceDraft } from '@/lib/api/invoice.api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number;
  subtotal: number;
  currentDiscount: number;
  currentReason?: string | null;
  onSuccess: () => void;
}

export default function DiscountEditorModal({
  isOpen,
  onClose,
  invoiceId,
  subtotal,
  currentDiscount,
  currentReason,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [discountAmount, setDiscountAmount] = useState<number>(currentDiscount || 0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>(currentReason || '');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setDiscountAmount(currentDiscount || 0);
      setDiscountReason(currentReason || '');
      setMode('AMOUNT');
      setDiscountPercent(0);
    }
  }, [isOpen, currentDiscount, currentReason]);

  if (!isOpen) return null;

  const formatMoney = (val: number) => (Number(val) || 0).toLocaleString('vi-VN') + ' đ';

  // Tính toán realtime
  let effectiveDiscount = 0;
  if (mode === 'AMOUNT') {
    effectiveDiscount = Math.min(Math.max(0, Number(discountAmount) || 0), subtotal);
  } else {
    const pct = Math.min(Math.max(0, Number(discountPercent) || 0), 100);
    effectiveDiscount = Math.round((subtotal * pct) / 100);
  }
  const estimatedTotal = Math.max(0, subtotal - effectiveDiscount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (effectiveDiscount > 0 && (!discountReason || discountReason.trim().length < 3)) {
      toast.error('Vui lòng nhập lý do chiết khấu (tối thiểu 3 ký tự)');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        discountReason: discountReason.trim(),
      };

      if (mode === 'AMOUNT') {
        payload.discountAmount = effectiveDiscount;
      } else {
        payload.discountPercent = Number(discountPercent) || 0;
      }

      await updateInvoiceDraft(invoiceId, payload);
      toast.success('Cập nhật mức chiết khấu thành công');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi cập nhật chiết khấu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full shadow-2xl border border-outline-variant overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">percent</span>
            <h2 className="text-title-md font-bold text-on-surface">Chỉnh sửa chiết khấu & giảm trừ</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Subtotal baseline */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm">
            <span className="text-on-surface-variant">Tổng tiền dịch vụ gốc (Subtotal):</span>
            <span className="font-bold text-on-surface text-base">{formatMoney(subtotal)}</span>
          </div>

          {/* Mode switch */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
              Hình thức chiết khấu
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-high rounded-xl">
              <button
                type="button"
                onClick={() => setMode('AMOUNT')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'AMOUNT'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Số tiền cố định (VNĐ)
              </button>
              <button
                type="button"
                onClick={() => setMode('PERCENT')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'PERCENT'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Theo phần trăm (%)
              </button>
            </div>
          </div>

          {/* Input field */}
          {mode === 'AMOUNT' ? (
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Số tiền giảm trừ (VNĐ) <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="1000"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base font-semibold"
                  placeholder="0"
                />
                <span className="absolute right-3.5 top-3 text-xs text-on-surface-variant font-medium">VNĐ</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">Không được vượt quá {formatMoney(subtotal)}</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Tỷ lệ giảm trừ (%) <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base font-semibold"
                  placeholder="0"
                />
                <span className="absolute right-3.5 top-3 text-xs text-on-surface-variant font-medium">%</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Tương đương giảm: <strong className="text-primary">{formatMoney(effectiveDiscount)}</strong>
              </p>
            </div>
          )}

          {/* Reason input */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Lý do chiết khấu <span className="text-error">*</span>
            </label>
            <textarea
              rows={2}
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              placeholder="Vd: Khách hàng VIP Gold, Ưu đãi khai trương, Bù trừ sự cố trễ hẹn..."
              required
            />
            <p className="text-xs text-on-surface-variant mt-0.5">Bắt buộc nhập lý do để ghi nhận nhật ký kiểm toán (Audit Log)</p>
          </div>

          {/* Realtime summary preview */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>Tiền giảm trừ áp dụng:</span>
              <span className="font-bold text-error">- {formatMoney(effectiveDiscount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-on-surface pt-1 border-t border-primary/10">
              <span>Tổng thanh toán mới:</span>
              <span className="text-primary">{formatMoney(estimatedTotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

