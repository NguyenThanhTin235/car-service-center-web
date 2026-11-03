'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  createVnpayPayment,
  getPaymentStatus,
  simulateQrSuccess,
  cancelPendingPayment,
  VnpayPaymentResponse,
} from '@/lib/api/payment.api';

interface Props {
  invoiceId: number;
  amountDue: number;
  invoiceNumber: string;
  onSuccess: () => void;
  onSwitchManual: () => void;
}

export default function VnpayQrPanel({
  invoiceId,
  amountDue,
  invoiceNumber,
  onSuccess,
  onSwitchManual,
}: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<VnpayPaymentResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 phút (giây)
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);

  const pollIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    initQrPayment();
    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    };
  }, [invoiceId]);

  const initQrPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      setPaymentSuccess(false);
      clearInterval(pollIntervalRef.current);
      clearInterval(timerIntervalRef.current);

      const data = await createVnpayPayment(invoiceId);
      setQrData(data);

      // Tính thời gian hết hạn
      const expDate = new Date(data.expiresAt).getTime();
      const diffSecs = Math.max(0, Math.floor((expDate - Date.now()) / 1000));
      setTimeLeft(diffSecs);

      // Countdown timer
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            clearInterval(pollIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Polling kiểm tra trạng thái mỗi 3 giây
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await getPaymentStatus(data.paymentId);
          if (statusRes.status === 'SUCCESS') {
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);
            setPaymentSuccess(true);
            toast.success('Khách hàng đã thanh toán VNPay thành công!');
            setTimeout(() => {
              onSuccess();
            }, 1500);
          } else if (statusRes.status === 'FAILED') {
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);
            setError(statusRes.failureReason || 'Giao dịch thanh toán không thành công.');
          }
        } catch (err) {
          // Bỏ qua lỗi kết nối polling tạm thời
        }
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tạo mã QR VNPay.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!qrData) return;
    try {
      setSimulating(true);
      await simulateQrSuccess(qrData.paymentId);
      clearInterval(pollIntervalRef.current);
      clearInterval(timerIntervalRef.current);
      setPaymentSuccess(true);
      toast.success('Đã giả lập thanh toán VNPay thành công!');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi giả lập thanh toán');
    } finally {
      setSimulating(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatMoney = (val: number) => (Number(val) || 0).toLocaleString('vi-VN') + ' đ';

  return (
    <div className="flex flex-col items-center justify-center py-2 space-y-4 text-center">
      {loading ? (
        <div className="py-16 space-y-3">
          <span className="material-symbols-outlined text-[40px] animate-spin text-primary">progress_activity</span>
          <p className="text-sm text-on-surface-variant font-medium">Đang tạo mã thanh toán VNPay Sandbox...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-error-container/20 border border-error/30 text-error max-w-md w-full space-y-3">
          <span className="material-symbols-outlined text-[36px]">error</span>
          <h4 className="font-bold text-sm">Giao dịch thanh toán không thành công</h4>
          <p className="text-xs text-on-surface-variant">{error}</p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={initQrPayment}
              className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors shadow-sm"
            >
              Thử tạo lại mã QR
            </button>
            <button
              onClick={onSwitchManual}
              className="px-4 py-2 border border-outline-variant text-on-surface rounded-xl text-xs font-medium hover:bg-surface-container-high transition-colors"
            >
              Chuyển sang tiền mặt / thẻ
            </button>
          </div>
        </div>
      ) : paymentSuccess ? (
        <div className="py-12 space-y-4 animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[36px]">check_circle</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-700">Thanh toán hoàn tất!</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Đã nhận đầy đủ <strong>{formatMoney(amountDue)}</strong> qua cổng VNPay.
            </p>
          </div>
        </div>
      ) : qrData ? (
        <>
          {/* Header VNPay Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span>VNPAY-QR (SANDBOX)</span>
          </div>

          <div className="text-display-sm font-extrabold text-on-surface">
            {formatMoney(amountDue)}
          </div>
          <p className="text-xs text-on-surface-variant">
            Hóa đơn: <strong className="font-mono text-primary">{invoiceNumber}</strong> | Mã GD: <span className="font-mono text-xs">{qrData.txnRef}</span>
          </p>

          {/* QR Code Presentation Box */}
          <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-primary/20 relative group">
            <QRCodeSVG
              value={qrData.paymentUrl}
              size={210}
              level="M"
              includeMargin={false}
            />
            {timeLeft <= 0 && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-2xs rounded-2xl flex flex-col items-center justify-center p-4">
                <span className="material-symbols-outlined text-amber-600 text-[32px] mb-1">timer_off</span>
                <p className="text-xs font-bold text-amber-800">Mã QR đã hết hạn</p>
                <button
                  onClick={initQrPayment}
                  className="mt-2 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary-dark transition-colors"
                >
                  Làm mới mã QR
                </button>
              </div>
            )}
          </div>

          {/* Countdown & Instructions */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[16px] text-amber-600">schedule</span>
            <span>Mã hết hạn trong:</span>
            <span className={`font-mono font-bold ${timeLeft < 180 ? 'text-error' : 'text-primary'}`}>
              {formatTimer(timeLeft)}
            </span>
          </div>

          <p className="text-xs text-on-surface-variant max-w-xs">
            Khách hàng quét mã bằng ứng dụng Ngân hàng hoặc Ví VNPAY. Hệ thống sẽ tự động cập nhật ngay khi tiền về!
          </p>

          {/* Action options */}
          <div className="flex flex-wrap gap-2 justify-center pt-2 w-full max-w-sm">
            <a
              href={qrData.paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold rounded-xl border border-outline-variant transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>Mở cổng VNPay</span>
            </a>

            <button
              type="button"
              onClick={handleSimulateSuccess}
              disabled={simulating}
              className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              title="Dành cho kiểm thử / demo"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">bolt</span>
              <span>Giả lập quét xong</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

