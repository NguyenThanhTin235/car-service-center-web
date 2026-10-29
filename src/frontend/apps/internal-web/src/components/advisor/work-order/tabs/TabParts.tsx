'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  WorkOrder,
  WoJobPart,
  getWorkOrderParts,
  deleteJobPart,
} from '@/lib/api/work-order.api';
import AddPartModal from '../modals/AddPartModal';
import toast from 'react-hot-toast';

interface TabPartsProps {
  workOrder?: WorkOrder;
  refetchWO?: () => void;
  isReadOnly?: boolean;
}

const PART_STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  PLANNED: { label: 'Đã lên kế hoạch', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-700 dark:text-blue-400' },
  RESERVED: { label: 'Đã giữ chỗ', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
  ISSUED: { label: 'Đã xuất kho', bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-700 dark:text-purple-400' },
  USED: { label: 'Đã lắp ráp', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
  RETURNED: { label: 'Đã trả kho', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-700 dark:text-slate-400' },
};

const ITEMS_PER_PAGE = 5;

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

export default function TabParts({ workOrder, refetchWO, isReadOnly = false }: TabPartsProps) {
  const [parts, setParts] = useState<WoJobPart[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state (5 items per page)
  const [currentPage, setCurrentPage] = useState(1);

  // Filters & search
  const [search, setSearch] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<WoJobPart | null>(null);
  const [preselectedJobId, setPreselectedJobId] = useState<number | null>(null);

  // Delete confirm state
  const [deletingPartId, setDeletingPartId] = useState<number | null>(null);

  const isWOClosed = isReadOnly || ['CLOSED', 'CANCELLED', 'RELEASED'].includes(workOrder?.status || '');

  const fetchParts = useCallback(async () => {
    if (!workOrder?.id) return;
    try {
      setLoading(true);
      const res = await getWorkOrderParts(workOrder.id);
      if (res.success && res.data) {
        setParts(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching parts:', err);
      toast.error('Lỗi khi tải danh sách phụ tùng');
    } finally {
      setLoading(false);
    }
  }, [workOrder?.id]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Handle successful save from modal
  const handleModalSuccess = () => {
    fetchParts();
    if (refetchWO) refetchWO();
  };

  // Handle delete
  const handleDeletePart = async (part: WoJobPart) => {
    if (!workOrder) return;
    if (Number(part.issued_quantity) > 0) {
      toast.error('Phụ tùng này đã được xuất kho thi công, không thể xóa trực tiếp. Vui lòng hoàn trả kho trước.');
      return;
    }

    try {
      setDeletingPartId(part.id);
      const res = await deleteJobPart(workOrder.id, part.job_id, part.id);
      if (res.success) {
        toast.success('Đã xóa phụ tùng khỏi công việc');
        fetchParts();
        if (refetchWO) refetchWO();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi xóa phụ tùng');
    } finally {
      setDeletingPartId(null);
    }
  };

  // Extract jobs for filter
  const allJobs = useMemo(() => {
    const list: Array<{ id: number; name: string }> = [];
    (workOrder?.services || []).forEach((service) => {
      (service.jobs || []).forEach((job) => {
        list.push({ id: job.id, name: job.name });
      });
    });
    return list;
  }, [workOrder]);

  // Filtered parts list
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const sku = part.item?.sku?.toLowerCase() || '';
      const name = part.item?.part_category?.name?.toLowerCase() || '';
      const brand = part.item?.brand?.name?.toLowerCase() || '';
      const jobName = part.job?.name?.toLowerCase() || '';
      const query = search.trim().toLowerCase();

      const matchesSearch = !query || sku.includes(query) || name.includes(query) || brand.includes(query) || jobName.includes(query);
      const matchesJob = selectedJobFilter === 'ALL' || String(part.job_id) === selectedJobFilter;

      let matchesStock = true;
      const onHand = part.item?.on_hand ?? 0;
      const planned = Number(part.planned_quantity) || 0;
      if (stockFilter === 'IN_STOCK') {
        matchesStock = onHand >= planned;
      } else if (stockFilter === 'OUT_OF_STOCK') {
        matchesStock = onHand < planned;
      }

      return matchesSearch && matchesJob && matchesStock;
    });
  }, [parts, search, selectedJobFilter, stockFilter]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedJobFilter, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredParts.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedParts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredParts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredParts, currentPage]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const totalItems = parts.length;
    const totalEstimatedCost = parts.reduce((sum, p) => {
      return sum + Number(p.planned_quantity) * Number(p.unit_price);
    }, 0);
    const shortagesCount = parts.filter((p) => {
      const onHand = p.item?.on_hand ?? 0;
      const planned = Number(p.planned_quantity) || 0;
      return onHand < planned;
    }).length;

    return { totalItems, totalEstimatedCost, shortagesCount };
  }, [parts]);

  if (!workOrder) return null;

  return (
    <div className="space-y-6">
      {/* 1. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total distinct parts */}
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[26px]">category</span>
          </div>
          <div>
            <div className="text-body-small text-on-surface-variant font-medium">Tổng loại phụ tùng</div>
            <div className="text-title-large font-bold text-on-surface mt-0.5">
              {stats.totalItems} <span className="text-label-medium font-normal text-on-surface-variant">mặt hàng</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total estimated cost */}
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[26px]">payments</span>
          </div>
          <div>
            <div className="text-body-small text-on-surface-variant font-medium">Chi phí phụ tùng dự kiến</div>
            <div className="text-title-large font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.totalEstimatedCost.toLocaleString('vi-VN')} <span className="text-label-medium font-normal">VNĐ</span>
            </div>
          </div>
        </div>

        {/* Card 3: Stock Shortages */}
        <div
          className={`border p-4 rounded-2xl flex items-center gap-4 shadow-sm transition-colors ${
            stats.shortagesCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
              : 'bg-surface-container-lowest border-outline-variant'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              stats.shortagesCount > 0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[26px]">
              {stats.shortagesCount > 0 ? 'warning' : 'inventory'}
            </span>
          </div>
          <div>
            <div className="text-body-small font-medium">
              {stats.shortagesCount > 0 ? 'Cảnh báo thiếu kho' : 'Tình trạng tồn kho'}
            </div>
            <div className="text-title-large font-bold mt-0.5">
              {stats.shortagesCount > 0 ? (
                <span>
                  {stats.shortagesCount} <span className="text-label-medium font-normal">mặt hàng thiếu</span>
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">Sẵn sàng cấp phát</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Toolbar: Search, Filters, Add Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface-container-lowest p-3.5 border border-outline-variant rounded-2xl shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo SKU, tên, hãng, công việc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-body-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Job Filter */}
          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-body-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary max-w-[200px] truncate"
          >
            <option value="ALL">Tất cả công việc</option>
            {allJobs.map((j) => (
              <option key={j.id} value={String(j.id)}>
                {j.name}
              </option>
            ))}
          </select>

          {/* Stock filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-body-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="ALL">Tất cả trạng thái kho</option>
            <option value="IN_STOCK">Đủ tồn kho</option>
            <option value="OUT_OF_STOCK">Thiếu hàng / Cần nhập</option>
          </select>
        </div>

        {/* Action Button: Add Part */}
        {!isWOClosed && (
          <button
            onClick={() => {
              setEditingPart(null);
              setPreselectedJobId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 font-semibold text-body-medium rounded-xl shadow-sm transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Khai báo phụ tùng
          </button>
        )}
      </div>

      {/* 3. Table of Parts */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-[24px] text-primary">progress_activity</span>
            Đang tải dữ liệu phụ tùng...
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant mb-3">
              <span className="material-symbols-outlined text-[32px]">inventory_2</span>
            </div>
            <h4 className="text-title-medium font-bold text-on-surface">Chưa có phụ tùng nào</h4>
            <p className="text-body-medium text-on-surface-variant mt-1 max-w-md mx-auto">
              {search || selectedJobFilter !== 'ALL' || stockFilter !== 'ALL'
                ? 'Không tìm thấy phụ tùng phù hợp với bộ lọc hiện tại.'
                : 'Chưa có phụ tùng hay vật tư nào được khai báo cho phiếu này.'}
            </p>
            {!isWOClosed && !search && selectedJobFilter === 'ALL' && stockFilter === 'ALL' && (
              <button
                onClick={() => {
                  setEditingPart(null);
                  setPreselectedJobId(null);
                  setIsModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 font-semibold text-body-medium rounded-xl transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Khai báo phụ tùng ngay
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto styled-scrollbar">
            <table className="w-full text-left border-collapse text-body-medium">
              <thead>
                <tr className="border-b border-outline-variant/60 bg-surface-container-low/40 text-on-surface-variant text-label-medium uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Mã</th>
                  <th className="py-3.5 px-4">Tên phụ tùng & Hãng</th>
                  <th className="py-3.5 px-4">Công việc áp dụng</th>
                  <th className="py-3.5 px-4 text-center">Tồn kho</th>
                  <th className="py-3.5 px-4 text-center">SL Dự kiến</th>
                  <th className="py-3.5 px-4 text-center">SL Xuất</th>
                  <th className="py-3.5 px-4 text-right">Đơn giá</th>
                  <th className="py-3.5 px-4 text-right">Thành tiền</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  {!isWOClosed && <th className="py-3.5 px-4 text-center">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {paginatedParts.map((part) => {
                  const onHand = part.item?.on_hand ?? 0;
                  const planned = Number(part.planned_quantity) || 0;
                  const issued = Number(part.issued_quantity) || 0;
                  const unitPrice = Number(part.unit_price) || 0;
                  const total = planned * unitPrice;
                  const isShortage = onHand < planned;
                  const statusInfo = PART_STATUS_MAP[part.status] || {
                    label: part.status,
                    bg: 'bg-surface-container',
                    text: 'text-on-surface-variant',
                  };

                  return (
                    <tr key={part.id} className="hover:bg-surface-container-low/50 transition-colors">
                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-bold text-primary text-body-small whitespace-nowrap">
                        {part.item?.sku || 'N/A'}
                      </td>

                      {/* Part Name & Brand */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-on-surface">
                          {part.item?.part_category?.name || 'Phụ tùng chưa rõ'}
                        </div>
                        <div className="text-body-small text-on-surface-variant flex items-center gap-2 mt-0.5">
                          {part.item?.brand && <span>Hãng: {part.item.brand.name}</span>}
                          <span>ĐVT: {part.item?.part_category?.uom?.name || 'Cái'}</span>
                        </div>
                      </td>

                      {/* Job name */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-on-surface">{part.job?.name || 'Chưa rõ'}</div>
                        {part.job?.wo_service?.name && (
                          <div className="text-body-small text-on-surface-variant">
                            {part.job.wo_service.name}
                          </div>
                        )}
                      </td>

                      {/* Stock badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isShortage
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {isShortage ? 'warning' : 'inventory_2'}
                          </span>
                          {onHand}
                        </span>
                      </td>

                      {/* Planned Qty */}
                      <td className="py-3 px-4 text-center font-bold text-on-surface">
                        {planned}
                      </td>

                      {/* Issued Qty */}
                      <td className="py-3 px-4 text-center font-medium text-on-surface-variant">
                        {issued}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-4 text-right font-medium text-on-surface whitespace-nowrap">
                        {unitPrice.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-bold text-primary whitespace-nowrap">
                        {total.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      {!isWOClosed && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingPart(part);
                                setIsModalOpen(true);
                              }}
                              title="Chỉnh sửa số lượng / đơn giá"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeletePart(part)}
                              disabled={deletingPartId === part.id || issued > 0}
                              title={
                                issued > 0
                                  ? 'Không thể xóa phụ tùng đã xuất kho'
                                  : 'Xóa phụ tùng khỏi công việc'
                              }
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error disabled:opacity-40 transition-colors"
                            >
                              {deletingPartId === part.id ? (
                                <span className="material-symbols-outlined animate-spin text-[16px]">
                                  progress_activity
                                </span>
                              ) : (
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer (5 items per page) */}
          {!loading && filteredParts.length > 0 && (
            <div className="px-5 py-3 border-t border-outline-variant/50 bg-surface-container-low/30 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
              {/* Left: Summary */}
              <div className="text-body-xs text-on-surface-variant">
                Hiển thị{' '}
                <strong className="text-on-surface font-semibold">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredParts.length)}
                </strong>{' '}
                trong <strong className="text-on-surface font-semibold">{filteredParts.length}</strong> phụ tùng
              </div>

              {/* Right: Page Buttons */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* First Page */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Trang đầu"
                  >
                    <span className="material-symbols-outlined text-[18px]">first_page</span>
                  </button>

                  {/* Prev Page */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Trang trước"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-1.5 text-on-surface-variant font-mono text-body-xs">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(Number(p))}
                        className={`min-w-[30px] h-7 px-2 rounded-lg text-label-xs font-bold font-mono transition-colors cursor-pointer ${
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
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Trang sau"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>

                  {/* Last Page */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Trang cuối"
                  >
                    <span className="material-symbols-outlined text-[18px]">last_page</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>

      {/* 4. Modal Add/Edit Part */}
      <AddPartModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPart(null);
          setPreselectedJobId(null);
        }}
        workOrder={workOrder}
        preselectedJobId={preselectedJobId}
        editingPart={editingPart}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
