'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  createSepayPayment,
  getInvoicePaymentStatus,
  simulateQrSuccess,
  SepayPaymentResponse,
} from '@/lib/api/payment.api';

interface CustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: number;
    invoiceNumber: string;
    amountDue: number;
    licensePlate?: string;
    vehicleName?: string;
  };
  onSuccess: () => void;
}

export default function CustomerPaymentModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: CustomerPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sepayData, setSepayData] = useState<SepayPaymentResponse | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const formatMoney = (val: number) => (Number(val) || 0).toLocaleString('vi-VN') + ' đ';

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Khởi tạo phiên thanh toán SePay
  const handleStartPayment = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const returnUrl = `${window.location.origin}/customer/invoices?status=success`;
      const cancelUrl = `${window.location.origin}/customer/invoices?status=cancel`;

      const res = await createSepayPayment(invoice.id, returnUrl, cancelUrl);
      setSepayData(res);
    } catch (err: any) {
      console.error('Failed to create SePay session:', err);
      setErrorMsg(err.response?.data?.message || 'Không thể tạo phiên thanh toán SePay. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Tự động khởi tạo phiên thanh toán khi mở modal
  useEffect(() => {
    if (isOpen) {
      handleStartPayment();
    }
  }, [isOpen, invoice.id]);

  // Polling kiểm tra trạng thái thanh toán khi phiên SePay được tạo
  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setSepayData(null);
      setIsPaid(false);
      setErrorMsg(null);
      return;
    }

    // Bắt đầu polling kiểm tra trạng thái hóa đơn
    const checkStatus = async () => {
      try {
        const statusRes = await getInvoicePaymentStatus(invoice.id);
        if (statusRes.isPaid) {
          setIsPaid(true);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        }
      } catch (e) {
        // Silent error on polling
      }
    };

    pollingRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, invoice.id, onSuccess, onClose]);

  // Giả lập thanh toán thành công (dành cho môi trường Test / Sandbox)
  const handleSimulateSuccess = async () => {
    if (!sepayData) return;
    try {
      setSimulating(true);
      await simulateQrSuccess(sepayData.paymentId);
      setIsPaid(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to simulate payment:', err);
      setErrorMsg(err.response?.data?.message || 'Giả lập thanh toán thất bại');
    } finally {
      setSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-surface-container-lowest border border-surface-container-highest rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-surface-container-highest flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-primary flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Thanh toán trực tuyến SePay</h3>
              <p className="text-xs text-on-surface-variant font-mono">
                Hóa đơn <strong className="text-primary">#{invoice.invoiceNumber}</strong>
                {invoice.licensePlate ? ` • Xe ${invoice.licensePlate}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div>
          {/* Lỗi nếu có */}
          {errorMsg && (
            <div className="m-6 mb-0 p-3 bg-red-50 border border-red-200 rounded-xl text-left text-xs text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Trạng thái đã thanh toán thành công */}
          {isPaid ? (
            <div className="p-8 m-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <h4 className="text-base font-bold text-emerald-900">Thanh toán thành công!</h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Hóa đơn đã được quyết toán. Quý khách có thể nhận xe tại quầy dịch vụ.
              </p>
            </div>
          ) : loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-on-surface-variant font-medium">Đang tạo mã VietQR SePay...</p>
            </div>
          ) : sepayData ? (
            /* Layout 2 cột: Mã QR bên trái, Thông tin bên phải */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 items-stretch">
              {/* CỘT TRÁI (Mã QR) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50/80 p-4 rounded-2xl border border-surface-container-highest shadow-2xs text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  {sepayData.bankInfo?.qrCodeUrl ? (
                    <img
                      src={sepayData.bankInfo.qrCodeUrl}
                      alt="VietQR SePay"
                      className="w-56 max-w-full h-auto mx-auto object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-56 h-56 bg-slate-100 flex items-center justify-center rounded-lg text-slate-400">
                      <span className="material-symbols-outlined text-[48px]">qr_code_2</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-2.5 font-medium">
                  Quét mã bằng ứng dụng ngân hàng bất kỳ
                </p>
              </div>

              {/* CỘT PHẢI (Thông tin số tiền, chi tiết chuyển khoản & nút thao tác) */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-3.5 text-left">
                {/* Thông tin số tiền */}
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold text-outline tracking-wider">
                    Số tiền cần thanh toán:
                  </span>
                  <span className="text-2xl font-black text-primary font-mono">
                    {formatMoney(invoice.amountDue)}
                  </span>
                </div>

                {/* Thông tin chuyển khoản chi tiết */}
                {sepayData.bankInfo && (
                  <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-highest space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-surface-container-highest">
                      <span className="text-on-surface-variant">Ngân hàng:</span>
                      <span className="font-bold text-on-surface">{sepayData.bankInfo.bankName}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-surface-container-highest">
                      <span className="text-on-surface-variant">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                        <span>{sepayData.bankInfo.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(sepayData.bankInfo!.accountNumber, 'acc')}
                          className="p-1 hover:bg-surface-container rounded text-on-surface-variant cursor-pointer"
                          title="Sao chép số tài khoản"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedField === 'acc' ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-surface-container-highest">
                      <span className="text-on-surface-variant">Chủ tài khoản:</span>
                      <span className="font-bold text-on-surface uppercase">{sepayData.bankInfo.accountName}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <div>
                        <span className="text-amber-900 font-bold block text-xs">Nội dung chuyển khoản:</span>
                        <span className="text-[10px] text-amber-700">Bắt buộc giữ nguyên nội dung</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono font-extrabold text-amber-900 text-sm">
                        <span>{sepayData.bankInfo.transferContent}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(sepayData.bankInfo!.transferContent, 'content')}
                          className="p-1 hover:bg-amber-100 rounded text-amber-800 cursor-pointer"
                          title="Sao chép nội dung"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {copiedField === 'content' ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trạng thái lắng nghe webhook tự động */}
                <div className="flex items-center gap-2 text-xs text-primary font-medium py-1 animate-pulse">
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  <span>Hệ thống đang tự động nhận diện thanh toán...</span>
                </div>

                {/* Nút giả lập thanh toán (dành cho môi trường test) */}
                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  disabled={simulating}
                  className="w-full py-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[15px]">science</span>
                  <span>{simulating ? 'Đang xử lý...' : 'Giả lập thanh toán thành công (Test Sandbox)'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
                <span>Thanh toán an toàn qua SePay</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hỗ trợ quét mã VietQR trên mọi ứng dụng ngân hàng. Tiền vào tài khoản tự động xác nhận tức thì.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-container-highest flex items-center justify-between bg-surface-container-lowest">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container transition cursor-pointer"
          >
            Đóng
          </button>

          {!isPaid && !sepayData && (
            <button
              type="button"
              onClick={handleStartPayment}
              disabled={loading}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">
                {loading ? 'progress_activity' : 'credit_card'}
              </span>
              <span>{loading ? 'Đang tạo phiên...' : 'Thanh toán ngay qua SePay'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
