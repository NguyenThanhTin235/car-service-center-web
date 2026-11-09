import React from 'react';
import { Appointment } from '@/store/slices/appointmentSlice';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
}

export default function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  // Determine styles based on status (Tone-on-tone surface without border-l-4 or nested card borders)
  let bgClass = '';
  let dotClass = '';
  let timeTextClass = '';

  switch (appointment.status) {
    case 'CONFIRMED':
    case 'RESCHEDULED':
      bgClass = 'bg-blue-50/90 hover:bg-blue-100/80';
      dotClass = 'bg-[#0866ff]';
      timeTextClass = 'text-[#0050cd]';
      break;
    case 'REQUESTED':
      bgClass = 'bg-amber-50/90 hover:bg-amber-100/80';
      dotClass = 'bg-amber-500';
      timeTextClass = 'text-amber-800';
      break;
    case 'ARRIVED':
      bgClass = 'bg-emerald-50/90 hover:bg-emerald-100/80';
      dotClass = 'bg-emerald-600';
      timeTextClass = 'text-emerald-800';
      break;
    case 'CANCELLED':
      bgClass = 'bg-slate-100 opacity-70';
      dotClass = 'bg-slate-500';
      timeTextClass = 'text-slate-700';
      break;
    default:
      bgClass = 'bg-blue-50/90 hover:bg-blue-100/80';
      dotClass = 'bg-[#0866ff]';
      timeTextClass = 'text-[#0050cd]';
  }

  let isOverdue = false;
  if (appointment.status === 'CONFIRMED' || appointment.status === 'REQUESTED' || appointment.status === 'RESCHEDULED') {
    const now = new Date();
    if (appointment.scheduled_time_str) {
      const [h, m] = appointment.scheduled_time_str.split(':');
      const rawDate = typeof appointment.scheduled_date === 'string' ? appointment.scheduled_date.substring(0, 10) : new Date(appointment.scheduled_date).toISOString().substring(0, 10);
      const [y, mon, d] = rawDate.split('-').map(Number);
      const aptDate = new Date(y, mon - 1, d, parseInt(h, 10), parseInt(m, 10), 0, 0);
      
      // Thêm 30 phút ân hạn (grace period)
      aptDate.setMinutes(aptDate.getMinutes() + 30);
      
      if (now > aptDate) {
        isOverdue = true;
        bgClass = 'bg-rose-50/95 hover:bg-rose-100/80';
        dotClass = 'bg-rose-600';
        timeTextClass = 'text-rose-800';
      }
    }
  }

  const startTime = appointment.scheduled_time_str;
  const hasServices = appointment.services && appointment.services.length > 0;

  return (
    <div 
      onClick={() => onClick && onClick(appointment)}
      className={`p-2.5 rounded-lg ${bgClass} transition-colors cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className={`text-xs font-mono font-bold ${timeTextClass}`}>{startTime}</span>
          {isOverdue && <span className="material-symbols-outlined text-[14px] text-rose-700" title="Quá giờ hẹn">warning</span>}
        </div>
        <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
      </div>
      <div className="font-bold text-slate-900 text-xs truncate mt-1">
        {appointment.customer?.full_name || 'Khách vãng lai'}
      </div>
      <div className="font-mono text-xs text-slate-800 mt-0.5 font-semibold">
        {appointment.vehicle?.license_plate || 'Chưa có biển số'}
      </div>
      
      <div className="mt-1.5 flex flex-col gap-0.5">
        {hasServices ? (
          appointment.services?.map((s: any, idx: number) => (
            <div key={idx} className="text-xs text-slate-700 leading-snug break-words">
              • {s.name}
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-600 italic">Chưa có dịch vụ</div>
        )}
      </div>
    </div>
  );
}
