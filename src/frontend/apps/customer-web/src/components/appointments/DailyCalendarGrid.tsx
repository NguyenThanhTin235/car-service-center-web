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
    fullDate: d.toLocaleDateString('en-CA'), // YYYY-MM-DD
    isToday,
    isWeekend
  };

  // Hours to render: 08:00 to 17:00
  const hours = Array.from({ length: 10 }, (_, i) => {
    return `${String(i + 8).padStart(2, '0')}:00`;
  });

  const getAppointmentsForSlot = (date: string, time: string) => {
    return appointments.filter(a => {
      const aptDate = new Date(a.scheduled_date).toISOString().split('T')[0];
      const aptTime = a.scheduled_time_str.substring(0, 2);
      const slotTime = time.substring(0, 2);
      
      return aptDate === date && aptTime === slotTime;
    });
  };

  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm overflow-hidden flex flex-col relative">
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header Row */}
          <div className="grid grid-cols-[80px_1fr] bg-[#F8FAFC] border-b border-outline-variant divide-x divide-outline-variant">
            <div className="p-3 text-center text-label-sm font-label-sm font-semibold text-secondary flex items-center justify-center">
              Giờ
            </div>
            
            <div className={`p-3 text-center ${dayData.isToday ? 'bg-blue-50/70 relative' : dayData.isWeekend ? 'bg-slate-50/60' : ''}`}>
              {dayData.isToday && (
                <span className="absolute top-1 right-2 bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.2 rounded">Hôm nay</span>
              )}
              <div className={`text-label-sm font-label-sm font-medium uppercase tracking-wider ${dayData.isToday ? 'text-primary font-bold' : 'text-secondary'}`}>
                {dayData.name}
              </div>
              <div className={`text-headline-md font-headline-md font-bold ${dayData.isToday ? 'text-primary' : 'text-on-surface'}`}>
                {dayData.dateStr}
              </div>
            </div>
          </div>

          {/* Time Grid Body */}
          <div className="relative divide-y divide-outline-variant/60">
            {hours.map((hour, hIdx) => (
              <div key={hIdx} className="grid grid-cols-[80px_1fr] min-h-[92px] divide-x divide-outline-variant/50 relative">
                {/* Time label */}
                <div className="flex items-center justify-center font-code-mono text-xs text-secondary font-medium bg-[#FAFAFA]">
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
