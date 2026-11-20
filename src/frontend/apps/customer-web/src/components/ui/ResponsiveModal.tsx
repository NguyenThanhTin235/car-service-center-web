'use client';

import React, { useEffect, useId } from 'react';

export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
  preventBackdropClose?: boolean;
  children: React.ReactNode;
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ResponsiveModalProps['maxWidth']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-4xl',
};

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  description,
  maxWidth = 'lg',
  footer,
  preventBackdropClose = false,
  children,
}: ResponsiveModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !preventBackdropClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, preventBackdropClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      {/* Backdrop Scrim */}
      <div
        className="fixed inset-0 bg-ink-primary/45 transition-opacity"
        onClick={preventBackdropClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet (Mobile) / Centered Dialog (Desktop) — single shadow elevation, no outer border */}
      <div
        className={`relative z-10 w-full ${MAX_WIDTH_CLASSES[maxWidth]} bg-surface-elevated text-ink-primary rounded-t-2xl sm:rounded-2xl shadow-[0_20px_50px_rgba(20,22,25,0.16)] flex flex-col max-h-[90dvh] overflow-hidden pb-safe`}
      >
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
          <span className="w-10 h-1 rounded-full bg-surface-muted" />
        </div>

        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-hairline shrink-0">
            <div className="min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="text-lg sm:text-xl font-bold tracking-[-0.02em] text-ink-primary leading-snug"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descriptionId}
                  className="text-sm text-ink-secondary mt-1 leading-relaxed"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng hộp thoại"
              className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 rounded-xl flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 styled-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-hairline bg-surface-elevated shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
