import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Sliders, 
  Save, 
  Database, 
  History, 
  RefreshCw, 
  Layers, 
  CreditCard, 
  Mail, 
  Globe, 
  Palette,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useTenant } from '../TenantContext';
import { TenantConfig, SaaSPlan, FeatureFlag, TenantStatus } from '../TenantTypes';
import { AuditService, AuditLog } from '../../audit/AuditService';

export const SaaSConfigEditor: React.FC = () => {
  const { 
    tenantId, 
    tenantName, 
    plan, 
    estado, 
    configuracion, 
    isFeatureEnabled, 
    changeTenant, 
    updateConfiguracion 
  } = useTenant();

  const [activeTab, setActiveTab] = useState<'profile' | 'plans' | 'features' | 'audit'>('profile');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Form Fields State
  const [commercialName, setCommercialName] = useState(configuracion.commercialName);
  const [logo, setLogo] = useState(configuracion.logo || '');
  const [domain, setDomain] = useState(configuracion.domain || '');
  const [language, setLanguage] = useState(configuracion.language);
  const [currency, setCurrency] = useState(configuracion.currency);
  const [timezone, setTimezone] = useState(configuracion.timezone);
  const [status, setStatus] = useState<TenantStatus>(configuracion.status);

  // Branding fields
  const [primaryColor, setPrimaryColor] = useState(configuracion.branding.primaryColor || '#0f172a');
  const [secondaryColor, setSecondaryColor] = useState(configuracion.branding.secondaryColor || '#0284c7');
  const [fontFamily, setFontFamily] = useState(configuracion.branding.fontFamily || 'Inter');

  // Emails fields
  const [supportEmail, setSupportEmail] = useState(configuracion.emails.supportEmail);
  const [notificationsEmail, setNotificationsEmail] = useState(configuracion.emails.bookingNotificationsEmail);

  // Regional fields
  const [country, setCountry] = useState(configuracion.regionalSettings.country);

  // Sync form state when config changes
  useEffect(() => {
    if (configuracion) {
      setCommercialName(configuracion.commercialName);
      setLogo(configuracion.logo || '');
      setDomain(configuracion.domain || '');
      setLanguage(configuracion.language);
      setCurrency(configuracion.currency);
      setTimezone(configuracion.timezone);
      setStatus(configuracion.status);
      setPrimaryColor(configuracion.branding.primaryColor || '#0f172a');
      setSecondaryColor(configuracion.branding.secondaryColor || '#0284c7');
      setFontFamily(configuracion.branding.fontFamily || 'Inter');
      setSupportEmail(configuracion.emails.supportEmail);
      setNotificationsEmail(configuracion.emails.bookingNotificationsEmail);
      setCountry(configuracion.regionalSettings.country);
    }
  }, [configuracion, tenantId]);

  // Load audit logs
  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const fetchedLogs = await AuditService.getLogs(tenantId);
      // Sort logs by timestamp descending
      const sorted = [...fetchedLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(sorted);
    } catch (err) {
      console.error('[SAAS_EDITOR] Error loading audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadLogs();
    }
  }, [activeTab, tenantId]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await updateConfiguracion({
        commercialName,
        logo,
        domain,
        language,
        currency,
        timezone,
        status,
        branding: {
          primaryColor,
          secondaryColor,
          fontFamily,
        },
        emails: {
          supportEmail,
          bookingNotificationsEmail: notificationsEmail,
          senderName: commercialName,
        },
        regionalSettings: {
          country,
          dateFormat: configuracion.regionalSettings.dateFormat,
          numberFormat: configuracion.regionalSettings.numberFormat,
        }
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('[SAAS_EDITOR] Error updating config:', err);
      setSaveStatus('error');
    }
  };

  const handlePlanChange = async (targetPlan: SaaSPlan) => {
    try {
      setSaveStatus('saving');
      await updateConfiguracion({
        contractedPlan: targetPlan,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('[SAAS_EDITOR] Error changing plan:', err);
      setSaveStatus('error');
    }
  };

  const handleStatusChange = async (targetStatus: TenantStatus) => {
    try {
      setStatus(targetStatus);
      await updateConfiguracion({
        status: targetStatus,
      });
    } catch (err) {
      console.error('[SAAS_EDITOR] Error changing status:', err);
    }
  };

  // Plan tiers configuration
  const planTiers: {
    id: SaaSPlan;
    name: string;
    price: string;
    desc: string;
    accommodations: string;
    features: string[];
    accentColor: string;
  }[] = [
    {
      id: 'Starter',
      name: 'Plan Starter',
      price: '$49 / mes',
      desc: 'Para complejos boutique pequeños que se inician en la gestión digital.',
      accommodations: 'Hasta 10 unidades',
      features: ['bookingEngine'],
      accentColor: 'border-emerald-500 bg-emerald-50/10 text-emerald-700',
    },
    {
      id: 'Professional',
      name: 'Plan Professional',
      price: '$99 / mes',
      desc: 'El plan idóneo para optimizar reservas y recibir pagos automáticos.',
      accommodations: 'Hasta 20 unidades',
      features: ['bookingEngine', 'payments', 'checkinDigital'],
      accentColor: 'border-blue-500 bg-blue-50/10 text-blue-700',
    },
    {
      id: 'Business',
      name: 'Plan Business',
      price: '$199 / mes',
      desc: 'Impulsa tu negocio turístico con marketing y analíticas avanzadas.',
      accommodations: 'Hasta 50 unidades',
      features: ['bookingEngine', 'payments', 'checkinDigital', 'analytics', 'marketing'],
      accentColor: 'border-amber-500 bg-amber-50/10 text-amber-700',
    },
    {
      id: 'Enterprise',
      name: 'Plan Enterprise',
      price: '$399 / mes',
      desc: 'Completa automatización omnicanal, multi-complejo e integraciones.',
      accommodations: 'Unidades ilimitadas',
      features: ['bookingEngine', 'payments', 'checkinDigital', 'analytics', 'marketing', 'channelManager', 'multiProperty'],
      accentColor: 'border-violet-500 bg-violet-50/10 text-violet-700',
    },
  ];

  // List of all functional features to showcase in feature flags tab
  const featureList: {
    id: FeatureFlag;
    name: string;
    desc: string;
    requiredPlan: SaaSPlan;
  }[] = [
    {
      id: 'bookingEngine',
      name: 'Booking Engine (Motor de Reservas)',
      desc: 'Permite a huéspedes reservar directamente desde el portal web en tiempo real.',
      requiredPlan: 'Starter',
    },
    {
      id: 'payments',
      name: 'Payment Engine (Motor de Pagos)',
      desc: 'Pasarela integrada con Mercado Pago para reservas garantizadas con tarjeta.',
      requiredPlan: 'Professional',
    },
    {
      id: 'checkinDigital',
      name: 'Check-in Digital Express',
      desc: 'Huéspedes pueden enviar sus datos de viaje antes de su llegada de forma digital.',
      requiredPlan: 'Professional',
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      desc: 'Gráficos avanzados, reportes de ocupación y previsión de ingresos por temporada.',
      requiredPlan: 'Business',
    },
    {
      id: 'marketing',
      name: 'Marketing & Promociones',
      desc: 'Creación de cupones de descuento personalizados e integraciones con boletines.',
      requiredPlan: 'Business',
    },
    {
      id: 'channelManager',
      name: 'Channel Manager (OTA Sync)',
      desc: 'Sincronización automática de inventario y tarifas con Airbnb y Booking.com.',
      requiredPlan: 'Enterprise',
    },
    {
      id: 'multiProperty',
      name: 'Multi-Propiedad Avanzado',
      desc: 'Administra múltiples resorts o complejos turísticos desde el mismo backoffice.',
      requiredPlan: 'Enterprise',
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl border border-slate-700/50 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold tracking-wider uppercase font-mono px-2 py-0.5 rounded border border-sky-500/30">
                SaaS Core Platform Active
              </span>
              <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                estado === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                Estado: {estado === 'active' ? 'Activo' : estado === 'suspended' ? 'Suspendido' : 'Pendiente'}
              </span>
            </div>
            <h2 className="font-display font-black text-2xl text-white mt-1.5 flex items-center gap-2">
              <Layers className="w-6 h-6 text-sky-400" />
              <span>SaaS Settings: {tenantName}</span>
            </h2>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed">
              ID de Tenant: <code className="font-mono bg-slate-950/40 text-sky-300 px-1.5 py-0.5 rounded">{tenantId}</code> &bull; Plan Contratado: <span className="font-bold text-sky-400">{plan}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-300">Resort Tenant:</label>
            <select
              value={tenantId}
              onChange={(e) => changeTenant(e.target.value)}
              className="min-h-[40px] rounded-xl border border-slate-700 bg-slate-900 text-white px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-sky-500"
            >
              <option value="patagonia-refugio">Refugio Nativo (Mendoza)</option>
              <option value="andes-glamping">Andes Glamping Domes (Andes)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editor Sub-Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 max-w-2xl overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'profile' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Perfil de Empresa
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'plans' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Cambiar Plan SaaS
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'features' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Feature Flags ({plan})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Bitácora de Auditoría
        </button>
      </div>

      {/* Tab Contents: PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-6">
          <div className="border-b border-line pb-3">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Globe className="w-4 h-4 text-forest" />
              <span>Configuración Global del Tenant</span>
            </h3>
            <p className="text-muted text-[11px] mt-0.5">Define los aspectos regionales, de identidad y técnicos de tu propiedad turística.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Nombre Comercial</label>
              <input
                type="text"
                value={commercialName}
                onChange={(e) => setCommercialName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Dominio Personalizado (Domain)</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                placeholder="ej: refugio.midominio.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-line/40 pt-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Idioma de Operación</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest cursor-pointer"
              >
                <option value="es">Español (es)</option>
                <option value="en">Inglés (en)</option>
                <option value="pt">Portugués (pt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Moneda del Sistema</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest cursor-pointer"
              >
                <option value="ARS">Pesos Argentinos (ARS)</option>
                <option value="USD">Dólares Estadounidenses (USD)</option>
                <option value="EUR">Euros (EUR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Zona Horaria</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest cursor-pointer"
              >
                <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</option>
                <option value="America/Argentina/Mendoza">America/Argentina/Mendoza</option>
                <option value="America/Santiago">America/Santiago</option>
                <option value="America/Sao_Paulo">America/Sao_Paulo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-line/40 pt-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Correo de Soporte Técnico</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Correo de Notificaciones de Reserva</label>
              <input
                type="email"
                value={notificationsEmail}
                onChange={(e) => setNotificationsEmail(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>
          </div>

          {/* Branding Section */}
          <div className="border-t border-line/40 pt-4 space-y-4">
            <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-forest" />
              <span>Personalización y Branding Visual</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Color Primario</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-line cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Color Secundario</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-line cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Fuente Tipográfica (Font)</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-line px-3 text-xs font-bold cursor-pointer bg-white"
                >
                  <option value="Inter">Inter (Sans-Serif)</option>
                  <option value="Space Grotesk">Space Grotesk</option>
                  <option value="Playfair Display">Playfair Display (Serif)</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Tenant Status */}
          <div className="border-t border-line/40 pt-4">
            <label className="block text-xs font-bold text-ink mb-1.5">Estado del Tenant (Administrativo)</label>
            <div className="flex gap-3">
              {[
                { id: 'active', label: 'Activo / Operacional', desc: 'Acceso total y procesamiento de reservas.', color: 'border-emerald-500 hover:bg-emerald-50/20' },
                { id: 'suspended', label: 'Suspendido (Prueba)', desc: 'Bloquea operaciones de escritura e inicios de sesión.', color: 'border-rose-500 hover:bg-rose-50/20' },
                { id: 'pending', label: 'Pendiente de Configuración', desc: 'Modo limitado para Setup Wizard.', color: 'border-amber-500 hover:bg-amber-50/20' },
              ].map((opt) => {
                const isSel = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleStatusChange(opt.id as TenantStatus)}
                    className={`flex-1 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSel 
                        ? `${opt.color} bg-slate-50 border-2 font-bold shadow-sm` 
                        : 'border-line bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="text-xs text-ink flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        opt.id === 'active' ? 'bg-emerald-500' : opt.id === 'suspended' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      <span>{opt.label}</span>
                    </div>
                    <p className="text-[10px] text-muted font-normal mt-1 leading-tight">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {saveStatus === 'saving' && (
                <span className="text-xs text-forest animate-pulse font-medium">Guardando configuración global...</span>
              )}
              {saveStatus === 'success' && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> ¡Configuración guardada correctamente!
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-xs text-rose-600 font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Error al guardar la configuración.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="min-h-[44px] px-6 rounded-xl bg-forest hover:bg-forest-hover text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Save className="w-4.5 h-4.5" />
              <span>Guardar Ajustes Tenant</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab Contents: PLANS SWITCHER */}
      {activeTab === 'plans' && (
        <div className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-6">
          <div className="border-b border-line pb-3">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-forest" />
              <span>Planes de Suscripción StayFlow SaaS</span>
            </h3>
            <p className="text-muted text-[11px] mt-0.5">
              Escala de forma instantánea el plan contratado para este tenant. La asignación de Feature Flags y límites del sistema se sincronizará automáticamente.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {planTiers.map((t) => {
              const isCurrent = plan === t.id;
              return (
                <div 
                  key={t.id} 
                  className={`flex flex-col justify-between p-4 rounded-xl border relative transition-all ${
                    isCurrent 
                      ? `${t.accentColor} border-2 ring-2 ring-forest/10 shadow-sm` 
                      : 'border-line bg-white hover:border-slate-300'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded bg-forest text-white text-[9px] font-black tracking-wide uppercase shadow-xs">
                      Plan Actual
                    </span>
                  )}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-display font-black text-xs text-slate-900">{t.name}</h4>
                      <div className="text-lg font-black text-slate-950 mt-1">{t.price}</div>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed min-h-[50px]">{t.desc}</p>
                    <div className="bg-slate-50 p-2 rounded text-[10px] text-ink font-bold flex items-center gap-1.5 border border-line/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Capacidad: {t.accommodations}</span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-line/50">
                      <div className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Features Incluidas:</div>
                      {featureList.map((f) => {
                        const hasFeature = t.features.includes(f.id);
                        return (
                          <div key={f.id} className="flex items-center gap-1.5 text-[10px] text-slate-700">
                            {hasFeature ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Lock className="w-3 h-3 text-slate-300 shrink-0" />
                            )}
                            <span className={hasFeature ? 'font-medium' : 'text-slate-400 line-through'}>{f.name.split(' (')[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent || saveStatus === 'saving'}
                    onClick={() => handlePlanChange(t.id)}
                    className={`mt-5 w-full min-h-[38px] py-2 rounded-lg text-xs font-black tracking-wide transition-all shadow-xs cursor-pointer ${
                      isCurrent 
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                        : 'bg-forest hover:bg-forest-hover text-white active:scale-95'
                    }`}
                  >
                    {isCurrent ? 'Suscrito' : `Cambiar a ${t.id}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Contents: FEATURE FLAGS */}
      {activeTab === 'features' && (
        <div className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-6">
          <div className="border-b border-line pb-3">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-forest" />
              <span>Feature Flags: Gestión Inteligente de Módulos</span>
            </h3>
            <p className="text-muted text-[11px] mt-0.5">
              Visualiza en tiempo real qué módulos están habilitados o bloqueados en función de tu plan de suscripción actual <strong className="text-forest font-bold">{plan}</strong>. El sistema no utiliza validaciones hardcodeadas.
            </p>
          </div>

          <div className="space-y-3">
            {featureList.map((f) => {
              const isEnabled = isFeatureEnabled(f.id);
              return (
                <div 
                  key={f.id} 
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border gap-4 transition-all ${
                    isEnabled 
                      ? 'border-emerald-200 bg-emerald-50/5' 
                      : 'border-slate-200 bg-slate-50/40 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-ink">{f.name}</h4>
                      {isEnabled ? (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                          Habilitado (Activo)
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Bloqueado (Suscripción)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted mt-1 max-w-2xl leading-normal">{f.desc}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-muted">Mínimo Plan Requerido:</span>
                    <div className="text-xs font-black text-slate-800 mt-0.5">{f.requiredPlan}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Contents: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <History className="w-4 h-4 text-forest" />
                <span>Bitácora de Auditoría Centralizada (SaaS Logs)</span>
              </h3>
              <p className="text-muted text-[11px] mt-0.5">
                Historial completo de cambios críticos y acciones administrativas ejecutadas bajo el tenant <code className="font-mono text-sky-700 bg-sky-50 px-1 rounded">{tenantId}</code>.
              </p>
            </div>
            
            <button
              onClick={loadLogs}
              disabled={loadingLogs}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-bold rounded-lg border border-line flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>Recargar</span>
            </button>
          </div>

          {loadingLogs ? (
            <div className="flex flex-col items-center justify-center p-12 min-h-[250px]">
              <RefreshCw className="w-8 h-8 text-forest animate-spin mb-2" />
              <p className="text-xs text-muted font-bold">Consultando bitácora central de auditoría...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 min-h-[250px] border border-dashed border-line rounded-xl bg-slate-50">
              <ShieldCheck className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs text-muted font-extrabold">No hay logs de auditoría registrados para este tenant.</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm text-center">
                Realiza alguna operación administrativa (como cambiar planes o guardar ajustes) para registrar los primeros eventos de auditoría.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {logs.map((log) => {
                const isConfigChange = log.action === 'UPDATE_CONFIG' || log.action === 'CHANGE_TENANT';
                return (
                  <div key={log.id} className="p-3.5 rounded-xl border border-line bg-slate-50/50 hover:bg-slate-50 transition-all text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-line/40 pb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono ${
                          isConfigChange ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-muted text-[10px]">&bull;</span>
                        <span className="font-extrabold text-ink">Entidad: <code className="font-mono bg-white px-1 border border-line/50 rounded">{log.entityType}</code></span>
                      </div>
                      
                      <div className="text-muted text-[10px] font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('es-AR')}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-2 text-[11px]">
                      <div>
                        <span className="text-muted">Operador: </span>
                        <strong className="text-ink">{log.userEmail || log.userId}</strong>
                      </div>
                      <div>
                        <span className="text-muted">ID de Registro: </span>
                        <code className="font-mono text-slate-600">{log.entityId}</code>
                      </div>
                    </div>

                    {/* Change Differ details if available */}
                    {(log.previousState || log.newState) && (
                      <div className="bg-slate-950/5 text-slate-900 p-2.5 rounded-lg font-mono text-[10px] border border-line/20 space-y-1 overflow-x-auto">
                        <div className="text-muted font-bold uppercase text-[9px] tracking-wider mb-1">Diferencias Registradas:</div>
                        {log.previousState && (
                          <div>
                            <span className="text-rose-700 font-bold">- ANTES: </span>
                            <span>{JSON.stringify(log.previousState)}</span>
                          </div>
                        )}
                        {log.newState && (
                          <div>
                            <span className="text-emerald-700 font-bold">+ DESPUES: </span>
                            <span>{JSON.stringify(log.newState)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SaaSConfigEditor;
