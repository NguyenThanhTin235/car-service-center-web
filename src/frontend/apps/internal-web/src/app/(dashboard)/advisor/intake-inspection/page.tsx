'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IntakeQueueItem, getIntakeQueue } from '@/lib/api/work-order.api';
import IntakeQueueStats from '@/components/advisor/IntakeQueueStats';
import IntakeQueueTable from '@/components/advisor/IntakeQueueTable';

export default function AdvisorDashboardPage() {
  const [items, setItems] = useState<IntakeQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getIntakeQueue({ search: search || undefined });
      if (response.success) {
        setItems(response.data);
      }
    } catch {
      // Nếu API chưa có data, dùng mock tạm
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Tính toán stats
  const totalQueue = items.length;
  const avgWaitMinutes = items.length > 0
    ? Math.round(
        items.reduce((sum, item) => {
          const diff = Date.now() - new Date(item.arrived_at).getTime();
          return sum + Math.max(0, Math.floor(diff / 60000));
        }, 0) / items.length
      )
    : 0;
  const urgentCount = items.filter((item) => {
    const diff = Date.now() - new Date(item.arrived_at).getTime();
    return Math.floor(diff / 60000) > 30;
  }).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
              Danh sách chờ nhận (Intake Queue)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm font-label-sm font-bold">
              Live Tracker
            </span>
          </div>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Danh sách các phương tiện vừa đến xưởng và đang đợi Cố vấn dịch vụ tiếp nhận, kiểm tra sơ bộ và tạo phiếu công việc.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-label-md font-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Làm mới danh sách
        </button>
      </div>

      {/* Stats Cards */}
      <IntakeQueueStats
        totalQueue={totalQueue}
        avgWaitMinutes={avgWaitMinutes}
        urgentCount={urgentCount}
      />

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-body-sm font-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
            placeholder="Lọc biển số, dòng xe, số máy..."
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-12 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
          <span className="text-body-md font-body-md text-on-surface-variant">Đang tải danh sách...</span>
        </div>
      ) : (
        <IntakeQueueTable items={items} onWorkOrderCreated={fetchQueue} />
      )}

      {/* Compliance Note */}
      <div className="flex items-start gap-3 bg-surface-container-low rounded-xl p-4 border border-outline-variant/40">
        <span className="material-symbols-outlined text-[20px] text-primary flex-shrink-0 mt-0.5">info</span>
        <p className="text-body-sm font-body-sm text-on-surface-variant">
          <strong className="text-on-surface">Quy chuẩn bắt buộc:</strong> Cố vấn dịch vụ cần ghi nhận đầy đủ thông tin (ODO, trầy xước, mức nhiên liệu) trước khi "Tạo phiếu công việc".
        </p>
      </div>
    </div>
  );
}
