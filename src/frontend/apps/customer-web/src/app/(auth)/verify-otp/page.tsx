'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import api from '@/lib/axios';
import { setCredentials } from '@/store/slices/authSlice';
import { getDashboardPathByRole } from '@/utils/roleRedirect';
import OtpInput from '@/components/auth/OtpInput';
import AuthSplitShell from '@/components/auth/AuthSplitShell';
import { AuthAlert, AuthSubmitButton } from '@/components/auth/AuthPrimitives';

export default function VerifyOtpPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState<'register' | 'reset'>('register');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('pendingEmail');
    const storedPurpose = sessionStorage.getItem('otpPurpose') as 'register' | 'reset';
    if (!storedEmail) {
      router.push('/register');
      return;
    }
    setEmail(storedEmail);
    setPurpose(storedPurpose || 'register');
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const otpString = otp.join('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpString.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (purpose === 'register') {
        const res = await api.post('/api/auth/verify-otp-register', { email, otp: otpString });
        const { user, token, refreshToken } = res.data.data;
        const successMsg =
          res.data?.message || 'Đăng ký tài khoản thành công! Chào mừng bạn đến với AutoCare Pro.';
        dispatch(setCredentials({ user, token, refreshToken }));
        sessionStorage.removeItem('pendingEmail');
        sessionStorage.removeItem('otpPurpose');
        sessionStorage.setItem('auth_toast', successMsg);
        setSuccess(`${successMsg} Đang chuyển hướng đến trang chủ...`);

        const redirectPath = getDashboardPathByRole(user.roles);
        setTimeout(() => {
          if (redirectPath.startsWith('http')) {
            window.location.href = redirectPath;
          } else {
            router.push(redirectPath);
          }
        }, 1200);
        return;
      } else {
        await api.post('/api/auth/verify-otp-reset', { email, otp: otpString });
        sessionStorage.setItem('verifiedOtp', otpString);
        router.push('/reset-password');
        return;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không đúng. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      const endpoint =
        purpose === 'register' ? '/api/auth/resend-otp-register' : '/api/auth/resend-otp-reset';
      await api.post(endpoint, { email });
      setSuccess('Mã OTP mới đã được gửi về email của bạn.');
      setOtp(Array(6).fill(''));
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi lại OTP. Vui lòng thử lại.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthSplitShell topAction={{ href: '/login', label: 'Đăng nhập' }}>
      <div className="mb-6 text-center">
        <div className="w-11 h-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-2xl" aria-hidden="true">
            mark_email_read
          </span>
        </div>
        <h1 className="text-2xl font-bold text-ink-primary tracking-[-0.02em]">
          Xác thực mã OTP
        </h1>
        <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">
          Nhập mã 6 chữ số đã được gửi tới{' '}
          <strong className="font-semibold text-ink-primary break-words">{email}</strong>.
        </p>
      </div>

      {error && <AuthAlert variant="error">{error}</AuthAlert>}
      {success && <AuthAlert variant="success">{success}</AuthAlert>}

      <form onSubmit={handleVerify} className="space-y-6">
        <OtpInput value={otp} onChange={setOtp} disabled={loading} />

        <div className="text-center text-xs text-ink-secondary">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="font-semibold text-accent hover:text-accent-hover hover:underline disabled:opacity-60 cursor-pointer min-h-[44px] px-3"
            >
              {resendLoading ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
            </button>
          ) : (
            <span className="inline-flex items-center min-h-[44px]">
              Chưa nhận được mã?{' '}
              <strong className="font-mono tabular-nums text-ink-primary ml-1">
                Gửi lại sau {countdown}s
              </strong>
            </span>
          )}
        </div>

        <AuthSubmitButton
          id="btn-verify-otp"
          loading={loading}
          loadingText="Đang xác nhận..."
          disabled={otpString.length !== 6}
          icon="check_circle"
        >
          Xác nhận mã OTP
        </AuthSubmitButton>
      </form>

      <div className="mt-6 pt-5 border-t border-hairline text-center">
        <Link
          href={purpose === 'register' ? '/register' : '/forgot-password'}
          className="min-h-[44px] text-xs font-semibold text-ink-secondary hover:text-ink-primary inline-flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            arrow_back
          </span>
          <span>Quay lại bước trước</span>
        </Link>
      </div>
    </AuthSplitShell>
  );
}
