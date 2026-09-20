import React, { useState, useEffect } from 'react';

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
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    const validVehicles = [];
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const hasAnyField = v.licensePlate || v.make || v.model || v.color;
      if (hasAnyField && !v.licensePlate.trim()) {
        newErrors[`vehicle_${i}`] = 'Vui lòng nhập biển số xe nếu bạn điền thông tin khác';
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
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        vehicles: validVehicles.map(v => ({
          id: v.id,
          licensePlate: v.licensePlate,
          make: v.make,
          model: v.model,
          color: v.color,
          vehicleSize: v.vehicleSize,
        })),
      };

      await onSave(payload, initialData?.id);
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu khách hàng';
      setErrors({ api: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-5xl rounded-2xl shadow-lg border border-outline-variant overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-headline-md font-headline-md font-bold text-on-surface">
            {initialData ? 'Chỉnh sửa Khách hàng & Phương tiện' : 'Thêm khách hàng mới'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {errors.api && (
            <div className="mb-6 p-3 bg-error-container text-error rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="text-body-md font-medium">{errors.api}</span>
            </div>
          )}
          
          <form id="customer-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Customer Section */}
            <div>
              <h3 className="text-title-sm font-title-sm text-primary mb-3">1. Thông tin Khách hàng (Bắt buộc)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-label-md font-label-md text-on-surface-variant">Họ và tên *</label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className={`h-10 px-3 rounded-lg border ${errors.fullName ? 'border-error' : 'border-outline-variant'} bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all`}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && <span className="text-label-sm text-error mt-1">{errors.fullName}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-md font-label-md text-on-surface-variant">Số điện thoại *</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={`h-10 px-3 rounded-lg border ${errors.phone ? 'border-error' : 'border-outline-variant'} bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all`}
                    placeholder="0912345678"
                  />
                  {errors.phone && <span className="text-label-sm text-error mt-1">{errors.phone}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-md font-label-md text-on-surface-variant">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`h-10 px-3 rounded-lg border ${errors.email ? 'border-error' : 'border-outline-variant'} bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all`}
                    placeholder="email@example.com"
                  />
                  {errors.email && <span className="text-label-sm text-error mt-1">{errors.email}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-md font-label-md text-on-surface-variant">Địa chỉ</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Số nhà, đường, quận..."
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-outline-variant w-full"></div>

            {/* Vehicles Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-title-sm font-title-sm text-primary">2. Phương tiện của Khách hàng</h3>
                  <span className="text-label-sm px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant">Tùy chọn</span>
                </div>
                <button
                  type="button"
                  onClick={addVehicle}
                  className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary-container text-label-md font-label-md flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Thêm xe
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {vehicles.map((v, index) => (
                  <div key={index} className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest relative">
                    <button
                      type="button"
                      onClick={() => removeVehicle(index)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full hover:bg-error-container text-error flex items-center justify-center transition-colors"
                      title="Xóa xe này"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <h4 className="text-label-md font-bold mb-3 text-on-surface">Phương tiện #{index + 1}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-label-md font-label-md text-on-surface-variant">Biển số xe</label>
                        <input
                          value={v.licensePlate}
                          onChange={(e) => handleVehicleChange(index, 'licensePlate', e.target.value)}
                          disabled={!!v.id} // Xe cũ đã lưu thì không đổi biển số ở form này
                          className={`h-10 px-3 rounded-lg border ${errors[`vehicle_${index}`] ? 'border-error' : 'border-outline-variant'} bg-surface font-code-mono uppercase focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:bg-surface-container disabled:text-on-surface-variant`}
                          placeholder="30A-123.45"
                        />
                        {errors[`vehicle_${index}`] && <span className="text-label-sm text-error mt-1">{errors[`vehicle_${index}`]}</span>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-label-md font-label-md text-on-surface-variant">Hãng xe</label>
                        <input
                          value={v.make}
                          onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                          className="h-10 px-3 rounded-lg border border-outline-variant bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                          placeholder="Toyota, Honda..."
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-label-md font-label-md text-on-surface-variant">Dòng xe (Model)</label>
                        <input
                          value={v.model}
                          onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                          className="h-10 px-3 rounded-lg border border-outline-variant bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                          placeholder="Vios, CR-V..."
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-label-md font-label-md text-on-surface-variant">Màu sắc</label>
                        <input
                          value={v.color}
                          onChange={(e) => handleVehicleChange(index, 'color', e.target.value)}
                          className="h-10 px-3 rounded-lg border border-outline-variant bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                          placeholder="Trắng, Đen, Đỏ..."
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-label-md font-label-md text-on-surface-variant">Cỡ xe</label>
                        <select
                          value={v.vehicleSize}
                          onChange={(e) => handleVehicleChange(index, 'vehicleSize', e.target.value)}
                          className="h-10 px-3 rounded-lg border border-outline-variant bg-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                        >
                          <option value="SMALL">Nhỏ (Mini, Hatchback)</option>
                          <option value="MEDIUM">Vừa (Sedan, Crossover)</option>
                          <option value="LARGE">Lớn (SUV 7 chỗ, Bán tải)</option>
                          <option value="EXTRA_LARGE">Rất lớn (Limousine, Van)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {vehicles.length === 0 && (
                  <div className="text-center p-4 border border-dashed border-outline-variant rounded-xl text-secondary text-body-md">
                    Chưa có phương tiện nào. Bấm "Thêm xe" để bổ sung.
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-lg font-label-md text-secondary hover:bg-surface-container-high transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            form="customer-form"
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg font-label-md bg-primary hover:bg-primary/90 text-on-primary shadow-sm disabled:opacity-70 flex items-center gap-2 transition-all"
          >
            {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : null}
            <span>{initialData ? 'Lưu thay đổi' : 'Lưu Khách hàng'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
