'use client';
import React from 'react';

type Props = {
  claimStatus: string;
  holdReason: string;
};

export default function WOStatusControl({ claimStatus, holdReason }: Props) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái</h3>
      <div className="bg-tertiary-container/10 border border-tertiary-container/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-semibold text-on-surface-variant">BẢO HIỂM / BẢO HÀNH</label>
            <select 
              className="h-9 px-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container min-w-[200px]"
              defaultValue={claimStatus}
            >
              <option value="Pending">Chờ phê duyệt</option>
              <option value="Đã phê duyệt">Đã phê duyệt</option>
              <option value="Rejected">Từ chối</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-semibold text-on-surface-variant">LÝ DO TẠM DỪNG / CHỜ</label>
            <select 
              className="h-9 px-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container min-w-[240px]"
              defaultValue={holdReason}
            >
              <option value="None">Không có</option>
              <option value="Chờ phụ tùng">Chờ phụ tùng</option>
              <option value="Awaiting Customer Approval">Chờ khách hàng quyết định</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
            <span className="ml-3 text-label-md font-bold text-on-surface">Tạm dừng</span>
          </label>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant flex items-center gap-1.5 mt-1">
        <span className="material-symbols-outlined text-[16px] text-tertiary">pause_circle</span>
        <span className="font-semibold text-tertiary">Tạm dừng</span> — Chờ phụ tùng. Trạng thái xưởng và trạng thái chờ hoạt động độc lập.
      </p>
    </div>
  );
}
