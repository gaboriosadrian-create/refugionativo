import React, { useState } from 'react';
import { OnboardingStep1Data } from '../types';
import { Building, Globe, DollarSign, Clock, HelpCircle } from 'lucide-react';

interface Step1Props {
  initialData?: OnboardingStep1Data;
  onSave: (data: OnboardingStep1Data) => Promise<void>;
  onBack?: () => void;
}

export const Step1ResortData: React.FC<Step1Props> = ({ initialData, onSave, onBack }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [businessName, setBusinessName] = useState(initialData?.businessName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [logo, setLogo] = useState(initialData?.logo || '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [timezone, setTimezone] = useState(initialData?.timezone || 'America/Argentina/Buenos_Aires');
  const [language, setLanguage] = useState(initialData?.language || 'es');
  const [loading, setLoading] = useState(false);
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErrors([]);

    const errors: string[] = [];
    if (!name.trim()) errors.push('El nombre del complejo es obligatorio.');
    if (!description.trim()) errors.push('La descripción del complejo es obligatoria.');

    if (errors.length > 0) {
      setLocalErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        businessName: businessName.trim() || undefined,
        description: description.trim(),
        logo: logo.trim() || 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=120&q=80',
        coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1600&q=80',
        currency,
        timezone,
        language
      });
    } catch (err) {
      setLocalErrors([err instanceof Error ? err.message : 'Error al guardar el Paso 1.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="step1-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#f0f9f4] border border-green-100 p-4 rounded-2xl flex gap-3">
        <Building className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-ink">Paso 1: Datos Básicos e Identidad</h3>
          <p className="text-xs text-muted mt-0.5">
            Configura el nombre comercial de tu complejo turístico, define la descripción física que se mostrará a los visitantes y establece las preferencias de moneda e idioma del sistema.
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
        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <label htmlFor="resort-name" className="block text-xs font-bold text-ink flex items-center gap-1">
            Nombre Comercial <span className="text-danger">*</span>
          </label>
          <input
            id="resort-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej: Patagonia Refugio de Montaña"
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="business-name" className="block text-xs font-bold text-ink">
            Razón Social o Nombre Legal <span className="text-xs text-muted font-normal">(Opcional)</span>
          </label>
          <input
            id="business-name"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="ej: Patagonia Resorts S.A."
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="resort-lang" className="block text-xs font-bold text-ink">
            Idioma Principal del Sistema <span className="text-danger">*</span>
          </label>
          <select
            id="resort-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-line px-3 text-sm bg-white focus:outline-forest"
          >
            <option value="es">Español (Castellano)</option>
            <option value="en">English (Inglés)</option>
            <option value="pt">Português (Portugués)</option>
          </select>
        </div>

        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <label htmlFor="resort-desc" className="block text-xs font-bold text-ink">
            Descripción del Complejo <span className="text-danger">*</span>
          </label>
          <textarea
            id="resort-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe las características generales del complejo, entorno natural y atractivos principales para tus clientes..."
            className="w-full rounded-xl border border-line p-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="resort-currency" className="block text-xs font-bold text-ink flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-muted" />
            <span>Moneda de Cobro</span> <span className="text-danger">*</span>
          </label>
          <select
            id="resort-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-line px-3 text-sm bg-white focus:outline-forest"
          >
            <option value="USD">USD - Dólar Estadounidense</option>
            <option value="ARS">ARS - Peso Argentino</option>
            <option value="CLP">CLP - Peso Chileno</option>
            <option value="EUR">EUR - Euro</option>
            <option value="BRL">BRL - Real Brasileño</option>
            <option value="MXN">MXN - Peso Mexicano</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="resort-timezone" className="block text-xs font-bold text-ink flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted" />
            <span>Zona Horaria</span> <span className="text-danger">*</span>
          </label>
          <select
            id="resort-timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-line px-3 text-sm bg-white focus:outline-forest"
          >
            <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</option>
            <option value="America/Santiago">America/Santiago</option>
            <option value="America/Sao_Paulo">America/Sao_Paulo</option>
            <option value="America/Mexico_City">America/Mexico_City</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/Madrid">Europe/Madrid</option>
          </select>
        </div>

        <div className="space-y-1.5 col-span-1 md:col-span-2 border-t border-line/50 pt-4 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-forest" />
            <h4 className="text-xs font-bold text-ink">Personalización Visual del Complejo</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="resort-logo-url" className="block text-[11px] font-bold text-ink">Logo URL (cuadrado)</label>
              <input
                id="resort-logo-url"
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
                className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="resort-cover-url" className="block text-[11px] font-bold text-ink">Imagen de Portada URL</label>
              <input
                id="resort-cover-url"
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://ejemplo.com/portada.jpg"
                className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-line/60">
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
