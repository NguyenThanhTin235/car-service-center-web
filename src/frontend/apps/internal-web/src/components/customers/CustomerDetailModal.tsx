'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { formatVND } from '@/lib/utils/formatters';
import ReadOnlyROModal from '@/components/intake/ReadOnlyROModal';

interface ServiceHistoryItem {
  id: number;
  name: string;
  status: string;
}

interface ServiceHistoryRecord {
  id: number;
  woNumber: string;
  status: string;
  orderType: string;
  createdAt: string;
  closedAt: string | null;
  mileage: number | null;
  vehicle: {
    id: number;
    licensePlate: string;
    make: string;
    model: string;
    year: number | null;
  } | null;
  advisor: {
    id: number;
    fullName: string;
  } | null;
  services: ServiceHistoryItem[];
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
    paidAt: string | null;
  } | null;
}

interface ServiceHistorySummary {
  totalOrders: number;
  totalVisits: number;
  totalSpent: number;
}

const WO_STATUS_META: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Nháp', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  IN_PLANNING: { label: 'Đang lập kế hoạch', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  PENDING_APPROVAL: { label: 'Chờ duyệt báo giá', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Đã duyệt', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  IN_PROGRESS: { label: 'Đang sửa chữa', className: 'bg-blue-50 text-[#0050cd] border-blue-200' },
  BILLING_REQUESTED: { label: 'Chờ thanh toán', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  FINANCIAL_CLEARED: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RELEASED: { label: 'Đã giao xe', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOSED: { label: 'Hoàn tất', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const INVOICE_STATUS_META: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ISSUED: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PARTIALLY_PAID: { label: 'Thanh toán một phần', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  DRAFT: { label: 'Nháp', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerData: any;
}

export default function CustomerDetailModal({ isOpen, onClose, customerData }: CustomerDetailModalProps) {
  const [records, setRecords] = useState<ServiceHistoryRecord[]>([]);
  const [summary, setSummary] = useState<ServiceHistorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);

  const fetchHistory = useCallback(async (customerId: number, isCancelled?: () => boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/customers/${customerId}/service-history`);
      if (isCancelled?.()) return;
      const data = res.data?.data;
      setRecords(Array.isArray(data?.records) ? data.records : []);
      setSummary(data?.summary ?? null);
    } catch (err: any) {
      if (isCancelled?.()) return;
      setError(err?.response?.data?.message || 'Không thể tải lịch sử dịch vụ tại xưởng.');
      setRecords([]);
    } finally {
      if (!isCancelled?.()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !customerData?.id) {
      setRecords([]);
      setSummary(null);
      setError(null);
      setSelectedWorkOrderId(null);
      return;
    }

    let cancelled = false;
    fetchHistory(customerData.id, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [isOpen, customerData?.id, fetchHistory]);

  if (!isOpen || !customerData) return null;

  // Vietnamese last word initial e.g. "Nguyễn Văn An" -> "A"
  const getInitial = (name: string) => {
    if (!name) return 'K';
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1]?.[0]?.toUpperCase() || 'K';
  };

  const displayTotalSpent = summary?.totalSpent ?? customerData.stats?.totalSpent ?? 0;
  const displayTotalVisits = summary?.totalVisits ?? customerData.stats?.totalVisits ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header (Sticky top) */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#0050cd] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Hồ sơ chi tiết Khách hàng</h2>
              <p className="text-xs text-slate-500">Mã định danh KH #{customerData.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 styled-scrollbar">
          {/* Main Info Hero Box */}
          <div className="flex flex-col md:flex-row gap-5 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 rounded-2xl border border-slate-200/80 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0050cd] to-[#0866ff] text-white font-extrabold flex items-center justify-center text-2xl shrink-0 shadow-md shadow-blue-500/20">
                {getInitial(customerData.fullName)}
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-extrabold text-slate-900">{customerData.fullName}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
                    <span className="material-symbols-outlined text-[15px] text-[#0050cd]">phone_iphone</span>
                    <span>{customerData.phone}</span>
                  </div>
                  {customerData.email && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">mail</span>
                      <span>{customerData.email}</span>
                    </div>
                  )}
                  {customerData.address && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                      <span>{customerData.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Financial Aggregates */}
            <div className="flex md:flex-col gap-4 md:gap-2.5 md:border-l md:border-slate-200/80 md:pl-6 w-full md:w-auto pt-3 md:pt-0 border-t border-slate-200/60 md:border-t-0">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Tổng chi tiêu</span>
                <div className="text-base font-extrabold text-[#0050cd] font-mono tabular-nums">
                  {formatVND(displayTotalSpent)}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Lượt dịch vụ</span>
                <div className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                  {displayTotalVisits} lượt hoàn tất
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0050cd]">directions_car</span>
                <span>Phương tiện sở hữu ({(customerData.vehicles || []).length})</span>
              </h4>
            </div>
            
            {customerData.vehicles && customerData.vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customerData.vehicles.map((v: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3.5 hover:border-blue-300 transition-all shadow-2xs">
                    <div className="w-11 h-11 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                      <span className="material-symbols-outlined text-[22px]">directions_car</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="px-2 py-0.5 rounded-md border border-slate-300 bg-slate-100 font-mono text-xs font-extrabold text-slate-900 w-fit mb-1 tracking-wider">
                        {v.licensePlate}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {v.make} {v.model}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        Màu: {v.color || 'N/A'} • Cỡ xe: {{
                          SMALL: 'Nhỏ',
                          MEDIUM: 'Vừa',
                          LARGE: 'Lớn',
                          EXTRA_LARGE: 'Rất lớn',
                          TRUCK: 'Xe tải'
                        }[v.vehicleSize as string] || v.vehicleSize}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500 text-xs">
                Khách hàng này chưa đăng ký phương tiện nào trong hệ thống.
              </div>
            )}
          </div>

          {/* Service History Section */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0050cd]">history</span>
                <span>Lịch sử Dịch vụ tại Xưởng ({records.length})</span>
              </h4>
            </div>

            {loading ? (
              <div
                data-testid="service-history-loading"
                className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs"
              >
                <span className="w-5 h-5 border-2 border-[#0050cd]/30 border-t-[#0050cd] rounded-full animate-spin" />
                <span>Đang đồng bộ lịch sử dịch vụ từ xưởng...</span>
              </div>
            ) : error ? (
              <div
                data-testid="service-history-error"
                className="p-5 rounded-xl bg-rose-50/70 border border-rose-200 text-center flex flex-col items-center justify-center gap-2.5"
              >
                <span className="material-symbols-outlined text-[26px] text-rose-500">error</span>
                <p className="text-xs font-medium text-rose-700">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchHistory(customerData.id)}
                  className="h-8 px-3.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : records.length === 0 ? (
              <div
                data-testid="service-history-empty"
                className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[28px] text-slate-400">build_circle</span>
                <p className="font-medium text-slate-600">Chưa có lịch sử sửa chữa hoặc bảo dưỡng tại xưởng</p>
                <span className="text-[11px] text-slate-500">Dữ liệu sẽ tự động hiển thị khi khách hàng phát sinh Phiếu công việc (Work Order).</span>
              </div>
            ) : (
              <div data-testid="service-history-list" className="space-y-3">
                {records.map((rec) => {
                  const statusMeta = WO_STATUS_META[rec.status] ?? {
                    label: rec.status,
                    className: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  const invoiceMeta = rec.invoice
                    ? INVOICE_STATUS_META[rec.invoice.status] ?? {
                        label: rec.invoice.status,
                        className: 'bg-slate-100 text-slate-600 border-slate-200',
                      }
                    : null;

                  return (
                    <div
                      key={rec.id}
                      data-testid={`service-history-item-${rec.woNumber}`}
                      className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {rec.woNumber}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                          {rec.orderType === 'WARRANTY' && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                              Bảo hành
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {new Date(rec.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                          <button
                            type="button"
                            data-testid={`view-wo-detail-${rec.woNumber}`}
                            onClick={() => setSelectedWorkOrderId(rec.id)}
                            className="h-7 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0050cd] text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            Xem chi tiết phiếu
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                        {rec.vehicle && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">directions_car</span>
                            <strong className="font-mono text-slate-800">{rec.vehicle.licensePlate}</strong>
                            <span>
                              ({rec.vehicle.make} {rec.vehicle.model})
                            </span>
                          </span>
                        )}
                        {rec.mileage !== null && (
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">speed</span>
                            {rec.mileage.toLocaleString('vi-VN')} km
                          </span>
                        )}
                        {rec.advisor && (
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">support_agent</span>
                            CV: {rec.advisor.fullName}
                          </span>
                        )}
                      </div>

                      {rec.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {rec.services.map((svc) => (
                            <span
                              key={svc.id}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-slate-700 font-medium"
                            >
                              {svc.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {rec.invoice && (
                        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/staff/billing/${rec.invoice.id}`}
                              className="font-mono font-semibold text-[#0050cd] hover:underline inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                              {rec.invoice.invoiceNumber}
                            </Link>
                            {invoiceMeta && (
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${invoiceMeta.className}`}>
                                {invoiceMeta.label}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {formatVND(rec.invoice.totalAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-end">
          <button
            onClick={onClose}
            type="button"
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng hồ sơ
          </button>
        </div>
      </div>

      {selectedWorkOrderId && (
        <ReadOnlyROModal
          workOrderId={selectedWorkOrderId}
          onClose={() => setSelectedWorkOrderId(null)}
        />
      )}
    </div>
  );
}
