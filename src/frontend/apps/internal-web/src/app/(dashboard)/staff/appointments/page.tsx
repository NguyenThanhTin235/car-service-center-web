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
import toast from 'react-hot-toast';

export default function AppointmentsPage() {
  const dispatch = useAppDispatch();
  const { appointments, loading, error, selectedAppointment } = useAppSelector(state => state.appointments);

  // Date state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  
  // Helper to format date without timezone shift
  const toApiDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Single-pass status counts for Bento filter tiles
  const statusCounts = useMemo(() => {
    let confirmed = 0;
    let requested = 0;
    let arrived = 0;
    for (const a of appointments) {
      if (a.status === 'CONFIRMED' || a.status === 'RESCHEDULED') confirmed += 1;
      else if (a.status === 'REQUESTED') requested += 1;
      else if (a.status === 'ARRIVED') arrived += 1;
    }
    return { confirmed, requested, arrived };
  }, [appointments]);

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
      // Month grid displays 42 days (6 weeks starting from Monday)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      let firstDayOfWeek = firstDayOfMonth.getDay();
      firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon = 0
      
      start.setTime(firstDayOfMonth.getTime());
      start.setDate(start.getDate() - firstDayOfWeek);
      start.setHours(0, 0, 0, 0);
      
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 41);
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
  const reloadAppointments = () => {
    dispatch(fetchAppointments({
      startDate: toApiDateStr(dateBoundaries.start),
      endDate: toApiDateStr(dateBoundaries.end),
      search: searchQuery
    }));
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(fetchAppointments({ 
        startDate: toApiDateStr(dateBoundaries.start), 
        endDate: toApiDateStr(dateBoundaries.end),
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
        toast.success(`Xác nhận lịch hẹn #${confirmAction.appointmentId} thành công!`);
      } else if (confirmAction.actionType === 'ARRIVE') {
        await dispatch(arriveAppointment(confirmAction.appointmentId)).unwrap();
        toast.success(`Tiếp nhận xe thành công! Xe đã vào hàng đợi tiếp nhận.`);
      }
      setConfirmAction(prev => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      console.error('Lỗi khi xác nhận:', err);
      const errMsg = typeof err === 'string' ? err : (err?.message || 'Thao tác không thành công');
      toast.error(errMsg);
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
      const rawDate = typeof apt.scheduled_date === 'string' ? apt.scheduled_date.substring(0, 10) : new Date(apt.scheduled_date).toISOString().substring(0, 10);
      const [y, m, d] = rawDate.split('-');
      const dateStr = `${d}/${m}/${y}`;
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
      toast.error('Không có dữ liệu lịch hẹn để tải xuống');
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
      
      const rawDate = typeof apt.scheduled_date === 'string' ? apt.scheduled_date.substring(0, 10) : new Date(apt.scheduled_date).toISOString().substring(0, 10);
      const [y, m, d] = rawDate.split('-');
      const dateStr = `${d}/${m}/${y}`;
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
    <div className="space-y-5">
      {/* 1. SaaS Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Lịch hẹn khách hàng
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadExcel}
            className="h-10 px-3.5 bg-white border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-700">download</span>
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="h-10 px-3.5 bg-white border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-[#0866ff]">print</span>
            <span>In lịch</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-10 px-4 bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Thêm lịch hẹn mới</span>
          </button>
        </div>
      </div>

      {/* 2. Asymmetrical Bento Summary & Navigation (5 + 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hero Calendar Control Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl saas-hero-gradient text-white p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-white">Tổng lịch hẹn trong kỳ</span>
              <div className="text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1 text-white">
                {appointments.length}{' '}
                <span className="text-sm font-sans font-medium text-white">lượt đặt</span>
              </div>
            </div>
            {/* Unboxed View Mode Switcher (Avoids Nested Card) */}
            <div className="inline-flex items-center gap-1.5">
              {(['DAY', 'WEEK', 'MONTH'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === mode
                      ? 'bg-white text-[#0050cd] font-bold'
                      : 'text-white hover:bg-white/15'
                  }`}
                >
                  {mode === 'DAY' ? 'Ngày' : mode === 'WEEK' ? 'Tuần' : 'Tháng'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-4 pt-3.5 border-t border-white/20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Hôm nay
              </button>
              <button
                onClick={handlePrev}
                className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Trước"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button
                onClick={handleNext}
                className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tiếp"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-white">
              <span className="material-symbols-outlined text-[15px]">date_range</span>
              <span>
                {formatDateStr(startOfWeek)} - {formatDateStr(endOfWeek)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Metric Tiles & Search Filter (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
              className={`text-left rounded-2xl p-4 border transition-all cursor-pointer ${
                statusFilter === 'CONFIRMED'
                  ? 'bg-blue-50/90 border-[#0866ff] shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Đã xác nhận</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#0866ff]" />
              </div>
              <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-1.5">
                {statusCounts.confirmed}
              </div>
              <span className="text-xs text-[#0050cd] font-medium">Sẵn sàng đón xe</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'REQUESTED' ? 'ALL' : 'REQUESTED')}
              className={`text-left rounded-2xl p-4 border transition-all cursor-pointer ${
                statusFilter === 'REQUESTED'
                  ? 'bg-amber-50/90 border-amber-400 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Chờ xác nhận</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-1.5">
                {statusCounts.requested}
              </div>
              <span className="text-xs text-amber-800 font-medium">Cần gọi xác nhận</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'ARRIVED' ? 'ALL' : 'ARRIVED')}
              className={`text-left rounded-2xl p-4 border transition-all cursor-pointer ${
                statusFilter === 'ARRIVED'
                  ? 'bg-emerald-50/90 border-emerald-400 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Đã tiếp nhận</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-1.5">
                {statusCounts.arrived}
              </div>
              <span className="text-xs text-emerald-800 font-medium">Đã vào xưởng</span>
            </button>
          </div>

          {/* Search & Status Select Bar (Flex siblings so icon never overlaps input) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex-1 flex items-center gap-2 h-9 px-3 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:bg-white focus-within:border-[#0866ff]">
              <span className="material-symbols-outlined text-[18px] text-slate-600 shrink-0">
                search
              </span>
              <input
                className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none"
                placeholder="Lọc nhanh tên khách hàng, số điện thoại hoặc biển số xe..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="material-symbols-outlined text-[18px] text-slate-600 shrink-0">filter_list</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto h-9 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:border-[#0866ff] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="REQUESTED">Chờ xác nhận</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="ARRIVED">Đã tiếp nhận</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Scheduler Grid Container */}
      {error && (
        <div className="rounded-2xl bg-rose-50/90 border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-800">
            <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0">error</span>
            <span>Không thể tải lịch hẹn: {error}</span>
          </div>
          <button
            type="button"
            onClick={reloadAppointments}
            className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {!loading && !error && appointmentsToDisplay.length === 0 && (
        <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="material-symbols-outlined text-[18px] text-slate-400">event_busy</span>
            <span>
              {searchQuery || statusFilter !== 'ALL'
                ? 'Không có lịch hẹn nào khớp với bộ lọc hiện tại.'
                : 'Chưa có lịch hẹn nào trong khoảng thời gian này.'}
            </span>
          </div>
          {(searchQuery || statusFilter !== 'ALL') ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="text-xs font-bold text-[#0866ff] hover:underline self-start sm:self-auto cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-bold text-[#0866ff] hover:underline self-start sm:self-auto cursor-pointer"
            >
              + Thêm lịch hẹn mới
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="saas-card p-12 flex flex-col items-center justify-center text-slate-600 gap-2">
          <span className="material-symbols-outlined text-[32px] text-[#0866ff] animate-spin">
            progress_activity
          </span>
          <p className="text-xs font-medium">Đang đồng bộ dữ liệu lịch hẹn...</p>
        </div>
      ) : (
        <div className="relative">
          {viewMode === 'DAY' && (
            <DailyCalendarGrid
              appointments={appointmentsToDisplay}
              currentDate={currentDate}
              onAppointmentClick={handleAppointmentClick}
              onTimeSlotClick={() => {
                setShowCreateModal(true);
              }}
            />
          )}
          {viewMode === 'WEEK' && (
            <WeeklyCalendarGrid
              appointments={appointmentsToDisplay}
              startOfWeek={startOfWeek}
              onAppointmentClick={handleAppointmentClick}
              onTimeSlotClick={() => {
                setShowCreateModal(true);
              }}
            />
          )}
          {viewMode === 'MONTH' && (
            <MonthlyCalendarGrid
              appointments={appointmentsToDisplay}
              currentDate={currentDate}
              onAppointmentClick={handleAppointmentClick}
              onTimeSlotClick={() => {
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
            dispatch(
              fetchAppointments({
                startDate: toApiDateStr(startOfWeek),
                endDate: toApiDateStr(endOfWeek),
                search: searchQuery,
              })
            );
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
          onClose={() => setConfirmAction((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={executeConfirmAction}
        />
      )}
    </div>
  );
}
