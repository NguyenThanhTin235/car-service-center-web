'use client';

import React from 'react';
import { Quotation } from '@/lib/api/quotation.api';
import { WorkOrder } from '@/lib/api/work-order.api';
import { formatVND } from '@/lib/utils/formatters';
import ModalPortal from '@/components/advisor/common/ModalPortal';

interface QuotationActionModalsProps {
  workOrder: WorkOrder;
  activeQuotation: Quotation | null;
  actionLoading: boolean;
  isDiscountModalOpen: boolean;
  discountType: 'amount' | 'percent';
  discountValue: number;
  discountValidationError: string | null;
  setDiscountType: (type: 'amount' | 'percent') => void;
  setDiscountValue: (val: number) => void;
  onCloseDiscount: () => void;
  onSaveDiscount: () => void;
  isRejectModalOpen: boolean;
  rejectReason: string;
  setRejectReason: (val: string) => void;
  onCloseReject: () => void;
  onRejectQuotation: () => void;
  isConfirmCancelOpen: boolean;
  onCloseConfirmCancel: () => void;
  onCancelQuotation: () => void;
  isSendModalOpen: boolean;
  onCloseSend: () => void;
  onSendQuotation: () => void;
}

export default function QuotationActionModals({
  workOrder,
  activeQuotation,
  actionLoading,
  isDiscountModalOpen,
  discountType,
  discountValue,
  discountValidationError,
  setDiscountType,
  setDiscountValue,
  onCloseDiscount,
  onSaveDiscount,
  isRejectModalOpen,
  rejectReason,
  setRejectReason,
  onCloseReject,
  onRejectQuotation,
  isConfirmCancelOpen,
  onCloseConfirmCancel,
  onCancelQuotation,
  isSendModalOpen,
  onCloseSend,
  onSendQuotation,
}: QuotationActionModalsProps) {
  return (
    <>
      {/* MODAL 1: Điều chỉnh chiết khấu */}
      {isDiscountModalOpen && (
        <ModalPortal onClose={onCloseDiscount}>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sa-modal-backdrop">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Điều chỉnh chiết khấu báo giá"
              className="sa-modal-panel bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-2xl p-6 space-y-4"
            >
              <h3 className="text-title-md font-bold text-on-surface">Điều chỉnh chiết khấu báo giá</h3>
              <p className="text-xs text-on-surface-variant">
                Khoản giảm trừ sẽ được khấu trừ trực tiếp vào tổng thanh toán của khách hàng.
              </p>

              <div className="flex rounded-lg bg-surface-container-low p-1 border border-outline-variant">
                <button
                  type="button"
                  onClick={() => setDiscountType('amount')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    discountType === 'amount' ? 'bg-primary text-white shadow-2xs' : 'text-on-surface-variant'
                  }`}
                >
                  Số tiền mặt (VND)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    discountType === 'percent' ? 'bg-primary text-white shadow-2xs' : 'text-on-surface-variant'
                  }`}
                >
                  Phần trăm (%)
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-on-surface-variant">
                    {discountType === 'amount' ? 'Số tiền giảm (VND)' : 'Tỷ lệ chiết khấu (%)'}
                  </label>
                  {activeQuotation && (
                    <span className="text-[11px] font-mono text-on-surface-variant">
                      Tổng ban đầu: {formatVND(activeQuotation.subtotal)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min={0}
                  max={discountType === 'percent' ? 100 : activeQuotation?.subtotal}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value === '' ? 0 : Number(e.target.value))}
                  className={`w-full px-3 py-2 bg-surface-container-lowest border rounded-lg text-sm font-mono text-on-surface focus:outline-none ${
                    discountValidationError
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-outline-variant focus:border-primary'
                  }`}
                />
                {discountValidationError && (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">{discountValidationError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseDiscount}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={onSaveDiscount}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold"
                >
                  Lưu chiết khấu
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 2: Khách từ chối báo giá */}
      {isRejectModalOpen && (
        <ModalPortal onClose={onCloseReject}>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sa-modal-backdrop">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Ghi nhận khách từ chối báo giá"
              className="sa-modal-panel bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-2xl p-6 space-y-4"
            >
              <h3 className="text-title-md font-bold text-rose-600 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">cancel</span>
                Ghi nhận khách từ chối báo giá
              </h3>
              <p className="text-xs text-on-surface-variant">
                Khi từ chối, Phiếu công việc sẽ được chuyển ngược lại trạng thái <b>Lập kế hoạch</b> để Cố vấn thảo luận lại và điều chỉnh dịch vụ cho khách.
              </p>

              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">
                  Lý do khách hàng không đồng ý <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Khách muốn bỏ bớt hạng mục thay má phanh, chi phí vượt ngân sách..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseReject}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-xs font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={onRejectQuotation}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 3: Xác nhận hủy báo giá nháp */}
      {isConfirmCancelOpen && (
        <ModalPortal onClose={onCloseConfirmCancel}>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sa-modal-backdrop">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Xác nhận hủy báo giá nháp"
              className="sa-modal-panel bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-6 space-y-4"
            >
              <h3 className="text-title-md font-bold text-on-surface">Xác nhận hủy báo giá nháp?</h3>
              <p className="text-xs text-on-surface-variant">
                Bản ghi báo giá này sẽ bị xóa khỏi hệ thống. Bạn có thể tạo lại báo giá mới bất cứ lúc nào.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseConfirmCancel}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-xs font-semibold"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={onCancelQuotation}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 4: Xác nhận gửi báo giá cho khách hàng */}
      {isSendModalOpen && activeQuotation && (
        <ModalPortal onClose={onCloseSend}>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sa-modal-backdrop">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Gửi Báo Giá Cho Khách Hàng"
              className="sa-modal-panel bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-outline-variant shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">send</span>
                </div>
                <div>
                  <h3 className="text-title-md font-bold text-on-surface">Gửi Báo Giá Cho Khách Hàng</h3>
                  <p className="text-xs text-on-surface-variant">
                    Hệ thống sẽ gửi email kèm liên kết trực tiếp để khách hàng phê duyệt trực tuyến.
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-4 space-y-2.5 text-xs border border-outline-variant/60">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Khách hàng:</span>
                  <span className="font-bold text-on-surface">{workOrder.customer?.full_name || 'Khách hàng'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Email nhận thông báo:</span>
                  <span className="font-bold text-primary">{workOrder.customer?.email || 'Chưa cập nhật email'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Số điện thoại:</span>
                  <span className="font-bold text-on-surface">{workOrder.customer?.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Phương tiện:</span>
                  <span className="font-bold text-on-surface">
                    {workOrder.vehicle?.license_plate} - {workOrder.vehicle?.make} {workOrder.vehicle?.model}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Mã số báo giá:</span>
                  <span className="font-mono font-bold text-on-surface">{activeQuotation.quotationNumber}</span>
                </div>
                <div className="border-t border-outline-variant/60 pt-2 flex justify-between items-center">
                  <span className="text-on-surface font-bold">Tổng thanh toán (0% VAT):</span>
                  <span className="text-base font-extrabold text-primary font-mono tabular-nums">
                    {formatVND(activeQuotation.grandTotal)}
                  </span>
                </div>
              </div>

              {!workOrder.customer?.email && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">warning</span>
                  <span>Khách hàng chưa có email. Khách có thể xem và duyệt trực tiếp trên cổng thông tin Khách hàng (Tracking).</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCloseSend}
                  disabled={actionLoading}
                  className="px-4 py-2 min-h-[44px] border border-outline-variant text-on-surface-variant hover:bg-surface-container rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    onCloseSend();
                    await onSendQuotation();
                  }}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
                  {actionLoading ? 'Đang gửi...' : 'Xác nhận gửi báo giá'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
