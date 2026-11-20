import React from 'react';

export interface LicensePlateTagProps {
  plate: string;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<LicensePlateTagProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export default function LicensePlateTag({
  plate,
  size = 'sm',
  className = '',
}: LicensePlateTagProps) {
  return (
    <span
      className={`inline-flex items-center font-mono tabular-nums font-semibold tracking-[0.04em] uppercase bg-surface-elevated text-ink-primary border border-hairline-strong rounded-md leading-none whitespace-nowrap ${SIZE_CLASSES[size]} ${className}`.trim()}
    >
      {plate}
    </span>
  );
}
