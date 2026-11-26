'use client';

import React, { useCallback, useDeferredValue, useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchMyInvoices,
  fetchInvoiceDetail,
  setSelectedInvoice,
  InvoiceListItemDto,
} from '@/store/slices/invoiceSlice';
import Toast from '@/components/shared/Toast';
import { ErrorState, LoadingSkeleton } from '@/components/ui';
import { downloadInvoicePdfBlob } from '@/lib/api/invoice.api';
import { StoredChatActionPayload } from '@/components/chat/aiChatUtils';
import { downloadPdfBlob } from '@/utils/customerHelpers';

const CustomerPaymentModal = dynamic(() => import('./CustomerPaymentModal'));
const InvoiceDetailModal = dynamic(() => import('./InvoiceDetailModal'));

export default function InvoicesView({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const dispatch = useAppDispatch();
  const { invoices, summary, selectedInvoice, loading, detailLoading, error } = useAppSelector(
    (state) => state.invoices
  );

  const [activeTab, setActiveTab] = useState<'ALL' | 'PAID' | 'ISSUED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [page, setPage] = useState<number>(1);
  const pageSize = 5;
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentTarget, setPaymentTarget] = useState<{
    id: number;
    invoiceNumber: string;
    amountDue: number;
    licensePlate?: string;
    vehicleName?: string;
  } | null>(null);

  const handleOpenPayModal = (inv: InvoiceListItemDto | any) => {
    setPaymentTarget({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amountDue: inv.amountDue,
      licensePlate: inv.vehicle?.licensePlate,
      vehicleName: `${inv.vehicle?.make || ''} ${inv.vehicle?.model || ''}`,
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setToastType('success');
    setToastMsg('Thanh toán hóa đơn trực tuyến thành công!');
    dispatch(fetchMyInvoices({ status: activeTab, search: searchTerm }));
    if (selectedInvoice) {
      dispatch(fetchInvoiceDetail(selectedInvoice.id));
    }
    setTimeout(() => {
      setPaymentModalOpen(false);
      setPaymentTarget(null);
    }, 1200);
  };

  useEffect(() => {
    dispatch(fetchMyInvoices({ status: activeTab, search: searchTerm }));
  }, [dispatch, activeTab]);

  const consumedInvoiceQueryRef = useRef(false);

  const triggerInvoiceModal = useCallback(
    (invoiceId?: number | null) => {
      if (invoices.length === 0) return false;
      const target =
        (invoiceId ? invoices.find((inv) => Number(inv.id) === Number(invoiceId)) : null) ||
        invoices.find((inv) => inv.status === 'ISSUED') ||
        invoices[0];
      if (!target) return false;

      if (target.status === 'ISSUED') {
        handleOpenPayModal(target);
      } else {
        openInvoiceDetail(target.id);
      }
      return true;
    },
    [invoices]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || invoices.length === 0 || consumedInvoiceQueryRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const openInvParam = params.get('openInvoice');
    if (openInvParam) {
      const invId = openInvParam === 'latest' ? null : Number(openInvParam);
      if (triggerInvoiceModal(Number.isFinite(invId as number) ? invId : null)) {
        consumedInvoiceQueryRef.current = true;
        params.delete('openInvoice');
        const nextQuery = params.toString();
        window.history.replaceState(null, '', `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`);
      }
    }
  }, [invoices, triggerInvoiceModal]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleViewInvoice = (ev: Event) => {
      const detail = (ev as CustomEvent<StoredChatActionPayload>).detail;
      triggerInvoiceModal(detail?.invoiceId);
    };
    window.addEventListener('csc:view-invoice', handleViewInvoice);
    return () => window.removeEventListener('csc:view-invoice', handleViewInvoice);
  }, [triggerInvoiceModal]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(fetchMyInvoices({ status: activeTab, search: searchTerm }));
  };

  const openInvoiceDetail = async (invId: number) => {
    setModalOpen(true);
    await dispatch(fetchInvoiceDetail(invId));
  };

  const handleDownloadPdf = async (invId: number, invNumber?: string) => {
    try {
      setDownloadingPdfId(invId);
      const blob = await downloadInvoicePdfBlob(invId);
      downloadPdfBlob(blob, `Hoa_Don_${invNumber || invId}.pdf`);
      setToastMsg(`Đã tải hóa đơn PDF ${invNumber ? '#' + invNumber : ''} thành công!`);
      setToastType('success');
    } catch (err: any) {
      setToastMsg('Không thể xuất file PDF: ' + (err.response?.data?.message || err.message || 'Lỗi hệ thống'));
      setToastType('error');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  // Lọc phía client thêm để phản hồi mượt mà
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (activeTab === 'PAID' && inv.status !== 'PAID') return false;
      if (activeTab === 'ISSUED' && inv.status !== 'ISSUED') return false;
      if (deferredSearchTerm.trim()) {
        const query = deferredSearchTerm.toLowerCase();
        const matchNumber = inv.invoiceNumber.toLowerCase().includes(query);
        const matchPlate = inv.vehicle.licensePlate.toLowerCase().includes(query);
        const matchService = inv.primaryServiceDescription.toLowerCase().includes(query);
        return matchNumber || matchPlate || matchService;
      }
      return true;
    });
  }, [invoices, activeTab, deferredSearchTerm]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, page, pageSize]);

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6">
      {/* Toast */}
      {toastMsg && (
        <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Hóa đơn & Lịch sử thanh toán
          </h1>
          {!isEmbedded && (
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Theo dõi, kiểm tra chi phí bảo dưỡng và tải hóa đơn điện tử VAT trực tuyến.
            </p>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/customer/profile?tab=tracking"
            onClick={(e) => {
              if (typeof window !== 'undefined' && window.location.pathname === '/customer/profile') {
                e.preventDefault();
                window.history.replaceState(null, '', '/customer/profile?tab=tracking');
                window.dispatchEvent(new CustomEvent('csc:switch-tab', { detail: 'tracking' }));
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-lowest border border-surface-container-highest hover:bg-surface-container-low text-on-surface text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">timeline</span>
            Xem tiến độ xe
          </Link>
          <button
            onClick={() => {
              setToastType('info');
              setToastMsg('Trung tâm hỗ trợ giải đáp hóa đơn: 1900 6868 (Ext: 102)');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-xs sm:text-sm font-semibold rounded-lg shadow-2xs hover:bg-primary/90 transition-all active:scale-[0.98]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">help</span>
            Hỗ trợ hóa đơn
          </button>
        </div>
      </div>

      {/* ================= ASYMMETRICAL BENTO METRIC CARDS (5 + 4 + 3) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
        
        {/* Card 1: Tổng chi tiêu */}
        <div className="md:col-span-5 bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Tổng chi tiêu tại xưởng
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-on-surface mt-2 tracking-tight">
                {summary.totalSpent.toLocaleString()} <span className="text-sm font-sans font-normal text-on-surface-variant">đ</span>
              </h3>
              <div className="flex items-center mt-2.5 text-xs font-medium text-emerald-700">
                <span className="material-symbols-outlined text-[16px] mr-1 text-emerald-600" aria-hidden="true">trending_up</span>
                <span>Ưu đãi thành viên tích lũy dịch vụ</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-primary border border-blue-100 shrink-0">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">receipt_long</span>
            </div>
          </div>
        </div>

        {/* Card 2: Chờ thanh toán */}
        <div className="md:col-span-4 bg-surface-container-lowest border border-red-200 rounded-2xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Chờ thanh toán
                </p>
                {summary.pendingCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-error font-mono tabular-nums">
                    {summary.pendingCount} hóa đơn
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-error mt-2 tracking-tight">
                {summary.pendingAmount.toLocaleString()} <span className="text-sm font-sans font-normal text-on-surface-variant">đ</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-2.5 flex items-center">
                <span className="material-symbols-outlined text-[15px] mr-1 text-error" aria-hidden="true">schedule</span>
                {summary.pendingCount > 0 ? 'Có phiếu dịch vụ đã hoàn tất' : 'Không có hóa đơn nợ'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-100/70 flex items-center justify-center text-error border border-red-200 shrink-0">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">pending_actions</span>
            </div>
          </div>
        </div>

        {/* Card 3: Điểm tích lũy VIP */}
        <div className="md:col-span-3 bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Điểm thưởng thành viên
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-on-surface mt-2 tracking-tight">
                {summary.rewardPoints.toLocaleString()} <span className="text-sm font-sans font-normal text-on-surface-variant">điểm</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-2.5 flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-1 text-amber-500" aria-hidden="true">stars</span>
                Quy đổi chiết khấu dịch vụ sau
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">workspace_premium</span>
            </div>
          </div>
        </div>

      </div>

      {/* Print-only Header */}
      <div className="hidden print:block border-b-2 border-blue-800 pb-3 mb-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-base font-bold text-blue-900 uppercase">TRUNG TÂM BẢO DƯỠNG &amp; SỬA CHỮA Ô TÔ AUTOCARE PRO</h1>
            <p className="text-xs text-slate-600">Địa chỉ: Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh • Hotline: 1900 6868</p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Ngày in: {new Date().toLocaleDateString('vi-VN')}</div>
            <div>Tổng số hóa đơn: {filteredInvoices.length}</div>
          </div>
        </div>
        <h2 className="text-center text-lg font-bold text-slate-900 uppercase mt-3">DANH SÁCH HÓA ĐƠN DỊCH VỤ</h2>
      </div>

      {/* ================= MAIN DATA CARD: Search, Filters & Table ================= */}
      <section className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl shadow-sm overflow-hidden print-full-width">
        
        {/* Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-surface-container-highest flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
          
          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative w-full lg:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Mã HĐ, Biển số xe..."
              className="w-full min-h-[44px] pl-9 pr-3 bg-surface-container-lowest border border-surface-container-highest rounded-lg text-xs text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </form>

          {/* Filter Tabs & Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex p-1 bg-surface-container-low rounded-lg border border-surface-container-highest">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-white text-on-surface shadow-2xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Tất cả ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PAID')}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'PAID'
                    ? 'bg-white text-on-surface shadow-2xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Đã thanh toán
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ISSUED')}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center cursor-pointer ${
                  activeTab === 'ISSUED'
                    ? 'bg-white text-on-surface shadow-2xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Chưa thanh toán
                {summary.pendingCount > 0 && (
                  <span className="ml-1.5 w-1.5 h-1.5 bg-error rounded-full animate-ping"></span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center min-h-[44px] px-3.5 py-2 bg-surface-container-lowest border border-surface-container-highest hover:bg-surface-container-low text-on-surface text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] mr-1.5 text-emerald-700">print</span>
              In danh sách
            </button>
          </div>

        </div>

        {/* Error / Loading / Mobile Cards / Desktop Table */}
        {error && invoices.length === 0 ? (
          <div className="p-4 sm:p-6">
            <ErrorState
              title="Không thể tải danh sách hóa đơn"
              message={error}
              onRetry={() => dispatch(fetchMyInvoices({ status: activeTab, search: searchTerm }))}
            />
          </div>
        ) : (
          <>
            {/* Mobile Card List (<768px) */}
            <div className="md:hidden divide-y divide-surface-container-highest">
              {loading && invoices.length === 0 ? (
                <div className="p-4">
                  <LoadingSkeleton variant="cards" count={3} />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="py-12 px-4 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[36px] text-outline opacity-50 mb-1">
                    receipt
                  </span>
                  <p className="font-semibold text-sm">Không tìm thấy hóa đơn nào</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Thử thay đổi bộ lọc hoặc tìm kiếm bằng từ khóa khác.
                  </p>
                </div>
              ) : (
                paginatedInvoices.map((inv: InvoiceListItemDto) => {
                  const isPaid = inv.status === 'PAID';
                  const dateStr = inv.issuedAt
                    ? new Date(inv.issuedAt).toLocaleDateString('vi-VN')
                    : new Date(inv.createdAt).toLocaleDateString('vi-VN');
                  return (
                    <div
                      key={inv.id}
                      className={`p-4 space-y-3 ${!isPaid ? 'bg-red-50/15' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-primary font-mono text-sm">
                              #{inv.invoiceNumber}
                            </span>
                            {!isPaid && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-error border border-red-200">
                                Chờ
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-outline mt-0.5">{dateStr}</p>
                        </div>
                        {isPaid ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
                            Đã thanh toán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-error border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-error mr-1.5 animate-pulse" />
                            Chưa thanh toán
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-white border border-gray-300 font-mono text-[11px] font-bold rounded text-gray-800">
                              {inv.vehicle.licensePlate}
                            </span>
                            <span className="text-xs font-semibold text-on-surface truncate">
                              {inv.vehicle.make} {inv.vehicle.model}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                            {inv.primaryServiceDescription}
                          </p>
                        </div>
                        <span
                          className={`font-bold font-mono text-base shrink-0 ${
                            !isPaid ? 'text-error' : 'text-on-surface'
                          }`}
                        >
                          {inv.totalAmount.toLocaleString()} đ
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {!isPaid && (
                          <button
                            onClick={() => handleOpenPayModal(inv)}
                            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-primary text-white hover:bg-primary/90 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">credit_card</span>
                            Thanh toán
                          </button>
                        )}
                        <button
                          onClick={() => openInvoiceDetail(inv.id)}
                          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container-highest text-on-surface text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            visibility
                          </span>
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                          disabled={downloadingPdfId === inv.id}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container-highest text-on-surface text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          type="button"
                          title={isPaid ? 'Tải biên lai PDF' : 'Tải hóa đơn PDF'}
                        >
                          {downloadingPdfId === inv.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              download
                            </span>
                          )}
                          PDF
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Data Table (>=768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-surface-container-highest text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-[18%] min-w-[160px] whitespace-nowrap" scope="col">Mã Hóa Đơn</th>
                <th className="py-3 px-4 w-[12%] min-w-[100px] whitespace-nowrap" scope="col">Ngày Lập</th>
                <th className="py-3 px-4 min-w-[260px]" scope="col">Phương Tiện & Dịch Vụ</th>
                <th className="py-3 px-4 text-right w-[15%] min-w-[130px] whitespace-nowrap" scope="col">Tổng Tiền</th>
                <th className="py-3 px-4 text-center w-[14%] min-w-[130px] whitespace-nowrap" scope="col">Trạng Thái</th>
                <th className="py-3 px-4 text-center w-[12%] min-w-[120px] whitespace-nowrap" scope="col">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest text-xs">
              {loading && invoices.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-44 bg-slate-200 rounded mb-1.5" /><div className="h-3 w-28 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-200 rounded ml-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 w-24 bg-slate-200 rounded-full mx-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-7 w-20 bg-slate-200 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[36px] text-outline opacity-50 mb-1">
                      receipt
                    </span>
                    <p className="font-semibold text-sm">Không tìm thấy hóa đơn nào</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Thử thay đổi bộ lọc hoặc tìm kiếm bằng từ khóa khác.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv: InvoiceListItemDto) => {
                  const isPaid = inv.status === 'PAID';
                  const dateStr = inv.issuedAt
                    ? new Date(inv.issuedAt).toLocaleDateString('vi-VN')
                    : new Date(inv.createdAt).toLocaleDateString('vi-VN');

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-surface-container-low/50 transition-colors ${
                        !isPaid ? 'bg-red-50/15' : ''
                      }`}
                    >
                      {/* Mã HĐ */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-bold text-primary font-mono text-xs whitespace-nowrap">
                            #{inv.invoiceNumber}
                          </span>
                          {!isPaid && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-error whitespace-nowrap border border-red-200">
                              Chờ
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-outline block mt-0.5 whitespace-nowrap">
                          VAT điện tử
                        </span>
                      </td>

                      {/* Ngày lập */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <span className="text-on-surface font-medium whitespace-nowrap">{dateStr}</span>
                      </td>

                      {/* Phương tiện & Gói dịch vụ */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-white border border-gray-300 font-mono text-[11px] font-bold rounded text-gray-800 shadow-2xs whitespace-nowrap">
                              {inv.vehicle.licensePlate}
                            </span>
                            <span className="font-semibold text-on-surface whitespace-nowrap">
                              {inv.vehicle.make} {inv.vehicle.model}
                            </span>
                          </div>
                          <span className="text-xs text-on-surface-variant mt-1 line-clamp-1" title={inv.primaryServiceDescription}>
                            {inv.primaryServiceDescription}
                          </span>
                        </div>
                      </td>

                      {/* Tổng tiền */}
                      <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                        <span
                          className={`font-bold font-mono text-sm sm:text-base whitespace-nowrap ${
                            !isPaid ? 'text-error' : 'text-on-surface'
                          }`}
                        >
                          {inv.totalAmount.toLocaleString()} đ
                        </span>
                        <span className="block text-[10px] text-outline whitespace-nowrap mt-0.5">Quy chế VAT 0%</span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                            Đã thanh toán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-error border border-red-200 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-error mr-1.5 animate-pulse"></span>
                            Chưa thanh toán
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => handleOpenPayModal(inv)}
                              className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3 py-1.5 bg-primary text-white hover:bg-primary/90 text-xs font-semibold rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer active:scale-95"
                              type="button"
                              title="Thanh toán trực tuyến từ xa"
                            >
                              <span className="material-symbols-outlined text-[15px]">credit_card</span>
                              Thanh toán
                            </button>
                          )}
                          <button
                            onClick={() => openInvoiceDetail(inv.id)}
                            className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              visibility
                            </span>
                            Chi tiết
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                            disabled={downloadingPdfId === inv.id}
                            className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
                            type="button"
                            title={isPaid ? "Tải biên lai PDF" : "Tải hóa đơn PDF"}
                          >
                            {downloadingPdfId === inv.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[16px] text-primary">
                                download
                              </span>
                            )}
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
          </>
        )}

        {/* Footer & Pagination */}
        <div className="p-3.5 border-t border-surface-container-highest bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant no-print">
          <p>
            Hiển thị{' '}
            <strong className="text-on-surface">
              {filteredInvoices.length === 0 ? 0 : (page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, filteredInvoices.length)}
            </strong>{' '}
            trên <strong className="text-on-surface">{filteredInvoices.length}</strong> hóa đơn
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="min-h-[44px] px-3.5 py-1.5 text-xs font-medium rounded-lg border border-surface-container-highest bg-surface-container-lowest text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Trước
              </button>
              <span className="text-xs font-semibold px-2">
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="min-h-[44px] px-3.5 py-1.5 text-xs font-medium rounded-lg border border-surface-container-highest bg-surface-container-lowest text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
          <div className="hidden md:flex items-center gap-1">
            <span className="text-[11px] text-outline">Hóa đơn điện tử khởi tạo từ hệ thống AutoCare Pro</span>
          </div>        </div>

      </section>

      {/* ================= PAYMENT METHODS & WORK ORDER CLEARANCE INFO ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Methods & Financial Clearance */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-surface-container-highest rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-on-surface">
                  Phương thức thanh toán &amp; Quyết toán tài chính
                </h4>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Đối soát tự động 24/7
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Thanh toán linh hoạt, tự động đối soát mở cổng xuất xưởng.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {/* 1. VietQR */}
            <div className="border border-slate-200 dark:border-surface-container-highest rounded-2xl p-3.5 flex items-start gap-3 bg-slate-50/60 dark:bg-surface-container-low/40 hover:border-blue-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-on-surface block">Chuyển khoản SePay</span>
                <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5">
                  Quét mã QR SePay 24/7, xác nhận tức thì không cần chụp bill
                </span>
              </div>
            </div>

            {/* 2. Quẹt thẻ POS */}
            <div className="border border-slate-200 dark:border-surface-container-highest rounded-2xl p-3.5 flex items-start gap-3 bg-slate-50/60 dark:bg-surface-container-low/40 hover:border-indigo-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">credit_card</span>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-on-surface block">Thẻ ngân hàng (POS)</span>
                <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5">
                  Quẹt thẻ ATM, Visa, Mastercard, JCB trực tiếp tại xưởng
                </span>
              </div>
            </div>

            {/* 3. Tiền mặt tại quầy */}
            <div className="border border-slate-200 dark:border-surface-container-highest rounded-2xl p-3.5 flex items-start gap-3 bg-slate-50/60 dark:bg-surface-container-low/40 hover:border-emerald-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-on-surface block">Tiền mặt tại thu ngân</span>
                <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5">
                  Thanh toán trực tiếp cho Thu ngân khi nhận xe xuất xưởng
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* VAT Invoice & Garage Info */}
        <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-surface-container-highest rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-primary">
              <span className="material-symbols-outlined text-[22px]">domain_verification</span>
              <h4 className="text-sm font-bold text-on-surface">Xuất hóa đơn điện tử & VAT</h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Hóa đơn dịch vụ và chứng từ xuất xưởng được khởi tạo tự động, lưu trữ trên hệ thống và gửi về email khách hàng.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-surface-container-low rounded-xl border border-slate-200/80 dark:border-surface-container-highest text-xs space-y-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Đơn vị phát hành:</p>
              <p className="font-extrabold text-slate-900 text-xs truncate">TRUNG TÂM BẢO DƯỠNG &amp; SỬA CHỮA Ô TÔ AUTOCARE PRO</p>
              <p className="text-slate-600 text-[11px]">Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-surface-container-highest flex items-center justify-between text-xs">
            <span className="font-semibold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">support_agent</span>
              Hotline hỗ trợ đối soát
            </span>
            <span className="text-xs font-bold text-slate-800 font-mono tabular-nums">1900 6868</span>
          </div>
        </div>

      </div>

      {/* ================= MODAL: CHI TIẾT HÓA ĐƠN ================= */}
      {modalOpen && (
        <InvoiceDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedInvoice={selectedInvoice}
          detailLoading={detailLoading}
          downloadingPdfId={downloadingPdfId}
          onDownloadPdf={handleDownloadPdf}
          onOpenPayModal={handleOpenPayModal}
        />
      )}
      {/* Modal Thanh toán trực tuyến từ xa */}
      {paymentModalOpen && paymentTarget && (
        <CustomerPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setPaymentTarget(null);
          }}
          invoice={paymentTarget}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
