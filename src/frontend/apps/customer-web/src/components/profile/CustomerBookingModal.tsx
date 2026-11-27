'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/store';
import { Vehicle } from '@/store/slices/vehicleSlice';
import { Appointment, createAppointment, fetchAppointments } from '@/store/slices/appointmentSlice';
import warrantyApi, { WarrantyItem, getWarrantyCompositeKey } from '@/lib/api/warranty.api';
import {
  MORNING_BOOKING_SLOTS,
  AFTERNOON_BOOKING_SLOTS,
  ALL_BOOKING_SLOTS,
  isBookingSlotInPast,
} from '@/utils/customerHelpers';

const AVAILABLE_SERVICES = [
  {
    id: 1,
    title: 'Bảo dưỡng định kỳ theo số km',
    badge: 'Phổ biến',
    desc: 'Cấp 40.000 km: Bao gồm kiểm tra toàn diện 48 hạng mục tiêu chuẩn.',
    icon: 'verified',
  },
  {
    id: 2,
    title: 'Kiểm tra hệ thống phanh & láng đĩa phanh',
    badge: null,
    desc: 'Đo độ mòn má phanh, kiểm tra dầu phanh và loại bỏ tiếng rít cọ xát.',
    icon: 'car_repair',
  },
  {
    id: 3,
    title: 'Thay dầu máy & lọc dầu cao cấp',
    badge: null,
    desc: 'Dầu động cơ tổng hợp toàn phần nhập khẩu và lọc dầu chính hãng.',
    icon: 'oil_barrel',
  },
  {
    id: 4,
    title: 'Kiểm tra hệ thống điều hòa & nạp gas',
    badge: null,
    desc: 'Đo áp suất gas R134a/R1234yf, vệ sinh giàn lạnh bằng nội soi công nghệ cao.',
    icon: 'ac_unit',
  },
  {
    id: 5,
    title: 'Vệ sinh buồng đốt & kim phun điện tử',
    badge: null,
    desc: 'Khử muội carbon, tối ưu mức tiêu hao nhiên liệu và phục hồi công suất động cơ.',
    icon: 'cleaning_services',
  },
  {
    id: 6,
    title: 'Đảo lốp & cân bằng động bánh xe',
    badge: null,
    desc: 'Chống mòn vẹt lốp không đều và khử rung lắc vô lăng khi chạy tốc độ cao.',
    icon: 'tire_repair',
  },
];

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

interface CustomerBookingModalProps {
  initialDate: Date;
  initialTime: string;
  initialVehicleId?: number | null;
  initialServiceIds?: number[];
  initialNotes?: string;
  initialIsWarranty?: boolean;
  initialWarrantyItemIds?: string[];
  customerId?: number;
  vehicles: Vehicle[];
  activeVehicles: Vehicle[];
  appointments: Appointment[];
  onClose: () => void;
  onOpenAddVehicle: () => void;
  onToast: (toast: { message: string; type: 'success' | 'error' }) => void;
}

export default function CustomerBookingModal({
  initialDate,
  initialTime,
  initialVehicleId,
  initialServiceIds,
  initialNotes,
  initialIsWarranty = false,
  initialWarrantyItemIds,
  customerId,
  vehicles,
  activeVehicles,
  appointments,
  onClose,
  onOpenAddVehicle,
  onToast,
}: CustomerBookingModalProps) {
  const dispatch = useAppDispatch();
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [bookingVehicleId, setBookingVehicleId] = useState<number | null>(
    initialVehicleId ?? activeVehicles[0]?.id ?? vehicles[0]?.id ?? null
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(
    initialServiceIds && initialServiceIds.length > 0 ? initialServiceIds : []
  );
  const [bookingNotes, setBookingNotes] = useState(initialNotes || '');
  const [bookingDate, setBookingDate] = useState<Date>(() => {
    const d = new Date(initialDate);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d;
  });
  const [bookingTime, setBookingTime] = useState<string>(initialTime);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [isWarranty, setIsWarranty] = useState<boolean>(initialIsWarranty);
  const [warrantyItems, setWarrantyItems] = useState<WarrantyItem[]>([]);
  const [warrantyLoading, setWarrantyLoading] = useState<boolean>(false);
  const [selectedWarrantyItemIds, setSelectedWarrantyItemIds] = useState<string[]>(
    initialWarrantyItemIds || []
  );
  const [symptomsDescription, setSymptomsDescription] = useState<string>('');
  const [warrantyDescError, setWarrantyDescError] = useState<string>('');

  useEffect(() => {
    if (!isWarranty || !bookingVehicleId) {
      setWarrantyItems([]);
      return;
    }
    const controller = new AbortController();
    setWarrantyLoading(true);
    warrantyApi
      .getVehicleWarrantyEligibility(bookingVehicleId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        const eligible = (res.items || []).filter((i) => i.status === 'VALID');
        setWarrantyItems(eligible);
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        setWarrantyItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setWarrantyLoading(false);
      });
    return () => controller.abort();
  }, [isWarranty, bookingVehicleId]);

  useEffect(() => {
    if (initialVehicleId) {
      setBookingVehicleId(initialVehicleId);
    }
  }, [initialVehicleId]);

  useEffect(() => {
    if (initialServiceIds && initialServiceIds.length > 0) {
      setSelectedServiceIds(initialServiceIds);
    }
  }, [initialServiceIds]);

  useEffect(() => {
    if (typeof initialNotes === 'string' && initialNotes.trim().length > 0) {
      setBookingNotes(initialNotes);
    }
  }, [initialNotes]);

  useEffect(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      setBookingDate(d);
    }
  }, [initialDate]);

  useEffect(() => {
    if (initialTime) {
      setBookingTime(initialTime);
    }
  }, [initialTime]);

  useEffect(() => {
    if (vehicles.length > 0 && bookingVehicleId === null) {
      setBookingVehicleId(activeVehicles[0]?.id ?? vehicles[0].id);
    }
  }, [vehicles, activeVehicles, bookingVehicleId]);

  const bookingCalendarMeta = useMemo(() => {
    const year = bookingDate.getFullYear();
    const month = bookingDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return { year, month, daysInMonth, firstDayOffset, todayStart };
  }, [bookingDate]);

  const hasVehicleAppointmentOnDate = (vehicleId: number | string | null | undefined, dateStr: string) => {
    if (!vehicleId) return false;
    const vid = Number(vehicleId);
    return appointments.some((apt) => {
      if (!['REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'ARRIVED'].includes(apt.status)) return false;
      const aptVid = Number(apt.vehicle_id || apt.vehicle?.id);
      if (aptVid !== vid) return false;
      const aptDateStr =
        typeof apt.scheduled_date === 'string'
          ? apt.scheduled_date.substring(0, 10)
          : new Date(apt.scheduled_date).toISOString().substring(0, 10);
      return aptDateStr === dateStr;
    });
  };

  const handleToggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleConfirm3StepBooking = async () => {
    if (!bookingVehicleId) {
      onToast({ message: 'Vui lòng chọn phương tiện để đặt lịch.', type: 'error' });
      return;
    }
    if (selectedServiceIds.length === 0 && !bookingNotes.trim()) {
      onToast({ message: 'Vui lòng chọn ít nhất 1 dịch vụ hoặc mô tả tình trạng xe.', type: 'error' });
      return;
    }
    if (!bookingDate || !bookingTime) {
      onToast({ message: 'Vui lòng chọn ngày và giờ hẹn.', type: 'error' });
      return;
    }
    if (bookingDate.getDay() === 0) {
      onToast({ message: 'Xưởng nghỉ Chủ nhật, vui lòng chọn ngày từ Thứ 2 đến Thứ 7.', type: 'error' });
      return;
    }

    const formattedDate = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}-${String(bookingDate.getDate()).padStart(2, '0')}`;
    const selectedDateTime = new Date(`${formattedDate}T${bookingTime}:00`);
    if (selectedDateTime < new Date()) {
      onToast({ message: 'Không thể đặt lịch hẹn trong quá khứ. Vui lòng chọn ngày giờ hợp lệ.', type: 'error' });
      return;
    }

    setBookingSubmitting(true);
    try {
      let chosenVehicleId = bookingVehicleId;
      if (!chosenVehicleId) {
        if (vehicles.length > 0) {
          chosenVehicleId = vehicles[0].id;
        } else {
          onToast({ message: 'Vui lòng chọn phương tiện để đặt lịch.', type: 'error' });
          setBookingSubmitting(false);
          return;
        }
      }

      if (chosenVehicleId && hasVehicleAppointmentOnDate(chosenVehicleId, formattedDate)) {
        onToast({
          message: 'Xe này đã có lịch hẹn trong ngày được chọn. Vui lòng chọn ngày khác.',
          type: 'error',
        });
        setBookingSubmitting(false);
        return;
      }

      if (isWarranty) {
        if (selectedWarrantyItemIds.length === 0) {
          onToast({ message: 'Vui lòng chọn ít nhất một hạng mục còn bảo hành.', type: 'error' });
          setBookingSubmitting(false);
          return;
        }
        if (!symptomsDescription.trim()) {
          onToast({ message: 'Vui lòng mô tả hiện tượng sự cố cần bảo hành.', type: 'error' });
          setBookingSubmitting(false);
          return;
        }
      }

      if (!chosenVehicleId) {
        onToast({ message: 'Vui lòng chọn xe hoặc nhập biển số xe.', type: 'error' });
        setBookingSubmitting(false);
        return;
      }

      await dispatch(
        createAppointment({
          customer_id: customerId,
          vehicle_id: chosenVehicleId,
          scheduled_date: formattedDate,
          scheduled_time: bookingTime,
          notes: bookingNotes,
          service_ids: isWarranty ? [] : selectedServiceIds,
          ...(isWarranty
            ? {
                is_warranty: true,
                warranty_item_ids: selectedWarrantyItemIds,
                symptoms_description: symptomsDescription.trim(),
              }
            : {}),
        })
      ).unwrap();

      onToast({ message: 'Đặt lịch dịch vụ thành công! Hệ thống đã ghi nhận lịch hẹn.', type: 'success' });
      dispatch(fetchAppointments(customerId ? { customer_id: customerId } : {}));
      onClose();
    } catch (err: any) {
      onToast({ message: typeof err === 'string' ? err : 'Không thể đặt lịch. Vui lòng thử lại.', type: 'error' });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const selectedVehicleObj = vehicles.find((v) => v.id === bookingVehicleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-sm cw-modal-overlay">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto cw-modal-panel">
        {/* Header with Title & Stepper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Đặt lịch dịch vụ & sửa chữa</h2>
            <p className="text-xs text-slate-500 mt-1">
              Quy trình 3 bước đơn giản – Tiết kiệm thời gian, nhận xe đúng hẹn với đội ngũ kỹ thuật viên chuẩn hãng.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ đặt lịch"
            className="min-w-[44px] min-h-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center self-start sm:self-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-center gap-3 py-1">
          <button
            type="button"
            onClick={() => setBookingStep(1)}
            aria-current={bookingStep === 1 ? 'step' : undefined}
            className={`min-h-[44px] px-2 flex items-center gap-2 cursor-pointer rounded-lg ${bookingStep === 1 ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-700'}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${bookingStep === 1 ? 'bg-blue-600 text-white font-bold' : 'bg-blue-100 text-blue-700 font-semibold'}`}
            >
              1
            </div>
            <span className="text-xs">Chọn xe</span>
          </button>

          <div className="w-12 h-0.5 bg-blue-500/40" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setBookingStep(2)}
            aria-current={bookingStep === 2 ? 'step' : undefined}
            className={`min-h-[44px] px-2 flex items-center gap-2 cursor-pointer rounded-lg ${bookingStep === 2 ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-700'}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                bookingStep === 2
                  ? 'bg-blue-600 text-white font-bold'
                  : bookingStep > 2
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              2
            </div>
            <span className="text-xs">Dịch vụ & Mô tả</span>
          </button>

          <div className="w-12 h-0.5 bg-blue-500/40" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setBookingStep(3)}
            aria-current={bookingStep === 3 ? 'step' : undefined}
            className={`min-h-[44px] px-2 flex items-center gap-2 cursor-pointer rounded-lg ${bookingStep === 3 ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-700'}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${bookingStep === 3 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600'}`}
            >
              3
            </div>
            <span className="text-xs">Ngày & Giờ</span>
          </button>
        </div>

        {/* STEP 1: CHỌN XE CẦN LÀM DỊCH VỤ */}
        {bookingStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
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
              Chọn từ danh sách xe đã đăng ký hồ sơ hoặc thêm xe mới vào xưởng
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {activeVehicles.length === 0 ? (
                <div className="col-span-full p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">directions_car</span>
                  <p className="text-sm font-semibold text-slate-700">Chưa có phương tiện trong hồ sơ</p>
                  <p className="text-xs text-slate-500 mt-1">Thêm nhanh phương tiện vào hồ sơ hoặc nhập biển số xe bên dưới để tiếp tục đặt lịch.</p>
                  <button
                    type="button"
                    onClick={onOpenAddVehicle}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    + Thêm phương tiện
                  </button>
                </div>
              ) : (
                activeVehicles.map((v) => {
                  const isSelected = bookingVehicleId === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setBookingVehicleId(v.id);
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
        {bookingStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Dịch vụ yêu cầu & Mô tả tình trạng</h3>
            </div>
            <p className="text-xs text-slate-500 -mt-3">
              Lựa chọn các hạng mục cần thực hiện hoặc ghi rõ triệu chứng bất thường
            </p>

            <div className="p-3.5 rounded-2xl border border-hairline bg-surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-accent text-xl">verified_user</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Đặt lịch bảo hành (0đ)</div>
                  <div className="text-[11px] text-slate-500">Chọn hạng mục đã thực hiện còn hạn bảo hành trên xe</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isWarranty}
                onClick={() => setIsWarranty((v) => !v)}
                className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  isWarranty
                    ? 'bg-accent text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isWarranty ? 'Đang chọn: Bảo hành' : 'Chuyển sang Bảo hành'}
              </button>
            </div>

            {isWarranty ? (
              <div className="space-y-4">
                {warrantyLoading ? (
                  <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                ) : warrantyItems.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Xe này hiện không có hạng mục dịch vụ hoặc phụ tùng nào còn trong hạn bảo hành. Vui lòng tắt chế độ bảo hành để đặt dịch vụ thông thường.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {warrantyItems.map((item) => {
                      const key = getWarrantyCompositeKey(item);
                      const checked = selectedWarrantyItemIds.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setSelectedWarrantyItemIds((prev) =>
                              prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
                            )
                          }
                          className={`text-left p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                            checked
                              ? 'border-blue-600 bg-blue-50/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 ${
                              checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {checked && <CheckIcon />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-900">{item.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                              {item.woNumber} • Còn hạn ({item.warrantyMonths} tháng)
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mô tả hiện tượng sự cố cần bảo hành *
                  </label>
                  <textarea
                    rows={3}
                    value={symptomsDescription}
                    onChange={(e) => {
                      setSymptomsDescription(e.target.value);
                      if (warrantyDescError) setWarrantyDescError('');
                    }}
                    className={`w-full p-3.5 rounded-2xl text-xs focus:outline-none resize-none leading-relaxed transition-colors ${
                      warrantyDescError
                        ? 'bg-rose-50/30 border-2 border-rose-400 text-rose-900 focus:border-rose-500 ring-2 ring-rose-400/20'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="Ví dụ: Tiếng kêu cọt kẹt khi phanh gấp, đèn báo lỗi động cơ..."
                  />
                  {warrantyDescError && (
                    <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{warrantyDescError}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {AVAILABLE_SERVICES.map((srv) => {
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-blue-600 text-[16px]">
                          {srv.icon}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900">{srv.title}</h4>
                        {srv.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                            {srv.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{srv.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            )}

            <div>
              <div className="mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Mô tả chi tiết tình trạng xe (Tiếng kêu lạ, đèn cảnh báo taplo, yêu cầu riêng...)
                </label>
              </div>
              <textarea
                rows={3}
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
                placeholder="Nhập mô tả tình trạng xe của bạn (nếu có)..."
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Quý khách có thể đính kèm ảnh hoặc video âm thanh bất thường khi mang xe đến xưởng.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: CHỌN NGÀY & KHUNG GIỜ TIẾP NHẬN */}
        {bookingStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Chọn ngày & khung giờ tiếp nhận</h3>
            </div>
            <p className="text-xs text-slate-500 -mt-3">
              Hệ thống phân bổ khoang sửa chữa thông minh tránh tình trạng chờ đợi quá 10 phút
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Mini Calendar */}
              <div className="lg:col-span-5 p-4 rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-lg">calendar_month</span>
                    <h4 className="font-bold text-xs text-slate-900">
                      Tháng {bookingDate.getMonth() + 1} / {bookingDate.getFullYear()}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const now = new Date();
                      const isPrevMonthDisabled =
                        bookingDate.getFullYear() < now.getFullYear() ||
                        (bookingDate.getFullYear() === now.getFullYear() &&
                          bookingDate.getMonth() <= now.getMonth());
                      return (
                        <button
                          type="button"
                          disabled={isPrevMonthDisabled}
                          onClick={() => {
                            const d = new Date(bookingDate);
                            d.setMonth(d.getMonth() - 1);
                            const today = new Date();
                            if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() < today.getDate()) {
                              d.setDate(today.getDate());
                            }
                            setBookingDate(d);
                          }}
                          className={`w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-xs ${
                            isPrevMonthDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50'
                          }`}
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
                      className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-xs hover:bg-slate-50"
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 mb-2">
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                  <span className="text-red-500">CN</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {Array.from({ length: bookingCalendarMeta.firstDayOffset }, (_, idx) => (
                    <div key={`empty-${idx}`} className="h-7" />
                  ))}
                  {Array.from({ length: bookingCalendarMeta.daysInMonth }, (_, i) => {
                    const { year, month, todayStart } = bookingCalendarMeta;
                    const dayNum = i + 1;
                    const cellDate = new Date(year, month, dayNum);
                    const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isPastDay = cellDate < todayStart;
                    const isSunday = cellDate.getDay() === 0;
                    const isDuplicateDay = !isPastDay && !isSunday && hasVehicleAppointmentOnDate(bookingVehicleId, cellDateStr);
                    const isSelectedDay = bookingDate.getDate() === dayNum;
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        disabled={isPastDay || isSunday || isDuplicateDay}
                        title={
                          isSunday
                            ? 'Xưởng nghỉ Chủ nhật'
                            : isDuplicateDay
                              ? 'Xe này đã có lịch hẹn trong ngày này'
                              : undefined
                        }
                        onClick={() => {
                          const newD = new Date(year, month, dayNum);
                          setBookingDate(newD);
                          if (isBookingSlotInPast(newD, bookingTime)) {
                            const nextSlot = ALL_BOOKING_SLOTS.find(
                              (s) => !isBookingSlotInPast(newD, s)
                            );
                            if (nextSlot) setBookingTime(nextSlot);
                          }
                        }}
                        className={`h-7 rounded-lg font-medium font-mono tabular-nums text-xs flex items-center justify-center transition-all ${
                          isPastDay || isSunday
                            ? 'text-slate-300 cursor-not-allowed line-through'
                            : isDuplicateDay
                              ? 'bg-amber-50 text-amber-500 border border-amber-200 cursor-not-allowed'
                              : isSelectedDay
                                ? 'bg-blue-600 text-white font-bold shadow-sm'
                                : 'hover:bg-slate-100 text-slate-700'
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
                        {bookingDate.getDate()}/{bookingDate.getMonth() + 1}
                      </strong>
                    </span>
                  </span>
                  <span className="whitespace-nowrap">Xưởng mở cửa (07:30 - 17:30)</span>
                </div>
                {hasVehicleAppointmentOnDate(
                  bookingVehicleId,
                  `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}-${String(bookingDate.getDate()).padStart(2, '0')}`
                ) && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                    <span>Xe này đã có lịch hẹn vào ngày đang chọn. Vui lòng chọn ngày khác.</span>
                  </div>
                )}
              </div>

              {/* Right: Morning & Afternoon Slots */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-500 text-base">wb_sunny</span>
                      Buổi sáng (07:30 - 11:30)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {MORNING_BOOKING_SLOTS.filter((s) => !isBookingSlotInPast(bookingDate, s)).length}/{MORNING_BOOKING_SLOTS.length} khung giờ sẵn sàng
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {MORNING_BOOKING_SLOTS.map((slot) => {
                      const isPastSlot = isBookingSlotInPast(bookingDate, slot);
                      const isSelected = bookingTime === slot && !isPastSlot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isPastSlot}
                          onClick={() => setBookingTime(slot)}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                            isPastSlot
                              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                              : isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blue-500 text-base">wb_twilight</span>
                      Buổi chiều (13:30 - 17:30)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {AFTERNOON_BOOKING_SLOTS.filter((s) => !isBookingSlotInPast(bookingDate, s)).length}/{AFTERNOON_BOOKING_SLOTS.length} khung giờ sẵn sàng
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {AFTERNOON_BOOKING_SLOTS.map((slot) => {
                      const isPastSlot = isBookingSlotInPast(bookingDate, slot);
                      const isSelected = bookingTime === slot && !isPastSlot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isPastSlot}
                          onClick={() => setBookingTime(slot)}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                            isPastSlot
                              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                              : isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                  <span className="material-symbols-outlined text-blue-600 text-base shrink-0 mt-0.5">
                    schedule
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Thời gian hoàn tất dự kiến:</strong> 1.5 – 2.5 giờ làm việc. Khách hàng có thể nghỉ ngơi tại phòng chờ VIP tiêu chuẩn có Wi-Fi tốc độ cao, nước uống và màn hình theo dõi tiến độ thời gian thực.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">task_alt</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-bold">Tóm tắt phiếu đặt hẹn:</strong>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Ưu tiên phục vụ
                    </span>
                  </div>
                  <p className="text-slate-700 mt-0.5">
                    {selectedVehicleObj
                      ? `${selectedVehicleObj.make} ${selectedVehicleObj.model} (${selectedVehicleObj.licensePlate})`
                      : 'Chưa chọn xe'}{' '}
                    •{' '}
                    {isWarranty
                      ? `${selectedWarrantyItemIds.length} hạng mục bảo hành`
                      : `${selectedServiceIds.length} dịch vụ chọn`}{' '}
                    •{' '}
                    <strong className="text-blue-700 font-mono tabular-nums">
                      {bookingTime} - Ngày {bookingDate.getDate()}/{bookingDate.getMonth() + 1}/{bookingDate.getFullYear()}
                    </strong>
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-500 shrink-0">
                <span className="block font-semibold text-emerald-700">Miễn phí rửa xe & hút bụi</span>
                <span>Tặng kèm gói kiểm tra an toàn</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {bookingStep > 1 ? (
            <button
              type="button"
              onClick={() => setBookingStep((bookingStep - 1) as any)}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Quay lại
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all"
            >
              Đóng
            </button>
          )}

          {bookingStep < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (bookingStep === 1 && !bookingVehicleId) {
                  onToast({ message: 'Vui lòng chọn phương tiện để tiếp tục.', type: 'error' });
                  return;
                }
                if (bookingStep === 2) {
                  if (isWarranty) {
                    if (selectedWarrantyItemIds.length === 0) {
                      onToast({ message: 'Vui lòng chọn ít nhất 1 hạng mục bảo hành.', type: 'error' });
                      return;
                    }
                    if (!symptomsDescription.trim()) {
                      const msg = 'Vui lòng mô tả hiện tượng sự cố cần bảo hành.';
                      setWarrantyDescError(msg);
                      onToast({ message: msg, type: 'error' });
                      return;
                    }
                  } else if (selectedServiceIds.length === 0 && !bookingNotes.trim()) {
                    onToast({
                      message: 'Vui lòng chọn ít nhất 1 dịch vụ hoặc nhập mô tả tình trạng xe để tiếp tục.',
                      type: 'error',
                    });
                    return;
                  }
                }
                setBookingStep((bookingStep + 1) as any);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              Tiếp tục
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={bookingSubmitting}
              onClick={handleConfirm3StepBooking}
              className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              {bookingSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              )}
              Lưu lịch hẹn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
