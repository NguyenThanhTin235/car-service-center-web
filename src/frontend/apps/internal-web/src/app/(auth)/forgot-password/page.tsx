'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import AuthSplitShell from '@/components/auth/AuthSplitShell';
import { AuthAlert, AuthField, AuthSubmitButton } from '@/components/auth/AuthPrimitives';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      sessionStorage.setItem('pendingEmail', email);
      sessionStorage.setItem('otpPurpose', 'reset');
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell topAction={{ href: '/login', label: 'Đăng nhập' }}>
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[26px]">lock_reset</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-[-0.02em]">
          Khôi phục mật khẩu
        </h1>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          Nhập email nhân sự để nhận mã OTP xác thực đặt lại mật khẩu mới.
        </p>
      </div>

      {!sent ? (
        <>
          {error && <AuthAlert variant="error">{error}</AuthAlert>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthField
              id="forgot-email"
              type="email"
              label="Email nhân sự"
              icon="mail"
              placeholder="staff@carservice.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <AuthSubmitButton id="btn-forgot-submit" loading={loading} loadingText="Đang gửi mã...">
              Gửi mã xác nhận
            </AuthSubmitButton>
          </form>
        </>
      ) : (
        <div className="space-y-5">
          <AuthAlert variant="success">
            Nếu email <strong className="break-words">{email}</strong> tồn tại trong hệ thống, mã OTP 6 chữ số đã được gửi tới hộp thư của bạn.
          </AuthAlert>

          <button
            type="button"
            id="btn-go-to-otp"
            onClick={() => router.push('/verify-otp')}
            className="w-full min-h-[48px] px-5 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">pin</span>
            <span>Nhập mã OTP ngay</span>
          </button>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link
          href="/login"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Quay lại Đăng nhập</span>
        </Link>
      </div>
    </AuthSplitShell>
  );
}
