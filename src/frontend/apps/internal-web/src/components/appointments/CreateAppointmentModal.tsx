import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { createAppointment } from '@/store/slices/appointmentSlice';
import api from '@/lib/axios';
import { warrantyApi, WarrantyItem, getWarrantyCompositeKey } from '@/lib/api/warranty.api';
import toast from 'react-hot-toast';

interface CreateAppointmentModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: Date;
  selectedTime?: string;
}

const MORNING_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'];
const AFTERNOON_SLOTS = ['13:30', '14:00', '14:30', '15:00', '16:00'];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

const isBookingSlotInPast = (date: Date, slot: string): boolean => {
  const [hh, mm] = slot.split(':').map(Number);
  const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh || 0, mm || 0, 0, 0);
  return slotDate.getTime() < Date.now();
};

const CheckIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className="w-3 h-3"
  >
    <path
      d="M3.5 8.5L6.5 11.5L12.5 4.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const getServiceIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('bảo dưỡng') || lower.includes('định kỳ')) return 'verified';
  if (lower.includes('phanh') || lower.includes('thắng')) return 'directions_car';
  if (lower.includes('dầu') || lower.includes('nhớt')) return 'oil_barrel';
  if (lower.includes('điều hòa') || lower.includes('lạnh') || lower.includes('gas')) return 'ac_unit';
  if (lower.includes('buồng đốt') || lower.includes('kim phun') || lower.includes('vệ sinh')) return 'cleaning_services';
  if (lower.includes('lốp') || lower.includes('bánh')) return 'tire_repair';
  return 'build_circle';
};

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function CreateAppointmentModal({
  onClose,
  onSuccess,
  selectedDate,
  selectedTime,
}: CreateAppointmentModalProps) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<Date>(() => (selectedDate ? new Date(selectedDate) : new Date()));
  const [bookingTime, setBookingTime] = useState<string>(selectedTime || '08:00');
  const [notes, setNotes] = useState<string>('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  // Warranty State (UC-82)
  const [isWarranty, setIsWarranty] = useState<boolean>(false);
  const [warrantyItems, setWarrantyItems] = useState<WarrantyItem[]>([]);
  const [warrantyLoading, setWarrantyLoading] = useState(false);
  const [selectedWarrantyItemIds, setSelectedWarrantyItemIds] = useState<string[]>([]);
  const [symptomsDescription, setSymptomsDescription] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');

  // Quick-add vehicle modal state
  const [quickVehicleOpen, setQuickVehicleOpen] = useState(false);
  const [savingQuickVehicle, setSavingQuickVehicle] = useState(false);
  const [quickVehiclePlateError, setQuickVehiclePlateError] = useState<string | null>(null);
  const [quickVehicleForm, setQuickVehicleForm] = useState({
    licensePlate: '',
    make: '',
    model: '',
    color: '',
    vehicleSize: 'MEDIUM' as 'SMALL' | 'MEDIUM' | 'LARGE',
  });

  useEffect(() => {
    const fetchData = async () => {
      setFetchingData(true);
      try {
        const [customersRes, servicesRes] = await Promise.all([
          api.get('/api/customers', { params: { limit: 50 } }),
          api.get('/api/services', { params: { limit: 100, isActive: 'true' } }),
        ]);
        setCustomers(customersRes.data.data || []);
        const rawServices = servicesRes.data.data || [];
        setServices(rawServices.filter((s: any) => s.isActive !== false));
      } catch (err) {
        console.error('Error fetching data', err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  const loadVehicleWarranty = React.useCallback(async (vId: number) => {
    setWarrantyLoading(true);
    try {
      const res = await warrantyApi.getVehicleWarrantyEligibility(vId);
      const eligible = (res.items || []).filter((item) => item.status === 'VALID');
      setWarrantyItems(eligible);
    } catch (err: any) {
      console.warn('Không thể tải thông tin bảo hành xe:', err?.response?.data?.message || err?.message);
      setWarrantyItems([]);
    } finally {
      setWarrantyLoading(false);
    }
  }, []);

  // Fetch eligible warranty items whenever vehicleId changes
  useEffect(() => {
    if (vehicleId) {
      loadVehicleWarranty(Number(vehicleId));
    } else {
      setWarrantyItems([]);
    }
  }, [vehicleId, loadVehicleWarranty]);

  // Debounced server-side customer search so customers beyond the initial batch are reachable
  useEffect(() => {
    const q = customerSearch.trim();
    if (q.length < 2) return;
    // Skip if input already matches a selected customer's exact display label
    if (customers.some((c) => `${c.fullName} - ${c.phone}` === q)) return;

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/api/customers', {
          params: { search: q, limit: 50 },
        });
        const fetched: any[] = res.data?.data || [];
        if (fetched.length > 0) {
          setCustomers((prev) => {
            const byId = new Map(prev.map((c) => [c.id, c]));
            for (const c of fetched) byId.set(c.id, c);
            return Array.from(byId.values());
          });
        }
      } catch (err) {
        console.error('Customer search error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  const selectedCustomer = customers.find((c) => c.id.toString() === customerId);
  const availableVehicles = selectedCustomer?.vehicles || [];
  const selectedVehicle = availableVehicles.find((v: any) => v.id.toString() === vehicleId);

  const handleToggleService = (serviceId: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleToggleWarrantyItem = (id: string) => {
    setSelectedWarrantyItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!customerId) {
        setError('Vui lòng chọn khách hàng.');
        return;
      }
      if (!vehicleId) {
        setError('Vui lòng chọn một phương tiện để tiếp tục.');
        return;
      }
    }
    if (step === 2) {
      if (isWarranty) {
        if (selectedWarrantyItemIds.length === 0) {
          setError('Vui lòng chọn ít nhất 1 hạng mục dịch vụ/phụ tùng bảo hành.');
          return;
        }
        if (!symptomsDescription.trim()) {
          setError('Vui lòng nhập mô tả chi tiết hiện tượng sự cố.');
          return;
        }
      } else {
        if (selectedServiceIds.length === 0 && !notes.trim()) {
          setError('Vui lòng chọn dịch vụ hoặc mô tả tình trạng xe.');
          return;
        }
      }
    }
    setStep((prev) => (prev === 1 ? 2 : 3));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => (prev === 3 ? 2 : 1));
  };

  const handleSubmit = async () => {
    if (!bookingDate || !bookingTime) {
      setError('Vui lòng chọn ngày và khung giờ tiếp nhận.');
      return;
    }

    const dateStr = toDateStr(bookingDate);
    const selectedDateTime = new Date(`${dateStr}T${bookingTime}`);
    if (selectedDateTime < new Date()) {
      setError('Không thể đặt lịch hẹn trong quá khứ.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        customer_id: Number(customerId),
        vehicle_id: Number(vehicleId),
        scheduled_date: dateStr,
        scheduled_time: bookingTime,
        service_ids: isWarranty ? undefined : selectedServiceIds,
        notes: isWarranty ? symptomsDescription.trim() : notes,
        is_warranty: isWarranty,
      };

      if (isWarranty) {
        payload.warranty_item_ids = selectedWarrantyItemIds;
        payload.symptoms_description = symptomsDescription.trim();
        if (evidenceUrl.trim()) {
          payload.evidence_urls = [evidenceUrl.trim()];
        }
      }

      await dispatch(createAppointment(payload)).unwrap();
      toast.success(
        isWarranty
          ? 'Đặt lịch hẹn bảo hành thành công! Hồ sơ đã được chuyển tới Cố vấn dịch vụ.'
          : 'Đặt lịch hẹn thành công!'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err || 'Đã có lỗi xảy ra';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    if (!quickVehicleForm.licensePlate.trim() || !quickVehicleForm.make.trim() || !quickVehicleForm.model.trim()) {
      toast.error('Vui lòng nhập đầy đủ biển số, hãng xe và dòng xe.');
      return;
    }

    setSavingQuickVehicle(true);
    setQuickVehiclePlateError(null);
    try {
      const res = await api.post(`/api/customers/${customerId}/vehicles`, {
        licensePlate: quickVehicleForm.licensePlate.trim().toUpperCase(),
        make: quickVehicleForm.make.trim(),
        model: quickVehicleForm.model.trim(),
        color: quickVehicleForm.color.trim() || undefined,
        vehicleSize: quickVehicleForm.vehicleSize,
      });
      const created = res.data?.data;
      if (created) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id.toString() === customerId
              ? { ...c, vehicles: [...(c.vehicles || []), created] }
              : c
          )
        );
        setVehicleId(String(created.id));
        setError(null);
      }
      toast.success('Thêm phương tiện mới thành công!');
      setQuickVehicleForm({ licensePlate: '', make: '', model: '', color: '', vehicleSize: 'MEDIUM' });
      setQuickVehiclePlateError(null);
      setQuickVehicleOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể thêm phương tiện';
      setQuickVehiclePlateError(msg);
      toast.error(msg);
    } finally {
      setSavingQuickVehicle(false);
    }
  };

  // Calendar math for active month
  const year = bookingDate.getFullYear();
  const month = bookingDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  return (
    <>
      <div className="fixed inset-0 bg-on-surface/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900">Đặt lịch hẹn mới</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy trình 3 bước đơn giản – Tiết kiệm thời gian, nhận xe đúng hẹn với đội ngũ kỹ thuật viên chuẩn hãng.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl" data-icon="close">close</span>
            </button>
          </div>

          {/* Stepper Header (synchronized with customer-web) */}
          <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              {/* Step 1 Pill */}
              <div
                onClick={() => setStep(1)}
                className={`flex items-center gap-2 cursor-pointer ${
                  step === 1
                    ? 'text-blue-600 font-bold'
                    : step > 1
                    ? 'text-blue-600/80 font-medium'
                    : 'text-slate-400 font-medium'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    step === 1
                      ? 'bg-blue-600 text-white font-bold'
                      : step > 1
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  1
                </div>
                <span className="text-xs">Chọn xe</span>
              </div>

              <div className="w-10 sm:w-12 h-0.5 bg-blue-500/40" />

              {/* Step 2 Pill */}
              <div
                onClick={() => {
                  if (customerId && vehicleId) setStep(2);
                }}
                className={`flex items-center gap-2 cursor-pointer ${
                  step === 2
                    ? 'text-blue-600 font-bold'
                    : step > 2
                    ? 'text-blue-600/80 font-medium'
                    : 'text-slate-400 font-medium'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    step === 2
                      ? 'bg-blue-600 text-white font-bold'
                      : step > 2
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  2
                </div>
                <span className="text-xs">Dịch vụ &amp; Mô tả</span>
              </div>

              <div className="w-10 sm:w-12 h-0.5 bg-blue-500/40" />

              {/* Step 3 Pill */}
              <div
                onClick={() => {
                  if (
                    customerId &&
                    vehicleId &&
                    (isWarranty
                      ? selectedWarrantyItemIds.length > 0 && symptomsDescription.trim()
                      : selectedServiceIds.length > 0 || notes.trim())
                  ) {
                    setStep(3);
                  }
                }}
                className={`flex items-center gap-2 cursor-pointer ${
                  step === 3 ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    step === 3 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  3
                </div>
                <span className="text-xs">Ngày &amp; Giờ</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base" data-icon="error">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: CHỌN KHÁCH HÀNG & XE */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Chọn xe cần làm dịch vụ</h3>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Hồ sơ xe cập nhật
                  </span>
                </div>
                <p className="text-xs text-slate-500 -mt-3">
                  Chọn khách hàng và phương tiện từ hồ sơ đã đăng ký tại xưởng
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Khách hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    list="customers-list"
                    value={customerSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerSearch(val);
                      setError(null);
                      const match = customers.find((c) => `${c.fullName} - ${c.phone}` === val);
                      if (match) {
                        setCustomerId(match.id.toString());
                        setVehicleId('');
                      } else {
                        setCustomerId('');
                        setVehicleId('');
                      }
                    }}
                    disabled={fetchingData}
                    placeholder="-- Nhập tên hoặc SĐT để tìm khách hàng --"
                    className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <datalist id="customers-list">
                    {customers.map((c) => (
                      <option key={c.id} value={`${c.fullName} - ${c.phone}`} />
                    ))}
                  </datalist>
                </div>

                {/* Vehicle Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {!customerId ? (
                    <div className="col-span-full p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                      <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">person_search</span>
                      <p className="text-sm font-semibold text-slate-700">Chưa chọn khách hàng</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Vui lòng tìm và chọn khách hàng ở trên để hiển thị danh sách xe.
                      </p>
                    </div>
                  ) : availableVehicles.length === 0 ? (
                    <div className="col-span-full p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                      <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">directions_car</span>
                      <p className="text-sm font-semibold text-slate-700">Chưa có phương tiện trong hồ sơ</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Khách hàng này chưa đăng ký phương tiện nào trong hệ thống.
                      </p>
                      <button
                        type="button"
                        onClick={() => setQuickVehicleOpen(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        + Thêm phương tiện
                      </button>
                    </div>
                  ) : (
                    availableVehicles.map((v: any) => {
                      const isSelected = vehicleId === v.id.toString();
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setVehicleId(v.id.toString());
                            setError(null);
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/20 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2.5 py-0.5 bg-slate-100 rounded text-xs font-mono font-bold text-slate-800">
                                {v.licensePlate}
                              </span>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <CheckIcon />}
                              </div>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 leading-snug">
                              {v.make} {v.model}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {v.color ? `Màu: ${v.color}` : 'Phương tiện'} {v.year ? `• Đời: ${v.year}` : ''}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-emerald-700 flex items-center gap-1 font-medium">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Hoạt động
                            </span>
                            <span className={isSelected ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                              {isSelected ? 'Đang chọn' : 'Chọn xe'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: DỊCH VỤ YÊU CẦU & MÔ TẢ TÌNH TRẠNG */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Dịch vụ yêu cầu &amp; Mô tả tình trạng</h3>
                </div>
                <p className="text-xs text-slate-500 -mt-3">
                  Lựa chọn đặt lịch bảo dưỡng định kỳ, dịch vụ sửa chữa hoặc tiếp nhận bảo hành xe (0đ)
                </p>

                {/* Option switch: Dịch vụ thông thường vs Bảo hành */}
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setIsWarranty(false)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !isWarranty
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">build_circle</span>
                    Dịch vụ thông thường
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWarranty(true);
                      if (vehicleId) loadVehicleWarranty(Number(vehicleId));
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isWarranty
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">verified_user</span>
                    Lịch hẹn Bảo hành (0 đồng)
                  </button>
                </div>

                {!isWarranty ? (
                  <>
                    {fetchingData ? (
                      <p className="text-xs text-slate-500">Đang tải danh sách dịch vụ...</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[280px] overflow-y-auto pr-1">
                        {services.map((srv, idx) => {
                          const isChecked = selectedServiceIds.includes(srv.id);
                          return (
                            <div
                              key={srv.id}
                              onClick={() => handleToggleService(srv.id)}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                isChecked
                                  ? 'border-blue-600 bg-blue-50/20 shadow-xs'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 ${
                                  isChecked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                                }`}
                              >
                                {isChecked && <CheckIcon />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="material-symbols-outlined text-blue-600 text-[16px]">
                                    {getServiceIcon(srv.name || '')}
                                  </span>
                                  <h4 className="font-bold text-xs text-slate-900">{srv.name}</h4>
                                  {idx === 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                                      Phổ biến
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                  {srv.description || 'Kiểm tra và thực hiện theo tiêu chuẩn kỹ thuật của xưởng.'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Detailed Symptom Notes Textarea */}
                    <div>
                      <div className="mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Mô tả chi tiết tình trạng xe (Tiếng kêu lạ, đèn cảnh báo taplo, yêu cầu riêng...)
                        </label>
                      </div>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
                        placeholder="Nhập mô tả tình trạng xe của khách hàng (nếu có)..."
                      />
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        Nhân viên có thể ghi chú thêm thông tin phản ánh từ khách hàng qua điện thoại.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Explanatory Warranty Banner */}
                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
                      <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">verified_user</span>
                      <div>
                        <span className="font-bold text-emerald-900">Tiếp nhận lịch hẹn Bảo hành xe chính hãng (0 đồng)</span>
                        <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                          Áp dụng cho các phụ tùng hoặc dịch vụ còn trong hạn bảo hành hoặc diện đề xuất Thiện chí. Miễn phí kiểm tra và linh kiện thay thế 100%.
                        </p>
                      </div>
                    </div>

                    {/* Warranty Items List */}
                    {warrantyLoading ? (
                      <div className="p-8 text-center text-slate-500">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs">Đang kiểm tra các hạng mục bảo hành của xe...</p>
                      </div>
                    ) : warrantyItems.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                        <span className="material-symbols-outlined text-3xl text-slate-400">inventory_2</span>
                        <p className="text-xs font-bold text-slate-700">Xe này chưa có hạng mục nào trong thời hạn bảo hành</p>
                        <p className="text-[11px] text-slate-500">
                          Nếu xe gặp sự cố phát sinh ngoài chính sách, vui lòng chuyển sang "Dịch vụ thông thường" bên trên để tạo lịch kiểm tra.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Chọn các hạng mục cần bảo hành <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                          {warrantyItems.map((item) => {
                            const compositeKey = getWarrantyCompositeKey(item);
                            const isChecked = selectedWarrantyItemIds.includes(compositeKey);
                            const isGreen = item.status === 'VALID';
                            return (
                              <div
                                key={compositeKey}
                                onClick={() => handleToggleWarrantyItem(compositeKey)}
                                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                  isChecked
                                    ? 'border-emerald-600 bg-emerald-50/30 shadow-xs'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 ${
                                    isChecked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                                  }`}
                                >
                                  {isChecked && <CheckIcon />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                    <span
                                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                        item.type === 'SERVICE' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                                      }`}
                                    >
                                      {item.type === 'SERVICE' ? 'Dịch vụ' : 'Phụ tùng'}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                      Còn hạn ({item.warrantyMonths} tháng)
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{item.name}</h4>
                                  <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                                    <div>Phiếu gốc: <strong className="text-slate-700">{item.woNumber}</strong></div>
                                    <div className="font-mono tabular-nums">
                                      Hết hạn: {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString('vi-VN') : '—'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Symptoms Description (Required) */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          Mô tả chi tiết hiện tượng sự cố từ khách hàng <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Bắt buộc</span>
                      </div>
                      <textarea
                        rows={3}
                        value={symptomsDescription}
                        onChange={(e) => setSymptomsDescription(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none leading-relaxed"
                        placeholder="Mô tả cụ thể hiện tượng hư hỏng, tiếng ồn hoặc đèn báo do khách phản ánh..."
                      />
                    </div>

                    {/* Evidence URL (Optional) */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Đường dẫn hình ảnh / video minh chứng (tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        placeholder="https://... (link Google Drive, ảnh hoặc video clip âm thanh)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: CHỌN NGÀY & KHUNG GIỜ TIẾP NHẬN */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Chọn ngày &amp; khung giờ tiếp nhận</h3>
                </div>
                <p className="text-xs text-slate-500 -mt-3">
                  Hệ thống phân bổ khoang sửa chữa thông minh tránh tình trạng chờ đợi quá 10 phút
                </p>

                {/* Calendar Picker + Time Slots */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Mini Calendar */}
                  <div className="lg:col-span-5 p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-lg">calendar_month</span>
                        <h4 className="font-bold text-xs text-slate-900">
                          Tháng {month + 1} / {year}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const now = new Date();
                          const isPrevMonthPast =
                            year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth());
                          return (
                            <button
                              type="button"
                              disabled={isPrevMonthPast}
                              onClick={() => {
                                const d = new Date(bookingDate);
                                d.setMonth(d.getMonth() - 1);
                                setBookingDate(d);
                              }}
                              className="w-6 h-6 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-500 cursor-pointer"
                            >
                              ‹
                            </button>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(bookingDate);
                            d.setMonth(d.getMonth() + 1);
                            setBookingDate(d);
                          }}
                          className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    {/* Mini Day of Week Header */}
                    <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 mb-2">
                      <span>T2</span>
                      <span>T3</span>
                      <span>T4</span>
                      <span>T5</span>
                      <span>T6</span>
                      <span>T7</span>
                      <span className="text-red-500">CN</span>
                    </div>

                    {/* Mini Day Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {Array.from({ length: firstDayOffset }, (_, idx) => (
                        <div key={`empty-${idx}`} className="h-7" />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const dayNum = i + 1;
                        const cellDate = new Date(year, month, dayNum);
                        const todayStart = new Date();
                        todayStart.setHours(0, 0, 0, 0);
                        const isPastDay = cellDate < todayStart;
                        const isSelectedDay = bookingDate.getDate() === dayNum;
                        return (
                          <button
                            key={dayNum}
                            type="button"
                            disabled={isPastDay}
                            onClick={() => {
                              const newD = new Date(year, month, dayNum);
                              setBookingDate(newD);
                              if (isBookingSlotInPast(newD, bookingTime)) {
                                const nextSlot = ALL_SLOTS.find((s) => !isBookingSlotInPast(newD, s));
                                if (nextSlot) setBookingTime(nextSlot);
                              }
                            }}
                            className={`h-7 rounded-lg font-medium font-mono tabular-nums text-xs flex items-center justify-center transition-all ${
                              isPastDay
                                ? 'text-slate-300 cursor-not-allowed line-through'
                                : isSelectedDay
                                  ? 'bg-blue-600 text-white font-bold shadow-sm cursor-pointer'
                                  : 'hover:bg-slate-100 text-slate-700 cursor-pointer'
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        <span>
                          Ngày đang chọn:{' '}
                          <strong className="text-slate-800 font-mono tabular-nums">
                            {bookingDate.getDate()}/{month + 1}
                          </strong>
                        </span>
                      </span>
                      <span className="whitespace-nowrap">Xưởng mở cửa (07:30 - 17:30)</span>
                    </div>
                  </div>

                  {/* Right: Morning & Afternoon Slots */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Morning Slots */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-500 text-base">wb_sunny</span>
                          Buổi sáng (07:30 - 11:30)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {MORNING_SLOTS.filter((s) => !isBookingSlotInPast(bookingDate, s)).length}/{MORNING_SLOTS.length} khung giờ sẵn sàng
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {MORNING_SLOTS.map((slot) => {
                          const isSelected = bookingTime === slot;
                          const isSlotPast = isBookingSlotInPast(bookingDate, slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isSlotPast}
                              onClick={() => setBookingTime(slot)}
                              className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                                isSlotPast
                                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                                  : isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm cursor-pointer'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 cursor-pointer'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Afternoon Slots */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-blue-500 text-base">wb_twilight</span>
                          Buổi chiều (13:30 - 17:30)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {AFTERNOON_SLOTS.filter((s) => !isBookingSlotInPast(bookingDate, s)).length}/{AFTERNOON_SLOTS.length} khung giờ sẵn sàng
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {AFTERNOON_SLOTS.map((slot) => {
                          const isSelected = bookingTime === slot;
                          const isSlotPast = isBookingSlotInPast(bookingDate, slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isSlotPast}
                              onClick={() => setBookingTime(slot)}
                              className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                                isSlotPast
                                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                                  : isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm cursor-pointer'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 cursor-pointer'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Operational Note */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                      <span className="material-symbols-outlined text-blue-600 text-base shrink-0 mt-0.5">
                        schedule
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        <strong>Lưu ý điều phối:</strong> Thời gian xử lý thực tế phụ thuộc vào gói dịch vụ đã chọn ({selectedServiceIds.length} hạng mục) và kết quả kiểm tra kỹ thuật khi tiếp nhận xe tại xưởng.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Appointment Summary Box */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isWarranty
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-blue-50/60 border-blue-100'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 ${
                      isWarranty ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}>
                      <span className="material-symbols-outlined text-lg">
                        {isWarranty ? 'verified_user' : 'task_alt'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">Tóm tắt phiếu đặt hẹn:</strong>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isWarranty
                            ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isWarranty ? 'Bảo hành chính hãng (0đ)' : 'Ưu tiên phục vụ'}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5">
                        {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.licensePlate})` : 'Chưa chọn xe'} • {isWarranty ? `${selectedWarrantyItemIds.length} mục bảo hành` : `${selectedServiceIds.length} dịch vụ chọn`} •{' '}
                        <strong className={isWarranty ? 'text-emerald-700' : 'text-blue-700'}>
                          {bookingTime} - Ngày {bookingDate.getDate()}/{month + 1}/{year}
                        </strong>{' '}
                        • Khách hàng: <strong>{selectedCustomer?.fullName || '—'}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 shrink-0">
                    <span className="block font-semibold text-emerald-700">
                      {isWarranty ? 'Miễn phí kiểm tra & thay thế linh kiện' : 'Miễn phí rửa xe & hút bụi'}
                    </span>
                    <span>{isWarranty ? 'Áp dụng bảo hành chuẩn hãng' : 'Tặng kèm gói kiểm tra an toàn'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Navigation Buttons */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                Đóng
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
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {loading && (
                  <span className="material-symbols-outlined animate-spin text-sm" data-icon="progress_activity">
                    progress_activity
                  </span>
                )}
                {loading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick-Add Vehicle Modal */}
      {quickVehicleOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Thêm phương tiện mới</h3>
                <p className="text-xs text-slate-500 mt-0.5">Thêm nhanh xe cho khách hàng để tiếp tục đặt lịch</p>
              </div>
              <button
                type="button"
                onClick={() => setQuickVehicleOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickAddVehicle} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biển số xe <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickVehicleForm.licensePlate}
                  onChange={(e) => {
                    setQuickVehicleForm((f) => ({ ...f, licensePlate: e.target.value }));
                    if (quickVehiclePlateError) setQuickVehiclePlateError(null);
                  }}
                  placeholder="VD: 51A-123.45"
                  aria-invalid={!!quickVehiclePlateError}
                  className={`w-full h-10 px-3 rounded-xl border text-xs font-mono uppercase outline-none ${
                    quickVehiclePlateError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                {quickVehiclePlateError && (
                  <p className="mt-1 text-xs text-rose-600 font-medium" role="alert">
                    {quickVehiclePlateError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hãng xe <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickVehicleForm.make}
                    onChange={(e) => setQuickVehicleForm((f) => ({ ...f, make: e.target.value }))}
                    placeholder="VD: Toyota"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dòng xe <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickVehicleForm.model}
                    onChange={(e) => setQuickVehicleForm((f) => ({ ...f, model: e.target.value }))}
                    placeholder="VD: Camry"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Màu sắc</label>
                  <input
                    type="text"
                    value={quickVehicleForm.color}
                    onChange={(e) => setQuickVehicleForm((f) => ({ ...f, color: e.target.value }))}
                    placeholder="VD: Đen"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân khúc</label>
                  <select
                    value={quickVehicleForm.vehicleSize}
                    onChange={(e) =>
                      setQuickVehicleForm((f) => ({
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
                  onClick={() => setQuickVehicleOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingQuickVehicle}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  {savingQuickVehicle ? 'Đang lưu...' : 'Lưu phương tiện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
