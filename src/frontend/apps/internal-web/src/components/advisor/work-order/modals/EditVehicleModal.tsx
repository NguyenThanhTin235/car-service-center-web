'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updateVehicleInfo } from '@/lib/api/work-order.api';

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: number;
    license_plate: string;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    color?: string | null;
    vehicle_size?: string | null;
  } | null;
  onSuccess: () => void;
}

const VEHICLE_SIZES = [
  { value: 'SMALL', label: 'SMALL (Xe cỡ nhỏ / Sedan A, B / Xe máy)' },
  { value: 'MEDIUM', label: 'MEDIUM (Xe cỡ trung / Sedan C, D / CUV nhỏ)' },
  { value: 'LARGE', label: 'LARGE (Xe cỡ lớn / SUV / Bán tải)' },
  { value: 'HEAVY', label: 'HEAVY (Xe tải / Xe chuyên dụng)' },
];

export default function EditVehicleModal({
  isOpen,
  onClose,
  vehicle,
  onSuccess,
}: EditVehicleModalProps) {
  const [licensePlate, setLicensePlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [color, setColor] = useState('');
  const [vehicleSize, setVehicleSize] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (vehicle && isOpen) {
      setLicensePlate(vehicle.license_plate || '');
      setMake(vehicle.make || '');
      setModel(vehicle.model || '');
      setYear(vehicle.year || '');
      setColor(vehicle.color || '');
      setVehicleSize(vehicle.vehicle_size || 'MEDIUM');
    }
  }, [vehicle, isOpen]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate.trim()) {
      toast.error('Biển số xe không được để trống');
      return;
    }
    if (!make.trim() || !model.trim()) {
      toast.error('Hãng xe và Dòng xe không được để trống');
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateVehicleInfo(vehicle.id, {
        licensePlate: licensePlate.trim().toUpperCase(),
        make: make.trim(),
        model: model.trim(),
        year: year ? Number(year) : undefined,
        color: color.trim() || undefined,
        vehicleSize,
      });

      if (res && !res.success) {
        throw new Error(res.message || 'Lỗi khi cập nhật xe');
      }

      toast.success('Cập nhật thông tin phương tiện thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật xe');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 flex flex-col gap-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-vehicle-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0050cd] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">directions_car</span>
            </div>
            <div>
              <h2 id="edit-vehicle-title" className="text-base font-extrabold text-zinc-900 tracking-tight">
                Sửa Thông Tin Phương Tiện
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Cập nhật biển số, dòng xe và phân khúc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-zinc-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Biển số xe */}
          <div>
            <label className="block font-bold text-zinc-700 mb-1">
              Biển số xe <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              placeholder="VD: 51A-999.99"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono font-extrabold uppercase text-sm tracking-wider focus:outline-none focus:border-[#0050cd] focus:bg-white"
              required
            />
          </div>

          {/* Hãng xe & Dòng xe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Hãng xe <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="VD: Honda, Toyota, Yamaha"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold focus:outline-none focus:border-[#0050cd] focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Dòng xe (Model) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="VD: CR-V, Vios, Sirius"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold focus:outline-none focus:border-[#0050cd] focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Phân khúc xe */}
          <div>
            <label className="block font-bold text-zinc-700 mb-1">
              Phân khúc phương tiện <span className="text-rose-500">*</span>
            </label>
            <select
              value={vehicleSize}
              onChange={(e) => setVehicleSize(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-zinc-800 focus:outline-none focus:border-[#0050cd] focus:bg-white cursor-pointer"
            >
              {VEHICLE_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Màu sắc & Năm sản xuất */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Màu sơn</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="VD: Trắng, Đen, Bạc"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:outline-none focus:border-[#0050cd] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Năm sản xuất</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
                placeholder="VD: 2022"
                min="1990"
                max={new Date().getFullYear() + 1}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:outline-none focus:border-[#0050cd] focus:bg-white"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] disabled:opacity-50 text-white font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
