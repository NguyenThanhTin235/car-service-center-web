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
    <div className="flex flex-col gap-5 px-4 sm:px-6 py-3 max-w-[1440px] mx-auto w-full">
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
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-bold text-zinc-800 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
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
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/70 shadow-xs flex flex-col gap-5">
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
          <div className="flex items-center justify-center h-48">
            <span className="material-symbols-outlined animate-spin text-[32px] text-[#0050cd]">
              progress_activity
            </span>
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
