import React, { useState } from 'react';
import { OnboardingStep3Data } from '../types';
import { Bed, Sparkles, ArrowLeft, Check, HelpCircle } from 'lucide-react';

interface Step3Props {
  initialData?: OnboardingStep3Data;
  onSave: (data: OnboardingStep3Data) => Promise<void>;
  onBack: () => void;
}

const AVAILABLE_AMENITIES = [
  { id: 'wifi', name: 'WiFi Satelital', icon: '📶' },
  { id: 'calefaccion', name: 'Calefacción Central', icon: '🔥' },
  { id: 'parrilla', name: 'Parrilla Privada', icon: '🍖' },
  { id: 'estacionamiento', name: 'Estacionamiento Techado', icon: '🚗' },
  { id: 'cocina', name: 'Cocina Completa', icon: '🍳' },
  { id: 'jacuzzi', name: 'Jacuzzi Hidromasaje', icon: '🛁' },
  { id: 'tv', name: 'Smart TV', icon: '📺' },
  { id: 'vistas', name: 'Vistas al Bosque/Cerro', icon: '🏔️' },
  { id: 'blanco', name: 'Ropa de Cama & Toallas', icon: '🛏️' },
  { id: 'pet', name: 'Pet Friendly', icon: '🐾' }
];

const PRESET_IMAGES = [
  { name: 'Cabaña Bosque', url: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Suite Premium', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80' },
  { name: 'Glamping Domo', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80' },
  { name: 'Cabaña Alpina', url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80' }
];

export const Step3Accommodation: React.FC<Step3Props> = ({ initialData, onSave, onBack }) => {
  const [name, setName] = useState(initialData?.name || 'Cabaña Premium del Bosque');
  const [type, setType] = useState(initialData?.type || 'cabin');
  const [capacity, setCapacity] = useState(initialData?.capacity || 4);
  const [price, setPrice] = useState(initialData?.price || 15000);
  const [description, setDescription] = useState(initialData?.description || 'Exclusivo alojamiento totalmente equipado, rodeado de vegetación autóctona y diseñado para brindar el máximo confort y descanso.');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities || ['wifi', 'calefaccion', 'estacionamiento']);
  const [image, setImage] = useState(initialData?.image || PRESET_IMAGES[0].url);
  const [customImage, setCustomImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErrors([]);

    const errors: string[] = [];
    if (!name.trim()) errors.push('El nombre del alojamiento es obligatorio.');
    if (!type.trim()) errors.push('El tipo de alojamiento es obligatorio.');
    if (capacity <= 0) errors.push('La capacidad debe ser mayor a 0.');
    if (price <= 0) errors.push('El precio base debe ser mayor a 0.');
    if (!description.trim()) errors.push('La descripción es obligatoria.');

    const finalImage = customImage.trim() || image;
    if (!finalImage) errors.push('Debe seleccionar o ingresar una imagen de portada.');

    if (errors.length > 0) {
      setLocalErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        capacity,
        price,
        description: description.trim(),
        amenities: selectedAmenities,
        image: finalImage
      });
    } catch (err) {
      setLocalErrors([err instanceof Error ? err.message : 'Error al guardar el Paso 3.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="step3-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#f0f9f4] border border-green-100 p-4 rounded-2xl flex gap-3">
        <Bed className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-ink">Paso 3: Creación de tu Primer Alojamiento</h3>
          <p className="text-xs text-muted mt-0.5">
            Crea el primer formato de habitación o cabaña disponible para alquiler en tu complejo turístico. Podrás añadir más unidades más adelante.
          </p>
        </div>
      </div>

      {localErrors.length > 0 && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs space-y-1">
          {localErrors.map((err, idx) => (
            <p key={idx}>• {err}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="accom-name" className="block text-xs font-bold text-ink">
            Nombre del Alojamiento <span className="text-danger">*</span>
          </label>
          <input
            id="accom-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej: Cabaña Vista Hermosa, Suite Deluxe"
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="accom-type" className="block text-xs font-bold text-ink">
            Tipo de Alojamiento <span className="text-danger">*</span>
          </label>
          <select
            id="accom-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-line px-3 text-sm bg-white focus:outline-forest"
          >
            <option value="cabin">Cabaña de Troncos / Bungalow</option>
            <option value="hotel">Habitación de Hotel</option>
            <option value="glamping">Glamping Domo</option>
            <option value="camping">Parcela de Camping</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="accom-capacity" className="block text-xs font-bold text-ink">
            Capacidad Máxima de Huéspedes <span className="text-danger">*</span>
          </label>
          <input
            id="accom-capacity"
            type="number"
            min={1}
            max={20}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="accom-price" className="block text-xs font-bold text-ink">
            Precio por Noche <span className="text-danger">*</span>
          </label>
          <input
            id="accom-price"
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <label htmlFor="accom-desc" className="block text-xs font-bold text-ink">
            Descripción Detallada <span className="text-danger">*</span>
          </label>
          <textarea
            id="accom-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe las virtudes particulares de esta unidad, amenities diferenciales, vistas o comodidades..."
            className="w-full rounded-xl border border-line p-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        {/* Services & Amenities */}
        <div className="space-y-2 col-span-1 md:col-span-2">
          <label className="block text-xs font-bold text-ink flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-forest" />
            <span>Servicios & Amenidades Incluidas</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {AVAILABLE_AMENITIES.map((amenity) => {
              const selected = selectedAmenities.includes(amenity.id);
              return (
                <button
                  type="button"
                  key={amenity.id}
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`p-2 border rounded-xl flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all ${
                    selected 
                      ? 'border-forest bg-forest/5 text-forest font-bold shadow-xs' 
                      : 'border-line bg-white text-muted hover:text-ink'
                  }`}
                >
                  <span className="text-base">{amenity.icon}</span>
                  <span className="truncate">{amenity.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery / Cover Image Select */}
        <div className="space-y-2 col-span-1 md:col-span-2 border-t border-line/50 pt-4 mt-2">
          <label className="block text-xs font-bold text-ink">Imagen de Portada del Alojamiento</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESET_IMAGES.map((img, idx) => {
              const isSelected = image === img.url && !customImage;
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setImage(img.url);
                    setCustomImage('');
                  }}
                  className={`relative rounded-xl overflow-hidden border aspect-video bg-slate-50 cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-forest border-transparent' : 'border-line hover:opacity-90'
                  }`}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 px-1.5 text-[10px] text-white font-semibold truncate">
                    {img.name}
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-forest text-white p-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <label htmlFor="accom-custom-img" className="block text-[11px] font-bold text-ink mb-1">O pegar una URL de imagen personalizada:</label>
            <input
              id="accom-custom-img"
              type="url"
              value={customImage}
              onChange={(e) => setCustomImage(e.target.value)}
              placeholder="https://ejemplo.com/mi-cabana.jpg"
              className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white focus:outline-forest"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-line/60">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-5 rounded-xl border border-line text-ink font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>
        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] px-6 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Siguiente Paso'}
        </button>
      </div>
    </form>
  );
};
