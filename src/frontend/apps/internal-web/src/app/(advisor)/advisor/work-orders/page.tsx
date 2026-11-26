'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { WorkOrder, getWorkOrders } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import TablePagination from '@/components/shared/TablePagination';
import { WO_STATUS_META } from '@/components/advisor/work-order/work-order.constants';

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

export default function WorkOrdersPage() {
  const router = useRouter();

  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchInitialized, setSearchInitialized] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get('search')?.trim() || '';
    if (initialSearch) {
      setSearchQuery(initialSearch);
      setDebouncedSearch(initialSearch);
    }
    setSearchInitialized(true);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  const fetchWOs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
      } else {
        setError(res.message || 'Không thể tải danh sách phiếu công việc');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi tải danh sách phiếu công việc';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!searchInitialized) return;
    fetchWOs();
  }, [fetchWOs, searchInitialized]);

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
    <div className="flex flex-col gap-5 px-3 sm:px-5 lg:px-6 py-3 max-w-[1440px] mx-auto w-full">
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
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full text-xs font-bold text-zinc-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
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
            <div className="bg-[#0c2340] rounded-xl p-1 flex items-stretch h-7 gap-1">
              <div
                style={{ width: `${Math.max(25, Math.min(75, pageStats.inWorkPct))}%` }}
                className="bg-white text-zinc-900 rounded-lg px-2.5 flex items-center font-mono font-extrabold text-[11px] leading-none tabular-nums whitespace-nowrap transition-all"
              >
                {pageStats.inWorkPct}% mở
              </div>
              <div className="flex-1 text-white px-2.5 flex items-center font-mono font-extrabold text-[11px] leading-none tabular-nums whitespace-nowrap">
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
      <div className="bg-white rounded-[28px] p-4 sm:p-5 lg:p-6 border border-slate-200/70 shadow-xs flex flex-col gap-5">
        {/* Search & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full lg:max-w-md">
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#f2f4f8] p-1 rounded-2xl inline-flex items-center gap-1 max-w-full overflow-x-auto no-scrollbar">
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
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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
              className="px-3.5 py-2.5 bg-[#f2f4f8] hover:bg-slate-200/70 rounded-2xl text-xs text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-[#0050cd]/30 transition-colors cursor-pointer shrink-0"
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
        <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="py-3 pr-2 lg:pr-3">Phương tiện & Biển số</th>
                <th className="py-3 px-2 lg:px-3">Mã phiếu (RO)</th>
                <th className="py-3 px-2 lg:px-3">Trạng thái</th>
                <th className="py-3 px-2 lg:px-3 hidden sm:table-cell">Khách hàng</th>
                <th className="py-3 px-2 lg:px-3 hidden lg:table-cell">Cố vấn</th>
                <th className="py-3 pl-2 lg:pl-3 text-right hidden sm:table-cell">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-3.5 pr-2 lg:pr-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                        <div className="min-w-0 flex flex-col gap-1.5">
                          <div className="h-4 w-24 bg-slate-200 rounded" />
                          <div className="h-3 w-32 bg-slate-100 rounded" />
                          <div className="h-3 w-28 bg-slate-100 rounded sm:hidden" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 lg:px-3 whitespace-nowrap">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-2 lg:px-3 whitespace-nowrap">
                      <div className="h-6 w-24 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-3.5 px-2 lg:px-3 hidden sm:table-cell whitespace-nowrap">
                      <div className="h-4 w-28 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-2 lg:px-3 hidden lg:table-cell whitespace-nowrap">
                      <div className="h-4 w-24 bg-slate-100 rounded" />
                    </td>
                    <td className="py-3.5 pl-2 lg:pl-3 text-right hidden sm:table-cell whitespace-nowrap">
                      <div className="h-4 w-28 bg-slate-100 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2.5 text-rose-700 bg-rose-50/70 border border-rose-200 rounded-2xl px-6 py-5">
                      <span className="material-symbols-outlined text-[28px] text-rose-600">error</span>
                      <span className="text-xs font-semibold">Không thể tải phiếu công việc: {error}</span>
                      <button
                        type="button"
                        onClick={fetchWOs}
                        className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        <span>Thử lại</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
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
                  const statusConfig = WO_STATUS_META[item.status] || {
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
                      <td className="py-3.5 pr-2 lg:pr-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0050cd] items-center justify-center shrink-0 group-hover:bg-[#0050cd] group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">
                              directions_car
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono font-extrabold text-zinc-900 uppercase">
                              {item.vehicle?.license_plate || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-500 font-medium truncate">{vehicleName}</div>
                            {/* Mobile (<sm) consolidated Customer name + compact created date */}
                            <div className="sm:hidden mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500">
                              <span className="font-semibold text-zinc-800 truncate">
                                {item.customer?.full_name || 'N/A'}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono tabular-nums">
                                {new Date(item.created_at).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* RO Number */}
                      <td className="py-3.5 px-2 lg:px-3 font-mono font-bold text-[#0050cd] group-hover:underline whitespace-nowrap tabular-nums">
                        {item.wo_number}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-2 lg:px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
                          <span>{statusConfig.label}</span>
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-2 lg:px-3 text-zinc-900 font-bold hidden sm:table-cell whitespace-nowrap">
                        {item.customer?.full_name || 'N/A'}
                      </td>

                      {/* Advisor */}
                      <td className="py-3.5 px-2 lg:px-3 text-slate-600 hidden lg:table-cell whitespace-nowrap">
                        {item.advisor?.full_name || 'N/A'}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 pl-2 lg:pl-3 text-right font-mono text-xs text-slate-500 hidden sm:table-cell whitespace-nowrap tabular-nums">
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

        {/* 4. PAGINATION FOOTER */}
        {totalRecords > 0 && (
          <TablePagination
            totalRecords={totalRecords}
            totalPages={totalPages}
            currentPage={currentPage}
            currentCount={items.length}
            recordLabel="phiếu"
            onPageChange={setCurrentPage}
            pageSize={limit}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={(size) => {
              setLimit(size);
              setCurrentPage(1);
            }}
            className="px-0 pt-4 pb-0 bg-transparent border-slate-100"
          />
        )}
      </div>
    </div>
  );
}
