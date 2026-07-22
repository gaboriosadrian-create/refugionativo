import React, { useState, useEffect } from 'react';
import { WebsiteSettings } from '../types';
import { WebsiteSettingsService } from '../services/WebsiteSettingsService';
import { useResort } from '../../../shared/contexts/ResortContext';
import { Save, CheckCircle2, AlertCircle, RefreshCw, Globe, Sparkles, LayoutGrid } from 'lucide-react';
import { Logger } from '../../../core/logger/Logger';

export const WebsiteSettingsEditor: React.FC = () => {
  const { resort } = useResort();
  const resortId = resort?.id || 'demo_resort';

  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f3c25');
  const [secondaryColor, setSecondaryColor] = useState('#f7f9f5');
  const [typography, setTypography] = useState<'sans' | 'serif' | 'mono' | 'space' | 'elegant'>('sans');
  const [currency, setCurrency] = useState('ARS');
  const [timezone, setTimezone] = useState('America/Argentina/Buenos_Aires');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Social links
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoMetaDescription, setSeoMetaDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const data = await WebsiteSettingsService.getSettings(resortId);
        setSettings(data);
        
        // Populate state
        setBusinessName(data.businessName || '');
        setDescription(data.description || '');
        setLogoUrl(data.logoUrl || '');
        setFaviconUrl(data.faviconUrl || '');
        setPrimaryColor(data.primaryColor || '#0f3c25');
        setSecondaryColor(data.secondaryColor || '#f7f9f5');
        setTypography(data.typography || 'sans');
        setCurrency(data.currency || 'ARS');
        setTimezone(data.timezone || 'America/Argentina/Buenos_Aires');
        setWhatsapp(data.whatsapp || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        
        setInstagram(data.socialLinks?.instagram || '');
        setFacebook(data.socialLinks?.facebook || '');
        setTwitter(data.socialLinks?.twitter || '');

        setSeoTitle(data.seo?.title || '');
        setSeoMetaDescription(data.seo?.description || '');
        setSeoKeywords(data.seo?.keywords || '');
      } catch (err: any) {
        Logger.error('Error loading public website settings in Editor:', err);
        setErrorMessage(err.message || 'Error al cargar los ajustes.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [resortId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const updated: WebsiteSettings = {
        id: 'general',
        resortId,
        businessName,
        description,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        typography,
        languages: settings?.languages || ['es'],
        currency,
        timezone,
        whatsapp,
        email,
        phone,
        address,
        socialLinks: {
          instagram,
          facebook,
          twitter
        },
        seo: {
          title: seoTitle,
          description: seoMetaDescription,
          keywords: seoKeywords
        },
        updatedAt: new Date().toISOString()
      };

      await WebsiteSettingsService.saveSettings(resortId, updated);
      setSettings(updated);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      Logger.error('Error saving public website settings:', err);
      setSaveStatus('error');
      setErrorMessage(err.message || 'Error al guardar.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="text-xs font-bold">Cargando Ajustes de Portal Público...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        
        {/* Banner header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <h2 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-700" />
              <span>Configuración del Portal Web Público</span>
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Personaliza el portal de cara al huésped. El sitio se adaptará a tus colores corporativos y tipografía elegida automáticamente.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 px-4.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveStatus === 'saving' ? 'Guardando...' : 'Guardar Portal'}</span>
          </button>
        </div>

        {/* Alert box */}
        {saveStatus === 'success' && (
          <div className="p-3.5 bg-green-50 text-green-800 rounded-xl border border-green-100 flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-green-700" />
            <span>¡Los ajustes del Portal Público se guardaron correctamente y ya están disponibles en tiempo real!</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="p-3.5 bg-red-50 text-red-800 rounded-xl border border-red-100 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-red-700" />
            <span>Error: {errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section: Identidad */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Identidad Visual
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nombre Comercial (Marca)</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-slate-50/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Descripción del Resort</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Color Principal</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Color Secundario</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipografía Principal</label>
                  <select
                    value={typography}
                    onChange={(e) => setTypography(e.target.value as any)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                  >
                    <option value="sans">SANS (Inter - Moderno)</option>
                    <option value="serif">SERIF (Playfair - Tradicional)</option>
                    <option value="mono">MONO (JetBrains - Técnico)</option>
                    <option value="space">SPACE (Espaciado)</option>
                    <option value="elegant">ELEGANT (Clásico)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Moneda Display</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                  >
                    <option value="ARS">Peso Argentino (ARS)</option>
                    <option value="USD">Dólar Estadounidense (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Contacto y Ubicación */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5 flex items-center gap-1">
              <LayoutGrid className="w-3.5 h-3.5" /> Contacto & Geolocalización
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp Directo</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="ej: 5492945550138"
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Teléfono Contacto</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ej: +54 294 455013"
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Público</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej: info@elportal.com"
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dirección Física</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ej: Camino al Lago Km 12.5, Bariloche"
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1 col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">URLs de Logo / Favicon (Opcional)</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="ej: https://ejemplo.com/logo.png"
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Section 2: Redes Sociales & SEO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
          
          {/* Social Columns */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Redes Sociales
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Instagram URL</label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/miresort"
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Facebook URL</label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/miresort"
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Twitter / X URL</label>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/miresort"
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* SEO Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Optimización SEO & Metatags
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Título de la pestaña (Title Tag)</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="ej: Cabañas de Montaña | StayFlow Resort"
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Meta-Descripción (Snippet Google)</label>
                <textarea
                  value={seoMetaDescription}
                  onChange={(e) => setSeoMetaDescription(e.target.value)}
                  rows={2}
                  placeholder="Descripción resumida para indexación en Google..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Palabras Clave (Keywords, separadas por coma)</label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="ej: cabañas, patagonia, vacaciones, descanso"
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                />
              </div>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
};
