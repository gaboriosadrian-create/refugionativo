import React, { useState } from 'react';
import { X, Calendar, Ban, Wrench, FileText, Clock, User, Phone, Mail, HelpCircle, CheckCircle } from 'lucide-react';
import { CalendarEvent } from '../types';
import { useBackofficeCalendar } from '../hooks/useBackofficeCalendar';

interface EventDetailsModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onViewBookingDetails?: (bookingId: number) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  onViewBookingDetails
}) => {
  const { deleteBlock, loading } = useBackofficeCalendar();
  const [deleting, setDeleting] = useState(false);

  if (!event) return null;

  const isBooking = event.type === 'booking';
  const isBlock = event.type === 'block' || event.type === 'maintenance';

  const formatFriendlyDate = (iso: string) => {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleReleaseBlock = async () => {
    if (!window.confirm('¿Está seguro de que desea liberar esta disponibilidad y eliminar el bloqueo/mantenimiento?')) {
      return;
    }
    setDeleting(true);
    try {
      // Retrieve the accommodationId from the raw availability block or split the ID
      let accId = event.raw?.accommodationId;
      if (!accId && typeof event.id === 'string' && event.id.startsWith('block_')) {
        // block_accId_start_end
        const parts = event.id.split('_');
        accId = parts[1];
      }

      if (accId) {
        await deleteBlock(accId, event.startDate, event.endDate);
        onClose();
      } else {
        alert('No se pudo determinar el ID del alojamiento para este bloqueo.');
      }
    } catch (err: any) {
      alert(`Error al liberar el bloqueo: ${err.message || err}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            {isBooking ? (
              <span className="p-1.5 rounded-lg bg-forest/10 text-forest">
                <CheckCircle className="w-5 h-5" />
              </span>
            ) : event.type === 'maintenance' ? (
              <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                <Wrench className="w-5 h-5" />
              </span>
            ) : (
              <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                <Ban className="w-5 h-5" />
              </span>
            )}
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isBooking ? 'Reserva Registrada' : event.type === 'maintenance' ? 'Bloqueo de Mantenimiento' : 'Bloqueo de Disponibilidad'}
              </span>
              <h3 className="font-black text-sm text-slate-800 leading-tight">
                {isBooking ? `Reserva de ${event.title}` : event.title}
              </h3>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-450 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Dates & Duration Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
            <div className="flex items-start gap-2 text-xs">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Estadía / Rango</div>
                <div className="font-black text-slate-850 text-xs mt-0.5">
                  Desde: {formatFriendlyDate(event.startDate)}
                </div>
                <div className="font-black text-slate-850 text-xs">
                  Hasta: {formatFriendlyDate(event.endDate)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs pt-2.5 border-t border-slate-200/60 font-black text-slate-700">
              <Calendar className="w-4 h-4 text-forest" />
              <span>Duración del bloqueo: {event.nights} {event.nights === 1 ? 'noche' : 'noches'}</span>
            </div>
          </div>

          {/* Booking Specific details */}
          {isBooking && (
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Huéspedes</span>
                  <span className="font-black text-slate-800 text-xs">{event.guests || 1} personas</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Estado</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase mt-0.5 ${
                    event.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {event.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                  </span>
                </div>
              </div>

              {/* Booking Contact */}
              {event.raw && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Contacto del Huésped</span>
                  
                  {(event.raw as any).phone && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="font-bold">{(event.raw as any).phone}</span>
                    </div>
                  )}

                  {(event.raw as any).email && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-bold truncate">{(event.raw as any).email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes & Description */}
          {event.notes && (
            <div className="text-xs space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Observaciones / Notas</span>
              </span>
              <p className="text-slate-650 font-medium italic leading-relaxed">
                "{event.notes}"
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
          >
            Cerrar
          </button>

          {isBooking && onViewBookingDetails && event.raw && (
            <button
              onClick={() => {
                onViewBookingDetails(Number(event.raw?.id));
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-forest text-white hover:bg-forest-hover font-bold text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              Ver Ficha de Reserva
            </button>
          )}

          {isBlock && (
            <button
              onClick={handleReleaseBlock}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {deleting ? 'Liberando...' : 'Liberar Disponibilidad'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};


interface CreateBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBlockModal: React.FC<CreateBlockModalProps> = ({
  isOpen,
  onClose
}) => {
  const { createBlock, selectedStartDate, selectedEndDate, selectedAccommodationId } = useBackofficeCalendar();
  
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Por favor ingrese un motivo para el bloqueo.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createBlock(reason.trim(), notes.trim() || undefined, isMaintenance);
      onClose();
      // Reset state
      setReason('');
      setNotes('');
      setIsMaintenance(false);
    } catch (err: any) {
      setError(err.message || 'Error al aplicar el bloqueo de disponibilidad.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <Ban className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Backoffice</span>
              <h3 className="font-black text-sm leading-tight">Crear Bloqueo de Disponibilidad</h3>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-450 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          {/* Dates read-only */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-bold text-slate-700">
            <div>
              <span className="text-[9px] text-slate-450 uppercase block">Check-In</span>
              <span className="text-slate-800 text-xs font-black">{selectedStartDate}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-450 uppercase block">Check-Out (Excl.)</span>
              <span className="text-slate-800 text-xs font-black">{selectedEndDate}</span>
            </div>
          </div>

          {/* Block Type Selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450">Tipo de Bloqueo</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsMaintenance(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  !isMaintenance
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Administrativo</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMaintenance(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  isMaintenance
                    ? 'bg-orange-600 border-orange-600 text-white shadow-xs'
                    : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Mantenimiento</span>
              </button>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1">
            <label htmlFor="block-reason" className="block text-[10px] font-black uppercase tracking-wider text-slate-450">Motivo del Bloqueo</label>
            <input
              id="block-reason"
              type="text"
              required
              placeholder="Ej. Reparación de caldera, Bloqueo de propietario, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-250 px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-white outline-none focus:border-forest"
            />
          </div>

          {/* Notes extended Input */}
          <div className="space-y-1">
            <label htmlFor="block-notes" className="block text-[10px] font-black uppercase tracking-wider text-slate-450">Observaciones (Opcional)</label>
            <textarea
              id="block-notes"
              rows={3}
              placeholder="Detalles complementarios para el personal del complejo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-250 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white outline-none focus:border-forest resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-[#1e3a2b] hover:bg-[#14281e] text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Guardando...' : 'Confirmar Bloqueo'}
          </button>
        </div>

      </form>
    </div>
  );
};
