import React, { useState, useMemo } from 'react';
import ComboBox from '@/components/shared/ComboBox';
import {
  validateName,
  validatePhone,
  validateEmail,
  validateLicensePlate,
  validateRequired,
} from '@/lib/utils/validators';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  services?: Array<{id: number, name: string}>;
  customers?: any[];
}

export default function TowInIntakeModal({ isOpen, onClose, onSubmit, loading, services = [], customers = [] }: Props) {
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    customerId: '',
    vehicleId: '',
    towCompany: '',
    notes: '',
    vehicleCondition: '',
    // New customer/vehicle fields
    fullName: '',
    phone: '',
    email: '',
    licensePlate: '',
    make: '',
    model: '',
  });

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id.toString() === formData.customerId.toString());
  }, [customers, formData.customerId]);

  const customerOptions = useMemo(() => {
    return customers.map(c => ({
      id: c.id,
      label: `${c.fullName} - ${c.phone}`
    }));
  }, [customers]);

  const vehicleOptions = useMemo(() => {
    if (!selectedCustomer || !selectedCustomer.vehicles) return [];
    return selectedCustomer.vehicles.map((v: any) => ({
      id: v.id,
      label: `${v.licensePlate} (${v.make} ${v.model})`
    }));
  }, [selectedCustomer]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const towErr = validateRequired(formData.towCompany, 'Đơn vị kéo xe / Người bàn giao');
    if (towErr) errs.towCompany = towErr;

    if (isNewCustomer) {
      const nameErr = validateName(formData.fullName, 'Họ tên');
      if (nameErr) errs.fullName = nameErr;
      const phoneErr = validatePhone(formData.phone, true, 'Số điện thoại');
      if (phoneErr) errs.phone = phoneErr;
      const emailErr = validateEmail(formData.email, 'Email', false);
      if (emailErr) errs.email = emailErr;
      const plateErr = validateLicensePlate(formData.licensePlate, true, 'Biển số');
      if (plateErr) errs.licensePlate = plateErr;
      const makeErr = validateRequired(formData.make, 'Hãng xe');
      if (makeErr) errs.make = makeErr;
      const modelErr = validateRequired(formData.model, 'Dòng xe');
      if (modelErr) errs.model = modelErr;
    } else {
      if (!formData.customerId) errs.customerId = 'Vui lòng chọn khách hàng';
      if (!formData.vehicleId) errs.vehicleId = 'Vui lòng chọn phương tiện';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    const payload: any = {
      intakeType: 'TOW_IN',
      arrivedAt: new Date().toISOString(),
      towCompany: formData.towCompany,
      notes: formData.vehicleCondition.trim() 
        ? `[Tình trạng xe]: ${formData.vehicleCondition}\n\n[Ghi chú]: ${formData.notes}` 
        : formData.notes,
      serviceIds: serviceIds.length > 0 ? serviceIds : undefined,
    };

    if (isNewCustomer) {
      payload.newCustomer = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
      };
      payload.newVehicle = {
        licensePlate: formData.licensePlate,
        make: formData.make,
        model: formData.model,
      };
    } else {
      payload.customerId = Number(formData.customerId);
      payload.vehicleId = Number(formData.vehicleId);
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-container-lowest">
          <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">local_shipping</span>
            Tiếp nhận Xe cứu hộ
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container text-secondary cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          <form id="towin-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 sm:gap-6">
            
            <div className="bg-tertiary-container/30 border border-tertiary-container rounded-lg p-4">
              <label className="block text-label-sm font-bold text-on-surface mb-1">Đơn vị kéo xe / Người bàn giao *</label>
              <input
                name="towCompany"
                value={formData.towCompany}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest ${fieldErrors.towCompany ? 'border-rose-400' : 'border-outline'}`}
                placeholder="VD: Cứu hộ ABC (Anh Tú - 090...)"
              />
              {fieldErrors.towCompany && <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.towCompany}</p>}
            </div>

            {/* Toggle Existing vs New Customer */}
            <div className="flex bg-surface-container-low p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setIsNewCustomer(false);
                  setFieldErrors((prev) => ({ towCompany: prev.towCompany || '' }));
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                  !isNewCustomer ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:bg-surface-variant/50'
                }`}
              >
                Khách hàng đã có
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNewCustomer(true);
                  setFieldErrors((prev) => ({ towCompany: prev.towCompany || '' }));
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                  isNewCustomer ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:bg-surface-variant/50'
                }`}
              >
                Khách hàng mới
              </button>
            </div>

            {isNewCustomer ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <h3 className="text-label-lg font-bold text-on-surface mb-2">Thông tin Khách hàng</h3>
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-secondary mb-1">Họ tên *</label>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest ${fieldErrors.fullName ? 'border-rose-400' : 'border-outline'}`}
                    />
                    {fieldErrors.fullName && <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-secondary mb-1">Số điện thoại *</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest ${fieldErrors.phone ? 'border-rose-400' : 'border-outline'}`}
                    />
                    {fieldErrors.phone && <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.phone}</p>}
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-label-sm font-medium text-secondary mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest ${fieldErrors.email ? 'border-rose-400' : 'border-outline'}`}
                    />
                    {fieldErrors.email && <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-outline-variant pt-4 mt-2">
                  <div className="col-span-1 sm:col-span-2">
                    <h3 className="text-label-lg font-bold text-on-surface mb-2">Thông tin Xe</h3>
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-secondary mb-1">Biển số *</label>
                    <input
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest uppercase ${fieldErrors.licensePlate ? 'border-rose-400' : 'border-outline'}`}
                    />
                    {fieldErrors.licensePlate && <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.licensePlate}</p>}
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-secondary mb-1">Hãng xe *</label>
                    <input
                      name="make"
                      value={formData.make}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest ${fieldErrors.make ? 'border-rose-400' : 'border-outline'}`}
                      placeholder="VD: Toyota"
                    />
                    {fieldErrors.make && <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.make}</p>}
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-secondary mb-1">Dòng xe *</label>
                    <input
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest ${fieldErrors.model ? 'border-rose-400' : 'border-outline'}`}
                      placeholder="VD: Camry"
                    />
                    {fieldErrors.model && <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.model}</p>}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-label-sm font-medium text-secondary mb-1">Khách hàng *</label>
                  <ComboBox
                    options={customerOptions}
                    value={formData.customerId}
                    onChange={(val) => {
                      setFormData({ ...formData, customerId: val.toString(), vehicleId: '' });
                      setFieldErrors((prev) => ({ ...prev, customerId: '', vehicleId: '' }));
                    }}
                    placeholder="Tìm theo tên hoặc số điện thoại..."
                  />
                  {fieldErrors.customerId && <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.customerId}</p>}
                </div>
                <div>
                  <label className="block text-label-sm font-medium text-secondary mb-1">Xe *</label>
                  <ComboBox
                    options={vehicleOptions}
                    value={formData.vehicleId}
                    onChange={(val) => {
                      setFormData({ ...formData, vehicleId: val.toString() });
                      setFieldErrors((prev) => ({ ...prev, vehicleId: '' }));
                    }}
                    placeholder={formData.customerId ? "Chọn xe..." : "Vui lòng chọn khách hàng trước"}
                  />
                  {fieldErrors.vehicleId && <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.vehicleId}</p>}
                </div>
              </div>
            )}

            <div className="border-t border-outline-variant pt-4 mt-2">
              <label className="block text-label-sm font-medium text-secondary mb-2">Dịch vụ yêu cầu (Có thể chọn nhiều)</label>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                  {services.map((svc) => (
                    <label key={svc.id} className="flex items-center gap-2 cursor-pointer text-body-sm">
                      <input
                        type="checkbox"
                        checked={serviceIds.includes(svc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setServiceIds([...serviceIds, svc.id]);
                          } else {
                            setServiceIds(serviceIds.filter(id => id !== svc.id));
                          }
                        }}
                        className="w-4 h-4 text-primary rounded border-outline focus:ring-primary"
                      />
                      {svc.name}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-body-sm text-secondary italic">Đang tải danh sách dịch vụ...</div>
              )}
            </div>

            <div className="border-t border-outline-variant pt-4 mt-2">
              <label className="block text-label-sm font-medium text-secondary mb-1">Mô tả tình trạng xe</label>
              <textarea
                name="vehicleCondition"
                value={formData.vehicleCondition}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest mb-4"
                placeholder="Mô tả các vấn đề về tình trạng xe lúc tiếp nhận (trầy xước, móp méo...)"
              />
              
              <label className="block text-label-sm font-medium text-secondary mb-1">Ghi chú tiếp nhận</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest"
                placeholder="Nhu cầu sửa chữa, hiện trạng sơ bộ..."
              />
            </div>
          </form>
        </div>

        <div className="p-4 sm:p-5 border-t border-outline-variant bg-surface-container-lowest flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 font-semibold text-secondary hover:bg-surface-container rounded-lg cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="towin-form"
            disabled={loading}
            className="min-h-[40px] px-6 py-2 font-semibold text-on-primary bg-primary rounded-lg hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>}
            Tạo phiếu tiếp nhận xe cứu hộ
          </button>
        </div>
      </div>
    </div>
  );
}
