'use client';

import React, { useEffect, useState } from 'react';
import IntakeQueueStats from '@/components/advisor/IntakeQueueStats';
import IntakeQueueTable from '@/components/advisor/IntakeQueueTable';
import { IntakeQueueItem, getIntakeQueue } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

export default function IntakeQueuePage() {
  const [items, setItems] = useState<IntakeQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'QUEUED' | 'CONVERTED' | 'CANCELLED'>('QUEUED');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await getIntakeQueue();
      if (res.success) {
        setItems(res.data);
      }
    } catch {
      toast.error('Lỗi tải danh sách chờ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const totalQueue = items.filter((i) => i.status === 'QUEUED').length;
  const convertedCount = items.filter((i) => i.status === 'CONVERTED').length;
  let totalWaitMinutes = 0;
  let urgentCount = 0;

  items
    .filter((i) => i.status === 'QUEUED')
    .forEach((item) => {
      const diff = Date.now() - new Date(item.arrived_at).getTime();
      const waitMins = Math.floor(diff / 60000);
      totalWaitMinutes += Math.max(0, waitMins);
      if (waitMins > 30) urgentCount++;
    });

  const avgWaitMinutes = totalQueue > 0 ? Math.floor(totalWaitMinutes / totalQueue) : 0;

  return (
    <div className="flex flex-col gap-5 px-3 sm:px-5 lg:px-6 py-3 max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
            Danh sách xe đang chờ
          </h1>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-bold text-zinc-800 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span>Làm mới</span>
        </button>
      </div>

      {/* 3-Tone Hero Bento Stats */}
      <IntakeQueueStats
        totalQueue={totalQueue}
        avgWaitMinutes={avgWaitMinutes}
        urgentCount={urgentCount}
        convertedCount={convertedCount}
      />

      {/* Main Bento Table Workspace */}
      <div className="bg-white rounded-[28px] p-4 sm:p-5 lg:p-6 border border-slate-200/70 shadow-xs flex flex-col gap-5">
        {/* Segmented Pill Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="bg-[#f2f4f8] p-1.5 rounded-2xl inline-flex items-center gap-1 flex-wrap">
            {(['QUEUED', 'CONVERTED', 'CANCELLED'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const count = items.filter((r) => r.status === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer min-h-[40px] ${
                    isActive
                      ? 'bg-[#0050cd] text-white shadow-xs'
                      : 'text-slate-600 hover:text-zinc-900'
                  }`}
                >
                  <span>
                    {tab === 'QUEUED' && 'Chờ xử lý'}
                    {tab === 'CONVERTED' && 'Đã chuyển phiếu'}
                    {tab === 'CANCELLED' && 'Đã hủy'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-extrabold tabular-nums ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-zinc-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col" aria-busy="true" aria-label="Đang tải danh sách xe đang chờ">
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 pl-2 pr-1.5 sm:pl-3 sm:pr-2 lg:pl-4 w-10 sm:w-12 text-center">#</th>
                    <th className="py-3.5 px-2 sm:px-3 lg:px-4">Thông tin xe & Biển số</th>
                    <th className="py-3.5 px-3 lg:px-4 hidden lg:table-cell">Loại dịch vụ</th>
                    <th className="py-3.5 px-2 sm:px-3 lg:px-4 hidden sm:table-cell">Khách hàng</th>
                    <th className="py-3.5 px-2 sm:px-3 lg:px-4 whitespace-nowrap">Thời gian chờ</th>
                    <th className="py-3.5 pl-2 pr-2 sm:pr-3 lg:pr-4 text-right whitespace-nowrap">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3.5 sm:py-4 pl-2 pr-1.5 sm:pl-3 sm:pr-2 lg:pl-4 text-center align-top sm:align-middle">
                        <div className="h-4 w-5 bg-slate-200 rounded mx-auto" />
                      </td>
                      <td className="py-3.5 sm:py-4 px-2 sm:px-3 lg:px-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0">
                          <div className="h-7 w-24 bg-slate-200 rounded-xl shrink-0" />
                          <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                            <div className="h-4 w-32 bg-slate-200 rounded" />
                            <div className="h-3 w-28 bg-slate-100 rounded sm:hidden" />
                            <div className="h-5 w-20 bg-slate-100 rounded-full lg:hidden" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 lg:px-4 hidden lg:table-cell">
                        <div className="h-6 w-28 bg-slate-200 rounded-full" />
                      </td>
                      <td className="py-4 px-2 sm:px-3 lg:px-4 hidden sm:table-cell">
                        <div className="flex flex-col gap-1.5">
                          <div className="h-4 w-28 bg-slate-200 rounded" />
                          <div className="h-3 w-20 bg-slate-100 rounded" />
                        </div>
                      </td>
                      <td className="py-3.5 sm:py-4 px-2 sm:px-3 lg:px-4 whitespace-nowrap">
                        <div className="h-5 w-20 bg-slate-200 rounded" />
                      </td>
                      <td className="py-3.5 sm:py-4 pl-2 pr-2 sm:pr-3 lg:pr-4 text-right">
                        <div className="flex justify-end gap-2 shrink-0">
                          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 animate-pulse">
              <div className="h-4 w-40 bg-slate-100 rounded" />
              <div className="h-8 w-28 bg-slate-100 rounded-xl" />
            </div>
          </div>
        ) : (
          <IntakeQueueTable
            items={items.filter((i) => i.status === activeTab)}
            onWorkOrderCreated={fetchQueue}
          />
        )}
      </div>
    </div>
  );
}
