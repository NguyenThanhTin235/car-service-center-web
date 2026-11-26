'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/lib/axios';
import { setCredentials } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { getDashboardPathByRole } from '@/utils/roleRedirect';
import {
  isSafeRedirectPath,
  PENDING_BOOKING_INTENT_KEY,
} from '@/components/chat/aiChatUtils';
import AuthSplitShell from '@/components/auth/AuthSplitShell';
import {
  AuthAlert,
  AuthField,
  AuthPasswordToggle,
  AuthSubmitButton,
} from '@/components/auth/AuthPrimitives';

export default function LoginPage() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [lockSeconds, setLockSeconds] = useState(0);
  const isLocked = lockSeconds > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const timer = setTimeout(() => {
      setLockSeconds((s) => {
        if (s <= 1) setError('');
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [lockSeconds]);

  const resolvePostLoginDestination = (roles: string[]) => {
    const isCustomer = roles.some((r) => r.toUpperCase() === 'CUSTOMER');
    if (isCustomer && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      if (isSafeRedirectPath(redirectParam)) {
        return redirectParam!;
      }
      if (window.sessionStorage.getItem(PENDING_BOOKING_INTENT_KEY)) {
        return '/customer/profile?tab=appointments&openBooking=1';
      }
    }
    return getDashboardPathByRole(roles);
  };

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      window.location.href = resolvePostLoginDestination(user.roles);
    }
  }, [mounted, isAuthenticated, user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setSuccess('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      } else if (params.get('reset') === 'true') {
        setSuccess('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { user: loggedInUser, token, refreshToken } = res.data.data;
      dispatch(setCredentials({ user: loggedInUser, token, refreshToken }));
      window.location.href = resolvePostLoginDestination(loggedInUser.roles);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setLockSeconds(Number(err.response.data?.retryAfter) || 900);
        setPassword('');
      }
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

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

  return (
    <AuthSplitShell topAction={{ href: '/register', label: 'Đăng ký' }}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink-primary tracking-[-0.02em]">Đăng nhập</h1>
        <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">
          Truy cập hồ sơ xe, đặt lịch hẹn và theo dõi tiến độ sửa chữa của bạn.
        </p>
      </div>

      {success && <AuthAlert variant="success">{success}</AuthAlert>}

      {error && (
        <AuthAlert variant={isLocked ? 'lock' : 'error'}>
          <div className="space-y-1">
            <span>{error}</span>
            {isLocked && (
              <p className="text-xs">
                Thử lại sau{' '}
                <strong className="font-mono tabular-nums">
                  {String(Math.floor(lockSeconds / 60)).padStart(2, '0')}:
                  {String(lockSeconds % 60).padStart(2, '0')}
                </strong>
                {' · '}
                <Link href="/forgot-password" className="underline font-semibold">
                  Quên mật khẩu?
                </Link>
              </p>
            )}
          </div>
        </AuthAlert>
      )}

      <form suppressHydrationWarning className="space-y-4" onSubmit={handleLogin}>
        <AuthField
          id="email"
          name="email"
          type="email"
          label="Địa chỉ Email"
          icon="mail"
          placeholder="example@gmail.com"
          required
          disabled={isLocked}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          suppressHydrationWarning
        />

        <AuthField
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Mật khẩu"
          icon="lock"
          placeholder="Nhập mật khẩu"
          required
          disabled={isLocked}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          suppressHydrationWarning
          rightAdornment={
            <AuthPasswordToggle
              visible={showPassword}
              disabled={isLocked}
              onToggle={() => setShowPassword((v) => !v)}
            />
          }
        />

        <div className="flex items-center justify-end pt-0.5">
          <Link
            href="/forgot-password"
            className="inline-flex items-center min-h-[44px] text-xs font-semibold text-accent hover:text-accent-hover hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <div className="pt-1">
          <AuthSubmitButton
            loading={loading}
            loadingText="Đang xác thực..."
            disabled={isLocked}
          >
            {isLocked ? 'Tạm khóa đăng nhập' : 'Đăng nhập'}
          </AuthSubmitButton>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-hairline text-center text-xs text-ink-secondary">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-accent hover:text-accent-hover hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </AuthSplitShell>
  );
}
