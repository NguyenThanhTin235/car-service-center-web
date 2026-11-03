'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { InvoiceDetail } from '@/lib/api/invoice.api';
import { recordManualPayment } from '@/lib/api/payment.api';
import VnpayQrPanel from './VnpayQrPanel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceDetail;
  onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, invoice, onSuccess }: Props) {
  const [tab, setTab] = useState<'VNPAY_QR' | 'CASH' | 'CARD'>('VNPAY_QR');
  const [tenderedAmount, setTenderedAmount] = useState<number>(invoice.amountDue);
  const [cardRef, setCardRef] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const formatMoney = (val: number) => (Number(val) || 0).toLocaleString('vi-VN') + ' đ';
  const changeAmount = Math.max(0, (tenderedAmount || 0) - invoice.amountDue);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tab === 'CASH' && tenderedAmount < invoice.amountDue) {
      toast.error('Số tiền khách đưa không được nhỏ hơn số tiền cần thanh toán!');
      return;
    }

    try {
      setSubmitting(true);
      await recordManualPayment(invoice.id, {
        paymentMethod: tab as 'CASH' | 'CARD',
        amount: invoice.amountDue,
        tenderedAmount: tab === 'CASH' ? tenderedAmount : invoice.amountDue,
        transactionRef: tab === 'CARD' ? cardRef.trim() : undefined,
      });

      toast.success(
        tab === 'CASH'
          ? `Ghi nhận thu tiền mặt thành công! Tiền thối: ${formatMoney(changeAmount)}`
          : 'Xác nhận thanh toán thẻ thành công!'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi ghi nhận thanh toán');
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
            <span className="material-symbols-outlined text-primary text-[24px]">payments</span>
            <div>
              <h2 className="text-title-md font-bold text-on-surface">Thanh toán hóa đơn</h2>
              <p className="text-xs text-on-surface-variant">
                Mã HĐ: <strong className="font-mono text-primary">{invoice.invoiceNumber}</strong> | Khách: <strong>{invoice.customer.fullName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-container-high rounded-xl">
            <button
              type="button"
              onClick={() => setTab('VNPAY_QR')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                tab === 'VNPAY_QR'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              <span>VNPay QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('CASH');
                setTenderedAmount(invoice.amountDue);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                tab === 'CASH'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
              <span>Tiền mặt</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('CARD')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                tab === 'CARD'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">credit_card</span>
              <span>Thẻ (POS)</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'VNPAY_QR' ? (
            <VnpayQrPanel
              invoiceId={invoice.id}
              amountDue={invoice.amountDue}
              invoiceNumber={invoice.invoiceNumber}
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
              onSwitchManual={() => {
                setTab('CASH');
                setTenderedAmount(invoice.amountDue);
              }}
            />
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Amount due highlight */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Số tiền cần thu:
                </span>
                <span className="text-xl font-extrabold text-primary">
                  {formatMoney(invoice.amountDue)}
                </span>
              </div>

              {tab === 'CASH' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">
                      Số tiền khách đưa <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={invoice.amountDue}
                        step="1000"
                        value={tenderedAmount}
                        onChange={(e) => setTenderedAmount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base font-bold"
                        required
                      />
                      <span className="absolute right-3.5 top-3 text-xs text-on-surface-variant font-medium">VNĐ</span>
                    </div>

                    {/* Quick presets */}
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setTenderedAmount(invoice.amountDue)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium transition-colors"
                      >
                        Đúng số tiền
                      </button>
                      <button
                        type="button"
                        onClick={() => setTenderedAmount(Math.ceil(invoice.amountDue / 100000) * 100000)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium transition-colors"
                      >
                        Tròn 100k
                      </button>
                      <button
                        type="button"
                        onClick={() => setTenderedAmount(Math.ceil(invoice.amountDue / 500000) * 500000)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium transition-colors"
                      >
                        Tròn 500k
                      </button>
                    </div>
                  </div>

                  {/* Change calculation */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                      Tiền thối lại cho khách:
                    </span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(changeAmount)}
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">
                    Mã giao dịch POS / Mã chuẩn chi thẻ
                  </label>
                  <input
                    type="text"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono"
                    placeholder="Vd: POS-998877 hoặc số Auth Code trên biên lai POS"
                  />
                  <p className="text-xs text-on-surface-variant mt-1">
                    Nhập mã chuẩn chi in trên biên lai máy POS để phục vụ đối soát kế toán.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Xác nhận đã thu tiền</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
