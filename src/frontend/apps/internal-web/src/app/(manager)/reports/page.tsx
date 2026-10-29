'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';


type ReportType = 'revenue' | 'services' | 'inventory';

interface RevenueRow { date: string; totalRevenue: number; count: number; }
interface ServiceRow  { serviceId: number; serviceName: string; count: number; }
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

const fmtCurrency = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

// ============ Report Type Button ============
function TypeBtn({
  active, label, icon, onClick
}: {
  active: boolean; label: string; icon: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '0.625rem 1.25rem', borderRadius: '0.625rem', border: '1.5px solid',
      borderColor: active ? '#059669' : '#e5e7eb',
      background: active ? '#d1fae5' : '#ffffff',
      color: active ? '#059669' : '#374151',
      fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
      {label}
    </button>
  );
}

// ============ Summary Metric Card ============
function SummaryCard({ label, value, icon, color = '#059669' }: { label: string; value: string; icon: string; color?: string }) {
  return (
    <div style={{
      background: '#ffffff', borderRadius: '0.75rem', padding: '1.25rem',
      border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      <div style={{
        width: '3rem', height: '3rem', borderRadius: '0.625rem',
        background: color === '#059669' ? '#d1fae5' : '#fee2e2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '24px', color }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0b1c30', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '12px', color: '#727687', marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
}

// ============ Empty State Component ============
function EmptyState({ message }: { message?: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '3.5rem 2rem', background: '#ffffff',
      borderRadius: '0.75rem', border: '1px dashed #d1d5db', color: '#9ca3af',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '44px', display: 'block', marginBottom: '0.75rem', color: '#9ca3af' }}>
        bar_chart
      </span>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#4b5563' }}>
        {message || 'Không có dữ liệu trong khoảng thời gian đã chọn.'}
      </p>
      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
        Vui lòng thử chọn một khoảng thời gian khác.
      </p>
    </div>
  );
}

// ============ Styles ============
const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', textAlign: 'left', fontSize: '12px',
  fontWeight: 600, color: '#4b5563', whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', color: '#1f2937', verticalAlign: 'middle', fontSize: '13px',
};

// ============ Section 1: Revenue Report ============
function RevenueSection({ data, summary }: { data: RevenueRow[]; summary: ReportData['summary'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
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
        <div style={{ background: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
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
                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="totalRevenue" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Detail Table */}
          <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={thStyle}>Ngày</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Số hóa đơn</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Tổng doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.date} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}>{new Date(row.date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{row.count}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#059669' }}>
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
function ServicesSection({ data, summary }: { data: ServiceRow[]; summary: ReportData['summary'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', maxWidth: '400px' }}>
        <SummaryCard
          label="Tổng lượt dịch vụ thực hiện"
          value={`${summary.totalWorkOrders ?? 0} lượt`}
          icon="build"
        />
      </div>

      {data.length === 0 ? (
        <EmptyState message="Không có dịch vụ nào được thực hiện trong khoảng thời gian này." />
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
            Xếp hạng dịch vụ theo số lượt thực hiện
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(260, data.length * 40)}>
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis dataKey="serviceName" type="category" width={180} tick={{ fontSize: 12, fill: '#334155' }} />
              <Tooltip
                formatter={(val: any) => [`${val} lượt`, 'Số lần']}
                contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={thStyle}>Tên dịch vụ</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Số lượt thực hiện</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Tỷ trọng</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => {
                  const pct = summary.totalWorkOrders ? ((row.count / summary.totalWorkOrders) * 100).toFixed(1) : '0';
                  return (
                    <tr key={row.serviceId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{row.serviceName}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#2563eb' }}>{row.count}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#64748b' }}>{pct}%</td>
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
function InventorySection({ data, summary }: { data: InventoryRow[]; summary: ReportData['summary'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', maxWidth: '400px' }}>
        <SummaryCard
          label="Mã phụ tùng dưới mức cảnh báo tồn kho"
          value={`${summary.lowStockCount ?? 0} mã`}
          icon="warning"
          color={summary.lowStockCount && summary.lowStockCount > 0 ? '#dc2626' : '#059669'}
        />
      </div>

      {data.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3.5rem 2rem', background: '#f0fdf4',
          borderRadius: '0.75rem', border: '1px solid #bbf7d0', color: '#166534',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '0.75rem', color: '#16a34a' }}>
            check_circle
          </span>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '15px', fontWeight: 600 }}>
            Kho phụ tùng đang đảm bảo
          </h3>
          <p style={{ margin: 0, fontSize: '13px' }}>
            Tất cả các mặt hàng phụ tùng đều đạt hoặc vượt mức tồn kho an toàn quy định.
          </p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '1rem 1.25rem', background: '#fef2f2', borderBottom: '1px solid #fee2e2' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
              Danh sách các mặt hàng phụ tùng cần lên đơn đặt nhập thêm
            </h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={thStyle}>Mã SKU</th>
                <th style={thStyle}>Tên phụ tùng</th>
                <th style={thStyle}>Danh mục</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Tồn kho thực tế</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Mức cảnh báo</th>
                <th style={{ ...thStyle, textAlign: 'center', color: '#dc2626' }}>Số lượng thiếu</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    {row.sku}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{row.name}</td>
                  <td style={{ ...tdStyle, color: '#64748b' }}>{row.categoryName}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{row.onHand}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>{row.reorderLevel}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>
                    +{row.deficit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      if (res.data.success) {
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
    <div style={{ padding: '1.75rem 2rem', minHeight: '100vh', background: '#f8f9ff', fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0b1c30' }}>
            Báo cáo vận hành
          </h1>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#dbeafe', color: '#2563eb' }}>
            UC-53
          </span>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#727687' }}>
          Tổng hợp kết quả kinh doanh, số lượt dịch vụ và cảnh báo phụ tùng sắp hết
        </p>
      </div>

      {/* Control Panel */}
      <div style={{
        background: '#ffffff', borderRadius: '0.875rem', border: '1px solid #e5e7eb',
        padding: '1.25rem 1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        {/* Type Selector */}
        <div style={{ marginBottom: reportType !== 'inventory' ? '1.25rem' : 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#727687', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
            Chọn loại báo cáo
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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

        {/* Date Filter (Chỉ hiển thị khi không phải kho) */}
        {reportType !== 'inventory' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                Từ ngày
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                Đến ngày
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
              />
            </div>
            <button
              onClick={fetchReport}
              disabled={loading}
              style={{
                padding: '0.55rem 1.25rem', background: '#059669', color: '#fff',
                border: 'none', borderRadius: '0.5rem', fontSize: '13px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {loading ? 'progress_activity' : 'search'}
              </span>
              {loading ? 'Đang tổng hợp...' : 'Xem báo cáo'}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#727687' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', animation: 'spin 1s linear infinite' }}>
            progress_activity
          </span>
          <p style={{ margin: '0.5rem 0 0', fontSize: '13px' }}>Đang tổng hợp dữ liệu báo cáo...</p>
        </div>
      ) : !hasLoaded ? (
        <div style={{
          textAlign: 'center', padding: '4rem', background: '#ffffff',
          borderRadius: '0.75rem', border: '1px dashed #d1d5db', color: '#9ca3af',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '0.75rem' }}>
            bar_chart
          </span>
          <p style={{ margin: 0, fontSize: '14px' }}>Chọn khoảng thời gian và nhấn <strong>Xem báo cáo</strong></p>
        </div>
      ) : reportData ? (
        <>
          {reportData.type === 'revenue'   && <RevenueSection   data={reportData.data as RevenueRow[]}   summary={reportData.summary} />}
          {reportData.type === 'services'  && <ServicesSection  data={reportData.data as ServiceRow[]}  summary={reportData.summary} />}
          {reportData.type === 'inventory' && <InventorySection data={reportData.data as InventoryRow[]} summary={reportData.summary} />}
        </>
      ) : null}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
