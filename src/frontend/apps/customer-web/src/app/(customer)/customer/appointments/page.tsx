'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchAppointments, setFilters, Appointment, cancelAppointment, rescheduleAppointment } from '@/store/slices/appointmentSlice';
import Link from 'next/link';
import Toast from '@/components/shared/Toast';
import ConfirmModal from '@/components/shared/ConfirmModal';

export default function AppointmentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, loading, filters } = useSelector((state: RootState) => state.appointments);

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // Cancel State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedForCancel, setSelectedForCancel] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Reschedule State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedForReschedule, setSelectedForReschedule] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAppointments(filters));
  }, [dispatch, filters]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Đã xác nhận</span>;
      case 'RESCHEDULED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Đã dời lịch</span>;
      case 'ARRIVED':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">Đã đến xưởng</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Đã hủy</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const handleCancelClick = (id: number) => {
    setSelectedForCancel(id);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!selectedForCancel) return;
    if (!cancelReason.trim()) {
      setToastType('error');
      setToastMsg('Vui lòng nhập lý do hủy lịch');
      return;
    }
    
    setCancelLoading(true);
    try {
      await dispatch(cancelAppointment({ id: selectedForCancel, reason: cancelReason })).unwrap();
      setToastType('success');
      setToastMsg('Đã hủy lịch hẹn thành công.');
      setCancelModalOpen(false);
      dispatch(fetchAppointments(filters));
    } catch (error: any) {
      setToastType('error');
      setToastMsg(error || 'Có lỗi xảy ra khi hủy lịch.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRescheduleClick = (apt: Appointment) => {
    setSelectedForReschedule(apt);
    setNewDate(apt.scheduled_date.split('T')[0]);
    setNewTime(apt.scheduled_time_str);
    setRescheduleModalOpen(true);
  };

  const confirmReschedule = async () => {
    if (!selectedForReschedule) return;
    if (!newDate || !newTime) {
      setToastType('error');
      setToastMsg('Vui lòng chọn ngày và giờ mới.');
      return;
    }

    setRescheduleLoading(true);
    try {
      await dispatch(rescheduleAppointment({
        id: selectedForReschedule.id,
        updateData: { scheduled_date: newDate, scheduled_time: newTime }
      })).unwrap();
      setToastType('success');
      setToastMsg('Đã dời lịch hẹn thành công.');
      setRescheduleModalOpen(false);
      dispatch(fetchAppointments(filters));
    } catch (error: any) {
      setToastType('error');
      setToastMsg(error || 'Có lỗi xảy ra khi dời lịch.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-montserrat text-[#050505]">Lịch hẹn của tôi</h1>
        <Link 
          href="/customer/appointments/new"
          className="bg-[#0866FF] hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          + Đặt lịch mới
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-[#0866FF]"
            value={filters.status}
            onChange={(e) => dispatch(setFilters({ status: e.target.value }))}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="REQUESTED">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="RESCHEDULED">Đã dời lịch</option>
            <option value="ARRIVED">Đã đến xưởng</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có lịch hẹn nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-3">Ngày hẹn</th>
                  <th className="px-6 py-3">Giờ hẹn</th>
                  <th className="px-6 py-3">Phương tiện</th>
                  <th className="px-6 py-3">Dịch vụ</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">{new Date(apt.scheduled_date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4">{apt.scheduled_time_str}</td>
                    <td className="px-6 py-4 font-medium">{apt.vehicle?.license_plate}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {apt.services?.map(s => s.name).join(', ') || 'Không rõ'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(apt.status)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {(apt.status === 'REQUESTED' || apt.status === 'CONFIRMED') && (
                        <button 
                          onClick={() => handleRescheduleClick(apt)}
                          className="text-[#0866FF] hover:underline"
                        >
                          Dời lịch
                        </button>
                      )}
                      {(apt.status === 'REQUESTED' || apt.status === 'CONFIRMED' || apt.status === 'RESCHEDULED') && (
                        <button 
                          onClick={() => handleCancelClick(apt.id)}
                          className="text-[#E41E3F] hover:underline ml-3"
                        >
                          Hủy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Modal Hủy lịch */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận hủy lịch hẹn</h3>
            <p className="text-gray-600 mb-4 text-sm">Vui lòng cho biết lý do bạn muốn hủy lịch hẹn này.</p>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 mb-4 outline-none focus:ring-1 focus:ring-[#0866FF]"
              rows={3}
              placeholder="Lý do hủy..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                disabled={cancelLoading}
              >
                Đóng
              </button>
              <button 
                onClick={confirmCancel}
                className="px-4 py-2 bg-[#E41E3F] text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dời lịch */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dời lịch hẹn</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mới</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-1 focus:ring-[#0866FF]"
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ mới</label>
                <input 
                  type="time" 
                  className="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-1 focus:ring-[#0866FF]"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                disabled={rescheduleLoading}
              >
                Đóng
              </button>
              <button 
                onClick={confirmReschedule}
                className="px-4 py-2 bg-[#0866FF] text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                disabled={rescheduleLoading}
              >
                {rescheduleLoading ? 'Đang xử lý...' : 'Xác nhận dời'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
