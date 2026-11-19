'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import AuthSplitShell from '@/components/auth/AuthSplitShell';
import {
  AuthAlert,
  AuthField,
  AuthPasswordToggle,
  AuthSubmitButton,
} from '@/components/auth/AuthPrimitives';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('pendingEmail');
    const storedOtp = sessionStorage.getItem('verifiedOtp');
    const storedPurpose = sessionStorage.getItem('otpPurpose');

    if (!storedEmail || storedPurpose !== 'reset') {
      router.push('/forgot-password');
      return;
    }
    setEmail(storedEmail);
    if (storedOtp) setOtp(storedOtp);
  }, [router]);

  useEffect(() => {
    if (!success) return;
    if (countdown === 0) {
      router.push('/login');
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, router]);

  const checks = useMemo(
    () => ({
      minLen: newPassword.length >= 8,
      matches: confirmPassword.length > 0 && newPassword === confirmPassword,
    }),
    [newPassword, confirmPassword]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { email, otp, newPassword });
      sessionStorage.removeItem('pendingEmail');
      sessionStorage.removeItem('otpPurpose');
      sessionStorage.removeItem('verifiedOtp');
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell topAction={{ href: '/login', label: 'Đăng nhập' }}>
      {success ? (
        <div className="text-center space-y-5 py-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-[-0.02em]">
              Đặt lại mật khẩu thành công
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Mật khẩu mới đã được áp dụng. Tự động chuyển về trang đăng nhập sau{' '}
              <strong className="font-mono tabular-nums text-[#0050cd]">{countdown}s</strong>...
            </p>
          </div>
          <Link
            href="/login"
            className="w-full min-h-[48px] px-5 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[19px]">login</span>
            <span>Đăng nhập ngay</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0050cd] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[26px]">key</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-[-0.02em]">
              Đặt lại mật khẩu
            </h1>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Thiết lập mật khẩu mới cho tài khoản{' '}
              <strong className="font-semibold text-slate-900 break-all">{email}</strong>.
            </p>
          </div>

          {error && <AuthAlert variant="error">{error}</AuthAlert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthField
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              label="Mật khẩu mới"
              icon="lock"
              placeholder="Tối thiểu 8 ký tự"
              requiredMark
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              rightAdornment={
                <AuthPasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              }
            />

            <AuthField
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              label="Xác nhận mật khẩu mới"
              icon="lock_reset"
              placeholder="Nhập lại mật khẩu mới"
              requiredMark
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              rightAdornment={
                <AuthPasswordToggle
                  visible={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                />
              }
            />

            <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 ${
                  checks.minLen ? 'text-emerald-700 font-medium' : 'text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {checks.minLen ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                Tối thiểu 8 ký tự
              </span>
              <span
                className={`inline-flex items-center gap-1.5 ${
                  checks.matches ? 'text-emerald-700 font-medium' : 'text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {checks.matches ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                Khớp mật khẩu xác nhận
              </span>
            </div>

            <div className="pt-1">
              <AuthSubmitButton
                id="btn-reset-submit"
                loading={loading}
                loadingText="Đang cập nhật..."
                icon="check_circle"
              >
                Cập nhật mật khẩu
              </AuthSubmitButton>
            </div>
          </form>
        </>
      )}
    </AuthSplitShell>
  );
}
