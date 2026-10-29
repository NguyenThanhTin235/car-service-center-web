'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { WorkOrder, getWorkOrders } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const WO_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: {
    label: 'Tiếp nhận',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300/80 dark:border-slate-700',
    dot: 'bg-slate-500',
  },
  IN_PLANNING: {
    label: 'Lập kế hoạch',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-300/80 dark:border-sky-800',
    dot: 'bg-sky-500',
  },
  PENDING_APPROVAL: {
    label: 'Chờ duyệt',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300/80 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Đã duyệt',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300/80 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  IN_PROGRESS: {
    label: 'Đang sửa chữa',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300/80 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  BILLING_REQUESTED: {
    label: 'Chờ thanh toán',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300/80 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  FINANCIAL_CLEARED: {
    label: 'Chờ giao xe',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-300/80 dark:border-teal-800',
    dot: 'bg-teal-500',
  },
  RELEASED: {
    label: 'Đã giao xe',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300/80 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Đã đóng',
    bg: 'bg-emerald-100/70 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-400/80 dark:border-emerald-800',
    dot: 'bg-emerald-600',
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300/80 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
};

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Tiếp nhận' },
  { value: 'IN_PLANNING', label: 'Lập kế hoạch' },
  { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'IN_PROGRESS', label: 'Đang sửa chữa' },
  { value: 'BILLING_REQUESTED', label: 'Chờ thanh toán' },
  { value: 'FINANCIAL_CLEARED', label: 'Chờ giao xe' },
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

  // Data State
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Debounce search query
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
    } catch (error) {
      toast.error('Lỗi tải danh sách phiếu công việc');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchWOs();
  }, [fetchWOs]);

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1440px] mx-auto w-full">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Phiếu công việc</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            Quản lý tất cả Lệnh sửa chữa (Work Orders) trong xưởng dịch vụ.
          </p>
        </div>

        {/* Quick Refresh */}
        <button
          onClick={fetchWOs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 self-start sm:self-auto bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 rounded-xl text-label-sm font-semibold text-on-surface transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          title="Tải lại danh sách"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span>Làm mới</span>
        </button>
      </div>

      {/* 2. FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/60 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã phiếu (RO), biển số xe, tên khách..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-body-sm bg-surface-container-low/50 border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary focus:bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/70 shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 rounded cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-body-xs font-semibold text-on-surface-variant hidden md:inline">
            Trạng thái:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl text-body-sm text-on-surface font-medium outline-none focus:border-primary shadow-2xs transition-colors cursor-pointer"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. TABLE CARD */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[36px] text-primary">
              progress_activity
            </span>
            <span className="text-body-sm font-medium">Đang tải danh sách phiếu công việc...</span>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/60 border-b border-outline-variant/50">
                  <th className="px-5 py-3.5 text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Mã phiếu (RO)
                  </th>
                  <th className="px-5 py-3.5 text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-5 py-3.5 text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Phương tiện
                  </th>
                  <th className="px-5 py-3.5 text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Cố vấn
                  </th>
                  <th className="px-5 py-3.5 text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-body-sm">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50">
                          content_paste_off
                        </span>
                        <span className="text-body-md font-semibold text-on-surface">
                          Không có phiếu công việc nào
                        </span>
                        <span className="text-body-xs text-on-surface-variant max-w-sm">
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
                      bg: 'bg-surface-container',
                      text: 'text-on-surface',
                      border: 'border-outline-variant',
                      dot: 'bg-outline',
                    };

                    const vehicleName = [item.vehicle?.make, item.vehicle?.model].filter(Boolean).join(' ');

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/advisor/work-orders/${item.id}`)}
                      >
                        {/* RO Number */}
                        <td className="px-5 py-3.5 font-mono font-bold text-primary group-hover:underline whitespace-nowrap">
                          {item.wo_number}
                        </td>

                        {/* Status (Tiếng Việt với màu riêng biệt) */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-xs font-bold border shadow-2xs ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
                            <span>{statusConfig.label}</span>
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-3.5 text-on-surface font-semibold whitespace-nowrap">
                          {item.customer?.full_name || 'N/A'}
                        </td>

                        {/* Vehicle */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-body-xs font-bold text-on-surface uppercase px-2 py-0.5 rounded-md bg-surface-container-low border border-outline-variant/60 shadow-2xs">
                              {item.vehicle?.license_plate || 'N/A'}
                            </span>
                            {vehicleName && (
                              <span className="text-body-sm text-on-surface-variant font-medium">
                                {vehicleName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Advisor */}
                        <td className="px-5 py-3.5 text-on-surface-variant whitespace-nowrap">
                          {item.advisor?.full_name || 'N/A'}
                        </td>

                        {/* Created Date */}
                        <td className="px-5 py-3.5 text-body-xs text-on-surface-variant whitespace-nowrap">
                          {new Date(item.created_at).toLocaleString('vi-VN')}
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
          <div className="px-5 py-3.5 border-t border-outline-variant/50 bg-surface-container-low/30 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
            {/* Left: Summary and limit selector */}
            <div className="flex items-center gap-4 text-body-xs text-on-surface-variant flex-wrap">
              <span>
                Hiển thị{' '}
                <strong className="text-on-surface font-semibold">
                  {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalRecords)}
                </strong>{' '}
                trong <strong className="text-on-surface font-semibold">{totalRecords}</strong> phiếu
              </span>

              <div className="flex items-center gap-1.5 border-l border-outline-variant/60 pl-4">
                <span className="text-body-xs text-on-surface-variant">Số lượng / trang:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-body-xs text-on-surface font-semibold outline-none focus:border-primary shadow-2xs cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Right: Page Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || loading}
                  className="p-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Trang đầu"
                >
                  <span className="material-symbols-outlined text-[18px]">first_page</span>
                </button>

                {/* Prev Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="p-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Trang trước"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {/* Page Numbers */}
                {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-on-surface-variant font-mono text-body-xs">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(Number(p))}
                      disabled={loading}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-label-xs font-bold font-mono transition-colors cursor-pointer ${
                        p === currentPage
                          ? 'bg-primary text-white shadow-2xs'
                          : 'border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="p-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Trang sau"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || loading}
                  className="p-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
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
