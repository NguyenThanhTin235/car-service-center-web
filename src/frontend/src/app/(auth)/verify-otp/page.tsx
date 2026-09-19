'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import api from '@/lib/axios';
import { setCredentials } from '@/store/slices/authSlice';
import { getDashboardPathByRole } from '@/utils/roleRedirect';
import OtpInput from '@/components/auth/OtpInput';

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

  // Countdown timer
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
        const { user } = res.data.data;
        dispatch(setCredentials({ user }));
        sessionStorage.removeItem('pendingEmail');
        sessionStorage.removeItem('otpPurpose');
        const redirectPath = getDashboardPathByRole(user.roles);
        router.push(redirectPath);
      } else {
        // reset password: redirect to reset-password page with otp
        sessionStorage.setItem('verifiedOtp', otpString);
        router.push('/reset-password');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không đúng. Vui lòng thử lại.');
    } finally {
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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F0F2F5] antialiased">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-7xl mx-auto">
          <Link href="/home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#0866FF] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <span className="material-symbols-outlined text-white text-[22px]">directions_car</span>
            </div>
            <div>
              <div className="font-bold text-lg text-[#050505] leading-tight">AutoCare Pro</div>
              <div className="text-xs text-[#65676B]">Hệ thống Dịch vụ Ô tô Thông minh</div>
            </div>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[460px]">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-lg">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#0866FF] text-4xl">mark_email_read</span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-[#050505]">Xác thực mã OTP</h1>
              <p className="text-sm text-[#65676B] mt-2 leading-relaxed">
                Vui lòng nhập mã gồm 6 chữ số đã được gửi đến
                <br />
                <span className="font-semibold text-[#050505]">{email}</span>
              </p>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium flex items-start gap-2 border border-red-100">
                <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium flex items-start gap-2 border border-green-100">
                <span className="material-symbols-outlined text-sm mt-0.5">check_circle</span>
                {success}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              {/* OTP Input */}
              <OtpInput value={otp} onChange={setOtp} disabled={loading} />

              {/* Resend */}
              <div className="text-center text-sm text-[#65676B]">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="font-semibold text-[#0866FF] hover:underline transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                  </button>
                ) : (
                  <span>
                    Chưa nhận được mã?{' '}
                    <span className="font-semibold text-[#050505]">
                      Gửi lại sau {countdown}s
                    </span>
                  </span>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || otpString.length !== 6}
                id="btn-verify-otp"
                className="w-full h-12 bg-[#0866FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xác nhận...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    <span>Xác nhận</span>
                  </>
                )}
              </button>
            </form>

            {/* Back link */}
            <div className="mt-6 text-center">
              <Link
                href={purpose === 'register' ? '/register' : '/forgot-password'}
                className="text-sm text-[#65676B] hover:text-[#050505] inline-flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Quay lại
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-4 text-center z-10 relative">
        <div className="max-w-7xl mx-auto text-xs text-[#65676B]">
          © 2025 AutoCare Pro Service Center. Bản quyền được bảo lưu.
        </div>
      </footer>
    </div>
  );
}
