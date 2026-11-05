'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMyTrackingOrders, setSelectedOrder, WorkOrderTrackingDto } from '@/store/slices/trackingSlice';
import Toast from '@/components/shared/Toast';
import CustomerQuotationModal from './CustomerQuotationModal';
import CustomerCheckInModal from './CustomerCheckInModal';
import CustomerQCModal from './CustomerQCModal';
import CustomerPaymentModal from '@/components/invoices/CustomerPaymentModal';
import { downloadInvoicePdfBlob } from '@/lib/api/invoice.api';
import { downloadHandoverPdfBlob } from '@/lib/api/work-order.api';

const parseComplaintText = (raw?: string | null): string => {
  if (!raw || !raw.trim()) return '';
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
      return '';
    }
  } catch {
    // Không phải JSON, xử lý chuỗi thường
  }
  const clean = String(raw).trim();
  if (clean === '{"tags":[],"notes":""}' || clean === '{}') return '';
  return clean;
};

export default function TrackingView({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const dispatch = useAppDispatch();
  const { orders, selectedOrder, loading } = useAppSelector((state) => state.tracking);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState<boolean>(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [isQCModalOpen, setIsQCModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  const [downloadingHandoverPdf, setDownloadingHandoverPdf] = useState<boolean>(false);
  const [csatRating, setCsatRating] = useState<number>(5);
  const [csatFeedback, setCsatFeedback] = useState<string>('');
  const [csatSubmitted, setCsatSubmitted] = useState<boolean>(false);

  const handleDownloadPdf = async (invId: number, invNumber?: string) => {
    try {
      setDownloadingPdfId(invId);
      const blob = await downloadInvoicePdfBlob(invId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hoa_Don_${invNumber || invId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setToastMsg(`Đã tải hóa đơn PDF ${invNumber ? '#' + invNumber : ''} thành công!`);
    } catch (err: any) {
      setToastMsg('Không thể xuất file PDF: ' + (err.response?.data?.message || err.message || 'Lỗi hệ thống'));
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleDownloadHandoverPdf = async () => {
    if (!activeOrder) return;
    try {
      setDownloadingHandoverPdf(true);
      const blob = await downloadHandoverPdfBlob(activeOrder.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bien_Ban_Ban_Giao_${activeOrder.woNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setToastMsg(`Đã tải xuống Biên bản bàn giao xe #${activeOrder.woNumber} thành công!`);
    } catch (err: any) {
      setToastMsg('Không thể xuất file PDF biên bản bàn giao: ' + (err.response?.data?.message || err.message || 'Lỗi hệ thống'));
    } finally {
      setDownloadingHandoverPdf(false);
    }
  };
  const loadData = useCallback(async (isManual = false) => {
    try {
      await dispatch(fetchMyTrackingOrders()).unwrap();
      if (isManual) {
        setToastMsg('Đã cập nhật tiến độ mới nhất');
      }
    } catch {
      // lỗi đã lưu trong slice
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cập nhật đồng hồ thời gian thực và đếm ngược hiển thị mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN'));
      setRefreshCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Tự động tải lại dữ liệu định kỳ mỗi 30 giây
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      loadData(false);
    }, 30000);

    return () => clearInterval(refreshTimer);
  }, [loadData]);

  const activeOrder: WorkOrderTrackingDto | null = selectedOrder || (orders.length > 0 ? orders[0] : null);

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6">
      {/* Toast feedback */}
      {toastMsg && (
        <Toast
          message={toastMsg}
          type="success"
          onClose={() => setToastMsg('')}
        />
      )}

      {/* Breadcrumb & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {!isEmbedded && (
          <nav className="flex items-center space-x-2 text-on-surface-variant text-xs mb-1.5 font-medium">
            <Link href="/customer" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Theo dõi tiến độ</span>
          </nav>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Theo dõi tiến độ dịch vụ
          </h1>
        </div>

        {/* Sync Status & Refresh Button */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-on-surface-variant bg-surface-container-lowest px-3 py-2 rounded-lg border border-surface-container-highest shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tự động đồng bộ:</span>
            <span className="font-semibold text-primary font-mono">{refreshCountdown}s</span>
          </div>
          <button
            onClick={() => {
              setRefreshCountdown(30);
              loadData(true);
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-surface-container-highest rounded-lg text-sm font-semibold transition-all shadow-2xs active:scale-[0.98]"
            type="button"
          >
            <span className={`material-symbols-outlined text-[18px] text-primary ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* Multiple Vehicles Selector Tab (nếu có > 1 xe) */}
      {orders.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap mr-1">
            Chọn xe theo dõi:
          </span>
          {orders.map((ord) => {
            const isSelected = activeOrder?.id === ord.id;
            return (
              <button
                key={ord.id}
                onClick={() => dispatch(setSelectedOrder(ord))}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary-fixed text-primary border-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface-variant border-surface-container-highest hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">directions_car</span>
                <span>{ord.vehicle.licensePlate}</span>
                <span className="opacity-75">({ord.vehicle.make} {ord.vehicle.model})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {!activeOrder ? (
        /* Empty State */
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm my-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">directions_car</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-2">
            Không có xe nào đang thực hiện dịch vụ
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
            Hiện tại bạn không có phương tiện nào đang ở xưởng dịch vụ. Bạn có thể đặt lịch hẹn bảo dưỡng định kỳ hoặc sửa chữa ngay hôm nay.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/customer/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              Đặt lịch hẹn ngay
            </Link>
            <Link
              href="/customer/invoices"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-container-lowest border border-surface-container-highest text-on-surface hover:bg-surface-container-low rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Xem lịch sử hóa đơn
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ================= TOP SECTION: Vehicle Summary Card ================= */}
          <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest shadow-sm p-5 sm:p-6 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Cột 1: Thông tin xe & Biển số chuẩn Việt Nam */}
              <div className="lg:col-span-5 flex items-start space-x-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary-fixed/60 border border-primary-fixed flex-shrink-0 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[32px] sm:text-[36px]">directions_car</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {/* Authentic Vietnamese License Plate Badge */}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md border-2 border-on-surface bg-white text-on-surface font-mono font-extrabold text-sm tracking-wider shadow-2xs">
                      {activeOrder.vehicle.licensePlate}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 font-semibold">
                      Phiếu #{activeOrder.woNumber}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl text-on-surface font-bold leading-tight">
                    {activeOrder.vehicle.make} {activeOrder.vehicle.model} {activeOrder.vehicle.year ? `(${activeOrder.vehicle.year})` : ''}
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    Màu sắc: <span className="font-medium text-on-surface">{activeOrder.vehicle.color || 'Chưa cập nhật'}</span>
                    {activeOrder.vehicle.mileage ? (
                      <> • ODO: <span className="font-semibold text-on-surface font-mono">{activeOrder.vehicle.mileage.toLocaleString()} km</span></>
                    ) : null}
                  </p>
                </div>
              </div>

              {/* Cột 2: Cố vấn dịch vụ & Nội dung dịch vụ */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-surface-container-highest pt-4 lg:pt-0 lg:pl-6 space-y-2">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block">
                    Cố vấn dịch vụ phụ trách
                  </span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-sm font-bold text-on-surface">
                      {activeOrder.advisor.fullName}
                    </span>
                    {activeOrder.advisor.phone && (
                      <>
                        <span className="text-surface-container-highest">•</span>
                        <a
                          className="text-primary font-medium hover:underline inline-flex items-center text-xs"
                          href={`tel:${activeOrder.advisor.phone}`}
                        >
                          <span className="material-symbols-outlined text-[14px] mr-0.5">call</span>
                          {activeOrder.advisor.phone}
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block">
                    Gói dịch vụ đăng ký
                  </span>
                  <div className="text-xs sm:text-sm text-on-surface font-medium mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="truncate">
                      {activeOrder.services.map((s) => s.name).join(' • ') || 'Đang cập nhật'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cột 3: Trạng thái & Hộp dự kiến hoàn thành */}
              <div className="lg:col-span-3 bg-gradient-to-br from-blue-50/80 to-white rounded-xl border border-blue-200 p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>Tiến độ tổng quát</span>
                  </div>
                  <div className="text-xl sm:text-2xl text-on-surface font-extrabold tracking-tight mt-0.5">
                    {activeOrder.progressPercent}%
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Giai đoạn: <span className="font-semibold text-primary">{activeOrder.steps[activeOrder.currentStep - 1]?.title}</span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">
                    {activeOrder.currentStep === 4 ? 'task_alt' : 'hourglass_top'}
                  </span>
                </div>
              </div>

            </div>
          </section>

          {/* ================= QUOTATION ACTION BANNER (Báo giá dịch vụ) ================= */}
          {activeOrder.activeQuotation && (
            <section className="animate-fade-in">
              {activeOrder.activeQuotation.status === 'SENT' || activeOrder.status === 'PENDING_APPROVAL' ? (
                <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-amber-400 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Decorative background circle */}
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

                  <div className="flex items-start space-x-3.5 z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border border-white/30 text-white">
                      <span className="material-symbols-outlined text-[28px] animate-bounce">
                        request_quote
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide bg-white text-amber-800 shadow-2xs">
                          Cần Quý khách xác nhận
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-100">
                          #{activeOrder.activeQuotation.quotationNumber} (v{activeOrder.activeQuotation.version})
                        </span>
                      </div>
                      <h3 className="text-lg font-bold leading-tight">
                        Bảng báo giá dịch vụ đã được gửi & đang chờ Quý khách phê duyệt
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                        Dự toán tổng chi phí: <strong className="text-white font-mono text-base">{activeOrder.activeQuotation.grandTotal.toLocaleString()} đ</strong> (Chính sách 0% thuế VAT). Quý khách vui lòng kiểm tra và duyệt để xưởng bắt đầu thi công.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 z-10">
                    <button
                      type="button"
                      onClick={() => setIsQuotationModalOpen(true)}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-amber-900 font-extrabold text-sm hover:bg-amber-50 active:scale-[0.98] transition-all shadow-lg"
                    >
                      <span className="material-symbols-outlined text-[20px] text-amber-600">
                        visibility
                      </span>
                      <span>Xem chi tiết & Phê duyệt</span>
                    </button>
                  </div>
                </div>
              ) : activeOrder.activeQuotation.status === 'APPROVED' ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">check_circle</span>
                    </div>
                    <div>
                      <p className="font-bold">
                        Báo giá #{activeOrder.activeQuotation.quotationNumber} đã được phê duyệt
                      </p>
                      <p className="text-emerald-700 text-xs mt-0.5">
                        Tổng thanh toán dự kiến: <strong className="font-mono">{activeOrder.activeQuotation.grandTotal.toLocaleString()} đ</strong>. Đội ngũ kỹ thuật đang tiếp tục thực hiện theo kế hoạch.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsQuotationModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs transition-colors shrink-0 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt</span>
                    Xem lại báo giá đã duyệt
                  </button>
                </div>
              ) : activeOrder.activeQuotation.status === 'REJECTED' ? (
                (() => {
                  let isCancel = false;
                  let rejectNote = activeOrder.activeQuotation.rejectReason || '';
                  if (activeOrder.activeQuotation.rejectDetails) {
                    isCancel = activeOrder.activeQuotation.rejectDetails.type === 'CANCEL';
                    rejectNote = activeOrder.activeQuotation.rejectDetails.reason || rejectNote;
                  } else if (activeOrder.activeQuotation.rejectReason) {
                    try {
                      const p = JSON.parse(activeOrder.activeQuotation.rejectReason);
                      if (p?.type === 'CANCEL') isCancel = true;
                      if (p?.reason) rejectNote = p.reason;
                    } catch {
                      // plain string
                    }
                  }

                  return isCancel ? (
                    <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-rose-950 shadow-2xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">directions_car</span>
                        </div>
                        <div>
                          <p className="font-bold text-rose-900">
                            Quý khách đã từ chối dịch vụ & Yêu cầu nhận lại xe
                          </p>
                          <p className="text-rose-700 text-xs mt-0.5">
                            Lý do: <i>"{rejectNote}"</i>. Cố vấn dịch vụ đang hoàn tất thủ tục xuất trả xe tại sảnh tiếp nhận.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsQuotationModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 font-semibold text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        Xem lại phản hồi
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-950 shadow-2xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">edit_note</span>
                        </div>
                        <div>
                          <p className="font-bold text-amber-900">
                            Quý khách đã yêu cầu điều chỉnh báo giá #{activeOrder.activeQuotation.quotationNumber}
                          </p>
                          <p className="text-amber-800 text-xs mt-0.5">
                            Yêu cầu: <i>"{rejectNote}"</i>. Cố vấn đang điều chỉnh và sẽ gửi phương án mới sớm nhất.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsQuotationModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        Xem chi tiết phản hồi
                      </button>
                    </div>
                  );
                })()
              ) : null}
            </section>
          )}

          {/* ================= BILLING & DELIVERY STATUS BANNER (Thanh toán & Bàn giao xe) ================= */}
          {['RELEASED', 'CLOSED'].includes(activeOrder.status) ? (
            <section className="animate-fade-in space-y-4">
              <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-500 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border border-white/30 text-white">
                    <span className="material-symbols-outlined text-[28px]">
                      verified
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide bg-white text-emerald-900 shadow-2xs">
                        Đã bàn giao xe
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-200">
                        #{activeOrder.woNumber}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight">
                      Phương tiện đã hoàn tất nghiệm thu & xuất xưởng thành công!
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                      Cố vấn dịch vụ <strong>{activeOrder.advisor.fullName}</strong> đã bàn giao phương tiện {activeOrder.vehicle.licensePlate} cho Quý khách. Chân thành cảm ơn Quý khách đã tin tưởng sử dụng dịch vụ tại Car Service Center!
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0 z-10">
                  <button
                    type="button"
                    onClick={handleDownloadHandoverPdf}
                    disabled={downloadingHandoverPdf}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs transition-colors shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {downloadingHandoverPdf ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin"></span>
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span>Tải Biên bản bàn giao (PDF)</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/customer/invoices"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-400/40 font-bold text-xs transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    Xem hóa đơn & biên lai
                  </Link>
                </div>
              </div>

              {/* Khảo sát hài lòng CSAT 5 sao */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-highest shadow-xs">
                {csatSubmitted ? (
                  <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300 py-1">
                    <span className="material-symbols-outlined text-[24px]">favorite</span>
                    <div>
                      <h4 className="font-bold text-sm">Cảm ơn Quý khách đã gửi đánh giá!</h4>
                      <p className="text-xs text-on-surface-variant">Phản hồi của Quý khách giúp trung tâm không ngừng nâng cao chất lượng dịch vụ.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-500 text-[18px]">hotel_class</span>
                          Đánh giá chất lượng dịch vụ lần này
                        </h4>
                        <p className="text-xs text-on-surface-variant">Hãy cho chúng tôi biết mức độ hài lòng của Quý khách với dịch vụ bảo dưỡng & sửa chữa vừa qua.</p>
                      </div>

                      {/* Star Rating Buttons */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setCsatRating(star)}
                            className="p-1 text-amber-500 hover:scale-125 transition-transform cursor-pointer"
                            title={`${star} sao`}
                          >
                            <span className="material-symbols-outlined text-[24px]">
                              {star <= csatRating ? 'star' : 'star_outline'}
                            </span>
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300 ml-1">
                          {csatRating === 5 ? 'Tuyệt vời (5/5)' : csatRating === 4 ? 'Hài lòng (4/5)' : `${csatRating}/5 sao`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        value={csatFeedback}
                        onChange={(e) => setCsatFeedback(e.target.value)}
                        placeholder="Nhập thêm nhận xét của Quý khách về Cố vấn, Kỹ thuật viên hoặc quy trình tiếp đón..."
                        className="flex-1 px-3.5 py-2 bg-surface-container-low rounded-xl border border-surface-container-highest text-xs text-on-surface focus:border-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCsatSubmitted(true);
                          setToastMsg('Cảm ơn Quý khách đã gửi đánh giá trải nghiệm dịch vụ!');
                        }}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        Gửi đánh giá
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : activeOrder.status === 'FINANCIAL_CLEARED' ? (
            <section className="animate-fade-in">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-400 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border border-white/30 text-white">
                    <span className="material-symbols-outlined text-[28px]">
                      verified
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide bg-white text-emerald-800 shadow-2xs">
                        Đã thanh toán 100%
                      </span>
                      {activeOrder.invoice && (
                        <span className="text-xs font-mono font-bold text-emerald-100">
                          #{activeOrder.invoice.invoiceNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold leading-tight">
                      Quý khách đã thanh toán thành công • Xe đã sẵn sàng bàn giao!
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                      Hệ thống đã xác nhận quyết toán tài chính. Cố vấn dịch vụ <strong>{activeOrder.advisor.fullName}</strong> đang chuẩn bị xe tại sảnh tiếp nhận để bàn giao cho Quý khách.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 z-10">
                  <Link
                    href="/customer/invoices"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    Xem hóa đơn & Biên lai
                  </Link>
                </div>
              </div>
            </section>
          ) : activeOrder.status === 'BILLING_REQUESTED' ? (
            <section className="animate-fade-in">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-400 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border border-white/30 text-white">
                    <span className="material-symbols-outlined text-[28px] animate-pulse">
                      payments
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide bg-amber-400 text-amber-950 shadow-2xs">
                        {activeOrder.invoice ? 'Chờ thanh toán' : 'Đang lập hóa đơn'}
                      </span>
                      {activeOrder.invoice && (
                        <span className="text-xs font-mono font-bold text-blue-100">
                          #{activeOrder.invoice.invoiceNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold leading-tight">
                      {activeOrder.invoice
                        ? 'Xe đã kiểm định đạt chuẩn 100% • Sẵn sàng thanh toán nhận xe'
                        : 'Xe đã kiểm định đạt chuẩn 100% • Quầy thu ngân đang xuất hóa đơn'}
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                      {activeOrder.invoice ? (
                        <>Tổng chi phí thanh toán: <strong className="text-white font-mono text-base">{activeOrder.invoice.totalAmount.toLocaleString()} đ</strong>. Quý khách có thể thanh toán trực tuyến ngay để hoàn tất thủ tục.</>
                      ) : (
                        'Đã hoàn tất kiểm định chất lượng KCS 100%. Quầy thu ngân đang chuẩn bị xuất hóa đơn thanh toán cho Quý khách.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 z-10">
                  {activeOrder.invoice ? (
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs transition-colors shadow-sm cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">credit_card</span>
                      Thanh toán online ngay ({activeOrder.invoice.totalAmount.toLocaleString()} đ)
                    </button>
                  ) : (
                    <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 text-white font-bold text-xs border border-white/30 backdrop-blur">
                      <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                      Đang chuẩn bị hóa đơn...
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {/* ================= MIDDLE SECTION: Stepper Timeline & Live Cam ================= */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left: 4-Step Stepper Timeline (xl:col-span-8) */}
            <div className="xl:col-span-8 bg-surface-container-lowest rounded-2xl border border-surface-container-highest shadow-sm p-5 sm:p-6 flex flex-col justify-between">
              
              {/* Stepper Header */}
              <div className="flex items-center justify-between pb-4 border-b border-surface-container-highest mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-on-surface">
                    Tiến trình 4 bước kỹ thuật tiêu chuẩn
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Quy trình kiểm định và thực hiện chuẩn hóa tại trung tâm
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant hidden sm:inline">Tổng hoàn thành:</span>
                  <span className="text-base font-bold text-primary font-mono">{activeOrder.progressPercent}%</span>
                </div>
              </div>

              {/* Stepper List */}
              <div className="relative space-y-6 sm:space-y-7 pl-2 sm:pl-4">
                {/* Continuous vertical timeline connector line */}
                <div className="absolute top-4 left-[21px] sm:left-[29px] bottom-6 w-0.5 bg-surface-container-highest -z-0"></div>

                {activeOrder.steps.map((step) => {
                  const isCompleted = step.status === 'COMPLETED';
                  const isInProgress = step.status === 'IN_PROGRESS';

                  return (
                    <div key={step.stepIndex} className="relative flex items-start space-x-3 sm:space-x-4 z-10">
                      
                      {/* Icon Node Indicator */}
                      <div className="relative flex-shrink-0">
                        {isCompleted ? (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm ring-4 ring-white">
                            <span className="material-symbols-outlined text-[20px] font-bold">check</span>
                          </div>
                        ) : isInProgress ? (
                          <>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md ring-4 ring-white z-10 relative">
                              <span className="material-symbols-outlined text-[20px] animate-spin" style={{ animationDuration: '4s' }}>
                                build
                              </span>
                            </div>
                            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></span>
                          </>
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center ring-4 ring-white">
                            <span className="text-xs font-bold font-mono">{step.stepIndex}</span>
                          </div>
                        )}
                      </div>

                      {/* Step Content Box */}
                      <div
                        className={`flex-1 rounded-xl p-4 border transition-all ${
                          isInProgress
                            ? 'bg-white border-2 border-primary shadow-sm'
                            : isCompleted
                            ? 'bg-surface-container-low/70 border-surface-container-highest'
                            : 'bg-surface-container-lowest border-surface-container-highest opacity-70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-bold text-on-surface">
                              Bước {step.stepIndex}: {step.title}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isInProgress
                                  ? 'bg-blue-100 text-primary border-blue-300'
                                  : 'bg-surface-container text-on-surface-variant border-surface-container-highest'
                              }`}
                            >
                              {isCompleted ? 'Hoàn thành' : isInProgress ? 'Đang thực hiện' : 'Chờ thực hiện'}
                            </span>
                          </div>
                          {step.time && (
                            <div className="text-xs text-on-surface-variant font-mono">
                              {step.time}
                            </div>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-on-surface-variant">
                          {step.description}
                        </p>

                        {/* Nút xem chi tiết tiếp nhận xe ở Bước 1 */}
                        {step.stepIndex === 1 && activeOrder.checkIn && (
                          <div className="mt-3 pt-3 border-t border-surface-container-high/60 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                              <span className="material-symbols-outlined text-[16px] text-primary">fact_check</span>
                              Biên bản kiểm tra & hiện trạng xe lúc nhận
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsCheckInModalOpen(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors border border-primary/20 shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              Xem biên bản tiếp nhận
                            </button>
                          </div>
                        )}

                        {/* Nút xem chứng nhận nghiệm thu KCS ở Bước 3 */}
                        {step.stepIndex === 3 && activeOrder.qcReport?.hasQc && (
                          <div className="mt-3 pt-3 border-t border-surface-container-high/60 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                              <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                              Biên bản nghiệm thu KCS ({activeOrder.qcReport.passedItems}/{activeOrder.qcReport.totalItems} tiêu chí Đạt)
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsQCModalOpen(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">verified</span>
                              Xem chứng nhận KCS
                            </button>
                          </div>
                        )}

                        {/* Chi tiết dịch vụ nếu ở Bước 2 */}
                        {step.stepIndex === 2 && activeOrder.services.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-surface-container-high space-y-2">
                            <p className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                              Các hạng mục trong phiếu:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {activeOrder.services.map((srv) => (
                                <div
                                  key={srv.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container-highest text-xs"
                                >
                                  <span className="font-medium text-on-surface truncate mr-2">
                                    {srv.name}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 flex items-center gap-0.5 ${
                                      srv.status === 'PASSED'
                                        ? 'bg-purple-100 text-purple-800'
                                        : srv.status === 'COMPLETED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : srv.status === 'REWORK'
                                        ? 'bg-rose-100 text-rose-800'
                                        : srv.status === 'IN_PROGRESS'
                                        ? 'bg-blue-100 text-primary animate-pulse'
                                        : 'bg-surface-container text-on-surface-variant'
                                    }`}
                                  >
                                    {srv.status === 'PASSED' && (
                                      <span className="material-symbols-outlined text-[11px]">verified</span>
                                    )}
                                    <span>
                                      {srv.status === 'PASSED'
                                        ? 'Đạt KCS'
                                        : srv.status === 'COMPLETED'
                                        ? 'Xong'
                                        : srv.status === 'REWORK'
                                        ? 'Hiệu chỉnh'
                                        : srv.status === 'IN_PROGRESS'
                                        ? 'Đang làm'
                                        : 'Chờ'}
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right: Camera Khoang Kỹ Thuật & Cam Kết (xl:col-span-4) */}
            <div className="xl:col-span-4 space-y-5">
              
              {/* Live Cam Card */}
              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest shadow-sm overflow-hidden flex flex-col">
                <div className="p-3.5 border-b border-surface-container-highest flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
                    <span className="text-xs sm:text-sm font-bold text-on-surface">Camera Khoang Dịch Vụ</span>
                  </div>
                  <span className="font-mono text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                    1080p HD
                  </span>
                </div>

                {/* Simulation Feed View */}
                <div className="relative bg-slate-950 aspect-video w-full overflow-hidden flex items-center justify-center group">
                  {/* Background Mockup bay pattern */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 z-0"></div>
                  
                  {/* Decorative bay mechanic illustration */}
                  <div className="text-center z-10 p-4">
                    <span className="material-symbols-outlined text-[48px] text-primary-fixed opacity-70 mb-1">
                      videocam
                    </span>
                    <p className="text-white text-xs font-semibold">Góc quay khoang tiếp nhận & kỹ thuật</p>
                    <p className="text-slate-400 text-[11px] font-mono mt-0.5">Xe: {activeOrder.vehicle.licensePlate}</p>
                  </div>

                  {/* Top Overlay Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center space-x-2 z-10">
                    <div className="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-white font-mono text-[10px] flex items-center gap-1 border border-white/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                      <span>REC • TRỰC TIẾP</span>
                    </div>
                    <div className="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-white font-mono text-[10px] border border-white/20">
                      CAM_BAY_04
                    </div>
                  </div>

                  {/* Bottom Time Overlay */}
                  <div className="absolute bottom-2 left-2.5 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-white font-mono text-[10px] z-10">
                    {currentTime || 'Đang kết nối...'}
                  </div>
                </div>

                {/* Description */}
                <div className="p-3.5 bg-surface-container-lowest text-xs text-on-surface-variant space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Đường truyền camera:</span>
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">wifi</span> Ổn định
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Khách hàng có thể an tâm theo dõi quy trình phục vụ minh bạch tại trung tâm.
                  </p>
                </div>
              </div>

              {/* Genuine Parts Guarantee Tile */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 rounded-2xl border border-blue-200 p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">verified_user</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-on-surface">Cam kết phụ tùng chính hãng 100%</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                      Mọi linh kiện thay thế đều có tem kiểm định xuất xứ rõ ràng và bảo hành tiêu chuẩn từ 12 tháng.
                    </p>
                  </div>
                </div>
              </div>

              {/* View Invoice CTA Quick Link */}
              {activeOrder.invoice && (
                <div className={`rounded-2xl border p-4 shadow-2xs transition-all ${
                  activeOrder.invoice.status === 'PAID'
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-surface-container-lowest border-surface-container-highest'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-on-surface-variant font-medium">Hóa đơn dịch vụ:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      activeOrder.invoice.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-error border-red-300'
                    }`}>
                      {activeOrder.invoice.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-semibold text-on-surface">
                        #{activeOrder.invoice.invoiceNumber}
                      </p>
                      <p className="text-base font-bold font-mono text-on-surface mt-0.5">
                        {activeOrder.invoice.totalAmount.toLocaleString()} đ
                      </p>
                    </div>
                    {activeOrder.invoice.status !== 'PAID' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">credit_card</span>
                          Thanh toán
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(activeOrder.invoice!.id, activeOrder.invoice?.invoiceNumber)}
                          disabled={downloadingPdfId === activeOrder.invoice?.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-medium transition-all cursor-pointer"
                          title="Tải hóa đơn PDF"
                        >
                          {downloadingPdfId === activeOrder.invoice?.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[16px] text-primary">download</span>
                          )}
                          PDF
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(activeOrder.invoice!.id, activeOrder.invoice?.invoiceNumber)}
                          disabled={downloadingPdfId === activeOrder.invoice?.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark transition-all shadow-2xs cursor-pointer"
                          title="Tải biên lai PDF"
                        >
                          {downloadingPdfId === activeOrder.invoice?.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[16px]">download</span>
                          )}
                          Tải PDF
                        </button>
                        <Link
                          href="/customer/invoices"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-medium transition-all"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* ================= BOTTOM SECTION: Mechanic Bio & Advisor Notes ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Thợ máy phụ trách (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl border border-surface-container-highest shadow-sm p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-highest mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">engineering</span>
                    <h3 className="text-base font-bold text-on-surface">Kỹ thuật viên phụ trách</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200/80 text-[11px] font-semibold">
                    {activeOrder.mechanic ? 'KTV Chuyên trách' : 'Tổ dịch vụ kỹ thuật'}
                  </span>
                </div>

                {/* Mechanic Profile */}
                <div className="flex items-start space-x-3.5 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    <span className="material-symbols-outlined text-[30px]">engineering</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-on-surface truncate">
                      {activeOrder.mechanic?.fullName || 'Tổ kỹ thuật Car Service Center'}
                    </h4>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      {activeOrder.mechanic?.position || 'Chuyên viên sửa chữa ô tô'}
                    </p>
                    
                    {/* Skills or Work Summary */}
                    {activeOrder.mechanic?.skills && activeOrder.mechanic.skills.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {activeOrder.mechanic.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-medium border border-surface-container-highest"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1.5 font-medium">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <span className="material-symbols-outlined text-[15px]">verified</span>
                          Chứng chỉ tiêu chuẩn xưởng
                        </span>
                        <span>•</span>
                        <span>{activeOrder.services.length} hạng mục phụ trách</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Commitments */}
                <div className="space-y-2 bg-surface-container-low/80 p-3.5 rounded-xl border border-surface-container-highest text-xs text-on-surface">
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 mr-2 shrink-0 mt-0.5">check_circle</span>
                    <span>Tuân thủ quy trình kiểm định an toàn và nghiệm thu KCS chuẩn xưởng</span>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 mr-2 shrink-0 mt-0.5">check_circle</span>
                    <span>Chẩn đoán và đo đạc kỹ thuật bằng thiết bị chuyên dụng chuẩn OBD-II</span>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 mr-2 shrink-0 mt-0.5">check_circle</span>
                    <span>Bàn giao phụ tùng cũ thay ra kèm phiếu xuất kho để khách hàng kiểm tra</span>
                  </div>
                </div>
              </div>

              {/* Call Hotline button */}
              <div className="pt-4 mt-2">
                <a
                  className="w-full inline-flex items-center justify-center py-2.5 px-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-surface-container-highest text-xs font-semibold transition-all shadow-2xs hover:border-primary/40 group"
                  href="tel:19008888"
                >
                  <span className="material-symbols-outlined text-[18px] mr-1.5 text-primary group-hover:scale-110 transition-transform">headset_mic</span>
                  <span>Tổng đài hỗ trợ kỹ thuật xưởng:</span>
                  <strong className="ml-1 text-primary">1900 8888</strong>
                </a>
              </div>
            </div>

            {/* Right: Ghi chú & Các vấn đề phát hiện công khai từ Cố vấn (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-surface-container-highest shadow-sm p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-highest mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">assignment_ind</span>
                    <h3 className="text-base font-bold text-on-surface">Ghi chú & Tiếp nhận từ Cố vấn</h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
                    Phiếu #{activeOrder.woNumber}
                  </span>
                </div>

                {/* Speech Bubble / Advisor Notes */}
                <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-4 sm:p-5 mb-4 space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-blue-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        {activeOrder.advisor.fullName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-on-surface block">
                          Cố vấn: {activeOrder.advisor.fullName}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          Phụ trách tiếp nhận & điều phối kỹ thuật
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white text-primary border border-blue-200 text-[11px] font-semibold shadow-2xs">
                      Ghi nhận kỹ thuật
                    </span>
                  </div>

                  {/* Customer Initial Complaint (nếu có) */}
                  {(() => {
                    const complaintText = parseComplaintText(activeOrder.checkIn?.complaint);
                    if (!complaintText) return null;
                    return (
                      <div className="p-3 bg-white rounded-xl border border-blue-100/80 text-xs text-on-surface shadow-2xs">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[17px] text-primary shrink-0 mt-0.5">
                            description
                          </span>
                          <div className="flex-1">
                            <span className="font-semibold text-on-surface block mb-0.5">
                              Yêu cầu của khách hàng lúc tiếp nhận:
                            </span>
                            <p className="text-on-surface-variant leading-relaxed">
                              {complaintText}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Public Findings List */}
                  {activeOrder.findings.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-amber-600">checklist</span>
                        Các lưu ý và phát hiện kỹ thuật trong quá trình kiểm tra xe:
                      </p>
                      {activeOrder.findings.map((f) => {
                        const partTitle = f.partName?.trim();
                        const descText = f.description?.trim();
                        const displayTitle = partTitle || descText || 'Hạng mục kiểm tra xe';
                        const detailText = (partTitle && descText && descText !== partTitle) ? descText : null;
                        const isUrgent = f.severity === 'HIGH' || f.severity === 'CRITICAL';

                        return (
                          <div
                            key={f.id}
                            className="p-3 bg-white rounded-xl border border-blue-100 text-xs text-on-surface space-y-1 shadow-2xs"
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                                  isUrgent ? 'text-error' : 'text-amber-600'
                                }`}
                              >
                                {isUrgent ? 'error' : 'warning'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-on-surface">
                                    {displayTitle}
                                  </p>
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                      isUrgent
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    {isUrgent ? 'Cần xử lý' : 'Lưu ý theo dõi'}
                                  </span>
                                </div>
                                {detailText && (
                                  <p className="text-on-surface-variant text-[11px] mt-0.5">
                                    {detailText}
                                  </p>
                                )}
                                {f.recommendation && (
                                  <p className="text-primary text-[11px] font-medium mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                                    <span>Khuyến nghị: {f.recommendation}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-blue-100 text-xs text-on-surface shadow-2xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                      <span>Hiện trạng kiểm tra ban đầu ổn định, không ghi nhận hư hỏng bất thường ngoài danh mục đã đăng ký.</span>
                    </div>
                  )}

                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Mọi phát sinh kỹ thuật đều được cố vấn thông báo chi tiết và chỉ triển khai khi có sự đồng ý của quý khách trước khi tiến hành.
                  </p>

                  {/* Digital Signature */}
                  <div className="pt-2.5 border-t border-blue-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-primary">draw</span>
                      <span>Xác nhận: <strong className="text-on-surface">{activeOrder.advisor.fullName}</strong></span>
                    </div>
                    <span className="inline-flex items-center text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      <span className="material-symbols-outlined text-[12px] mr-0.5">verified</span> Đã xác nhận tiếp nhận
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div>
                  {activeOrder.checkIn ? (
                    <button
                      onClick={() => setIsCheckInModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">assignment</span>
                      Xem biên bản tiếp nhận & ngoại thất
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-lg text-xs font-medium">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                      Hồ sơ kỹ thuật đã đồng bộ
                    </div>
                  )}
                </div>

                <div>
                  {activeOrder.advisor.phone ? (
                    <a
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white hover:bg-primary-dark rounded-lg text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                      href={`tel:${activeOrder.advisor.phone}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">phone_in_talk</span>
                      Gọi Cố vấn: {activeOrder.advisor.phone}
                    </a>
                  ) : (
                    <a
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white hover:bg-primary-dark rounded-lg text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                      href="tel:19008888"
                    >
                      <span className="material-symbols-outlined text-[16px]">phone_in_talk</span>
                      Hotline: 1900 8888
                    </a>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Customer Quotation Detail Modal */}
          {activeOrder.activeQuotation && (
            <CustomerQuotationModal
              isOpen={isQuotationModalOpen}
              onClose={() => setIsQuotationModalOpen(false)}
              quotation={activeOrder.activeQuotation as any}
              allQuotations={activeOrder.quotations as any}
              cumulativeSummary={activeOrder.cumulativeSummary}
              advisorName={activeOrder.advisor.fullName}
              vehiclePlate={activeOrder.vehicle.licensePlate}
              vehicleModel={`${activeOrder.vehicle.make} ${activeOrder.vehicle.model}`}
              onActionSuccess={(msg) => {
                setToastMsg(msg);
                loadData(true);
              }}
            />
          )}

          {/* Customer CheckIn Detail Modal */}
          {activeOrder.checkIn && (
            <CustomerCheckInModal
              isOpen={isCheckInModalOpen}
              onClose={() => setIsCheckInModalOpen(false)}
              checkIn={activeOrder.checkIn}
              vehicle={activeOrder.vehicle}
              advisor={activeOrder.advisor}
              woNumber={activeOrder.woNumber}
            />
          )}

          {/* Customer QC Certificate Modal */}
          {activeOrder.qcReport && (
            <CustomerQCModal
              isOpen={isQCModalOpen}
              onClose={() => setIsQCModalOpen(false)}
              qcReport={activeOrder.qcReport}
              vehiclePlate={activeOrder.vehicle.licensePlate}
              vehicleModel={`${activeOrder.vehicle.make} ${activeOrder.vehicle.model}`}
              woNumber={activeOrder.woNumber}
            />
          )}

          {/* Customer Payment Modal */}
          {isPaymentModalOpen && activeOrder.invoice && (
            <CustomerPaymentModal
              isOpen={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
              invoice={{
                id: activeOrder.invoice.id,
                invoiceNumber: activeOrder.invoice.invoiceNumber,
                amountDue: activeOrder.invoice.amountDue || activeOrder.invoice.totalAmount,
                licensePlate: activeOrder.vehicle.licensePlate,
                vehicleName: `${activeOrder.vehicle.make} ${activeOrder.vehicle.model}`,
              }}
              onSuccess={() => {
                setToastMsg('Thanh toán thành công! Trạng thái xe đã chuyển sang Sẵn sàng bàn giao.');
                loadData(true);
                setTimeout(() => {
                  setIsPaymentModalOpen(false);
                }, 1200);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
