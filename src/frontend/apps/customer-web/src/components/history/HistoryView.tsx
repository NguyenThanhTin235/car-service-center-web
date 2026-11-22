'use client';

import React, { useDeferredValue, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchMyHistory,
  fetchHistoryDetail,
  clearHistoryDetail,
  RepairHistoryItem,
} from '@/store/slices/historySlice';
import { fetchVehicles } from '@/store/slices/vehicleSlice';
import { downloadHandoverPdfBlob } from '@/lib/api/work-order.api';
import { downloadInvoicePdfBlob } from '@/lib/api/invoice.api';
import Toast from '@/components/shared/Toast';
import { downloadPdfBlob, formatVnd, parseComplaintText } from '@/utils/customerHelpers';

const DEFAULT_COMPLAINT_FALLBACK = 'Kiểm tra bảo dưỡng định kỳ tổng quát phương tiện';

const HistoryDetailModal = dynamic(() => import('./HistoryDetailModal'));

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: string; dotClass: string }
> = {
  CLOSED: {
    label: 'Hoàn tất & Lưu trữ',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: 'verified',
    dotClass: 'bg-emerald-500',
  },
  RELEASED: {
    label: 'Đã giao xe',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    icon: 'local_shipping',
    dotClass: 'bg-blue-500',
  },
  CANCELLED: {
    label: 'Đã hủy dịch vụ',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
    icon: 'cancel',
    dotClass: 'bg-slate-400',
  },
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

export default function HistoryView({
  onViewTracking,
  onBookNew,
}: {
  onViewTracking?: () => void;
  onBookNew?: () => void;
}) {
  const dispatch = useAppDispatch();
  const { items, pagination, detail, loading, detailLoading, error } = useAppSelector(
    (s) => s.history
  );
  const vehicles = useAppSelector((s) => s.vehicles.vehicles);

  const [vehicleId, setVehicleId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CLOSED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RepairHistoryItem | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'services' | 'qc' | 'handover'>('overview');

  useEffect(() => {
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, vehicles.length]);

  useEffect(() => {
    dispatch(
      fetchMyHistory({
        vehicleId: vehicleId ? Number(vehicleId) : undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        limit: 10,
      })
    );
  }, [dispatch, vehicleId, from, to, page]);

  // Client-side filtering for fast interactive search & status tab
  const displayItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === 'CLOSED' && item.status !== 'CLOSED' && item.status !== 'RELEASED') return false;
      if (statusFilter === 'CANCELLED' && item.status !== 'CANCELLED') return false;
      if (deferredSearchQuery.trim()) {
        const q = deferredSearchQuery.toLowerCase().trim();
        const matchWo = item.woNumber.toLowerCase().includes(q);
        const matchPlate = item.vehicle.license_plate.toLowerCase().includes(q);
        const matchCar = `${item.vehicle.make} ${item.vehicle.model}`.toLowerCase().includes(q);
        const matchService = item.services.some((s) => s.name.toLowerCase().includes(q));
        return matchWo || matchPlate || matchCar || matchService;
      }
      return true;
    });
  }, [items, statusFilter, deferredSearchQuery]);

  // Statistics calculation for Bento cards
  const stats = useMemo(() => {
    const totalServices = items.length;
    const completedCount = items.filter((i) => i.status === 'CLOSED' || i.status === 'RELEASED').length;
    const totalSpent = items.reduce((sum, i) => {
      if (i.invoice?.total_amount) {
        return sum + Number(i.invoice.total_amount);
      }
      return sum;
    }, 0);
    const latestItem = items[0];
    return {
      totalServices,
      completedCount,
      totalSpent,
      latestDate: latestItem ? formatDate(latestItem.releasedAt || latestItem.closedAt || latestItem.createdAt) : '—',
      latestOdo: latestItem?.mileageOut || latestItem?.mileageIn || null,
    };
  }, [items]);

  const openDetail = (item: RepairHistoryItem) => {
    setSelected(item);
    setActiveModalTab('overview');
    dispatch(fetchHistoryDetail(item.id));
  };

  const closeDetail = () => {
    setSelected(null);
    dispatch(clearHistoryDetail());
  };

  const handleDownload = async (kind: 'handover' | 'invoice', item: RepairHistoryItem) => {
    const key = `${kind}-${item.id}`;
    try {
      setDownloading(key);
      if (kind === 'handover') {
        const blob = await downloadHandoverPdfBlob(item.id);
        downloadPdfBlob(blob, `Bien_Ban_Ban_Giao_${item.woNumber}.pdf`);
        setToastMsg(`Đã tải xuống Biên bản bàn giao #${item.woNumber}`);
      } else if (item.invoice) {
        const blob = await downloadInvoicePdfBlob(item.invoice.id);
        downloadPdfBlob(blob, `Hoa_Don_${item.invoice.invoice_number}.pdf`);
        setToastMsg(`Đã tải xuống Hóa đơn #${item.invoice.invoice_number}`);
      }
      setToastType('success');
    } catch (err: any) {
      setToastMsg('Không thể tải PDF: ' + (err.response?.data?.message || err.message || 'Lỗi hệ thống'));
      setToastType('error');
    } finally {
      setDownloading(null);
    }
  };

  const resetFilters = () => {
    setVehicleId('');
    setStatusFilter('ALL');
    setSearchQuery('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6">
      {toastMsg && <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />}

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">history_edu</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Lịch sử bảo dưỡng
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Tra cứu toàn bộ hồ sơ kỹ thuật, biên bản bàn giao điện tử và phụ tùng đã thay thế.
              </p>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onViewTracking ? (
            <button
              type="button"
              onClick={onViewTracking}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-accent shrink-0">timeline</span>
              <span>Xem tiến độ xe hiện tại</span>
            </button>
          ) : (
            <Link
              href="/customer/profile?tab=tracking"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-all active:scale-95 whitespace-nowrap shrink-0"
            >
              <span className="material-symbols-outlined text-[18px] text-accent shrink-0">timeline</span>
              <span>Xem tiến độ xe hiện tại</span>
            </Link>
          )}
          {onBookNew ? (
            <button
              type="button"
              onClick={onBookNew}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] shrink-0">add_circle</span>
              <span>Đặt lịch mới</span>
            </button>
          ) : (
            <Link
              href="/customer/profile?tab=appointments"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0"
            >
              <span className="material-symbols-outlined text-[18px] shrink-0">add_circle</span>
              <span>Đặt lịch mới</span>
            </Link>
          )}
        </div>
      </div>

      {/* ================= 3 BENTO METRIC CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Card 1: Tổng lượt bảo dưỡng */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tổng lượt hoàn tất
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {stats.completedCount}{' '}
                <span className="text-sm font-medium text-slate-500">hồ sơ</span>
              </h3>
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                <span>{stats.totalServices} lượt tiếp nhận đã ghi nhận</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[26px]">car_repair</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tổng chi phí tích lũy */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Chi phí đã quyết toán
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {formatVnd(stats.totalSpent)}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">receipt_long</span>
                <span>Đã bao gồm VAT & phiếu xuất kho</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[26px]">account_balance_wallet</span>
            </div>
          </div>
        </div>

        {/* Card 3: Lần bảo dưỡng gần nhất */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Lần xuất xưởng gần nhất
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {stats.latestDate}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                <span className="material-symbols-outlined text-[16px] text-amber-500">speed</span>
                <span>
                  {stats.latestOdo ? `ODO: ${Number(stats.latestOdo).toLocaleString('vi-VN')} km` : 'Ghi nhận theo xe'}
                </span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[26px]">history</span>
            </div>
          </div>
        </div>

      </div>

      {/* ================= MAIN TOOLBAR & FILTERS ================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4">
        
        {/* Row 1: Search + Quick Status Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl shrink-0 self-start">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CLOSED')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                statusFilter === 'CLOSED'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Đã hoàn tất ({items.filter((i) => i.status === 'CLOSED' || i.status === 'RELEASED').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CANCELLED')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                statusFilter === 'CANCELLED'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Đã hủy ({items.filter((i) => i.status === 'CANCELLED').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh theo mã phiếu #WO, biển số, tên dịch vụ..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters (Vehicle, Date Range, Reset) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          
          {/* Vehicle selector */}
          <div className="relative">
            <select
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo phương tiện"
              className="w-full px-3.5 py-2 pl-9 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-blue-500 appearance-none font-medium text-slate-800 cursor-pointer"
            >
              <option value="">Tất cả xe của tôi</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} — {v.make} {v.model}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              directions_car
            </span>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Date from */}
          <div className="relative">
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              aria-label="Từ ngày"
              className="w-full px-3.5 py-2 pl-9 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              calendar_today
            </span>
          </div>

          {/* Date to */}
          <div className="relative">
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              aria-label="Đến ngày"
              className="w-full px-3.5 py-2 pl-9 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              event
            </span>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
            Xóa bộ lọc
          </button>
        </div>

      </div>

      {/* ================= HISTORY LIST ================= */}
      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Đang tải sổ bảo dưỡng điện tử...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          <p className="text-sm font-bold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => dispatch(fetchMyHistory({ page: 1, limit: 10 }))}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Thử lại
          </button>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-3xl">history_toggle_off</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ nào</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
              Bạn chưa có hồ sơ bảo dưỡng nào khớp với điều kiện lọc hiện tại hoặc xe chưa hoàn tất chu trình sửa chữa.
            </p>
          </div>
          {(vehicleId || from || to || searchQuery || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 cursor-pointer"
            >
              Hiển thị tất cả hồ sơ
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayItems.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.CLOSED;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all space-y-4"
              >
                {/* Card Top: Plate + WO + Status Badge + Price */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  
                  {/* Left: License plate badge & WO */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* VN Style license plate */}
                    <div className="inline-flex items-center px-3 py-1 bg-slate-900 text-white rounded-lg font-mono font-extrabold text-xs sm:text-sm tracking-wider shadow-sm border border-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2"></span>
                      {item.vehicle.license_plate}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {item.vehicle.make} {item.vehicle.model}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{item.woNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Tiếp nhận: {formatDate(item.createdAt)} ·{' '}
                        {item.status === 'CANCELLED' ? 'Hủy lệnh' : 'Xuất xưởng'}:{' '}
                        {formatDate(item.releasedAt || item.closedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status badge & Total Price */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`}></span>
                      {cfg.label}
                    </span>

                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {item.status === 'CANCELLED' && !item.invoice ? (
                        <span className="text-xs font-semibold text-slate-400">Miễn phí kiểm tra</span>
                      ) : (
                        formatVnd(item.invoice?.total_amount)
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Middle: Key Metadata Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1 text-xs">
                  
                  {/* ODO */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[15px] text-blue-500">speed</span>
                      Chỉ số ODO
                    </span>
                    <p className="font-bold text-slate-800 text-xs sm:text-sm">
                      {item.mileageIn ? `${item.mileageIn.toLocaleString('vi-VN')}` : '—'}
                      <span className="text-slate-400 font-normal"> → </span>
                      {item.mileageOut ? `${item.mileageOut.toLocaleString('vi-VN')} km` : '—'}
                    </p>
                  </div>

                  {/* Cố vấn dịch vụ */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[15px] text-indigo-500">person</span>
                      Cố vấn phụ trách
                    </span>
                    <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                      {item.advisor?.full_name || 'Cố vấn xưởng'}
                    </p>
                  </div>

                  {/* Yêu cầu của khách */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5 col-span-2 sm:col-span-2">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[15px] text-amber-500">description</span>
                      Yêu cầu lúc tiếp nhận
                    </span>
                    <p className="font-medium text-slate-700 text-xs sm:text-sm line-clamp-1">
                      {parseComplaintText(item.complaint, DEFAULT_COMPLAINT_FALLBACK)}
                    </p>
                  </div>

                </div>

                {/* Card Services: Chips list */}
                {item.services && item.services.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hạng mục đã thực hiện ({item.services.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {item.services.slice(0, 4).map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 text-xs font-medium"
                        >
                          <span className="material-symbols-outlined text-[14px] text-blue-600">check</span>
                          {s.name}
                        </span>
                      ))}
                      {item.services.length > 4 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                          +{item.services.length - 4} hạng mục khác
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Warranty Banner (if exists) */}
                {item.warrantyTerms && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900">
                    <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0">
                      verified_user
                    </span>
                    <span className="font-medium truncate">
                      <b>Chính sách bảo hành:</b> {item.warrantyTerms}
                    </span>
                  </div>
                )}

                {/* Card Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-400 font-medium">
                    Hồ sơ điện tử lưu trữ trên hệ thống Car Service Center
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Nút tải Biên bản bàn giao PDF */}
                    {item.hasHandoverPdf && (
                      <button
                        type="button"
                        onClick={() => handleDownload('handover', item)}
                        disabled={downloading === `handover-${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        title="Tải biên bản bàn giao PDF"
                      >
                        {downloading === `handover-${item.id}` ? (
                          <span className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px] text-emerald-700">download</span>
                        )}
                        <span>Biên bản bàn giao</span>
                      </button>
                    )}

                    {/* Nút tải Hóa đơn VAT PDF */}
                    {item.invoice && (
                      <button
                        type="button"
                        onClick={() => handleDownload('invoice', item)}
                        disabled={downloading === `invoice-${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        title="Tải hóa đơn VAT điện tử"
                      >
                        {downloading === `invoice-${item.id}` ? (
                          <span className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                        )}
                        <span>Hóa đơn #{item.invoice.invoice_number}</span>
                      </button>
                    )}

                    {/* Nút Xem chi tiết hồ sơ */}
                    <button
                      type="button"
                      onClick={() => openDetail(item)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Xem sổ bảo dưỡng</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm">
          <span className="text-slate-500">
            Hiển thị trang <b className="text-slate-900">{pagination.page}</b> / {pagination.totalPages} ({pagination.total} hồ sơ)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              Trang trước
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Trang sau
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= COMPREHENSIVE DETAIL MODAL (ELECTRONIC SERVICE BOOK) ================= */}
      {selected && (
        <HistoryDetailModal
          selected={selected}
          detail={detail}
          detailLoading={detailLoading}
          activeModalTab={activeModalTab}
          setActiveModalTab={setActiveModalTab}
          downloading={downloading}
          onDownload={handleDownload}
          onClose={closeDetail}
          statusConfig={STATUS_CONFIG}
          formatDateTime={formatDateTime}
        />
      )}

    </div>
  );
}
