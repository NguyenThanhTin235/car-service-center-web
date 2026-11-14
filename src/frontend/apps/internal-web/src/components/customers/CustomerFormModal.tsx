import React, { useState, useEffect } from 'react';
import {
  validateName,
  validatePhone,
  validateEmail,
  validateLicensePlate,
} from '@/lib/utils/validators';

interface VehicleData {
  id?: number;
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  vehicleSize: string;
}

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any, id?: number) => Promise<void>;
  initialData?: any;
}

export default function CustomerFormModal({ isOpen, onClose, onSave, initialData }: CustomerFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
  });

  const [vehicles, setVehicles] = useState<VehicleData[]>([]);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
      });
      if (initialData.vehicles && initialData.vehicles.length > 0) {
        setVehicles(initialData.vehicles.map((v: any) => ({
          id: v.id,
          licensePlate: v.licensePlate || '',
          make: v.make || '',
          model: v.model || '',
          color: v.color || '',
          vehicleSize: v.vehicleSize || 'MEDIUM',
        })));
      } else {
        setVehicles([]);
      }
    } else if (isOpen && !initialData) {
      setFormData({ fullName: '', phone: '', email: '', address: '' });
      setVehicles([{ licensePlate: '', make: '', model: '', color: '', vehicleSize: 'MEDIUM' }]);
    }
    setErrors({});
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
    if (errors.api) setErrors((prev) => ({ ...prev, api: '' }));
  };

  const handleVehicleChange = (index: number, field: keyof VehicleData, value: string) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = { ...newVehicles[index], [field]: value };
    setVehicles(newVehicles);
    if (errors[`vehicle_${index}`]) {
      setErrors((prev) => ({ ...prev, [`vehicle_${index}`]: '' }));
    }
    if (errors.api) setErrors((prev) => ({ ...prev, api: '' }));
  };

  const addVehicle = () => {
    setVehicles([...vehicles, { licensePlate: '', make: '', model: '', color: '', vehicleSize: 'MEDIUM' }]);
  };

  const removeVehicle = (index: number) => {
    const newVehicles = [...vehicles];
    newVehicles.splice(index, 1);
    setVehicles(newVehicles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validation reusing shared validators
    const newErrors: Record<string, string> = {};
    const nameErr = validateName(formData.fullName, 'Họ và tên khách hàng');
    if (nameErr) newErrors.fullName = nameErr;
    const phoneErr = validatePhone(formData.phone, true, 'Số điện thoại');
    if (phoneErr) newErrors.phone = phoneErr;
    const emailErr = validateEmail(formData.email, 'Email', false);
    if (emailErr) newErrors.email = emailErr;

    const validVehicles = [];
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const hasAnyField = v.licensePlate || v.make || v.model || v.color;
      if (hasAnyField) {
        const plateErr = validateLicensePlate(v.licensePlate, true, 'Biển số xe');
        if (plateErr) newErrors[`vehicle_${i}`] = plateErr;
      }
      if (v.licensePlate.trim()) {
        validVehicles.push(v);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        vehicles: validVehicles.map(v => ({
          id: v.id,
          licensePlate: v.licensePlate.trim().toUpperCase(),
          make: v.make.trim(),
          model: v.model.trim(),
          color: v.color.trim(),
          vehicleSize: v.vehicleSize,
        })),
      };

      await onSave(payload, initialData?.id);
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu khách hàng';
      setErrors({ api: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header (Sticky top) */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#0050cd] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">
                {initialData ? 'manage_accounts' : 'person_add'}
              </span>
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {initialData ? 'Cập nhật hồ sơ Khách hàng & Phương tiện' : 'Thêm mới Khách hàng & Phương tiện'}
              </h2>
              <p className="text-xs text-slate-500">
                {initialData ? `Chỉnh sửa thông tin KH #${initialData.id}` : 'Nhập thông tin liên hệ và phương tiện ban đầu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body (Scrollable with styled scrollbar) */}
        <div className="p-4 sm:p-6 overflow-y-auto styled-scrollbar flex-1">
          {errors.api && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
              <span>{errors.api}</span>
            </div>
          )}
          
          <form id="customer-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 sm:gap-6">
            {/* Customer Section */}
            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-[#0866ff] text-white text-xs font-bold flex items-center justify-center font-mono">1</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Thông tin Khách hàng (Bắt buộc)
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Họ và tên khách hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className={`h-10 px-3.5 rounded-xl border ${errors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'} text-xs font-medium text-slate-900 focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] outline-none transition-all placeholder:text-slate-400`}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && <span className="text-[11px] font-semibold text-rose-600">{errors.fullName}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={`h-10 px-3.5 rounded-xl border ${errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'} text-xs font-mono font-medium text-slate-900 focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] outline-none transition-all placeholder:text-slate-400`}
                    placeholder="0912345678"
                  />
                  {errors.phone && <span className="text-[11px] font-semibold text-rose-600">{errors.phone}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Email khách hàng</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`h-10 px-3.5 rounded-xl border ${errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'} text-xs font-medium text-slate-900 focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] outline-none transition-all placeholder:text-slate-400`}
                    placeholder="khachhang@example.com"
                  />
                  {errors.email && <span className="text-[11px] font-semibold text-rose-600">{errors.email}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Địa chỉ cư trú</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] outline-none transition-all placeholder:text-slate-400"
                    placeholder="Số nhà, tên đường, phường/xã..."
                  />
                </div>
              </div>
            </div>

            {/* Vehicles Section */}
            <div className="bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0050cd] text-white text-xs font-bold flex items-center justify-center font-mono">2</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Phương tiện của Khách hàng
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 bg-slate-200/80 rounded-full text-slate-600 font-semibold">Tùy chọn</span>
                </div>
                <button
                  type="button"
                  onClick={addVehicle}
                  className="h-8 px-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0050cd] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ Thêm xe</span>
                </button>
              </div>

              <div className="flex flex-col gap-3.5">
                {vehicles.map((v, index) => (
                  <div key={index} className="p-4 rounded-xl border border-slate-200 bg-white relative shadow-2xs">
                    <button
                      type="button"
                      onClick={() => removeVehicle(index)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="Xóa phương tiện này"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[18px] text-[#0050cd]">directions_car</span>
                      <h4 className="text-xs font-bold text-slate-800">Phương tiện #{index + 1}</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-600">Biển số xe</label>
                        <input
                          value={v.licensePlate}
                          onChange={(e) => handleVehicleChange(index, 'licensePlate', e.target.value)}
                          disabled={!!v.id}
                          className={`h-9 px-3 rounded-lg border ${errors[`vehicle_${index}`] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'} font-mono uppercase text-xs font-extrabold focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500`}
                          placeholder="51H-123.45"
                        />
                        {errors[`vehicle_${index}`] && <span className="text-[10px] text-rose-600 font-semibold mt-0.5">{errors[`vehicle_${index}`]}</span>}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-600">Hãng xe</label>
                        <input
                          value={v.make}
                          onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] outline-none transition-all placeholder:text-slate-400"
                          placeholder="Toyota, Honda..."
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-600">Dòng xe (Model)</label>
                        <input
                          value={v.model}
                          onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] outline-none transition-all placeholder:text-slate-400"
                          placeholder="Camry, CR-V..."
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-600">Màu sắc</label>
                        <input
                          value={v.color}
                          onChange={(e) => handleVehicleChange(index, 'color', e.target.value)}
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] outline-none transition-all placeholder:text-slate-400"
                          placeholder="Trắng, Đen, Bạc..."
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-600">Cỡ xe</label>
                        <select
                          value={v.vehicleSize}
                          onChange={(e) => handleVehicleChange(index, 'vehicleSize', e.target.value)}
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] outline-none transition-all cursor-pointer"
                        >
                          <option value="SMALL">Nhỏ (Mini, Hatchback)</option>
                          <option value="MEDIUM">Vừa (Sedan, Crossover)</option>
                          <option value="LARGE">Lớn (CUV, MPV)</option>
                          <option value="SUV">SUV (7 chỗ, Khung gầm rời)</option>
                          <option value="TRUCK">Bán tải (Pickup, Van)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                
                {vehicles.length === 0 && (
                  <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                    Chưa đăng ký phương tiện nào. Bấm "+ Thêm xe" để bổ sung ngay.
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions (Sticky bottom) */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 backdrop-blur-xs flex flex-wrap items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            form="customer-form"
            type="submit"
            disabled={loading}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-60 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            )}
            <span>{initialData ? 'Cập nhật hồ sơ khách hàng' : 'Lưu khách hàng & Phương tiện'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
