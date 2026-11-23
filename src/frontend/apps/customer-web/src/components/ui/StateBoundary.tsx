import React from 'react';
import Link from 'next/link';
import SurfaceCard from './SurfaceCard';

export interface LoadingSkeletonProps {
  variant?: 'cards';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  count = 3,
  className = '',
}: LoadingSkeletonProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse ${className}`.trim()}
      aria-busy="true"
      aria-label="Đang tải nội dung"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-40 rounded-2xl bg-surface-elevated border border-hairline p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 rounded-md bg-surface-subtle" />
            <div className="h-6 w-20 rounded-full bg-surface-subtle" />
          </div>
          <div className="h-4 w-3/4 rounded bg-surface-subtle" />
          <div className="h-3 w-1/2 rounded bg-surface-subtle" />
        </div>
      ))}
    </div>
  );
}

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <SurfaceCard variant="elevated" padding="lg" className={`text-center ${className}`.trim()}>
      <div className="max-w-md mx-auto py-4 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-subtle text-ink-secondary flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-ink-primary">{title}</h3>
        <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">{description}</p>
        {action && (
          <div className="mt-5">
            {action.href ? (
              <Link
                href={action.href}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all duration-150"
              >
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all duration-150"
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Không thể tải dữ liệu',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <SurfaceCard variant="elevated" padding="lg" className={`text-center ${className}`.trim()}>
      <div className="max-w-md mx-auto py-4 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-status-danger-soft text-status-danger flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-2xl">error_outline</span>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-ink-primary">{title}</h3>
        <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-surface-subtle text-ink-primary text-sm font-semibold hover:bg-surface-muted active:scale-[0.98] transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Thử lại
          </button>
        )}
      </div>
    </SurfaceCard>
  );
}
