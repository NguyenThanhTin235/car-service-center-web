'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyVnpayReturn } from '@/lib/api/payment.api';

interface VnpayReturnResult {
  isSuccess: boolean;
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  transactionRef: string;
  vnpayTransactionNo?: string | null;
  responseCode: string;
  message: string;
}

function VnpayReturnContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<VnpayReturnResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      params[key] = val;
    });

    if (Object.keys(params).length === 0) {
      setLoading(false);
      setErrorMessage('Không nhận được tham số giao dịch từ cổng VNPay.');
      return;
    }

    verifyVnpayReturn(params)
      .then((data) => {
        setResult(data);
      })
      .catch((err: any) => {
        const msg = err.response?.data?.message || err.message || 'Xác thực kết quả thanh toán thất bại';
        setErrorMessage(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  const formatMoney = (val: number | undefined) =>
    (Number(val) || 0).toLocaleString('vi-VN') + ' đ';

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-on-surface">Đang kiểm tra kết quả giao dịch VNPay...</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Hệ thống đang đối soát dữ liệu và chữ ký điện tử với cổng thanh toán.
        </p>
      </div>
    );
  }

  if (errorMessage && !result) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-surface-container rounded-2xl p-6 sm:p-8 shadow-xl border border-error/20 text-center">
          <div className="w-16 h-16 rounded-full bg-error-container text-error mx-auto flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <h2 className="text-2xl font-bold text-error mb-2">Lỗi xác thực</h2>
          <p className="text-sm text-on-surface-variant mb-6">{errorMessage}</p>

          <Link
            href="/staff/billing"
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition shadow"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Về danh sách hóa đơn
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = result?.isSuccess === true;

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-white dark:bg-surface-container rounded-3xl p-6 sm:p-8 shadow-2xl border border-outline-variant/30 text-center">
        {/* Status Icon */}
        <div
          className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-5 ${
            isSuccess
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
          }`}
        >
          <span className="material-symbols-outlined text-5xl">
            {isSuccess ? 'check_circle' : 'cancel'}
          </span>
        </div>

        {/* Title */}
        <h1
          className={`text-2xl sm:text-3xl font-extrabold mb-2 ${
            isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán không thành công'}
        </h1>
        <p className="text-sm text-on-surface-variant mb-6">
          {result?.message || (isSuccess ? 'Giao dịch đã được ghi nhận.' : 'Giao dịch thất bại hoặc bị hủy.')}
        </p>

        {/* Transaction Details Box */}
        <div className="bg-surface-container-low dark:bg-surface-container-high rounded-2xl p-4 sm:p-5 text-left space-y-2.5 text-sm mb-6 border border-outline-variant/40">
          <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
            <span className="text-on-surface-variant">Mã hóa đơn:</span>
            <span className="font-bold text-primary">{result?.invoiceNumber || '—'}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
            <span className="text-on-surface-variant">Mã giao dịch AutoCare:</span>
            <span className="font-mono font-medium text-on-surface">{result?.transactionRef || '—'}</span>
          </div>

          {result?.vnpayTransactionNo && (
            <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Mã GD VNPay:</span>
              <span className="font-mono text-on-surface">{result.vnpayTransactionNo}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
            <span className="text-on-surface-variant">Số tiền:</span>
            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
              {formatMoney(result?.amount)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-on-surface-variant">Mã phản hồi cổng:</span>
            <span className="font-mono px-2 py-0.5 rounded bg-surface-container-highest text-xs font-semibold">
              {result?.responseCode || '—'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {result?.invoiceId ? (
            <Link
              href={`/staff/billing/${result.invoiceId}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition shadow-md"
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              Xem hóa đơn
            </Link>
          ) : null}

          <Link
            href="/staff/billing"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold transition border border-outline-variant/50"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Hàng đợi thanh toán
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VnpayReturnContent />
    </Suspense>
  );
}

