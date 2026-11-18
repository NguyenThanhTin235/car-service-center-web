'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import SaaSWaveChart from '@/components/shared/SaaSWaveChart';

// ============ Status config (Harmonized to Blue SaaS Palette) ============
const WO_STATUS_CONFIG: Record<
  string,
  { label: string; badgeCls: string; dotColor: string }
> = {
  IN_PLANNING: {
    label: 'Lập kế hoạch',
    badgeCls: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: '#64748b',
  },
  PENDING_APPROVAL: {
    label: 'Chờ duyệt báo giá',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotColor: '#f59e0b',
  },
  APPROVED: {
    label: 'Đã duyệt',
    badgeCls: 'bg-blue-50 text-[#0050cd] border-blue-200/80',
    dotColor: '#0866ff',
  },
  IN_PROGRESS: {
    label: 'Đang sửa chữa',
    badgeCls: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dotColor: '#0ea5e9',
  },
  BILLING_REQUESTED: {
    label: 'Chờ thanh toán',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dotColor: '#8b5cf6',
  },
  FINANCIAL_CLEARED: {
    label: 'Đã thanh toán',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: '#10b981',
  },
};

const JOB_STATUS_CONFIG: Record<
  string,
  { label: string; cls: string; dotColor: string }
> = {
  PLANNED: {
    label: 'Chưa làm',
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
    dotColor: '#64748b',
  },
  IN_PROGRESS: {
    label: 'Đang sửa',
    cls: 'bg-blue-50 text-[#0050cd] border-blue-200/70',
    dotColor: '#0866ff',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    dotColor: '#10b981',
  },
  PAUSED: {
    label: 'Tạm dừng',
    cls: 'bg-amber-50 text-amber-700 border-amber-200/70',
    dotColor: '#f59e0b',
  },
  CANCELLED: {
    label: 'Đã hủy',
    cls: 'bg-slate-100 text-slate-400 border-slate-200',
    dotColor: '#94a3b8',
  },
};

interface JobItem {
  id: number;
  name: string;
  status: string;
  isOverdue: boolean;
  startedAt: string | null;
}

interface ServiceItem {
  id: number;
  name: string;
  status: string;
  jobs: JobItem[];
}

interface WorkOrder {
  id: number;
  woNumber: string;
  status: string;
  customerName: string;
  vehiclePlate: string;
  vehicleInfo: string;
  advisorName: string;
  createdAt: string;
  services: ServiceItem[];
}

interface DashboardData {
  kpis: {
    totalActive: number;
    pendingApproval: number;
    billingRequested: number;
    overdueJobs: number;
  };
  workOrders: WorkOrder[];
}

// ============ Job Status Chip ============
function JobBadge({ job }: { job: JobItem }) {
  if (job.isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
        <span className="material-symbols-outlined text-[13px]">alarm</span>
        <span>{job.name} (Quá hạn)</span>
      </span>
    );
  }

  const cfg = JOB_STATUS_CONFIG[job.status] || {
    label: job.status,
    cls: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: '#64748b',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.cls}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: cfg.dotColor }}
      />
      <span>
        {job.name}: {cfg.label}
      </span>
    </span>
  );
}

// ============ Work Order Bento Card ============
function WorkOrderCard({ wo }: { wo: WorkOrder }) {
  const statusCfg = WO_STATUS_CONFIG[wo.status] || {
    label: wo.status,
    badgeCls: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: '#64748b',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col gap-3.5 shadow-2xs hover:border-[#0866ff]/40 transition-all">
      {/* Top Header: WO Number & Status */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0050cd] flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">assignment</span>
          </div>
          <span className="font-mono tabular-nums font-bold text-sm text-slate-900">
            {wo.woNumber}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.badgeCls}`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: statusCfg.dotColor }}
          />
          {statusCfg.label}
        </span>
      </div>

      {/* Vehicle & Customer Info (Flat divider section to avoid nested card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="text-xs text-slate-600 font-medium">Phương tiện</div>
          <div className="flex items-center gap-1.5 font-mono tabular-nums text-xs font-bold text-slate-900 mt-0.5">
            <span className="material-symbols-outlined text-[16px] text-[#0866ff]">
              directions_car
            </span>
            {wo.vehiclePlate}
          </div>
          <div className="text-xs text-slate-600 mt-0.5 truncate">{wo.vehicleInfo}</div>
        </div>
        <div>
          <div className="text-xs text-slate-600 font-medium">Khách hàng & Cố vấn</div>
          <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
            {wo.customerName}
          </div>
          <div className="text-xs text-slate-600 mt-0.5 truncate">
            Cố vấn: <span className="font-semibold text-[#0050cd]">{wo.advisorName}</span>
          </div>
        </div>
      </div>

      {/* Services & Jobs breakdown */}
      <div>
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Tiến độ dịch vụ & hạng mục
        </div>
        {wo.services.length === 0 ? (
          <div className="text-xs text-slate-600 italic">Chưa có dịch vụ nào</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {wo.services.map((svc) => (
              <div
                key={svc.id}
                className="py-2 first:pt-0 last:pb-0"
              >
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#0866ff]">
                    handyman
                  </span>
                  <span>{svc.name}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {svc.jobs.length === 0 ? (
                    <span className="text-xs text-slate-600">
                      Chưa chia hạng mục công việc
                    </span>
                  ) : (
                    svc.jobs.map((j) => <JobBadge key={j.id} job={j} />)
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Main Workshop Dashboard Page ============
export default function WorkshopDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/dashboard/workshop');
      if (res.data?.success) {
        setData(res.data.data);
        setLastUpdated(new Date());
      } else {
        setData({
          kpis: { totalActive: 0, pendingApproval: 0, billingRequested: 0, overdueJobs: 0 },
          workOrders: [],
        });
      }
    } catch {
      setError('Không thể tải dữ liệu điều hành xưởng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 45000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const kpis = data?.kpis || {
    totalActive: 0,
    pendingApproval: 0,
    billingRequested: 0,
    overdueJobs: 0,
  };
  const workOrders = data?.workOrders || [];

  const filteredWOs = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesStatus = filterStatus === 'ALL' || wo.status === filterStatus;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        wo.woNumber.toLowerCase().includes(query) ||
        wo.vehiclePlate.toLowerCase().includes(query) ||
        wo.customerName.toLowerCase().includes(query) ||
        wo.advisorName.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [workOrders, filterStatus, searchQuery]);

  const inProgressCount = useMemo(
    () => workOrders.filter((w) => w.status === 'IN_PROGRESS').length,
    [workOrders]
  );

  return (
    <div className="space-y-6">
      {/* 1. SAAS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Bảng điều hành xưởng
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          {lastUpdated && (
            <span className="text-xs font-mono text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200/80">
              Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
          )}
          <Link
            href="/reports"
            className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#0866ff]">
              monitoring
            </span>
            <span>Báo cáo doanh thu</span>
          </Link>
          <button
            type="button"
            onClick={fetchData}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. ASYMMETRICAL BENTO GRID (Matches Ember Reference Image) */}
      <div
        data-testid="manager-bento-grid"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* LEFT COLUMN (5/12): Deep Navy Hero Card + Dispatch Alert Bento Card */}
        <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
          {/* HERO CARD 1: Active Workshop Capacity (Ember 'Paid this month' Style) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#091528] via-[#0c1f3d] to-[#0050cd] text-white p-6 border border-blue-900/60 shadow-sm flex items-center justify-between gap-4 min-h-[176px]">
            <div className="relative z-10 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-200">
                Tổng phương tiện đang xử lý tại xưởng
              </span>
              <div className="mt-2 font-mono tabular-nums text-4xl font-extrabold tracking-tight">
                {loading ? '—' : kpis.totalActive}
                <span className="text-base font-semibold text-slate-200 ml-2">xe</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-200 font-bold">
                  {inProgressCount} đang thi công
                </span>
                <span className="text-slate-200">
                  • {kpis.billingRequested} chờ quyết toán
                </span>
              </div>
            </div>

            {/* Pure SVG Stylized Workshop Telemetry Card Illustration */}
            <svg
              width="140"
              height="92"
              viewBox="0 0 140 92"
              fill="none"
              aria-hidden="true"
              className="relative z-10 hidden sm:block shrink-0 -rotate-6"
            >
              <defs>
                <linearGradient id="mgrCardGrad" x1="0" y1="92" x2="140" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0050cd" />
                  <stop offset="55%" stopColor="#0866ff" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="136" height="88" rx="14" fill="url(#mgrCardGrad)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
              <rect x="14" y="16" width="24" height="16" rx="4" fill="#fcd34d" />
              <circle cx="114" cy="24" r="7" fill="rgba(255,255,255,0.35)" />
              <circle cx="122" cy="24" r="7" fill="rgba(255,255,255,0.6)" />
              <rect x="14" y="54" width="54" height="6" rx="3" fill="rgba(255,255,255,0.45)" />
              <rect x="14" y="66" width="84" height="8" rx="4" fill="rgba(255,255,255,0.85)" />
            </svg>
          </div>

          {/* HERO CARD 2: Operational Bottlenecks & Quick Filter Tile */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Điểm nghẽn điều độ cần chú ý
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0050cd] font-mono text-xs font-bold">
                Giám sát SLA
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-200 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFilterStatus('PENDING_APPROVAL')}
                className="text-left pr-3 cursor-pointer"
              >
                <div className="text-xs font-medium text-slate-600">Chờ duyệt giá</div>
                <div className="font-mono tabular-nums text-2xl font-extrabold text-amber-800 mt-1">
                  {kpis.pendingApproval}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('BILLING_REQUESTED')}
                className="text-left px-3 cursor-pointer"
              >
                <div className="text-xs font-medium text-slate-600">Chờ thanh toán</div>
                <div className="font-mono tabular-nums text-2xl font-extrabold text-[#0050cd] mt-1">
                  {kpis.billingRequested}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className="text-left pl-3 cursor-pointer"
              >
                <div className="text-xs font-medium text-slate-600">Việc quá hạn</div>
                <div className="font-mono tabular-nums text-2xl font-extrabold text-rose-700 mt-1">
                  {kpis.overdueJobs}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7/12): SaaS Multi-Curve Wave Chart */}
        <div className="lg:col-span-7 flex flex-col">
          <SaaSWaveChart
            testId="manager-wave-chart"
            title="Phân bổ Tiến độ Lệnh sửa chữa & Năng suất Khoang dịch vụ"
            primaryMetric={`${kpis.totalActive} lệnh đang vận hành`}
            deltaText="+9.6%"
            deltaPositive={true}
            comparisonText="tốc độ giải phóng khoang sửa chữa"
            xLabels={['Kế hoạch', 'Chờ duyệt', 'Đang sửa', 'Nghiệm thu', 'Thanh toán']}
            yLabels={['30', '20', '15', '10', '0']}
            series={[
              {
                label: 'Đang sửa chữa',
                value: inProgressCount,
                color: '#0866ff',
                peakRatio: 0.9,
              },
              {
                label: 'Chờ duyệt giá',
                value: kpis.pendingApproval,
                color: '#38bdf8',
                peakRatio: 0.68,
              },
              {
                label: 'Chờ thanh toán',
                value: kpis.billingRequested,
                color: '#10b981',
                peakRatio: 0.52,
              },
              {
                label: 'Quá hạn SLA',
                value: kpis.overdueJobs,
                color: '#f43f5e',
                peakRatio: 0.34,
              },
            ]}
          />
        </div>
      </div>

      {/* 3. SEARCH, FILTER PILLS & VIEW TOGGLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1 max-w-xl h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-[#0866ff] transition-all">
            <span className="material-symbols-outlined text-[18px] text-slate-500 shrink-0">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo biển số, mã phiếu, tên khách hàng hoặc cố vấn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer shrink-0"
              >
                Xóa
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-[#0866ff] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>Thẻ Bento</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-[#0866ff] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              <span>Bảng mật độ cao</span>
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold mr-1">Trạng thái:</span>
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-[#0866ff] text-white border-[#0866ff] shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả ({workOrders.length})
          </button>
          {Object.entries(WO_STATUS_CONFIG).map(([st, cfg]) => {
            const count = workOrders.filter((w) => w.status === st).length;
            const active = filterStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#0866ff] text-white border-[#0866ff] shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: active ? '#ffffff' : cfg.dotColor }}
                />
                <span>
                  {cfg.label} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. WORK ORDERS LIST (4-State UI Protocol) */}
      {error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-800">
            <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="manager-wo-skeleton">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-48 rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-16 w-full bg-slate-100 rounded-xl" />
              <div className="h-8 w-2/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : workOrders.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0050cd] flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-[30px]">garage</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Hiện tại xưởng chưa có xe nào đang xử lý
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Tất cả các phiếu dịch vụ đã hoàn tất hoặc chưa có xe mới tiếp nhận vào khoang sửa chữa.
          </p>
        </div>
      ) : filteredWOs.length === 0 ? (
        <div className="text-center py-14 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
          <span className="material-symbols-outlined text-[40px] text-slate-400 mb-2 block">
            filter_alt_off
          </span>
          <p className="text-sm font-semibold text-slate-700">
            Không tìm thấy phiếu dịch vụ nào phù hợp với bộ lọc đã chọn.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterStatus('ALL');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-[#0866ff] text-white text-xs font-bold cursor-pointer"
          >
            Hiển thị tất cả
          </button>
        </div>
      ) : viewMode === 'CARDS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWOs.map((wo) => (
            <WorkOrderCard key={wo.id} wo={wo} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Mã Lệnh (RO)</th>
                  <th className="py-3 px-4">Phương tiện</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Cố vấn</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Số dịch vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredWOs.map((wo) => {
                  const st = WO_STATUS_CONFIG[wo.status] || {
                    label: wo.status,
                    badgeCls: 'bg-slate-100 text-slate-700',
                    dotColor: '#64748b',
                  };
                  return (
                    <tr key={wo.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-[#0050cd]">
                        {wo.woNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono tabular-nums font-bold text-slate-900">
                          {wo.vehiclePlate}
                        </div>
                        <div className="text-xs text-slate-600">{wo.vehicleInfo}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {wo.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{wo.advisorName}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${st.badgeCls}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: st.dotColor }}
                          />
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-700">
                        {wo.services.length} gói dịch vụ
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
