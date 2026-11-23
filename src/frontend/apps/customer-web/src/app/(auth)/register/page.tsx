'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import api from '@/lib/axios';
import { RootState } from '@/store';
import { getDashboardPathByRole } from '@/utils/roleRedirect';
import AuthSplitShell from '@/components/auth/AuthSplitShell';
import {
  AuthAlert,
  AuthField,
  AuthPasswordToggle,
  AuthSubmitButton,
} from '@/components/auth/AuthPrimitives';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      window.location.href = getDashboardPathByRole(user.roles);
    }
  }, [mounted, isAuthenticated, user]);

  const passwordChecks = useMemo(
    () => ({
      minLen: form.password.length >= 8,
      matches: form.confirmPassword.length > 0 && form.password === form.confirmPassword,
    }),
    [form.password, form.confirmPassword]
  );

  if (mounted && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-secondary font-medium">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = form.fullName.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!/^[\p{L}\s]+$/u.test(trimmedName)) {
      setError('Vui lòng nhập họ và tên hợp lệ, không nhập số hoặc ký tự đặc biệt.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/send-otp-register', {
        fullName: trimmedName,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });

      sessionStorage.setItem('pendingEmail', form.email);
      sessionStorage.setItem('otpPurpose', 'register');
      router.push('/verify-otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell topAction={{ href: '/login', label: 'Đăng nhập' }}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink-primary tracking-[-0.02em]">
          Đăng ký tài khoản
        </h1>
        <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">
          Tạo tài khoản khách hàng để đặt lịch bảo dưỡng và quản lý phương tiện.
        </p>
      </div>

      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="fullName"
          name="fullName"
          type="text"
          label="Họ và tên"
          icon="person"
          placeholder="Nguyễn Văn An"
          requiredMark
          value={form.fullName}
          onChange={handleChange}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField
            id="phone"
            name="phone"
            type="tel"
            label="Số điện thoại"
            icon="phone"
            placeholder="0901234567"
            requiredMark
            className="font-mono tabular-nums"
            value={form.phone}
            onChange={handleChange}
          />
          <AuthField
            id="email"
            name="email"
            type="email"
            label="Email"
            icon="mail"
            placeholder="name@email.com"
            requiredMark
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Mật khẩu"
            icon="lock"
            placeholder="8+ ký tự"
            requiredMark
            value={form.password}
            onChange={handleChange}
            rightAdornment={
              <AuthPasswordToggle
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            }
          />

          <AuthField
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            label="Xác nhận mật khẩu"
            icon="lock_reset"
            placeholder="Nhập lại"
            requiredMark
            value={form.confirmPassword}
            onChange={handleChange}
            rightAdornment={
              <AuthPasswordToggle
                visible={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
              />
            }
          />
        </div>

        {/* Password rules (tonal inset, zero nested border) */}
        <div className="rounded-xl bg-surface-subtle px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 ${
              passwordChecks.minLen ? 'text-on-secondary-container font-medium' : 'text-ink-muted'
            }`}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              {passwordChecks.minLen ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            Tối thiểu 8 ký tự
          </span>
          <span
            className={`inline-flex items-center gap-1.5 ${
              passwordChecks.matches ? 'text-on-secondary-container font-medium' : 'text-ink-muted'
            }`}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              {passwordChecks.matches ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            Khớp mật khẩu xác nhận
          </span>
        </div>

        <div className="pt-1">
          <AuthSubmitButton id="btn-register" loading={loading} loadingText="Đang gửi mã OTP...">
            Đăng ký &amp; Nhận mã OTP
          </AuthSubmitButton>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-hairline text-center text-xs text-ink-secondary">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-semibold text-accent hover:text-accent-hover hover:underline">
          Đăng nhập
        </Link>
      </div>
    </AuthSplitShell>
  );
}
