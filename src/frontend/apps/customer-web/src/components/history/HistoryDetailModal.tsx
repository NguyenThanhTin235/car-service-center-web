'use client';

import React from 'react';
import { RootState } from '@/store';
import { RepairHistoryItem } from '@/store/slices/historySlice';
import { formatVnd, parseComplaintText, parseSafeText } from '@/utils/customerHelpers';

const DEFAULT_COMPLAINT_FALLBACK = 'Kiểm tra bảo dưỡng định kỳ tổng quát phương tiện';

interface HistoryDetailModalProps {
  selected: RepairHistoryItem;
  detail: RootState['history']['detail'];
  detailLoading: boolean;
  activeModalTab: 'overview' | 'services' | 'qc' | 'handover';
  setActiveModalTab: (tab: 'overview' | 'services' | 'qc' | 'handover') => void;
  downloading: string | null;
  onDownload: (type: 'handover' | 'invoice', item: RepairHistoryItem) => void;
  onClose: () => void;
  statusConfig: Record<string, { label: string; badgeClass: string; icon: string; dotClass: string }>;
  formatDateTime: (value?: string | null) => string;
}

export default function HistoryDetailModal({
  selected,
  detail,
  detailLoading,
  activeModalTab,
  setActiveModalTab,
  downloading,
  onDownload,
  onClose,
  statusConfig,
  formatDateTime,
}: HistoryDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto cw-modal-overlay"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-3xl max-h-[92vh] overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col cw-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Đồng bộ tone sáng gradient với các modal khác */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/60 border-b border-slate-200 flex items-start justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-xs tracking-wider shadow-2xs">
                {selected.vehicle.license_plate}
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                #{selected.woNumber}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  selected.status === 'CANCELLED'
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {statusConfig[selected.status]?.label || selected.status}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-blue-600 text-[26px]">menu_book</span>
              Sổ Bảo Dưỡng Điện Tử
            </h2>
            <div className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                Phương tiện:{' '}
                <strong className="text-slate-800 font-semibold">
                  {selected.vehicle.make} {selected.vehicle.model} ({selected.vehicle.year || 'N/A'})
                </strong>
              </span>
              <span>•</span>
              <span>
                Hoàn tất lúc: <strong className="text-slate-800">{formatDateTime(selected.releasedAt || selected.closedAt)}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-slate-50/80 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveModalTab('overview')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeModalTab === 'overview'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Tổng quan & Tiếp nhận
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('services')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeModalTab === 'services'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Hạng mục & Phụ tùng ({selected.services?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('qc')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeModalTab === 'qc'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Kiểm định QC & Tiến trình
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('handover')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeModalTab === 'handover'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Bàn giao & Bảo hành
          </button>
        </div>

        {/* Modal Body with loading state */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {detailLoading || !detail ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Đang tải đầy đủ hồ sơ...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeModalTab === 'overview' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Vehicle & Customer summary */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Phương tiện:</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {detail.vehicle.licensePlate}
                      </span>
                      <span className="text-slate-500 block">
                        {detail.vehicle.make} {detail.vehicle.model}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Cố vấn dịch vụ:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {detail.advisor?.fullName || 'N/A'}
                      </span>
                      <span className="text-slate-500 block">
                        {detail.advisor?.phone || 'Hotline xưởng'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Chi phí hóa đơn:</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {formatVnd(detail.invoice?.totalAmount || selected.invoice?.total_amount)}
                      </span>
                      <span className="text-slate-500 block">
                        {detail.invoice?.invoiceNumber ? `HĐ #${detail.invoice.invoiceNumber}` : 'Chưa xuất hóa đơn'}
                      </span>
                    </div>
                  </div>

                  {/* Complaint & Intake Checkin */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-blue-600">checklist</span>
                      Tình trạng tiếp nhận ban đầu
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Yêu cầu sửa chữa của khách:</span>
                        <p className="font-semibold text-slate-800 text-sm mt-0.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          {parseComplaintText(detail.checkIn?.complaint || selected.complaint, DEFAULT_COMPLAINT_FALLBACK)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                        <div className="p-2.5 rounded-xl bg-slate-50">
                          <span className="text-slate-400 block">ODO lúc tiếp nhận:</span>
                          <span className="font-bold text-slate-800">
                            {detail.checkIn?.mileage ? `${detail.checkIn.mileage.toLocaleString('vi-VN')} km` : 'N/A'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50">
                          <span className="text-slate-400 block">Mức nhiên liệu vào:</span>
                          <span className="font-bold text-slate-800">
                            {detail.checkIn?.fuelLevel || 'Theo xe'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 col-span-2 sm:col-span-1">
                          <span className="text-slate-400 block">Ngoại thất / Đồ đạc:</span>
                          <span className="font-bold text-slate-800 truncate block">
                            {parseSafeText(detail.checkIn?.belongings, 'Bàn giao đầy đủ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SERVICES & PARTS */}
              {activeModalTab === 'services' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Danh mục công việc & kỹ thuật thực hiện
                    </h4>
                    <span className="text-xs text-slate-500">
                      {detail.services.length} hạng mục
                    </span>
                  </div>

                  {detail.services.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center bg-slate-50 rounded-2xl">
                      Không có hạng mục nào được ghi nhận.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                      {detail.services.map((svc, idx) => (
                        <div key={svc.id} className="p-3.5 sm:p-4 flex items-start justify-between gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div>
                              <h5 className="font-bold text-slate-900 text-sm">{svc.name}</h5>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Phân loại: <span className="font-medium text-slate-700">{svc.categoryName || 'Sửa chữa'}</span>
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Hoàn thành
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: QC & TIMELINE */}
              {activeModalTab === 'qc' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* QC Card */}
                  {detail.qcReport?.hasQc ? (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 text-xs sm:text-sm flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-emerald-600">verified</span>
                          Kiểm định chất lượng xưởng (QC Passed)
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {detail.qcReport.passedItems}/{detail.qcReport.totalItems} tiêu chuẩn đạt
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800">
                        Kỹ thuật viên KCS nghiệm thu:{' '}
                        <b>{detail.qcReport.inspectorName || 'Trưởng ban kiểm định'}</b> · Ngày nghiệm thu:{' '}
                        {formatDateTime(detail.qcReport.inspectedAt)}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400">info</span>
                      Hồ sơ nghiệm thu tiêu chuẩn theo quy trình xuất xưởng gara.
                    </div>
                  )}

                  {/* Steps Timeline */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Tiến trình chu trình dịch vụ
                    </h4>
                    <ol className="relative border-l border-slate-200 ml-3 space-y-4 py-2">
                      {detail.steps.map((st) => (
                        <li key={st.stepIndex} className="ml-5 space-y-0.5">
                          <span
                            className={`absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white ${
                              st.status === 'COMPLETED'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {st.status === 'COMPLETED' ? 'check' : 'remove'}
                            </span>
                          </span>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 text-xs sm:text-sm">{st.title}</p>
                            {st.time && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                {st.time}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{st.description}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* TAB 4: HANDOVER & WARRANTY */}
              {activeModalTab === 'handover' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Warranty box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-2">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-600">verified_user</span>
                      Chính sách bảo hành phương tiện & phụ tùng
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-950 font-medium">
                      {selected.warrantyTerms ||
                        'Bảo hành chính hãng 06 tháng hoặc 10.000 km cho toàn bộ phụ tùng thay thế và công việc sửa chữa kỹ thuật đã thực hiện tại xưởng.'}
                    </p>
                  </div>

                  {/* Handover specs */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600">output</span>
                      Thông số nghiệm thu lúc xuất xưởng
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50">
                        <span className="text-slate-400 block font-medium">Số ODO xuất xưởng:</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {selected.mileageOut ? `${selected.mileageOut.toLocaleString('vi-VN')} km` : 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50">
                        <span className="text-slate-400 block font-medium">Thời gian bàn giao:</span>
                        <span className="font-bold text-slate-800 text-xs">
                          {formatDateTime(selected.releasedAt || selected.closedAt)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block font-medium">Xác nhận khách hàng:</span>
                        <span className="font-bold text-emerald-700 text-xs flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">done_all</span>
                          Đã ký nhận xe
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            Hotline cố vấn kỹ thuật: <b className="text-slate-800">1900 6868</b>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {selected.hasHandoverPdf && (
              <button
                type="button"
                onClick={() => onDownload('handover', selected)}
                disabled={downloading === `handover-${selected.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Biên bản bàn giao (PDF)
              </button>
            )}

            {selected.invoice && (
              <button
                type="button"
                onClick={() => onDownload('invoice', selected)}
                disabled={downloading === `invoice-${selected.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                Hóa đơn VAT
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-200/60 text-xs font-bold cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
