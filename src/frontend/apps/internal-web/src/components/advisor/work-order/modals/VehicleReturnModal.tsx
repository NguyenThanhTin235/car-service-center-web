'use client';

import React, { useState, useEffect } from 'react';
import { WorkOrder, cancelAndReleaseWorkOrder } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

interface VehicleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  refetchWO: () => void;
  initialReason?: string;
}

const FUEL_LEVEL_LABELS: Record<string, string> = {
  EMPTY: 'Bình cạn (E)',
  QUARTER: '1/4 bình',
  HALF: '1/2 bình',
  THREE_QUARTER: '3/4 bình',
  FULL: 'Đầy bình (F)',
};

export default function VehicleReturnModal({
  isOpen,
  onClose,
  workOrder,
  refetchWO,
  initialReason,
}: VehicleReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [returnMileage, setReturnMileage] = useState<number | ''>('');
  const [returnFuel, setReturnFuel] = useState<string>('HALF');
  const [isFreeDiagnostic, setIsFreeDiagnostic] = useState(true);
  const [diagnosticFee, setDiagnosticFee] = useState<number>(150000);
  const [releaseNotes, setReleaseNotes] = useState('');

  useEffect(() => {
    if (isOpen && workOrder) {
      const checkIn = workOrder.check_in;
      if (checkIn) {
        setReturnMileage(checkIn.mileage || '');
        setReturnFuel(checkIn.fuel_level || 'HALF');
      } else {
        setReturnMileage('');
        setReturnFuel('HALF');
      }

      setIsFreeDiagnostic(true);
      setDiagnosticFee(150000);

      const defaultNote = initialReason
        ? `Khách hàng từ chối làm dịch vụ (${initialReason}). Bàn giao xe theo hiện trạng ban đầu, tài sản và đồ đạc đầy đủ.`
        : 'Khách hàng không làm dịch vụ, nhận lại phương tiện theo hiện trạng ban đầu. Tài sản và đồ đạc trên xe đã bàn giao đầy đủ.';
      setReleaseNotes(defaultNote);
    }
  }, [isOpen, workOrder, initialReason]);

  if (!isOpen) return null;

  const checkIn = workOrder.check_in;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await cancelAndReleaseWorkOrder(workOrder.id, {
        releaseNotes: releaseNotes.trim(),
        diagnosticFee: !isFreeDiagnostic ? Number(diagnosticFee) : 0,
        mileage: returnMileage !== '' ? Number(returnMileage) : undefined,
        fuelLevel: returnFuel,
      });

      if (res.success) {
        toast.success(res.message || 'Đã hoàn tất bàn giao xuất trả xe cho khách hàng');
        refetchWO();
        onClose();
      } else {
        toast.error(res.message || 'Lỗi khi xuất trả xe');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xuất trả xe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-outline-variant bg-gradient-to-r from-rose-50/70 via-white to-orange-50/50 dark:from-rose-950/20 dark:via-surface-container-lowest dark:to-orange-950/10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                #{workOrder.wo_number}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-surface-container text-on-surface-variant">
                Thủ tục xuất trả xe
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600">directions_car</span>
              Biên Bản Bàn Giao & Xuất Trả Xe
            </h2>
            <p className="text-xs text-on-surface-variant">
              Khách hàng không làm dịch vụ / từ chối báo giá. Ghi nhận tình trạng hiện tại và xuất trả xe.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Thông tin phương tiện & khách hàng */}
          <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-on-surface-variant block">Phương tiện:</span>
              <span className="font-bold text-on-surface text-sm font-mono">
                {workOrder.vehicle.license_plate}
              </span>
              <span className="text-on-surface-variant block mt-0.5">
                {workOrder.vehicle.make} {workOrder.vehicle.model} ({workOrder.vehicle.year || 'N/A'}) - Màu: {workOrder.vehicle.color || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant block">Khách hàng:</span>
              <span className="font-bold text-on-surface text-sm">
                {workOrder.customer.full_name}
              </span>
              <span className="text-on-surface-variant block mt-0.5 font-mono">
                SĐT: {workOrder.customer.phone}
              </span>
            </div>
          </div>

          {/* Đối chiếu Tiếp nhận vs Xuất trả */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">compare_arrows</span>
              Đối chiếu thông số tiếp nhận & xuất trả
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ODO */}
              <div className="p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest space-y-2">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span>Số ODO lúc trả xe (km)</span>
                  {checkIn && (
                    <span className="text-[11px] text-on-surface-variant font-normal">
                      Tiếp nhận: <b>{checkIn.mileage?.toLocaleString('vi-VN')} km</b>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 material-symbols-outlined text-[18px] text-outline">
                    speed
                  </span>
                  <input
                    type="number"
                    value={returnMileage}
                    onChange={(e) => setReturnMileage(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Nhập số ODO lúc trả xe"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-outline-variant bg-white dark:bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Nhiên liệu */}
              <div className="p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest space-y-2">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span>Mức xăng lúc trả xe</span>
                  {checkIn && (
                    <span className="text-[11px] text-on-surface-variant font-normal">
                      Tiếp nhận: <b>{FUEL_LEVEL_LABELS[checkIn.fuel_level] || checkIn.fuel_level}</b>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 material-symbols-outlined text-[18px] text-outline">
                    local_gas_station
                  </span>
                  <select
                    value={returnFuel}
                    onChange={(e) => setReturnFuel(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-outline-variant bg-white dark:bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Object.entries(FUEL_LEVEL_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Thông tin tình trạng lúc tiếp nhận */}
            {checkIn && (checkIn.exterior_condition || checkIn.belongings) && (
              <div className="p-3 rounded-xl bg-surface-container-low/40 border border-outline-variant/60 text-[11px] space-y-1">
                {checkIn.exterior_condition && (
                  <div>
                    <span className="text-on-surface-variant font-medium">Ngoại quan lúc nhận:</span>{' '}
                    <span className="text-on-surface">{checkIn.exterior_condition}</span>
                  </div>
                )}
                {checkIn.belongings && (
                  <div>
                    <span className="text-on-surface-variant font-medium">Tài sản trên xe:</span>{' '}
                    <span className="text-on-surface">{checkIn.belongings}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phí kiểm tra / chẩn đoán */}
          <div className="p-4 rounded-2xl border border-outline-variant bg-surface-container-low/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">receipt_long</span>
                <span className="text-xs font-bold text-on-surface">Phí kiểm tra & chẩn đoán xe (Inspection Fee)</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="freeDiagCheck"
                  checked={isFreeDiagnostic}
                  onChange={(e) => setIsFreeDiagnostic(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer w-4 h-4"
                />
                <label htmlFor="freeDiagCheck" className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer">
                  Miễn phí chẩn đoán cho khách
                </label>
              </div>
            </div>

            {!isFreeDiagnostic && (
              <div className="pt-2 flex items-center gap-3">
                <label className="text-xs text-on-surface-variant shrink-0">
                  Số tiền thu (VND):
                </label>
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="number"
                    step={10000}
                    value={diagnosticFee}
                    onChange={(e) => setDiagnosticFee(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-outline-variant bg-white dark:bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute right-3 top-2 text-xs text-on-surface-variant font-mono">
                    đ
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ghi chú biên bản xuất trả */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
              Ghi chú biên bản xuất trả phương tiện
            </label>
            <textarea
              rows={3}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="Nhập ghi chú xuất trả xe, cam kết tài sản và chữ ký bàn giao..."
              className="w-full p-3 text-xs rounded-xl border border-outline-variant bg-white dark:bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý xuất xe...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  <span>Hoàn tất bàn giao & Xuất trả xe</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
