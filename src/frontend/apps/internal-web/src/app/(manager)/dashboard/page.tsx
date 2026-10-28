'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';


// ============ Status config ============
const WO_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  IN_PLANNING:        { label: 'Lập kế hoạch',     color: '#6b7280', bg: '#f3f4f6' },
  PENDING_APPROVAL:   { label: 'Chờ duyệt báo giá', color: '#d97706', bg: '#fef3c7' },
  APPROVED:           { label: 'Đã duyệt',         color: '#2563eb', bg: '#dbeafe' },
  IN_PROGRESS:        { label: 'Đang sửa chữa',    color: '#059669', bg: '#d1fae5' },
  BILLING_REQUESTED:  { label: 'Chờ thanh toán',   color: '#db2777', bg: '#fce7f3' },
  FINANCIAL_CLEARED:  { label: 'Đã thanh toán',    color: '#4f46e5', bg: '#e0e7ff' },
};

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PLANNED:     { label: 'Chưa làm',   color: '#6b7280', bg: '#f3f4f6' },
  IN_PROGRESS: { label: 'Đang sửa',   color: '#2563eb', bg: '#dbeafe' },
  COMPLETED:   { label: 'Hoàn thành', color: '#059669', bg: '#d1fae5' },
  PAUSED:      { label: 'Tạm dừng',   color: '#d97706', bg: '#fef3c7' },
  CANCELLED:   { label: 'Đã hủy',     color: '#9ca3af', bg: '#f3f4f6' },
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

// ============ KPI Card Component ============
function KpiCard({
  label, value, icon, color, bg, subtitle
}: {
  label: string; value: number; icon: string; color: string; bg: string; subtitle?: string;
}) {
  return (
    <div style={{
      background: '#ffffff', borderRadius: '0.875rem', padding: '1.25rem 1.5rem',
      border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '0.375rem' }}>{label}</div>
        <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0b1c30', lineHeight: 1 }}>{value}</div>
        {subtitle && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '0.375rem' }}>{subtitle}</div>}
      </div>
      <div style={{
        width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ color, fontSize: '24px' }}>{icon}</span>
      </div>
    </div>
  );
}

// ============ Job Status Chip ============
function JobBadge({ job }: { job: JobItem }) {
  if (job.isOverdue) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
        background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>alarm</span>
        {job.name} (Quá hạn)
      </span>
    );
  }

  const cfg = JOB_STATUS_CONFIG[job.status] || { label: job.status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
      background: cfg.bg, color: cfg.color, border: '1px solid rgba(0,0,0,0.06)',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color }} />
      {job.name}: {cfg.label}
    </span>
  );
}

// ============ Work Order Card ============
function WorkOrderCard({ wo }: { wo: WorkOrder }) {
  const statusCfg = WO_STATUS_CONFIG[wo.status] || { label: wo.status, color: '#6b7280', bg: '#f3f4f6' };

  return (
    <div style={{
      background: '#ffffff', borderRadius: '0.875rem', border: '1px solid #e5e7eb',
      padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)', transition: 'border-color 0.2s',
    }}>
      {/* Top Header: WO Number & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#059669' }}>assignment</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '14px', color: '#0b1c30' }}>
            {wo.woNumber}
          </span>
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
          background: statusCfg.bg, color: statusCfg.color, border: '1px solid rgba(0,0,0,0.05)',
        }}>
          {statusCfg.label}
        </span>
      </div>

      {/* Vehicle & Customer Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8f9ff', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#727687', marginBottom: '2px' }}>Phương tiện</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: '#0b1c30' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#2563eb' }}>directions_car</span>
            {wo.vehiclePlate}
          </div>
          <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>{wo.vehicleInfo}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#727687', marginBottom: '2px' }}>Khách hàng & Cố vấn</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0b1c30' }}>{wo.customerName}</div>
          <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>
            Cố vấn: <span style={{ fontWeight: 500 }}>{wo.advisorName}</span>
          </div>
        </div>
      </div>

      {/* Services & Jobs breakdown */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#727687', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Tiến độ dịch vụ & hạng mục
        </div>
        {wo.services.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Chưa có dịch vụ nào</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {wo.services.map(svc => (
              <div key={svc.id} style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#059669' }}>handyman</span>
                  {svc.name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {svc.jobs.length === 0 ? (
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Chưa chia hạng mục công việc</span>
                  ) : (
                    svc.jobs.map(j => <JobBadge key={j.id} job={j} />)
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
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/dashboard/workshop');
      if (res.data.success) {
        setData(res.data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu bảng điều hành:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 45000); // Tự động làm mới mỗi 45 giây
    return () => clearInterval(interval);
  }, [fetchData]);

  // Bộ lọc danh sách phiếu
  const filteredWOs = (data?.workOrders || []).filter(wo => {
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

  return (
    <div style={{ padding: '1.75rem 2rem', minHeight: '100vh', background: '#f8f9ff', fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0b1c30' }}>
              Bảng điều hành xưởng
            </h1>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#d1fae5', color: '#059669' }}>
              UC-43
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#727687' }}>
            Theo dõi tình hình hoạt động xe trong xưởng, tiến độ từng hạng mục và các công việc quá hạn
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {lastUpdated && (
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
          )}
          <button
            onClick={fetchData}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem',
              background: '#059669', color: '#fff', border: 'none', borderRadius: '0.5rem',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
            Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '6rem', color: '#727687' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
          <p style={{ marginTop: '0.75rem', fontSize: '13px' }}>Đang tải dữ liệu xưởng dịch vụ...</p>
        </div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#ef4444', fontWeight: 600 }}>Không thể tải dữ liệu điều hành.</p>
          <button onClick={fetchData} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KpiCard
              label="Xe đang xử lý"
              value={data.kpis.totalActive}
              icon="garage"
              color="#2563eb"
              bg="#dbeafe"
              subtitle="Tổng phiếu đang hoạt động"
            />
            <KpiCard
              label="Chờ duyệt báo giá"
              value={data.kpis.pendingApproval}
              icon="pending_actions"
              color="#d97706"
              bg="#fef3c7"
              subtitle="Cần cố vấn xác nhận"
            />
            <KpiCard
              label="Chờ thanh toán"
              value={data.kpis.billingRequested}
              icon="receipt_long"
              color="#db2777"
              bg="#fce7f3"
              subtitle="Đã sửa xong, đợi nghiệm thu"
            />
            <KpiCard
              label="Hạng mục quá hạn"
              value={data.kpis.overdueJobs}
              icon="alarm"
              color="#dc2626"
              bg="#fee2e2"
              subtitle="Cần can thiệp điều phối"
            />
          </div>

          {/* Search & Filter Bar */}
          <div style={{
            background: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
            padding: '1rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '18px' }}>
                  search
                </span>
                <input
                  type="text"
                  placeholder="Tìm theo biển số, mã phiếu, tên khách hàng hoặc cố vấn..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '0.5rem',
                    border: '1px solid #d1d5db', fontSize: '13px', outline: 'none',
                  }}
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', background: '#f9fafb', borderRadius: '0.5rem', fontSize: '12px', cursor: 'pointer' }}
                >
                  Xóa tìm kiếm
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#727687', fontWeight: 600 }}>Trạng thái:</span>
              <button
                onClick={() => setFilterStatus('ALL')}
                style={{
                  padding: '4px 12px', borderRadius: '999px', border: '1px solid',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                  borderColor: filterStatus === 'ALL' ? '#059669' : '#e5e7eb',
                  background: filterStatus === 'ALL' ? '#d1fae5' : '#ffffff',
                  color: filterStatus === 'ALL' ? '#059669' : '#4b5563',
                }}
              >
                Tất cả ({data.workOrders.length})
              </button>
              {Object.entries(WO_STATUS_CONFIG).map(([st, cfg]) => {
                const count = data.workOrders.filter(w => w.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    style={{
                      padding: '4px 12px', borderRadius: '999px', border: '1px solid',
                      fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                      borderColor: filterStatus === st ? cfg.color : '#e5e7eb',
                      background: filterStatus === st ? cfg.bg : '#ffffff',
                      color: filterStatus === st ? cfg.color : '#4b5563',
                    }}
                  >
                    {cfg.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Work Orders List */}
          {data.workOrders.length === 0 ? (
            /* Luồng thay thế 3a: Xưởng đang trống */
            <div style={{
              textAlign: 'center', padding: '4.5rem 2rem', background: '#ffffff',
              borderRadius: '0.875rem', border: '1px dashed #d1d5db', color: '#6b7280',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '54px', color: '#9ca3af', marginBottom: '1rem', display: 'block' }}>
                garage
              </span>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                Hiện tại xưởng chưa có xe nào đang xử lý
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                Tất cả các phiếu dịch vụ đã hoàn tất hoặc chưa có xe mới tiếp nhận.
              </p>
            </div>
          ) : filteredWOs.length === 0 ? (
            /* Luồng ngoại lệ 4a: Không có kết quả lọc */
            <div style={{
              textAlign: 'center', padding: '3.5rem 2rem', background: '#ffffff',
              borderRadius: '0.875rem', border: '1px dashed #d1d5db', color: '#6b7280',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#9ca3af', marginBottom: '0.75rem', display: 'block' }}>
                filter_alt_off
              </span>
              <p style={{ margin: '0 0 0.75rem', fontSize: '14px', fontWeight: 500 }}>
                Không tìm thấy phiếu dịch vụ nào phù hợp với bộ lọc đã chọn.
              </p>
              <button
                onClick={() => { setFilterStatus('ALL'); setSearchQuery(''); }}
                style={{ padding: '0.4rem 1rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '12px', cursor: 'pointer' }}
              >
                Hiển thị tất cả
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '1rem' }}>
              {filteredWOs.map(wo => <WorkOrderCard key={wo.id} wo={wo} />)}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
