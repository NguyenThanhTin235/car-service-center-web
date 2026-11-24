import React from 'react';
import { Appointment } from '@/store/slices/appointmentSlice';

interface AppointmentDetailPopoverProps {
  appointment: Appointment;
  onClose: () => void;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onConfirm?: (appointment: Appointment) => void;
  onArrive?: (appointment: Appointment) => void;
}

export default function AppointmentDetailPopover({ 
  appointment, 
  onClose,
  onReschedule,
  onCancel,
  onConfirm,
  onArrive
}: AppointmentDetailPopoverProps) {
  
  // Status config
  let statusBadge = null;
  switch (appointment.status) {
    case 'CONFIRMED':
    case 'RESCHEDULED':
      statusBadge = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-bold bg-blue-50 text-primary border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          Đã xác nhận
        </span>
      );
      break;
    case 'REQUESTED':
      statusBadge = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Chờ xác nhận
        </span>
      );
      break;
    case 'ARRIVED':
      statusBadge = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Đã tiếp nhận
        </span>
      );
      break;
    case 'CANCELLED':
      statusBadge = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-bold bg-slate-50 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Đã hủy
        </span>
      );
      break;
  }

  const serviceNames = appointment.services && appointment.services.length > 0 
    ? appointment.services.map((s: any) => s.name).join(', ') 
    : 'Không có dịch vụ';

  return (
    <>
      {/* Invisible backdrop to detect outside clicks */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* The Popover */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết lịch hẹn #${appointment.id}`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] max-w-[92vw] max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl z-50 p-5 animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Popover Header */}
        <div className="flex items-start justify-between border-b border-outline-variant/70 pb-4">
          <div>
            <span className="text-xs text-secondary font-medium">Mã tiếp nhận</span>
            <h3 className="text-title-sm font-title-sm font-bold text-on-surface">Chi tiết lịch hẹn #{appointment.id}</h3>
          </div>
          {statusBadge}
        </div>

        {/* Customer Detail */}
        <div className="py-4 border-b border-outline-variant/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg" data-icon="person">person</span>
              <span className="font-bold text-on-surface text-body-md">{appointment.customer?.full_name || 'Khách vãng lai'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-6 text-body-sm text-secondary font-code-mono">
            <span className="material-symbols-outlined text-sm text-secondary" data-icon="call">call</span>
            <span>{appointment.customer?.phone || 'Chưa cập nhật'}</span>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="py-4 border-b border-outline-variant/60 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-base" data-icon="directions_car">directions_car</span>
              {appointment.vehicle?.make} {appointment.vehicle?.model}
            </span>
            <span className="font-code-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              {appointment.vehicle?.license_plate || 'Chưa cập nhật'}
            </span>
          </div>
        </div>

        {/* Warranty Appointment Banner */}
        {(appointment as any).is_warranty && (
          <div className="px-3.5 py-2.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5 text-xs text-emerald-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-emerald-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px] leading-none shrink-0">verified_user</span>
                <span>Lịch hẹn Bảo hành chính hãng (0 đồng)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900 shrink-0">Miễn phí 100%</span>
            </div>
            {(appointment as any).symptoms_description && (
              <p className="text-[11px] text-emerald-700 leading-relaxed pl-[26px]">
                <strong>Hiện tượng sự cố:</strong> {(appointment as any).symptoms_description}
              </p>
            )}
          </div>
        )}
        
        {/* Service Scope */}
        <div className="py-4 border-b border-outline-variant/60 flex flex-col gap-3 bg-slate-50/60 -mx-5 px-5">
          <div>
            <span className="text-label-sm font-label-sm text-secondary">Nội dung yêu cầu:</span>
            <p className="font-medium text-body-sm text-on-surface mt-0.5">{serviceNames}</p>
            {appointment.notes && (
              <p className="text-xs text-secondary italic mt-1">Ghi chú: {appointment.notes}</p>
            )}
            {appointment.cancel_reason && (
              <p className="text-xs text-error mt-1 font-semibold">Lý do hủy: {appointment.cancel_reason}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {appointment.status !== 'CANCELLED' && appointment.status !== 'ARRIVED' && (
          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={() => onArrive && onArrive(appointment)}
              disabled={appointment.status === 'REQUESTED'}
              title={appointment.status === 'REQUESTED' ? 'Cần xác nhận lịch hẹn trước khi tiếp nhận xe' : ''}
              className="w-full h-9 bg-primary-container hover:bg-primary text-on-primary font-label-md font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-container disabled:active:scale-100"
            >
              <span className="material-symbols-outlined text-base" data-icon="play_arrow">play_arrow</span>
              <span>Bắt đầu tiếp nhận xe</span>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <button 
                onClick={() => onReschedule(appointment)}
                className="h-8 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface text-label-sm font-semibold rounded flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm text-secondary" data-icon="edit_calendar">edit_calendar</span>
                Đổi giờ hẹn
              </button>
              
              {(appointment.status === 'REQUESTED' || appointment.status === 'RESCHEDULED') && onConfirm ? (
                <button 
                  onClick={() => onConfirm(appointment)}
                  className="h-8 bg-surface-container-lowest border border-outline-variant hover:bg-blue-50 text-primary text-label-sm font-semibold rounded flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm" data-icon="check_circle">check_circle</span>
                  Xác nhận
                </button>
              ) : appointment.customer?.phone ? (
                <a
                  href={`tel:${appointment.customer.phone}`}
                  className="h-8 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface text-label-sm font-semibold rounded flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm text-secondary" data-icon="phone_forwarded">phone_forwarded</span>
                  Gọi khách
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Khách hàng chưa có số điện thoại"
                  className="h-8 bg-surface-container-lowest border border-outline-variant text-on-surface/40 text-label-sm font-semibold rounded flex items-center justify-center gap-1 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm" data-icon="phone_disabled">phone_disabled</span>
                  Gọi khách
                </button>
              )}

              <button 
                onClick={() => onCancel(appointment)}
                className="h-8 bg-surface-container-lowest border border-error/30 hover:bg-error-container text-error text-label-sm font-semibold rounded flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm" data-icon="cancel">cancel</span>
                Hủy hẹn
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
