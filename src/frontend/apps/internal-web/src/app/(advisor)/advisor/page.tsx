'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  WorkOrder,
  IntakeQueueItem,
  getWorkOrders,
  getIntakeQueue,
} from '@/lib/api/work-order.api';
import { WO_STATUS_META } from '@/components/advisor/work-order/work-order.constants';
import { DashboardStageBars } from '@/components/dashboard/DashboardStageBars';

export default function SADashboardPage() {
  const router = useRouter();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [intakeItems, setIntakeItems] = useState<IntakeQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive filter states for right-column Bento widgets & table
  const [categoryPeriod, setCategoryPeriod] = useState<'ALL' | 'ACTIVE' | 'WAITING'>('ALL');
  const [queueFilter, setQueueFilter] = useState<'QUEUED' | 'CONVERTED' | 'ALL'>('QUEUED');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [woRes, queueRes] = await Promise.all([
        getWorkOrders({ page: 1, limit: 50 }).catch(() => ({
          success: false,
          data: [] as WorkOrder[],
        })),
        getIntakeQueue().catch(() => ({
          success: false,
          data: [] as IntakeQueueItem[],
        })),
      ]);

      if (woRes.success && Array.isArray(woRes.data)) {
        setWorkOrders(woRes.data);
      }
      if (queueRes.success && Array.isArray(queueRes.data)) {
        setIntakeItems(queueRes.data);
      }
      if (!woRes.success && !queueRes.success) {
        setError('Không thể tải dữ liệu tổng quan xưởng dịch vụ.');
      }
    } catch {
      setError('Không thể tải dữ liệu tổng quan xưởng dịch vụ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived real metrics
  const metrics = useMemo(() => {
    const totalWOs = workOrders.length;
    const activeWOs = workOrders.filter((w) =>
      ['DRAFT', 'IN_PLANNING', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS'].includes(w.status)
    ).length;
    const waitingApprovalWOs = workOrders.filter(
      (w) => w.status === 'PENDING_APPROVAL' || w.status === 'IN_PLANNING'
    ).length;
    const completedOrReadyWOs = workOrders.filter((w) =>
      ['BILLING_REQUESTED', 'FINANCIAL_CLEARED', 'RELEASED', 'CLOSED'].includes(w.status)
    ).length;

    const queuedCount = intakeItems.filter((i) => i.status === 'QUEUED').length;
    const convertedCount = intakeItems.filter((i) => i.status === 'CONVERTED').length;
    const totalIntake = intakeItems.length || 1;
    const queuedPct = intakeItems.length > 0 ? Math.round((queuedCount / totalIntake) * 100) : 30;
    const convertedPct = 100 - queuedPct;

    const completionRate = totalWOs > 0 ? Math.round((completedOrReadyWOs / totalWOs) * 100) : 100;

    return {
      totalWOs,
      activeWOs,
      waitingApprovalWOs,
      completedOrReadyWOs,
      queuedCount,
      convertedCount,
      totalIntake: intakeItems.length,
      queuedPct,
      convertedPct,
      completionRate,
    };
  }, [workOrders, intakeItems]);

  // Stage distribution bars for Middle Wide Bento Card
  const stageBars = useMemo(() => {
    const stages = [
      { key: 'DRAFT', label: 'Tiếp nhận' },
      { key: 'IN_PLANNING', label: 'Kế hoạch', highlight: true },
      { key: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
      { key: 'APPROVED', label: 'Đã duyệt' },
      { key: 'IN_PROGRESS', label: 'Đang sửa' },
      { key: 'BILLING_REQUESTED', label: 'Chờ TT' },
      { key: 'FINANCIAL_CLEARED', label: 'Chờ giao' },
      { key: 'CLOSED', label: 'Hoàn tất' },
    ];

    const statusCounts: Record<string, number> = {};
    for (const w of workOrders) {
      const key = w.status === 'RELEASED' ? 'CLOSED' : w.status;
      statusCounts[key] = (statusCounts[key] || 0) + 1;
    }

    const maxCount = Math.max(1, ...stages.map((s) => statusCounts[s.key] || 0));

    return stages.map((s, idx) => {
      const count = statusCounts[s.key] || 0;
      const solidHeightPct =
        workOrders.length > 0
          ? Math.max(22, Math.round((count / maxCount) * 75))
          : [48, 72, 40, 56, 68, 36, 52, 44][idx % 8];
      const hatchHeightPct = Math.min(25, 95 - solidHeightPct);

      return {
        ...s,
        count,
        solidHeightPct,
        hatchHeightPct,
      };
    });
  }, [workOrders]);

  // Filtered work orders for Bottom Wide Table Card
  const displayedWorkOrders = useMemo(() => {
    let list = [...workOrders];
    if (categoryPeriod === 'ACTIVE') {
      list = list.filter((w) => ['IN_PROGRESS', 'APPROVED'].includes(w.status));
    } else if (categoryPeriod === 'WAITING') {
      list = list.filter((w) => ['DRAFT', 'IN_PLANNING', 'PENDING_APPROVAL'].includes(w.status));
    }
    return list.slice(0, 6);
  }, [workOrders, categoryPeriod]);

  // Intake type breakdown for Right Column Bar Widget
  const intakeBreakdown = useMemo(() => {
    const filtered =
      queueFilter === 'ALL'
        ? intakeItems
        : intakeItems.filter((i) => i.status === queueFilter);

    const walkIn = filtered.filter((i) => i.intake_type === 'WALK_IN').length;
    const appointment = filtered.filter((i) => i.intake_type === 'APPOINTMENT').length;
    const towIn = filtered.filter((i) => i.intake_type === 'TOW_IN').length;
    const urgent = filtered.filter((i) => {
      const mins = Math.floor((Date.now() - new Date(i.arrived_at).getTime()) / 60000);
      return mins > 30;
    }).length;
    const normal = Math.max(0, filtered.length - urgent);

    const bars = [
      { label: 'Vãng lai', count: walkIn, pct: filtered.length ? Math.round((walkIn / filtered.length) * 100) : 0 },
      { label: 'Đặt hẹn', count: appointment, pct: filtered.length ? Math.round((appointment / filtered.length) * 100) : 0 },
      { label: 'Cứu hộ', count: towIn, pct: filtered.length ? Math.round((towIn / filtered.length) * 100) : 0 },
      { label: 'Đúng hạn', count: normal, pct: filtered.length ? Math.round((normal / filtered.length) * 100) : 0 },
      { label: 'Ưu tiên', count: urgent, pct: filtered.length ? Math.round((urgent / filtered.length) * 100) : 0 },
    ];
    return bars;
  }, [intakeItems, queueFilter]);

  const donutSlices = useMemo(() => {
    const circumference = 2 * Math.PI * 54; // ~339.29
    const planningCount = workOrders.filter((w) => ['DRAFT', 'IN_PLANNING'].includes(w.status)).length;
    const inProgressCount = workOrders.filter((w) => ['APPROVED', 'IN_PROGRESS'].includes(w.status)).length;
    const approvalCount = workOrders.filter((w) => ['PENDING_APPROVAL', 'BILLING_REQUESTED'].includes(w.status)).length;
    const doneCount = workOrders.filter((w) => ['FINANCIAL_CLEARED', 'RELEASED', 'CLOSED'].includes(w.status)).length;
    const total = planningCount + inProgressCount + approvalCount + doneCount;

    if (total === 0) return [];

    const raw = [
      { key: 'inProgress', count: inProgressCount, color: '#0c2340', strokeWidth: 28 },
      { key: 'planning', count: planningCount, color: '#0050cd', strokeWidth: 28 },
      { key: 'approval', count: approvalCount, color: '#60a5fa', strokeWidth: 24 },
      { key: 'done', count: doneCount, color: '#cbd5e1', strokeWidth: 24 },
    ].filter((s) => s.count > 0);

    let offset = 0;
    return raw.map((s) => {
      const length = Math.max(4, (s.count / total) * circumference - (raw.length > 1 ? 4 : 0));
      const slice = { ...s, length, offset: -offset, circumference };
      offset += (s.count / total) * circumference;
      return slice;
    });
  }, [workOrders]);

  return (
    <div className="py-3 max-w-[1440px] mx-auto w-full">
      <h1 className="sr-only">Bàn làm việc Cố vấn dịch vụ</h1>
      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* MAIN ASYMMETRICAL BENTO GRID (Matches Uploaded Reference Image Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* ==================== LEFT WORKSPACE COLUMN (8/12 on lg, 9/12 on xl) ==================== */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4 sm:gap-5">
          {/* 1. TOP ROW: 3-TONE HIGH-CONTRAST HERO BENTO CARDS */}
          <div
            data-testid="sa-hero-bento-grid"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {/* CARD 1: DARK NAVY (#0c2340) — Total Work Orders + Wave Sparkline */}
            <div
              onClick={() => router.push('/advisor/work-orders')}
              className="sa-enter sa-card-lift bg-[#0c2340] text-white rounded-[28px] p-5 flex flex-col justify-between min-h-[215px] shadow-md hover:shadow-lg cursor-pointer relative overflow-hidden group"
            >
              <div>
                <div className="flex items-center justify-between text-zinc-300 text-xs font-medium">
                  <span>Tổng Phiếu Công Việc</span>
                  <span className="material-symbols-outlined text-[18px] text-zinc-400 group-hover:text-white transition-colors">
                    tune
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-2.5">
                  <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums">
                    {loading ? '—' : metrics.totalWOs}
                  </span>
                  <span className="text-[11px] font-bold text-[#60a5fa] flex items-center gap-0.5 tabular-nums">
                    <span className="material-symbols-outlined text-[13px]">trending_up</span>
                    {metrics.activeWOs} đang mở
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 tabular-nums">
                  {metrics.waitingApprovalWOs} phiếu đang lập kế hoạch / chờ duyệt
                </p>
              </div>

              {/* Wave Sparkline & Callout Pill */}
              <div className="mt-4 relative pt-5">
                <div className="absolute right-6 top-0 bg-white text-zinc-900 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-extrabold shadow-md tabular-nums">
                  {metrics.activeWOs} đang mở
                </div>

                <svg viewBox="0 0 240 60" className="w-full h-14 overflow-visible">
                  {/* Subtle vertical grid lines */}
                  {[20, 65, 110, 155, 195, 230].map((x) => (
                    <line
                      key={x}
                      x1={x}
                      y1="5"
                      x2={x}
                      y2="55"
                      stroke="rgba(255,255,255,0.1)"
                      strokeDasharray="2 2"
                    />
                  ))}
                  {/* Highlighted active vertical marker */}
                  <line x1="195" y1="0" x2="195" y2="55" stroke="#ffffff" strokeWidth="1.5" />
                  {/* Smooth wave path */}
                  <path
                    d="M 5 35 C 40 20, 65 48, 105 36 C 145 24, 170 40, 195 14 C 210 6, 225 22, 235 28"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="195" cy="14" r="3.5" fill="#0050cd" stroke="#ffffff" strokeWidth="2" />
                </svg>

                <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono mt-1">
                  <span>Tiếp nhận</span>
                  <span>Kế hoạch</span>
                  <span>Thi công</span>
                  <span>KCS</span>
                  <span>Giao xe</span>
                </div>
              </div>
            </div>

            {/* CARD 2: VIBRANT ROYAL BLUE (#0050cd) — Intake Queue + Split Bar */}
            <div
              onClick={() => router.push('/advisor/intake-queue')}
              className="sa-enter sa-card-lift bg-[#0050cd] text-white rounded-[28px] p-5 flex flex-col justify-between min-h-[215px] shadow-md shadow-[#0050cd]/20 hover:shadow-lg cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between text-blue-100 text-xs font-medium">
                  <span>Hàng Đợi Tiếp Nhận</span>
                  <span className="material-symbols-outlined text-[18px] text-blue-200 group-hover:text-white transition-colors">
                    tune
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-2.5">
                  <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums">
                    {loading ? '—' : metrics.queuedCount}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-0.5 tabular-nums">
                    <span className="material-symbols-outlined text-[13px]">north_east</span>
                    +{metrics.totalIntake} xe hôm nay
                  </span>
                </div>
                <p className="text-[11px] text-blue-100/80 mt-0.5 tabular-nums">
                  {metrics.convertedCount} xe đã chuyển thành Phiếu công việc
                </p>
              </div>

              {/* 2-Tone Split Bar Inside Dark Container (Exact Match to Reference Card 2) */}
              <div className="mt-4">
                <div className="bg-[#0c2340] rounded-xl p-1 flex items-stretch h-7 gap-1">
                  <div
                    style={{ width: `${Math.max(25, Math.min(75, metrics.queuedPct))}%` }}
                    className="bg-white text-zinc-900 rounded-lg px-2.5 flex items-center font-mono font-extrabold text-[11px] leading-none tabular-nums transition-all"
                  >
                    {metrics.queuedPct}%
                  </div>
                  <div className="flex-1 text-white px-2.5 flex items-center font-mono font-extrabold text-[11px] leading-none tabular-nums">
                    {metrics.convertedPct}%
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-blue-100 font-medium mt-2 px-1 tabular-nums">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    Chờ xử lý ({metrics.queuedCount})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0c2340]" />
                    Đã lập phiếu ({metrics.convertedCount})
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: SOFT COOL SLATE (#e4e7ec) — Completed/Ready + Dot Matrix Grid */}
            <div
              onClick={() => router.push('/advisor/work-orders')}
              className="sa-enter sa-card-lift bg-[#e4e7ec] text-zinc-900 rounded-[28px] p-5 flex flex-col justify-between min-h-[215px] shadow-xs hover:shadow-md cursor-pointer sm:col-span-2 xl:col-span-1 group"
            >
              <div>
                <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
                  <span>Sẵn Sàng & Hoàn Tất</span>
                  <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover:text-zinc-900 transition-colors">
                    tune
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-2.5">
                  <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums text-zinc-900">
                    {loading ? '—' : metrics.completedOrReadyWOs}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5 tabular-nums">
                    <span className="material-symbols-outlined text-[13px]">trending_up</span>
                    +{metrics.completionRate}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Phiếu đã nghiệm thu KCS / Chờ thanh toán & Giao xe
                </p>
              </div>

              {/* Micro-Block Matrix Grid with Dark Callout Pill (Exact Match to Reference Card 3) */}
              <div className="mt-3 relative pt-5">
                <div className="absolute right-8 top-0 bg-[#0c2340] text-white px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-extrabold shadow-sm tabular-nums">
                  {metrics.totalWOs} phiếu
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, colIdx) => {
                    const isPeakCol = colIdx === 4;
                    return (
                      <div key={day} className="flex flex-col items-center gap-1">
                        <div className="w-full grid grid-cols-2 gap-0.5">
                          {[0, 1, 2, 3, 4, 5].map((cell) => (
                            <span
                              key={cell}
                              className={`h-2 rounded-[2px] ${
                                isPeakCol
                                  ? cell < 2
                                    ? 'bg-slate-400/70'
                                    : 'bg-[#0c2340]'
                                  : cell < (colIdx % 3) + 1
                                  ? 'bg-white/60'
                                  : 'bg-white'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-600 font-mono mt-0.5">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. MIDDLE WIDE BENTO CARD: Uniform 8-Stage Bar Chart */}
          <DashboardStageBars
            title="Phân bổ phiếu công việc theo giai đoạn"
            subtitle="Theo dõi mật độ xe tại từng khâu trong quy trình dịch vụ"
            stages={stageBars.map((b) => ({
              key: b.key,
              label: b.label,
              count: b.count,
            }))}
            onSelectStage={() => router.push('/advisor/work-orders')}
          />

          {/* 3. BOTTOM WIDE BENTO CARD: Clean Borderless Work Orders Table (Matches "Product sales" in Reference) */}
          <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-xs border border-slate-200/70">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 tracking-tight">
                  Phiếu công việc cần xử lý
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chạm vào một dòng để mở chi tiết hồ sơ tiếp nhận, hạng mục và báo giá
                </p>
              </div>

              <Link
                href="/advisor/work-orders"
                title="Xem toàn bộ phiếu công việc"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#0050cd] text-zinc-700 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">north_east</span>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-14 rounded-2xl bg-slate-100 animate-pulse flex items-center px-4 gap-4"
                  />
                ))}
              </div>
            ) : displayedWorkOrders.length === 0 ? (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-[36px] text-slate-300">
                  assignment_late
                </span>
                <p className="text-sm font-bold text-zinc-800 mt-2">
                  Chưa có phiếu công việc nào trong nhóm này
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Hãy kiểm tra Hàng đợi tiếp nhận để tạo Phiếu công việc mới cho khách hàng.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                      <th className="pb-3 pr-3 font-medium">Phương tiện & Biển số</th>
                      <th className="pb-3 px-3 font-medium hidden sm:table-cell">Mã phiếu</th>
                      <th className="pb-3 px-3 font-medium hidden sm:table-cell">Khách hàng</th>
                      <th className="pb-3 px-3 font-medium">Trạng thái</th>
                      <th className="pb-3 px-3 font-medium hidden xl:table-cell">Cố vấn</th>
                      <th className="pb-3 pl-3 font-medium text-right">Tiếp nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {displayedWorkOrders.map((wo) => {
                      const st = WO_STATUS_META[wo.status] || {
                        label: wo.status,
                        bg: 'bg-slate-100',
                        text: 'text-slate-700',
                      };
                      const vehicleLabel =
                        [wo.vehicle?.make, wo.vehicle?.model].filter(Boolean).join(' ') ||
                        'Phương tiện dịch vụ';

                      return (
                        <tr
                          key={wo.id}
                          onClick={() => router.push(`/advisor/work-orders/${wo.id}`)}
                          className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                        >
                          {/* Vehicle Thumbnail + Plate & Model */}
                          <td className="py-3.5 pr-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0050cd] flex items-center justify-center shrink-0 group-hover:bg-[#0050cd] group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[20px]">
                                  directions_car
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-zinc-900 truncate">
                                  {wo.vehicle?.license_plate || 'N/A'}
                                </div>
                                <div className="text-xs text-slate-500 truncate">{vehicleLabel}</div>
                                <div className="sm:hidden flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 text-[11px]">
                                  <span className="font-mono font-bold text-[#0050cd] tabular-nums">
                                    {wo.wo_number}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-600 font-medium truncate">
                                    {wo.customer?.full_name || 'Khách vãng lai'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* WO Number */}
                          <td className="py-3.5 px-3 font-mono font-bold text-zinc-800 group-hover:text-[#0050cd] hidden sm:table-cell whitespace-nowrap tabular-nums">
                            {wo.wo_number}
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-3 text-slate-700 font-medium hidden sm:table-cell whitespace-nowrap">
                            {wo.customer?.full_name || 'Khách vãng lai'}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${st.bg} ${st.text}`}
                            >
                              {st.label}
                            </span>
                          </td>

                          {/* Advisor */}
                          <td className="py-3.5 px-3 text-slate-500 hidden xl:table-cell whitespace-nowrap">
                            {wo.advisor?.full_name || 'Cố vấn DV'}
                          </td>

                          {/* Created Time */}
                          <td className="py-3.5 pl-3 text-right font-mono text-xs text-slate-500 whitespace-nowrap tabular-nums">
                            {new Date(wo.created_at).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT STACKED BENTO WIDGETS COLUMN (4/12 on lg, 3/12 on xl) ==================== */}
        <div className="lg:col-span-4 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
          {/* WIDGET 1: Service Category Donut/Pie + 3-Pill Switcher (Matches "Top categories" in Reference) */}
          <div className="bg-white rounded-[28px] p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-zinc-900">Phân loại trạng thái</h3>
              <Link
                href="/advisor/work-orders"
                className="text-slate-400 hover:text-zinc-900 transition-colors"
                title="Chi tiết phiếu công việc"
              >
                <span className="material-symbols-outlined text-[18px]">north_east</span>
              </Link>
            </div>

            {/* Exploded Multi-Tone Donut Chart SVG */}
            <div className="my-5 flex items-center justify-center relative">
              <svg viewBox="0 0 180 180" className="w-40 h-40 -rotate-90">
                {donutSlices.length === 0 ? (
                  <circle
                    cx="90"
                    cy="90"
                    r="54"
                    fill="transparent"
                    stroke="#e2e8f0"
                    strokeWidth="24"
                  />
                ) : (
                  donutSlices.map((slice) => (
                    <circle
                      key={slice.key}
                      cx="90"
                      cy="90"
                      r="54"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={slice.strokeWidth}
                      strokeDasharray={`${slice.length} ${slice.circumference}`}
                      strokeDashoffset={slice.offset}
                    />
                  ))
                )}
              </svg>

              {/* Floating Percentage Badges */}
              <span className="absolute top-2 left-8 bg-white border border-slate-200 shadow-xs px-2 py-0.5 rounded-full text-[11px] font-mono font-extrabold text-zinc-900 tabular-nums">
                {metrics.totalWOs} phiếu
              </span>
              <span className="absolute bottom-2 right-6 bg-white border border-slate-200 shadow-xs px-2 py-0.5 rounded-full text-[11px] font-mono font-extrabold text-[#0050cd] tabular-nums">
                {metrics.queuedCount} chờ
              </span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-600 font-medium mb-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0050cd]" />
                Kế hoạch
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0c2340]" />
                Đang sửa
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#60a5fa]" />
                Chờ duyệt
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                Hoàn tất
              </span>
            </div>

            {/* Segmented Pill Toggle */}
            <div className="bg-[#f2f4f8] rounded-2xl p-1 grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'ACTIVE', label: 'Đang sửa' },
                  { id: 'WAITING', label: 'Chờ duyệt' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryPeriod(tab.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryPeriod === tab.id
                      ? 'bg-[#0050cd] text-white shadow-xs'
                      : 'text-slate-600 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* WIDGET 2: Intake Breakdown Vertical Bars (Matches "Sales by country" in Reference) */}
          <div className="bg-white rounded-[28px] p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-zinc-900">Lưu lượng xe tiếp nhận</h3>
              <Link
                href="/advisor/intake-queue"
                className="text-slate-400 hover:text-zinc-900 transition-colors"
                title="Mở hàng đợi tiếp nhận"
              >
                <span className="material-symbols-outlined text-[18px]">north_east</span>
              </Link>
            </div>

            {/* 5 Vertical Mini-Bars with Top Caps */}
            <div className="grid grid-cols-5 gap-2 items-end h-36 my-4 pt-4 px-1">
              {intakeBreakdown.map((item) => {
                const barH = Math.max(25, Math.min(95, item.pct || 30));
                return (
                  <div key={item.label} className="flex flex-col items-center h-full justify-end">
                    <span className="text-[11px] font-mono font-bold text-slate-700 mb-1 tabular-nums">
                      {item.pct}%
                    </span>
                    <div
                      style={{ height: `${barH}%` }}
                      className="w-3 bg-[#0c2340] rounded-t-sm relative"
                    >
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#0050cd]" />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium mt-2 truncate max-w-full">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Segmented Pill Toggle */}
            <div className="bg-[#f2f4f8] rounded-2xl p-1 grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'QUEUED', label: 'Đang chờ' },
                  { id: 'CONVERTED', label: 'Đã nhận' },
                  { id: 'ALL', label: 'Tất cả' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQueueFilter(tab.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    queueFilter === tab.id
                      ? 'bg-[#0050cd] text-white shadow-xs'
                      : 'text-slate-600 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* BOTTOM SOLID DARK ACTION BUTTON (Matches "Export statistics" in Reference & Preserves E2E `text=Xem hàng đợi`) */}
          <Link
            href="/advisor/intake-queue"
            className="md:col-span-2 lg:col-span-1 w-full py-4 px-5 rounded-[22px] bg-[#0c2340] hover:bg-[#07172c] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[20px]">inbox</span>
            <span>Xem hàng đợi</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
