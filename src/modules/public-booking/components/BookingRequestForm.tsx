import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Check, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  MessageCircle, 
  DollarSign, 
  Info,
  ChevronRight,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { useWebsite } from '../../public-portal/contexts/WebsiteContext';
import { useSearch } from '../../public-search/contexts/SearchContext';
import { calculateNightsCount, formatGuestsText } from '../../public-search/utils/searchUtils';
import { validateBookingRequest } from '../validators/bookingValidator';
import { BookingRequestInput, BookingRequestError } from '../types';
import { BookingService } from '../../bookings/services/BookingService';
import { useResort } from '../../../shared/contexts/ResortContext';
import { PaymentService } from '../../payments/services/PaymentService';

export const BookingRequestForm: React.FC = () => {
  const { navigateTo, selectedSlug, settings, accommodations } = useWebsite();
  const { criteria, results } = useSearch();
  const { resort } = useResort();

  // Find the selected accommodation and search result item
  const selectedAcc = accommodations.find(a => a.slug === selectedSlug);
  const searchItem = results.find(item => item.accommodation.slug === selectedSlug);

  const [formInput, setFormInput] = useState<BookingRequestInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    notes: '',
    adults: criteria?.adults || 2,
    children: criteria?.children || 0,
    babies: criteria?.babies || 0,
    pets: criteria?.pets || 0,
    policyAccepted: false
  });

  const [errors, setErrors] = useState<BookingRequestError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  // Sync state with criteria if search is active
  useEffect(() => {
    if (criteria) {
      setFormInput(prev => ({
        ...prev,
        adults: criteria.adults,
        children: criteria.children,
        babies: criteria.babies,
        pets: criteria.pets
      }));
    }
  }, [criteria]);

  if (!selectedAcc) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center space-y-6 p-8 border border-slate-100 rounded-3xl bg-slate-50">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <div className="space-y-2">
          <h3 className="font-display font-extrabold text-xl text-slate-800">Alojamiento No Seleccionado</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Por favor, selecciona un alojamiento disponible e inicia tu solicitud desde la sección de búsqueda.
          </p>
        </div>
        <button 
          onClick={() => navigateTo('home')}
          className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[var(--public-primary)] hover:opacity-95 text-white font-bold text-xs px-6 cursor-pointer transition-all"
        >
          Ir al Buscador
        </button>
      </div>
    );
  }

  // Calculate stay duration
  const nights = criteria?.checkIn && criteria?.checkOut
    ? calculateNightsCount(criteria.checkIn, criteria.checkOut)
    : 0;

  // Use values from searchItem if available, else fallback or calculate locally
  const pricingResult = searchItem?.pricingResult;
  const totalPrice = pricingResult?.totalPrice || (((selectedAcc as any).price || (selectedAcc as any).pricing?.basePrice || 0) * nights);
  const basePrice = pricingResult?.basePrice || (((selectedAcc as any).price || (selectedAcc as any).pricing?.basePrice || 0) * nights);
  const feesTotal = pricingResult?.feesTotal || 0;
  const taxesTotal = pricingResult?.taxesTotal || 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormInput(prev => ({ ...prev, [name]: checked }));
      if (checked && errors.policyAccepted) {
        setErrors(prev => ({ ...prev, policyAccepted: undefined }));
      }
    } else {
      setFormInput(prev => ({ ...prev, [name]: value }));
      if (errors[name as keyof BookingRequestError]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resort) return;

    const validationErrors = validateBookingRequest(formInput);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error for accessibility
      const firstErrorKey = Object.keys(validationErrors)[0];
      const element = document.getElementsByName(firstErrorKey)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Build parameters for our specific BookingService.createBookingRequest
      const reqPayload = {
        cabinId: Number(selectedAcc.id),
        checkIn: criteria.checkIn,
        checkOut: criteria.checkOut,
        name: `${formInput.firstName.trim()} ${formInput.lastName.trim()}`,
        phone: formInput.phone.trim(),
        email: formInput.email.trim(),
        guests: formInput.adults + formInput.children,
        notes: formInput.notes.trim()
      };

      const result = await BookingService.createBookingRequest(resort.id, reqPayload, 'Public Portal');
      setSuccessBooking(result);
    } catch (err: any) {
      console.error('Error creating booking request:', err);
      setErrors({ general: err.message || 'Error al procesar tu solicitud. Por favor, reintenta.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: settings?.currency || 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Success view
  if (successBooking) {
    const resortName = settings?.businessName || 'StayFlow';
    const whatsappContact = settings?.whatsapp || '5492945550138';
    
    const whatsappMsg = encodeURIComponent(
      `Hola ${resortName}! He enviado mi solicitud de reserva de manera online.\n\n` +
      `- *Código de Solicitud:* #${successBooking.id}\n` +
      `- *Alojamiento:* ${selectedAcc.name}\n` +
      `- *Fechas:* ${successBooking.checkIn} al ${successBooking.checkOut} (${nights} noches)\n` +
      `- *Huésped:* ${successBooking.name}\n` +
      `- *Monto:* ${formatPrice(successBooking.totalPrice)}\n\n` +
      `¿Me podrían indicar los pasos a seguir para abonar y completar la confirmación? ¡Gracias!`
    );

    const handlePayNow = async () => {
      if (!resort) return;
      setIsPaying(true);
      try {
        const baseUrl = window.location.origin;
        const payment = await PaymentService.createPayment(
          resort.id,
          successBooking.id,
          successBooking.totalPrice,
          'mercado_pago',
          selectedAcc.name,
          baseUrl
        );
        if (payment && payment.paymentUrl) {
          window.location.href = payment.paymentUrl;
        }
      } catch (err) {
        console.error('Error initiating payment:', err);
        alert('Ocurrió un error al conectar con la pasarela de Mercado Pago. Intenta por WhatsApp.');
      } finally {
        setIsPaying(false);
      }
    };

    return (
      <div className="max-w-3xl mx-auto my-12 px-4 animate-fade-in">
        <div className="bg-white border border-slate-150 rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-8 relative overflow-hidden">
          {/* Confetti decoration */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
          
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-[11px] font-extrabold uppercase tracking-widest rounded-full border border-amber-200">
              Solicitud de Reserva Registrada
            </span>
            <h2 className="font-display font-black text-3xl text-slate-900 tracking-tight">
              ¡Muchas gracias, {formInput.firstName}!
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
              Hemos registrado tu solicitud de reserva bajo el código <strong className="text-forest font-extrabold font-mono">#{successBooking.id}</strong>. Para asegurar tu estadía, puedes realizar el pago instantáneo a continuación o aguardar la confirmación manual de nuestro equipo.
            </p>
          </div>

          {/* Reservation Card Details */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-6 text-left max-w-xl mx-auto space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-150">
              <span className="font-bold text-slate-800 text-sm">{selectedAcc.name}</span>
              <span className="text-xs font-mono font-extrabold text-slate-400">ID: #{selectedAcc.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Llegada</span>
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {successBooking.checkIn}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Salida</span>
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {successBooking.checkOut}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Huéspedes</span>
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {formatGuestsText(formInput.adults, formInput.children, formInput.babies, formInput.pets)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Monto Estimado</span>
                <p className="font-extrabold text-emerald-700 text-sm">
                  {formatPrice(successBooking.totalPrice)}
                </p>
              </div>
            </div>
          </div>

          {/* Checkout Section Option */}
          <div className="bg-sky-50 border border-sky-150 rounded-2xl p-6 max-w-xl mx-auto text-center space-y-4">
            <div className="space-y-1.5">
              <h4 className="font-display font-black text-sm text-sky-950 uppercase tracking-tight flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span>Confirmación Inmediata de Reserva</span>
              </h4>
              <p className="text-slate-600 text-xs font-sans">
                Abona de forma 100% segura mediante Mercado Pago para confirmar tu estadía al instante sin esperas administrativas de aprobación manual.
              </p>
            </div>

            <button
              onClick={handlePayNow}
              disabled={isPaying}
              className="w-full inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-center uppercase tracking-wide"
            >
              {isPaying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando pasarela...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pagar con Mercado Pago</span>
                </>
              )}
            </button>
            <span className="text-[9.5px] text-sky-800 font-bold block">Conexión encriptada SSL · Transacción protegida</span>
          </div>

          {/* Next Steps List */}
          <div className="max-w-xl mx-auto text-left space-y-4 pt-2">
            <h4 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Otras alternativas de confirmación:</span>
            </h4>
            <div className="space-y-3.5">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs flex items-center justify-center shrink-0">1</div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  <strong>Aceleración por WhatsApp:</strong> Si prefieres transferencia bancaria u otros medios, haz clic en el botón de WhatsApp a continuación para enviarnos el comprobante o coordinar el saldo.
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-xl mx-auto">
            <a
              href={`https://wa.me/${whatsappContact}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#20a95a] hover:opacity-95 text-white font-bold text-xs px-6 shadow-md transition-all active:scale-95 cursor-pointer text-center"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Coordinar por WhatsApp</span>
            </a>
            
            <button
              onClick={() => navigateTo('home')}
              className="w-full sm:w-auto inline-flex min-h-[48px] items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 cursor-pointer transition-all"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-fade-in">
      {/* Return link */}
      <button
        onClick={() => navigateTo('home')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[var(--public-primary)] mb-6 transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al Buscador</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Information form */}
        <div className="lg:col-span-7 bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--public-primary)]">Paso Final</span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1">Completa tus datos</h1>
            <p className="text-slate-500 text-xs mt-1">Ingresa los datos del titular para registrar la solicitud de reserva.</p>
          </div>

          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nombre *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formInput.firstName}
                  onChange={handleInputChange}
                  placeholder="Ej. Juan"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 transition-all bg-slate-50/50 ${
                    errors.firstName 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-[var(--public-primary)] focus:ring-[var(--public-primary)]'
                  }`}
                />
                {errors.firstName && <p className="text-[10px] text-red-600 font-medium">{errors.firstName}</p>}
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Apellido *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formInput.lastName}
                  onChange={handleInputChange}
                  placeholder="Ej. Pérez"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 transition-all bg-slate-50/50 ${
                    errors.lastName 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-[var(--public-primary)] focus:ring-[var(--public-primary)]'
                  }`}
                />
                {errors.lastName && <p className="text-[10px] text-red-600 font-medium">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email de Contacto *</label>
                <input
                  type="email"
                  name="email"
                  value={formInput.email}
                  onChange={handleInputChange}
                  placeholder="Ej. juan.perez@email.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 transition-all bg-slate-50/50 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-[var(--public-primary)] focus:ring-[var(--public-primary)]'
                  }`}
                />
                {errors.email && <p className="text-[10px] text-red-600 font-medium">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Teléfono (WhatsApp) *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formInput.phone}
                  onChange={handleInputChange}
                  placeholder="Ej. +54 9 294 15412345"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 transition-all bg-slate-50/50 ${
                    errors.phone 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-[var(--public-primary)] focus:ring-[var(--public-primary)]'
                  }`}
                />
                {errors.phone && <p className="text-[10px] text-red-600 font-medium">{errors.phone}</p>}
              </div>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">País de Procedencia *</label>
              <input
                type="text"
                name="country"
                value={formInput.country}
                onChange={handleInputChange}
                placeholder="Ej. Argentina, Chile, Brasil..."
                className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 transition-all bg-slate-50/50 ${
                  errors.country 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-slate-200 focus:border-[var(--public-primary)] focus:ring-[var(--public-primary)]'
                }`}
              />
              {errors.country && <p className="text-[10px] text-red-600 font-medium">{errors.country}</p>}
            </div>

            {/* Notes / Special Observations */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Observaciones o Pedidos Especiales (Opcional)</label>
              <textarea
                name="notes"
                rows={4}
                value={formInput.notes}
                onChange={handleInputChange}
                placeholder="Ej. Viajo con niños pequeños, preciso practicuna si tienen disponible; horario estimado de llegada..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[var(--public-primary)] focus:ring-1 focus:ring-[var(--public-primary)] transition-all bg-slate-50/50 resize-y"
              />
            </div>

            {/* Submit button is at bottom, but let's make it responsive */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--public-primary)] hover:opacity-95 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando Solicitud...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Solicitud de Reserva</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Sticky reservation summary card */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-display font-black text-lg text-slate-900 border-b border-slate-100 pb-3">
              Resumen de la Estadía
            </h3>

            {/* Accommodation header */}
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-150">
                <img 
                  src={selectedAcc.gallery?.coverImage || 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=300&q=80'} 
                  alt={selectedAcc.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--public-primary)]">Seleccionado</span>
                <h4 className="font-bold text-sm text-slate-800 leading-tight">{selectedAcc.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>San Martín de los Andes</span>
                </div>
              </div>
            </div>

            {/* Selected dates badge */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Periodo Seleccionado</span>
                  <p className="font-extrabold text-slate-800">
                    {criteria?.checkIn} al {criteria?.checkOut}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                    {nights} {nights === 1 ? 'noche' : 'noches'} de estadía
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-150/50 pt-3">
                <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Huéspedes</span>
                  <p className="font-extrabold text-slate-800">
                    {formatGuestsText(formInput.adults, formInput.children, formInput.babies, formInput.pets)}
                  </p>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Hospedaje ({nights} {nights === 1 ? 'noche' : 'noches'}):</span>
                <span className="font-bold">{formatPrice(basePrice)}</span>
              </div>
              
              {feesTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Cargos adicionales (Limpieza/Otros):</span>
                  <span className="font-bold">{formatPrice(feesTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Impuesto IVA (21% s/ base + cargos):</span>
                <span className="font-bold">{formatPrice(taxesTotal)}</span>
              </div>

              <div className="flex justify-between items-baseline text-sm text-slate-800 font-black pt-3 border-t border-dashed border-slate-200">
                <span className="uppercase tracking-wide text-xs">Importe Final Estimado:</span>
                <span className="text-lg text-[var(--public-primary)]">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Direct Booking Guarantee Badge */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="font-bold block leading-relaxed">Garantía de Tarifa Directa</strong>
                <p className="text-[10.5px] text-emerald-700/90 leading-relaxed">Reservando desde la web oficial garantizas el mejor precio sin comisiones de OTAs.</p>
              </div>
            </div>

            {/* Policy Acceptance Field */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="policyAccepted"
                  name="policyAccepted"
                  checked={formInput.policyAccepted}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--public-primary)] focus:ring-[var(--public-primary)] shrink-0 cursor-pointer"
                />
                <label htmlFor="policyAccepted" className="text-xs text-slate-500 leading-relaxed select-none cursor-pointer">
                  Acepto las <strong className="text-slate-700 font-bold">políticas de cancelación</strong> y los términos y condiciones de estadía de {settings?.businessName || 'StayFlow'}. Entiendo que esta solicitud queda sujeta a aprobación por parte de la administración.
                </label>
              </div>
              {errors.policyAccepted && (
                <p className="text-[10px] text-red-600 font-semibold">{errors.policyAccepted}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingRequestForm;
