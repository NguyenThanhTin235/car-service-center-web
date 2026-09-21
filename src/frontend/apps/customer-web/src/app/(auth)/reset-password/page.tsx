'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

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
    if (storedOtp) {
      setOtp(storedOtp);
    }
  }, [router]);

  useEffect(() => {
    if (success) {
      if (countdown === 0) {
        router.push('/login');
        return;
      }
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success, countdown, router]);

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
      // Clear session data
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

  if (success) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-lg max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-[#050505] mb-3">Thành công!</h2>
          <p className="text-sm text-[#65676B] mb-8 leading-relaxed">
            Mật khẩu của bạn đã được cập nhật thành công. Đang tự động chuyển về trang đăng nhập sau <span className="font-bold text-[#0866FF]">{countdown}s</span>...
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full h-12 bg-[#0866FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all"
          >
            <span className="material-symbols-outlined text-xl">login</span>
            Đến trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

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
                <span className="material-symbols-outlined text-[#0866FF] text-4xl">key</span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-[#050505]">Đặt lại mật khẩu</h1>
              <p className="text-sm text-[#65676B] mt-2">
                Vui lòng nhập mật khẩu mới cho tài khoản của bạn
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2 border border-red-100">
                <span className="material-symbols-outlined text-[1.125rem]">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* OTP field (nếu chưa có từ sessionStorage) */}
              {!otp && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#050505] block" htmlFor="otp">
                    Mã OTP <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-xl">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#65676B]">
                      <span className="material-symbols-outlined text-xl">shield</span>
                    </div>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="6 chữ số"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm text-[#050505] placeholder:text-gray-400 focus:border-[#0866FF] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all tracking-widest"
                    />
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#050505] block" htmlFor="newPassword">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#65676B]">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </div>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Tối thiểu 8 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-11 py-3 text-sm text-[#050505] placeholder:text-gray-400 focus:border-[#0866FF] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#65676B] hover:text-[#050505] transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#050505] block" htmlFor="confirmNewPassword">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#65676B]">
                    <span className="material-symbols-outlined text-xl">lock_reset</span>
                  </div>
                  <input
                    id="confirmNewPassword"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-11 py-3 text-sm text-[#050505] placeholder:text-gray-400 focus:border-[#0866FF] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#65676B] hover:text-[#050505] transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-xl">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  id="btn-reset-password"
                  className="w-full h-12 bg-[#0866FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">save</span>
                      <span>Cập nhật mật khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Back */}
            <div className="mt-6 text-center">
              <Link href="/login"
                className="text-sm text-[#65676B] hover:text-[#050505] inline-flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Quay lại đăng nhập
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
