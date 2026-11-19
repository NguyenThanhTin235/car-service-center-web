'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/lib/axios';
import { setCredentials } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { getDashboardPathByRole } from '@/utils/roleRedirect';
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

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (lockSeconds <= 0) return;
    const timer = setTimeout(() => {
      setLockSeconds((s) => {
        if (s <= 1) setError('');
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [lockSeconds]);

  React.useEffect(() => {
    if (mounted && isAuthenticated && user) {
      window.location.href = getDashboardPathByRole(user.roles);
    }
  }, [mounted, isAuthenticated, user]);

  React.useEffect(() => {
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
      const { user, token, refreshToken } = res.data.data;
      dispatch(setCredentials({ user, token, refreshToken }));
      window.location.href = getDashboardPathByRole(user.roles);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setLockSeconds(Number(err.response.data?.retryAfter) || 900);
        setPassword('');
      }
      setError(
        err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại sau.'
      );
      setLoading(false);
    }
  };

  if (mounted && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8fc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#0050cd] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthSplitShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-[-0.02em]">
          Đăng nhập
        </h1>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
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
                <Link href="/forgot-password" className="underline font-bold">
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

        <div className="flex items-center justify-between pt-0.5">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none min-h-[36px]">
            <input
              suppressHydrationWarning
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#0050cd] focus:ring-[#0050cd]/30 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-600">Ghi nhớ đăng nhập</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-[#0050cd] hover:text-[#0866ff] hover:underline"
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

      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-bold text-[#0050cd] hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </AuthSplitShell>
  );
}
