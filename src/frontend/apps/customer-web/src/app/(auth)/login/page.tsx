"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import api from '@/lib/axios';
import { setCredentials } from '@/store/slices/authSlice';
import { getDashboardPathByRole } from '@/utils/roleRedirect';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function LoginPage() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const router = useRouter();
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getDashboardPathByRole(user.roles);
      router.push(redirectPath);
    }
  }, [isAuthenticated, user, router]);

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

  if (isAuthenticated) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password });
      
      const { user } = res.data.data;
      dispatch(setCredentials({ user }));
      
      // Redirect based on role
      const redirectPath = getDashboardPathByRole(user.roles);
      router.push(redirectPath);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-surface-container-low text-on-surface antialiased selection:bg-primary-container selection:text-white">
      {/* Ambient Backdrop Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary-fixed/35 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-secondary-fixed/20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full bg-surface-bright/80 blur-2xl"></div>
      </div>

      {/* Minimal Brand Header */}
      <header className="bg-surface-container-lowest shadow-sm docked full-width top-0 z-30 sticky">
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-7xl mx-auto">
          <Link className="flex items-center gap-3 group focus:outline-none" href="/home">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm group-hover:scale-105 transition-transform duration-200">
              <span className="material-symbols-outlined text-[24px]">directions_car</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm font-bold text-primary tracking-tight">AutoCare Pro</span>
              <span className="text-body-sm text-on-surface-variant -mt-0.5">Hệ thống Dịch vụ Ô tô Thông minh</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <a className="text-on-surface-variant hover:text-on-surface transition-colors text-label-md" href="#">Tra cứu dịch vụ</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-colors text-label-md" href="#">Bảng giá bảo dưỡng</a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/40 text-label-md">
              <span className="material-symbols-outlined text-primary-container text-[18px]">help_outline</span>
              <span className="font-medium">Hotline: 1900 6868</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Auth Presentation Canvas */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12 h-screen">
        <div className="w-full max-w-[480px]">
          {/* Auth Elevation Level 3 Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 sm:p-10 shadow-[0_12px_28px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.04)] transition-all">
            
            {/* Card Brand Identity & Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/40 text-primary border border-primary-fixed text-label-sm mb-4">
                <span className="material-symbols-outlined text-sm">build</span>
                <span>Hệ thống Dịch vụ Ô tô Uy tín</span>
              </div>
              <h1 className="text-headline-lg font-bold text-on-surface">Đăng nhập</h1>
              <p className="text-body-md text-on-surface-variant mt-1.5">Chào mừng bạn quay lại Car Service Center</p>
            </div>

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-body-sm font-medium border border-green-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error-container text-error text-body-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[1.125rem]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form Fields */}
            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Input 1: Email */}
              <div className="space-y-1.5">
                <label className="text-label-md font-medium text-on-surface block" htmlFor="email">
                  Địa chỉ Email
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </div>
                  <input
                    className="block w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-11 pr-4 py-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Input 2: Password */}
              <div className="space-y-1.5">
                <label className="text-label-md font-medium text-on-surface block" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </div>
                  <input
                    className="block w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-11 pr-11 py-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    title="Hiện/Ẩn mật khẩu"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Extras Row */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input className="h-4 w-4 rounded border-outline-variant text-primary-container focus:ring-primary-container/30 cursor-pointer" type="checkbox" />
                  <span className="text-body-md text-on-surface-variant">Ghi nhớ đăng nhập</span>
                </label>
                <Link className="text-label-md text-primary-container hover:underline transition-colors" href="/forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Primary Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary-container hover:bg-primary active:scale-[0.99] text-on-primary font-bold rounded-xl shadow-md shadow-primary-container/25 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  <span>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</span>
                  {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
              </div>
            </form>
          </div>

            {/* Register link */}
            <div className="mt-6 text-center text-body-md text-on-surface-variant">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-semibold text-primary-container hover:underline transition-colors">
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </main>

      {/* Legal & Service Center Standard Footer */}
      <div className="w-full bg-surface-container-lowest/60 border-t border-outline-variant/30 py-3 px-4 text-center z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
            <span>Bảo mật chuẩn SSL 256-bit</span>
          </div>
          <span className="hidden sm:inline text-outline-variant">•</span>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary-container text-[18px]">headset_mic</span>
            <span>Hỗ trợ kỹ thuật 24/7: 1900 6868</span>
          </div>
        </div>
      </div>
      <footer className="bg-surface-container-lowest docked full-width bottom-0 z-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-2">
            <span className="text-title-md font-bold text-on-surface">AutoCare Pro</span>
            <span className="text-body-sm text-on-surface-variant">| © 2025 AutoCare Pro Service Center. Bản quyền thuộc về Hệ thống Dịch vụ Ô tô Thông minh.</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-label-sm">
            <a className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer duration-150" href="#">Quy định bảo hành</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer duration-150" href="#">Chính sách bảo mật</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer duration-150" href="#">Điều khoản sử dụng</a>
            <a className="text-primary font-medium hover:text-primary transition-colors cursor-pointer duration-150" href="#">Hotline khẩn cấp 24/7</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
