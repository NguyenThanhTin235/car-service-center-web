'use client';

import React from 'react';
import Link from 'next/link';

export interface AuthSplitShellProps {
  topAction?: {
    href: string;
    label: string;
  };
  children: React.ReactNode;
}

export default function AuthSplitShell({ children }: AuthSplitShellProps) {
  return (
    <div className="min-h-screen w-full bg-canvas text-ink-primary antialiased flex flex-col justify-between">
      {/* Compact Header */}
      <header className="w-full bg-surface-elevated border-b border-hairline shrink-0">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/home" className="inline-flex items-center gap-2.5 group min-h-[44px]">
            <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-[1.03]">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                directions_car
              </span>
            </div>
            <span className="font-bold text-base tracking-[-0.02em] text-ink-primary">
              AutoCare Pro
            </span>
          </Link>

          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-medium text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              arrow_back
            </span>
            <span>Về trang chủ</span>
          </Link>
        </div>
      </header>

      {/* Centered Form Card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-[460px] bg-surface-elevated border border-hairline rounded-2xl p-6 sm:p-8">
          {children}
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full px-4 sm:px-8 py-5 text-center text-xs text-ink-muted shrink-0">
        <span>© 2026 AutoCare Pro · Hỗ trợ kỹ thuật </span>
        <a
          href="tel:19006868"
          className="font-mono tabular-nums font-semibold text-ink-secondary hover:text-accent"
        >
          1900 6868
        </a>
      </footer>
    </div>
  );
}
