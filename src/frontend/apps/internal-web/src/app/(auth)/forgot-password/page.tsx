'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      // Lưu email và purpose vào sessionStorage
      sessionStorage.setItem('pendingEmail', email);
      sessionStorage.setItem('otpPurpose', 'reset');
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToOtp = () => {
    router.push('/verify-otp');
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
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-500 text-4xl">lock_reset</span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-[#050505]">Khôi phục mật khẩu</h1>
              <p className="text-sm text-[#65676B] mt-2 leading-relaxed">
                Nhập email của bạn để nhận mã khôi phục mật khẩu
              </p>
            </div>

            {!sent ? (
              <>
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2 border border-red-100">
                    <span className="material-symbols-outlined text-[1.125rem]">error</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#050505] block" htmlFor="forgot-email">
                      Địa chỉ Email
                    </label>
                    <div className="relative rounded-xl">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#65676B]">
                        <span className="material-symbols-outlined text-xl">mail</span>
                      </div>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        className="block w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm text-[#050505] placeholder:text-gray-400 focus:border-[#0866FF] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    id="btn-forgot-password"
                    className="w-full h-12 bg-[#0866FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">send</span>
                        <span>Gửi mã xác nhận</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Success state */
              <div className="text-center space-y-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 border border-green-100 mx-auto">
                  <span className="material-symbols-outlined text-green-600 text-3xl">mark_email_read</span>
                </div>
                <div>
                  <p className="text-sm text-[#65676B] leading-relaxed">
                    Nếu email <span className="font-semibold text-[#050505]">{email}</span> tồn tại trong hệ thống, mã OTP sẽ được gửi trong vài giây. Hãy kiểm tra hộp thư (bao gồm cả mục Spam).
                  </p>
                </div>
                <button
                  onClick={handleGoToOtp}
                  className="w-full h-12 bg-[#0866FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  <span>Nhập mã OTP</span>
                </button>
              </div>
            )}

            {/* Back link */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-[#65676B] hover:text-[#050505] inline-flex items-center gap-1 transition-colors"
              >
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
