import React, { useState } from 'react';
import { useAppDispatch } from '@/store';
import { rescheduleAppointment, Appointment } from '@/store/slices/appointmentSlice';

interface RescheduleModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export default function RescheduleModal({ appointment, onClose }: RescheduleModalProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState<string>(
    new Date(appointment.scheduled_date).toISOString().split('T')[0]
  );
  const [time, setTime] = useState<string>(appointment.scheduled_time_str);
  const [notes, setNotes] = useState<string>(appointment.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      setError('Vui lòng chọn ngày và giờ hẹn mới');
      return;
    }

    const [hour, minute] = time.split(':').map(Number);
    if (hour < 8 || hour > 17 || (hour === 17 && minute > 0)) {
      setError('Chỉ có thể đặt lịch trong giờ hành chính (8:00 - 17:00)');
      return;
    }

    const selectedDateTime = new Date(`${date}T${time}`);
    if (selectedDateTime < new Date()) {
      setError('Không thể dời lịch sang thời gian trong quá khứ');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await dispatch(rescheduleAppointment({
        id: appointment.id,
        updateData: {
          scheduled_date: new Date(date).toISOString(),
          scheduled_time: time,
          notes
        }
      })).unwrap();
      onClose();
    } catch (err: any) {
      setError(err || 'Đã có lỗi xảy ra khi dời lịch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-on-surface/40 z-50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
            <h2 className="text-title-md font-title-md font-bold text-on-surface">Dời lịch hẹn #{appointment.id}</h2>
            <button onClick={onClose} className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-xl" data-icon="close">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base" data-icon="error">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-label-md font-semibold text-on-surface">Ngày mới <span className="text-error">*</span></label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-semibold text-on-surface">Giờ hẹn mới <span className="text-error">*</span></label>
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
              <label className="text-label-md font-label-md font-semibold text-on-surface">Ghi chú thêm</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lý do dời lịch..."
                className="p-3 h-20 bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow resize-none"
              ></textarea>
            </div>
          </form>

          <div className="px-5 py-3 border-t border-outline-variant bg-surface-bright flex justify-end gap-3">
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
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary text-label-md font-label-md font-bold rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              Cập nhật
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
