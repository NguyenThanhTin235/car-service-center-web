'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface TelemetryBarItem {
  label: string;
  count: number;
  pct: number;
  tag?: string;
}

export interface TelemetryFilterTab {
  id: string;
  label: string;
}

export interface DashboardTelemetryMiniBarsProps {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionTitle?: string;
  items: TelemetryBarItem[];
  tabs?: TelemetryFilterTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  isLoading?: boolean;
}

export const DashboardTelemetryMiniBars: React.FC<DashboardTelemetryMiniBarsProps> = ({
  title,
  subtitle,
  actionHref,
  actionTitle = 'Xem chi tiết',
  items = [],
  tabs,
  activeTab,
  onTabChange,
  isLoading = false,
}) => {
  const [internalTab, setInternalTab] = useState(tabs?.[0]?.id || 'ALL');
  const currentTab = activeTab || internalTab;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[28px] p-5 shadow-xs border border-slate-200/70 dark:border-slate-800 animate-pulse space-y-4">
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        <div className="h-9 w-full bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalTab(tabId);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[28px] p-5 shadow-xs border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
      {/* Title & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {actionHref && (
          <Link
            href={actionHref}
            className="text-slate-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title={actionTitle}
          >
            <span className="material-symbols-outlined text-[18px]">north_east</span>
          </Link>
        )}
      </div>

      {/* Vertical Mini-Bars with Top Caps */}
      <div
        className="grid gap-2 items-end h-36 my-4 pt-4 px-1"
        style={{ gridTemplateColumns: `repeat(${items.length > 0 ? items.length : 5}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const barH = Math.max(18, Math.min(95, item.pct || 30));
          return (
            <div key={item.label} className="flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 mb-1 tabular-nums">
                {item.pct}%
              </span>
              <div
                style={{ height: `${barH}%` }}
                className="w-3 bg-[#0c2340] dark:bg-blue-600 rounded-t-xs relative group cursor-pointer transition-all"
                title={`${item.label}: ${item.count} (${item.pct}%)`}
              >
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#0050cd] dark:bg-cyan-400 shadow-xs" />
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-2 truncate max-w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Segmented Pill Toggle (nếu có tabs) */}
      {tabs && tabs.length > 0 && (
        <div
          className="bg-[#f2f4f8] dark:bg-slate-800 rounded-2xl p-1 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === tab.id
                  ? 'bg-[#0050cd] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardTelemetryMiniBars;
