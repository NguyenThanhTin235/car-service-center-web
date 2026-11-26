'use client';

import React from 'react';

export type StatusPillTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'sky';

const TONE_MAP: Record<StatusPillTone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-slate-100 text-slate-700', dot: '#64748b' },
  primary: { badge: 'bg-blue-50 text-[#0050cd]', dot: '#0050cd' },
  success: { badge: 'bg-emerald-50 text-emerald-700', dot: '#10b981' },
  warning: { badge: 'bg-amber-50 text-amber-700', dot: '#f59e0b' },
  danger: { badge: 'bg-rose-50 text-rose-700', dot: '#ef4444' },
  purple: { badge: 'bg-purple-50 text-purple-700', dot: '#7c3aed' },
  sky: { badge: 'bg-sky-50 text-sky-700', dot: '#0284c7' },
};

export interface StatusPillProps {
  label: React.ReactNode;
  tone?: StatusPillTone;
  className?: string;
}

/**
 * Shared status/category pill matching the Staff Dashboard ("Điều phối & KTV")
 * pill design: rounded-full, crisp border, and leading status dot.
 */
export default function StatusPill({
  label,
  tone = 'neutral',
  className = '',
}: StatusPillProps) {
  const conf = TONE_MAP[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${conf.badge} ${className}`.trim()}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: conf.dot }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
