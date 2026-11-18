'use client';

import React, { useState } from 'react';
import TabCheckinInspection from './tabs/TabCheckinInspection';
import TabJob from './tabs/TabJob';
import TabParts from './tabs/TabParts';
import TabQuotation from './tabs/TabQuotation';
import TabQC from './tabs/TabQC';
import TabRelease from './tabs/TabRelease';
import { WorkOrder } from '@/lib/api/work-order.api';

const TABS = [
  { id: 'checkin', number: 1, label: 'Tiếp nhận & Kiểm tra', component: TabCheckinInspection },
  { id: 'job', number: 2, label: 'Hạng mục sửa chữa', component: TabJob },
  { id: 'parts', number: 3, label: 'Phụ tùng', component: TabParts },
  { id: 'quotation', number: 4, label: 'Báo giá', component: TabQuotation },
  { id: 'qc', number: 5, label: 'Kiểm tra chất lượng', component: TabQC },
  { id: 'release', number: 6, label: 'Giao xe', component: TabRelease },
];

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
  const [activeTab, setActiveTab] = useState('checkin');

  const isEffectiveReadOnly =
    isReadOnly || ['CLOSED', 'CANCELLED', 'RELEASED'].includes(workOrder?.status || '');
  const ActiveComponent =
    TABS.find((t) => t.id === activeTab)?.component || TabCheckinInspection;

  return (
    <div className="flex flex-col w-full">
      {/* Segmented Pill Tab Navigation (Touch-First 44px Targets) */}
      <div className="bg-[#f2f4f8] p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="pt-5">
        <ActiveComponent
          workOrder={workOrder}
          refetchWO={refetchWO}
          isReadOnly={isEffectiveReadOnly}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}
