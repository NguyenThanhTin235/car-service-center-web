import React from 'react';

export interface SurfaceCardProps {
  variant?: 'elevated' | 'subtle' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
  className?: string;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<SurfaceCardProps['variant']>, string> = {
  elevated: 'bg-surface-elevated border border-hairline rounded-2xl',
  subtle: 'bg-surface-subtle rounded-2xl',
  interactive:
    'bg-surface-elevated border border-hairline rounded-2xl transition-colors duration-150 hover:border-hairline-strong',
};

const PADDING_CLASSES: Record<NonNullable<SurfaceCardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export default function SurfaceCard({
  variant = 'elevated',
  padding = 'md',
  as: Component = 'div',
  className = '',
  children,
}: SurfaceCardProps) {
  return (
    <Component
      className={`${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
