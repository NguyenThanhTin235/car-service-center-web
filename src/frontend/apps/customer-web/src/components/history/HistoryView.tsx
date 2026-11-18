'use client';

import React, { useEffect, useState, useMemo } from 'react';
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

const formatMoney = (value?: string | number | null) => {
  if (value === null || value === undefined) return '0 đ';
  const num = Number(value);
  if (isNaN(num)) return '0 đ';
  return `${num.toLocaleString('vi-VN')} đ`;
};

const parseComplaintText = (raw?: string | null): string => {
  if (!raw || !raw.trim()) return 'Kiểm tra bảo dưỡng định kỳ tổng quát phương tiện';
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      const parts: string[] = [];
      if (Array.isArray(parsed.tags) && parsed.tags.length > 0) {
        const validTags = parsed.tags.filter((t: any) => typeof t === 'string' && t.trim().length > 0);
        if (validTags.length > 0) parts.push(validTags.join(', '));
      }
      if (typeof parsed.notes === 'string' && parsed.notes.trim()) {
        parts.push(parsed.notes.trim());
      }
      if (parts.length > 0) return parts.join(' - ');
      return 'Kiểm tra bảo dưỡng định kỳ tổng quát phương tiện';
    }
  } catch {
    // not JSON, fallback to plain text
  }
  const clean = String(raw).trim();
  if (!clean || clean === '{}' || clean === '[]') {
    return 'Kiểm tra bảo dưỡng định kỳ tổng quát phương tiện';
  }
  return clean;
};

const parseSafeText = (raw?: string | null, fallback = 'Bàn giao đầy đủ'): string => {
  if (!raw || !raw.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed.trim() || fallback;
    if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.notes) return String(parsed.notes).trim() || fallback;
      if (parsed.text) return String(parsed.text).trim() || fallback;
      if (Array.isArray(parsed.items) && parsed.items.length > 0) return parsed.items.join(', ');
    }
  } catch {
    // not JSON
  }
  return String(raw).trim() || fallback;
};

async function saveBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function HistoryView({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const dispatch = useAppDispatch();
  const { items, pagination, detail, loading, detailLoading, error } = useAppSelector(
    (s) => s.history
  );
  const vehicles = useAppSelector((s) => s.vehicles.vehicles);

  const [vehicleId, setVehicleId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CLOSED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchWo = item.woNumber.toLowerCase().includes(q);
        const matchPlate = item.vehicle.license_plate.toLowerCase().includes(q);
        const matchCar = `${item.vehicle.make} ${item.vehicle.model}`.toLowerCase().includes(q);
        const matchService = item.services.some((s) => s.name.toLowerCase().includes(q));
        return matchWo || matchPlate || matchCar || matchService;
      }
      return true;
    });
  }, [items, statusFilter, searchQuery]);

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
        await saveBlob(blob, `Bien_Ban_Ban_Giao_${item.woNumber}.pdf`);
        setToastMsg(`Đã tải xuống Biên bản bàn giao #${item.woNumber}`);
      } else if (item.invoice) {
        const blob = await downloadInvoicePdfBlob(item.invoice.id);
        await saveBlob(blob, `Hoa_Don_${item.invoice.invoice_number}.pdf`);
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
    <div className={`w-full max-w-[1440px] mx-auto space-y-6 ${!isEmbedded ? 'px-4 sm:px-6 py-8' : ''}`}>
      {toastMsg && <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />}

      {/* ================= BREADCRUMB & HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {!isEmbedded && (
            <nav className="flex items-center space-x-2 text-on-surface-variant text-xs mb-1.5 font-medium">
              <Link href="/customer" className="hover:text-primary transition-colors">
                Trang chủ
              </Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">Lịch sử dịch vụ</span>
            </nav>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <span className="material-symbols-outlined text-[22px]">history_edu</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sổ Bảo Dưỡng & Lịch Sử Sửa Chữa
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Tra cứu toàn bộ hồ sơ kỹ thuật, biên bản bàn giao điện tử và phụ tùng đã thay thế.
              </p>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/customer/tracking"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] text-blue-600">timeline</span>
            Xem tiến độ xe hiện tại
          </Link>
          <Link
            href="/customer/appointments/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Đặt lịch mới
          </Link>
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
                {formatMoney(stats.totalSpent)}
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
      {loading ? (
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
                        formatMoney(item.invoice?.total_amount)
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
                      {parseComplaintText(item.complaint)}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
          onClick={closeDetail}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-3xl max-h-[92vh] overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Đồng bộ tone sáng gradient với các modal khác */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/60 border-b border-slate-200 flex items-start justify-between shrink-0">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-xs tracking-wider shadow-2xs">
                    {selected.vehicle.license_plate}
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    #{selected.woNumber}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      selected.status === 'CANCELLED'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {STATUS_CONFIG[selected.status]?.label || selected.status}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-blue-600 text-[26px]">menu_book</span>
                  Sổ Bảo Dưỡng Điện Tử
                </h2>
                <div className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    Phương tiện:{' '}
                    <strong className="text-slate-800 font-semibold">
                      {selected.vehicle.make} {selected.vehicle.model} ({selected.vehicle.year || 'N/A'})
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Hoàn tất lúc: <strong className="text-slate-800">{formatDateTime(selected.releasedAt || selected.closedAt)}</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                aria-label="Đóng"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng modal"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-slate-50/80 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveModalTab('overview')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeModalTab === 'overview'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Tổng quan & Tiếp nhận
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('services')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeModalTab === 'services'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Hạng mục & Phụ tùng ({selected.services?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('qc')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeModalTab === 'qc'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Kiểm định QC & Tiến trình
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('handover')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeModalTab === 'handover'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Bàn giao & Bảo hành
              </button>
            </div>

            {/* Modal Body with loading state */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {detailLoading || !detail ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Đang tải đầy đủ hồ sơ...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW */}
                  {activeModalTab === 'overview' && (
                    <div className="space-y-4">
                      
                      {/* Vehicle & Customer summary */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Phương tiện:</span>
                          <span className="font-bold text-slate-900 text-sm font-mono">
                            {detail.vehicle.licensePlate}
                          </span>
                          <span className="text-slate-500 block">
                            {detail.vehicle.make} {detail.vehicle.model}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Cố vấn dịch vụ:</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {detail.advisor?.fullName || 'N/A'}
                          </span>
                          <span className="text-slate-500 block">
                            {detail.advisor?.phone || 'Hotline xưởng'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Chi phí hóa đơn:</span>
                          <span className="font-bold text-emerald-700 text-sm">
                            {formatMoney(detail.invoice?.totalAmount || selected.invoice?.total_amount)}
                          </span>
                          <span className="text-slate-500 block">
                            {detail.invoice?.invoiceNumber ? `HĐ #${detail.invoice.invoiceNumber}` : 'Chưa xuất hóa đơn'}
                          </span>
                        </div>
                      </div>

                      {/* Complaint & Intake Checkin */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[18px] text-blue-600">checklist</span>
                          Tình trạng tiếp nhận ban đầu
                        </h4>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400 block font-medium">Yêu cầu sửa chữa của khách:</span>
                            <p className="font-semibold text-slate-800 text-sm mt-0.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                              {parseComplaintText(detail.checkIn?.complaint || selected.complaint)}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                            <div className="p-2.5 rounded-xl bg-slate-50">
                              <span className="text-slate-400 block">ODO lúc tiếp nhận:</span>
                              <span className="font-bold text-slate-800">
                                {detail.checkIn?.mileage ? `${detail.checkIn.mileage.toLocaleString('vi-VN')} km` : 'N/A'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50">
                              <span className="text-slate-400 block">Mức nhiên liệu vào:</span>
                              <span className="font-bold text-slate-800">
                                {detail.checkIn?.fuelLevel || 'Theo xe'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 col-span-2 sm:col-span-1">
                              <span className="text-slate-400 block">Ngoại thất / Đồ đạc:</span>
                              <span className="font-bold text-slate-800 truncate block">
                                {parseSafeText(detail.checkIn?.belongings, 'Bàn giao đầy đủ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 2: SERVICES & PARTS */}
                  {activeModalTab === 'services' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Danh mục công việc & kỹ thuật thực hiện
                        </h4>
                        <span className="text-xs text-slate-500">
                          {detail.services.length} hạng mục
                        </span>
                      </div>

                      {detail.services.length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center bg-slate-50 rounded-2xl">
                          Không có hạng mục nào được ghi nhận.
                        </p>
                      ) : (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                          {detail.services.map((svc, idx) => (
                            <div key={svc.id} className="p-3.5 sm:p-4 flex items-start justify-between gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <div>
                                  <h5 className="font-bold text-slate-900 text-sm">{svc.name}</h5>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Phân loại: <span className="font-medium text-slate-700">{svc.categoryName || 'Sửa chữa'}</span>
                                  </p>
                                </div>
                              </div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                Hoàn thành
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: QC & TIMELINE */}
                  {activeModalTab === 'qc' && (
                    <div className="space-y-4">
                      {/* QC Card */}
                      {detail.qcReport?.hasQc ? (
                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 text-xs sm:text-sm flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-emerald-600">verified</span>
                              Kiểm định chất lượng xưởng (QC Passed)
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              {detail.qcReport.passedItems}/{detail.qcReport.totalItems} tiêu chuẩn đạt
                            </span>
                          </div>
                          <p className="text-xs text-emerald-800">
                            Kỹ thuật viên KCS nghiệm thu:{' '}
                            <b>{detail.qcReport.inspectorName || 'Trưởng ban kiểm định'}</b> · Ngày nghiệm thu:{' '}
                            {formatDateTime(detail.qcReport.inspectedAt)}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400">info</span>
                          Hồ sơ nghiệm thu tiêu chuẩn theo quy trình xuất xưởng gara.
                        </div>
                      )}

                      {/* Steps Timeline */}
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Tiến trình chu trình dịch vụ
                        </h4>
                        <ol className="relative border-l border-slate-200 ml-3 space-y-4 py-2">
                          {detail.steps.map((st) => (
                            <li key={st.stepIndex} className="ml-5 space-y-0.5">
                              <span
                                className={`absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white ${
                                  st.status === 'COMPLETED'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[12px]">
                                  {st.status === 'COMPLETED' ? 'check' : 'remove'}
                                </span>
                              </span>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 text-xs sm:text-sm">{st.title}</p>
                                {st.time && (
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {st.time}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">{st.description}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: HANDOVER & WARRANTY */}
                  {activeModalTab === 'handover' && (
                    <div className="space-y-4">
                      
                      {/* Warranty box */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-2">
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-600">verified_user</span>
                          Chính sách bảo hành phương tiện & phụ tùng
                        </h4>
                        <p className="text-xs sm:text-sm text-amber-950 font-medium">
                          {selected.warrantyTerms ||
                            'Bảo hành chính hãng 06 tháng hoặc 10.000 km cho toàn bộ phụ tùng thay thế và công việc sửa chữa kỹ thuật đã thực hiện tại xưởng.'}
                        </p>
                      </div>

                      {/* Handover specs */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-emerald-600">output</span>
                          Thông số nghiệm thu lúc xuất xưởng
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50">
                            <span className="text-slate-400 block font-medium">Số ODO xuất xưởng:</span>
                            <span className="font-bold text-slate-800 text-sm">
                              {selected.mileageOut ? `${selected.mileageOut.toLocaleString('vi-VN')} km` : 'N/A'}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50">
                            <span className="text-slate-400 block font-medium">Thời gian bàn giao:</span>
                            <span className="font-bold text-slate-800 text-xs">
                              {formatDateTime(selected.releasedAt || selected.closedAt)}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 col-span-2 sm:col-span-1">
                            <span className="text-slate-400 block font-medium">Xác nhận khách hàng:</span>
                            <span className="font-bold text-emerald-700 text-xs flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[14px]">done_all</span>
                              Đã ký nhận xe
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 font-medium hidden sm:block">
                Hotline cố vấn kỹ thuật: <b className="text-slate-800">1900 6868</b>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                {selected.hasHandoverPdf && (
                  <button
                    type="button"
                    onClick={() => handleDownload('handover', selected)}
                    disabled={downloading === `handover-${selected.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Biên bản bàn giao (PDF)
                  </button>
                )}

                {selected.invoice && (
                  <button
                    type="button"
                    onClick={() => handleDownload('invoice', selected)}
                    disabled={downloading === `invoice-${selected.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    Hóa đơn VAT
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeDetail}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-200/60 text-xs font-bold cursor-pointer transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
