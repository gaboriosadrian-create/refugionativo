import React from 'react';
import { useBackofficeCalendar } from '../hooks/useBackofficeCalendar';

export const TimelineLegend: React.FC = () => {
  const { colors } = useBackofficeCalendar();

  const legendItems = [
    { key: 'available', label: 'Disponible', theme: colors.available },
    { key: 'pending', label: 'Pendiente', theme: colors.pending },
    { key: 'confirmed', label: 'Confirmada', theme: colors.confirmed },
    { key: 'checkIn', label: 'Check-In Hoy', theme: colors.checkIn },
    { key: 'checkOut', label: 'Check-Out Hoy', theme: colors.checkOut },
    { key: 'maintenance', label: 'Mantenimiento', theme: colors.maintenance },
    { key: 'bloqueado', label: 'Bloqueado', theme: colors.bloqueado },
    { key: 'cancelled', label: 'Cancelada', theme: colors.cancelled },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Leyenda:</span>
      <div className="flex flex-wrap items-center gap-3">
        {legendItems.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className={`w-3.5 h-3.5 rounded-md border ${item.theme.bg} ${item.theme.border} shrink-0`}
            />
            <span className="text-xs font-bold text-slate-650">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineLegend;
