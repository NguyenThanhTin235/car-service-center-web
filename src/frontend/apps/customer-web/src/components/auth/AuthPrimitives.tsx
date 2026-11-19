'use client';

import React from 'react';

export function AuthAlert({
  variant = 'error',
  children,
}: {
  variant?: 'error' | 'success' | 'lock';
  children: React.ReactNode;
}) {
  const styles =
    variant === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : variant === 'lock'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : 'bg-rose-50 border-rose-200 text-rose-700';

  const icon =
    variant === 'success' ? 'check_circle' : variant === 'lock' ? 'lock_clock' : 'error';

  return (
    <div
      role="alert"
      className={`mb-5 px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium flex items-start gap-2.5 leading-relaxed ${styles}`}
    >
      <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: string;
  requiredMark?: boolean;
  rightAdornment?: React.ReactNode;
  errorText?: string;
}

export function AuthField({
  id,
  label,
  icon,
  requiredMark,
  rightAdornment,
  errorText,
  className = '',
  ...props
}: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-800">
        {label} {requiredMark && <span className="text-rose-600">*</span>}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <span className="material-symbols-outlined text-[19px]">{icon}</span>
        </div>
        <input
          suppressHydrationWarning
          id={id}
          aria-invalid={Boolean(errorText) || undefined}
          className={`w-full min-h-[44px] pl-11 ${
            rightAdornment ? 'pr-11' : 'pr-3.5'
          } rounded-xl bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cd]/25 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
            errorText
              ? 'border-rose-500 focus:border-rose-500'
              : 'border-slate-300 focus:border-[#0050cd]'
          } ${className}`}
          {...props}
        />
        {rightAdornment && (
          <div className="absolute inset-y-0 right-1 flex items-center">{rightAdornment}</div>
        )}
      </div>
      {errorText && <p className="text-xs font-medium text-rose-600">{errorText}</p>}
    </div>
  );
}

export function AuthPasswordToggle({
  visible,
  onToggle,
  disabled,
}: {
  visible: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      suppressHydrationWarning
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[19px]">
        {visible ? 'visibility_off' : 'visibility'}
      </span>
    </button>
  );
}

export function AuthSubmitButton({
  loading,
  loadingText,
  disabled,
  icon = 'arrow_forward',
  children,
  id,
}: {
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  icon?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <button
      suppressHydrationWarning
      id={id}
      type="submit"
      disabled={loading || disabled}
      className="w-full min-h-[48px] px-5 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{loadingText || 'Đang xử lý...'}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {icon && <span className="material-symbols-outlined text-[19px]">{icon}</span>}
        </>
      )}
    </button>
  );
}
