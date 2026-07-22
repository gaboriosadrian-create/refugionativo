import React, { useState } from 'react';
import { OnboardingStep2Data } from '../types';
import { Phone, Mail, MapPin, Instagram, Facebook, ArrowLeft, Send } from 'lucide-react';

interface Step2Props {
  initialData?: OnboardingStep2Data;
  onSave: (data: OnboardingStep2Data) => Promise<void>;
  onBack: () => void;
}

export const Step2Contact: React.FC<Step2Props> = ({ initialData, onSave, onBack }) => {
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialData?.googleMapsUrl || '');
  const [instagram, setInstagram] = useState(initialData?.instagram || '');
  const [facebook, setFacebook] = useState(initialData?.facebook || '');
  const [loading, setLoading] = useState(false);
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErrors([]);

    const errors: string[] = [];
    if (!email.trim()) {
      errors.push('El email de contacto es obligatorio.');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('El formato del email de contacto no es válido.');
      }
    }
    if (!phone.trim()) errors.push('El teléfono de contacto es obligatorio.');
    if (!address.trim()) errors.push('La dirección física del complejo es obligatoria.');

    if (errors.length > 0) {
      setLocalErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(), // fallback to phone if blank
        address: address.trim(),
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        instagram: instagram.trim() || undefined,
        facebook: facebook.trim() || undefined
      });
    } catch (err) {
      setLocalErrors([err instanceof Error ? err.message : 'Error al guardar el Paso 2.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="step2-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#f0f9f4] border border-green-100 p-4 rounded-2xl flex gap-3">
        <Phone className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-ink">Paso 2: Información de Contacto y Ubicación</h3>
          <p className="text-xs text-muted mt-0.5">
            Establece los canales de comunicación de tu complejo con los clientes y la dirección exacta para la llegada e indicaciones GPS.
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
          <label htmlFor="contact-email" className="block text-xs font-bold text-ink flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-muted" />
            <span>Email de Contacto</span> <span className="text-danger">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ej: info@patagoniarefugio.com"
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-phone" className="block text-xs font-bold text-ink flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-muted" />
            <span>Teléfono Móvil / Fijo</span> <span className="text-danger">*</span>
          </label>
          <input
            id="contact-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="ej: +54 294 4550138"
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-whatsapp" className="block text-xs font-bold text-ink flex items-center gap-1">
            <Send className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>WhatsApp de Reservas</span> <span className="text-xs text-muted font-normal">(Opcional)</span>
          </label>
          <input
            id="contact-whatsapp"
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="ej: 5492945550138 (código de país sin el signo +)"
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-address" className="block text-xs font-bold text-ink flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-muted" />
            <span>Dirección Física del Complejo</span> <span className="text-danger">*</span>
          </label>
          <input
            id="contact-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ej: Los Maitenes 345, San Martín de los Andes, Argentina"
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <label htmlFor="contact-maps" className="block text-xs font-bold text-ink">
            Enlace de Google Maps / Coordenadas GPS
          </label>
          <input
            id="contact-maps"
            type="url"
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className="w-full min-h-[44px] rounded-xl border border-line px-3.5 text-sm bg-white focus:outline-forest"
          />
        </div>

        <div className="space-y-1.5 col-span-1 md:col-span-2 border-t border-line/50 pt-4 mt-2">
          <h4 className="text-xs font-bold text-ink mb-3">Redes Sociales (Canales Oficiales)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="social-ig" className="block text-[11px] font-bold text-ink flex items-center gap-1">
                <Instagram className="w-3.5 h-3.5 text-pink-500" />
                <span>Instagram URL</span>
              </label>
              <input
                id="social-ig"
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/nombre_complejo"
                className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white focus:outline-forest"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="social-fb" className="block text-[11px] font-bold text-ink flex items-center gap-1">
                <Facebook className="w-3.5 h-3.5 text-blue-600" />
                <span>Facebook URL</span>
              </label>
              <input
                id="social-fb"
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/nombre_complejo"
                className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs bg-white focus:outline-forest"
              />
            </div>
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
