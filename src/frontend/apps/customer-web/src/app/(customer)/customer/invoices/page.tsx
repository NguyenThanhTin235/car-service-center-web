'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchMyInvoices,
  fetchInvoiceDetail,
  setSelectedInvoice,
  InvoiceListItemDto,
} from '@/store/slices/invoiceSlice';
import Toast from '@/components/shared/Toast';

export default function CustomerInvoicesPage() {
  const dispatch = useAppDispatch();
  const { invoices, summary, selectedInvoice, loading, detailLoading } = useAppSelector(
    (state) => state.invoices
  );

  const [activeTab, setActiveTab] = useState<'ALL' | 'PAID' | 'ISSUED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  useEffect(() => {
    dispatch(fetchMyInvoices({ status: activeTab, search: searchTerm }));
  }, [dispatch, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(fetchMyInvoices({ status: activeTab, search: searchTerm }));
  };

  const openInvoiceDetail = async (invId: number) => {
    setModalOpen(true);
    await dispatch(fetchInvoiceDetail(invId));
  };

  const handlePrint = () => {
    window.print();
  };

  // Lọc phía client thêm để phản hồi mượt mà
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (activeTab === 'PAID' && inv.status !== 'PAID') return false;
      if (activeTab === 'ISSUED' && inv.status !== 'ISSUED') return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchNumber = inv.invoiceNumber.toLowerCase().includes(query);
        const matchPlate = inv.vehicle.licensePlate.toLowerCase().includes(query);
        const matchService = inv.primaryServiceDescription.toLowerCase().includes(query);
        return matchNumber || matchPlate || matchService;
      }
      return true;
    });
  }, [invoices, activeTab, searchTerm]);

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6">
      {/* Toast */}
      {toastMsg && (
        <Toast message={toastMsg} type="success" onClose={() => setToastMsg('')} />
      )}

      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center space-x-2 text-on-surface-variant text-xs mb-1.5 font-medium">
            <Link href="/customer" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Hóa đơn & Chi phí</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Hóa đơn & Lịch sử thanh toán
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Theo dõi, kiểm tra chi phí bảo dưỡng và tải hóa đơn điện tử VAT trực tuyến.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/customer/tracking"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-lowest border border-surface-container-highest hover:bg-surface-container-low text-on-surface text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">timeline</span>
            Xem tiến độ xe
          </Link>
          <button
            onClick={() => setToastMsg('Trung tâm hỗ trợ giải đáp hóa đơn: 1900 6868 (Ext: 102)')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-xs sm:text-sm font-semibold rounded-lg shadow-2xs hover:bg-primary/90 transition-all active:scale-[0.98]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            Hỗ trợ hóa đơn
          </button>
        </div>
      </div>

      {/* ================= 3 BENTO METRIC CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Card 1: Tổng chi tiêu */}
        <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Tổng chi tiêu tại xưởng
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface mt-2 tracking-tight">
                {summary.totalSpent.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">đ</span>
              </h3>
              <div className="flex items-center mt-2.5 text-xs font-medium text-emerald-700">
                <span className="material-symbols-outlined text-[16px] mr-1 text-emerald-600">trending_up</span>
                <span>Ưu đãi thành viên tích lũy dịch vụ</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-primary border border-blue-100 shrink-0">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
          </div>
        </div>

        {/* Card 2: Chờ thanh toán */}
        <div className="bg-surface-container-lowest border border-red-200 rounded-2xl p-5 shadow-2xs relative overflow-hidden bg-gradient-to-r from-white to-red-50/40">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Chờ thanh toán
                </p>
                {summary.pendingCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-error">
                    {summary.pendingCount} hóa đơn
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-error mt-2 tracking-tight">
                {summary.pendingAmount.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">đ</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-2.5 flex items-center">
                <span className="material-symbols-outlined text-[15px] mr-1 text-error">schedule</span>
                {summary.pendingCount > 0 ? 'Có phiếu dịch vụ đã hoàn tất' : 'Không có hóa đơn nợ'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-100/70 flex items-center justify-center text-error border border-red-200 shrink-0">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
          </div>
        </div>

        {/* Card 3: Điểm tích lũy VIP */}
        <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Điểm thưởng thành viên
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface mt-2 tracking-tight">
                {summary.rewardPoints.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">điểm</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-2.5 flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-1 text-amber-500">stars</span>
                Quy đổi chiết khấu dịch vụ sau
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
            </div>
          </div>
        </div>

      </div>

      {/* ================= MAIN DATA CARD: Search, Filters & Table ================= */}
      <section className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl shadow-sm overflow-hidden">
        
        {/* Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-surface-container-highest flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
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
              className="w-full h-9 pl-9 pr-3 bg-surface-container-lowest border border-surface-container-highest rounded-lg text-xs text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </form>

          {/* Filter Tabs & Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex p-1 bg-surface-container-low rounded-lg border border-surface-container-highest">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
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
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
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
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center ${
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
              className="inline-flex items-center px-3 py-1.5 bg-surface-container-lowest border border-surface-container-highest hover:bg-surface-container-low text-on-surface text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] mr-1.5 text-emerald-700">print</span>
              In danh sách
            </button>
          </div>

        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-surface-container-highest text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4" scope="col">Mã Hóa Đơn</th>
                <th className="py-3 px-4" scope="col">Ngày Lập</th>
                <th className="py-3 px-4" scope="col">Phương Tiện & Dịch Vụ</th>
                <th className="py-3 px-4 text-right" scope="col">Tổng Tiền</th>
                <th className="py-3 px-4 text-center" scope="col">Trạng Thái</th>
                <th className="py-3 px-4 text-right" scope="col">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải danh sách hóa đơn...
                  </td>
                </tr>
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
                filteredInvoices.map((inv: InvoiceListItemDto) => {
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
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-on-surface font-mono">
                            #{inv.invoiceNumber}
                          </span>
                          {!isPaid && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-error">
                              Chờ
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-outline block mt-0.5">
                          VAT điện tử
                        </span>
                      </td>

                      {/* Ngày lập */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="text-on-surface font-medium block">{dateStr}</span>
                      </td>

                      {/* Phương tiện & Gói dịch vụ */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 bg-white border border-gray-300 font-mono text-[11px] font-bold rounded text-gray-800 shadow-2xs">
                              {inv.vehicle.licensePlate}
                            </span>
                            <span className="font-semibold text-on-surface">
                              {inv.vehicle.make} {inv.vehicle.model}
                            </span>
                          </div>
                          <span className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                            {inv.primaryServiceDescription}
                          </span>
                        </div>
                      </td>

                      {/* Tổng tiền */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <span
                          className={`font-bold text-sm sm:text-base ${
                            !isPaid ? 'text-error' : 'text-on-surface'
                          }`}
                        >
                          {inv.totalAmount.toLocaleString()} đ
                        </span>
                        <span className="block text-[10px] text-outline">Đã gồm VAT 8%</span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 align-middle text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1"></span>
                            Đã thanh toán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-error border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-error mr-1 animate-pulse"></span>
                            Chưa thanh toán
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openInvoiceDetail(inv.id)}
                            className="inline-flex items-center px-2.5 py-1.5 bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px] mr-1 text-primary">
                              visibility
                            </span>
                            Xem chi tiết
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

        {/* Footer */}
        <div className="p-3.5 border-t border-surface-container-highest bg-surface-container-lowest flex items-center justify-between text-xs text-on-surface-variant">
          <p>
            Hiển thị <strong className="text-on-surface">{filteredInvoices.length}</strong> hóa đơn
          </p>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-outline">Hóa đơn điện tử khởi tạo từ hệ thống Car Service Center</span>
          </div>
        </div>

      </section>

      {/* ================= PAYMENT METHODS & VAT NOTIFICATION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Gateways Support */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center border border-blue-100 shrink-0">
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Phương thức thanh toán bảo mật đa kênh</h4>
                <p className="text-xs text-on-surface-variant">Giao dịch được mã hóa an toàn đạt chuẩn PCI DSS quốc tế.</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-semibold">
              Tự động đối soát
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
            <div className="border border-surface-container-highest rounded-xl p-2.5 flex flex-col items-center justify-center text-center bg-surface-container-low/40">
              <span className="material-symbols-outlined text-[22px] text-primary mb-1">qr_code_scanner</span>
              <span className="font-semibold text-xs text-on-surface">VietQR 24/7</span>
              <span className="text-[10px] text-on-surface-variant">Xác nhận ngay</span>
            </div>
            <div className="border border-surface-container-highest rounded-xl p-2.5 flex flex-col items-center justify-center text-center bg-surface-container-low/40">
              <span className="material-symbols-outlined text-[22px] text-indigo-600 mb-1">credit_card</span>
              <span className="font-semibold text-xs text-on-surface">Thẻ Quốc Tế</span>
              <span className="text-[10px] text-on-surface-variant">Visa / Mastercard</span>
            </div>
            <div className="border border-surface-container-highest rounded-xl p-2.5 flex flex-col items-center justify-center text-center bg-surface-container-low/40">
              <span className="material-symbols-outlined text-[22px] text-pink-600 mb-1">account_balance_wallet</span>
              <span className="font-semibold text-xs text-on-surface">Ví Điện Tử</span>
              <span className="text-[10px] text-on-surface-variant">MoMo / ZaloPay</span>
            </div>
            <div className="border border-surface-container-highest rounded-xl p-2.5 flex flex-col items-center justify-center text-center bg-surface-container-low/40">
              <span className="material-symbols-outlined text-[22px] text-amber-600 mb-1">percent</span>
              <span className="font-semibold text-xs text-on-surface">Trả góp 0%</span>
              <span className="text-[10px] text-on-surface-variant">Kỳ hạn 3-12 tháng</span>
            </div>
          </div>
        </div>

        {/* VAT Invoice Support */}
        <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">domain_verification</span>
              <h4 className="text-sm font-bold text-on-surface">Xuất hóa đơn VAT điện tử</h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Hóa đơn GTGT điện tử chuẩn Tổng cục Thuế được gửi tự động về email đăng ký sau khi lệnh thanh toán hoàn tất.
            </p>
            <div className="mt-2.5 p-2.5 bg-surface-container-low rounded-xl border border-surface-container-highest text-xs">
              <p className="text-[10px] text-outline">Đơn vị phát hành:</p>
              <p className="font-bold text-on-surface mt-0.5 truncate">TRUNG TÂM CAR SERVICE CENTER VN</p>
              <p className="text-on-surface-variant text-[11px]">MST: 0108923451</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container-highest flex items-center justify-between text-xs">
            <span className="font-semibold text-primary">Hỗ trợ đối soát VAT 24/7</span>
            <span className="text-[11px] text-outline">1900 6868</span>
          </div>
        </div>

      </div>

      {/* ================= MODAL: CHI TIẾT HÓA ĐƠN ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-surface-container-highest flex items-center justify-between sticky top-0 bg-surface-container-lowest z-10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">receipt</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Chi tiết hóa đơn {selectedInvoice ? `#${selectedInvoice.invoiceNumber}` : ''}
                  </h3>
                  <p className="text-xs text-on-surface-variant">Trung tâm dịch vụ kỹ thuật Car Service Center</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  In / Tải PDF
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 print:p-0">
              {detailLoading || !selectedInvoice ? (
                <div className="py-12 text-center text-on-surface-variant">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Đang tải chi tiết hóa đơn...
                </div>
              ) : (
                <>
                  {/* Gara & Invoice Meta */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container-highest text-xs">
                    <div>
                      <p className="text-[10px] text-outline uppercase font-semibold">Khách hàng</p>
                      <p className="text-sm font-bold text-on-surface mt-0.5">{selectedInvoice.customer.fullName}</p>
                      <p className="text-on-surface-variant">SĐT: {selectedInvoice.customer.phone}</p>
                      <p className="text-on-surface-variant">Email: {selectedInvoice.customer.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-outline uppercase font-semibold">Thông tin xe & tiếp nhận</p>
                      <p className="text-sm font-bold text-on-surface mt-0.5 font-mono">
                        Biển số: {selectedInvoice.vehicle.licensePlate}
                      </p>
                      <p className="text-on-surface-variant">
                        Dòng xe: {selectedInvoice.vehicle.make} {selectedInvoice.vehicle.model}
                      </p>
                      <p className="text-on-surface-variant">
                        Cố vấn tiếp nhận: {selectedInvoice.advisor.fullName}
                      </p>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    selectedInvoice.status === 'PAID'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-[18px]">
                        {selectedInvoice.status === 'PAID' ? 'verified' : 'pending'}
                      </span>
                      <span className="font-semibold">
                        Trạng thái: {selectedInvoice.status === 'PAID' ? 'Đã thanh toán hoàn tất' : 'Chưa thanh toán'}
                      </span>
                    </div>
                    {selectedInvoice.issuedAt && (
                      <span className="font-mono text-[11px]">
                        Ngày lập: {new Date(selectedInvoice.issuedAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>

                  {/* Line Items Table */}
                  <div className="overflow-x-auto border border-surface-container-highest rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-surface-container-highest font-semibold text-on-surface-variant uppercase text-[10px]">
                          <th className="py-2.5 px-3">Hạng mục chi tiết</th>
                          <th className="py-2.5 px-3 text-center">SL</th>
                          <th className="py-2.5 px-3 text-right">Đơn giá (đ)</th>
                          <th className="py-2.5 px-3 text-right">Thành tiền (đ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-highest">
                        {selectedInvoice.lines.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-on-surface-variant">
                              Không có hạng mục chi tiết
                            </td>
                          </tr>
                        ) : (
                          selectedInvoice.lines.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-on-surface block">
                                  {item.description}
                                </span>
                                <span className="text-[10px] text-outline">
                                  Loại: {item.lineType === 'PART' ? 'Phụ tùng' : item.lineType === 'LABOUR' ? 'Công thợ' : 'Dịch vụ'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">
                                {item.unitPrice.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold font-mono text-on-surface">
                                {item.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-highest space-y-1.5 text-xs text-on-surface">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Tạm tính dịch vụ & linh kiện:</span>
                      <span className="font-mono font-medium">{selectedInvoice.subtotal.toLocaleString()} đ</span>
                    </div>
                    {selectedInvoice.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Chiết khấu ưu đãi:</span>
                        <span className="font-mono font-medium">-{selectedInvoice.discountAmount.toLocaleString()} đ</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Thuế GTGT (VAT 8%):</span>
                      <span className="font-mono font-medium">{selectedInvoice.taxAmount.toLocaleString()} đ</span>
                    </div>
                    <div className="pt-2 border-t border-surface-container-highest flex justify-between items-center text-sm">
                      <span className="font-bold text-on-surface">Tổng tiền thanh toán:</span>
                      <span className="font-bold font-mono text-base text-primary">
                        {selectedInvoice.totalAmount.toLocaleString()} đ
                      </span>
                    </div>
                    {selectedInvoice.status !== 'PAID' && (
                      <div className="flex justify-between items-center text-xs text-error font-semibold pt-1">
                        <span>Số tiền còn lại cần thanh toán:</span>
                        <span className="font-mono">{selectedInvoice.amountDue.toLocaleString()} đ</span>
                      </div>
                    )}
                  </div>

                  {/* Payments list if any */}
                  {selectedInvoice.payments.length > 0 && (
                    <div className="space-y-1.5 text-xs">
                      <p className="font-semibold text-on-surface">Lịch sử thanh toán đã ghi nhận:</p>
                      {selectedInvoice.payments.map((p) => (
                        <div key={p.id} className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-highest flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-on-surface">
                              Hình thức: {p.paymentMethod === 'CASH' ? 'Tiền mặt' : p.paymentMethod === 'CARD' ? 'Thẻ POS' : 'Chuyển khoản VietQR'}
                            </span>
                            {p.transactionRef && (
                              <p className="text-[10px] text-outline font-mono">Mã giao dịch: {p.transactionRef}</p>
                            )}
                          </div>
                          <span className="font-bold font-mono text-emerald-700">
                            +{p.amount.toLocaleString()} đ
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-surface-container-highest flex items-center justify-end gap-2.5 bg-surface-container-lowest sticky bottom-0">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
