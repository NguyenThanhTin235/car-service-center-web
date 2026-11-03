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

  useEffect(() => {
    dispatch(fetchBillingQueue({ tab, search, page }));
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
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface flex items-center gap-2">
            <span>Quản lý Hóa đơn &amp; Thu ngân</span>
            <span className="material-symbols-outlined text-primary text-[28px]">receipt_long</span>
          </h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            Xử lý thanh toán các xe đã hoàn tất kiểm định KCS và phát hành hóa đơn dịch vụ chính thức.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchBillingQueue({ tab, search, page }))}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface rounded-xl shadow-xs text-sm font-medium transition-colors"
            title="Làm mới bảng"
            type="button"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Chờ lập hóa đơn */}
        <div
          onClick={() => dispatch(setTab('PENDING'))}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
            tab === 'PENDING'
              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/40'
              : 'bg-surface-container-lowest border-outline-variant'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Chờ lập hóa đơn
              </span>
              <div className="text-3xl font-extrabold text-on-surface mt-1">
                {summary.pendingCount}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Xe đã xong QC 100%</span>
            {summary.pendingCount > 0 && (
              <span className="text-amber-700 font-bold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                Cần lập bill
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Hóa đơn nháp */}
        <div
          onClick={() => dispatch(setTab('DRAFT'))}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
            tab === 'DRAFT'
              ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-400/40'
              : 'bg-surface-container-lowest border-outline-variant'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Bản nháp
              </span>
              <div className="text-3xl font-extrabold text-on-surface mt-1">
                {summary.draftCount}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">edit_document</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Đang kiểm tra chiết khấu</span>
            <span className="text-primary font-medium">Chờ phát hành</span>
          </div>
        </div>

        {/* Card 3: Chờ thanh toán */}
        <div
          onClick={() => dispatch(setTab('ISSUED'))}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
            tab === 'ISSUED'
              ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-400/40'
              : 'bg-surface-container-lowest border-outline-variant'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Chờ thanh toán
              </span>
              <div className="text-3xl font-extrabold text-on-surface mt-1">
                {summary.issuedCount}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Đã gửi báo bill cho khách</span>
            <span className="text-purple-700 font-bold">Chờ thu tiền</span>
          </div>
        </div>

        {/* Card 4: Đã thu hôm nay */}
        <div
          onClick={() => dispatch(setTab('PAID'))}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
            tab === 'PAID'
              ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/40'
              : 'bg-surface-container-lowest border-outline-variant'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Đã thu hôm nay
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1 truncate">
                {formatMoney(summary.paidTodayRevenue)}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">paid</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span>{summary.paidTodayCount} hóa đơn đã quyết toán</span>
            <span className="text-emerald-700 font-bold">Hoàn tất</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Tabs Toolbar */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-high rounded-xl">
            <button
              onClick={() => dispatch(setTab('PENDING'))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'PENDING'
                  ? 'bg-surface-container-lowest text-amber-700 shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Chờ lập HĐ</span>
              {summary.pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-extrabold">
                  {summary.pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => dispatch(setTab('DRAFT'))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'DRAFT'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Bản nháp</span>
              {summary.draftCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-bold">
                  {summary.draftCount}
                </span>
              )}
            </button>

            <button
              onClick={() => dispatch(setTab('ISSUED'))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'ISSUED'
                  ? 'bg-surface-container-lowest text-purple-700 shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Chờ thanh toán</span>
              {summary.issuedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-200 text-purple-900 font-bold">
                  {summary.issuedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => dispatch(setTab('PAID'))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'PAID'
                  ? 'bg-surface-container-lowest text-emerald-700 shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Đã thanh toán
            </button>

            <button
              onClick={() => dispatch(setTab('ALL'))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'ALL'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tất cả
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm biển số, mã phiếu WO, tên khách hàng..."
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors shrink-0"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* 4. Table view */}
        <div className="overflow-x-auto rounded-xl border border-outline-variant">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold text-xs uppercase tracking-wider border-b border-outline-variant">
              {tab === 'PENDING' ? (
                <tr>
                  <th className="py-3 px-4">Mã phiếu WO</th>
                  <th className="py-3 px-4">Biển số &amp; Xe</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Cố vấn dịch vụ</th>
                  <th className="py-3 px-4 text-right">Tạm tính (Báo giá duyệt)</th>
                  <th className="py-3 px-4 text-center w-36">Thao tác</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-3 px-4">Mã hóa đơn</th>
                  <th className="py-3 px-4">Mã WO &amp; Biển số</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Tổng tiền</th>
                  <th className="py-3 px-4 text-right">Còn phải trả</th>
                  <th className="py-3 px-4 text-center w-40">Thao tác</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[32px] animate-spin text-primary block mb-2 mx-auto">
                      progress_activity
                    </span>
                    <span>Đang tải danh sách...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] opacity-40 block mb-1 mx-auto">
                      inbox
                    </span>
                    <span>Không có dữ liệu phù hợp trong mục này.</span>
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  if (tab === 'PENDING') {
                    return (
                      <tr key={rec.workOrderId} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-primary">{rec.woNumber}</span>
                          <div className="text-[11px] text-on-surface-variant">
                            {formatDate(rec.updatedAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-on-surface">{rec.vehicle.licensePlate}</div>
                          <div className="text-xs text-on-surface-variant">
                            {rec.vehicle.make} {rec.vehicle.model} ({rec.vehicle.year})
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-on-surface">{rec.customer.fullName}</div>
                          <div className="text-xs text-on-surface-variant">{rec.customer.phone || '-'}</div>
                        </td>
                        <td className="py-3 px-4 text-on-surface text-xs">
                          {rec.advisor?.fullName || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-on-surface">
                          {formatMoney(rec.estimatedTotal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedWoId(rec.workOrderId!);
                              setIsCreateModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-dark transition-colors shadow-xs flex items-center gap-1 mx-auto"
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
                    <tr key={rec.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/staff/billing/${rec.id}`}
                          className="font-mono font-bold text-primary hover:underline"
                        >
                          {rec.invoiceNumber}
                        </Link>
                        <div className="text-[11px] text-on-surface-variant">
                          {formatDate(rec.issuedAt || rec.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-on-surface">{rec.vehicle.licensePlate}</div>
                        <div className="text-xs text-on-surface-variant font-mono">
                          {rec.woNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-on-surface">{rec.customer.fullName}</div>
                        <div className="text-xs text-on-surface-variant">{rec.customer.phone || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <InvoiceStatusBadge status={rec.status as any} />
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-on-surface">
                        {formatMoney(rec.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {rec.amountDue && rec.amountDue > 0 ? (
                          <span className="text-amber-700">{formatMoney(rec.amountDue)}</span>
                        ) : (
                          <span className="text-emerald-600">0 đ</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {rec.status === 'ISSUED' && (
                            <button
                              onClick={() => handleOpenPayment(rec.id!)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[15px]">payments</span>
                              <span>Thu tiền</span>
                            </button>
                          )}

                          <Link
                            href={`/staff/billing/${rec.id}`}
                            className="px-2.5 py-1 rounded-lg border border-outline-variant hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <span>Chi tiết</span>
                            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
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
          <div className="flex items-center justify-between pt-2 text-xs text-on-surface-variant">
            <span>
              Hiển thị <strong>{records.length}</strong> / <strong>{pagination.total}</strong> bản ghi
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.currentPage <= 1}
                onClick={() => dispatch(setPage(pagination.currentPage - 1))}
                className="px-2.5 py-1 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-40"
              >
                Trước
              </button>
              <span className="px-2 font-medium">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => dispatch(setPage(pagination.currentPage + 1))}
                className="px-2.5 py-1 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-40"
              >
                Sau
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
