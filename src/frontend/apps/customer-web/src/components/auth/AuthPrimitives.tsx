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
      ? 'bg-status-success-soft text-on-secondary-container'
      : variant === 'lock'
      ? 'bg-bronze-soft text-bronze-ink'
      : 'bg-status-danger-soft text-on-error-container';

  const icon =
    variant === 'success' ? 'check_circle' : variant === 'lock' ? 'lock_clock' : 'error';

  return (
    <div
      role="alert"
      className={`mb-5 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2.5 leading-relaxed ${styles}`}
    >
      <span className="material-symbols-outlined text-lg mt-0.5 shrink-0" aria-hidden="true">
        {icon}
      </span>
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
      <label htmlFor={id} className="block text-xs font-semibold text-ink-primary">
        {label} {requiredMark && <span className="text-status-danger">*</span>}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted">
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            {icon}
          </span>
        </div>
        <input
          suppressHydrationWarning
          id={id}
          aria-invalid={Boolean(errorText) || undefined}
          className={`w-full min-h-[44px] pl-11 ${
            rightAdornment ? 'pr-12' : 'pr-3.5'
          } rounded-xl bg-surface-elevated border text-sm text-ink-primary placeholder:text-ink-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-surface-subtle disabled:text-ink-muted disabled:cursor-not-allowed ${
            errorText
              ? 'border-status-danger focus:border-status-danger'
              : 'border-hairline-strong focus:border-accent'
          } ${className}`}
          {...props}
        />
        {rightAdornment && (
          <div className="absolute inset-y-0 right-1 flex items-center">{rightAdornment}</div>
        )}
      </div>
      {errorText && <p className="text-xs font-medium text-status-danger">{errorText}</p>}
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
      className="w-10 h-10 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-lg" aria-hidden="true">
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
      className="w-full min-h-[48px] px-5 rounded-xl bg-accent hover:bg-accent-hover active:scale-[0.99] disabled:bg-surface-muted disabled:text-ink-muted disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{loadingText || 'Đang xử lý...'}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {icon && (
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
}
