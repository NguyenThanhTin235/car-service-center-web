import React from 'react';

export type StatusTone =
  | 'neutral'
  | 'accent'
  | 'bronze'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface StatusBadgeProps {
  tone?: StatusTone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-surface-subtle text-ink-secondary',
  accent: 'bg-accent-soft text-accent-ink',
  bronze: 'bg-bronze-soft text-bronze-ink',
  success: 'bg-status-success-soft text-[#0A5B34]',
  warning: 'bg-status-warning-soft text-[#853D06]',
  danger: 'bg-status-danger-soft text-[#8B1515]',
  info: 'bg-status-info-soft text-[#134266]',
};

const DOT_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-ink-muted',
  accent: 'bg-accent',
  bronze: 'bg-bronze',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
  info: 'bg-status-info',
};

export default function StatusBadge({
  tone = 'neutral',
  dot = false,
  pulse = false,
  className = '',
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`.trim()}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${DOT_CLASSES[tone]}`}
            />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${DOT_CLASSES[tone]}`}
          />
        </span>
      )}
      {children}
    </span>
  );
}
