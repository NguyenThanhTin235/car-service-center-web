'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBillingQueue, setTab, setSearch, setPage } from '@/store/slices/billingSlice';
import InvoiceStatusBadge from '@/components/billing/InvoiceStatusBadge';
import CreateInvoiceDraftModal from '@/components/billing/CreateInvoiceDraftModal';
import PaymentModal from '@/components/billing/PaymentModal';
import { InvoiceDetail, getInvoiceById } from '@/lib/api/invoice.api';
import toast from 'react-hot-toast';

export default function BillingQueuePage() {
  const dispatch = useAppDispatch();
  const { tab, search, page, summary, records, pagination, loading } = useAppSelector(
    (state) => state.billing
  );

  const [searchInput, setSearchInput] = useState<string>(search);
  const [selectedWoId, setSelectedWoId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Tìm kiếm tự động khi nhập (Debounce 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== search) {
        dispatch(setSearch(searchInput.trim()));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, dispatch, search]);

  useEffect(() => {
    dispatch(fetchBillingQueue({ tab, search, page, limit: 5 }));
  }, [dispatch, tab, search, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setSearch(searchInput.trim()));
  };

  const formatMoney = (val: number | undefined) =>
    (Number(val) || 0).toLocaleString('vi-VN') + ' đ';

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleOpenPayment = async (invoiceId: number) => {
    try {
      const inv = await getInvoiceById(invoiceId);
      setSelectedInvoice(inv);
      setIsPaymentModalOpen(true);
    } catch (err: any) {
      toast.error('Không thể mở thông tin thanh toán: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SaaS Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Hóa đơn &amp; Thu ngân
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchBillingQueue({ tab, search, page }))}
            className="h-10 px-4 bg-white border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 hover:text-[#0866ff] rounded-xl shadow-2xs text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Làm mới bảng"
            type="button"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin text-[#0866ff]' : ''}`}>
              sync
            </span>
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {/* 2. Asymmetrical 12-Col Bento Summary (5 + 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hero Card: Đã thu hôm nay (5 cols) */}
        <div
          onClick={() => dispatch(setTab('PAID'))}
          className={`lg:col-span-5 cursor-pointer rounded-2xl saas-hero-gradient text-white p-5 flex flex-col justify-between transition-all ${
            tab === 'PAID' ? 'ring-2 ring-blue-300 ring-offset-2' : 'hover:brightness-105'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-white">Doanh thu đã thu hôm nay</span>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1 text-white">
                {formatMoney(summary.paidTodayRevenue)}
              </div>
            </div>

            {/* Pure SVG Decorative Credit Card Motif (No DOM Nested Card / No Clipping) */}
            <svg
              width="96"
              height="60"
              viewBox="0 0 96 60"
              fill="none"
              aria-hidden="true"
              className="hidden sm:block shrink-0"
            >
              <rect
                x="2"
                y="2"
                width="92"
                height="56"
                rx="10"
                fill="rgba(255,255,255,0.14)"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              <rect x="12" y="12" width="18" height="12" rx="3" fill="#fcd34d" />
              <circle cx="74" cy="18" r="5" fill="rgba(255,255,255,0.35)" />
              <circle cx="80" cy="18" r="5" fill="rgba(255,255,255,0.65)" />
              <rect x="12" y="38" width="48" height="6" rx="3" fill="rgba(255,255,255,0.75)" />
            </svg>
          </div>

          <div className="mt-5 pt-3.5 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              <strong className="font-mono text-white">{summary.paidTodayCount}</strong> hóa đơn đã quyết toán
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-semibold">
              Hoàn tất thu
            </span>
          </div>
        </div>

        {/* 3 Status Filter Tiles (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tile 1: Chờ lập hóa đơn */}
          <div
            onClick={() => dispatch(setTab('PENDING'))}
            className={`cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between ${
              tab === 'PENDING'
                ? 'bg-amber-50/90 border-amber-400 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-amber-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-600">Chờ lập hóa đơn</span>
                <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-1.5">
                  {summary.pendingCount}
                </div>
              </div>
              <span className="material-symbols-outlined text-[22px] text-amber-700">
                assignment_turned_in
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Đã xong KCS 100%</span>
              {summary.pendingCount > 0 ? (
                <span className="text-amber-800 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  Cần lập hóa đơn
                </span>
              ) : (
                <span className="text-slate-600 font-medium">Trống</span>
              )}
            </div>
          </div>

          {/* Tile 2: Hóa đơn nháp */}
          <div
            onClick={() => dispatch(setTab('DRAFT'))}
            className={`cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between ${
              tab === 'DRAFT'
                ? 'bg-blue-50/90 border-[#0866ff] shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-blue-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-600">Bản nháp</span>
                <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-1.5">
                  {summary.draftCount}
                </div>
              </div>
              <span className="material-symbols-outlined text-[22px] text-[#0866ff]">
                edit_document
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Kiểm tra chiết khấu</span>
              <span className="text-[#0050cd] font-semibold">Chờ phát hành</span>
            </div>
          </div>

          {/* Tile 3: Chờ thanh toán */}
          <div
            onClick={() => dispatch(setTab('ISSUED'))}
            className={`cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between ${
              tab === 'ISSUED'
                ? 'bg-indigo-50/90 border-indigo-400 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-indigo-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-600">Chờ thanh toán</span>
                <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-1.5">
                  {summary.issuedCount}
                </div>
              </div>
              <span className="material-symbols-outlined text-[22px] text-indigo-700">
                pending_actions
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Đã gửi hóa đơn cho khách</span>
              <span className="text-indigo-700 font-semibold">Chờ thu tiền</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Tabs Toolbar + High-Density Table */}
      <div className="saas-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Unboxed Tab Buttons (No Nested Card Wrapper) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => dispatch(setTab('PENDING'))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'PENDING'
                  ? 'bg-[#0866ff] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Chờ lập HĐ</span>
              {summary.pendingCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${
                    tab === 'PENDING' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {summary.pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => dispatch(setTab('DRAFT'))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'DRAFT'
                  ? 'bg-[#0866ff] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Bản nháp</span>
              {summary.draftCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${
                    tab === 'DRAFT' ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#0050cd]'
                  }`}
                >
                  {summary.draftCount}
                </span>
              )}
            </button>

            <button
              onClick={() => dispatch(setTab('ISSUED'))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'ISSUED'
                  ? 'bg-[#0866ff] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Chờ thanh toán</span>
              {summary.issuedCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${
                    tab === 'ISSUED' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {summary.issuedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => dispatch(setTab('PAID'))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tab === 'PAID'
                  ? 'bg-[#0866ff] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Đã thanh toán
            </button>

            <button
              onClick={() => dispatch(setTab('ALL'))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tab === 'ALL'
                  ? 'bg-[#0866ff] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tất cả
            </button>
          </div>

          {/* Search Box (Flex Siblings - No Overlapping Icon) */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="flex-1 flex items-center gap-2 px-3 rounded-xl border border-slate-200/80 bg-slate-50/80 focus-within:bg-white focus-within:border-[#0866ff] h-9 transition-all">
              <span className="material-symbols-outlined text-[18px] text-slate-500 shrink-0">
                search
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm biển số, mã phiếu WO, tên khách hàng..."
                className="flex-1 min-w-0 bg-transparent outline-none text-xs text-slate-800 placeholder:text-slate-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    dispatch(setSearch(''));
                  }}
                  className="flex items-center text-slate-500 hover:text-slate-800 cursor-pointer shrink-0"
                  title="Xóa tìm kiếm"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0866ff] hover:bg-[#0050cd] text-white rounded-xl text-xs font-semibold transition-colors shrink-0 h-9 flex items-center justify-center cursor-pointer shadow-xs"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* 4. Table view (Flush inside .saas-card - No Nested Card Border) */}
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-sm min-w-[1020px]">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b border-slate-200/80">
              {tab === 'PENDING' ? (
                <tr>
                  <th className="py-3.5 px-4 w-[16%] min-w-[150px]">Mã phiếu WO</th>
                  <th className="py-3.5 px-4 w-[24%] min-w-[210px]">Biển số &amp; Xe</th>
                  <th className="py-3.5 px-4 w-[18%] min-w-[160px]">Khách hàng</th>
                  <th className="py-3.5 px-4 w-[16%] min-w-[150px]">Cố vấn dịch vụ</th>
                  <th className="py-3.5 px-4 text-right w-[14%] min-w-[130px] whitespace-nowrap">
                    Tạm tính (Báo giá duyệt)
                  </th>
                  <th className="py-3.5 px-4 text-center w-[12%] min-w-[130px] whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              ) : (
                <tr>
                  <th className="py-3.5 px-4 w-[16%] min-w-[150px]">Mã hóa đơn</th>
                  <th className="py-3.5 px-4 w-[18%] min-w-[170px]">Mã WO &amp; Biển số</th>
                  <th className="py-3.5 px-4 w-[18%] min-w-[160px]">Khách hàng</th>
                  <th className="py-3.5 px-4 w-[13%] min-w-[130px]">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right w-[11%] min-w-[110px] whitespace-nowrap">
                    Tổng tiền
                  </th>
                  <th className="py-3.5 px-4 text-right w-[11%] min-w-[110px] whitespace-nowrap">
                    Còn phải trả
                  </th>
                  <th className="py-3.5 px-4 text-center w-[13%] min-w-[180px] whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <span className="material-symbols-outlined text-[32px] animate-spin text-[#0866ff] block mb-2 mx-auto">
                      progress_activity
                    </span>
                    <span className="text-xs">Đang tải danh sách hóa đơn...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-600">
                    <span className="material-symbols-outlined text-[40px] text-slate-400 block mb-1 mx-auto">
                      inbox
                    </span>
                    <span className="text-xs">Không có dữ liệu phù hợp trong mục này.</span>
                  </td>
                </tr>
              ) : (
                records.map((rec, index) => {
                  const isWorkOrder =
                    rec.type === 'WORK_ORDER' || (!rec.invoiceNumber && Boolean(rec.workOrderId));
                  const rowKey = isWorkOrder
                    ? `wo-${rec.workOrderId ?? rec.id ?? index}`
                    : `inv-${rec.id ?? rec.invoiceNumber ?? index}`;

                  if (isWorkOrder) {
                    return (
                      <tr key={rowKey} className="hover:bg-blue-50/25 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[#0050cd]">{rec.woNumber}</span>
                          <div className="text-xs font-mono text-slate-600 whitespace-nowrap">
                            {formatDate(rec.updatedAt)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold tracking-wider uppercase">
                            {rec.vehicle?.licensePlate || (rec.vehicle as any)?.license_plate || '-'}
                          </span>
                          <div className="text-xs text-slate-600 mt-1">
                            {rec.vehicle?.make} {rec.vehicle?.model} ({rec.vehicle?.year})
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {rec.customer?.fullName || (rec.customer as any)?.full_name || '-'}
                          </div>
                          <div className="text-xs text-slate-600 font-mono">
                            {rec.customer?.phone || '-'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">
                          {rec.advisor?.fullName || (rec.advisor as any)?.full_name || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900 whitespace-nowrap">
                          {formatMoney(rec.estimatedTotal)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedWoId(rec.workOrderId!);
                              setIsCreateModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white text-xs font-semibold hover:brightness-110 transition-all shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap mx-auto cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">receipt</span>
                            <span>Lập hóa đơn</span>
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  // Hóa đơn
                  return (
                    <tr key={rowKey} className="hover:bg-blue-50/25 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/staff/billing/${rec.id}`}
                          className="font-mono font-bold text-[#0050cd] hover:underline whitespace-nowrap"
                        >
                          {rec.invoiceNumber}
                        </Link>
                        <div className="text-xs font-mono text-slate-600 whitespace-nowrap">
                          {formatDate(rec.issuedAt || rec.createdAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold tracking-wider uppercase">
                          {rec.vehicle?.licensePlate || (rec.vehicle as any)?.license_plate || '-'}
                        </span>
                        <div className="text-xs text-slate-600 font-mono mt-1">{rec.woNumber}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {rec.customer?.fullName || (rec.customer as any)?.full_name || '-'}
                        </div>
                        <div className="text-xs text-slate-600 font-mono">
                          {rec.customer?.phone || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <InvoiceStatusBadge status={rec.status as any} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                        {formatMoney(rec.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        {rec.amountDue && rec.amountDue > 0 ? (
                          <span className="text-amber-700">{formatMoney(rec.amountDue)}</span>
                        ) : (
                          <span className="text-emerald-700">0 đ</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          {rec.status === 'ISSUED' && (
                            <button
                              onClick={() => handleOpenPayment(rec.id!)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">payments</span>
                              <span>Thu tiền</span>
                            </button>
                          )}

                          <Link
                            href={`/staff/billing/${rec.id}`}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 hover:text-[#0866ff] text-xs font-semibold transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <span>Chi tiết</span>
                            <span className="material-symbols-outlined text-[15px]">
                              chevron_right
                            </span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-t border-slate-200/80 text-xs text-slate-600 gap-2">
            <span>
              Hiển thị <strong className="font-mono text-slate-700">{(pagination.currentPage - 1) * 5 + 1}</strong> -{' '}
              <strong className="font-mono text-slate-700">{Math.min(pagination.currentPage * 5, pagination.total)}</strong> trên tổng số{' '}
              <strong className="font-mono text-slate-700">{pagination.total}</strong> bản ghi (Trang {pagination.currentPage}/{pagination.totalPages})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.currentPage <= 1}
                onClick={() => dispatch(setPage(pagination.currentPage - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1 text-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                <span>Trước</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => dispatch(setPage(num))}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      pagination.currentPage === num
                        ? 'bg-[#0866ff] text-white shadow-xs'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <button
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => dispatch(setPage(pagination.currentPage + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1 text-xs cursor-pointer"
              >
                <span>Sau</span>
                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal tạo hóa đơn nháp */}
      {selectedWoId && (
        <CreateInvoiceDraftModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedWoId(null);
          }}
          workOrderId={selectedWoId}
          onSuccess={() => {
            dispatch(fetchBillingQueue({ tab, search, page }));
          }}
        />
      )}

      {/* Modal thanh toán */}
      {selectedInvoice && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onSuccess={() => {
            dispatch(fetchBillingQueue({ tab, search, page }));
          }}
        />
      )}
    </div>
  );
}

