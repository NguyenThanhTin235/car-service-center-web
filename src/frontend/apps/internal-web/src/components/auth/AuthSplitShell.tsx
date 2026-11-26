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

export default function AuthSplitShell({ topAction, children }: AuthSplitShellProps) {
  const customerHomeUrl = `${(
    process.env.NEXT_PUBLIC_CUSTOMER_URL || 'http://localhost:3000'
  ).replace(/\/+$/, '')}/home`;

  return (
    <div className="min-h-screen w-full bg-[#f6f8fc] text-slate-900 antialiased flex flex-col justify-between">
      {/* Compact Enterprise Header */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/login" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#0050CD] text-white flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-[1.03]">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">directions_car</span>
            </div>
            <div>
              <div className="font-bold text-base tracking-[-0.02em] text-slate-900 leading-tight">
                AutoCare Pro
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                Cổng Vận Hành Nội Bộ
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href={customerHomeUrl}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-2 py-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>Cổng Khách hàng</span>
            </a>
          </div>
        </div>
      </header>

      {/* Centered Form Surface */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-[480px] bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          {children}
        </div>
      </main>

      {/* Minimal Enterprise Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>© 2026 AutoCare Pro Service Center • Internal ERP</span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">
                verified
              </span>
              SSL 256-bit
            </span>
            <span className="font-mono tabular-nums">IT Helpdesk: 1900 6868</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
