'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAppointments, confirmAppointment, setSelectedAppointment, arriveAppointment } from '@/store/slices/appointmentSlice';
import WeeklyCalendarGrid from '@/components/appointments/WeeklyCalendarGrid';
import DailyCalendarGrid from '@/components/appointments/DailyCalendarGrid';
import MonthlyCalendarGrid from '@/components/appointments/MonthlyCalendarGrid';
import AppointmentDetailPopover from '@/components/appointments/AppointmentDetailPopover';
import CreateAppointmentModal from '@/components/appointments/CreateAppointmentModal';
import RescheduleModal from '@/components/appointments/RescheduleModal';
import CancelConfirmDialog from '@/components/appointments/CancelConfirmDialog';
import ActionConfirmDialog from '@/components/appointments/ActionConfirmDialog';

export default function AppointmentsPage() {
  const dispatch = useAppDispatch();
  const { appointments, loading, selectedAppointment } = useAppSelector(state => state.appointments);

  // Date state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  
  // Calculate date boundaries based on viewMode
  const dateBoundaries = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    if (viewMode === 'DAY') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'WEEK') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'MONTH') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }
    
    return { start, end };
  }, [currentDate, viewMode]);

  const startOfWeek = dateBoundaries.start;
  const endOfWeek = dateBoundaries.end;

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'CONFIRM' | 'ARRIVE';
    appointmentId: number | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'CONFIRM',
    appointmentId: null
  });
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Load appointments
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(fetchAppointments({ 
        startDate: dateBoundaries.start.toISOString(), 
        endDate: dateBoundaries.end.toISOString(),
        search: searchQuery
      }));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [dispatch, dateBoundaries, searchQuery]);

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'DAY') newDate.setDate(newDate.getDate() - 1);
    else if (viewMode === 'WEEK') newDate.setDate(newDate.getDate() - 7);
    else if (viewMode === 'MONTH') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'DAY') newDate.setDate(newDate.getDate() + 1);
    else if (viewMode === 'WEEK') newDate.setDate(newDate.getDate() + 7);
    else if (viewMode === 'MONTH') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateStr = (d: Date) => {
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleAppointmentClick = (apt: any) => {
    dispatch(setSelectedAppointment(apt));
  };

  const handleClosePopover = () => {
    dispatch(setSelectedAppointment(null));
  };

  const handleConfirmAppointment = (apt: any) => {
    setConfirmAction({
      isOpen: true,
      title: 'Xác nhận lịch hẹn',
      message: `Bạn có chắc chắn muốn xác nhận lịch hẹn #${apt.id} của khách hàng ${apt.customer?.full_name || 'Khách vãng lai'}?`,
      actionType: 'CONFIRM',
      appointmentId: apt.id
    });
  };

  const handleRescheduleClick = (apt: any) => {
    setShowRescheduleModal(true);
  };

  const handleCancelClick = (apt: any) => {
    setShowCancelModal(true);
  };

  const handleArriveClick = (apt: any) => {
    setConfirmAction({
      isOpen: true,
      title: 'Bắt đầu tiếp nhận xe',
      message: `Khách hàng ${apt.customer?.full_name || ''} đã mang xe đến? Bạn có chắc chắn muốn bắt đầu làm phiếu tiếp nhận xe?`,
      actionType: 'ARRIVE',
      appointmentId: apt.id
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction.appointmentId) return;
    
    setIsConfirming(true);
    try {
      if (confirmAction.actionType === 'CONFIRM') {
        await dispatch(confirmAppointment(confirmAction.appointmentId)).unwrap();
      } else if (confirmAction.actionType === 'ARRIVE') {
        await dispatch(arriveAppointment(confirmAction.appointmentId)).unwrap();
      }
      setConfirmAction(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error('Lỗi khi xác nhận:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  const appointmentsToDisplay = useMemo(() => {
    return appointments.filter(a => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'CONFIRMED') return a.status === 'CONFIRMED' || a.status === 'RESCHEDULED';
      return a.status === statusFilter;
    });
  }, [appointments, statusFilter]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = appointmentsToDisplay.map((apt: any) => {
      const statusMap: Record<string, string> = {
        REQUESTED: 'Chờ xác nhận',
        CONFIRMED: 'Đã xác nhận',
        RESCHEDULED: 'Đã dời lịch',
        ARRIVED: 'Đã tiếp nhận',
        CANCELLED: 'Đã hủy'
      };
      const dateObj = new Date(apt.scheduled_date);
      const dateStr = dateObj.toLocaleDateString('vi-VN');
      const vehicleStr = (apt.vehicle?.license_plate || '') + ' - ' + (apt.vehicle?.make || '') + ' ' + (apt.vehicle?.model || '');
      const statusStr = statusMap[apt.status] || apt.status;
      
      return '<tr>' +
        '<td>' + dateStr + '</td>' +
        '<td>' + apt.scheduled_time_str + '</td>' +
        '<td>' + (apt.customer?.full_name || '') + '</td>' +
        '<td>' + (apt.customer?.phone || '') + '</td>' +
        '<td>' + vehicleStr + '</td>' +
        '<td class="status-' + apt.status + '"><strong>' + statusStr + '</strong></td>' +
      '</tr>';
    }).join('');

    const noDataRow = appointmentsToDisplay.length === 0 ? '<tr><td colspan="6" style="text-align:center;">Không có lịch hẹn nào</td></tr>' : '';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lịch hẹn - Car Service Center</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { text-align: center; color: #1a73e8; margin-bottom: 5px; }
          .subtitle { text-align: center; margin-bottom: 20px; font-style: italic; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f1f3f4; font-weight: bold; }
          .status-REQUESTED { color: #d97706; }
          .status-CONFIRMED, .status-RESCHEDULED { color: #2563eb; }
          .status-ARRIVED { color: #059669; }
          .status-CANCELLED { color: #dc2626; }
        </style>
      </head>
      <body>
        <h1>Danh sách lịch hẹn</h1>
        <div class="subtitle">Từ ngày ${formatDateStr(startOfWeek)} đến ngày ${formatDateStr(endOfWeek)}</div>
        <table>
          <thead>
            <tr>
              <th>Ngày hẹn</th>
              <th>Giờ</th>
              <th>Khách hàng</th>
              <th>SĐT</th>
              <th>Phương tiện</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            ${noDataRow}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleDownloadExcel = () => {
    if (appointmentsToDisplay.length === 0) {
      alert('Không có dữ liệu để tải xuống');
      return;
    }

    const tableRows = appointmentsToDisplay.map((apt: any) => {
      const statusMap: Record<string, string> = {
        REQUESTED: 'Chờ xác nhận',
        CONFIRMED: 'Đã xác nhận',
        RESCHEDULED: 'Đã dời lịch',
        ARRIVED: 'Đã tiếp nhận',
        CANCELLED: 'Đã hủy'
      };
      
      const dateObj = new Date(apt.scheduled_date);
      const dateStr = dateObj.toLocaleDateString('vi-VN');
      const vehicleStr = (apt.vehicle?.license_plate || '') + ' - ' + (apt.vehicle?.make || '') + ' ' + (apt.vehicle?.model || '');
      const statusStr = statusMap[apt.status] || apt.status;
      
      return '<tr>' +
        '<td>' + dateStr + '</td>' +
        '<td>' + apt.scheduled_time_str + '</td>' +
        '<td>' + (apt.customer?.full_name || '') + '</td>' +
        '<td>' + (apt.customer?.phone || '') + '</td>' +
        '<td>' + vehicleStr + '</td>' +
        '<td>' + statusStr + '</td>' +
      '</tr>';
    }).join('');

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>LichHen</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              <th style="background-color: #f1f3f4;">Ngày hẹn</th>
              <th style="background-color: #f1f3f4;">Giờ</th>
              <th style="background-color: #f1f3f4;">Khách hàng</th>
              <th style="background-color: #f1f3f4;">SĐT</th>
              <th style="background-color: #f1f3f4;">Phương tiện</th>
              <th style="background-color: #f1f3f4;">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LichHen_${formatDateStr(startOfWeek).replace(/\//g, '-')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* A. TOP CONTROL HEADER BAR */}
      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        {/* Left Column: Calendar Navigation Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          
          {/* Controls Cluster */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Navigation Cluster */}
            <div className="flex items-center gap-2">
              <button onClick={handleToday} className="h-9 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-label-md font-label-md text-on-surface font-medium transition-colors flex items-center justify-center">
                Hôm nay
              </button>
              <div className="inline-flex h-9 items-center rounded-lg border border-outline-variant bg-surface-container-lowest p-0.5 shadow-2xs">
                <button onClick={handlePrev} className="p-1 text-secondary hover:text-on-surface hover:bg-surface-container-low rounded transition-colors flex items-center justify-center" title="Trước">
                  <span className="material-symbols-outlined text-base" data-icon="chevron_left">chevron_left</span>
                </button>
                <button onClick={handleNext} className="p-1 text-secondary hover:text-on-surface hover:bg-surface-container-low rounded transition-colors flex items-center justify-center" title="Tiếp">
                  <span className="material-symbols-outlined text-base" data-icon="chevron_right">chevron_right</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 h-9 px-3 bg-surface-container-low rounded-lg text-title-sm font-title-sm text-primary">
                <span className="material-symbols-outlined text-base text-primary" data-icon="event">event</span>
                <span className="font-semibold whitespace-nowrap">{formatDateStr(startOfWeek)} - {formatDateStr(endOfWeek)}</span>
              </div>
            </div>
            {/* View Mode Switcher */}
            <div className="inline-flex h-9 items-center p-1 bg-surface-container-low rounded-lg border border-outline-variant/60">
              <button 
                onClick={() => setViewMode('DAY')}
                className={`px-3 py-1 rounded text-label-md font-label-md whitespace-nowrap transition-colors ${viewMode === 'DAY' ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs' : 'text-secondary hover:text-on-surface'}`}
              >Ngày</button>
              <button 
                onClick={() => setViewMode('WEEK')}
                className={`px-3 py-1 rounded text-label-md font-label-md whitespace-nowrap transition-colors ${viewMode === 'WEEK' ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs' : 'text-secondary hover:text-on-surface'}`}
              >Tuần</button>
              <button 
                onClick={() => setViewMode('MONTH')}
                className={`px-3 py-1 rounded text-label-md font-label-md whitespace-nowrap transition-colors ${viewMode === 'MONTH' ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs' : 'text-secondary hover:text-on-surface'}`}
              >Tháng</button>
            </div>
          </div>
        </div>
        {/* Right Column: Quick Filters & Primary CTA Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={handleDownloadExcel} className="h-9 px-3 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface text-label-md font-label-md font-medium rounded-lg flex items-center gap-1.5 transition-colors">
            <span className="material-symbols-outlined text-base text-secondary" data-icon="download">download</span>
            <span>Tải xuống Excel</span>
          </button>
          <button onClick={handlePrint} className="h-9 px-3 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface text-label-md font-label-md font-medium rounded-lg flex items-center gap-1.5 transition-colors">
            <span className="material-symbols-outlined text-base text-secondary" data-icon="print">print</span>
            <span>In lịch</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="h-9 px-4 bg-primary-container hover:bg-primary text-on-primary text-label-md font-label-md font-bold rounded-lg flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
          >
            <span>+ Thêm lịch hẹn mới</span>
          </button>
        </div>
      </div>

      {/* B. SUMMARY STATS & LEGEND BAR */}
      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant px-4 py-2.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        {/* Badges & Legend Indicators */}
        <div className="flex flex-wrap items-center gap-4 text-label-md font-label-md">
          <div className="flex items-center gap-2 bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-200">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
            <span className="text-on-surface font-medium">Đã xác nhận:</span>
            <span className="font-bold text-primary">
              {appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'RESCHEDULED').length} lịch
            </span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50/80 px-2.5 py-1 rounded-full border border-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-on-surface font-medium">Chờ xác nhận:</span>
            <span className="font-bold text-amber-700">
              {appointments.filter(a => a.status === 'REQUESTED').length} lịch
            </span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-on-surface font-medium">Đã tiếp nhận:</span>
            <span className="font-bold text-emerald-700">
              {appointments.filter(a => a.status === 'ARRIVED').length} lịch
            </span>
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-outline-variant">
            <span className="material-symbols-outlined text-base text-secondary" data-icon="filter_list">filter_list</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 bg-surface border border-outline-variant rounded-lg text-label-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="REQUESTED">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="ARRIVED">Đã tiếp nhận</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>
        {/* Search appointment in calendar */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-secondary pointer-events-none">
            <span className="material-symbols-outlined text-base" data-icon="search">search</span>
          </span>
          <input 
            className="w-full h-8 pl-8 pr-3 bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm placeholder:text-outline focus:outline-none focus:border-primary" 
            placeholder="Lọc tên khách hoặc biển số..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* C. INTERACTIVE WEEKLY SCHEDULER GRID */}
      {loading ? (
        <div className="flex justify-center p-8"><p>Loading appointments...</p></div>
      ) : (
        <div className="relative">
          {viewMode === 'DAY' && (
            <DailyCalendarGrid 
              appointments={appointmentsToDisplay} 
              currentDate={currentDate}
              onAppointmentClick={handleAppointmentClick} 
              onTimeSlotClick={(date, time) => {
                setShowCreateModal(true);
              }}
            />
          )}
          {viewMode === 'WEEK' && (
            <WeeklyCalendarGrid 
              appointments={appointmentsToDisplay} 
              startOfWeek={startOfWeek}
              onAppointmentClick={handleAppointmentClick} 
              onTimeSlotClick={(date, time) => {
                setShowCreateModal(true);
              }}
            />
          )}
          {viewMode === 'MONTH' && (
            <MonthlyCalendarGrid 
              appointments={appointmentsToDisplay} 
              currentDate={currentDate}
              onAppointmentClick={handleAppointmentClick} 
              onTimeSlotClick={(date, time) => {
                setShowCreateModal(true);
              }}
            />
          )}
          {selectedAppointment && (
            <AppointmentDetailPopover 
              appointment={selectedAppointment}
              onClose={handleClosePopover}
              onConfirm={handleConfirmAppointment}
              onCancel={handleCancelClick}
              onReschedule={handleRescheduleClick}
              onArrive={handleArriveClick}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateAppointmentModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            dispatch(fetchAppointments({ 
              startDate: startOfWeek.toISOString(), 
              endDate: endOfWeek.toISOString(),
              search: searchQuery
            }));
          }}
        />
      )}
      
      {showRescheduleModal && selectedAppointment && (
        <RescheduleModal 
          appointment={selectedAppointment} 
          onClose={() => setShowRescheduleModal(false)} 
        />
      )}

      {showCancelModal && selectedAppointment && (
        <CancelConfirmDialog 
          appointment={selectedAppointment} 
          onClose={() => setShowCancelModal(false)} 
        />
      )}

      {confirmAction.isOpen && (
        <ActionConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          isLoading={isConfirming}
          onClose={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
          onConfirm={executeConfirmAction}
        />
      )}
    </>
  );
}
