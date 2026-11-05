'use client';

import React, { useState } from 'react';
import { WorkOrder, downloadHandoverPdfBlob } from '@/lib/api/work-order.api';
import VehicleReturnModal from '../modals/VehicleReturnModal';
import StandardVehicleHandoverModal from '../modals/StandardVehicleHandoverModal';
import CloseWorkOrderModal from '../modals/CloseWorkOrderModal';
import toast from 'react-hot-toast';

interface TabReleaseProps {
  workOrder: WorkOrder;
  refetchWO: () => void;
  isReadOnly?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  ESTIMATING: 'Đang báo giá',
  WAITING_CUSTOMER: 'Chờ khách duyệt',
  APPROVED: 'Khách đã duyệt',
  IN_PROGRESS: 'Đang thi công',
  QC_IN_PROGRESS: 'Đang kiểm định KCS',
  BILLING_REQUESTED: 'Chờ thanh toán',
  FINANCIAL_CLEARED: 'Đã quyết toán tài chính',
  RELEASED: 'ĐÃ XUẤT XƯỞNG',
  CLOSED: 'ĐÃ ĐÓNG HỒ SƠ',
  CANCELLED: 'Đã hủy',
};

const FUEL_LABELS: Record<string, string> = {
  EMPTY: 'Bình cạn (E)',
  QUARTER: '1/4 bình',
  HALF: '1/2 bình',
  THREE_QUARTER: '3/4 bình',
  FULL: 'Đầy bình (F)',
};

export default function TabRelease({ workOrder, refetchWO, isReadOnly = false }: TabReleaseProps) {
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const isReleased = workOrder.status === 'RELEASED' || workOrder.status === 'CLOSED';
  const isBillingRequested = workOrder.status === 'BILLING_REQUESTED';
  const isFinancialCleared = workOrder.status === 'FINANCIAL_CLEARED';
  const releaseInfo = (workOrder as any).release;

  // Trích xuất metadata từ release_notes nếu là JSON
  let parsedNotes: any = null;
  if (releaseInfo?.release_notes) {
    try {
      if (releaseInfo.release_notes.startsWith('{')) {
        parsedNotes = JSON.parse(releaseInfo.release_notes);
      }
    } catch {
      parsedNotes = null;
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await downloadHandoverPdfBlob(workOrder.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bien_Ban_Ban_Giao_${workOrder.wo_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Đã tải xuống Biên bản bàn giao xe');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tải biên bản bàn giao PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & Chi tiết đã bàn giao */}
      {isReleased ? (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/25 border border-emerald-300 dark:border-emerald-800 space-y-5 shadow-xs">
            {/* Header hàng 1: Tiêu đề + Trạng thái tiếng Việt + Nút tải PDF */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200 dark:border-emerald-900/60">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[28px]">verified</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-100">
                      Phương tiện đã hoàn tất bàn giao & xuất xưởng
                    </h3>
                    <span className="text-xs px-3 py-0.5 rounded-full font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                      {STATUS_LABELS[workOrder.status] || workOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                    Hồ sơ phiếu công việc #{workOrder.wo_number} đã hoàn tất toàn bộ chu trình tiếp nhận, kỹ thuật và bàn giao.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Tải PDF & Đóng hồ sơ */}
              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {downloadingPdf ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang tạo PDF...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      <span>Tải Biên Bản Bàn Giao (PDF)</span>
                    </>
                  )}
                </button>

                {workOrder.status === 'RELEASED' && (
                  <button
                    type="button"
                    onClick={() => setIsCloseModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span>Đóng hồ sơ</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thanh thông báo trạng thái đóng hồ sơ / Lưu trữ gọn gàng */}
            {workOrder.status === 'RELEASED' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-amber-50/90 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-amber-950 dark:text-amber-200">
                  <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0">inventory_2</span>
                  <span>
                    Hồ sơ đang ở trạng thái <b>Xuất xưởng</b>. Bạn có thể <b>Đóng hồ sơ</b> để lưu trữ và chuyển vào Lịch sử sửa chữa của khách hàng.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>Đóng hồ sơ ngay</span>
                </button>
              </div>
            )}

            {workOrder.status === 'CLOSED' && (workOrder as any).closed_at && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-xl text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                <span className="material-symbols-outlined text-emerald-700 dark:text-emerald-400 text-[20px] shrink-0">verified_user</span>
                <div className="space-y-0.5">
                  <p className="font-bold">
                    Hồ sơ đã được đóng và lưu trữ vĩnh viễn lúc {new Date((workOrder as any).closed_at).toLocaleString('vi-VN')}
                    {(workOrder as any).close_type === 'AUTO' ? ' (Tự động sau bàn giao)' : ''}
                    {(workOrder as any).closed_by?.full_name ? ` bởi ${(workOrder as any).closed_by.full_name}` : ''}
                  </p>
                  {(workOrder as any).close_notes && (
                    <p className="text-xs text-emerald-800 dark:text-emerald-300/90 font-normal">
                      Ghi chú: &ldquo;{(workOrder as any).close_notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            )}

            {releaseInfo && (
              <div className="space-y-4">
                {/* 1. Bộ 3 thẻ Thông tin chung (Thời gian, Cố vấn, Trạng thái) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">schedule</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-on-surface-variant block font-medium">Thời gian xuất xưởng</span>
                      <span className="font-mono font-bold text-on-surface text-xs sm:text-sm">
                        {new Date(releaseInfo.released_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">person_check</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-on-surface-variant block font-medium">Cố vấn phụ trách giao xe</span>
                      <span className="font-bold text-on-surface text-xs sm:text-sm">
                        {releaseInfo.released_by?.full_name || workOrder.advisor?.full_name || 'Cố vấn dịch vụ'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">verified_user</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-on-surface-variant block font-medium">Xác nhận của khách hàng</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Đã ký nhận phương tiện
                      </span>
                    </div>
                  </div>
                </div>

                {parsedNotes ? (
                  <div className="space-y-3">
                    {/* 2. Lưới 4 thông số kỹ thuật (ODO, Xăng, Vệ sinh, Đồ cá nhân) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                          <span className="material-symbols-outlined text-[17px] text-emerald-600">speed</span>
                          <span>ODO xuất xưởng</span>
                        </div>
                        <div className="text-sm sm:text-base font-bold font-mono text-on-surface">
                          {parsedNotes.returnMileage ? `${Number(parsedNotes.returnMileage).toLocaleString('vi-VN')} km` : 'Theo xe'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                          <span className="material-symbols-outlined text-[17px] text-emerald-600">local_gas_station</span>
                          <span>Mức nhiên liệu</span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-on-surface">
                          {FUEL_LABELS[parsedNotes.returnFuel] || parsedNotes.returnFuel || '-'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                          <span className="material-symbols-outlined text-[17px] text-emerald-600">local_car_wash</span>
                          <span>Vệ sinh xe</span>
                        </div>
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <span className="material-symbols-outlined text-[13px]">check</span>
                            {parsedNotes.carWashCompleted !== false ? 'Đã rửa sạch' : 'Chưa rửa'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                          <span className="material-symbols-outlined text-[17px] text-emerald-600">inventory_2</span>
                          <span>Tài sản cá nhân</span>
                        </div>
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <span className="material-symbols-outlined text-[13px]">check</span>
                            {parsedNotes.belongingsReturned !== false ? 'Đã hoàn trả đủ' : 'Không có tài sản'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Phụ tùng cũ thay ra & Khuyến nghị */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">handyman</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <span className="text-on-surface-variant font-medium block">Phụ tùng cũ thay ra:</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700">
                            <span className="material-symbols-outlined text-[14px]">
                              {parsedNotes.oldPartsAction === 'DISPOSED_BY_GARAGE' ? 'delete_sweep' : 'shopping_bag'}
                            </span>
                            {parsedNotes.oldPartsAction === 'DISPOSED_BY_GARAGE'
                              ? 'Khách gửi xưởng tiêu hủy an toàn'
                              : 'Đã hoàn trả cho khách hàng mang về'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                        </div>
                        <div className="space-y-1 text-xs flex-1">
                          <span className="text-on-surface-variant font-medium block">Khuyến nghị & Dặn dò bảo dưỡng:</span>
                          <p className="text-on-surface font-medium italic">
                            {parsedNotes.notes || 'Phương tiện vận hành tốt, không có khuyến nghị thêm.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 4. Khung chữ ký số của khách hàng */}
                    {parsedNotes.customerSignature && (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-emerald-600 text-[18px]">draw</span>
                            Chữ ký điện tử của khách hàng
                          </span>
                          <p className="text-[11px] text-on-surface-variant">
                            Đã ký trực tiếp trên hệ thống xác nhận nhận xe và toàn bộ tài sản.
                          </p>
                        </div>
                        <div className="border border-outline-variant rounded-xl bg-surface-container-lowest p-2 self-start sm:self-auto flex items-center gap-2">
                          <img
                            src={parsedNotes.customerSignature}
                            alt="Chữ ký khách hàng"
                            className="h-12 max-w-[200px] object-contain"
                          />
                          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold border-l pl-2 border-outline-variant/60">
                            XÁC THỰC
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  releaseInfo.release_notes && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-surface-container-low border border-emerald-200/80 dark:border-emerald-900/60 text-xs">
                      <span className="text-on-surface-variant font-medium block mb-1">Ghi chú biên bản:</span>
                      <p className="italic text-on-surface">{releaseInfo.release_notes}</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Financial Gate status alert */}
          {isBillingRequested && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-xl">payments</span>
              </div>
              <div className="flex-1 text-xs">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                  Đang chờ thanh toán tại quầy thu ngân (Financial Gate)
                </h4>
                <p className="text-amber-800 dark:text-amber-300/90 mt-0.5">
                  Xe đã hoàn tất kiểm định chất lượng và đang ở hàng đợi thanh toán của Lễ tân / Thu ngân (Desk Staff). Cố vấn chỉ có thể bàn giao xe sau khi khách hàng hoàn tất thanh toán hóa đơn.
                </p>
              </div>
            </div>
          )}

          {isFinancialCleared && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-xl">task_alt</span>
              </div>
              <div className="flex-1 text-xs">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  Cổng tài chính đã thông suốt (Đã quyết toán tài chính)
                </h4>
                <p className="text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                  Khách hàng đã thanh toán 100% hóa đơn dịch vụ. Cố vấn tiến hành đối soát hiện trạng, phụ tùng thay ra và lập biên bản xuất trả phương tiện cho khách hàng.
                </p>
              </div>
            </div>
          )}

          {/* Khối Thao tác Bàn giao chính */}
          <div className="p-8 sm:p-12 text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest space-y-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
              isFinancialCleared ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-primary/10 text-primary'
            }`}>
              <span className="material-symbols-outlined text-[36px]">
                {isFinancialCleared ? 'key' : 'lock'}
              </span>
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold text-on-surface">Thủ Tục Nghiệm Thu & Bàn Giao Xe</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                {isFinancialCleared
                  ? 'Đối chiếu thông số ODO, xăng, tình trạng vệ sinh, tài sản và ký biên bản xuất xưởng.'
                  : isBillingRequested
                  ? 'Vui lòng chờ khách hàng hoàn tất thanh toán hóa đơn để mở thủ tục bàn giao.'
                  : 'Nghiệm thu, đối chiếu tài sản và lập thủ tục xuất trả xe.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {isFinancialCleared ? (
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setIsHandoverModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                  <span>Lập biên bản bàn giao xe</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isReadOnly || isBillingRequested}
                  onClick={() => setIsReturnModalOpen(true)}
                  title={isBillingRequested ? 'Vui lòng hoàn tất thanh toán hóa đơn trước khi xuất xe' : undefined}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">directions_car</span>
                  <span>Xuất trả xe (Khách hủy / không làm DV)</span>
                </button>
              )}

              {/* Tùy chọn phụ khi đã thanh toán nếu muốn xuất trả theo kiểu khác */}
              {isFinancialCleared && (
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                  <span>Xuất trả đặc biệt</span>
                </button>
              )}
            </div>

            {isBillingRequested && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                * Cổng bàn giao tạm khóa cho đến khi thu ngân xác nhận thanh toán (Financial Gate)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal Bàn giao xe chuẩn (Standard Handover) */}
      <StandardVehicleHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        workOrder={workOrder}
        refetchWO={refetchWO}
      />

      {/* Modal xuất trả xe khi hủy hoặc từ chối (Return Modal) */}
      <VehicleReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        workOrder={workOrder}
        refetchWO={refetchWO}
      />

      {/* Modal xác nhận đóng hồ sơ (Close Work Order Modal) */}
      <CloseWorkOrderModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        workOrder={workOrder}
        refetchWO={refetchWO}
      />
    </div>
  );
}
