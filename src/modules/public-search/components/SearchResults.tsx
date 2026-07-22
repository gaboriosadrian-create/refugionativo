import React, { useState } from 'react';
import { useSearch } from '../hooks/useSearch';
import { useWebsite } from '../../public-portal/contexts/WebsiteContext';
import { calculateNightsCount, formatGuestsText } from '../utils/searchUtils';
import { 
  Users, 
  MapPin, 
  Check, 
  ArrowRight, 
  Calendar, 
  AlertCircle, 
  MessageSquare, 
  Info, 
  X, 
  DollarSign, 
  Clock, 
  ShieldCheck,
  Star
} from 'lucide-react';

export const SearchResults: React.FC = () => {
  const { results, loading, errors, hasSearched, criteria } = useSearch();
  const { settings, navigateTo } = useWebsite();

  const [activeQuoteDetails, setActiveQuoteDetails] = useState<number | string | null>(null);

  if (!hasSearched) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-[var(--public-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium text-sm font-sans animate-pulse">
          Buscando los mejores alojamientos disponibles...
        </p>
      </div>
    );
  }

  if (errors.length > 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-red-50 border border-red-100 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h3 className="font-display font-bold text-lg text-red-950">Error en la Búsqueda</h3>
        <ul className="text-sm text-red-700 space-y-1">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-5 p-8 border border-slate-100 rounded-3xl bg-slate-50">
        <div className="p-4 bg-slate-100 rounded-full w-max mx-auto text-slate-400">
          <Calendar className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-extrabold text-xl text-slate-800">Sin Disponibilidad</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            No encontramos alojamientos disponibles que coincidan con tus fechas y huéspedes. Intenta modificar tus criterios o elegir un rango de fechas diferente.
          </p>
        </div>
      </div>
    );
  }

  const nights = calculateNightsCount(criteria.checkIn, criteria.checkOut);

  const handleWhatsAppBookingRequest = (item: typeof results[0]) => {
    if (!settings) return;
    const number = settings.whatsapp || "5492945550138";
    const appName = settings.businessName || "Refugio Nativo";

    const baseCost = item.pricingResult.basePrice;
    const cleaning = item.pricingResult.feesTotal;
    const taxes = item.pricingResult.taxesTotal;
    const total = item.pricingResult.totalPrice;

    const detailsStr = `
- *Alojamiento:* ${item.accommodation.name}
- *Entrada (Check-in):* ${criteria.checkIn}
- *Salida (Check-out):* ${criteria.checkOut}
- *Noches:* ${nights}
- *Huéspedes:* ${formatGuestsText(criteria.adults, criteria.children, criteria.babies, criteria.pets)}

*Detalle de Tarifa:*
- Hospedaje (${nights} noches): $${baseCost.toLocaleString('es-AR')}
${cleaning > 0 ? `- Cargos Adicionales (Limpieza/Otros): $${cleaning.toLocaleString('es-AR')}\n` : ''}- Impuesto IVA (21%): $${taxes.toLocaleString('es-AR')}
- *Total Estimado:* $${total.toLocaleString('es-AR')}
    `.trim();

    const message = encodeURIComponent(
      `Hola ${appName}! Quisiera solicitar una reserva con el siguiente presupuesto obtenido de la web:\n\n${detailsStr}\n\n¿Tienen disponibilidad para confirmar?`
    );

    window.open(`https://wa.me/${number}?text=${message}`, "_blank", "noopener noreferrer");
  };

  return (
    <div className="space-y-10 animate-fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900">Alojamientos Disponibles</h2>
          <p className="text-slate-500 text-xs mt-1">
            Resultados calculados en base a {nights} {nights === 1 ? 'noche' : 'noches'} de estadía para {formatGuestsText(criteria.adults, criteria.children, criteria.babies, criteria.pets)}.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Garantía de Tarifa Directa</span>
        </span>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 gap-8">
        {results.map((item) => {
          const acc = item.accommodation;
          const price = item.pricingResult;
          const isDetailOpen = activeQuoteDetails === acc.id;

          const formattedTotal = new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: settings?.currency || 'ARS',
            maximumFractionDigits: 0
          }).format(price.totalPrice);

          const formattedNightly = new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: settings?.currency || 'ARS',
            maximumFractionDigits: 0
          }).format(Math.round(price.basePrice / nights));

          return (
            <div 
              key={acc.id}
              className="bg-white border border-slate-150 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden grid grid-cols-1 lg:grid-cols-12"
            >
              {/* Cover Image */}
              <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto min-h-[220px] lg:min-h-full bg-slate-150">
                <img 
                  src={acc.gallery?.coverImage || 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=600&q=80'} 
                  alt={acc.name}
                  className="w-full h-full object-cover"
                />
                {acc.featured && (
                  <span className="absolute top-4 left-4 bg-orange text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                    Destacado
                  </span>
                )}
                {/* Minimum stay restriction badge */}
                {!item.minimumStayValid && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                    <h4 className="font-bold text-sm">Estancia Mínima Insuficiente</h4>
                    <p className="text-xs text-slate-200">
                      Este alojamiento requiere un mínimo de {item.minNightsRequired} noches en esta temporada.
                    </p>
                  </div>
                )}
              </div>

              {/* General details */}
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--public-primary)]">
                        {acc.typeId === 'cabin' ? 'Cabaña Exclusiva' : acc.typeId === 'glamping' ? 'Glamping Luxury' : 'Habitación Premium'}
                      </span>
                      <h3 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 mt-1">{acc.name}</h3>
                    </div>
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-lg text-amber-700 font-extrabold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      5.0
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                    {acc.description}
                  </p>

                  {/* Core Capacity info */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600 font-medium font-sans bg-slate-50 p-3.5 rounded-xl">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      Capacidad Máxima: {acc.capacity?.maxGuests || 2} personas
                    </span>
                    {acc.policies?.pets && (
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <Check className="w-4 h-4" />
                        Mascotas Permitidas
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      In: {acc.policies?.checkIn || '14:00'} / Out: {acc.policies?.checkOut || '10:00'}
                    </span>
                  </div>
                </div>

                {/* Rates, Quotes and Action Buttons */}
                <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Tarifa Promedio</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-black text-2xl text-[var(--public-primary)]">
                        {formattedNightly}
                      </span>
                      <span className="text-slate-500 text-xs">/ noche</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveQuoteDetails(isDetailOpen ? null : acc.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[var(--public-primary)] hover:underline mt-1 cursor-pointer"
                    >
                      <Info className="w-3 h-3" />
                      <span>{isDetailOpen ? 'Ocultar desglose detallado' : 'Ver desglose detallado e impuestos'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigateTo('accommodation-detail', acc.slug)}
                      className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 transition-all cursor-pointer"
                    >
                      Ver Ficha
                    </button>
                    {item.minimumStayValid && (
                      <button 
                        onClick={() => navigateTo('booking-request', acc.slug)}
                        className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-[var(--public-primary)] hover:opacity-95 text-white font-bold text-xs px-6 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <span>Solicitar Reserva</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Panel: Detailed Quote Breakdown */}
                {isDetailOpen && (
                  <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 font-sans animate-fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Desglose de Presupuesto</h4>
                      <button 
                        onClick={() => setActiveQuoteDetails(null)}
                        className="p-1 rounded-full text-slate-400 hover:bg-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Price breakdown nights */}
                      <div className="flex justify-between text-slate-600">
                        <span>Hospedaje ({nights} {nights === 1 ? 'noche' : 'noches'}):</span>
                        <span className="font-bold">${price.basePrice.toLocaleString('es-AR')}</span>
                      </div>
                      
                      {/* Fees */}
                      {price.feesTotal > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Cargos adicionales (Limpieza/Otros):</span>
                          <span className="font-bold">${price.feesTotal.toLocaleString('es-AR')}</span>
                        </div>
                      )}

                      {/* Taxes */}
                      <div className="flex justify-between text-slate-600">
                        <span>Impuesto IVA (21% s/ base + cargos):</span>
                        <span className="font-bold">${price.taxesTotal.toLocaleString('es-AR')}</span>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between text-sm text-slate-800 font-black pt-2 border-t border-dashed border-slate-200">
                        <span className="uppercase tracking-wide">Importe Final Estimado:</span>
                        <span className="text-[var(--public-primary)]">{formattedTotal}</span>
                      </div>
                    </div>

                    {/* Explanatory notes list */}
                    {price.explanation && price.explanation.length > 0 && (
                      <div className="pt-3 border-t border-slate-200/60 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Detalle de Reglas Aplicadas:</span>
                        <ul className="list-disc list-inside text-[10px] text-slate-500 space-y-1">
                          {price.explanation.map((exp, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {exp.replace(/\*\*/g, '')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
