import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Layers } from 'lucide-react';
import { useBackofficeCalendar } from '../hooks/useBackofficeCalendar';
import { CalendarViewType } from '../types';

export const TimelineHeader: React.FC = () => {
  const {
    viewType,
    setViewType,
    currentDate,
    nextPeriod,
    prevPeriod,
    goToToday,
    jumpToMonthYear
  } = useBackofficeCalendar();

  // Month names for select
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Year list for select (jump jump)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

  // Friendly title based on view type
  const getHeaderTitle = () => {
    if (viewType === 'month') {
      return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } else if (viewType === 'week') {
      const start = new Date(currentDate);
      // Get Monday of that week
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(start.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startLabel = monday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const endLabel = sunday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      return `Semana: ${startLabel} al ${endLabel}`;
    } else {
      // 'day' view
      return currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    jumpToMonthYear(Number(e.target.value), currentDate.getFullYear());
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    jumpToMonthYear(currentDate.getMonth(), Number(e.target.value));
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-150/80 shadow-xs">
      
      {/* Navigation Controls Left */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={prevPeriod}
            title="Anterior"
            aria-label="Anterior"
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Hoy
          </button>

          <button
            onClick={nextPeriod}
            title="Siguiente"
            aria-label="Siguiente"
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Date jumper select dropdowns */}
        <div className="flex items-center gap-1.5">
          <select
            value={currentDate.getMonth()}
            onChange={handleMonthChange}
            className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 text-slate-700 cursor-pointer outline-none focus:border-forest/50 transition-colors"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>

          <select
            value={currentDate.getFullYear()}
            onChange={handleYearChange}
            className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 text-slate-700 cursor-pointer outline-none focus:border-forest/50 transition-colors"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Header Display Middle */}
      <div className="flex items-center gap-2.5">
        <Calendar className="w-5 h-5 text-forest shrink-0" />
        <h3 className="font-black text-base text-slate-800 capitalize tracking-tight">
          {getHeaderTitle()}
        </h3>
      </div>

      {/* View Type segmented selectors Right */}
      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 self-start lg:self-auto">
        {(['month', 'week', 'day'] as CalendarViewType[]).map((type) => {
          const isActive = viewType === type;
          const labels: Record<string, string> = {
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
          };

          return (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              {labels[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineHeader;
