import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${className}`.trim()}
    >
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.025em] text-ink-primary leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-ink-secondary leading-relaxed max-w-[65ch] mt-1.5">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </div>
  );
}
