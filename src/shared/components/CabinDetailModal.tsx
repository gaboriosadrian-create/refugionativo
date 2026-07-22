import React from 'react';
import { 
  X, 
  Users, 
  Star, 
  Bed, 
  Bath, 
  Home, 
  Maximize, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  HelpCircle,
  Trees,
  Tent,
  Mountain,
  Sparkles,
  Heart
} from 'lucide-react';
import { Cabin } from '../../types';
import { useAmenities } from '../hooks/useAmenities';
import { useAccommodationTypes } from '../hooks/useAccommodationTypes';

interface CabinDetailModalProps {
  cabin: Cabin | null;
  onClose: () => void;
  onBook: (cabinId: number) => void;
}

// Helper to render dynamic icon
const DynamicTypeIcon: React.FC<{ iconName?: string; className?: string }> = ({ iconName, className = "w-4 h-4 text-forest" }) => {
  switch (iconName) {
    case 'trees':
      return <Trees className={className} />;
    case 'tent':
      return <Tent className={className} />;
    case 'mountain':
      return <Mountain className={className} />;
    case 'bed':
      return <Bed className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    default:
      return <Home className={className} />;
  }
};

export const CabinDetailModal: React.FC<CabinDetailModalProps> = ({ cabin, onClose, onBook }) => {
  const { amenities: resortAmenities } = useAmenities();
  const { types: accommodationTypes } = useAccommodationTypes();

  if (!cabin) return null;

  const finalPrice = Math.round(cabin.price * (1 - (cabin.discount || 0) / 100));

  // Find selected accommodation type metadata
  const selectedTypeObj = accommodationTypes.find(t => t.id === cabin.type);

  // Filter amenities belonging to this cabin
  const activeAmenities = resortAmenities.filter(a => (cabin.amenities || []).includes(a.id));

  return (
    <div 
      className="fixed inset-0 z-100 flex items-end md:items-center justify-center p-4 bg-[#07140e]/58 backdrop-blur-sm transition-all animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-cream shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-200 scrollbar-thin">
        
        <div className="relative">
          <img 
            src={cabin.image} 
            alt={cabin.name} 
            className="w-full h-[280px] object-cover rounded-t-3xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80';
            }}
          />
          <button 
            onClick={onClose}
            className="absolute top-3.5 right-3.5 grid w-10 h-10 place-content-center rounded-full bg-white/92 text-ink shadow-md hover:bg-white active:scale-90 transition-all cursor-pointer z-10"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Type Badge */}
          {selectedTypeObj && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-forest flex items-center gap-1.5 shadow-sm">
              <DynamicTypeIcon iconName={selectedTypeObj.icon} className="w-3.5 h-3.5" />
              <span>{selectedTypeObj.displayName}</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Header section */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="font-display font-extrabold text-2xl text-ink leading-tight">{cabin.name}</h2>
              <span className="flex items-center gap-1 text-warning font-extrabold text-sm flex-shrink-0 bg-white border border-line px-2.5 py-1 rounded-full shadow-xs">
                <Star className="w-3.5 h-3.5 fill-warning" />
                {cabin.rating ? cabin.rating.toFixed(1) : "5.0"}
              </span>
            </div>
            
            {cabin.location && (
              <div className="flex items-center gap-1 text-muted text-xs font-medium">
                <MapPin className="w-3.5 h-3.5 text-forest" />
                <span>{cabin.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-muted text-sm leading-relaxed">{cabin.description}</p>
          
          {/* Grid de capacidades básicas */}
          <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-line/60">
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <Users className="w-4 h-4 text-forest mb-1" />
              <span className="text-[10px] text-muted font-bold block">Huéspedes</span>
              <span className="text-xs font-extrabold text-ink">{cabin.capacity}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 text-center border-l border-line/40">
              <Bed className="w-4 h-4 text-forest mb-1" />
              <span className="text-[10px] text-muted font-bold block">Camas</span>
              <span className="text-xs font-extrabold text-ink">{cabin.beds || 1}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 text-center border-l border-line/40">
              <Bath className="w-4 h-4 text-forest mb-1" />
              <span className="text-[10px] text-muted font-bold block">Baños</span>
              <span className="text-xs font-extrabold text-ink">{cabin.bathrooms || 1}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 text-center border-l border-line/40">
              <Maximize className="w-4 h-4 text-forest mb-1" />
              <span className="text-[10px] text-muted font-bold block">Superficie</span>
              <span className="text-xs font-extrabold text-ink">{cabin.squareMeters || 35} m²</span>
            </div>
          </div>

          {/* Custom Metadata Specific to type */}
          {cabin.customFields && Object.keys(cabin.customFields).length > 0 && selectedTypeObj?.customFields && (
            <div className="space-y-2">
              <h3 className="font-display font-bold text-sm text-ink flex items-center gap-1.5 border-b border-line/40 pb-1.5">
                <Sparkles className="w-4 h-4 text-forest" /> Características Especiales
              </h3>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-line/40">
                {selectedTypeObj.customFields.map((cf) => {
                  const val = cabin.customFields?.[cf.key];
                  if (val === undefined || val === null) return null;
                  return (
                    <div key={cf.key} className="flex flex-col">
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{cf.label}</span>
                      <span className="text-xs font-semibold text-ink">
                        {cf.type === 'boolean' ? (val ? 'Sí ✓' : 'No ✗') : String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amenities checklist */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm text-ink border-b border-line/40 pb-1.5">
              Servicios & Comodidades Incluidas
            </h3>
            {activeAmenities.length === 0 ? (
              <p className="text-xs text-muted italic">Servicios estándar incluidos en la estadía.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {activeAmenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-xl border border-line/50 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest flex-shrink-0" />
                    <span className="font-medium text-ink truncate">{amenity.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Policies & Times */}
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-line/50">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#3d4842] flex items-center gap-1.5 mb-1">
              📌 Normas del Alojamiento
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs mb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-muted font-bold block">Check-In</span>
                  <span className="font-semibold text-ink">{cabin.policies?.checkInTime || '14:00'} hs</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-muted font-bold block">Check-Out</span>
                  <span className="font-semibold text-ink">{cabin.policies?.checkOutTime || '10:00'} hs</span>
                </div>
              </div>
            </div>

            {cabin.policies?.cancellationPolicy && (
              <div className="text-xs border-t border-line/40 pt-2">
                <span className="font-bold block text-ink">Política de Cancelación:</span>
                <p className="text-muted mt-0.5">{cabin.policies.cancellationPolicy}</p>
              </div>
            )}

            {cabin.policies?.rules && cabin.policies.rules.length > 0 && (
              <div className="text-xs border-t border-line/40 pt-2 space-y-1">
                <span className="font-bold block text-ink">Normas y Reglas:</span>
                {cabin.policies.rules.map((rule, i) => (
                  <div key={i} className="text-muted flex items-start gap-1">
                    <span>•</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Promotional Offers */}
          {cabin.offer && (
            <div className="bg-success/10 border border-success/20 text-success-800 text-xs px-3.5 py-3 rounded-xl">
              <strong className="font-bold text-success-900 block mb-0.5">🔥 Oferta Especial Activa:</strong> 
              {cabin.offer} {cabin.discount > 0 && `(descuento de ${cabin.discount}% aplicado automáticamente)`}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between border-t border-line/60 pt-4 mt-2">
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
