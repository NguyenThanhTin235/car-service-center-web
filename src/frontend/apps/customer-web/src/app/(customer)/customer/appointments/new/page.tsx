'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchVehicles } from '@/store/slices/vehicleSlice';
import { createAppointment } from '@/store/slices/appointmentSlice';
import api from '@/lib/axios';
import Toast from '@/components/shared/Toast';
import warrantyApi, { WarrantyItem } from '@/lib/api/warranty.api';

function BookAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const { vehicles, loading: vehiclesLoading } = useSelector(
    (state: RootState) => state.vehicles
  );

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Form State
  const initialVehicleId = searchParams.get('vehicle_id');
  const initialIsWarranty = searchParams.get('warranty') === 'true';
  const initialItemId = searchParams.get('warranty_item_id');

  const [vehicleId, setVehicleId] = useState<number | ''>(
    initialVehicleId ? Number(initialVehicleId) : ''
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Warranty State (UC-82)
  const [isWarranty, setIsWarranty] = useState<boolean>(initialIsWarranty);
  const [warrantyItems, setWarrantyItems] = useState<WarrantyItem[]>([]);
  const [warrantyLoading, setWarrantyLoading] = useState(false);
  const [selectedWarrantyItemIds, setSelectedWarrantyItemIds] = useState<string[]>(
    initialItemId ? [initialItemId] : []
  );
  const [symptomsDescription, setSymptomsDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchVehicles());
    loadServices();
  }, [dispatch]);

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const { data } = await api.get('/api/services', {
        params: { limit: 100, isActive: 'true' },
      });
      setServices(data.data.filter((s: any) => s.isActive));
    } catch (error) {
      console.error('Lỗi khi tải dịch vụ', error);
    } finally {
      setServicesLoading(false);
    }
  };

  const loadVehicleWarrantyItems = useCallback(async (vId: number) => {
    setWarrantyLoading(true);
    try {
      const data = await warrantyApi.getVehicleWarrantyEligibility(vId);
      // Chỉ giữ các mục còn hạn hoặc quá hạn nhẹ (đủ điều kiện)
      const eligible = (data.items || []).filter(
        (i) => i.status === 'VALID' || i.status === 'OVERDUE_LIGHT'
      );
      setWarrantyItems(eligible);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu bảo hành xe', err);
      setWarrantyItems([]);
    } finally {
      setWarrantyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (vehicleId) {
      loadVehicleWarrantyItems(Number(vehicleId));
    } else {
      setWarrantyItems([]);
    }
  }, [vehicleId, loadVehicleWarrantyItems]);

  const toggleService = (id: number) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter((s) => s !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  const toggleWarrantyItem = (id: string) => {
    if (selectedWarrantyItemIds.includes(id)) {
      setSelectedWarrantyItemIds(selectedWarrantyItemIds.filter((i) => i !== id));
    } else {
      setSelectedWarrantyItemIds([...selectedWarrantyItemIds, id]);
    }
  };

  const handleNext = () => {
    if (step === 1 && !vehicleId) {
      setToastType('error');
      setToastMsg('Vui lòng chọn một phương tiện.');
      return;
    }

    if (step === 2) {
      if (isWarranty) {
        if (selectedWarrantyItemIds.length === 0) {
          setToastType('error');
          setToastMsg('Vui lòng chọn ít nhất 1 hạng mục linh kiện/dịch vụ cần bảo hành.');
          return;
        }
        if (!symptomsDescription.trim()) {
          setToastType('error');
          setToastMsg('Vui lòng nhập mô tả triệu chứng sự cố gặp phải.');
          return;
        }
      } else {
        if (selectedServiceIds.length === 0 && !notes.trim()) {
          setToastType('error');
          setToastMsg('Vui lòng chọn dịch vụ hoặc mô tả vấn đề của xe.');
          return;
        }
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!date || !time) {
      setToastType('error');
      setToastMsg('Vui lòng chọn ngày và giờ hẹn.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        vehicle_id: Number(vehicleId),
        service_ids: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
        scheduled_date: date,
        scheduled_time: time,
        notes: notes.trim() || undefined,
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

      setToastType('success');
      setToastMsg(
        isWarranty
          ? 'Đặt lịch hẹn bảo hành thành công! Hồ sơ đã được chuyển tới Cố vấn dịch vụ.'
          : 'Đặt lịch hẹn dịch vụ thành công!'
      );
      setTimeout(() => {
        router.push('/customer/appointments');
      }, 1500);
    } catch (error: any) {
      setToastType('error');
      setToastMsg(error || 'Có lỗi xảy ra khi đặt lịch.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-montserrat text-[#050505]">
          {isWarranty ? 'Đặt lịch hẹn bảo hành' : 'Đặt lịch hẹn dịch vụ mới'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isWarranty
            ? 'Đăng ký kiểm tra & xử lý bảo hành miễn phí cho phụ tùng và dịch vụ'
            : 'Vui lòng hoàn thành 3 bước dưới đây để đặt lịch'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 text-center relative">
            <div
              className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-sm z-10 relative
              ${step >= s ? 'bg-[#0866FF] text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              {s}
            </div>
            <div className="mt-2 text-xs font-medium text-gray-500">
              {s === 1 ? 'Chọn xe' : s === 2 ? 'Hạng mục' : 'Thời gian'}
            </div>
            {s < 3 && (
              <div
                className={`absolute top-4 left-1/2 w-full h-1 -z-10
                ${step > s ? 'bg-[#0866FF]' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-semibold text-gray-900">1. Chọn phương tiện của bạn</h2>
            {vehiclesLoading ? (
              <p className="text-gray-500">Đang tải danh sách xe...</p>
            ) : vehicles.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">Bạn chưa có phương tiện nào trong hồ sơ.</p>
                <button
                  onClick={() =>
                    router.push('/customer/vehicles/new?redirect=/customer/appointments/new')
                  }
                  className="bg-[#0866FF] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Thêm xe mới
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setVehicleId(v.id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      vehicleId === v.id
                        ? 'border-[#0866FF] bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-bold text-lg">{v.licensePlate}</div>
                    <div className="text-gray-600 text-sm">
                      {v.make} {v.model} ({v.year})
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-8">
              <button
                onClick={handleNext}
                disabled={!vehicleId}
                className="bg-[#0866FF] text-white px-6 py-2 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-900">2. Bạn cần chúng tôi làm gì?</h2>

              {/* Toggle switch between Normal & Warranty appointment */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsWarranty(false)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    !isWarranty
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dịch vụ bảo dưỡng
                </button>
                <button
                  type="button"
                  onClick={() => setIsWarranty(true)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                    isWarranty
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Bảo hành (0 đồng)
                </button>
              </div>
            </div>

            {/* WARRANTY SECTION (UC-82) */}
            {isWarranty ? (
              <div className="space-y-5">
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs">
                  🛡️ <strong>Chính sách bảo hành:</strong> Miễn phí 100% chi phí sửa chữa và thay thế
                  cho các hạng mục linh kiện/dịch vụ còn trong thời hạn bảo hành. Nếu quá hạn nhẹ, hồ sơ
                  sẽ được trình Quản lý xét duyệt chính sách <strong>Bảo hành thiện chí</strong>.
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Chọn hạng mục cần bảo hành <span className="text-red-500">*</span>
                  </label>

                  {warrantyLoading ? (
                    <p className="text-xs text-gray-500 py-3">Đang tra cứu hạn bảo hành xe...</p>
                  ) : warrantyItems.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      Phương tiện này chưa có hạng mục dịch vụ hoặc linh kiện nào còn trong hạn bảo hành
                      để xử lý. Quý khách có thể chuyển sang đặt lịch dịch vụ thông thường.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto p-1">
                      {warrantyItems.map((item) => {
                        const isSelected = selectedWarrantyItemIds.includes(item.id);
                        const isGreen = item.badgeColor === 'green';

                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleWarrantyItem(item.id)}
                            className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/40'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="mt-1 w-4 h-4 text-[#0866FF] rounded border-gray-300"
                              />
                              <div>
                                <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Lệnh: {item.parentWoNumber} — Làm ngày:{' '}
                                  {new Date(item.performedAt).toLocaleDateString('vi-VN')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Hạn: {new Date(item.expireDate).toLocaleDateString('vi-VN')} (
                                  {item.expireMileage.toLocaleString()} km)
                                </div>
                              </div>
                            </div>

                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                isGreen
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {item.statusLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Symptoms description (Required for UC-82) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Mô tả triệu chứng / Hiện tượng sự cố gặp phải <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#0866FF] text-sm"
                    placeholder="Mô tả cụ thể hiện tượng (VD: Có tiếng kêu lọc cọc ở gầm xe khi qua gờ giảm tốc, phanh bị rít hoặc giật nhẹ...)"
                    value={symptomsDescription}
                    onChange={(e) => setSymptomsDescription(e.target.value)}
                  />
                </div>

                {/* Evidence URL (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hình ảnh / Video minh chứng sự cố (nếu có link)
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0866FF] text-sm"
                    placeholder="Dán đường dẫn ảnh / video lưu trữ (Drive, Cloudinary, YouTube...)"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                  />
                </div>

                {/* Optional additional paid services */}
                <div className="pt-2 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Làm thêm dịch vụ bảo dưỡng tính phí kèm theo (tùy chọn)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                    {services.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-start p-2.5 border rounded-lg cursor-pointer hover:bg-gray-50 text-xs"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 w-3.5 h-3.5 text-[#0866FF] rounded border-gray-300"
                          checked={selectedServiceIds.includes(s.id)}
                          onChange={() => toggleService(s.id)}
                        />
                        <div className="ml-2.5">
                          <span className="font-semibold text-gray-900 block">{s.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* REGULAR SERVICE SECTION */
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn dịch vụ (có thể chọn nhiều)
                  </label>
                  {servicesLoading ? (
                    <p className="text-gray-500 text-sm">Đang tải dịch vụ...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                      {services.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-[#0866FF] rounded border-gray-300 focus:ring-[#0866FF]"
                            checked={selectedServiceIds.includes(s.id)}
                            onChange={() => toggleService(s.id)}
                          />
                          <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900">{s.name}</span>
                            <span className="block text-xs text-gray-500 truncate">
                              {s.description || 'Không có mô tả'}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả thêm vấn đề (tùy chọn)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-3 outline-none focus:ring-1 focus:ring-[#0866FF] text-sm"
                    rows={3}
                    placeholder="Ví dụ: Xe kêu lạch cạch ở bánh trước khi thắng..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleNext}
                className="bg-[#0866FF] text-white px-6 py-2 rounded-md transition-colors"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-semibold text-gray-900">3. Chọn ngày và giờ mang xe đến</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày hẹn</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md p-3 outline-none focus:ring-1 focus:ring-[#0866FF]"
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giờ hẹn (08:00 - 17:00)
                </label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded-md p-3 outline-none focus:ring-1 focus:ring-[#0866FF]"
                  min="08:00"
                  max="17:00"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            {isWarranty ? (
              <div className="bg-emerald-50 text-emerald-900 p-4 rounded-xl text-xs border border-emerald-200">
                ✅ <strong>Lịch hẹn bảo hành:</strong> Khi xe đến xưởng, Cố vấn dịch vụ sẽ đối chiếu
                số km ODO và kiểm tra kỹ thuật tại chỗ. Các hạng mục bảo hành được miễn phí 100% chi
                phí theo chính sách của trung tâm.
              </div>
            ) : (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm">
                💡 <b>Lưu ý:</b> Lịch hẹn của bạn sẽ được nhân viên tư vấn gọi điện xác nhận trong thời
                gian sớm nhất.
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={submitting}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#0866FF] text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {submitting
                  ? 'Đang xử lý...'
                  : isWarranty
                  ? 'Xác nhận đặt lịch bảo hành'
                  : 'Xác nhận đặt lịch'}
              </button>
            </div>
          </div>
        )}
      </div>

      {toastMsg && (
        <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      )}
    </div>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải biểu mẫu đặt lịch...</div>}>
      <BookAppointmentForm />
    </Suspense>
  );
}
