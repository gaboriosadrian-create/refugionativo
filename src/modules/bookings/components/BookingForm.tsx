import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, Phone, Mail, HelpCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { Booking, Cabin } from '../../../types';
import { BookingService } from '../services/BookingService';
import { useResort } from '../../../shared/contexts/ResortContext';

interface BookingFormProps {
  booking?: Booking | null; // if provided, we are in edit mode
  cabins: Cabin[];
  onClose: () => void;
  onSubmit: (bookingData: any) => Promise<void>;
  isDuplicate?: boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  booking,
  cabins,
  onClose,
  onSubmit,
  isDuplicate = false
}) => {
  const { resort } = useResort();

  // Primary fields
  const [cabinId, setCabinId] = useState<number>(booking ? booking.cabinId : (cabins[0]?.id || 0));
  const [name, setName] = useState(booking && !isDuplicate ? booking.name : '');
  const [phone, setPhone] = useState(booking && !isDuplicate ? booking.phone : '');
  const [email, setEmail] = useState(booking && !isDuplicate ? booking.email || '' : '');
  
  // Dates
  const [checkIn, setCheckIn] = useState(booking && !isDuplicate ? booking.checkIn : '');
  const [checkOut, setCheckOut] = useState(booking && !isDuplicate ? booking.checkOut : '');

  // Split guests
  const b = booking as any;
  const [adults, setAdults] = useState<number>(booking ? (b.adults ?? booking.guests ?? 1) : 1);
  const [children, setChildren] = useState<number>(booking ? (b.children ?? 0) : 0);
  const [babies, setBabies] = useState<number>(booking ? (b.babies ?? 0) : 0);
  const [pets, setPets] = useState<number>(booking ? (b.pets ?? 0) : 0);

  // Status and Meta
  const [status, setStatus] = useState<Booking['status']>(booking && !isDuplicate ? booking.status : 'pending');
  const [paymentStatus, setPaymentStatus] = useState<Booking['paymentStatus']>(booking && !isDuplicate ? (booking.paymentStatus || 'pending') : 'pending');
  const [paymentMethod, setPaymentMethod] = useState(booking && !isDuplicate ? (booking.paymentMethod || '') : '');
  const [notes, setNotes] = useState(booking && !isDuplicate ? (booking.notes || '') : '');
  const [internalRemarks, setInternalRemarks] = useState(booking && !isDuplicate ? (b.internalRemarks || '') : '');
  const [origin, setOrigin] = useState(booking ? (b.origin || 'Manual') : 'Manual');

  // Interactive estimates
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [nights, setNights] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Recalculate nights and prices in real-time
  useEffect(() => {
    if (!checkIn || !checkOut || checkIn >= checkOut || !cabinId) {
      setEstimatedPrice(null);
      setNights(0);
      return;
    }

    const calculatedNights = BookingService.calculateNights(checkIn, checkOut);
    setNights(calculatedNights);

    const cabin = cabins.find(c => c.id === cabinId);
    if (cabin) {
      const pricePerNight = (cabin as any).pricing?.basePrice || (cabin as any).price || 0;
      const discountPercent = (cabin as any).discount || 0;
      const effectivePricePerNight = Math.round(pricePerNight * (1 - discountPercent / 100));
      setEstimatedPrice(effectivePricePerNight * calculatedNights);
    }
  }, [checkIn, checkOut, cabinId, cabins]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate dates
      if (!checkIn || !checkOut) {
        throw new Error('Las fechas de check-in y check-out son obligatorias.');
      }
      if (checkIn >= checkOut) {
        throw new Error('La fecha de check-out debe ser posterior a la fecha de check-in.');
      }

      const totalGuests = adults + children;
      if (totalGuests <= 0) {
        throw new Error('Debe registrar al menos 1 huésped (adulto o niño).');
      }

      // Build payload
      const payload: any = {
        cabinId,
        accommodationId: cabinId,
        name,
        phone,
        email,
        guests: totalGuests,
        checkIn,
        checkOut,
        status,
        paymentStatus,
        paymentMethod,
        notes,
        internalRemarks,
        origin,
        adults,
        children,
        babies,
        pets,
        // Carry estimated price if available
        totalPrice: estimatedPrice || 0
      };

      // If we are editing, we pass the id
      if (booking && !isDuplicate) {
        payload.id = booking.id;
        payload.createdAt = booking.createdAt;
      }

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al procesar la reserva.');
    } finally {
      setSubmitting(false);
    }
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

      {/* Form Container */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1e3a2b]">
              {booking ? (isDuplicate ? 'Duplicar Reserva' : 'Editar Reserva') : 'Nueva Reserva Manual'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Complete todos los datos de la reserva.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Accommodation selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Alojamiento Asignado</label>
            <select
              required
              value={cabinId}
              onChange={(e) => setCabinId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
            >
              {cabins.map((cabin) => (
                <option key={cabin.id} value={cabin.id}>
                  {cabin.name} — Capacidad: {(cabin as any).capacity?.maxGuests || (cabin as any).capacity || (cabin as any).maxGuests || 1} pax (${formatPrice((cabin as any).pricing?.basePrice || (cabin as any).price || 0)}/noche)
                </option>
              ))}
            </select>
          </div>

          {/* Dates select */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Fecha Ingreso</span>
              </label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Fecha Salida</span>
              </label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
              />
            </div>
          </div>

          {/* Guest split inputs */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Distribución de Huéspedes</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">Adultos</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={adults}
                  onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:border-[#1e3a2b] bg-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">Niños (2-12a)</span>
                <input
                  type="number"
                  min="0"
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:border-[#1e3a2b] bg-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">Bebés (0-2a)</span>
                <input
                  type="number"
                  min="0"
                  value={babies}
                  onChange={(e) => setBabies(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:border-[#1e3a2b] bg-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">Mascotas</span>
                <input
                  type="number"
                  min="0"
                  value={pets}
                  onChange={(e) => setPets(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:border-[#1e3a2b] bg-white"
                />
              </div>
            </div>
          </div>

          {/* Guest Personal details */}
          <div className="space-y-3.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Datos Personales del Huésped</label>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellido Completo *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Teléfono de Contacto *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Correo Electrónico (Opcional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing, Status and payment details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estado Reserva</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Booking['status'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
              >
                <option value="pending">Pendiente de Pago</option>
                <option value="pending_approval">Por Aprobar / Solicitud</option>
                <option value="confirmed">Confirmada</option>
                <option value="checked_in">Check-in</option>
                <option value="checked_out">Check-out</option>
                <option value="no_show">No-Show</option>
                <option value="expired">Expirada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estado del Pago</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as Booking['paymentStatus'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="refunded">Reembolsado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Origen / Canal de Venta</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
              >
                <option value="Manual">Carga Manual / Interno</option>
                <option value="Directo (Web)">Directo (Sitio Web)</option>
                <option value="Booking.com">Booking.com</option>
                <option value="Airbnb">Airbnb</option>
                <option value="Expedia">Expedia</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Medio de Pago</label>
              <input
                type="text"
                placeholder="Ej: Transferencia, Tarjeta, Efectivo"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
              />
            </div>
          </div>

          {/* Notes and observations */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Notas Públicas (Huésped)</label>
            <textarea
              placeholder="Notas agregadas por el huésped, peticiones especiales, etc..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Observaciones Internas (Privadas)</label>
            <textarea
              placeholder="Notas internas exclusivas para el equipo administrativo..."
              rows={2}
              value={internalRemarks}
              onChange={(e) => setInternalRemarks(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1e3a2b] bg-slate-50/40"
            />
          </div>

          {/* Pricing Estimation Realtime Box */}
          {estimatedPrice !== null && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex justify-between items-center animate-in fade-in zoom-in-95 duration-150">
              <div className="space-y-0.5">
                <span className="text-emerald-800 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-emerald-200 text-emerald-600" />
                  <span>Presupuesto Estimado</span>
                </span>
                <p className="text-[11px] text-slate-500 font-medium">Estadía de {nights} noches en alojamiento seleccionado.</p>
              </div>
              <p className="text-xl font-black text-emerald-800">{formatPrice(estimatedPrice)}</p>
            </div>
          )}

        </form>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 rounded-xl bg-[#1e3a2b] hover:bg-[#14281e] text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>{booking && !isDuplicate ? 'Guardar Cambios' : 'Confirmar Reserva'}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
