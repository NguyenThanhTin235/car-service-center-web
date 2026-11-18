import React from 'react';
import { Appointment } from '@/store/slices/appointmentSlice';
import AppointmentCard from './AppointmentCard';

interface DailyCalendarGridProps {
  appointments: Appointment[];
  currentDate: Date;
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (date: Date, timeStr: string) => void;
}

export default function DailyCalendarGrid({ 
  appointments, 
  currentDate,
  onAppointmentClick,
  onTimeSlotClick 
}: DailyCalendarGridProps) {
  
  const d = new Date(currentDate);
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const today = new Date();
  const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

  const dayData = {
    name: dayNames[d.getDay()],
    dateStr: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`,
    fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    isToday,
    isWeekend
  };

  // Hours to render: 08:00 to 17:00
  const hours = Array.from({ length: 10 }, (_, i) => {
    return `${String(i + 8).padStart(2, '0')}:00`;
  });

  const getAppointmentsForSlot = (date: string, time: string) => {
    return appointments.filter(a => {
      const aptDate = typeof a.scheduled_date === 'string'
        ? a.scheduled_date.substring(0, 10)
        : new Date(a.scheduled_date).toISOString().split('T')[0];
      const aptTime = (a.scheduled_time_str || '').substring(0, 2);
      const slotTime = time.substring(0, 2);
      
      return aptDate === date && aptTime === slotTime;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col relative">
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header Row */}
          <div className="grid grid-cols-[80px_1fr] bg-slate-50 border-b border-slate-200 divide-x divide-slate-200">
            <div className="p-3 text-center text-xs font-bold text-slate-700 flex items-center justify-center">
              Giờ
            </div>
            
            <div className={`p-3 text-center ${dayData.isToday ? 'bg-blue-50/70' : dayData.isWeekend ? 'bg-slate-50/60' : ''}`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-xs uppercase tracking-wider ${dayData.isToday ? 'text-[#0050cd] font-bold' : 'text-slate-700 font-semibold'}`}>
                  {dayData.name}
                </span>
                {dayData.isToday && (
                  <span className="bg-[#0050cd] text-white text-xs font-bold px-2 py-0.5 rounded">Hôm nay</span>
                )}
              </div>
              <div className={`text-lg font-mono font-extrabold mt-0.5 ${dayData.isToday ? 'text-[#0050cd]' : 'text-slate-900'}`}>
                {dayData.dateStr}
              </div>
            </div>
          </div>

          {/* Time Grid Body */}
          <div className="relative divide-y divide-slate-200/70">
            {hours.map((hour, hIdx) => (
              <div key={hIdx} className="grid grid-cols-[80px_1fr] min-h-[92px] divide-x divide-slate-200/70 relative">
                {/* Time label */}
                <div className="flex items-center justify-center font-mono text-xs text-slate-700 font-bold bg-slate-50/60">
                  {hour}
                </div>

                {/* Day cell for this hour */}
                <div 
                  className="p-2 relative hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    if (e.target === e.currentTarget && onTimeSlotClick) {
                      onTimeSlotClick(new Date(dayData.fullDate), hour);
                    }
                  }}
                >
                  <div className="flex flex-col gap-1.5 pointer-events-none">
                    <div className="pointer-events-auto">
                      {getAppointmentsForSlot(dayData.fullDate, hour).map(apt => (
                        <AppointmentCard 
                          key={apt.id} 
                          appointment={apt} 
                          onClick={onAppointmentClick} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
