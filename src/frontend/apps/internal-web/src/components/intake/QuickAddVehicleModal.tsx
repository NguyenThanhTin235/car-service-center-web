import React, { useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { validateLicensePlate, validateRequired } from '@/lib/utils/validators';

export interface QuickVehicleCreated {
  id: number;
  licensePlate: string;
  make: string;
  model: string;
  year?: number | null;
  color?: string | null;
  vehicleSize?: string;
}

interface QuickAddVehicleModalProps {
  isOpen: boolean;
  customerId: string | number;
  customerName?: string;
  onClose: () => void;
  onSuccess: (vehicle: QuickVehicleCreated) => void;
}

const INITIAL_FORM = {
  licensePlate: '',
  make: '',
  model: '',
  color: '',
  vehicleSize: 'MEDIUM' as 'SMALL' | 'MEDIUM' | 'LARGE',
};

export default function QuickAddVehicleModal({
  isOpen,
  customerId,
  customerName,
  onClose,
  onSuccess,
}: QuickAddVehicleModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const plateErr = validateLicensePlate(form.licensePlate, true, 'Biển số xe');
    if (plateErr) errs.licensePlate = plateErr;
    const makeErr = validateRequired(form.make, 'Hãng xe');
    if (makeErr) errs.make = makeErr;
    const modelErr = validateRequired(form.model, 'Dòng xe');
    if (modelErr) errs.model = modelErr;

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const res = await api.post(`/api/customers/${customerId}/vehicles`, {
        licensePlate: form.licensePlate.trim().toUpperCase(),
        make: form.make.trim(),
        model: form.model.trim(),
        color: form.color.trim() || undefined,
        vehicleSize: form.vehicleSize,
      });
      const created: QuickVehicleCreated | undefined = res.data?.data;
      if (created) {
        toast.success('Thêm phương tiện mới thành công!');
        setForm(INITIAL_FORM);
        onSuccess(created);
        onClose();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể thêm phương tiện';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Thêm phương tiện mới</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {customerName
                ? `Thêm xe mới cho khách hàng ${customerName}`
                : 'Thêm nhanh phương tiện vào hồ sơ khách hàng'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Biển số xe <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.licensePlate}
              onChange={(e) => {
                setForm((f) => ({ ...f, licensePlate: e.target.value }));
                if (errors.licensePlate) setErrors((prev) => ({ ...prev, licensePlate: '' }));
              }}
              placeholder="VD: 51A-123.45"
              className={`w-full h-10 px-3 rounded-xl border text-xs font-mono uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${
                errors.licensePlate ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.licensePlate && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.licensePlate}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hãng xe <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.make}
                onChange={(e) => {
                  setForm((f) => ({ ...f, make: e.target.value }));
                  if (errors.make) setErrors((prev) => ({ ...prev, make: '' }));
                }}
                placeholder="VD: Toyota"
                className={`w-full h-10 px-3 rounded-xl border text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${
                  errors.make ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.make && <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.make}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dòng xe <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => {
                  setForm((f) => ({ ...f, model: e.target.value }));
                  if (errors.model) setErrors((prev) => ({ ...prev, model: '' }));
                }}
                placeholder="VD: Camry"
                className={`w-full h-10 px-3 rounded-xl border text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${
                  errors.model ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.model && <p className="text-[11px] font-semibold text-rose-600 mt-1">{errors.model}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Màu sắc</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                placeholder="VD: Đen"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phân khúc</label>
              <select
                value={form.vehicleSize}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    vehicleSize: e.target.value as 'SMALL' | 'MEDIUM' | 'LARGE',
                  }))
                }
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="SMALL">Nhỏ (Hatchback/Sedan nhỏ)</option>
                <option value="MEDIUM">Trung bình (Sedan/CUV)</option>
                <option value="LARGE">Lớn (SUV/Bán tải)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Lưu phương tiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
