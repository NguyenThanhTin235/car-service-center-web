'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchVehicles } from '@/store/slices/vehicleSlice';
import { createAppointment } from '@/store/slices/appointmentSlice';
import api from '@/lib/axios';
import Toast from '@/components/shared/Toast';

export default function BookAppointmentPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { vehicles, loading: vehiclesLoading } = useSelector((state: RootState) => state.vehicles);
  
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  
  // Form State
  const [vehicleId, setVehicleId] = useState<number | ''>('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
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
      const { data } = await api.get('/api/services', { params: { limit: 100 } });
      setServices(data.data.filter((s: any) => s.isActive));
    } catch (error) {
      console.error('Lỗi khi tải dịch vụ', error);
    } finally {
      setServicesLoading(false);
    }
  };

  const toggleService = (id: number) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter(s => s !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  const handleNext = () => {
    if (step === 1 && !vehicleId) {
      setToastType('error');
      setToastMsg('Vui lòng chọn một phương tiện.');
      return;
    }
    if (step === 2 && selectedServiceIds.length === 0 && !notes.trim()) {
      setToastType('error');
      setToastMsg('Vui lòng chọn dịch vụ hoặc mô tả vấn đề của xe.');
      return;
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
      await dispatch(createAppointment({
        vehicle_id: Number(vehicleId),
        service_ids: selectedServiceIds,
        scheduled_date: date,
        scheduled_time: time,
        notes
      })).unwrap();
      
      setToastType('success');
      setToastMsg('Đặt lịch hẹn thành công!');
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
        <h1 className="text-2xl font-bold font-montserrat text-[#050505]">Đặt lịch hẹn mới</h1>
        <p className="text-gray-500 mt-1">Vui lòng hoàn thành 3 bước dưới đây để đặt lịch</p>
      </div>

      {/* Progress Bar */}
      <div className="flex mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 text-center relative">
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-sm z-10 relative
              ${step >= s ? 'bg-[#0866FF] text-white' : 'bg-gray-200 text-gray-500'}`}>
              {s}
            </div>
            <div className="mt-2 text-xs font-medium text-gray-500">
              {s === 1 ? 'Chọn xe' : s === 2 ? 'Dịch vụ' : 'Thời gian'}
            </div>
            {s < 3 && (
              <div className={`absolute top-4 left-1/2 w-full h-1 -z-10
                ${step > s ? 'bg-[#0866FF]' : 'bg-gray-200'}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-semibold text-gray-900">1. Chọn phương tiện của bạn</h2>
            {vehiclesLoading ? (
              <p className="text-gray-500">Đang tải danh sách xe...</p>
            ) : vehicles.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">Bạn chưa có phương tiện nào trong hồ sơ.</p>
                <button 
                  onClick={() => router.push('/customer/vehicles/new')}
                  className="bg-[#0866FF] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Thêm xe mới
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map(v => (
                  <div 
                    key={v.id}
                    onClick={() => setVehicleId(v.id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${vehicleId === v.id ? 'border-[#0866FF] bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="font-bold text-lg">{v.licensePlate}</div>
                    <div className="text-gray-600 text-sm">{v.make} {v.model} ({v.year})</div>
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

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-semibold text-gray-900">2. Bạn cần chúng tôi làm gì?</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chọn dịch vụ (có thể chọn nhiều)</label>
              {servicesLoading ? (
                <p className="text-gray-500">Đang tải dịch vụ...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                  {services.map(s => (
                    <label key={s.id} className="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-4 h-4 text-[#0866FF] rounded border-gray-300 focus:ring-[#0866FF]"
                        checked={selectedServiceIds.includes(s.id)}
                        onChange={() => toggleService(s.id)}
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">{s.name}</span>
                        <span className="block text-xs text-gray-500 truncate">{s.description || 'Không có mô tả'}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả thêm vấn đề (tùy chọn)</label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-3 outline-none focus:ring-1 focus:ring-[#0866FF]"
                rows={3}
                placeholder="Ví dụ: Xe kêu lạch cạch ở bánh trước khi thắng..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Giờ hẹn (08:00 - 17:00)</label>
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
            
            <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm">
              💡 <b>Lưu ý:</b> Lịch hẹn của bạn sẽ được nhân viên tư vấn gọi điện xác nhận trong thời gian sớm nhất. 
            </div>

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
                {submitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
              </button>
            </div>
          </div>
        )}
      </div>

      {toastMsg && (
        <Toast 
          message={toastMsg} 
          type={toastType} 
          onClose={() => setToastMsg('')} 
        />
      )}
    </div>
  );
}
