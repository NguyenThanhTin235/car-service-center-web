'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getDashboardPathByRole } from '@/utils/roleRedirect';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getDashboardPathByRole(user.roles);
      router.push(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (isAuthenticated) {
    return null;
  }

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/send-otp-register', {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });

      // Lưu email vào sessionStorage để dùng ở trang verify-otp
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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F0F2F5] text-[#050505] antialiased">
      {/* Ambient Backdrop */}
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
          <div className="flex items-center gap-2 text-[#65676B] bg-[#F0F2F5] px-3 py-1.5 rounded-full border border-gray-200 text-sm">
            <span className="material-symbols-outlined text-[#0866FF] text-[18px]">headset_mic</span>
            <span className="font-medium">Hotline: 1900 6868</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[520px]">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0866FF] border border-blue-100 text-xs font-semibold mb-4">
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Tạo tài khoản mới</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#050505]">Đăng ký tài khoản</h1>
              <p className="text-sm text-[#65676B] mt-1.5">
                Tạo tài khoản để theo dõi xe và đặt lịch dễ dàng
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium flex items-start gap-2 border border-red-100">
                <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#050505] block" htmlFor="fullName">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#65676B]">
                    <span className="material-symbols-outlined text-xl">person</span>
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={form.fullName}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm text-[#050505] placeholder:text-gray-400 focus:border-[#0866FF] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#050505] block" htmlFor="phone">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#65676B]">
                    <span className="material-symbols-outlined text-xl">phone</span>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    value={form.phone}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm text-[#050505] placeholder:text-gray-400 focus:border-[#0866FF] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#050505] block" htmlFor="email">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#65676B]">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm text-[#050505] placeholder:text-gray-400 focus:border-[#0866FF] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#050505] block" htmlFor="password">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#65676B]">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Tối thiểu 8 ký tự"
                    value={form.password}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-11 py-3 text-sm text-[#050505] placeholder:text-gray-400 focus:border-[#0866FF] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#65676B] hover:text-[#050505] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#050505] block" htmlFor="confirmPassword">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#65676B]">
                    <span className="material-symbols-outlined text-xl">lock_reset</span>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-11 py-3 text-sm text-[#050505] placeholder:text-gray-400 focus:border-[#0866FF] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#65676B] hover:text-[#050505] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showConfirm ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  id="btn-register"
                  className="w-full h-12 bg-[#0866FF] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang gửi mã OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng ký</span>
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-[#65676B]">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-semibold text-[#0866FF] hover:underline transition-colors">
                Đăng nhập
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
