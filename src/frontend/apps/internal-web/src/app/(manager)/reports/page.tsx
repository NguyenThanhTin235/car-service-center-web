'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';

const ChartLoadingSkeleton = () => (
  <div className="h-[300px] w-full bg-slate-100 rounded-xl animate-pulse" />
);

const RevenueBarChart = dynamic(
  () => import('./components/ReportsCharts').then((mod) => mod.RevenueBarChart),
  { ssr: false, loading: ChartLoadingSkeleton }
);

const ServicesBarChart = dynamic(
  () => import('./components/ReportsCharts').then((mod) => mod.ServicesBarChart),
  { ssr: false, loading: ChartLoadingSkeleton }
);

type ReportType = 'revenue' | 'services' | 'inventory';

interface RevenueRow {
  date: string;
  totalRevenue: number;
  count: number;
}
interface ServiceRow {
  serviceId: number;
  serviceName: string;
  count: number;
}
interface InventoryRow {
  id: number;
  sku: string;
  name: string;
  categoryName: string;
  onHand: number;
  reorderLevel: number;
  deficit: number;
}

interface ReportData {
  type: ReportType;
  period: { start: string; end: string } | null;
  data: RevenueRow[] | ServiceRow[] | InventoryRow[];
  summary: {
    totalRevenue?: number;
    totalInvoices?: number;
    totalWorkOrders?: number;
    lowStockCount?: number;
  };
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(n));

// ============ Report Type Button ============
function TypeBtn({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
        active
          ? 'bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white shadow-sm shadow-[#0866ff]/25 font-bold'
          : 'bg-white hover:bg-slate-100/90 text-slate-600 border border-slate-200/80 shadow-2xs'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ============ KPI Summary Card ============
function SummaryCard({
  label,
  value,
  icon,
  subtext,
  badge,
  variant = 'default',
}: {
  label: string;
  value: string;
  icon: string;
  subtext?: string;
  badge?: string;
  variant?: 'default' | 'emerald' | 'amber' | 'blue';
}) {
  const bgColors = {
    default: 'bg-slate-50 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgColors[variant]}`}
      >
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-mono tabular-nums text-2xl font-extrabold text-slate-900 leading-tight">
            {value}
          </div>
          {badge && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
        {subtext && <div className="text-[11px] text-slate-400 mt-0.5">{subtext}</div>}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="text-center py-14 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
      <span className="material-symbols-outlined text-[44px] block mb-3 text-slate-400">
        bar_chart
      </span>
      <p className="text-sm font-bold text-slate-700">
        {message || 'Không có dữ liệu trong khoảng thời gian đã chọn.'}
      </p>
      <p className="text-xs text-slate-500 mt-1">Vui lòng thử chọn một khoảng thời gian khác.</p>
    </div>
  );
}

// ============ Section 1: Revenue Report ============
function RevenueSection({
  data,
  summary,
}: {
  data: RevenueRow[];
  summary: ReportData['summary'];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          label="Tổng doanh thu đã thanh toán"
          value={`${fmtCurrency(summary.totalRevenue ?? 0)} ₫`}
          icon="payments"
          variant="emerald"
        />
        <SummaryCard
          label="Số lượt hóa đơn thực thu"
          value={`${summary.totalInvoices ?? 0} hóa đơn`}
          icon="receipt_long"
          variant="blue"
        />
      </div>

      {data.length === 0 ? (
        <EmptyState message="Không có giao dịch doanh thu nào trong khoảng thời gian này." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-5">
            Biểu đồ biến động doanh thu theo ngày
          </h3>
          <RevenueBarChart data={data} />

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[480px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Ngày</th>
                  <th className="py-3 px-4 text-center">Số hóa đơn</th>
                  <th className="py-3 px-4 text-right">Tổng doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.map((row) => (
                  <tr key={row.date} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {new Date(row.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold">
                      {row.count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#0050cd]">
                      {fmtCurrency(row.totalRevenue)} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Section 2: Services Report ============
function ServicesSection({
  data,
  summary,
}: {
  data: ServiceRow[];
  summary: ReportData['summary'];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          label="Tổng lượt dịch vụ thực hiện"
          value={`${summary.totalWorkOrders ?? 0} lượt`}
          icon="assignment_turned_in"
        />
        <SummaryCard
          label="Danh mục dịch vụ cung cấp"
          value={`${data.length} dịch vụ`}
          icon="category"
        />
      </div>

      {data.length === 0 ? (
        <EmptyState message="Không có dữ liệu dịch vụ trong khoảng thời gian này." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-5">
            Xếp hạng dịch vụ theo số lượt thực hiện
          </h3>
          <ServicesBarChart data={data} />

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[480px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Tên dịch vụ</th>
                  <th className="py-3 px-4 text-center">Số lượt thực hiện</th>
                  <th className="py-3 px-4 text-right">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.map((row) => {
                  const pct = summary.totalWorkOrders
                    ? ((row.count / summary.totalWorkOrders) * 100).toFixed(1)
                    : '0';
                  return (
                    <tr key={row.serviceId} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {row.serviceName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-[#0050cd]">
                        {row.count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                        {pct}%
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

// ============ Section 3: Inventory Report ============
function InventorySection({
  data,
  summary,
}: {
  data: InventoryRow[];
  summary: ReportData['summary'];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          label="Phụ tùng dưới mức tồn an toàn"
          value={`${summary.lowStockCount ?? 0} mục`}
          icon="warning"
          variant="amber"
        />
      </div>

      {data.length === 0 ? (
        <div className="text-center py-14 px-6 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-bold text-emerald-700">Tồn kho phụ tùng đều đạt mức an toàn!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">Mã SKU</th>
                <th className="p-3">Tên phụ tùng</th>
                <th className="p-3">Tồn kho</th>
                <th className="p-3">Định mức an toàn</th>
                <th className="p-3">Thiếu hụt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold">{item.sku}</td>
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3 font-mono">{item.onHand}</td>
                  <td className="p-3 font-mono">{item.reorderLevel}</td>
                  <td className="p-3 font-mono font-bold text-red-600">-{item.deficit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============ Main Report Component ============
export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('revenue');

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchReport = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorMsg(null);
    try {
      const params: Record<string, string> = { type: reportType };
      if (reportType !== 'inventory') {
        params.start = startDate;
        params.end = endDate;
      }
      const res = await api.get('/api/reports/operational', {
        params,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err: any) {
      if (controller.signal.aborted || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
        return;
      }
      console.error('Lỗi tải báo cáo vận hành:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể tải dữ liệu báo cáo.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [reportType, startDate, endDate]);

  const handleTypeChange = (t: ReportType) => {
    setReportType(t);
    setReportData(null);
  };

  useEffect(() => {
    fetchReport();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchReport]);

  return (
    <div className="space-y-6">
      {/* Control Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBtn
            active={reportType === 'revenue'}
            label="Doanh thu"
            icon="payments"
            onClick={() => handleTypeChange('revenue')}
          />
          <TypeBtn
            active={reportType === 'services'}
            label="Dịch vụ phổ biến"
            icon="build"
            onClick={() => handleTypeChange('services')}
          />
          <TypeBtn
            active={reportType === 'inventory'}
            label="Tồn kho phụ tùng"
            icon="inventory_2"
            onClick={() => handleTypeChange('inventory')}
          />
        </div>

        {reportType !== 'inventory' && (
          <div className="flex flex-wrap items-center gap-2.5 pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-100">
            <div className="h-10 flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 focus-within:bg-white focus-within:border-[#0866ff] transition-all">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Từ ngày</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-mono font-medium text-slate-900 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="h-10 flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 focus-within:bg-white focus-within:border-[#0866ff] transition-all">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Đến ngày</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-mono font-medium text-slate-900 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={fetchReport}
              disabled={loading}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#0866ff]/20 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">
                {loading ? 'progress_activity' : 'search'}
              </span>
              <span>{loading ? 'Đang tổng hợp...' : 'Xem báo cáo'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 space-y-4">
          <div className="h-8 w-52 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-64 w-full bg-slate-100 rounded-xl animate-pulse" />
        </div>
      ) : errorMsg ? (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 text-rose-800 text-sm font-semibold">
            <span className="material-symbols-outlined text-rose-600 text-2xl">error</span>
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={fetchReport}
            className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Thử lại
          </button>
        </div>
      ) : !reportData ? (
        <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
          <span className="material-symbols-outlined text-[48px] block mb-3 text-slate-400">
            bar_chart
          </span>
          <p className="text-sm text-slate-600">
            Chọn khoảng thời gian và nhấn <strong>Xem báo cáo</strong>
          </p>
        </div>
      ) : (
        <>
          {reportData.type === 'revenue' && (
            <RevenueSection
              data={reportData.data as RevenueRow[]}
              summary={reportData.summary}
            />
          )}
          {reportData.type === 'services' && (
            <ServicesSection
              data={reportData.data as ServiceRow[]}
              summary={reportData.summary}
            />
          )}
          {reportData.type === 'inventory' && (
            <InventorySection
              data={reportData.data as InventoryRow[]}
              summary={reportData.summary}
            />
          )}
        </>
      )}
    </div>
  );
}
