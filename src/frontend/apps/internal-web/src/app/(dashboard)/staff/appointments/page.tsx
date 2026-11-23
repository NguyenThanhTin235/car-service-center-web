'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAppointments, confirmAppointment, setSelectedAppointment, arriveAppointment } from '@/store/slices/appointmentSlice';
import WeeklyCalendarGrid from '@/components/appointments/WeeklyCalendarGrid';
import toast from 'react-hot-toast';

const DailyCalendarGrid = dynamic(
  () => import('@/components/appointments/DailyCalendarGrid'),
  { ssr: false }
);
const MonthlyCalendarGrid = dynamic(
  () => import('@/components/appointments/MonthlyCalendarGrid'),
  { ssr: false }
);
const AppointmentDetailPopover = dynamic(
  () => import('@/components/appointments/AppointmentDetailPopover'),
  { ssr: false }
);
const CreateAppointmentModal = dynamic(
  () => import('@/components/appointments/CreateAppointmentModal'),
  { ssr: false }
);
const RescheduleModal = dynamic(
  () => import('@/components/appointments/RescheduleModal'),
  { ssr: false }
);
const CancelConfirmDialog = dynamic(
  () => import('@/components/appointments/CancelConfirmDialog'),
  { ssr: false }
);
const ActionConfirmDialog = dynamic(
  () => import('@/components/appointments/ActionConfirmDialog'),
  { ssr: false }
);

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
  const [createSlot, setCreateSlot] = useState<{ date?: Date; time?: string }>({});
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
      if (statusFilter === 'WARRANTY') return (a as any).is_warranty === true;
      if (statusFilter === 'CONFIRMED') return a.status === 'CONFIRMED' || a.status === 'RESCHEDULED';
      return a.status === statusFilter;
    });
  }, [appointments, statusFilter]);

  const STATUS_LABELS_MAP: Record<string, string> = {
    REQUESTED: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    RESCHEDULED: 'Đã dời lịch',
    ARRIVED: 'Đã tiếp nhận',
    CANCELLED: 'Đã hủy',
  };

  const escapeHtml = (val: unknown): string =>
    String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const getSortedAppointmentsForExport = () => {
    return [...appointmentsToDisplay].sort((a: any, b: any) => {
      const dateA = typeof a.scheduled_date === 'string' ? a.scheduled_date.substring(0, 10) : new Date(a.scheduled_date).toISOString().substring(0, 10);
      const dateB = typeof b.scheduled_date === 'string' ? b.scheduled_date.substring(0, 10) : new Date(b.scheduled_date).toISOString().substring(0, 10);
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return String(a.scheduled_time_str || '').localeCompare(String(b.scheduled_time_str || ''));
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=780');
    if (!printWindow) {
      toast.error('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép pop-up.');
      return;
    }

    const sorted = getSortedAppointmentsForExport();
    const tableRows = sorted.map((apt: any, idx: number) => {
      const rawDate = typeof apt.scheduled_date === 'string' ? apt.scheduled_date.substring(0, 10) : new Date(apt.scheduled_date).toISOString().substring(0, 10);
      const [y, m, d] = rawDate.split('-');
      const dateStr = `${d}/${m}/${y}`;
      const plate = apt.vehicle?.license_plate || '-';
      const model = `${apt.vehicle?.make || ''} ${apt.vehicle?.model || ''}`.trim() || '-';
      const statusStr = STATUS_LABELS_MAP[apt.status] || apt.status;
      const notes = apt.notes || '-';

      return '<tr>' +
        '<td style="text-align:center">' + (idx + 1) + '</td>' +
        '<td style="text-align:center;white-space:nowrap">' + escapeHtml(dateStr) + '</td>' +
        '<td style="text-align:center;white-space:nowrap"><strong>' + escapeHtml(apt.scheduled_time_str || '-') + '</strong></td>' +
        '<td>' + escapeHtml(apt.customer?.full_name || '-') + '</td>' +
        '<td style="white-space:nowrap">' + escapeHtml(apt.customer?.phone || '-') + '</td>' +
        '<td style="white-space:nowrap"><strong>' + escapeHtml(plate) + '</strong></td>' +
        '<td>' + escapeHtml(model) + '</td>' +
        '<td class="status-' + escapeHtml(apt.status) + '"><strong>' + escapeHtml(statusStr) + '</strong></td>' +
        '<td>' + escapeHtml(notes) + '</td>' +
      '</tr>';
    }).join('');

    const noDataRow = sorted.length === 0 ? '<tr><td colspan="9" style="text-align:center;padding:24px;color:#64748b;">Không có lịch hẹn nào trong khoảng thời gian này</td></tr>' : '';
    const printedAt = `${new Date().toLocaleTimeString('vi-VN')} ${new Date().toLocaleDateString('vi-VN')}`;

    const printContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Danh sách lịch hẹn - Car Service Center</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 16px; color: #0f172a; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .brand-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 14px; }
          .brand-name { font-size: 14px; font-weight: bold; color: #1e40af; text-transform: uppercase; }
          .brand-sub { font-size: 11px; color: #475569; margin-top: 2px; }
          .meta-right { text-align: right; font-size: 11px; color: #475569; }
          h1 { text-align: center; color: #0f172a; font-size: 18px; margin: 8px 0 4px; text-transform: uppercase; }
          .subtitle { text-align: center; margin-bottom: 14px; color: #475569; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11.5px; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          th, td { border: 1px solid #cbd5e1; padding: 7px 8px; text-align: left; vertical-align: middle; }
          th { background-color: #1e40af; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 10.5px; }
          tbody tr:nth-child(even) { background-color: #f8fafc; }
          .status-REQUESTED { color: #d97706; }
          .status-CONFIRMED, .status-RESCHEDULED { color: #2563eb; }
          .status-ARRIVED { color: #059669; }
          .status-CANCELLED { color: #dc2626; }
          .footer-note { margin-top: 12px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="brand-header">
          <div>
            <div class="brand-name">TRUNG TÂM BẢO DƯỠNG &amp; SỬA CHỮA Ô TÔ CAR SERVICE CENTER</div>
            <div class="brand-sub">Địa chỉ: Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh • Hotline: 1900 6868</div>
          </div>
          <div class="meta-right">
            <div>Ngày in: ${escapeHtml(printedAt)}</div>
            <div>Tổng số lịch hẹn: <strong>${sorted.length}</strong></div>
          </div>
        </div>
        <h1>DANH SÁCH LỊCH HẸN KHÁCH HÀNG</h1>
        <div class="subtitle">Từ ngày <strong>${escapeHtml(formatDateStr(startOfWeek))}</strong> đến ngày <strong>${escapeHtml(formatDateStr(endOfWeek))}</strong></div>
        <table>
          <thead>
            <tr>
              <th style="text-align:center;width:36px;">STT</th>
              <th style="text-align:center;width:85px;">Ngày hẹn</th>
              <th style="text-align:center;width:60px;">Giờ</th>
              <th>Khách hàng</th>
              <th style="width:95px;">SĐT</th>
              <th style="width:95px;">Biển số</th>
              <th>Dòng xe</th>
              <th style="width:105px;">Trạng thái</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            ${noDataRow}
          </tbody>
        </table>
        <div class="footer-note">
          <span>Tài liệu trích xuất từ Hệ thống Quản trị Car Service Center</span>
          <span>Bộ phận Tiếp nhận &amp; Điều phối</span>
        </div>
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

  const handleDownloadExcel = async () => {
    const sorted = getSortedAppointmentsForExport();
    if (sorted.length === 0) {
      toast.error('Không có dữ liệu lịch hẹn để tải xuống');
      return;
    }

    try {
      const excelData = sorted.map((apt: any, idx: number) => {
        const rawDate = typeof apt.scheduled_date === 'string' ? apt.scheduled_date.substring(0, 10) : new Date(apt.scheduled_date).toISOString().substring(0, 10);
        const [y, m, d] = rawDate.split('-');
        const dateStr = `${d}/${m}/${y}`;
        return {
          'STT': idx + 1,
          'Ngày hẹn': dateStr,
          'Giờ hẹn': apt.scheduled_time_str || '-',
          'Khách hàng': apt.customer?.full_name || '',
          'Số điện thoại': apt.customer?.phone || '',
          'Biển số xe': apt.vehicle?.license_plate || '',
          'Dòng xe': `${apt.vehicle?.make || ''} ${apt.vehicle?.model || ''}`.trim(),
          'Trạng thái': STATUS_LABELS_MAP[apt.status] || apt.status,
          'Ghi chú': apt.notes || '',
        };
      });

      const exportTime = `${new Date().toLocaleTimeString('vi-VN')} ${new Date().toLocaleDateString('vi-VN')}`;
      const reportHeader = [
        ['TRUNG TÂM BẢO DƯỠNG & SỬA CHỮA Ô TÔ CAR SERVICE CENTER'],
        ['BÁO CÁO DANH SÁCH LỊCH HẸN KHÁCH HÀNG'],
        [],
        ['Khoảng thời gian:', `${formatDateStr(startOfWeek)} - ${formatDateStr(endOfWeek)}`],
        ['Ngày xuất báo cáo:', exportTime],
        [],
      ];

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.aoa_to_sheet(reportHeader);
      XLSX.utils.sheet_add_json(worksheet, excelData, { origin: 'A7' });

      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      ];

      worksheet['!cols'] = [
        { wch: 6 },  // STT
        { wch: 13 }, // Ngày hẹn
        { wch: 10 }, // Giờ hẹn
        { wch: 24 }, // Khách hàng
        { wch: 15 }, // SĐT
        { wch: 15 }, // Biển số
        { wch: 22 }, // Dòng xe
        { wch: 16 }, // Trạng thái
        { wch: 30 }, // Ghi chú
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch hẹn');
      XLSX.writeFile(workbook, `LichHen_${formatDateStr(startOfWeek).replace(/\//g, '-')}.xlsx`);
      toast.success('Đã xuất danh sách lịch hẹn thành công!');
    } catch (error) {
      console.error('Lỗi xuất Excel lịch hẹn:', error);
      toast.error('Có lỗi xảy ra khi xuất Excel!');
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Asymmetrical Bento Summary & Navigation (5 + 7 cols) */}
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
                <option value="WARRANTY">🛡️ Lịch hẹn bảo hành (0đ)</option>
                <option value="REQUESTED">Chờ xác nhận</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="ARRIVED">Đã tiếp nhận</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={handleDownloadExcel}
              className="h-9 px-3 bg-white border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-700">download</span>
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="h-9 px-3 bg-white border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0866ff]">print</span>
              <span>In lịch</span>
            </button>
            <button
              onClick={() => {
                setCreateSlot({});
                setShowCreateModal(true);
              }}
              className="h-9 px-3.5 bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">add_circle</span>
              <span>+ Thêm lịch hẹn mới</span>
            </button>
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
              onClick={() => {
                setCreateSlot({});
                setShowCreateModal(true);
              }}
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
              onTimeSlotClick={(date, timeStr) => {
                setCreateSlot({ date, time: timeStr });
                setShowCreateModal(true);
              }}
            />
          )}
          {viewMode === 'WEEK' && (
            <WeeklyCalendarGrid
              appointments={appointmentsToDisplay}
              startOfWeek={startOfWeek}
              onAppointmentClick={handleAppointmentClick}
              onTimeSlotClick={(date, timeStr) => {
                setCreateSlot({ date, time: timeStr });
                setShowCreateModal(true);
              }}
            />
          )}
          {viewMode === 'MONTH' && (
            <MonthlyCalendarGrid
              appointments={appointmentsToDisplay}
              currentDate={currentDate}
              onAppointmentClick={handleAppointmentClick}
              onTimeSlotClick={(date, timeStr) => {
                setCreateSlot({ date, time: timeStr });
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
          selectedDate={createSlot.date}
          selectedTime={createSlot.time}
          onClose={() => {
            setShowCreateModal(false);
            setCreateSlot({});
          }}
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
