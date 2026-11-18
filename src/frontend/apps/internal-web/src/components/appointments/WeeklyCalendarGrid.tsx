import React from 'react';
import { Appointment } from '@/store/slices/appointmentSlice';
import AppointmentCard from './AppointmentCard';

interface WeeklyCalendarGridProps {
  appointments: Appointment[];
  startOfWeek: Date;
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (date: Date, timeStr: string) => void;
}

export default function WeeklyCalendarGrid({ 
  appointments, 
  startOfWeek,
  onAppointmentClick,
  onTimeSlotClick 
}: WeeklyCalendarGridProps) {
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const today = new Date();
    const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    return {
      name: dayNames[d.getDay()],
      dateStr: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`,
      fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      isToday,
      isWeekend
    };
  });

  // Hours to render: 08:00 to 17:00
  const hours = Array.from({ length: 10 }, (_, i) => {
    return `${String(i + 8).padStart(2, '0')}:00`;
  });

  const getAppointmentsForSlot = (date: string, time: string) => {
    return appointments.filter(a => {
      // Just check date string matching for simplicity with mock data
      const aptDate = typeof a.scheduled_date === 'string'
        ? a.scheduled_date.substring(0, 10)
        : new Date(a.scheduled_date).toISOString().split('T')[0];
      const aptTime = (a.scheduled_time_str || '').substring(0, 2); // '08:30' -> '08'
      const slotTime = time.substring(0, 2);
      
      return aptDate === date && aptTime === slotTime;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col relative">
      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          {/* Header Row */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-slate-50 border-b border-slate-200 divide-x divide-slate-200">
            <div className="p-3 text-center text-xs font-bold text-slate-700 flex items-center justify-center">
              Giờ
            </div>
            
            {weekDays.map((day, idx) => (
              <div 
                key={idx} 
                className={`p-3 text-center ${day.isToday ? 'bg-blue-50/70' : day.isWeekend ? 'bg-slate-50/60' : ''}`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`text-xs uppercase tracking-wider ${day.isToday ? 'text-[#0050cd] font-bold' : 'text-slate-700 font-semibold'}`}>
                    {day.name}
                  </span>
                  {day.isToday && (
                    <span className="bg-[#0050cd] text-white text-xs font-bold px-2 py-0.5 rounded">
                      Hôm nay
                    </span>
                  )}
                </div>
                <div className={`text-lg font-mono font-extrabold mt-0.5 ${day.isToday ? 'text-[#0050cd]' : 'text-slate-900'}`}>
                  {day.dateStr}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid Body */}
          <div className="relative divide-y divide-slate-200/70">
            {hours.map((hour, hIdx) => (
              <div key={hIdx} className="grid grid-cols-[80px_repeat(7,1fr)] min-h-[92px] divide-x divide-slate-200/70 relative">
                {/* Time label */}
                <div className="flex items-center justify-center font-mono text-xs text-slate-700 font-bold bg-slate-50/60">
                  {hour}
                </div>

                {/* Day cells for this hour */}
                {weekDays.map((day, dIdx) => {
                  const cellAppointments = getAppointmentsForSlot(day.fullDate, hour);
                  
                  return (
                    <div 
                      key={dIdx} 
                      className="p-1.5 relative hover:bg-slate-50/50 transition-colors"
                      onClick={(e) => {
                        // Prevent click if we clicked on a card (event bubbling)
                        if (e.target === e.currentTarget && onTimeSlotClick) {
                          onTimeSlotClick(new Date(day.fullDate), hour);
                        }
                      }}
                    >
                      <div className="flex flex-col gap-1.5">
                        {cellAppointments.map(apt => (
                          <AppointmentCard 
                            key={apt.id} 
                            appointment={apt} 
                            onClick={onAppointmentClick} 
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
