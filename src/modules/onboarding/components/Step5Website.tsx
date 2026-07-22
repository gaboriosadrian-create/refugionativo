import React, { useState } from 'react';
import { OnboardingStep5Data } from '../types';
import { Globe, ArrowLeft, Eye } from 'lucide-react';

interface Step5Props {
  initialData?: OnboardingStep5Data;
  onSave: (data: OnboardingStep5Data) => Promise<void>;
  onBack: () => void;
}

const WEBPAGE_IMAGES = [
  { name: 'Patagonia Bosque', url: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Montañas Sol', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Lago Calmo', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80' }
];

export const Step5Website: React.FC<Step5Props> = ({ initialData, onSave, onBack }) => {
  const [title, setTitle] = useState(initialData?.title || 'Descubre el Refugio Perfecto en la Patagonia');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || 'Combinamos el confort moderno con la majestuosidad de la naturaleza para brindar una estadía memorable.');
  const [heroImage, setHeroImage] = useState(initialData?.heroImage || WEBPAGE_IMAGES[0].url);
  const [ctaText, setCtaText] = useState(initialData?.ctaText || 'Reservar Cabaña');
  const [customHeroImage, setCustomHeroImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErrors([]);

    const errors: string[] = [];
    if (!title.trim()) errors.push('El título de portada es obligatorio.');
    if (!subtitle.trim()) errors.push('El subtítulo o lema es obligatorio.');
    if (!ctaText.trim()) errors.push('El texto del botón de reserva es obligatorio.');

    const finalImage = customHeroImage.trim() || heroImage;
    if (!finalImage) errors.push('Debe elegir una imagen para el fondo de portada.');

    if (errors.length > 0) {
      setLocalErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        subtitle: subtitle.trim(),
        heroImage: finalImage,
        ctaText: ctaText.trim()
      });
    } catch (err) {
      setLocalErrors([err instanceof Error ? err.message : 'Error al guardar el Paso 5.']);
    } finally {
      setLoading(false);
    }
  };

  const activeHeroImage = customHeroImage.trim() || heroImage;

  return (
    <form id="step5-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#f0f9f4] border border-green-100 p-4 rounded-2xl flex gap-3">
        <Globe className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-ink">Paso 5: Diseño del Sitio Web Autogestionado</h3>
          <p className="text-xs text-muted mt-0.5">
            Personaliza la portada (hero banner) del sitio web público de tu complejo. Tus clientes verán este banner cuando ingresen a buscar disponibilidad.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form fields column */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="web-title" className="block text-xs font-bold text-ink">
              Título Principal de Portada <span className="text-danger">*</span>
            </label>
            <input
              id="web-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej: Encuentra tu calma en Patagonia"
              className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="web-subtitle" className="block text-xs font-bold text-ink">
              Subtítulo o Frase de Bienvenida <span className="text-danger">*</span>
            </label>
            <textarea
              id="web-subtitle"
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Escribe una frase corta pero atrapante que resuma la propuesta de valor..."
              className="w-full rounded-xl border border-line p-3.5 text-sm bg-white focus:outline-forest"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="web-cta" className="block text-xs font-bold text-ink">
              Texto del Botón de Reserva (CTA) <span className="text-danger">*</span>
            </label>
            <input
              id="web-cta"
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="ej: Reservar Cabaña, Buscar Fechas"
              className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
            />
          </div>

          <div className="space-y-2 border-t border-line/50 pt-4">
            <label className="block text-xs font-bold text-ink">Imagen de Fondo de Portada</label>
            <div className="grid grid-cols-3 gap-2">
              {WEBPAGE_IMAGES.map((img, idx) => {
                const isSelected = heroImage === img.url && !customHeroImage;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setHeroImage(img.url);
                      setCustomHeroImage('');
                    }}
                    className={`relative rounded-lg overflow-hidden border aspect-video bg-slate-50 cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-forest border-transparent' : 'border-line hover:opacity-90'
                    }`}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-forest text-white p-0.5 rounded-full">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-1.5">
              <label htmlFor="web-custom-img" className="block text-[10px] font-semibold text-slate-400 mb-1">O pegar una URL de fondo personalizada:</label>
              <input
                id="web-custom-img"
                type="url"
                value={customHeroImage}
                onChange={(e) => setCustomHeroImage(e.target.value)}
                placeholder="https://ejemplo.com/paisaje.jpg"
                className="w-full min-h-[38px] rounded-xl border border-line px-3 text-xs bg-white focus:outline-forest"
              />
            </div>
          </div>
        </div>

        {/* Live Mockup Preview Column */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-line flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted font-bold uppercase mb-4 tracking-wider">
            <Eye className="w-4 h-4 text-forest" />
            <span>Vista Previa del Sitio Web</span>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-line aspect-video w-full bg-slate-900 flex flex-col justify-between p-6 text-white text-center">
            {/* Background image overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-300"
              style={{ 
                backgroundImage: `url(${activeHeroImage})`,
              }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 z-0" />

            {/* Logo/Header bar preview */}
            <div className="relative z-10 flex justify-between items-center text-[10px] font-bold border-b border-white/20 pb-2">
              <span className="tracking-wide">🏔️ COMPLEJO TURÍSTICO</span>
              <div className="flex gap-3 text-white/80">
                <span>Alojamientos</span>
                <span>Contacto</span>
              </div>
            </div>

            {/* Main callout text */}
            <div className="relative z-10 my-auto space-y-2 max-w-sm mx-auto">
              <h2 className="font-display font-extrabold text-sm sm:text-base tracking-tight leading-tight line-clamp-2">
                {title || 'Título de Portada'}
              </h2>
              <p className="text-[9px] sm:text-[10px] text-white/90 font-medium line-clamp-3">
                {subtitle || 'Subtítulo o lema del complejo.'}
              </p>
            </div>

            {/* CTA button preview */}
            <div className="relative z-10 flex justify-center mt-2">
              <span className="bg-forest hover:bg-forest-hover text-white font-bold text-[9px] px-4 py-1.5 rounded-full shadow-sm transition-all">
                {ctaText || 'Buscar Disponibilidad'}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-muted text-center mt-4">
            Este boceto simula el banner superior de tu portal de reservas. El color primario se adaptará al estilo de StayFlow.
          </p>
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
