'use client';

import React, { useState } from 'react';
import { WorkOrder, closeWorkOrder } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

interface CloseWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  refetchWO?: () => void;
}

export default function CloseWorkOrderModal({
  isOpen,
  onClose,
  workOrder,
  refetchWO,
}: CloseWorkOrderModalProps) {
  const [closing, setClosing] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setClosing(true);
      await closeWorkOrder(workOrder.id, notes.trim() || undefined);
      toast.success('Đã đóng hồ sơ phiếu công việc thành công');
      setNotes('');
      onClose();
      refetchWO?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi đóng hồ sơ');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-outline-variant bg-gradient-to-r from-amber-50/80 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-surface-container-lowest dark:to-amber-950/10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                #{workOrder.wo_number}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                ĐÃ XUẤT XƯỞNG
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-amber-600 text-[26px]">lock</span>
              Đóng Hồ Sơ Phiếu Công Việc
            </h2>
            <p className="text-xs text-on-surface-variant">
              Lưu trữ hồ sơ vĩnh viễn và đồng bộ vào Lịch sử sửa chữa của khách hàng.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={closing}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Thông tin phương tiện */}
          <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-outline-variant/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-on-surface-variant block">Phương tiện:</span>
              <span className="font-bold text-on-surface text-sm font-mono">
                {workOrder.vehicle.license_plate}
              </span>
              <span className="text-on-surface-variant block mt-0.5">
                {workOrder.vehicle.make} {workOrder.vehicle.model}
              </span>
            </div>
            <div className="text-right">
              <span className="text-on-surface-variant block">Khách hàng:</span>
              <span className="font-bold text-on-surface text-sm">
                {workOrder.customer.full_name}
              </span>
              <span className="text-on-surface-variant block mt-0.5">
                Cố vấn: {workOrder.advisor?.full_name || 'N/A'}
              </span>
            </div>
          </div>

          {/* Checklist kiểm tra */}
          <div className="space-y-2 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200">
            <p className="font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">task_alt</span>
              Điều kiện đóng hồ sơ:
            </p>
            <ul className="space-y-1 pl-5 list-disc text-emerald-800 dark:text-emerald-300">
              <li>Phương tiện đã bàn giao thành công và có biên bản xuất xưởng.</li>
              <li>Hóa đơn dịch vụ đã thanh toán đầy đủ hoặc không phát sinh công nợ.</li>
              <li>Không còn công việc thi công hoặc phụ tùng giữ chỗ đang dang dở.</li>
            </ul>
          </div>

          {/* Cảnh báo khóa dữ liệu */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
            <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">info</span>
            <p>
              <b>Lưu ý quan trọng:</b> Sau khi đóng hồ sơ, phiếu công việc sẽ được chuyển vĩnh viễn sang trạng thái <b>CLOSED</b> và khóa chỉnh sửa toàn bộ.
            </p>
          </div>

          {/* Ô nhập ghi chú đóng hồ sơ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface">
              Ghi chú đóng hồ sơ (không bắt buộc):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Nhập ghi chú lưu trữ hồ sơ (ví dụ: Khách hàng hài lòng, hoàn tất nghiệm thu, hẹn bảo dưỡng sau 5.000 km...)"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-on-surface placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-outline-variant bg-surface-container-low/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={closing}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={closing}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {closing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Xác nhận đóng hồ sơ</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

