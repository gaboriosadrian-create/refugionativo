import React from 'react';
import { Users, Info, Calendar, Ban, Wrench, ShieldCheck, HelpCircle } from 'lucide-react';
import { useBackofficeCalendar } from '../hooks/useBackofficeCalendar';
import { CalendarEvent } from '../types';
import { formatDateISO, parseDateISO, addDays } from '../utils/dateUtils';

interface TimelineGridProps {
  onSelectEvent: (event: CalendarEvent) => void;
  onOpenCreateBooking: (accommodationId: string | number, checkIn: string, checkOut: string) => void;
  onOpenCreateBlock: () => void;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  onSelectEvent,
  onOpenCreateBooking,
  onOpenCreateBlock
}) => {
  const {
    viewType,
    daysList,
    filteredAccommodations,
    eventsByAccommodation,
    selectedAccommodationId,
    selectedStartDate,
    selectedEndDate,
    selectRange,
    clearRangeSelection,
    colors
  } = useBackofficeCalendar();

  const todayISO = formatDateISO(new Date());

  // Columns styling rule
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `240px repeat(${daysList.length}, minmax(${viewType === 'month' ? '42px' : viewType === 'week' ? '120px' : '1fr'}, 1fr))`
  };

  // Helper to format weekday initials/labels
  const formatDayHeader = (date: Date) => {
    const dayLabel = date.toLocaleDateString('es-ES', { weekday: 'short' }); // e.g. "lun.", "mar."
    const dayNum = date.getDate();
    return {
      label: dayLabel.replace('.', '').substring(0, 3),
      num: dayNum,
      iso: formatDateISO(date)
    };
  };

  // Click handler for available cells
  const handleCellClick = (accommodationId: string | number, dateISO: string) => {
    // If we haven't selected anything, or we clicked a different accommodation,
    // we start a new selection (Check-In)
    if (selectedAccommodationId !== accommodationId || !selectedStartDate) {
      // Set Check-In to clicked date, and select Check-Out as the next day by default
      const nextDayISO = formatDateISO(addDays(parseDateISO(dateISO), 1));
      selectRange(accommodationId, dateISO, nextDayISO);
    } else {
      // We clicked on the same accommodation
      if (dateISO === selectedStartDate) {
        // Double click same cell -> keep single day selection
        return;
      }

      if (dateISO < selectedStartDate) {
        // Clicked date before current check-in -> reset check-in to this new date
        const nextDayISO = formatDateISO(addDays(parseDateISO(dateISO), 1));
        selectRange(accommodationId, dateISO, nextDayISO);
      } else {
        // Clicked date after check-in -> set as Check-Out!
        selectRange(accommodationId, selectedStartDate, dateISO);
      }
    }
  };

  // Calculates the grid columns and visual indicators for an event
  const getEventGridSpan = (event: CalendarEvent) => {
    const startISO = event.startDate;
    const endISO = event.endDate;

    const viewStartISO = formatDateISO(daysList[0]);
    const viewEndISO = formatDateISO(daysList[daysList.length - 1]);

    if (endISO <= viewStartISO || startISO > viewEndISO) {
      return null;
    }

    let startCol = daysList.findIndex(d => formatDateISO(d) === startISO);
    let endCol = daysList.findIndex(d => formatDateISO(d) === endISO);

    let continuesLeft = false;
    let continuesRight = false;

    if (startCol === -1) {
      startCol = 0;
      continuesLeft = true;
    }

    if (endCol === -1) {
      endCol = daysList.length; // span to end of visible days
      continuesRight = true;
    }

    // Sidebar takes col 1, so our day columns start at 2
    const gridStart = startCol + 2;
    const gridEnd = endCol + 2;

    return {
      gridStart,
      gridEnd,
      continuesLeft,
      continuesRight
    };
  };

  // Helper to retrieve color configs based on status
  const getEventColorTheme = (event: CalendarEvent) => {
    switch (event.status) {
      case 'pending': return colors.pending;
      case 'confirmed': return colors.confirmed;
      case 'check_in': return colors.checkIn;
      case 'check_out': return colors.checkOut;
      case 'cancelled': return colors.cancelled;
      case 'maintenance': return colors.maintenance;
      case 'blocked': return colors.bloqueado;
      default: return colors.confirmed;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-150/80 shadow-xs overflow-hidden flex flex-col">
      
      {/* Help / Context bar */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex flex-wrap justify-between items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Tip de interacción: Haga clic en una celda libre para Check-In y en otra posterior para Check-Out.</span>
        </span>

        {selectedStartDate && selectedEndDate && (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
            <span className="text-xs text-slate-600 font-bold">
              Rango: <span className="text-forest font-black">{selectedStartDate}</span> al <span className="text-forest font-black">{selectedEndDate}</span>
            </span>
            <button
              onClick={() => {
                if (selectedAccommodationId) {
                  onOpenCreateBooking(selectedAccommodationId, selectedStartDate, selectedEndDate);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-[#1e3a2b] hover:bg-[#14281e] text-white text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-all active:scale-95"
            >
              Reservar
            </button>
            <button
              onClick={onOpenCreateBlock}
              className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-all active:scale-95"
            >
              Bloquear / Mant.
            </button>
            <button
              onClick={clearRangeSelection}
              className="text-xs text-slate-400 hover:text-slate-600 font-extrabold px-1.5"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Grid container with horizontal scroll */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] select-none">
          
          {/* HEADER ROW */}
          <div style={gridStyle} className="border-b border-slate-150 bg-slate-50 text-slate-500 font-black">
            
            {/* Corner Sidebar cell */}
            <div className="p-3 border-r border-slate-150 text-xs text-slate-800 uppercase tracking-widest font-black flex items-center justify-between">
              <span>Alojamientos</span>
            </div>

            {/* Day columns headers */}
            {daysList.map((day, idx) => {
              const info = formatDayHeader(day);
              const isToday = info.iso === todayISO;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={info.iso}
                  className={`py-2 px-1 border-r border-slate-150 flex flex-col items-center justify-center text-center transition-colors ${
                    isToday ? 'bg-forest/5 text-forest font-black' : isWeekend ? 'bg-slate-100/40' : ''
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-tight opacity-75">{info.label}</span>
                  <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                    isToday ? 'bg-forest text-white shadow-xs' : 'text-slate-700'
                  }`}>
                    {info.num}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ACCOMMODATION ROWS */}
          <div className="divide-y divide-slate-100">
            {filteredAccommodations.length === 0 ? (
              <div className="p-12 text-center text-slate-450 text-sm font-bold bg-white">
                No se encontraron alojamientos que coincidan con los filtros aplicados.
              </div>
            ) : (
              filteredAccommodations.map((acc) => {
                const accEvents = eventsByAccommodation[acc.id] || [];

                return (
                  <div
                    key={acc.id}
                    style={gridStyle}
                    className="relative bg-white hover:bg-slate-50/20 transition-colors min-h-[76px]"
                  >
                    
                    {/* SIDEBAR CELL */}
                    <div className="p-3 border-r border-slate-150 flex items-center gap-2.5 bg-white z-20 sticky left-0 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                      <img
                        src={(acc as any).image || (acc as any).images?.[0] || 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=100&auto=format&fit=crop&q=60'}
                        alt={acc.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-800 truncate" title={acc.name}>
                          {acc.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            Pax: {acc.capacity?.maxGuests || (acc as any).capacity || 2}
                          </span>
                          
                          {/* Accommodation status bulb */}
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            acc.status === 'available' ? 'bg-emerald-500' :
                            acc.status === 'maintenance' ? 'bg-orange-500' :
                            acc.status === 'occupied' ? 'bg-forest' : 'bg-slate-400'
                          }`} title={`Alojamiento en estado: ${acc.status}`} />
                        </div>
                      </div>
                    </div>

                    {/* EMPTY CELL SLOTS (z-0 targets for background select) */}
                    {daysList.map((day, idx) => {
                      const dateISO = formatDateISO(day);
                      const isToday = dateISO === todayISO;
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                      // Is this date currently highlighted in our check-in/checkout select preview?
                      const isSelected = selectedAccommodationId === acc.id &&
                        selectedStartDate && selectedEndDate &&
                        dateISO >= selectedStartDate && dateISO < selectedEndDate;

                      return (
                        <button
                          key={`cell-${acc.id}-${dateISO}`}
                          onClick={() => handleCellClick(acc.id, dateISO)}
                          aria-label={`Fila ${acc.name}, Día ${dateISO}, libre. Seleccionar.`}
                          className={`border-r border-slate-150 h-full w-full min-h-[76px] transition-all cursor-pointer outline-none focus:bg-slate-100 relative ${
                            isSelected 
                              ? 'bg-forest/10 hover:bg-forest/15 ring-2 ring-forest/30 ring-inset z-10' 
                              : isToday 
                                ? 'bg-forest/5 hover:bg-forest/10' 
                                : isWeekend 
                                  ? 'bg-slate-100/20 hover:bg-slate-100/30' 
                                  : 'hover:bg-slate-50'
                          }`}
                        />
                      );
                    })}

                    {/* OVERLAY EVENT BLOCKS (z-10 absolute overlay placement using grid template values) */}
                    {accEvents.map((event) => {
                      const span = getEventGridSpan(event);
                      if (!span) return null; // completely outside view bounds

                      const theme = getEventColorTheme(event);
                      
                      // Modern Hospitality representation:
                      // If it is the start day, add a left margin offset representing afternoon check-in (ml-[50%])
                      // If it is the end day, add a right margin offset representing morning check-out (mr-[50%])
                      const isStartVisible = !span.continuesLeft;
                      const isEndVisible = !span.continuesRight;

                      const marginStyle = {
                        gridColumnStart: span.gridStart,
                        gridColumnEnd: span.gridEnd,
                        marginLeft: isStartVisible && event.type === 'booking' ? '50%' : '2px',
                        marginRight: isEndVisible && event.type === 'booking' ? '50%' : '2px',
                      };

                      // Icons selector
                      const getIcon = () => {
                        if (event.type === 'maintenance') return <Wrench className="w-3 h-3 text-orange-600" />;
                        if (event.type === 'block') return <Ban className="w-3 h-3 text-slate-500" />;
                        if (event.status === 'check_in') return <ShieldCheck className="w-3 h-3 text-indigo-700" />;
                        return <Users className="w-3 h-3 opacity-65 text-inherit" />;
                      };

                      return (
                        <div
                          key={event.id}
                          style={marginStyle}
                          onClick={(e) => {
                            e.stopPropagation(); // halt click propagation to cells underneath
                            onSelectEvent(event);
                          }}
                          className={`absolute inset-y-2 rounded-xl border p-2 flex flex-col justify-center min-w-[20px] shadow-xs cursor-pointer select-none transition-all hover:shadow-md z-10 font-bold ${theme.bg} ${theme.border} ${theme.text} ${
                            event.status === 'pending' ? 'border-dashed' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[10px] leading-none tracking-tight truncate">
                            {getIcon()}
                            <span className="font-extrabold truncate uppercase text-[9px] tracking-wide">
                              {event.title}
                            </span>
                          </div>

                          {/* Detail summary for longer blocks */}
                          {event.nights > 0 && (
                            <div className="text-[8px] font-medium opacity-85 mt-0.5 truncate leading-none">
                              {event.nights} {event.nights === 1 ? 'Noche' : 'Noches'}
                              {event.guests ? ` · ${event.guests} Huéspedes` : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
      
    </div>
  );
};

export default TimelineGrid;
