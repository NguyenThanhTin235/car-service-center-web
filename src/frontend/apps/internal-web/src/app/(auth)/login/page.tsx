'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/lib/axios';
import { setCredentials, logout } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { getDashboardPathByRole } from '@/utils/roleRedirect';
import AuthSplitShell from '@/components/auth/AuthSplitShell';
import {
  AuthAlert,
  AuthField,
  AuthPasswordToggle,
  AuthSubmitButton,
} from '@/components/auth/AuthPrimitives';

const DEMO_ACCOUNTS = [
  {
    role: 'Quản lý (Manager)',
    email: 'manager3@carservice.com',
    icon: 'monitoring',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/80',
  },
  {
    role: 'Quản trị (Admin)',
    email: 'admin1@carservice.com',
    icon: 'admin_panel_settings',
    badgeClass: 'text-[#0050cd] bg-blue-50 border-blue-200 hover:bg-blue-100/80',
  },
  {
    role: 'Cố vấn (SA)',
    email: 'advisor5@carservice.com',
    icon: 'engineering',
    badgeClass: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100/80',
  },
  {
    role: 'Lễ tân (Desk)',
    email: 'desk9@carservice.com',
    icon: 'support_agent',
    badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100/80',
  },
];

export default function LoginPage() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
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
    if (isAuthenticated && user) {
      const isInternalRole = user.roles?.some((r: string) =>
        ['ADMIN', 'MANAGER', 'DESK STAFF', 'SA'].includes(r)
      );
      if (!isInternalRole) {
        dispatch(logout());
        setError(
          'Phiên đăng nhập trước là tài khoản Khách hàng. Cổng nội bộ yêu cầu tài khoản Quản lý / Nhân viên (Admin, Manager, SA, Desk Staff).'
        );
        return;
      }
      const redirectPath = getDashboardPathByRole(user.roles);
      setTimeout(() => {
        router.replace(redirectPath);
      }, 50);
    }
  }, [isAuthenticated, user, router, dispatch]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setSuccess('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      } else if (params.get('reset') === 'true') {
        setSuccess('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
      } else if (params.get('reason') === 'account_locked') {
        setError('Phiên đăng nhập đã hết hiệu lực hoặc tài khoản đã bị khóa.');
      }
    }
  }, []);

  const isInternalRole = Boolean(
    isAuthenticated &&
      user?.roles?.some((r: string) => ['ADMIN', 'MANAGER', 'DESK STAFF', 'SA'].includes(r))
  );

  if (mounted && isInternalRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8fc]">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-[#0050cd] animate-spin" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { user, token, refreshToken } = res.data.data;
      const isInternal = user.roles?.some((r: string) =>
        ['ADMIN', 'MANAGER', 'DESK STAFF', 'SA'].includes(r)
      );
      if (!isInternal) {
        setError(
          'Tài khoản này là tài khoản Khách hàng, không có quyền truy cập Cổng Quản trị nội bộ. Vui lòng đăng nhập bằng tài khoản Quản lý / Nhân viên hoặc truy cập Cổng Khách hàng (port 3000).'
        );
        setLoading(false);
        return;
      }

      dispatch(setCredentials({ user, token, refreshToken }));
      router.push(getDashboardPathByRole(user.roles));
    } catch (err: any) {
      if (err.response?.status === 429) {
        setLockSeconds(Number(err.response.data?.retryAfter) || 900);
        setPassword('');
      }
      setError(
        err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-[-0.02em]">
          Đăng nhập hệ thống
        </h1>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          Sử dụng tài khoản nhân sự được cấp để truy cập bàn làm việc chuyên môn.
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
          label="Email nhân sự"
          icon="mail"
          placeholder="staff@carservice.com"
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

        {/* Demo Role Quick Fill */}
        <div className="pt-4 mt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-2.5 text-center">
            Tài khoản demo nội bộ (<span className="font-mono">password123</span>)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" suppressHydrationWarning>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                suppressHydrationWarning
                type="button"
                disabled={isLocked}
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('password123');
                }}
                className={`min-h-[44px] px-3 py-2 text-left rounded-xl border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${acc.badgeClass}`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">{acc.icon}</span>
                  <span>{acc.role}</span>
                </div>
                <div className="text-[11px] font-mono truncate opacity-85 mt-0.5">
                  {acc.email}
                </div>
              </button>
            ))}
          </div>
        </div>
      </form>
    </AuthSplitShell>
  );
}
