import React, { useState, useMemo, useEffect } from 'react';
import ComboBox from '@/components/shared/ComboBox';
import QuickAddVehicleModal, { QuickVehicleCreated } from './QuickAddVehicleModal';
import {
  validateName,
  validatePhone,
  validateEmail,
  validateLicensePlate,
  validateRequired,
} from '@/lib/utils/validators';

export interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  services?: Array<{ id: number; name: string }>;
  customers?: any[];
  onVehicleAdded?: (customerId: number, vehicle: QuickVehicleCreated) => void;
}

interface BaseIntakeModalProps extends IntakeModalProps {
  mode: 'WALK_IN' | 'TOW_IN';
}

const INITIAL_FORM_DATA = {
  customerId: '',
  vehicleId: '',
  towCompany: '',
  notes: '',
  vehicleCondition: '',
  fullName: '',
  phone: '',
  email: '',
  licensePlate: '',
  make: '',
  model: '',
};

export default function BaseIntakeModal({
  mode,
  isOpen,
  onClose,
  onSubmit,
  loading,
  services = [],
  customers = [],
  onVehicleAdded,
}: BaseIntakeModalProps) {
  const isTowIn = mode === 'TOW_IN';
  const formId = isTowIn ? 'towin-form' : 'walkin-form';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [quickVehicleOpen, setQuickVehicleOpen] = useState(false);
  const [addedVehiclesByCustomer, setAddedVehiclesByCustomer] = useState<Record<string, any[]>>({});
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsNewCustomer(false);
      setServiceIds([]);
      setFieldErrors({});
      setStepError(null);
      setFormData(INITIAL_FORM_DATA);
    }
  }, [isOpen]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id.toString() === formData.customerId.toString());
  }, [customers, formData.customerId]);

  const customerOptions = useMemo(() => {
    return customers.map((c) => ({
      id: c.id,
      label: `${c.fullName} - ${c.phone}`,
    }));
  }, [customers]);

  const availableVehicles = useMemo(() => {
    if (!formData.customerId) return [];
    const baseVehicles = selectedCustomer?.vehicles || [];
    const localAdded = addedVehiclesByCustomer[formData.customerId] || [];
    const merged = [...baseVehicles];
    for (const v of localAdded) {
      if (!merged.some((item: any) => Number(item.id) === Number(v.id))) {
        merged.push(v);
      }
    }
    return merged.filter((v: any) => v.isActive !== false && v.status !== 'INACTIVE');
  }, [formData.customerId, selectedCustomer, addedVehiclesByCustomer]);

  const selectedVehicle = useMemo(() => {
    return availableVehicles.find((v: any) => v.id.toString() === formData.vehicleId.toString());
  }, [availableVehicles, formData.vehicleId]);

  const selectedServices = useMemo(() => {
    return services.filter((s) => serviceIds.includes(s.id));
  }, [services, serviceIds]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (stepError) setStepError(null);
  };

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};

    if (isTowIn) {
      const towErr = validateRequired(formData.towCompany, 'Đơn vị kéo xe / Người bàn giao');
      if (towErr) errs.towCompany = towErr;
    }

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
      if (!formData.vehicleId) errs.vehicleId = 'Vui lòng chọn hoặc thêm mới phương tiện';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return false;
    }
    setFieldErrors({});
    setStepError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    if (serviceIds.length === 0 && !formData.vehicleCondition.trim() && !formData.notes.trim()) {
      setStepError('Vui lòng chọn ít nhất 1 dịch vụ hoặc mô tả tình trạng xe / ghi chú tiếp nhận.');
      return false;
    }
    setStepError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    const payload: any = {
      intakeType: mode,
      arrivedAt: new Date().toISOString(),
      ...(isTowIn ? { towCompany: formData.towCompany } : {}),
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

  const handleVehicleCreated = (created: QuickVehicleCreated) => {
    const cid = formData.customerId;
    setAddedVehiclesByCustomer((prev) => ({
      ...prev,
      [cid]: [...(prev[cid] || []), created],
    }));
    setFormData((prev) => ({ ...prev, vehicleId: String(created.id) }));
    setFieldErrors((prev) => ({ ...prev, vehicleId: '' }));
    if (onVehicleAdded) {
      onVehicleAdded(Number(cid), created);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isTowIn ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {isTowIn ? 'local_shipping' : 'directions_walk'}
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isTowIn ? 'Tiếp nhận Xe cứu hộ' : 'Tiếp nhận Khách vãng lai'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isTowIn
                    ? 'Quy trình 3 bước — Ghi nhận xe cứu hộ, dịch vụ dự kiến & tạo phiếu vào hàng đợi'
                    : 'Quy trình 3 bước — Tiếp nhận nhanh khách hàng đến trực tiếp tại xưởng'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Stepper Indicator */}
          <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-xl mx-auto pb-2">
              <div
                className={`flex items-center gap-2 ${
                  step === 1 ? 'text-blue-600 font-bold' : step > 1 ? 'text-blue-600 font-semibold' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === 1
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {step > 1 ? <span className="material-symbols-outlined text-[15px]">check</span> : '1'}
                </div>
                <span className="text-xs">1. Khách &amp; Xe</span>
              </div>

              <div className={`flex-1 h-[2px] ${step > 1 ? 'bg-blue-500' : 'bg-slate-200'}`} />

              <div
                className={`flex items-center gap-2 ${
                  step === 2 ? 'text-blue-600 font-bold' : step > 2 ? 'text-blue-600 font-semibold' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === 2
                      ? 'bg-blue-600 text-white shadow-sm'
                      : step > 2
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > 2 ? <span className="material-symbols-outlined text-[15px]">check</span> : '2'}
                </div>
                <span className="text-xs">2. Dịch vụ &amp; Tình trạng</span>
              </div>

              <div className={`flex-1 h-[2px] ${step > 2 ? 'bg-blue-500' : 'bg-slate-200'}`} />

              <div className={`flex items-center gap-2 ${step === 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === 3 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  3
                </div>
                <span className="text-xs">3. Xác nhận phiếu</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {stepError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{stepError}</span>
              </div>
            )}

            <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* STEP 1: KHÁCH HÀNG & PHƯƠNG TIỆN */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">1. Thông tin khách hàng &amp; phương tiện</h3>
                    </div>
                  </div>

                  {isTowIn && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                      <label className="block text-xs font-bold text-amber-900 mb-1.5">
                        Đơn vị kéo xe / Người bàn giao <span className="text-rose-500">*</span>
                      </label>
                      <input
                        name="towCompany"
                        value={formData.towCompany}
                        onChange={handleChange}
                        className={`w-full h-10 px-3.5 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${
                          fieldErrors.towCompany ? 'border-rose-400' : 'border-amber-200'
                        }`}
                        placeholder="VD: Cứu hộ ABC (Anh Tú - 090...)"
                      />
                      {fieldErrors.towCompany && (
                        <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.towCompany}</p>
                      )}
                    </div>
                  )}

                  {/* Toggle Existing vs New Customer */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewCustomer(false);
                        setFieldErrors((prev): Record<string, string> =>
                          prev.towCompany ? { towCompany: prev.towCompany } : {}
                        );
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        !isNewCustomer ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">person_check</span>
                      Khách hàng đã có
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewCustomer(true);
                        setFieldErrors((prev): Record<string, string> =>
                          prev.towCompany ? { towCompany: prev.towCompany } : {}
                        );
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isNewCustomer ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">person_add</span>
                      Khách hàng mới
                    </button>
                  </div>

                  {isNewCustomer ? (
                    <div className="space-y-4">
                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base text-blue-600">badge</span>
                          Thông tin Khách hàng mới
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Họ tên <span className="text-rose-500">*</span>
                            </label>
                            <input
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleChange}
                              placeholder="VD: Nguyễn Văn A"
                              className={`w-full h-10 px-3 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${
                                fieldErrors.fullName ? 'border-rose-400' : 'border-slate-200'
                              }`}
                            />
                            {fieldErrors.fullName && (
                              <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.fullName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Số điện thoại <span className="text-rose-500">*</span>
                            </label>
                            <input
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="VD: 0909123456"
                              className={`w-full h-10 px-3 border rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${
                                fieldErrors.phone ? 'border-rose-400' : 'border-slate-200'
                              }`}
                            />
                            {fieldErrors.phone && (
                              <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.phone}</p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Email (tùy chọn)</label>
                            <input
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="VD: khachhang@email.com"
                              className={`w-full h-10 px-3 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${
                                fieldErrors.email ? 'border-rose-400' : 'border-slate-200'
                              }`}
                            />
                            {fieldErrors.email && (
                              <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.email}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base text-blue-600">directions_car</span>
                          Thông tin Phương tiện
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Biển số <span className="text-rose-500">*</span>
                            </label>
                            <input
                              name="licensePlate"
                              value={formData.licensePlate}
                              onChange={handleChange}
                              placeholder="VD: 51A-123.45"
                              className={`w-full h-10 px-3 border rounded-xl text-xs font-mono uppercase bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${
                                fieldErrors.licensePlate ? 'border-rose-400' : 'border-slate-200'
                              }`}
                            />
                            {fieldErrors.licensePlate && (
                              <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.licensePlate}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Hãng xe <span className="text-rose-500">*</span>
                            </label>
                            <input
                              name="make"
                              value={formData.make}
                              onChange={handleChange}
                              placeholder="VD: Toyota"
                              className={`w-full h-10 px-3 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${
                                fieldErrors.make ? 'border-rose-400' : 'border-slate-200'
                              }`}
                            />
                            {fieldErrors.make && (
                              <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.make}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Dòng xe <span className="text-rose-500">*</span>
                            </label>
                            <input
                              name="model"
                              value={formData.model}
                              onChange={handleChange}
                              placeholder="VD: Camry"
                              className={`w-full h-10 px-3 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${
                                fieldErrors.model ? 'border-rose-400' : 'border-slate-200'
                              }`}
                            />
                            {fieldErrors.model && (
                              <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.model}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Khách hàng <span className="text-rose-500">*</span>
                        </label>
                        <ComboBox
                          options={customerOptions}
                          value={formData.customerId}
                          onChange={(val) => {
                            setFormData((prev) => ({ ...prev, customerId: val.toString(), vehicleId: '' }));
                            setFieldErrors((prev) => ({ ...prev, customerId: '', vehicleId: '' }));
                          }}
                          placeholder="Tìm theo tên hoặc số điện thoại..."
                        />
                        {fieldErrors.customerId && (
                          <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.customerId}</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Phương tiện <span className="text-rose-500">*</span>
                          </label>
                          {formData.customerId && (
                            <button
                              type="button"
                              onClick={() => setQuickVehicleOpen(true)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">add</span>
                              + Thêm phương tiện
                            </button>
                          )}
                        </div>

                        {!formData.customerId ? (
                          <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                            <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">person_search</span>
                            <p className="text-sm font-semibold text-slate-700">Chưa chọn khách hàng</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Vui lòng tìm và chọn khách hàng ở trên để hiển thị hoặc thêm phương tiện mới.
                            </p>
                          </div>
                        ) : availableVehicles.length === 0 ? (
                          <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                            <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">directions_car</span>
                            <p className="text-sm font-semibold text-slate-700">Chưa có phương tiện trong hồ sơ</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Khách hàng này chưa có xe hoặc vừa đến bằng xe mới.
                            </p>
                            <button
                              type="button"
                              onClick={() => setQuickVehicleOpen(true)}
                              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                              + Thêm phương tiện
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availableVehicles.map((v: any) => {
                              const isSelected = formData.vehicleId === v.id.toString();
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, vehicleId: v.id.toString() }));
                                    setFieldErrors((prev) => ({ ...prev, vehicleId: '' }));
                                  }}
                                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-50/30 shadow-2xs'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono font-bold text-slate-900">
                                        {v.licensePlate}
                                      </span>
                                      {v.color && <span className="text-[11px] text-slate-500">• {v.color}</span>}
                                    </div>
                                    <p className="font-bold text-xs text-slate-900 mt-1.5 truncate">
                                      {v.make} {v.model}
                                    </p>
                                  </div>
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                                    }`}
                                  >
                                    {isSelected && <span className="material-symbols-outlined text-[13px]">check</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {fieldErrors.vehicleId && (
                          <p className="text-[11px] font-semibold text-rose-600 mt-1.5">{fieldErrors.vehicleId}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: DỊCH VỤ & TÌNH TRẠNG XE */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">2. Dịch vụ yêu cầu &amp; Tình trạng tiếp nhận</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-8">
                      Chọn các hạng mục dịch vụ dự kiến hoặc ghi rõ tình trạng xe thực tế lúc tiếp nhận
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Dịch vụ yêu cầu (Có thể chọn nhiều)
                    </label>
                    {services.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {services.map((svc) => {
                          const checked = serviceIds.includes(svc.id);
                          return (
                            <label
                              key={svc.id}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-blue-50/70 border-blue-500 text-blue-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (stepError) setStepError(null);
                                  if (e.target.checked) {
                                    setServiceIds((prev) => [...prev, svc.id]);
                                  } else {
                                    setServiceIds((prev) => prev.filter((id) => id !== svc.id));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                              />
                              <span className="truncate">{svc.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic">Đang tải danh sách dịch vụ...</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Mô tả tình trạng xe</label>
                      <textarea
                        name="vehicleCondition"
                        value={formData.vehicleCondition}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white outline-none"
                        placeholder="Mô tả các vấn đề về tình trạng xe lúc tiếp nhận (trầy xước, móp méo, đèn báo lỗi...)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi chú tiếp nhận</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white outline-none"
                        placeholder="Nhu cầu sửa chữa, yêu cầu riêng của khách hàng..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: XÁC NHẬN PHIẾU TIẾP NHẬN */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">3. Xác nhận thông tin phiếu tiếp nhận</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-8">
                      Kiểm tra lại thông tin trước khi đưa xe vào hàng đợi tiếp nhận (QUEUED)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 block">
                        Khách hàng &amp; Hình thức
                      </span>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Hình thức:</span>
                        <span className="font-bold text-slate-900">
                          {isTowIn ? 'Xe cứu hộ (TOW_IN)' : 'Khách vãng lai (WALK_IN)'}
                        </span>
                      </div>
                      {isTowIn && (
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">Đơn vị kéo xe:</span>
                          <span className="font-semibold text-amber-800 text-right">{formData.towCompany}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Khách hàng:</span>
                        <span className="font-bold text-slate-900 text-right">
                          {isNewCustomer ? formData.fullName : selectedCustomer?.fullName || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Số điện thoại:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {isNewCustomer ? formData.phone : selectedCustomer?.phone || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 block">
                        Phương tiện tiếp nhận
                      </span>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-500">Biển số:</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-slate-900">
                          {isNewCustomer
                            ? formData.licensePlate.toUpperCase()
                            : selectedVehicle?.licensePlate || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Hãng &amp; Dòng xe:</span>
                        <span className="font-bold text-slate-900 text-right">
                          {isNewCustomer
                            ? `${formData.make} ${formData.model}`
                            : `${selectedVehicle?.make || ''} ${selectedVehicle?.model || ''}`.trim() || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Trạng thái sau tạo:</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                          Chờ xử lý (QUEUED)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 block">
                      Dịch vụ yêu cầu ({selectedServices.length})
                    </span>
                    {selectedServices.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedServices.map((svc) => (
                          <span
                            key={svc.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800"
                          >
                            <span className="material-symbols-outlined text-[14px] text-blue-600">check_circle</span>
                            {svc.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">Chưa chọn dịch vụ cụ thể — Kiểm tra theo mô tả tình trạng xe.</p>
                    )}
                  </div>

                  {(formData.vehicleCondition.trim() || formData.notes.trim()) && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 block">
                        Tình trạng xe &amp; Ghi chú
                      </span>
                      {formData.vehicleCondition.trim() && (
                        <p className="text-slate-700">
                          <strong>Tình trạng:</strong> {formData.vehicleCondition}
                        </p>
                      )}
                      {formData.notes.trim() && (
                        <p className="text-slate-700">
                          <strong>Ghi chú:</strong> {formData.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setStepError(null);
                  setStep((step - 1) as 1 | 2 | 3);
                }}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Quay lại
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
              >
                Hủy
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                Tiếp tục
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            ) : (
              <button
                type="submit"
                form={formId}
                disabled={loading}
                className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {loading && <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>}
                {isTowIn ? 'Tạo phiếu tiếp nhận xe cứu hộ' : 'Tạo phiếu tiếp nhận'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick-Add Vehicle Sub-Modal */}
      <QuickAddVehicleModal
        isOpen={quickVehicleOpen}
        customerId={formData.customerId}
        customerName={selectedCustomer?.fullName}
        onClose={() => setQuickVehicleOpen(false)}
        onSuccess={handleVehicleCreated}
      />
    </>
  );
}
