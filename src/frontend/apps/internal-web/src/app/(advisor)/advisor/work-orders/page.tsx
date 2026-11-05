'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { WorkOrder, getWorkOrders } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

const WO_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: {
    label: 'Tiếp nhận',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-500',
  },
  IN_PLANNING: {
    label: 'Lập kế hoạch',
    bg: 'bg-blue-50',
    text: 'text-[#0050cd]',
    dot: 'bg-[#0050cd]',
  },
  PENDING_APPROVAL: {
    label: 'Chờ duyệt',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Đã duyệt',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  IN_PROGRESS: {
    label: 'Đang sửa chữa',
    bg: 'bg-blue-50',
    text: 'text-[#0050cd]',
    dot: 'bg-[#0050cd]',
  },
  BILLING_REQUESTED: {
    label: 'Chờ thanh toán',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  FINANCIAL_CLEARED: {
    label: 'Chờ giao xe',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    dot: 'bg-teal-500',
  },
  RELEASED: {
    label: 'Đã giao xe',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Đã đóng',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
};

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'DRAFT', label: 'Tiếp nhận' },
  { value: 'IN_PLANNING', label: 'Lập kế hoạch' },
  { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'IN_PROGRESS', label: 'Đang sửa chữa' },
  { value: 'BILLING_REQUESTED', label: 'Chờ thanh toán' },
  { value: 'FINANCIAL_CLEARED', label: 'Chờ giao xe' },
  { value: 'RELEASED', label: 'Đã giao xe' },
  { value: 'CLOSED', label: 'Đã đóng' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function WorkOrdersPage() {
  const router = useRouter();

  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchWOs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWorkOrders({
        page: currentPage,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });

      if (res.success && res.data) {
        setItems(res.data);
        if (res.meta?.pagination) {
          setTotalRecords(res.meta.pagination.total);
          setTotalPages(res.meta.pagination.totalPages || 1);
        } else {
          setTotalRecords(res.data.length);
          setTotalPages(Math.ceil(res.data.length / limit) || 1);
        }
      }
    } catch {
      toast.error('Lỗi tải danh sách phiếu công việc');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchWOs();
  }, [fetchWOs]);

  const pageStats = useMemo(() => {
    const inWork = items.filter((i) =>
      ['DRAFT', 'IN_PLANNING', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS'].includes(i.status)
    ).length;
    const completed = items.filter((i) =>
      ['BILLING_REQUESTED', 'FINANCIAL_CLEARED', 'RELEASED', 'CLOSED'].includes(i.status)
    ).length;
    const inWorkPct = items.length > 0 ? Math.round((inWork / items.length) * 100) : 65;
    return {
      inWork,
      completed,
      inWorkPct,
      completedPct: 100 - inWorkPct,
    };
  }, [items]);

  return (
    <div className="flex flex-col gap-5 px-4 sm:px-6 py-3 max-w-[1440px] mx-auto w-full">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
            Phiếu công việc
          </h1>
        </div>

        <button
          onClick={fetchWOs}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full text-xs font-bold text-zinc-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          title="Tải lại danh sách"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span>Làm mới</span>
        </button>
      </div>

      {/* 2. 3-TONE HERO BENTO STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Dark Navy */}
        <div className="bg-[#0c2340] text-white rounded-[28px] p-5 flex flex-col justify-between min-h-[170px] shadow-md">
          <div>
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Tổng Số Phiếu Công Việc</span>
              <span className="material-symbols-outlined text-[18px]">assignment</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums">
                {totalRecords}
              </span>
              <span className="text-xs text-zinc-400">phiếu trên hệ thống</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Hiển thị trên trang này</span>
            <span className="bg-white text-zinc-900 font-mono font-extrabold px-2.5 py-0.5 rounded-lg text-[11px] tabular-nums">
              {items.length} phiếu
            </span>
          </div>
        </div>

        {/* Card 2: Vibrant Royal Blue */}
        <div className="bg-[#0050cd] text-white rounded-[28px] p-5 flex flex-col justify-between min-h-[170px] shadow-md shadow-[#0050cd]/20">
          <div>
            <div className="flex items-center justify-between text-blue-100 text-xs font-medium">
              <span>Đang Triển Khai / Lập Kế Hoạch</span>
              <span className="material-symbols-outlined text-[18px]">engineering</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums">
                {pageStats.inWork}
              </span>
              <span className="text-xs font-semibold text-blue-100">phiếu đang xử lý</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="bg-[#0c2340] rounded-2xl p-1.5 flex items-stretch h-10 gap-1.5">
              <div
                style={{ width: `${Math.max(25, Math.min(75, pageStats.inWorkPct))}%` }}
                className="bg-white text-zinc-900 rounded-xl px-2.5 flex items-center font-mono font-extrabold text-xs tabular-nums"
              >
                {pageStats.inWorkPct}% mở
              </div>
              <div className="flex-1 text-white px-2.5 flex items-center font-mono font-extrabold text-xs tabular-nums">
                {pageStats.completedPct}% xong
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Soft Cool Slate */}
        <div className="bg-[#e4e7ec] text-zinc-900 rounded-[28px] p-5 flex flex-col justify-between min-h-[170px] shadow-xs sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
              <span>Hoàn Tất / Chờ Bàn Giao</span>
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums">
                {pageStats.completed}
              </span>
              <span className="text-xs font-bold text-emerald-700">Sẵn sàng thanh toán & giao xe</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-300/80 flex items-center justify-between text-xs">
            <span className="text-slate-600">Trạng thái lọc hiện tại</span>
            <span className="bg-[#0c2340] text-white font-mono font-bold px-2.5 py-0.5 rounded-lg text-[11px]">
              {STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label || 'Tất cả'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN BENTO TABLE & FILTER WORKSPACE */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/70 shadow-xs flex flex-col gap-5">
        {/* Search & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo mã phiếu (RO), biển số xe, tên khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#f2f4f8] border border-transparent rounded-2xl focus:outline-none focus:border-[#0050cd] focus:bg-white text-zinc-900 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-zinc-900 p-0.5 rounded cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Segmented Pill Status Filter + Dropdown for full statuses */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            <div className="bg-[#f2f4f8] p-1 rounded-2xl inline-flex items-center gap-1 shrink-0">
              {[
                { value: 'ALL', label: 'Tất cả' },
                { value: 'IN_PLANNING', label: 'Kế hoạch' },
                { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
                { value: 'IN_PROGRESS', label: 'Đang sửa' },
                { value: 'FINANCIAL_CLEARED', label: 'Chờ giao' },
              ].map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(pill.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === pill.value
                      ? 'bg-[#0050cd] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-zinc-900'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc trạng thái phiếu công việc"
              className="px-3.5 py-2 bg-[#f2f4f8] hover:bg-slate-200/70 rounded-2xl text-xs text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-[#0050cd]/30 transition-colors cursor-pointer shrink-0"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3 text-slate-500">
            <span className="material-symbols-outlined animate-spin text-[36px] text-[#0050cd]">
              progress_activity
            </span>
            <span className="text-xs font-semibold">Đang tải danh sách phiếu công việc...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-3 pr-3">Phương tiện & Biển số</th>
                  <th className="py-3 px-3">Mã phiếu (RO)</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Khách hàng</th>
                  <th className="py-3 px-3 hidden md:table-cell">Cố vấn</th>
                  <th className="py-3 pl-3 text-right">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[40px] text-slate-300">
                          content_paste_off
                        </span>
                        <span className="text-sm font-bold text-zinc-800">
                          Không có phiếu công việc nào
                        </span>
                        <span className="text-xs text-slate-500 max-w-sm">
                          {debouncedSearch || statusFilter !== 'ALL'
                            ? 'Thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn bộ lọc trạng thái.'
                            : 'Hiện tại chưa có phiếu công việc nào được tạo trong hệ thống.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const statusConfig = WO_STATUS_CONFIG[item.status] || {
                      label: item.status,
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                      dot: 'bg-slate-400',
                    };

                    const vehicleName =
                      [item.vehicle?.make, item.vehicle?.model].filter(Boolean).join(' ') ||
                      'Phương tiện';

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/advisor/work-orders/${item.id}`)}
                      >
                        {/* Vehicle Thumbnail + License Plate */}
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0050cd] flex items-center justify-center shrink-0 group-hover:bg-[#0050cd] group-hover:text-white transition-colors">
                              <span className="material-symbols-outlined text-[20px]">
                                directions_car
                              </span>
                            </div>
                            <div>
                              <div className="font-mono font-extrabold text-zinc-900 uppercase">
                                {item.vehicle?.license_plate || 'N/A'}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">{vehicleName}</div>
                            </div>
                          </div>
                        </td>

                        {/* RO Number */}
                        <td className="py-3.5 px-3 font-mono font-bold text-[#0050cd] group-hover:underline whitespace-nowrap tabular-nums">
                          {item.wo_number}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
                            <span>{statusConfig.label}</span>
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-3 text-zinc-900 font-bold hidden sm:table-cell whitespace-nowrap">
                          {item.customer?.full_name || 'N/A'}
                        </td>

                        {/* Advisor */}
                        <td className="py-3.5 px-3 text-slate-600 hidden md:table-cell whitespace-nowrap">
                          {item.advisor?.full_name || 'N/A'}
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 pl-3 text-right font-mono text-xs text-slate-500 whitespace-nowrap tabular-nums">
                          {new Date(item.created_at).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. PAGINATION FOOTER */}
        {!loading && totalRecords > 0 && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span>
                Hiển thị{' '}
                <strong className="text-zinc-900 font-bold">
                  {(currentPage - 1) * limit + 1} – {Math.min(currentPage * limit, totalRecords)}
                </strong>{' '}
                trong <strong className="text-zinc-900 font-bold">{totalRecords}</strong> phiếu
              </span>

              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                <span>Số lượng / trang:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-[#f2f4f8] rounded-xl text-xs text-zinc-900 font-bold outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || loading}
                  className="w-9 h-9 rounded-xl bg-[#f2f4f8] hover:bg-slate-200 text-zinc-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
                  title="Trang đầu"
                >
                  <span className="material-symbols-outlined text-[18px]">first_page</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="w-9 h-9 rounded-xl bg-[#f2f4f8] hover:bg-slate-200 text-zinc-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
                  title="Trang trước"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-mono text-xs">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(Number(p))}
                      disabled={loading}
                      className={`min-w-[36px] h-9 px-2.5 rounded-xl text-xs font-extrabold font-mono transition-colors cursor-pointer ${
                        p === currentPage
                          ? 'bg-[#0050cd] text-white shadow-xs'
                          : 'bg-[#f2f4f8] hover:bg-slate-200 text-zinc-800'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="w-9 h-9 rounded-xl bg-[#f2f4f8] hover:bg-slate-200 text-zinc-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
                  title="Trang sau"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || loading}
                  className="w-9 h-9 rounded-xl bg-[#f2f4f8] hover:bg-slate-200 text-zinc-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
                  title="Trang cuối"
                >
                  <span className="material-symbols-outlined text-[18px]">last_page</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
