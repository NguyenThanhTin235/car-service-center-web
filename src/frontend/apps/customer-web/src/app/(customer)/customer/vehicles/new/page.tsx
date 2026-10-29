'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { createVehicle } from '@/store/slices/vehicleSlice';
import Toast from '@/components/shared/Toast';

const VEHICLE_SIZES = [
  {
    value: 'SMALL',
    label: 'Cỡ nhỏ (Hạng A - B)',
    desc: 'Hatchback, Sedan nhỏ: Morning, i10, Yaris, Accent...',
    icon: 'minor_crash',
  },
  {
    value: 'MEDIUM',
    label: 'Cỡ vừa (Hạng C)',
    desc: 'Sedan hạng C, CUV nhỏ: Vios, City, Mazda 3, CX-30...',
    icon: 'directions_car',
  },
  {
    value: 'LARGE',
    label: 'Cỡ lớn (Hạng D - SUV)',
    desc: 'CUV/SUV cỡ trung & lớn: CX-5, CR-V, Santa Fe, Camry...',
    icon: 'airport_shuttle',
  },
  {
    value: 'XL',
    label: 'Rất lớn (MPV / Bán tải)',
    desc: 'Bán tải, MPV gia đình: Ranger, Carnival, Everest...',
    icon: 'rv_hookup',
  },
] as const;

export default function NewVehiclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/customer/vehicles';

  const dispatch = useAppDispatch();
  const { actionLoading, actionError } = useAppSelector((state) => state.vehicles);

  const [form, setForm] = useState({
    licensePlate: '',
    make: '',
    model: '',
    year: '',
    color: '',
    vehicleSize: 'MEDIUM' as 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!form.licensePlate.trim()) {
      errs.licensePlate = 'Vui lòng nhập biển số xe';
    } else if (!/^[0-9]{2}[A-Z]{1,2}-[0-9]{3,5}(\.[0-9]{2})?$/i.test(form.licensePlate.trim())) {
      // Cảnh báo nếu không đúng định dạng biển số VN thông dụng nhưng vẫn cho phép nếu người dùng cố ý
      // errs.licensePlate = 'Định dạng biển số chưa chuẩn (VD: 30H-888.99 hoặc 51G-123.45)';
    }

    if (!form.make.trim()) {
      errs.make = 'Vui lòng nhập hãng xe (VD: Toyota, Mazda...)';
    }

    if (!form.model.trim()) {
      errs.model = 'Vui lòng nhập dòng xe (VD: CX-5, Vios...)';
    }

    if (form.year) {
      const yearNum = parseInt(form.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1980 || yearNum > currentYear + 1) {
        errs.year = `Năm sản xuất từ 1980 đến ${currentYear + 1}`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await dispatch(
        createVehicle({
          licensePlate: form.licensePlate.trim().toUpperCase(),
          make: form.make.trim(),
          model: form.model.trim(),
          year: form.year ? parseInt(form.year) : undefined,
          color: form.color.trim() || undefined,
          vehicleSize: form.vehicleSize,
        })
      );

      if (!result.type.endsWith('/rejected')) {
        setToastMsg({ message: 'Thêm phương tiện mới thành công!', type: 'success' });
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1000);
      } else {
        setToastMsg({
          message: (result.payload as string) || 'Lỗi khi thêm xe. Vui lòng kiểm tra lại.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setToastMsg({ message: err.message || 'Lỗi kết nối máy chủ', type: 'error' });
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 bg-surface-container-lowest border rounded-xl text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {toastMsg && (
        <Toast
          message={toastMsg.message}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}

      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center space-x-2 text-on-surface-variant text-xs mb-1.5 font-medium">
          <Link href="/customer" className="hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/customer/vehicles" className="hover:text-primary transition-colors">
            Xe của tôi
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">Thêm xe mới</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Thêm phương tiện mới
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
          Đăng ký thông tin xe để quản lý lịch bảo dưỡng và thuận tiện đặt lịch hẹn tại xưởng.
        </p>
      </div>

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl shadow-sm p-5 sm:p-7 space-y-6">
        
        {/* Section 1: Thông tin nhận diện xe */}
        <div>
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4 pb-2 border-b border-surface-container-highest flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
            Thông tin định danh xe
          </h2>

          <div className="space-y-4">
            {/* Biển số xe */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Biển số xe <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.licensePlate}
                  onChange={(e) => {
                    setForm({ ...form, licensePlate: e.target.value.toUpperCase() });
                    if (errors.licensePlate) setErrors({ ...errors, licensePlate: '' });
                  }}
                  placeholder="VD: 30H-888.99 hoặc 51G-123.45"
                  className={`${inputClass} font-mono tracking-wider font-bold ${
                    errors.licensePlate ? 'border-error' : 'border-surface-container-highest'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-outline uppercase">
                  Biển số VN
                </span>
              </div>
              {errors.licensePlate ? (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.licensePlate}
                </p>
              ) : (
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Biển số sẽ dùng để tra cứu lịch sử sửa chữa và nhận diện xe tại xưởng.
                </p>
              )}
            </div>

            {/* Hãng xe & Dòng xe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Hãng sản xuất <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.make}
                  onChange={(e) => {
                    setForm({ ...form, make: e.target.value });
                    if (errors.make) setErrors({ ...errors, make: '' });
                  }}
                  placeholder="VD: Toyota, Mazda, Honda..."
                  className={`${inputClass} ${errors.make ? 'border-error' : 'border-surface-container-highest'}`}
                />
                {errors.make && (
                  <p className="text-xs text-error mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.make}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Dòng xe / Model <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => {
                    setForm({ ...form, model: e.target.value });
                    if (errors.model) setErrors({ ...errors, model: '' });
                  }}
                  placeholder="VD: CX-5, Vios, City, Ranger..."
                  className={`${inputClass} ${errors.model ? 'border-error' : 'border-surface-container-highest'}`}
                />
                {errors.model && (
                  <p className="text-xs text-error mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.model}
                  </p>
                )}
              </div>
            </div>

            {/* Năm sản xuất & Màu sắc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Năm sản xuất
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => {
                    setForm({ ...form, year: e.target.value });
                    if (errors.year) setErrors({ ...errors, year: '' });
                  }}
                  placeholder="VD: 2023"
                  className={`${inputClass} font-mono ${errors.year ? 'border-error' : 'border-surface-container-highest'}`}
                />
                {errors.year && (
                  <p className="text-xs text-error mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.year}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Màu sắc
                </label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="VD: Trắng, Đỏ, Đen, Xám..."
                  className={`${inputClass} border-surface-container-highest`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Phân khúc kích thước xe */}
        <div>
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4 pb-2 border-b border-surface-container-highest flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
            Phân khúc & Kích thước phương tiện
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VEHICLE_SIZES.map((size) => {
              const isSelected = form.vehicleSize === size.value;
              return (
                <div
                  key={size.value}
                  onClick={() => setForm({ ...form, vehicleSize: size.value })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-primary bg-primary-fixed/30 shadow-2xs'
                      : 'border-surface-container-highest bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{size.icon}</span>
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                      {size.label}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      {size.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Error if any from Redux */}
        {actionError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{actionError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-surface-container-highest flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={actionLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {actionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang lưu thông tin...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Lưu phương tiện</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
