import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { createAppointment } from '@/store/slices/appointmentSlice';
import api from '@/lib/axios';

interface CreateAppointmentModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: Date;
  selectedTime?: string;
}

export default function CreateAppointmentModal({ onClose, onSuccess, selectedDate, selectedTime }: CreateAppointmentModalProps) {
  const dispatch = useAppDispatch();
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
  const [date, setDate] = useState<string>(selectedDate ? selectedDate.toISOString().split('T')[0] : '');
  const [time, setTime] = useState<string>(selectedTime || '');
  const [notes, setNotes] = useState<string>('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setFetchingData(true);
      try {
        const [customersRes, servicesRes] = await Promise.all([
          api.get('/api/customers', { params: { limit: 100 } }),
          api.get('/api/services')
        ]);
        setCustomers(customersRes.data.data);
        setServices(servicesRes.data.data);
      } catch (err) {
        console.error('Error fetching data', err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  const selectedCustomer = customers.find(c => c.id.toString() === customerId);
  const availableVehicles = selectedCustomer?.vehicles || [];

  const handleToggleService = (serviceId: number) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !vehicleId || !date || !time) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const [hour, minute] = time.split(':').map(Number);
    if (hour < 8 || hour > 17 || (hour === 17 && minute > 0)) {
      setError('Chỉ có thể đặt lịch trong giờ hành chính (8:00 - 17:00)');
      return;
    }

    if (selectedServiceIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 dịch vụ');
      return;
    }

    // Validation
    const selectedDateTime = new Date(`${date}T${time}`);
    if (selectedDateTime < new Date()) {
      setError('Không thể đặt lịch hẹn trong quá khứ');
      return;
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 8 || hours > 17 || (hours === 17 && minutes > 0)) {
      setError('Giờ hẹn phải trong khung giờ làm việc (08:00 - 17:00)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await dispatch(createAppointment({
        customer_id: Number(customerId),
        vehicle_id: Number(vehicleId),
        scheduled_date: new Date(date).toISOString(),
        scheduled_time: time,
        service_ids: selectedServiceIds,
        notes
      })).unwrap();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-on-surface/40 z-40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
            <h2 className="text-title-md font-title-md font-bold text-on-surface">Thêm lịch hẹn mới</h2>
            <button onClick={onClose} className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-xl" data-icon="close">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
            {error && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base" data-icon="error">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-label-md font-semibold text-on-surface">Khách hàng <span className="text-error">*</span></label>
              <input 
                list="customers-list"
                value={customerSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomerSearch(val);
                  
                  // Find exact match to set customerId
                  const match = customers.find(c => `${c.fullName} - ${c.phone}` === val);
                  if (match) {
                    setCustomerId(match.id.toString());
                    setVehicleId(''); // reset vehicle when customer changes
                  } else {
                    setCustomerId('');
                  }
                }}
                disabled={fetchingData}
                placeholder="-- Nhập tên hoặc SĐT để tìm --"
                className="h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
              />
              <datalist id="customers-list">
                {customers.map(c => (
                  <option key={c.id} value={`${c.fullName} - ${c.phone}`} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-label-md font-semibold text-on-surface">Phương tiện <span className="text-error">*</span></label>
              <select 
                value={vehicleId} 
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={!customerId}
                className="h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow disabled:bg-surface-container-low disabled:text-secondary"
              >
                <option value="">-- Chọn phương tiện --</option>
                {availableVehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.licensePlate} - {v.make} {v.model}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-label-md font-semibold text-on-surface">Dịch vụ yêu cầu <span className="text-error">*</span></label>
              <div className="border border-outline-variant rounded-lg bg-surface max-h-40 overflow-y-auto p-2 flex flex-col gap-1">
                {fetchingData ? (
                  <p className="text-secondary text-sm p-2">Đang tải dịch vụ...</p>
                ) : services.map(service => (
                  <label key={service.id} className="flex items-center gap-2 p-2 hover:bg-surface-container-lowest rounded cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
                      checked={selectedServiceIds.includes(service.id)}
                      onChange={() => handleToggleService(service.id)}
                    />
                    <span className="text-body-sm text-on-surface">{service.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-label-md font-semibold text-on-surface">Ngày hẹn <span className="text-error">*</span></label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-label-md font-semibold text-on-surface">Giờ hẹn <span className="text-error">*</span></label>
                <input 
                  type="time" 
                  value={time}
                  min="08:00"
                  max="17:00"
                  onChange={(e) => setTime(e.target.value)}
                  className="h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-label-md font-semibold text-on-surface">Ghi chú</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú thêm về tình trạng xe..."
                className="p-3 h-20 bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow resize-none"
              ></textarea>
            </div>
          </form>

          <div className="px-6 py-4 border-t border-outline-variant bg-surface-bright flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-label-md font-label-md font-semibold text-secondary hover:bg-surface-container rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary text-label-md font-label-md font-bold rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
            >
              {loading && <span className="material-symbols-outlined animate-spin text-sm" data-icon="progress_activity">progress_activity</span>}
              Lưu lịch hẹn
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
