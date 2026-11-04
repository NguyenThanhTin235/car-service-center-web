'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { InvoiceDetail } from '@/lib/api/invoice.api';
import {
  recordManualPayment,
  createSepayPayment,
  getInvoicePaymentStatus,
  simulateQrSuccess,
  SepayPaymentResponse,
} from '@/lib/api/payment.api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceDetail;
  onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, invoice, onSuccess }: Props) {
  const [tab, setTab] = useState<'CASH' | 'CARD' | 'SEPAY'>('CASH');
  const [tenderedAmount, setTenderedAmount] = useState<number>(invoice.amountDue);
  const [cardRef, setCardRef] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // SePay state
  const [sepayLoading, setSepayLoading] = useState<boolean>(false);
  const [sepayData, setSepayData] = useState<SepayPaymentResponse | null>(null);
  const [sepayPaid, setSepayPaid] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const formatMoney = (val: number) => (Number(val) || 0).toLocaleString('vi-VN') + ' đ';
  const changeAmount = Math.max(0, (tenderedAmount || 0) - invoice.amountDue);

  // Helper submit hidden POST form to SePay checkout
  const submitSepayForm = (checkoutUrl: string, fields: Record<string, any>) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = checkoutUrl;
    form.target = '_blank';

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      }
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  // Khởi tạo phiên SePay
  const handleCreateSepay = async () => {
    try {
      setSepayLoading(true);
      const res = await createSepayPayment(invoice.id);
      setSepayData(res);
      submitSepayForm(res.checkoutUrl, res.fields);
      toast.success('Đã mở trang thanh toán SePay trong tab mới!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tạo phiên SePay');
    } finally {
      setSepayLoading(false);
    }
  };

  // Giả lập thanh toán SePay thành công (chỉ cho dev/test)
  const handleSimulateSepay = async () => {
    if (!sepayData) return;
    try {
      setSimulating(true);
      await simulateQrSuccess(sepayData.paymentId);
      setSepayPaid(true);
      toast.success('Giả lập thanh toán SePay thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi giả lập thanh toán');
    } finally {
      setSimulating(false);
    }
  };

  // Polling trạng thái SePay
  useEffect(() => {
    if (!isOpen || tab !== 'SEPAY') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await getInvoicePaymentStatus(invoice.id);
        if (res.isPaid) {
          setSepayPaid(true);
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast.success('Thanh toán SePay thành công! Hóa đơn đã được quyết toán.');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      } catch (e) {
        // Silent error on polling
      }
    };

    pollingRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, tab, invoice.id, onSuccess, onClose]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-xs animate-fade-in">
      <div className={`bg-surface-container-lowest rounded-2xl ${tab === 'SEPAY' && sepayData ? 'max-w-2xl' : 'max-w-lg'} w-full shadow-2xl border border-outline-variant overflow-hidden animate-scale-up transition-all duration-200`}>
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
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab selection: 3 Tabs (CASH, CARD, SEPAY) */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-container-high rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTab('CASH');
                setTenderedAmount(invoice.amountDue);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                tab === 'CARD'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">credit_card</span>
              <span>Thẻ (POS)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('SEPAY')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                tab === 'SEPAY'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
              <span>SePay (VietQR)</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Amount due highlight */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Số tiền cần thu:
            </span>
            <span className="text-xl font-extrabold text-primary font-mono">
              {formatMoney(invoice.amountDue)}
            </span>
          </div>

          {tab === 'SEPAY' ? (
            /* TAB 3: SEPAY VIETQR */
            <div className="space-y-4">
              {sepayPaid ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <span className="material-symbols-outlined text-[32px] text-emerald-600 block">check_circle</span>
                  <p className="text-sm font-bold text-emerald-900">Thanh toán SePay thành công!</p>
                  <p className="text-xs text-emerald-700">Hóa đơn đã được quyết toán tự động.</p>
                </div>
              ) : sepayData ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                  {/* Cột trái: Mã VietQR SePay */}
                  <div className="md:col-span-5 bg-white p-3.5 rounded-2xl border border-outline-variant shadow-xs text-center flex flex-col justify-center items-center">
                    {sepayData.bankInfo?.qrCodeUrl ? (
                      <img
                        src={sepayData.bankInfo.qrCodeUrl}
                        alt="VietQR SePay"
                        className="w-52 max-w-full h-auto mx-auto object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-52 h-52 bg-slate-100 flex items-center justify-center rounded-lg text-slate-400 mx-auto">
                        <span className="material-symbols-outlined text-[48px]">qr_code_2</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">
                      Khách hàng quét mã qua App ngân hàng
                    </p>
                  </div>

                  {/* Cột phải: Thông tin chuyển khoản & Thao tác */}
                  <div className="md:col-span-7 flex flex-col justify-between space-y-2.5">
                    {sepayData.bankInfo && (
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-left space-y-1.5 text-xs">
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant">
                          <span className="text-on-surface-variant">Ngân hàng:</span>
                          <span className="font-bold text-on-surface">{sepayData.bankInfo.bankName}</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant">
                          <span className="text-on-surface-variant">Số tài khoản:</span>
                          <span className="font-mono font-bold text-primary">{sepayData.bankInfo.accountNumber}</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant">
                          <span className="text-on-surface-variant">Chủ TK:</span>
                          <span className="font-bold text-on-surface uppercase">{sepayData.bankInfo.accountName}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <span className="text-amber-900 font-bold">Nội dung CK:</span>
                          <span className="font-mono font-extrabold text-amber-900 text-sm">{sepayData.bankInfo.transferContent}</span>
                        </div>
                      </div>
                    )}

                    {/* Trạng thái tự động */}
                    <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium py-1 animate-pulse">
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      <span>Đang chờ khách thanh toán... Tự động đối soát</span>
                    </div>

                    {/* Nút Test giả lập */}
                    <button
                      type="button"
                      onClick={handleSimulateSepay}
                      disabled={simulating}
                      className="w-full py-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-[11px] font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[14px]">science</span>
                      <span>{simulating ? 'Đang xử lý...' : 'Giả lập thanh toán SePay thành công (Test Demo)'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-center">
                  <p className="text-xs text-slate-600">
                    Bấm nút bên dưới để khởi tạo phiên thanh toán SePay và mở trang quét mã VietQR cho khách hàng tại quầy.
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateSepay}
                    disabled={sepayLoading}
                    className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {sepayLoading ? 'progress_activity' : 'qr_code_scanner'}
                    </span>
                    <span>{sepayLoading ? 'Đang tạo phiên...' : 'Tạo mã SePay VietQR'}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            /* TAB 1 & 2: MANUAL CASH & CARD */
            <form onSubmit={handleManualSubmit} className="space-y-4">
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
                        className="px-2.5 py-1 text-xs rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium transition-colors cursor-pointer"
                      >
                        Đúng số tiền
                      </button>
                      <button
                        type="button"
                        onClick={() => setTenderedAmount(Math.ceil(invoice.amountDue / 100000) * 100000)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium transition-colors cursor-pointer"
                      >
                        Tròn 100k
                      </button>
                      <button
                        type="button"
                        onClick={() => setTenderedAmount(Math.ceil(invoice.amountDue / 500000) * 500000)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium transition-colors cursor-pointer"
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
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
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
                  className="px-4 py-2 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
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
