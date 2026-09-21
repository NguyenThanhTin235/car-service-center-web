import React from 'react';
import { Appointment } from '@/store/slices/appointmentSlice';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
}

export default function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  // Determine styles based on status
  let bgClass = '';
  let borderClass = '';
  let dotClass = '';
  let timeTextClass = '';

  switch (appointment.status) {
    case 'CONFIRMED':
    case 'RESCHEDULED':
      bgClass = 'bg-blue-50';
      borderClass = 'border-l-primary border-blue-200';
      dotClass = 'bg-primary';
      timeTextClass = 'text-primary';
      break;
    case 'REQUESTED':
      bgClass = 'bg-amber-50';
      borderClass = 'border-l-amber-500 border-amber-200';
      dotClass = 'bg-amber-500';
      timeTextClass = 'text-amber-700';
      break;
    case 'ARRIVED':
      bgClass = 'bg-emerald-50';
      borderClass = 'border-l-emerald-500 border-emerald-200';
      dotClass = 'bg-emerald-500';
      timeTextClass = 'text-emerald-700';
      break;
    case 'CANCELLED':
      bgClass = 'bg-slate-50 opacity-60';
      borderClass = 'border-l-slate-400 border-slate-200';
      dotClass = 'bg-slate-400';
      timeTextClass = 'text-slate-600';
      break;
    default:
      bgClass = 'bg-blue-50';
      borderClass = 'border-l-primary border-blue-200';
      dotClass = 'bg-primary';
      timeTextClass = 'text-primary';
  }

  let isOverdue = false;
  if (appointment.status === 'CONFIRMED' || appointment.status === 'REQUESTED' || appointment.status === 'RESCHEDULED') {
    const now = new Date();
    const aptDate = new Date(appointment.scheduled_date);
    if (appointment.scheduled_time_str) {
      const [h, m] = appointment.scheduled_time_str.split(':');
      aptDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      
      // Thêm 30 phút ân hạn (grace period)
      aptDate.setMinutes(aptDate.getMinutes() + 30);
      
      if (now > aptDate) {
        isOverdue = true;
        bgClass = 'bg-red-50';
        borderClass = 'border-l-error border-red-200';
        dotClass = 'bg-error';
        timeTextClass = 'text-error';
      }
    }
  }

  // Handle scheduled time display (format: HH:mm)
  const startTime = appointment.scheduled_time_str;

  const hasServices = appointment.services && appointment.services.length > 0;

  return (
    <div 
      onClick={() => onClick && onClick(appointment)}
      className={`p-2 rounded-lg ${bgClass} border-l-4 ${borderClass} border shadow-2xs hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className={`text-[11px] font-bold ${timeTextClass}`}>{startTime}</span>
          {isOverdue && <span className="material-symbols-outlined text-[14px] text-error" title="Quá giờ hẹn">warning</span>}
        </div>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
      </div>
      <div className="font-bold text-on-surface text-body-sm truncate mt-0.5">
        {appointment.customer?.full_name || 'Unknown Customer'}
      </div>
      <div className="inline-block px-1.5 py-0.2 bg-white border border-outline-variant/80 rounded font-code-mono text-[11px] text-on-surface mt-1 font-semibold">
        {appointment.vehicle?.license_plate || 'No Plate'}
      </div>
      
      <div className="mt-1.5 flex flex-col gap-0.5">
        {hasServices ? (
          appointment.services?.map((s: any, idx: number) => (
            <div key={idx} className="text-[11px] text-secondary leading-tight break-words flex items-start gap-1">
              <span className="opacity-50 mt-[3px] text-[6px]">●</span>
              <span>{s.name}</span>
            </div>
          ))
        ) : (
          <div className="text-[11px] text-secondary italic">Chưa có dịch vụ</div>
        )}
      </div>
    </div>
  );
}
