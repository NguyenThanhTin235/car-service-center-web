'use client';

import React from 'react';

interface IntakeQueueStatsProps {
  totalQueue: number;
  avgWaitMinutes: number;
  urgentCount: number;
  convertedCount?: number;
}

export default function IntakeQueueStats({
  totalQueue,
  avgWaitMinutes,
  urgentCount,
  convertedCount = 0,
}: IntakeQueueStatsProps) {
  const totalProcessed = totalQueue + convertedCount;
  const queuedPct =
    totalProcessed > 0 ? Math.round((totalQueue / totalProcessed) * 100) : totalQueue > 0 ? 100 : 25;
  const convertedPct = 100 - queuedPct;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* CARD 1: DARK NAVY (#0c2340) — Total Queued Vehicles */}
      <div className="bg-[#0c2340] text-white rounded-[28px] p-5 flex flex-col justify-between min-h-[185px] shadow-md">
        <div>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Tổng Xe Chờ Tiếp Nhận</span>
            <span className="material-symbols-outlined text-[18px]">directions_car</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums">
              {totalQueue}
            </span>
            <span className="text-xs font-semibold text-zinc-400">xe trong hàng chờ</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-zinc-400">Đã lập phiếu hôm nay</span>
          <span className="bg-white text-zinc-900 font-mono font-extrabold px-2.5 py-0.5 rounded-lg text-[11px] tabular-nums">
            {convertedCount} xe
          </span>
        </div>
      </div>

      {/* CARD 2: VIBRANT ROYAL BLUE (#0050cd) — Queue Conversion Split Bar */}
      <div className="bg-[#0050cd] text-white rounded-[28px] p-5 flex flex-col justify-between min-h-[185px] shadow-md shadow-[#0050cd]/20">
        <div>
          <div className="flex items-center justify-between text-blue-100 text-xs font-medium">
            <span>Thời Gian Chờ Trung Bình</span>
            <span className="material-symbols-outlined text-[18px]">schedule</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums">
              {avgWaitMinutes}
            </span>
            <span className="text-xs font-semibold text-blue-100">phút / xe</span>
          </div>
        </div>

        <div className="mt-3">
          <div className="bg-[#0c2340] rounded-2xl p-1.5 flex items-stretch h-11 gap-1.5">
            <div
              style={{ width: `${Math.max(25, Math.min(75, queuedPct))}%` }}
              className="bg-white text-zinc-900 rounded-xl px-2.5 py-1 flex items-center font-mono font-extrabold text-xs tabular-nums"
            >
              {queuedPct}% chờ
            </div>
            <div className="flex-1 text-white px-2.5 py-1 flex items-center font-mono font-extrabold text-xs tabular-nums">
              {convertedPct}% xong
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: SOFT COOL SLATE (#e4e7ec) — Urgent / Over 30m Alert */}
      <div className="bg-[#e4e7ec] text-zinc-900 rounded-[28px] p-5 flex flex-col justify-between min-h-[185px] shadow-xs sm:col-span-2 lg:col-span-1">
        <div>
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
            <span>Ưu Tiên Cao / Chờ Quá 30 Phút</span>
            <span
              className={`material-symbols-outlined text-[18px] ${
                urgentCount > 0 ? 'text-rose-600' : 'text-slate-500'
              }`}
            >
              priority_high
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span
              className={`font-mono text-3xl font-extrabold tracking-tight tabular-nums ${
                urgentCount > 0 ? 'text-rose-600' : 'text-zinc-900'
              }`}
            >
              {urgentCount}
            </span>
            <span
              className={`text-xs font-bold ${
                urgentCount > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {urgentCount > 0 ? 'Cần tiếp nhận gấp' : 'Đảm bảo SLA'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-300/80 flex items-center justify-between text-xs">
          <span className="text-slate-600">Ngưỡng cảnh báo tiếp nhận</span>
          <span className="bg-[#0c2340] text-white font-mono font-bold px-2.5 py-0.5 rounded-lg text-[11px]">
            SLA ≤ 30p
          </span>
        </div>
      </div>
    </div>
  );
}
