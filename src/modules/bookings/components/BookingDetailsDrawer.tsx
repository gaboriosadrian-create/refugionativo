import React, { useEffect, useState } from 'react';
import { X, Calendar, DollarSign, Clock, Home, ClipboardList, Info, FileText } from 'lucide-react';
import { Booking, Cabin } from '../../../types';
import { BookingService } from '../services/BookingService';
import { BookingHistory } from '../types';
import { BookingGuestCard } from './BookingGuestCard';
import { BookingStatusBadge, PaymentStatusBadge } from './BookingStatusBadge';
import { useResort } from '../../../shared/contexts/ResortContext';
import { StayWorkflowActions } from '../../stay-operations';

interface BookingDetailsDrawerProps {
  booking: Booking | null;
  onClose: () => void;
  cabins: Cabin[];
}

export const BookingDetailsDrawer: React.FC<BookingDetailsDrawerProps> = ({
  booking,
  onClose,
  cabins
}) => {
  const { resort } = useResort();
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!booking || !resort) return;

    setLoadingHistory(true);
    // Dynamic real-time subscription for booking audit logs
    const unsubscribe = BookingService.subscribeHistory(resort.id, (data) => {
      const filtered = data
        .filter(log => Number(log.bookingId) === Number(booking.id))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(filtered);
      setLoadingHistory(false);
    });

    return () => {
      unsubscribe();
    };
  }, [booking, resort]);

  if (!booking) return null;

  const b = booking as any;
  const cabin = cabins.find(c => c.id === booking.cabinId);
  const nights = BookingService.calculateNights(booking.checkIn, booking.checkOut);

  // Formatting helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Código de Reserva</span>
            <h3 className="text-base font-bold text-slate-800">#{booking.id}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Status Indicators */}
          <div className="flex flex-wrap items-center gap-3.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Estado Reserva</span>
              <BookingStatusBadge status={booking.status} />
            </div>
            <div className="border-l border-slate-200 h-8 self-center" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Estado Pago</span>
              <PaymentStatusBadge status={booking.paymentStatus || 'pending'} />
            </div>
            {booking.paymentMethod && (
              <>
                <div className="border-l border-slate-200 h-8 self-center" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Medio</span>
                  <span className="text-xs font-semibold text-slate-700">{booking.paymentMethod.toUpperCase()}</span>
                </div>
              </>
            )}
          </div>

          {/* Stay Operational Workflow */}
          <StayWorkflowActions 
            booking={booking}
            onTransitionSuccess={(updated) => {
              // Real-time listener will sync automatically
            }}
          />

          {/* Stays & Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/40 rounded-xl p-3.5 border border-slate-100/60">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                <Calendar className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Fechas de Estadía</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{nights} Noches</p>
              <div className="text-[11px] text-slate-600 mt-1.5 space-y-0.5">
                <div>Check-in: <span className="font-semibold">{booking.checkIn}</span></div>
                <div>Check-out: <span className="font-semibold">{booking.checkOut}</span></div>
              </div>
            </div>

            <div className="bg-slate-50/40 rounded-xl p-3.5 border border-slate-100/60">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                <DollarSign className="w-4 h-4 text-forest" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Importe Total</span>
              </div>
              <p className="text-base font-extrabold text-forest">{formatPrice(booking.totalPrice)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Promedio: {formatPrice(Math.round(booking.totalPrice / nights))} / noche
              </p>
            </div>
          </div>

          {/* Guest Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4" />
              <span>Detalles del Huésped</span>
            </h4>
            <BookingGuestCard booking={booking} />
          </div>

          {/* Cabin Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Home className="w-4 h-4" />
              <span>Alojamiento Asignado</span>
            </h4>
            {cabin ? (
              <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-xs">
                {cabin.images && cabin.images[0] && (
                  <div className="h-32 w-full overflow-hidden relative">
                    <img
                      src={cabin.images[0]}
                      alt={cabin.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent" />
                    <span className="absolute bottom-3 left-3 text-white font-bold text-sm drop-shadow-md">
                      {cabin.name}
                    </span>
                  </div>
                )}
                <div className="p-3.5 space-y-1.5 text-xs text-slate-600">
                  {!cabin.images?.[0] && <p className="font-bold text-slate-800 mb-1">{cabin.name}</p>}
                  <p className="line-clamp-2 leading-relaxed text-slate-500">{cabin.description}</p>
                  <div className="flex gap-4 font-semibold text-slate-700 pt-1 border-t border-slate-50 mt-1.5">
                    <div>Capacidad: <span className="font-bold text-slate-900">{(cabin as any).capacity?.maxGuests || cabin.capacity || (cabin as any).maxGuests || 1} personas</span></div>
                    <div>Precio Base: <span className="font-bold text-[#1e3a2b]">{formatPrice((cabin as any).pricing?.basePrice || (cabin as any).price || 0)}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 border border-dashed border-red-200 rounded-xl text-xs text-red-700 bg-red-50 flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Error: El alojamiento con ID {booking.cabinId} no está registrado en el sistema.</span>
              </div>
            )}
          </div>

          {/* History / Audit Logs */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Historial de Cambios y Auditoría</span>
            </h4>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#1e3a2b] border-t-transparent rounded-full animate-spin" />
                <span>Cargando bitácora de auditoría...</span>
              </div>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                No hay historial registrado para esta reserva.
              </p>
            ) : (
              <div className="relative pl-4 border-l-2 border-slate-100 space-y-4 text-xs">
                {history.map((log) => {
                  const actionLabels: Record<string, string> = {
                    creation: "Creación",
                    update: "Actualización",
                    confirmation: "Confirmación",
                    cancellation: "Cancelación",
                    date_change: "Cambio de fechas",
                    accommodation_change: "Cambio de cabaña",
                    status_change: "Cambio de estado"
                  };

                  const dotColors: Record<string, string> = {
                    creation: "bg-blue-500 ring-blue-100",
                    confirmation: "bg-emerald-500 ring-emerald-100",
                    cancellation: "bg-rose-500 ring-rose-100",
                    update: "bg-amber-500 ring-amber-100",
                    status_change: "bg-indigo-500 ring-indigo-100"
                  };

                  const logDotColor = dotColors[log.action] || "bg-slate-400 ring-slate-100";

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[21px] top-0.5 w-2 h-2 rounded-full ring-4 ${logDotColor}`} />
                      
                      <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 group-hover:bg-slate-50/80 transition-all">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-700 capitalize">
                            {actionLabels[log.action] || log.action}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(log.timestamp).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium">{log.description}</p>
                        {log.userId && (
                          <span className="text-[10px] text-[#1e3a2b] font-bold mt-1 block">
                            Modificado por: {log.userId}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1e3a2b] hover:bg-[#14281e] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>

      </div>
    </div>
  );
};
