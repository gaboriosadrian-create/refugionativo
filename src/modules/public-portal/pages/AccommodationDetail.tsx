import React, { useState, useEffect } from 'react';
import { useWebsite } from '../contexts/WebsiteContext';
import { 
  Users, 
  MapPin, 
  ArrowLeft, 
  CheckCircle2, 
  MessageCircle, 
  Clock, 
  Sparkles, 
  Trees, 
  ShieldAlert,
  CalendarCheck
} from 'lucide-react';

export const AccommodationDetail: React.FC = () => {
  const { settings, accommodations, selectedSlug, navigateTo } = useWebsite();
  const [activeImage, setActiveImage] = useState<string>('');

  const acc = accommodations.find(a => a.slug === selectedSlug);

  useEffect(() => {
    if (acc?.gallery?.coverImage) {
      setActiveImage(acc.gallery.coverImage);
    } else if (acc?.gallery?.images?.[0]?.url) {
      setActiveImage(acc.gallery.images[0].url);
    }
  }, [acc]);

  if (!settings) return null;

  if (!acc) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-display font-black text-3xl text-slate-900 animate-pulse">Alojamiento no encontrado</h2>
        <p className="text-slate-500 text-sm">El alojamiento solicitado no existe o se encuentra inactivo.</p>
        <button 
          onClick={() => navigateTo('accommodations')}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--public-primary)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </button>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: settings.currency || 'ARS',
    maximumFractionDigits: 0
  }).format(acc.pricing?.basePrice || 0);

  const imagesList = [
    acc.gallery?.coverImage,
    ...(acc.gallery?.images?.map(img => img.url) || [])
  ].filter(Boolean);

  const maxCapacity = acc.capacity?.maxGuests || (Number(acc.capacity?.adults || 0) + Number(acc.capacity?.children || 0));

  const handleWhatsAppConsult = () => {
    const number = settings.whatsapp || "5492945550138";
    const appName = settings.businessName || "StayFlow Resort";
    const message = encodeURIComponent(`Hola ${appName}, estoy interesado en consultar la disponibilidad del alojamiento "${acc.name}" para mis próximas vacaciones.`);
    window.open(`https://wa.me/${number}?text=${message}`, "_blank", "noopener noreferrer");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-24">
      {/* Back to listings link */}
      <div>
        <button 
          onClick={() => navigateTo('accommodations')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[var(--public-primary)] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado de alojamientos</span>
        </button>
      </div>

      {/* Main Grid: Gallery & Sticky Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Title & Gallery & Features */}
        <div className="lg:col-span-8 space-y-8">
          {/* Header titles */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-[var(--public-primary)] text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> {(acc as any).category === 'couples' ? 'Parejas' : (acc as any).category === 'family' ? 'Familiar' : 'Estándar'}
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-none">
              {acc.name}
            </h1>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-sans">
              <MapPin className="w-3.5 h-3.5 text-orange" />
              <span>Valle del Bosque, Patagonia Argentina</span>
            </div>
          </div>

          {/* Large Image Box */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl aspect-[16/10] bg-slate-100 shadow-sm">
              <img 
                src={activeImage || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80'} 
                alt={acc.name} 
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>

            {/* Thumbnail selector */}
            {imagesList.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative flex-shrink-0 w-20 sm:w-24 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImage === img ? 'border-[var(--public-primary)] scale-95 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${acc.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="font-display font-black text-xl text-slate-900">Sobre este alojamiento</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {acc.description}
            </p>
          </div>

          {/* Capacity Breakdown */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="font-display font-black text-xl text-slate-900">Distribución y Capacidad</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-slate-100 bg-white text-center">
                <Users className="w-5 h-5 text-[var(--public-primary)] mx-auto mb-1.5" />
                <span className="text-[10px] text-slate-400 block font-sans">Capacidad Máxima</span>
                <span className="text-sm font-bold text-slate-800">{maxCapacity} Huéspedes</span>
              </div>
              <div className="p-4 rounded-2xl border border-slate-100 bg-white text-center">
                <Users className="w-5 h-5 text-[var(--public-primary)] mx-auto mb-1.5" />
                <span className="text-[10px] text-slate-400 block font-sans">Adultos</span>
                <span className="text-sm font-bold text-slate-800">{acc.capacity?.adults || 2} Máximo</span>
              </div>
              <div className="p-4 rounded-2xl border border-slate-100 bg-white text-center">
                <Users className="w-5 h-5 text-[var(--public-primary)] mx-auto mb-1.5" />
                <span className="text-[10px] text-slate-400 block font-sans">Niños / Bebés</span>
                <span className="text-sm font-bold text-slate-800">{(Number(acc.capacity?.children || 0) + Number(acc.capacity?.babies || 0)) || 0} Admitidos</span>
              </div>
              <div className="p-4 rounded-2xl border border-slate-100 bg-white text-center">
                <Trees className="w-5 h-5 text-[var(--public-primary)] mx-auto mb-1.5" />
                <span className="text-[10px] text-slate-400 block font-sans">Mascotas</span>
                <span className="text-sm font-bold text-slate-800">{acc.capacity?.pets ? 'Permitidas' : 'No Permitidas'}</span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {acc.amenities && acc.amenities.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h2 className="font-display font-black text-xl text-slate-900">Servicios y Amenities incluidos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {acc.amenities.map((amenityId, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium capitalize">{amenityId.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policies Section */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="font-display font-black text-xl text-slate-900">Políticas y Reglas del Alojamiento</h2>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-orange" />
                  <span>Horario Entrada: <strong className="text-slate-800 font-bold">{acc.policies?.checkIn || '14:00'} hs</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-orange" />
                  <span>Horario Salida: <strong className="text-slate-800 font-bold">{acc.policies?.checkOut || '10:00'} hs</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-orange" />
                  <span>Mascotas: <strong className="text-slate-800 font-bold">{acc.policies?.pets ? 'Admitidas' : 'No permitidas'}</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-orange" />
                  <span>Fumar en Cabaña: <strong className="text-slate-800 font-bold">{acc.policies?.smoking ? 'Permitido' : 'Prohibido'}</strong></span>
                </div>
              </div>

              {acc.policies?.cancellation && (
                <div className="pt-3 border-t border-slate-200/50 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">Políticas de Cancelación:</span>
                  <p className="text-slate-500 leading-relaxed">{acc.policies.cancellation}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Quote Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-6">
            
            <div className="pb-4 border-b border-slate-100 space-y-1">
              <span className="text-[10px] text-slate-400 block font-sans">Tarifa base garantizada</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-black text-3xl text-[var(--public-primary)]">
                  {formattedPrice}
                </span>
                <span className="text-xs font-normal text-slate-500">/ noche</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Limpieza única</span>
                <span className="font-bold">Incluida</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Impuestos de ley</span>
                <span className="font-bold">Incluidos</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Capacidad máxima</span>
                <span className="font-bold">{maxCapacity} Huéspedes</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleWhatsAppConsult}
                className="w-full inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--public-primary)] hover:opacity-95 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Consultar por WhatsApp</span>
              </button>
              
              <div className="text-center">
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  Atención de consultas 24/7
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
