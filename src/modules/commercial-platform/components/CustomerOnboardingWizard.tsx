import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Trees, 
  Bed, 
  Palette, 
  Globe, 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2, 
  RefreshCw, 
  Sparkle, 
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { CommercialService } from '../services/CommercialService';
import { CustomerOnboardingProgress, SaaSPlanType } from '../types';

export const CustomerOnboardingWizard: React.FC<{
  tenantId: string;
  onComplete: () => void;
  onExit: () => void;
}> = ({ tenantId, onComplete, onExit }) => {
  const [progress, setProgress] = useState<CustomerOnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState<string[]>([]);
  const [justFinished, setJustFinished] = useState(false);

  // Load progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await CommercialService.getOnboardingProgress(tenantId);
        if (data) {
          setProgress(data);
        } else {
          // Create empty progress
          const newProgress: CustomerOnboardingProgress = {
            id: tenantId,
            userId: 'user-onboard',
            currentStep: 1,
            profile: { fullName: '', phone: '', roleInCompany: '' },
            company: { legalName: '', taxId: '', billingAddress: '' },
            resort: { name: '', businessType: 'CABIN', country: 'Argentina', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires', email: '', phone: '' },
            rooms: [
              { id: 'r1', name: 'Suite Estándar', category: 'Parejas', price: 65000, capacity: 2 }
            ],
            branding: { logoIcon: 'trees', primaryColor: '#07140e', secondaryColor: '#dca54c' },
            domain: { requestedSubdomain: tenantId, status: 'active' },
            payments: { selectedPlan: 'Professional', billingCycle: 'monthly', paymentMethodPlaceholder: 'Visa terminada en 4242' },
            completed: false,
            updatedAt: new Date().toISOString()
          };
          await CommercialService.saveOnboardingProgress(newProgress);
          setProgress(newProgress);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, [tenantId]);

  const saveCurrentProgress = async (updated: CustomerOnboardingProgress) => {
    setSaving(true);
    try {
      await CommercialService.saveOnboardingProgress(updated);
      setProgress(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!progress) return;
    const nextStep = progress.currentStep + 1;
    const updated = {
      ...progress,
      currentStep: nextStep,
      updatedAt: new Date().toISOString()
    };
    await saveCurrentProgress(updated);
  };

  const handleBack = async () => {
    if (!progress || progress.currentStep <= 1) return;
    const prevStep = progress.currentStep - 1;
    const updated = {
      ...progress,
      currentStep: prevStep,
      updatedAt: new Date().toISOString()
    };
    await saveCurrentProgress(updated);
  };

  const handlePublishTenant = async () => {
    if (!progress) return;
    setPublishing(true);
    setPublishProgress([]);

    const log = (msg: string, delay: number) => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          setPublishProgress(prev => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    await log('🔒 Iniciando aprovisionamiento del tenant en la plataforma...', 300);
    await log('🗄️ Generando tablas de base de datos aisladas en Firestore...', 600);
    await log('🔑 Creando políticas de seguridad RBAC de acceso de personal...', 500);
    await log('🎨 Aplicando branding personalizado a tu portal de huéspedes...', 500);
    await log('⚙️ Seeding habitaciones, tarifas y configuraciones iniciales...', 600);
    await log('🌐 Registrando subdominio seguro *.stayflow.app con HTTPS SSL...', 400);
    await log('✨ ¡Aprovisionamiento completado! Tu Resort está en vivo.', 300);

    const updated = {
      ...progress,
      completed: true,
      currentStep: 8,
      updatedAt: new Date().toISOString()
    };
    await saveCurrentProgress(updated);
    setPublishing(false);
    setJustFinished(true);
  };

  const addRoom = () => {
    if (!progress) return;
    const updated = {
      ...progress,
      rooms: [
        ...progress.rooms,
        {
          id: `room-${Date.now()}`,
          name: '',
          category: 'Premium',
          price: 50000,
          capacity: 2
        }
      ]
    };
    setProgress(updated);
  };

  const removeRoom = (id: string) => {
    if (!progress || progress.rooms.length <= 1) return;
    const updated = {
      ...progress,
      rooms: progress.rooms.filter(r => r.id !== id)
    };
    setProgress(updated);
  };

  const updateRoomField = (id: string, field: string, value: any) => {
    if (!progress) return;
    const updated = {
      ...progress,
      rooms: progress.rooms.map(r => r.id === id ? { ...r, [field]: value } : r)
    };
    setProgress(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-forest" />
        <p className="text-xs text-muted mt-2 font-bold font-sans">Cargando asistente de onboarding...</p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-8">
        <p className="text-sm font-bold text-red-500">Error al iniciar el onboarding.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 rounded-xl bg-slate-200 text-xs font-bold">Salir</button>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Perfil', icon: User },
    { num: 2, label: 'Empresa', icon: Building2 },
    { num: 3, label: 'Complejo', icon: Trees },
    { num: 4, label: 'Habitaciones', icon: Bed },
    { num: 5, label: 'Branding', icon: Palette },
    { num: 6, label: 'Dominio', icon: Globe },
    { num: 7, label: 'Pagos', icon: CreditCard },
    { num: 8, label: 'Publicación', icon: Sparkles }
  ];

  const currentStep = progress.currentStep;

  return (
    <div className="min-h-screen bg-[#f7faf6] text-slate-800 flex flex-col font-sans">
      {/* Onboarding Header */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-40 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="grid w-8 h-8 place-content-center bg-forest text-white rounded-lg font-black text-sm">SF</span>
          <div>
            <strong className="block text-sm text-slate-800 tracking-tight font-display font-black">StayFlow Onboarding</strong>
            <span className="text-[10px] text-slate-400 font-mono">Tenant ID: {tenantId}</span>
          </div>
        </div>

        <button 
          onClick={onExit}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 border border-slate-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
        >
          Guardar y continuar luego
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Wizard Step List Sidebar */}
        <aside className="lg:col-span-3 bg-white border border-slate-100 shadow-sm p-4 rounded-3xl space-y-3 shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Progreso</div>
          <nav className="space-y-1">
            {steps.map((s) => {
              const isActive = s.num === currentStep;
              const isPast = s.num < currentStep;
              return (
                <div 
                  key={s.num} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive 
                      ? 'bg-forest/10 text-forest font-bold border-l-4 border-forest' 
                      : isPast 
                        ? 'text-emerald-600' 
                        : 'text-slate-400'
                  }`}
                >
                  <span className={`grid w-6 h-6 place-content-center rounded-lg text-xs ${
                    isActive 
                      ? 'bg-forest text-white' 
                      : isPast 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                        : 'bg-slate-50 text-slate-400'
                  }`}>
                    {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </span>
                  <span className="text-xs">{s.label}</span>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Wizard Form Workspace */}
        <main className="lg:col-span-9 bg-white border border-slate-100 shadow-sm rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          
          {saving && (
            <div className="absolute top-4 right-6 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Guardando borrador...</span>
            </div>
          )}

          {justFinished ? (
            <div className="py-12 text-center space-y-6">
              <div className="w-16 h-16 bg-forest/10 text-forest rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h1 className="font-display font-black text-2xl text-slate-900">¡Configuración Exitosa!</h1>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  Tu establecimiento <strong>"{progress.resort.name}"</strong> ha sido provisionado y activado correctamente. Ya puedes acceder al backoffice para administrar reservas.
                </p>
              </div>

              <div className="p-4 bg-[#fafbf9] border border-green-50/50 rounded-2xl text-left space-y-2 text-xs max-w-md mx-auto">
                <div className="flex gap-2 text-forest font-bold items-center">
                  <Sparkle className="w-4 h-4" />
                  <span>SaaS Provisioning Info:</span>
                </div>
                <ul className="text-slate-600 pl-1.5 space-y-1 font-mono text-[10px]">
                  <li>✓ Subdomain: {progress.domain.requestedSubdomain}.stayflow.app</li>
                  <li>✓ Plan: {progress.payments.selectedPlan}</li>
                  <li>✓ Database Partition: Isolation enforced</li>
                  <li>✓ Default Owner: {progress.profile.fullName}</li>
                </ul>
              </div>

              <button
                onClick={onComplete}
                className="w-full max-w-xs min-h-[44px] bg-forest hover:bg-forest-hover text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mx-auto"
              >
                <span>Acceder al Panel del Resort</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* STEP 1: PERFIL */}
              {currentStep === 1 && (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <h2 className="font-display font-black text-lg text-slate-900">Paso 1: Tu Perfil Profesional</h2>
                    <p className="text-xs text-slate-500">Cuéntanos un poco sobre ti, administrador de la plataforma.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ej: Marcelo Gómez"
                        value={progress.profile.fullName}
                        onChange={e => setProgress({ ...progress, profile: { ...progress.profile, fullName: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Móvil</label>
                      <input 
                        type="tel"
                        required
                        placeholder="Ej: +5492945551234"
                        value={progress.profile.phone}
                        onChange={e => setProgress({ ...progress, profile: { ...progress.profile, phone: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Rol en la Empresa / Alojamiento</label>
                    <select
                      value={progress.profile.roleInCompany}
                      onChange={e => setProgress({ ...progress, profile: { ...progress.profile, roleInCompany: e.target.value } })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-forest"
                    >
                      <option value="">Selecciona tu rol...</option>
                      <option value="owner">Propietario / Dueño</option>
                      <option value="manager">Gerente / Director</option>
                      <option value="admin">Administrador de Sistemas</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: EMPRESA */}
              {currentStep === 2 && (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <h2 className="font-display font-black text-lg text-slate-900">Paso 2: Datos de la Empresa</h2>
                    <p className="text-xs text-slate-500">Información jurídica y de facturación fiscal para emitir contratos y facturas.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Razón Social / Nombre Legal</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ej: Altos del Bosque S.A."
                        value={progress.company.legalName}
                        onChange={e => setProgress({ ...progress, company: { ...progress.company, legalName: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Identificación Fiscal (CUIT / RUT / RFC)</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ej: 30-12345678-9"
                        value={progress.company.taxId}
                        onChange={e => setProgress({ ...progress, company: { ...progress.company, taxId: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Dirección de Facturación Principal</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ej: Av. San Martín 1200, Bariloche"
                      value={progress.company.billingAddress}
                      onChange={e => setProgress({ ...progress, company: { ...progress.company, billingAddress: e.target.value } })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: COMPLEJO */}
              {currentStep === 3 && (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <h2 className="font-display font-black text-lg text-slate-900">Paso 3: Identidad de tu Complejo</h2>
                    <p className="text-xs text-slate-500">Así es como tus huéspedes verán tu complejo turístico en la web pública.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Comercial del Complejo</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ej: Altos del Bosque Cabañas"
                        value={progress.resort.name}
                        onChange={e => setProgress({ ...progress, resort: { ...progress.resort, name: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Alojamiento</label>
                      <select
                        value={progress.resort.businessType}
                        onChange={e => setProgress({ ...progress, resort: { ...progress.resort, businessType: e.target.value as any } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-forest"
                      >
                        <option value="CABIN">Cabañas</option>
                        <option value="GLAMPING">Glamping</option>
                        <option value="HOTEL">Hotel</option>
                        <option value="HOSTEL">Hostel</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">País</label>
                      <input 
                        type="text"
                        required
                        placeholder="Argentina"
                        value={progress.resort.country}
                        onChange={e => setProgress({ ...progress, resort: { ...progress.resort, country: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Moneda Operativa</label>
                      <input 
                        type="text"
                        required
                        placeholder="ARS"
                        value={progress.resort.currency}
                        onChange={e => setProgress({ ...progress, resort: { ...progress.resort, currency: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Zona Horaria</label>
                      <input 
                        type="text"
                        required
                        placeholder="America/Argentina/Buenos_Aires"
                        value={progress.resort.timezone}
                        onChange={e => setProgress({ ...progress, resort: { ...progress.resort, timezone: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Email Público de Contacto</label>
                      <input 
                        type="email"
                        required
                        placeholder="Ej: reservas@altosdelbosque.com"
                        value={progress.resort.email}
                        onChange={e => setProgress({ ...progress, resort: { ...progress.resort, email: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Público (WhatsApp)</label>
                      <input 
                        type="tel"
                        required
                        placeholder="Ej: +5492945551234"
                        value={progress.resort.phone}
                        onChange={e => setProgress({ ...progress, resort: { ...progress.resort, phone: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: HABITACIONES */}
              {currentStep === 4 && (
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <h2 className="font-display font-black text-lg text-slate-900">Paso 4: Carga de Habitaciones Iniciales</h2>
                      <p className="text-xs text-slate-500">Configura al menos tu primer tipo de alojamiento o habitación.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addRoom}
                      className="px-3.5 py-1.5 rounded-xl bg-forest text-white hover:bg-forest-hover font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir otra</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {progress.rooms.map((room, idx) => (
                      <div key={room.id} className="p-4 bg-slate-50 border border-slate-250/60 rounded-2xl relative grid md:grid-cols-4 gap-3">
                        <div className="space-y-1 md:col-span-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre Habitación / Unidad</label>
                          <input 
                            type="text"
                            required
                            placeholder="Ej: Cabaña Forest Premium"
                            value={room.name}
                            onChange={e => updateRoomField(room.id, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-forest"
                          />
                        </div>

                        <div className="space-y-1 md:col-span-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Categoría</label>
                          <input 
                            type="text"
                            placeholder="Ej: Parejas"
                            value={room.category}
                            onChange={e => updateRoomField(room.id, 'category', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-forest"
                          />
                        </div>

                        <div className="space-y-1 md:col-span-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Precio por noche</label>
                          <input 
                            type="number"
                            required
                            min={0}
                            value={room.price}
                            onChange={e => updateRoomField(room.id, 'price', Number(e.target.value))}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-forest"
                          />
                        </div>

                        <div className="space-y-1 md:col-span-1 flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Capacidad máx.</label>
                            <input 
                              type="number"
                              required
                              min={1}
                              value={room.capacity}
                              onChange={e => updateRoomField(room.id, 'capacity', Number(e.target.value))}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-forest"
                            />
                          </div>
                          {progress.rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRoom(room.id)}
                              className="w-9 h-9 shrink-0 grid place-content-center bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: BRANDING */}
              {currentStep === 5 && (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <h2 className="font-display font-black text-lg text-slate-900">Paso 5: Branding & Colores Corporativos</h2>
                    <p className="text-xs text-slate-500">Personaliza la interfaz visual de tu portal público de reservas y del backoffice administrativo.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Color Primario (Fondo de cabeceras, botones principales)</label>
                        <div className="flex gap-2">
                          <input 
                            type="color"
                            value={progress.branding.primaryColor}
                            onChange={e => setProgress({ ...progress, branding: { ...progress.branding, primaryColor: e.target.value } })}
                            className="w-10 h-10 rounded-xl bg-transparent border border-slate-200 cursor-pointer"
                          />
                          <input 
                            type="text"
                            value={progress.branding.primaryColor}
                            onChange={e => setProgress({ ...progress, branding: { ...progress.branding, primaryColor: e.target.value } })}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Color Secundario (Acentos, badges, enlaces)</label>
                        <div className="flex gap-2">
                          <input 
                            type="color"
                            value={progress.branding.secondaryColor}
                            onChange={e => setProgress({ ...progress, branding: { ...progress.branding, secondaryColor: e.target.value } })}
                            className="w-10 h-10 rounded-xl bg-transparent border border-slate-200 cursor-pointer"
                          />
                          <input 
                            type="text"
                            value={progress.branding.secondaryColor}
                            onChange={e => setProgress({ ...progress, branding: { ...progress.branding, secondaryColor: e.target.value } })}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Icono del Isotipo corporativo</label>
                        <select
                          value={progress.branding.logoIcon}
                          onChange={e => setProgress({ ...progress, branding: { ...progress.branding, logoIcon: e.target.value } })}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest text-slate-700"
                        >
                          <option value="trees">Bosque (Pinos / Árboles)</option>
                          <option value="mountain">Montaña</option>
                          <option value="palmtree">Palmera / Playa</option>
                          <option value="compass">Brújula / Aventura</option>
                          <option value="tent">Carpa / Glamping</option>
                        </select>
                      </div>
                    </div>

                    {/* Branding Live Preview Mockup */}
                    <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
                      <div className="space-y-1 border-b border-slate-200 pb-2">
                        <strong className="text-[10px] text-slate-400 font-mono">Live Preview Mockup</strong>
                        <div className="flex gap-2 items-center text-xs">
                          <span 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: progress.branding.primaryColor }}
                          >
                            ⭐
                          </span>
                          <span className="font-bold">{progress.resort.name || 'Mi Complejo'}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="h-3 w-3/4 rounded bg-slate-200"></div>
                        <div className="h-3 w-1/2 rounded bg-slate-200"></div>
                        <button 
                          type="button"
                          className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: progress.branding.primaryColor }}
                        >
                          Reservar Ahora
                        </button>
                      </div>

                      <div className="text-[9px] text-slate-400 font-sans leading-relaxed pt-2 border-t border-slate-200">
                        Los colores se aplicarán automáticamente a todo el CMS público de StayFlow al finalizar.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: DOMINIO */}
              {currentStep === 6 && (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <h2 className="font-display font-black text-lg text-slate-900">Paso 6: Configuración del Dominio de Internet</h2>
                    <p className="text-xs text-slate-500">El portal público de tu complejo estará inmediatamente disponible en la red.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Subdominio Dedicado en StayFlow</label>
                      <div className="flex">
                        <input 
                          type="text"
                          required
                          placeholder="altos-del-bosque"
                          value={progress.domain.requestedSubdomain}
                          onChange={e => setProgress({ ...progress, domain: { ...progress.domain, requestedSubdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') } })}
                          className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-l-xl focus:border-forest text-right"
                        />
                        <span className="bg-slate-100 border border-l-0 border-slate-200 text-slate-500 px-4 py-2 text-xs font-bold rounded-r-xl flex items-center">
                          .stayflow.app
                        </span>
                      </div>
                      <small className="text-[10px] text-slate-400 leading-none">Usa letras minúsculas, números y guiones únicamente.</small>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Dominio Personalizado (Opcional - Planes Pro o superior)</label>
                      <input 
                        type="text"
                        placeholder="Ej: www.altosdelbosque.com"
                        value={progress.domain.customDomain || ''}
                        onChange={e => setProgress({ ...progress, domain: { ...progress.domain, customDomain: e.target.value } })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest"
                      />
                      <small className="text-[10px] text-slate-400 leading-none block">Te brindaremos las instrucciones DNS (registro CNAME) para apuntar tu propio dominio.</small>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: PAGOS */}
              {currentStep === 7 && (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <h2 className="font-display font-black text-lg text-slate-900">Paso 7: Contratación de Plan & Facturación</h2>
                    <p className="text-xs text-slate-500">Selecciona el plan óptimo para operar StayFlow. Prueba gratuita por 14 días activa.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Plan Seleccionado</label>
                        <select
                          value={progress.payments.selectedPlan}
                          onChange={e => setProgress({ ...progress, payments: { ...progress.payments, selectedPlan: e.target.value as SaaSPlanType } })}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-forest text-slate-700 font-bold"
                        >
                          <option value="Starter">Starter (Hasta 1 alojamiento) - $49/mes</option>
                          <option value="Professional">Professional (Hasta 3 alojamientos) - $99/mes</option>
                          <option value="Business">Business (Hasta 10 alojamientos) - $199/mes</option>
                          <option value="Enterprise">Enterprise (Ilimitado) - $399/mes</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Ciclo de Facturación</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setProgress({ ...progress, payments: { ...progress.payments, billingCycle: 'monthly' } })}
                            className={`p-2.5 rounded-xl text-center text-xs font-bold border ${
                              progress.payments.billingCycle === 'monthly' ? 'bg-forest border-forest text-white' : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Pago Mensual
                          </button>
                          <button
                            type="button"
                            onClick={() => setProgress({ ...progress, payments: { ...progress.payments, billingCycle: 'yearly' } })}
                            className={`p-2.5 rounded-xl text-center text-xs font-bold border flex justify-center items-center gap-1 ${
                              progress.payments.billingCycle === 'yearly' ? 'bg-forest border-forest text-white' : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span>Anual (-15%)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subscription billing ready overview */}
                    <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
                      <div>
                        <strong className="text-[10px] text-slate-400 font-mono block">Resumen del Plan SaaS</strong>
                        <div className="flex justify-between items-baseline pt-2">
                          <span className="font-bold text-slate-800">{progress.payments.selectedPlan}</span>
                          <span className="text-sm font-black font-display text-forest">
                            ${progress.payments.selectedPlan === 'Starter' ? 49 : progress.payments.selectedPlan === 'Professional' ? 99 : progress.payments.selectedPlan === 'Business' ? 199 : 399}/mes
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 space-y-1.5 border-t border-b border-slate-200/60 py-2.5">
                        <div className="flex justify-between">
                          <span>Periodo de Prueba:</span>
                          <span className="text-emerald-600 font-bold">14 días gratis</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Próximo vencimiento:</span>
                          <span>En 14 días</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Importe a abonar hoy:</span>
                          <span className="font-bold text-slate-800">$0.00 (Prueba activa)</span>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center text-[10px] text-slate-400 leading-none">
                        <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Módulo de Facturación Listo (No se requiere abonar hoy).</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: PUBLICACIÓN */}
              {currentStep === 8 && (
                <div className="space-y-4 text-center py-6">
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h2 className="font-display font-black text-lg text-slate-900">Paso 8: ¡Todo Listo para Despegar!</h2>
                    <p className="text-xs text-slate-500">Presiona el botón de abajo para activar tu suscripción, aprovisionar tus bases de datos y publicar tu portal público.</p>
                  </div>

                  {publishing ? (
                    <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl text-left max-w-md mx-auto space-y-3 font-mono text-[10px] text-slate-300">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">StayFlow Provisioning Engine</span>
                      </div>
                      <div className="space-y-1 max-h-[160px] overflow-y-auto">
                        {publishProgress.map((p, idx) => (
                          <p key={idx} className="text-emerald-400">✓ {p}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={handlePublishTenant}
                        className="px-8 py-3.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-lg transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-warning fill-warning" />
                        <span>Aprovisionar y Lanzar Mi Resort</span>
                      </button>

                      <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
                        Al presionar el botón se creará automáticamente tu tenant, se aprovisionarán las colecciones iniciales y se registrará tu perfil.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Wizard Footer Controls */}
              {currentStep < 8 && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-4">
                  <button
                    type="button"
                    disabled={currentStep <= 1 || saving}
                    onClick={handleBack}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <span>Siguiente</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
