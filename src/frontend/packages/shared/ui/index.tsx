'use client';

import React, { useEffect, type RefObject } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { usePathname } from 'next/navigation';

/**
 * Shared Core Web Vitals RUM beacon reporter for both customer-web and internal-web.
 */
export function WebVitalsReporter({ appName }: { appName: 'customer-web' | 'internal-web' }) {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].includes(metric.name)) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const url = `${apiBase}/api/public/web-vitals`;
    const body = JSON.stringify({
      app: appName,
      path: pathname || '/',
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    }
  });

  return null;
}

export interface IconProps {
  name: string;
  className?: string;
  decorative?: boolean;
  label?: string;
}

/**
 * Shared accessible Material Symbols icon wrapper.
 * Hides decorative ligature text from screen readers by default.
 */
export function Icon({ name, className = '', decorative = true, label }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      aria-hidden={decorative && !label ? 'true' : undefined}
      aria-label={!decorative && label ? label : undefined}
      role={!decorative && label ? 'img' : undefined}
    >
      {name}
    </span>
  );
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseDialogA11yOptions {
  isOpen: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  disabled?: boolean;
}

/**
 * Shared WCAG 2.2 AA dialog hook:
 * - Moves initial focus into dialog on open
 * - Traps Tab / Shift+Tab focus inside dialog
 * - Closes on Escape (unless disabled)
 * - Locks body scroll and restores focus on close
 */
export function useDialogA11y({ isOpen, dialogRef, onClose, disabled = false }: UseDialogA11yOptions) {
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const rafId = requestAnimationFrame(() => {
      const container = dialogRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusable[0] ?? container).focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disabled) {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }, [isOpen, dialogRef, onClose, disabled]);
}
