'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { profileApi } from '@/lib/api/profile.api';

export default function ProfileSecurityForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checks = useMemo(
    () => ({
      minLen: newPassword.length >= 8,
      hasLetterAndNum: /[A-Za-z]/.test(newPassword) && /\d/.test(newPassword),
      notSameAsCurrent: !currentPassword || newPassword !== currentPassword,
      matchesConfirm: confirmPassword.length > 0 && newPassword === confirmPassword,
    }),
    [currentPassword, newPassword, confirmPassword]
  );

  const canSubmit =
    !submitting &&
    currentPassword.length > 0 &&
    checks.minLen &&
    checks.notSameAsCurrent &&
    checks.matchesConfirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!checks.minLen) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (!checks.notSameAsCurrent) {
      setErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }
    if (!checks.matchesConfirm) {
      setErrorMsg('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await profileApi.changeMyPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Đổi mật khẩu đăng nhập
        </h3>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          Sử dụng mật khẩu mạnh và thay đổi định kỳ để bảo vệ tài khoản vận hành nội bộ.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2.5"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Current Password (Full width) */}
        <div className="space-y-1.5">
          <label
            htmlFor="security-current-password"
            className="block text-xs font-semibold text-slate-800"
          >
            Mật khẩu hiện tại <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              id="security-current-password"
              data-testid="security-input-current"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setErrorMsg(null);
              }}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu hiện tại"
              className="w-full min-h-[44px] pl-3.5 pr-11 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0050cd] focus:ring-2 focus:ring-[#0050cd]/30"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">
                {showCurrent ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* New Password + Confirm Password (2-column balanced row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor="security-new-password"
              className="block text-xs font-semibold text-slate-800"
            >
              Mật khẩu mới <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                id="security-new-password"
                data-testid="security-input-new"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrorMsg(null);
                }}
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                className="w-full min-h-[44px] pl-3.5 pr-11 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0050cd] focus:ring-2 focus:ring-[#0050cd]/30"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">
                  {showNew ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="security-confirm-password"
              className="block text-xs font-semibold text-slate-800"
            >
              Xác nhận mật khẩu mới <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                id="security-confirm-password"
                data-testid="security-input-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMsg(null);
                }}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                className="w-full min-h-[44px] pl-3.5 pr-11 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0050cd] focus:ring-2 focus:ring-[#0050cd]/30"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">
                  {showConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Password Checklist (Full-width inset tonal surface, 3-col responsive) */}
        <div className="rounded-xl bg-slate-50/90 p-4 space-y-2.5">
          <p className="text-xs font-semibold text-slate-700">Yêu cầu mật khẩu</p>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <li className={`flex items-center gap-2 ${checks.minLen ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
              <span className="material-symbols-outlined text-[16px] shrink-0">
                {checks.minLen ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>Tối thiểu 8 ký tự</span>
            </li>
            <li className={`flex items-center gap-2 ${checks.hasLetterAndNum ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
              <span className="material-symbols-outlined text-[16px] shrink-0">
                {checks.hasLetterAndNum ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>Kết hợp chữ và số</span>
            </li>
            <li className={`flex items-center gap-2 ${checks.matchesConfirm ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
              <span className="material-symbols-outlined text-[16px] shrink-0">
                {checks.matchesConfirm ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>Xác nhận trùng khớp</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action Bar */}
      <div className="pt-5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-500">
          Sau khi đổi mật khẩu, hãy dùng mật khẩu mới cho lần đăng nhập tiếp theo.
        </p>
        <button
          type="submit"
          data-testid="security-submit-btn"
          disabled={!canSubmit}
          className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 shrink-0 transition-all duration-150 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined text-[17px] animate-spin">
                progress_activity
              </span>
              <span>Đang cập nhật...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[17px]">key</span>
              <span>Cập nhật mật khẩu</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
