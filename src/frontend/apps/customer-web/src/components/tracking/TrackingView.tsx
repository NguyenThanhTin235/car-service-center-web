'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMyTrackingOrders, setSelectedOrder, WorkOrderTrackingDto } from '@/store/slices/trackingSlice';
import Toast from '@/components/shared/Toast';
import CustomerQuotationModal from './CustomerQuotationModal';
import CustomerCheckInModal from './CustomerCheckInModal';

export default function TrackingView({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const dispatch = useAppDispatch();
  const { orders, selectedOrder, loading } = useAppSelector((state) => state.tracking);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState<boolean>(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);

  // Tải danh sách ban đầu
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
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                                      srv.status === 'COMPLETED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : srv.status === 'IN_PROGRESS'
                                        ? 'bg-blue-100 text-primary animate-pulse'
                                        : 'bg-surface-container text-on-surface-variant'
                                    }`}
                                  >
                                    {srv.status === 'COMPLETED' ? 'Xong' : srv.status === 'IN_PROGRESS' ? 'Đang làm' : 'Chờ'}
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
                <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-on-surface-variant">Hóa đơn dịch vụ:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      activeOrder.invoice.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-error'
                    }`}>
                      {activeOrder.invoice.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-semibold text-on-surface">
                        #{activeOrder.invoice.invoiceNumber}
                      </p>
                      <p className="text-base font-bold text-on-surface mt-0.5">
                        {activeOrder.invoice.totalAmount.toLocaleString()} đ
                      </p>
                    </div>
                    <Link
                      href="/customer/invoices"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                      Xem hóa đơn
                    </Link>
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
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                    Đội ngũ kỹ thuật
                  </span>
                </div>

                {/* Mechanic Profile */}
                <div className="flex items-start space-x-3.5 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary font-bold text-lg ring-2 ring-primary/20 shrink-0">
                    <span className="material-symbols-outlined text-[32px]">person_apron</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-on-surface">
                      {activeOrder.mechanic?.fullName || 'Tổ kỹ thuật Car Service Center'}
                    </h4>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      {activeOrder.mechanic?.position || 'Kỹ thuật viên chính'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1 font-medium">
                      <span className="flex items-center gap-1 text-amber-600">
                        <span className="material-symbols-outlined text-[14px]">star</span>
                        Đánh giá 4.9/5.0
                      </span>
                      <span>•</span>
                      <span>Quy chuẩn 5 sao</span>
                    </div>
                  </div>
                </div>

                {/* Mechanic Skills / Commitments */}
                <div className="space-y-1.5 bg-surface-container-low p-3.5 rounded-xl border border-surface-container-highest text-xs text-on-surface">
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 mr-2 shrink-0">check_circle</span>
                    <span>Tuân thủ quy trình kiểm định an toàn nghiêm ngặt</span>
                  </div>
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 mr-2 shrink-0">check_circle</span>
                    <span>Sử dụng trang thiết bị đo đạc điện tử hiện đại</span>
                  </div>
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 mr-2 shrink-0">check_circle</span>
                    <span>Bàn giao phụ tùng cũ thay ra cho khách hàng kiểm tra</span>
                  </div>
                </div>
              </div>

              {/* Call Hotline button */}
              <div className="pt-4">
                <a
                  className="w-full inline-flex items-center justify-center py-2 px-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-surface-container-highest text-xs font-semibold transition-colors shadow-2xs"
                  href="tel:19006868"
                >
                  <span className="material-symbols-outlined text-[18px] mr-1.5 text-primary">support_agent</span>
                  Liên hệ hotline hỗ trợ xưởng: 1900 6868
                </a>
              </div>
            </div>

            {/* Right: Ghi chú & Các vấn đề phát hiện công khai từ Cố vấn (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-surface-container-highest shadow-sm p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-highest mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">chat</span>
                    <h3 className="text-base font-bold text-on-surface">Ghi chú từ Cố vấn dịch vụ</h3>
                  </div>
                  <span className="text-xs font-mono text-on-surface-variant">
                    Phiếu #{activeOrder.woNumber}
                  </span>
                </div>

                {/* Speech Bubble / Advisor Notes */}
                <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 sm:p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                        {activeOrder.advisor.fullName.charAt(0)}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-on-surface">
                        Cố vấn: {activeOrder.advisor.fullName}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white text-primary border border-blue-200 text-[11px] font-semibold">
                      Ghi nhận kỹ thuật
                    </span>
                  </div>

                  {/* Public Findings List */}
                  {activeOrder.findings.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      <p className="text-xs font-semibold text-on-surface">
                        Các lưu ý và phát hiện kỹ thuật trong quá trình kiểm tra xe:
                      </p>
                      {activeOrder.findings.map((f) => (
                        <div
                          key={f.id}
                          className="p-3 bg-white rounded-xl border border-blue-100 text-xs text-on-surface space-y-1 shadow-2xs"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`material-symbols-outlined text-[18px] shrink-0 ${
                                f.severity === 'HIGH' || f.severity === 'CRITICAL'
                                  ? 'text-error'
                                  : 'text-amber-600'
                              }`}
                            >
                              warning
                            </span>
                            <div>
                              <p className="font-semibold text-on-surface">
                                {f.partName ? `${f.partName}: ` : ''}{f.description}
                              </p>
                              {f.recommendation && (
                                <p className="text-on-surface-variant mt-0.5">
                                  Khuyến nghị: {f.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-blue-100 text-xs text-on-surface shadow-2xs mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                      <span>Hiện trạng kiểm tra ban đầu tốt, không ghi nhận hư hỏng bất thường ngoài danh mục đã đăng ký.</span>
                    </div>
                  )}

                  <p className="text-xs text-on-surface-variant">
                    Mọi phát sinh kỹ thuật đều được cố vấn thông báo và xin ý kiến phê duyệt của quý khách trước khi tiến hành.
                  </p>

                  {/* Digital Signature */}
                  <div className="mt-3 pt-2.5 border-t border-blue-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-primary">draw</span>
                      <span>Xác nhận: <strong className="text-on-surface">{activeOrder.advisor.fullName}</strong></span>
                    </div>
                    <span className="inline-flex items-center text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <span className="material-symbols-outlined text-[12px] mr-0.5">verified</span> Hợp lệ
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setToastMsg('Cảm ơn bạn! Đã ghi nhận bạn đã xem thông tin tiến độ.')}
                    className="inline-flex items-center px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-semibold transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1">thumb_up</span>
                    Đã nhận thông tin
                  </button>
                </div>
                {activeOrder.advisor.phone && (
                  <a
                    className="inline-flex items-center text-primary text-xs font-semibold hover:underline"
                    href={`tel:${activeOrder.advisor.phone}`}
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1">phone_in_talk</span>
                    Gọi Cố vấn: {activeOrder.advisor.phone}
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* Customer Quotation Detail Modal */}
          {activeOrder.activeQuotation && (
            <CustomerQuotationModal
              isOpen={isQuotationModalOpen}
              onClose={() => setIsQuotationModalOpen(false)}
              quotation={activeOrder.activeQuotation as any}
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
        </>
      )}
    </div>
  );
}
