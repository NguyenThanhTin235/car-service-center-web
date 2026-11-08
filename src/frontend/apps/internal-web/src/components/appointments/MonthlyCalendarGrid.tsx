import React from 'react';
import { Appointment } from '@/store/slices/appointmentSlice';

interface MonthlyCalendarGridProps {
  appointments: Appointment[];
  currentDate: Date;
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (date: Date, timeStr: string) => void;
}

export default function MonthlyCalendarGrid({ 
  appointments, 
  currentDate,
  onAppointmentClick,
  onTimeSlotClick 
}: MonthlyCalendarGridProps) {
  
  // Calculate the calendar grid dates
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  // Get day of week (0 is Sunday, 1 is Monday)
  let firstDayOfWeek = firstDayOfMonth.getDay();
  // Adjust so Monday is 0 and Sunday is 6
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfWeek);

  // Generate 42 days (6 weeks)
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    
    const isCurrentMonth = d.getMonth() === month;
    const today = new Date();
    const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    return {
      date: d,
      dateNum: d.getDate(),
      fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      isCurrentMonth,
      isToday,
      isWeekend
    };
  });

  const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

  const getAppointmentsForDay = (dateStr: string) => {
    return appointments.filter(a => {
      const aptDate = typeof a.scheduled_date === 'string'
        ? a.scheduled_date.substring(0, 10)
        : new Date(a.scheduled_date).toISOString().split('T')[0];
      return aptDate === dateStr;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RESCHEDULED':
        return 'bg-blue-100 text-[#0050cd]';
      case 'ARRIVED':
        return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-amber-100 text-amber-800'; // REQUESTED
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col relative">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 divide-x divide-slate-200">
            {dayNames.map((name, idx) => (
              <div key={idx} className="p-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                {name}
              </div>
            ))}
          </div>

          {/* Calendar Grid Body */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/70">
            {calendarDays.map((day, idx) => {
              const dayAppointments = getAppointmentsForDay(day.fullDate);
              
              // Sort appointments by time
              dayAppointments.sort((a, b) => {
                return a.scheduled_time_str.localeCompare(b.scheduled_time_str);
              });

              return (
                <div 
                  key={idx} 
                  className={`min-h-[120px] p-2 flex flex-col gap-1 hover:bg-slate-50/50 transition-colors cursor-pointer border-b ${!day.isCurrentMonth ? 'bg-slate-50/40 opacity-60' : day.isWeekend ? 'bg-slate-50/20' : ''}`}
                  onClick={(e) => {
                    if (e.target === e.currentTarget && onTimeSlotClick) {
                      onTimeSlotClick(new Date(day.fullDate), '08:00'); // Default to 8 AM when clicking a day
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-1 pointer-events-none">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${day.isToday ? 'bg-[#0050cd] text-white' : 'text-slate-900'}`}>
                      {day.dateNum}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="text-xs text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                        {dayAppointments.length} lịch
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[130px] pr-1 pointer-events-auto styled-scrollbar">
                    {dayAppointments.map(apt => (
                      <div 
                        key={apt.id}
                        onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                        className={`shrink-0 text-xs leading-tight px-2 py-1 rounded truncate ${getStatusColor(apt.status)} cursor-pointer hover:opacity-85 transition-opacity`}
                        title={`${apt.scheduled_time_str} - ${apt.customer?.full_name || 'Khách'}`}
                      >
                        <span className="font-semibold mr-1">{apt.scheduled_time_str}</span>
                        {apt.vehicle?.license_plate || apt.customer?.full_name || 'Khách'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
