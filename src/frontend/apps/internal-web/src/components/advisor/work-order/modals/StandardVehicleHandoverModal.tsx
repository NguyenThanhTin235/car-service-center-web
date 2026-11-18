'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WorkOrder, completeVehicleHandover } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

interface StandardVehicleHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  refetchWO: () => void;
}

const FUEL_LEVEL_OPTIONS = [
  { value: 'EMPTY', label: 'Bình cạn (E)' },
  { value: 'QUARTER', label: '1/4 bình' },
  { value: 'HALF', label: '1/2 bình' },
  { value: 'THREE_QUARTER', label: '3/4 bình' },
  { value: 'FULL', label: 'Đầy bình (F)' },
];

export default function StandardVehicleHandoverModal({
  isOpen,
  onClose,
  workOrder,
  refetchWO,
}: StandardVehicleHandoverModalProps) {
  const [loading, setLoading] = useState(false);
  const [returnMileage, setReturnMileage] = useState<number | ''>('');
  const [returnFuel, setReturnFuel] = useState<string>('HALF');
  const [carWashCompleted, setCarWashCompleted] = useState(true);
  const [belongingsReturned, setBelongingsReturned] = useState(true);
  const [oldPartsAction, setOldPartsAction] = useState<'RETURNED_TO_CUSTOMER' | 'DISPOSED_BY_GARAGE'>('RETURNED_TO_CUSTOMER');
  const [warrantyTerms, setWarrantyTerms] = useState(
    'Bảo hành 06 tháng hoặc 10.000 km cho các hạng mục sửa chữa và phụ tùng chính hãng thay mới.'
  );
  const [notes, setNotes] = useState('');

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen && workOrder) {
      const checkIn = workOrder.check_in;
      if (checkIn) {
        setReturnMileage(checkIn.mileage ? Number(checkIn.mileage) : '');
        setReturnFuel(checkIn.fuel_level || 'HALF');
      } else {
        setReturnMileage('');
        setReturnFuel('HALF');
      }
      setCarWashCompleted(true);
      setBelongingsReturned(true);
      setOldPartsAction('RETURNED_TO_CUSTOMER');
      setWarrantyTerms('Bảo hành 06 tháng hoặc 10.000 km cho các hạng mục sửa chữa và phụ tùng chính hãng thay mới.');
      setNotes('');
      clearSignature();
    }
  }, [isOpen, workOrder]);

  // Setup canvas
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasSignature(false);
  };

  if (!isOpen) return null;

  const checkIn = workOrder.check_in;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (checkIn?.mileage && returnMileage !== '' && Number(returnMileage) < Number(checkIn.mileage)) {
      toast.error(`Số ODO xuất xưởng (${returnMileage} km) không thể nhỏ hơn ODO lúc nhận (${checkIn.mileage} km)`);
      return;
    }

    try {
      setLoading(true);

      let customerSignature = '';
      if (canvasRef.current && hasSignature) {
        customerSignature = canvasRef.current.toDataURL('image/png');
      }

      const res = await completeVehicleHandover(workOrder.id, {
        returnMileage: returnMileage !== '' ? Number(returnMileage) : undefined,
        returnFuel,
        oldPartsAction,
        carWashCompleted,
        belongingsReturned,
        warrantyTerms: warrantyTerms.trim(),
        notes: notes.trim(),
        customerSignature: customerSignature || undefined,
      });

      if (res.success) {
        toast.success(res.message || 'Bàn giao xe thành công!');
        refetchWO();
        onClose();
      } else {
        toast.error(res.message || 'Lỗi khi bàn giao xe');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi bàn giao xe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-outline-variant bg-gradient-to-r from-emerald-50 via-white to-teal-50 dark:from-emerald-950/25 dark:via-surface-container-lowest dark:to-teal-950/15 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                #{workOrder.wo_number}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                <span className="material-symbols-outlined text-[13px]">verified</span>
                Đã thanh toán 100%
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">directions_car</span>
              Biên Bản Bàn Giao & Xuất Xưởng Phương Tiện
            </h2>
            <p className="text-xs text-on-surface-variant">
              Nghiệm thu chất lượng, đối soát hiện trạng và xác nhận xuất xưởng phương tiện cho khách hàng.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Thông tin phương tiện & khách hàng */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-on-surface-variant block">Phương tiện:</span>
              <span className="font-bold text-on-surface text-base font-mono text-emerald-700 dark:text-emerald-300">
                {workOrder.vehicle.license_plate}
              </span>
              <span className="text-on-surface-variant block mt-0.5 font-medium">
                {workOrder.vehicle.make} {workOrder.vehicle.model} ({workOrder.vehicle.year || 'N/A'}) - Màu: {workOrder.vehicle.color || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant block">Khách hàng nhận xe:</span>
              <span className="font-bold text-on-surface text-base">
                {workOrder.customer.full_name}
              </span>
              <span className="text-on-surface-variant block mt-0.5 font-mono">
                SĐT: {workOrder.customer.phone} {workOrder.customer.email ? `• ${workOrder.customer.email}` : ''}
              </span>
            </div>
          </div>

          {/* 1. Đối chiếu thông số ODO & Mức xăng */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">speed</span>
              1. Đối chiếu thông số kỹ thuật xuất xưởng
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ODO */}
              <div className="p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Số km ODO tiếp nhận:</span>
                  <span className="font-mono font-bold text-on-surface">
                    {checkIn?.mileage ? `${Number(checkIn.mileage).toLocaleString('vi-VN')} km` : 'Chưa ghi nhận'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Số km ODO xuất xưởng: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant/70">
                      <span className="material-symbols-outlined text-[18px]">speed</span>
                    </div>
                    <input
                      type="number"
                      required
                      min={checkIn?.mileage || 0}
                      value={returnMileage}
                      onChange={(e) => setReturnMileage(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Nhập số ODO lúc bàn giao"
                      className="w-full pl-10 pr-9 py-2 bg-surface rounded-lg border border-outline-variant text-xs sm:text-sm font-mono focus:border-emerald-600 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-on-surface-variant font-mono pointer-events-none">km</span>
                  </div>
                </div>
              </div>

              {/* Nhiên liệu */}
              <div className="p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Mức xăng lúc nhận:</span>
                  <span className="font-semibold text-on-surface">
                    {checkIn?.fuel_level || 'Chưa ghi nhận'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Mức xăng bàn giao: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant/70">
                      <span className="material-symbols-outlined text-[18px]">local_gas_station</span>
                    </div>
                    <select
                      value={returnFuel}
                      onChange={(e) => setReturnFuel(e.target.value)}
                      className="w-full pl-10 pr-8 py-2 bg-surface rounded-lg border border-outline-variant text-xs sm:text-sm focus:border-emerald-600 focus:outline-none cursor-pointer"
                    >
                      {FUEL_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Tiêu chuẩn bàn giao & Vệ sinh */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">checklist</span>
              2. Tiêu chuẩn bàn giao & Tài sản
            </h4>

            <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={carWashCompleted}
                  onChange={(e) => setCarWashCompleted(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-outline-variant focus:ring-emerald-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-on-surface">Đã rửa xe & vệ sinh sạch sẽ nội ngoại thất</span>
                  <p className="text-on-surface-variant text-[11px]">Đảm bảo xe đạt tiêu chuẩn xuất xưởng sạch đẹp trước khi giao khách.</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-outline-variant/50">
                <input
                  type="checkbox"
                  checked={belongingsReturned}
                  onChange={(e) => setBelongingsReturned(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-outline-variant focus:ring-emerald-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-on-surface">Đã hoàn trả toàn bộ tài sản, đồ đạc cá nhân trên xe</span>
                  <p className="text-on-surface-variant text-[11px]">Đối chiếu danh mục tài sản đã ký nhận lúc Check-in.</p>
                </div>
              </label>

              <div className="pt-2 border-t border-outline-variant/50 space-y-1.5">
                <span className="text-xs font-semibold text-on-surface block">Phương án xử lý phụ tùng cũ thay ra:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    oldPartsAction === 'RETURNED_TO_CUSTOMER' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200' : 'border-outline-variant'
                  }`}>
                    <input
                      type="radio"
                      name="oldPartsAction"
                      value="RETURNED_TO_CUSTOMER"
                      checked={oldPartsAction === 'RETURNED_TO_CUSTOMER'}
                      onChange={() => setOldPartsAction('RETURNED_TO_CUSTOMER')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Hoàn trả cho khách mang về</span>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    oldPartsAction === 'DISPOSED_BY_GARAGE' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200' : 'border-outline-variant'
                  }`}>
                    <input
                      type="radio"
                      name="oldPartsAction"
                      value="DISPOSED_BY_GARAGE"
                      checked={oldPartsAction === 'DISPOSED_BY_GARAGE'}
                      onChange={() => setOldPartsAction('DISPOSED_BY_GARAGE')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Khách gửi xưởng tiêu hủy an toàn</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Cam kết bảo hành & Khuyến nghị */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
              3. Điều khoản bảo hành & Ghi chú cố vấn
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">Chính sách bảo hành dịch vụ:</label>
                <textarea
                  rows={2}
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full p-2.5 bg-surface rounded-lg border border-outline-variant text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Khuyến nghị & Nhắc bảo dưỡng kỳ tới:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Thay nhớt định kỳ sau 5.000 km hoặc vào ngày..."
                  className="w-full p-2.5 bg-surface rounded-lg border border-outline-variant text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Chữ ký điện tử của khách hàng */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">draw</span>
                4. Chữ ký xác nhận nhận xe của khách hàng (Tùy chọn)
              </h4>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Xóa chữ ký
                </button>
              )}
            </div>

            <div className="relative border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl bg-white dark:bg-surface-container overflow-hidden">
              <canvas
                ref={canvasRef}
                width={650}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[120px] cursor-crosshair touch-none"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-on-surface-variant/40 text-xs">
                  <span>Ký tên trực tiếp tại đây (chuột hoặc cảm ứng)</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-outline-variant flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Đang xử lý xuất xưởng...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Xác Nhận & Hoàn Tất Bàn Giao Xe</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

