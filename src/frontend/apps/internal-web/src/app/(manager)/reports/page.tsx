'use client';

import React, { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

// ============ Report Type Button (Blue SaaS Theme) ============
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
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
        active
          ? 'bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white border-[#0866ff] shadow-md shadow-[#0866ff]/20'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ============ Summary Metric Card ============
function SummaryCard({
  label,
  value,
  icon,
  variant = 'blue',
}: {
  label: string;
  value: string;
  icon: string;
  variant?: 'blue' | 'danger';
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 flex items-center gap-4 shadow-2xs">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          variant === 'danger'
            ? 'bg-rose-50 text-rose-600'
            : 'bg-blue-50 text-[#0050cd]'
        }`}
      >
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <div>
        <div className="font-mono tabular-nums text-2xl font-extrabold text-slate-900 leading-tight">
          {value}
        </div>
        <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ============ Empty State Component ============
function EmptyState({ message }: { message?: string }) {
  return (
    <div className="text-center py-14 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
      <span className="material-symbols-outlined text-[44px] block mb-3 text-slate-400">
        bar_chart
      </span>
      <p className="text-sm font-bold text-slate-700">
        {message || 'Không có dữ liệu trong khoảng thời gian đã chọn.'}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Vui lòng thử chọn một khoảng thời gian khác.
      </p>
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
        />
        <SummaryCard
          label="Số lượt hóa đơn thực thu"
          value={`${summary.totalInvoices ?? 0} hóa đơn`}
          icon="receipt_long"
        />
      </div>

      {data.length === 0 ? (
        <EmptyState message="Không có giao dịch doanh thu nào trong khoảng thời gian này." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-5">
            Biểu đồ biến động doanh thu theo ngày
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                formatter={(val: any) => [`${fmtCurrency(Number(val || 0))} ₫`, 'Doanh thu']}
                contentStyle={{
                  fontSize: '12px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              />
              <Bar dataKey="totalRevenue" fill="#0866ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

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
      <div className="max-w-md">
        <SummaryCard
          label="Tổng lượt dịch vụ thực hiện"
          value={`${summary.totalWorkOrders ?? 0} lượt`}
          icon="build"
        />
      </div>

      {data.length === 0 ? (
        <EmptyState message="Không có dịch vụ nào được thực hiện trong khoảng thời gian này." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-5">
            Xếp hạng dịch vụ theo số lượt thực hiện
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(260, data.length * 40)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                dataKey="serviceName"
                type="category"
                width={180}
                tick={{ fontSize: 12, fill: '#334155' }}
              />
              <Tooltip
                formatter={(val: any) => [`${val} lượt`, 'Số lần']}
                contentStyle={{ fontSize: '12px', borderRadius: '10px' }}
              />
              <Bar dataKey="count" fill="#0050cd" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>

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
      <div className="max-w-md">
        <SummaryCard
          label="Mã phụ tùng dưới mức cảnh báo tồn kho"
          value={`${summary.lowStockCount ?? 0} mã`}
          icon="warning"
          variant={summary.lowStockCount && summary.lowStockCount > 0 ? 'danger' : 'blue'}
        />
      </div>

      {data.length === 0 ? (
        <div className="text-center py-14 px-6 bg-blue-50/60 rounded-2xl border border-blue-200/80 text-[#0050cd]">
          <span className="material-symbols-outlined text-[48px] block mb-3 text-[#0866ff]">
            check_circle
          </span>
          <h3 className="text-base font-bold">Kho phụ tùng đang đảm bảo</h3>
          <p className="text-xs text-slate-600 mt-1">
            Tất cả các mặt hàng phụ tùng đều đạt hoặc vượt mức tồn kho an toàn quy định.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="p-4 bg-rose-50 border-b border-rose-200/80">
            <h3 className="text-xs font-bold text-rose-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>Danh sách các mặt hàng phụ tùng cần lên đơn đặt nhập thêm</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Mã SKU</th>
                  <th className="py-3 px-4">Tên phụ tùng</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4 text-center">Tồn kho thực tế</th>
                  <th className="py-3 px-4 text-center">Mức cảnh báo</th>
                  <th className="py-3 px-4 text-center text-rose-600">Số lượng thiếu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-700">
                      {row.sku}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{row.name}</td>
                    <td className="py-3 px-4 text-slate-500">{row.categoryName}</td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-rose-600">
                      {row.onHand}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-500">
                      {row.reorderLevel}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-rose-600">
                      +{row.deficit}
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

// ============ Main Operational Reports Page ============
export default function OperationalReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { type: reportType };
      if (reportType !== 'inventory') {
        params.start = startDate;
        params.end = endDate;
      }
      const res = await api.get('/api/reports/operational', { params });
      if (res.data?.success) {
        setReportData(res.data.data);
        setHasLoaded(true);
      }
    } catch (err) {
      console.error('Lỗi tải báo cáo vận hành:', err);
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate]);

  const handleTypeChange = (t: ReportType) => {
    setReportType(t);
    setReportData(null);
    setHasLoaded(false);
    if (t === 'inventory') {
      setTimeout(() => fetchReport(), 0);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Báo cáo vận hành
        </h1>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Chọn loại báo cáo
          </div>
          <div className="flex flex-wrap gap-2.5">
            <TypeBtn
              active={reportType === 'revenue'}
              label="Báo cáo Doanh thu"
              icon="payments"
              onClick={() => handleTypeChange('revenue')}
            />
            <TypeBtn
              active={reportType === 'services'}
              label="Báo cáo Dịch vụ phổ biến"
              icon="build"
              onClick={() => handleTypeChange('services')}
            />
            <TypeBtn
              active={reportType === 'inventory'}
              label="Báo cáo Tồn kho phụ tùng"
              icon="inventory_2"
              onClick={() => handleTypeChange('inventory')}
            />
          </div>
        </div>

        {reportType !== 'inventory' && (
          <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0866ff]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0866ff]"
              />
            </div>
            <button
              type="button"
              onClick={fetchReport}
              disabled={loading}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0866ff]/20 disabled:opacity-60 cursor-pointer"
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
      ) : !hasLoaded ? (
        <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
          <span className="material-symbols-outlined text-[48px] block mb-3 text-slate-400">
            bar_chart
          </span>
          <p className="text-sm text-slate-600">
            Chọn khoảng thời gian và nhấn <strong>Xem báo cáo</strong>
          </p>
        </div>
      ) : reportData ? (
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
      ) : null}
    </div>
  );
}
