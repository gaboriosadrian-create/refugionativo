import React from 'react';
import { X, Users, Wifi, Flame, CookingPot, Star } from 'lucide-react';
import { Cabin } from '../types';

interface CabinDetailModalProps {
  cabin: Cabin | null;
  onClose: () => void;
  onBook: (cabinId: number) => void;
}

export const CabinDetailModal: React.FC<CabinDetailModalProps> = ({ cabin, onClose, onBook }) => {
  if (!cabin) return null;

  const finalPrice = Math.round(cabin.price * (1 - (cabin.discount || 0) / 100));

  return (
    <div 
      className="fixed inset-0 z-100 flex items-end md:items-center justify-center p-4 bg-[#07140e]/58 backdrop-blur-sm transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[450px] max-h-[91dvh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-cream shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-200">
        
        <div className="relative">
          <img 
            src={cabin.image} 
            alt={cabin.name} 
            className="w-full h-[250px] object-cover rounded-t-3xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80';
            }}
          />
          <button 
            onClick={onClose}
            className="absolute top-3.5 right-3.5 grid w-10 h-10 place-content-center rounded-full bg-white/92 text-ink shadow-md hover:bg-white active:scale-90 transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="font-display font-extrabold text-2xl text-ink leading-tight">{cabin.name}</h2>
            <span className="flex items-center gap-1 text-warning font-extrabold text-sm flex-shrink-0 bg-white border border-line px-2.5 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 fill-warning" />
              {cabin.rating.toFixed(1)}
            </span>
          </div>

          <p className="text-muted text-sm leading-relaxed mb-4">{cabin.description}</p>
          
          <div className="flex flex-wrap gap-1.5 mb-5">
            <span className="flex items-center gap-1.5 bg-sage text-forest text-[11px] font-bold px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5" />
              Hasta {cabin.capacity} huéspedes
            </span>
            <span className="flex items-center gap-1.5 bg-sage text-forest text-[11px] font-bold px-3 py-1.5 rounded-full">
              <Wifi className="w-3.5 h-3.5" />
              Wi-Fi
            </span>
            <span className="flex items-center gap-1.5 bg-sage text-forest text-[11px] font-bold px-3 py-1.5 rounded-full">
              <Flame className="w-3.5 h-3.5" />
              Calefacción
            </span>
            <span className="flex items-center gap-1.5 bg-sage text-forest text-[11px] font-bold px-3 py-1.5 rounded-full">
              <CookingPot className="w-3.5 h-3.5" />
              Cocina equipada
            </span>
          </div>

          {cabin.offer && (
            <div className="bg-success/15 border border-success/20 text-success-800 text-xs px-3.5 py-2.5 rounded-xl mb-5">
              <strong>Promoción Activa:</strong> {cabin.offer} {cabin.discount > 0 && `(descuento de ${cabin.discount}% aplicado)`}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-line/60 pt-4">
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-2xl text-forest">
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(finalPrice)}
              </span>
              <span className="text-xs text-muted font-medium mt-0.5">por noche de estadía</span>
            </div>
            <button 
              onClick={() => onBook(cabin.id)}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 px-6 rounded-2xl font-bold text-white bg-forest hover:bg-forest-hover shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              Reservar ahora
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
