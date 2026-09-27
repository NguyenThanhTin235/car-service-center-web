'use client';
import React, { useState } from 'react';
import TabCheckinInspection from './tabs/TabCheckinInspection';
import TabJob from './tabs/TabJob';
import TabParts from './tabs/TabParts';
import TabQuotation from './tabs/TabQuotation';
import TabQC from './tabs/TabQC';
import TabRelease from './tabs/TabRelease';
import TabClaimInfo from './tabs/TabClaimInfo';
import TabServiceHistory from './tabs/TabServiceHistory';

const TABS = [
  { id: 'checkin', number: 1, label: 'Tiếp nhận & Kiểm tra', component: TabCheckinInspection },
  { id: 'job', number: 2, label: 'Hạng mục sửa chữa', component: TabJob },
  { id: 'parts', number: 3, label: 'Phụ tùng', component: TabParts },
  { id: 'quotation', number: 4, label: 'Báo giá', component: TabQuotation },
  { id: 'qc', number: 5, label: 'Kiểm tra chất lượng', component: TabQC },
  { id: 'release', number: 6, label: 'Giao xe', component: TabRelease },
  { id: 'claim', number: 7, label: 'Thông tin bảo hiểm', component: TabClaimInfo },
  { id: 'history', number: 8, label: 'Lịch sử sửa chữa', component: TabServiceHistory },
];

export default function WOTabContainer() {
  const [activeTab, setActiveTab] = useState('checkin');

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || TabCheckinInspection;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-outline-variant/60 overflow-x-auto no-scrollbar pt-2 shrink-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold transition-colors whitespace-nowrap
                ${isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-t-lg'
                }
              `}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                isActive ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
              }`}>
                {tab.number}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="py-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
