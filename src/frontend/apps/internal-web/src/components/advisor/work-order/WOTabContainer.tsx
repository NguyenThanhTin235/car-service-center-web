'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import TabCheckinInspection from './tabs/TabCheckinInspection';
import { WorkOrder } from '@/lib/api/work-order.api';

const TabSkeleton = () => (
  <div className="space-y-4 p-4 animate-pulse">
    <div className="h-6 w-48 bg-slate-200 rounded-lg" />
    <div className="h-32 w-full bg-slate-100 rounded-xl" />
    <div className="h-48 w-full bg-slate-100 rounded-xl" />
  </div>
);

const TabJob = dynamic(() => import('./tabs/TabJob'), { loading: TabSkeleton });
const TabParts = dynamic(() => import('./tabs/TabParts'), { loading: TabSkeleton });
const TabQuotation = dynamic(() => import('./tabs/TabQuotation'), { loading: TabSkeleton });
const TabQC = dynamic(() => import('./tabs/TabQC'), { loading: TabSkeleton });
const TabRelease = dynamic(() => import('./tabs/TabRelease'), { loading: TabSkeleton });

const TABS = [
  { id: 'checkin', number: 1, label: 'Tiếp nhận & Kiểm tra', component: TabCheckinInspection },
  { id: 'job', number: 2, label: 'Hạng mục sửa chữa', component: TabJob },
  { id: 'parts', number: 3, label: 'Phụ tùng', component: TabParts },
  { id: 'quotation', number: 4, label: 'Báo giá', component: TabQuotation },
  { id: 'qc', number: 5, label: 'Kiểm tra chất lượng', component: TabQC },
  { id: 'release', number: 6, label: 'Giao xe', component: TabRelease },
] as const;

const VALID_TAB_IDS = new Set<string>(TABS.map((t) => t.id));

interface WOTabContainerProps {
  workOrder: WorkOrder;
  refetchWO: () => void;
  isReadOnly?: boolean;
}

export default function WOTabContainer({
  workOrder,
  refetchWO,
  isReadOnly = false,
}: WOTabContainerProps) {
  const [activeTab, setActiveTab] = useState<string>('checkin');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(['checkin']));

  // Read initial ?tab= from window.location.search on mount so F5 preserves active tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const param = new URLSearchParams(window.location.search).get('tab');
    if (param && VALID_TAB_IDS.has(param)) {
      setActiveTab(param);
      setVisitedTabs((prev) => {
        if (prev.has(param)) return prev;
        const next = new Set(prev);
        next.add(param);
        return next;
      });
    }
  }, []);

  const handleSelectTab = useCallback((tabId: string) => {
    if (!VALID_TAB_IDS.has(tabId)) return;
    setActiveTab(tabId);
    setVisitedTabs((prev) => {
      if (prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.add(tabId);
      return next;
    });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.toString());
    }
  }, []);

  const isEffectiveReadOnly =
    isReadOnly || ['CLOSED', 'CANCELLED', 'RELEASED'].includes(workOrder?.status || '');

  const tabCounts = useMemo<Record<string, number>>(() => {
    const servicesCount = workOrder.services?.length || 0;
    const partsCount =
      workOrder.services?.reduce(
        (acc, s) => acc + (s.jobs?.reduce((jAcc, j) => jAcc + (j.parts?.length || 0), 0) || 0),
        0
      ) || 0;
    const findingsCount = workOrder.inspections?.[0]?.findings?.length || 0;
    return {
      checkin: findingsCount,
      job: servicesCount,
      parts: partsCount,
    };
  }, [workOrder.services, workOrder.inspections]);

  return (
    <div className="flex flex-col w-full">
      {/* Segmented Pill Tab Navigation (Touch-First 44px Targets) */}
      <div className="bg-[#f2f4f8] p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#0050cd] text-white shadow-sm'
                  : 'text-slate-600 hover:text-zinc-900 hover:bg-white/60'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-extrabold ${
                  isActive ? 'bg-white text-[#0050cd]' : 'bg-white text-slate-600'
                }`}
              >
                {tab.number}
              </span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Keep-Alive Tab Content Area: mount on first visit, preserve state via CSS visibility */}
      <div className="pt-5">
        {TABS.map((tab) => {
          if (!visitedTabs.has(tab.id)) return null;
          const isActive = activeTab === tab.id;
          const TabComponent = tab.component;
          return (
            <div key={tab.id} className={isActive ? 'block' : 'hidden'}>
              <TabComponent
                workOrder={workOrder}
                refetchWO={refetchWO}
                isReadOnly={isEffectiveReadOnly}
                setActiveTab={handleSelectTab}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
