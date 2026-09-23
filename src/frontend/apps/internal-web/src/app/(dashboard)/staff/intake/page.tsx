'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchIntakeQueue,
  createIntakeRecord,
  arriveAppointment,
  cancelIntakeRecord,
} from '@/store/slices/intakeSlice';
import { fetchAppointments } from '@/store/slices/appointmentSlice';
import api from '@/lib/axios';
import IntakeQueueCard from '@/components/intake/IntakeQueueCard';
import WalkInIntakeModal from '@/components/intake/WalkInIntakeModal';
import TowInIntakeModal from '@/components/intake/TowInIntakeModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import toast from 'react-hot-toast';

export default function IntakePage() {
  const dispatch = useAppDispatch();
  
  // State from Redux
  const { records: queueRecords, loading: queueLoading } = useAppSelector((state) => state.intake);
  const { appointments, loading: aptLoading } = useAppSelector((state) => state.appointments);

  // Local UI state
  const [isWalkInModalOpen, setWalkInModalOpen] = useState(false);
  const [isTowInModalOpen, setTowInModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'QUEUED' | 'CONVERTED' | 'CANCELLED'>('QUEUED');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [serviceTemplates, setServiceTemplates] = useState<Array<{id: number, name: string}>>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    // Lấy danh sách tiếp nhận (tất cả trạng thái)
    dispatch(fetchIntakeQueue({}));
    
    // Lấy lịch hẹn trong ngày hôm nay có trạng thái CONFIRMED
    const todayStr = new Date().toISOString().split('T')[0];
    dispatch(fetchAppointments({ 
      startDate: todayStr, 
      endDate: todayStr,
      status: 'CONFIRMED',
      limit: 100 
    }));

    // Fetch service templates
    api.get('/api/services')
      .then((res) => {
        const data = res.data;
        if (data && data.data) {
          setServiceTemplates(data.data);
        } else if (Array.isArray(data)) {
          setServiceTemplates(data);
        }
      })
      .catch((err) => console.error('Failed to fetch services:', err));

    // Fetch customers for the comboboxes
    api.get('/api/customers', { params: { limit: 100 } })
      .then((res) => {
        if (res.data && res.data.data) {
          setCustomers(res.data.data);
        }
      })
      .catch(console.error);
  }, [dispatch]);

  // Handlers
  const handleArriveAppointment = (id: number) => {
    setConfirmAction({
      isOpen: true,
      title: 'Xác nhận tiếp nhận',
      message: 'Bạn có chắc chắn xe đã đến xưởng và bắt đầu tiếp nhận?',
      onConfirm: async () => {
        try {
          await dispatch(arriveAppointment(id)).unwrap();
          toast.success('Đã tiếp nhận xe thành công!');
          // Refresh appointment list to remove it from "Lịch hẹn hôm nay"
          const todayStr = new Date().toISOString().split('T')[0];
          dispatch(fetchAppointments({ startDate: todayStr, endDate: todayStr, status: 'CONFIRMED' }));
          dispatch(fetchIntakeQueue({}));
        } catch (err: any) {
          toast.error(err || 'Có lỗi xảy ra');
        } finally {
          setConfirmAction(null);
        }
      }
    });
  };

  const handleWalkInSubmit = async (data: any) => {
    try {
      await dispatch(createIntakeRecord(data)).unwrap();
      setWalkInModalOpen(false);
      toast.success('Tạo phiếu tiếp nhận Walk-In thành công!');
      dispatch(fetchIntakeQueue({}));
    } catch (err: any) {
      toast.error(err || 'Có lỗi xảy ra');
    }
  };

  const handleTowInSubmit = async (data: any) => {
    try {
      await dispatch(createIntakeRecord(data)).unwrap();
      setTowInModalOpen(false);
      toast.success('Tạo phiếu tiếp nhận Tow-In thành công!');
      dispatch(fetchIntakeQueue({}));
    } catch (err: any) {
      toast.error(err || 'Có lỗi xảy ra');
    }
  };

  const handleCancelIntake = (id: number) => {
    setConfirmAction({
      isOpen: true,
      title: 'Hủy phiếu tiếp nhận',
      message: 'Bạn có chắc chắn muốn hủy phiếu tiếp nhận này?',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await dispatch(cancelIntakeRecord(id)).unwrap();
          toast.success('Hủy phiếu thành công');
          dispatch(fetchIntakeQueue({}));
        } catch (err: any) {
          toast.error(err || 'Có lỗi xảy ra khi hủy phiếu');
        } finally {
          setConfirmAction(null);
        }
      }
    });
  };

  const handleConvertToRO = (id: number) => {
    toast.success(`Chuyển phiếu tiếp nhận #${id} sang tạo Lệnh Sửa Chữa (Work Order)`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-primary">car_repair</span>
            Tiếp nhận xe vào xưởng
          </h1>
          <p className="text-body-md text-secondary mt-1">
            Quản lý xe đến có lịch hẹn, khách vãng lai (Walk-in) và xe cứu hộ (Tow-in).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTowInModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-tertiary-container text-on-tertiary-container rounded-lg font-semibold hover:bg-tertiary hover:text-on-tertiary transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            <span>Tow-In</span>
          </button>
          <button
            onClick={() => setWalkInModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">directions_walk</span>
            <span>Walk-In</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* LỊCH HẸN HÔM NAY (Top) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h2 className="text-headline-md font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">event_available</span>
            Lịch hẹn chờ tới
            <span className="ml-2 bg-primary-container text-on-primary-container text-label-sm px-2 py-0.5 rounded-full">
              {appointments.length}
            </span>
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant text-label-md text-secondary">
                  <th className="py-3 px-4 font-semibold">Giờ hẹn</th>
                  <th className="py-3 px-4 font-semibold">Biển số xe</th>
                  <th className="py-3 px-4 font-semibold">Khách hàng</th>
                  <th className="py-3 px-4 font-semibold">Số điện thoại</th>
                  <th className="py-3 px-4 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {aptLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center text-secondary py-10">Đang tải lịch hẹn...</td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-secondary py-10">Không có lịch hẹn nào đang chờ</td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-code-mono font-bold text-primary">{apt.scheduled_time_str}</td>
                      <td className="py-3 px-4 text-label-md font-semibold">{apt.vehicle?.license_plate || 'Không có BS'}</td>
                      <td className="py-3 px-4 text-body-sm">{apt.customer?.full_name || 'Khách vãng lai'}</td>
                      <td className="py-3 px-4 text-body-sm">{apt.customer?.phone || 'Chưa cập nhật'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleArriveAppointment(apt.id)}
                          className="px-3 py-1.5 bg-surface border border-primary text-primary rounded-md font-semibold text-label-sm hover:bg-primary hover:text-on-primary transition-colors inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          Đánh dấu đã đến
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DANH SÁCH TIẾP NHẬN (Bottom) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">format_list_bulleted</span>
              Danh sách tiếp nhận
            </h2>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant">
            {(['QUEUED', 'CONVERTED', 'CANCELLED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 font-semibold text-body-md border-b-2 transition-colors ${
                  activeTab === tab 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-t-md'
                }`}
              >
                {tab === 'QUEUED' && 'Chờ xử lý'}
                {tab === 'CONVERTED' && 'Đã chuyển RO'}
                {tab === 'CANCELLED' && 'Đã hủy'}
                <span className="ml-2 bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded-full text-label-sm">
                  {queueRecords.filter(r => r.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-outline-variant text-label-md text-secondary">
                  <th className="py-3 px-4 font-semibold">Loại / TG</th>
                  <th className="py-3 px-4 font-semibold">Biển số / Xe</th>
                  <th className="py-3 px-4 font-semibold">Khách hàng</th>
                  <th className="py-3 px-4 font-semibold">Dịch vụ yêu cầu</th>
                  <th className="py-3 px-4 font-semibold">Ghi chú</th>
                  {activeTab === 'QUEUED' && (
                    <th className="py-3 px-4 font-semibold text-right">Hành động</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {queueLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary py-10">Đang tải danh sách...</td>
                  </tr>
                ) : queueRecords.filter(r => r.status === activeTab).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary py-10">Danh sách trống.</td>
                  </tr>
                ) : (
                  (() => {
                    const filteredRecords = queueRecords.filter(r => r.status === activeTab);
                    const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                    return paginatedRecords.map((record) => {
                      const getTypeStyles = (type: string) => {
                        switch (type) {
                          case 'WALK_IN':
                            return 'bg-primary-container text-on-primary-container';
                          case 'TOW_IN':
                            return 'bg-tertiary-container text-on-tertiary-container';
                          case 'APPOINTMENT':
                            return 'bg-secondary-container text-on-secondary-container';
                          default:
                            return 'bg-surface-variant text-on-surface-variant';
                        }
                      };
                      
                      const getTypeName = (type: string) => {
                        switch (type) {
                          case 'WALK_IN': return 'Walk-In';
                          case 'TOW_IN': return 'Tow-In';
                          case 'APPOINTMENT': return 'Hẹn trước';
                          default: return type;
                        }
                      };

                      return (
                        <tr key={record.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              <span className={`w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getTypeStyles(record.intake_type)}`}>
                                {getTypeName(record.intake_type)}
                              </span>
                              <span className="text-label-sm font-code-mono text-secondary">
                                {new Date(record.arrived_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-label-md font-bold text-on-surface">{record.vehicle.license_plate}</span>
                              <span className="text-body-sm text-secondary">{record.vehicle.make} {record.vehicle.model}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-label-md font-semibold text-on-surface">{record.customer.full_name}</span>
                              <span className="text-body-sm text-secondary">{record.customer.phone || 'Chưa cập nhật'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {record.services && record.services.length > 0 ? (
                              <div className="flex flex-col items-start gap-1">
                                {record.services.map(s => (
                                  <span key={s.id} className="bg-surface-container-high text-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-outline-variant whitespace-nowrap">
                                    {s.service_template?.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-body-sm text-secondary italic">Không có</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-body-sm text-secondary">
                            {record.intake_type === 'TOW_IN' && record.tow_company && (
                              <div className="mb-1 text-tertiary font-semibold">Đơn vị kéo: {record.tow_company}</div>
                            )}
                            <span className="line-clamp-2">{record.notes || ''}</span>
                          </td>
                          {activeTab === 'QUEUED' && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleConvertToRO(record.id)}
                                  className="px-3 py-1.5 bg-primary text-on-primary rounded-md text-label-sm font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
                                >
                                  Lên lệnh
                                </button>
                                <button
                                  onClick={() => handleCancelIntake(record.id)}
                                  className="px-3 py-1.5 bg-surface-container border border-outline-variant text-error rounded-md text-label-sm font-semibold hover:bg-error-container transition-colors shadow-sm"
                                >
                                  Hủy
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {(() => {
            const filteredRecords = queueRecords.filter(r => r.status === activeTab);
            const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
            
            if (totalPages <= 1) return null;
            
            return (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-outline-variant">
                <div className="text-body-sm text-secondary">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredRecords.length)} trên tổng số {filteredRecords.length}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1 rounded-full hover:bg-surface-container disabled:opacity-50 text-secondary"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <span className="text-label-md font-semibold text-on-surface px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1 rounded-full hover:bg-surface-container disabled:opacity-50 text-secondary"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modals */}
      <WalkInIntakeModal
        isOpen={isWalkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        onSubmit={handleWalkInSubmit}
        services={serviceTemplates}
        customers={customers}
      />
      <TowInIntakeModal
        isOpen={isTowInModalOpen}
        onClose={() => setTowInModalOpen(false)}
        onSubmit={handleTowInSubmit}
        services={serviceTemplates}
        customers={customers}
      />
      <ConfirmModal
        isOpen={confirmAction?.isOpen || false}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        isDestructive={confirmAction?.isDestructive}
        onConfirm={confirmAction?.onConfirm || (() => {})}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
