import React, { useState } from 'react';
import { useAppDispatch } from '@/store';
import { cancelAppointment, Appointment } from '@/store/slices/appointmentSlice';

interface CancelConfirmDialogProps {
  appointment: Appointment;
  onClose: () => void;
}

export default function CancelConfirmDialog({ appointment, onClose }: CancelConfirmDialogProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const handleCancel = async () => {
    const finalReason = selectedReason === 'Khác' ? customReason : selectedReason;
    
    if (!finalReason.trim()) {
      setError('Vui lòng chọn hoặc nhập lý do hủy lịch');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await dispatch(cancelAppointment({
        id: appointment.id,
        reason: finalReason
      })).unwrap();
      onClose();
    } catch (err: any) {
      setError(err || 'Đã có lỗi xảy ra khi hủy lịch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-on-surface/50 z-50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6 pb-2">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl" data-icon="warning">warning</span>
            </div>
            <h2 className="text-title-lg font-title-lg font-bold text-on-surface mb-2">
              Hủy lịch hẹn #{appointment.id}
            </h2>
            <p className="text-body-md text-secondary">
              Bạn có chắc chắn muốn hủy lịch hẹn của khách hàng <span className="font-semibold text-on-surface">{appointment.customer?.full_name || 'này'}</span> không? Thao tác này không thể hoàn tác.
            </p>
          </div>
          
          <div className="px-6 py-4 flex flex-col gap-2">
            {error && (
              <div className="p-2 rounded bg-error-container text-on-error-container text-body-sm mb-2">
                {error}
              </div>
            )}
            <label className="text-label-md font-semibold text-on-surface">Lý do hủy <span className="text-error">*</span></label>
            <select 
              value={selectedReason} 
              onChange={(e) => setSelectedReason(e.target.value)}
              className="h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:border-error focus:ring-1 focus:ring-error outline-none transition-shadow mb-2"
            >
              <option value="">-- Chọn lý do --</option>
              <option value="Khách báo bận đột xuất">Khách báo bận đột xuất</option>
              <option value="Khách đổi ý không muốn làm dịch vụ">Khách đổi ý không muốn làm dịch vụ</option>
              <option value="Xưởng hết chỗ / Quá tải">Xưởng hết chỗ / Quá tải</option>
              <option value="Sai thông tin đặt lịch">Sai thông tin đặt lịch</option>
              <option value="Khác">Lý do khác...</option>
            </select>

            {selectedReason === 'Khác' && (
              <textarea 
                value={customReason} 
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do cụ thể..."
                className="p-3 h-20 bg-surface border border-outline-variant rounded-lg text-body-md focus:border-error focus:ring-1 focus:ring-error outline-none transition-shadow resize-none"
              ></textarea>
            )}
          </div>

          <div className="px-6 py-4 bg-surface-bright flex justify-end gap-3 rounded-b-xl border-t border-outline-variant">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-label-md font-label-md font-semibold text-secondary hover:bg-surface-container rounded-lg transition-colors"
            >
              Quay lại
            </button>
            <button 
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-error hover:bg-error/90 text-on-error text-label-md font-label-md font-bold rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="material-symbols-outlined animate-spin text-sm" data-icon="progress_activity">progress_activity</span>}
              Xác nhận hủy
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
