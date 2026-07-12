import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '../types';

interface CalendarProps {
  cabinId: number;
  bookings: Booking[];
}

export const Calendar: React.FC<CalendarProps> = ({ cabinId, bookings }) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper: date to YYYY-MM-DD
  const formatDateISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const monthLabel = currentDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Days in month calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust Monday index (0: Mon, 1: Tue, ..., 6: Sun)
  const mondayOffsetIndex = (firstDayIndex + 6) % 7;

  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const todayISO = formatDateISO(new Date());

  const daysElements: React.ReactNode[] = [];

  // Add empty days for offset
  for (let i = 0; i < mondayOffsetIndex; i++) {
    daysElements.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Add month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month, d);
    const dayISO = formatDateISO(dayDate);

    // Find if date falls in any booking for selected cabin
    const dailyBookings = bookings.filter(b => 
      b.cabinId === cabinId && 
      b.status !== 'cancelled' &&
      dayISO >= b.checkIn && 
      dayISO < b.checkOut
    );

    let statusClass = 'bg-[#f5f6f3] text-ink hover:bg-slate-200';
    let statusTitle = 'Disponible';

    if (dailyBookings.some(b => b.status === 'confirmed')) {
      statusClass = 'bg-danger text-white font-semibold';
      statusTitle = 'Ocupado (Reservado)';
    } else if (dailyBookings.some(b => b.status === 'pending')) {
      statusClass = 'bg-warning/30 text-warning-800 font-semibold';
      statusTitle = 'Solicitado (Pendiente)';
    }

    const isToday = dayISO === todayISO;

    daysElements.push(
      <div
        key={`day-${d}`}
        title={`${dayISO} - ${statusTitle}`}
        className={`aspect-square grid place-items-center rounded-xl text-xs font-bold transition-all ${statusClass} ${
          isToday ? 'ring-2 ring-forest ring-offset-1' : ''
        }`}
      >
        {d}
      </div>
    );
  }

  return (
    <div className="border border-line rounded-[20px] bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base text-ink capitalize">{monthLabel}</h3>
        <div className="flex gap-1.5">
          <button
            onClick={prevMonth}
            type="button"
            className="grid w-8 h-8 place-items-center rounded-lg bg-sage text-forest hover:bg-sage/80 active:scale-95 cursor-pointer"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            type="button"
            className="grid w-8 h-8 place-items-center rounded-lg bg-sage text-forest hover:bg-sage/80 active:scale-95 cursor-pointer"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((day, idx) => (
          <div key={`wk-${idx}`} className="text-center text-[10px] font-bold text-muted uppercase pb-2">
            {day}
          </div>
        ))}
        {daysElements}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-[10px] text-muted border-t border-line pt-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f5f6f3]" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-warning/30" />
          Pendiente de confirmación
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-danger" />
          Ocupado
        </span>
      </div>
    </div>
  );
};
