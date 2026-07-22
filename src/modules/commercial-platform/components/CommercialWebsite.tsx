import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Check, 
  Sparkles, 
  CheckCircle, 
  Play, 
  Globe, 
  ShieldCheck, 
  Clock, 
  Users, 
  Layers, 
  Send, 
  MessageCircle, 
  TrendingUp, 
  Home as HomeIcon, 
  Bed, 
  Zap, 
  Smartphone, 
  HelpCircle, 
  FileText, 
  MapPin, 
  Mail, 
  Phone,
  BarChart4,
  Cpu,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { CommercialService } from '../services/CommercialService';
import { CommercialPlan, CommercialLead } from '../types';

export const CommercialWebsite: React.FC<{
  onStartOnboarding: (tenantId: string) => void;
  onNavigateToPMS: () => void;
  onNavigateToMobile?: () => void;
}> = ({ onStartOnboarding, onNavigateToPMS, onNavigateToMobile }) => {
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [activePlanTab, setActivePlanTab] = useState<'monthly' | 'yearly'>('monthly');
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: 'Argentina',
    accommodationType: 'CABIN' as const,
    roomCount: 10,
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Load plans
  useEffect(() => {
    const fetchPlans = async () => {
      const p = await CommercialService.getPlans();
      setPlans(p);
    };
    fetchPlans();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'roomCount' ? Number(value) : value
    }));
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await CommercialService.submitDemoRequest(formData);
      setSuccess(true);
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        country: 'Argentina',
        accommodationType: 'CABIN',
        roomCount: 10,
        message: ''
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    {
      title: 'Incrementa tus Reservas Directas',
      desc: 'Sáltate las altas comisiones de Booking y Airbnb con nuestro motor de reservas integrado de alta conversión.',
      icon: TrendingUp,
      color: 'bg-emerald-500/10 text-emerald-600'
    },
    {
      title: 'Operación 100% Automatizada',
      desc: 'Gestión automática de tarifas, pasarela de pago segura, facturación lista y reportes BI automáticos.',
      icon: Zap,
      color: 'bg-indigo-500/10 text-indigo-600'
    },
    {
      title: 'Copilot de IA Inteligente',
      desc: 'Tu asistente automatizado que responde consultas, sugiere tarifas óptimas y automatiza el check-in.',
      icon: Cpu,
      color: 'bg-orange/10 text-orange'
    }
  ];

  const features = [
    {
      title: 'Motor de Reservas Integrado',
      desc: 'Un portal público autogestionado con buscador inteligente para que tus huéspedes reserven y paguen en tiempo real.',
      icon: Globe
    },
    {
      title: 'PMS Multiusuario & Complejo',
      desc: 'Administración visual e intuitiva de disponibilidad, check-ins, check-outs y estados de limpieza en tiempo récord.',
      icon: Layers
    },
    {
      title: 'Pasarela de Pago Online',
      desc: 'Integración directa para procesar pagos seguros con Mercado Pago, Stripe, tarjetas de crédito y transferencias.',
      icon: ShieldCheck
    },
    {
      title: 'Revenue Engine Inteligente',
      desc: 'Tarifas dinámicas automatizadas según estacionalidad, ocupación histórica y sugerencias del copilot inteligente.',
      icon: BarChart4
    },
    {
      title: 'Check-In Digital & Llave',
      desc: 'Tus huéspedes completan su declaración y firman su consentimiento digitalmente antes de ingresar.',
      icon: Smartphone
    },
    {
      title: 'Estadísticas & BI Avanzado',
      desc: 'Análisis detallado de ocupación, RevPAR, ADR, procedencia de huéspedes y canales de venta en tiempo real.',
      icon: Clock
    }
  ];

  const faqs = [
    {
      q: '¿Qué es StayFlow y para qué tipo de alojamientos sirve?',
      a: 'StayFlow es una plataforma SaaS All-in-One de gestión hotelera y PMS. Está diseñada para cabañas, glampings, hoteles boutique, hostales y resorts de naturaleza que desean automatizar sus reservas directas, gestionar cobros online y organizar toda su operación diaria sin fricciones.'
    },
    {
      q: '¿Cómo funciona la creación de un nuevo tenant (sitio web)?',
      a: 'Al contratar un plan o registrarte, nuestra plataforma aprovisiona automáticamente un entorno dedicado (tenant) único para tu empresa, con su base de datos aislada, portal público configurable con CMS y panel administrativo integrado. Estará listo para operar en segundos.'
    },
    {
      q: '¿Puedo conectar mi propio dominio de internet?',
      a: '¡Por supuesto! En los planes Professional, Business y Enterprise puedes apuntar tu propio dominio (ej: www.turesort.com) directamente al portal público de StayFlow con certificados de seguridad SSL gratuitos incluidos.'
    },
    {
      q: '¿Qué comisiones cobran por reserva?',
      a: '¡Ninguna! A diferencia de otras plataformas o portales tradicionales (OTAs), StayFlow no cobra ninguna comisión por las reservas directas procesadas en tu sitio web. Solo abonas tu suscripción fija mensual del plan seleccionado.'
    }
  ];

  const blogPosts = [
    {
      title: 'Cómo potenciar las reservas directas de tus cabañas este 2026',
      excerpt: 'Descubre las mejores estrategias de marketing y diseño web para reducir la dependencia de las grandes agencias de viajes online.',
      image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=600&q=80',
      category: 'Marketing Hotelero',
      date: 'Julio 20, 2026'
    },
    {
      title: 'La guía definitiva del Glamping: Estilo, Confort y Automatización',
      excerpt: 'El auge de los alojamientos de lujo en plena naturaleza y cómo la tecnología permite operarlos con personal mínimo de forma eficiente.',
      image: 'https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=600&q=80',
      category: 'Tendencias',
      date: 'Julio 15, 2026'
    },
    {
      title: 'Inteligencia Artificial aplicada al Revenue Management',
      excerpt: 'Aprende cómo usar algoritmos predictivos sencillos para ajustar tarifas en tiempo real y maximizar tu beneficio diario.',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
      category: 'Tecnología',
      date: 'Julio 08, 2026'
    }
  ];

  return (
    <div className="bg-[#f8faf7] text-slate-800 min-h-screen font-sans antialiased">
      {/* Floating Marketing Badge Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="grid w-8 h-8 place-content-center rounded-xl bg-forest text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-display font-black text-lg tracking-tight text-forest">StayFlow <span className="text-orange text-xs uppercase font-mono font-bold tracking-widest px-1.5 py-0.5 rounded bg-orange/10 ml-1">SaaS</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onNavigateToPMS}
              className="text-xs font-bold text-forest hover:text-forest-hover px-3 py-2 cursor-pointer transition-colors"
            >
              Ver Demo de PMS / Huésped
            </button>
            {onNavigateToMobile && (
              <button 
                onClick={onNavigateToMobile}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-2 cursor-pointer transition-colors flex items-center gap-1 bg-indigo-50/50 rounded-lg"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Demo Suite Móvil</span>
                <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold">Offline</span>
              </button>
            )}
            <a 
              href="#planes"
              className="text-xs font-bold text-white bg-forest hover:bg-forest-hover px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Ver Planes
            </a>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-white to-[#f0f4f0]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest/10 text-forest text-xs font-extrabold font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plataforma Comercial de Próxima Generación</span>
            </div>
            
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight">
              El motor operativo para tu <span className="text-forest underline decoration-orange/50 decoration-wavy">Complejo Turístico</span>
            </h1>
            
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
              Consigue más reservas directas con tu propio portal público, administra habitaciones en un PMS visual intuitivo, procesa cobros y automatiza toda tu gestión con un asistente de IA. Todo en un solo SaaS multi-tenant.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a 
                href="#demo"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-sm px-6 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Solicitar Demo Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="#como-funciona"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm px-6 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 text-orange fill-orange" />
                <span>¿Cómo funciona?</span>
              </a>
              {onNavigateToMobile && (
                <button 
                  onClick={onNavigateToMobile}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>Suite Móvil (Offline Ready)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/60 max-w-lg">
              <div>
                <strong className="block text-2xl font-display font-black text-forest">0%</strong>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Comisiones de reservas</span>
              </div>
              <div>
                <strong className="block text-2xl font-display font-black text-forest">+35%</strong>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ocupación promedio</span>
              </div>
              <div>
                <strong className="block text-2xl font-display font-black text-forest">100%</strong>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">En la nube & Offline Ready</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-forest/5 rounded-3xl blur-2xl transform rotate-3"></div>
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 shadow-2xl bg-white">
              <div className="bg-slate-900 px-4 py-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                <span className="text-[10px] text-slate-400 font-mono ml-2">https://demo.stayflow.app</span>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=700&q=80" 
                alt="StayFlow Suite" 
                className="w-full h-auto object-cover"
              />
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Entorno Certificado StayFlow</span>
                </div>
                <span className="font-mono text-forest font-bold">100% Funcional</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 max-w-7xl mx-auto px-6" id="beneficios">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-extrabold text-orange uppercase tracking-widest font-mono">Beneficios Únicos</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
            Diseñado especialmente para la hospitalidad de naturaleza
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Elimina el desorden de usar múltiples herramientas. StayFlow unifica todo tu ecosistema para que dediques más tiempo a tus huéspedes y menos a los excels.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white border border-slate-100 shadow-sm p-6 rounded-2xl space-y-4 hover:shadow-md transition-shadow">
              <span className={`grid w-12 h-12 place-content-center rounded-2xl ${b.color}`}>
                <b.icon className="w-6 h-6" />
              </span>
              <h3 className="font-display font-black text-lg text-slate-900">{b.title}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-slate-900 text-white" id="como-funciona">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="text-xs font-extrabold text-orange uppercase tracking-widest font-mono">Puesta en Marcha Veloz</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
                ¿Cómo funciona el alta automática y onboarding?
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Nuestra plataforma automatiza el aprovisionamiento de tu tenant y te asiste paso a paso en la puesta en marcha inicial sin demoras técnicas.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <span className="w-7 h-7 rounded-full bg-orange/10 border border-orange/40 text-orange font-bold text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">Eliges tu plan y solicitas acceso</h4>
                    <p className="text-[11px] text-slate-400">Seleccionas el tamaño de tu complejo y completas los datos de tu empresa.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="w-7 h-7 rounded-full bg-orange/10 border border-orange/40 text-orange font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">Aprovisionamiento Automático</h4>
                    <p className="text-[11px] text-slate-400">Una vez aprobada tu solicitud, el sistema genera tu tenant, base de datos y portal con un solo click.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="w-7 h-7 rounded-full bg-orange/10 border border-orange/40 text-orange font-bold text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">Asistente de Onboarding guiado</h4>
                    <p className="text-[11px] text-slate-400">Cargas tus tarifas, fotos, habitaciones, personalizas colores corporativos y listo para recibir huéspedes.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Proceso de Aprovisionamiento StayFlow</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">PROVISION_SERVICE_ACTIVE</span>
              </div>
              
              <div className="font-mono text-slate-300 text-[10px] leading-relaxed space-y-1 bg-slate-950 p-4 rounded-xl border border-slate-850/60 max-h-[250px] overflow-y-auto">
                <p className="text-emerald-400">🚀 [STAYFLOW_SaaS] Starting automated provisioning for "Altos del Bosque"...</p>
                <p className="text-slate-500">[1/6] Creating database partition and tables isolation...</p>
                <p className="text-slate-300">[OK] Partition saas_config_altos-del-bosque generated.</p>
                <p className="text-slate-500">[2/6] Generating default roles & RBAC constraints (owner, staff, admin)...</p>
                <p className="text-slate-300">[OK] RBAC initialized with 3 default roles.</p>
                <p className="text-slate-500">[3/6] Setting up public website CMS layout templates...</p>
                <p className="text-emerald-400">[OK] SSL generated and virtual host route mapped.</p>
                <p className="text-slate-500">[4/6] Seeding sample rooms & default booking policies...</p>
                <p className="text-slate-300">[OK] 2 default cabin templates successfully loaded.</p>
                <p className="text-orange">[5/6] Registering billing profile under plan Professional...</p>
                <p className="text-emerald-400">✨ [FINISHED] Tenant provisioned successfully. ID: altos-del-bosque</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Tiempo de ejecución promedio:</span>
                <strong className="text-emerald-400 font-mono">1.8 segundos</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 max-w-7xl mx-auto px-6" id="caracteristicas">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-extrabold text-orange uppercase tracking-widest font-mono">Características de Élite</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
            Todo lo que necesitas para dominar tu mercado
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Plataforma moderna sin comprometer la potencia técnica de tu PMS.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-slate-100 shadow-sm p-6 rounded-2xl space-y-2 hover:-translate-y-1 transition-all">
              <span className="grid w-10 h-10 place-content-center rounded-xl bg-forest/10 text-forest mb-4">
                <f.icon className="w-5 h-5" />
              </span>
              <h3 className="font-display font-black text-base text-slate-900">{f.title}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-20 bg-gradient-to-b from-[#f0f4f0] to-white" id="planes">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-extrabold text-orange uppercase tracking-widest font-mono">Planes a tu Medida</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
              Precios transparentes y sin sorpresas
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Elige el plan ideal según la escala de tu establecimiento. Cancela o cambia cuando desees.
            </p>

            {/* Monthly / Yearly Switcher */}
            <div className="flex justify-center items-center gap-3 pt-4">
              <button 
                onClick={() => setActivePlanTab('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activePlanTab === 'monthly' ? 'bg-forest text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pago Mensual
              </button>
              <button 
                onClick={() => setActivePlanTab('yearly')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activePlanTab === 'yearly' ? 'bg-forest text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Pago Anual</span>
                <span className="bg-orange text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full uppercase">-15%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((p) => {
              const adjustedPrice = activePlanTab === 'yearly' ? Math.round(p.price * 0.85) : p.price;
              return (
                <div 
                  key={p.id} 
                  className={`bg-white border p-6 rounded-3xl flex flex-col justify-between transition-all relative ${
                    p.id === 'Professional' 
                      ? 'border-forest/60 shadow-xl ring-2 ring-forest/10 transform lg:-translate-y-2' 
                      : 'border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  {p.id === 'Professional' && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange text-white text-[9px] font-mono px-3 py-1 rounded-full uppercase font-black tracking-widest shadow-sm">
                      Recomendado
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display font-black text-base text-slate-900">{p.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Ideal para su categoría</p>
                    </div>

                    <div className="flex items-baseline gap-1 pt-2 border-t border-slate-100">
                      <span className="font-display font-black text-3xl text-slate-900">${adjustedPrice}</span>
                      <span className="text-xs text-slate-500 font-bold">/ mes</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                      <div className="flex justify-between">
                        <span>Alojamientos:</span>
                        <span className="font-bold text-slate-800">{p.maxAccommodations === 99 ? 'Ilimitados' : p.maxAccommodations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Habitaciones:</span>
                        <span className="font-bold text-slate-800">{p.maxRooms === 999 ? 'Ilimitadas' : p.maxRooms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usuarios:</span>
                        <span className="font-bold text-slate-800">{p.maxUsers === 99 ? 'Ilimitados' : p.maxUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Soporte:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[110px]" title={p.supportLevel}>{p.supportLevel}</span>
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 pt-2">
                      {p.features.map((feat, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <Check className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <a 
                      href="#demo"
                      onClick={() => setFormData(prev => ({ ...prev, message: `Interesados en el plan: ${p.name} (${activePlanTab === 'monthly' ? 'Pago Mensual' : 'Pago Anual'})` }))}
                      className={`w-full min-h-[42px] inline-flex items-center justify-center rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                        p.id === 'Professional' 
                          ? 'bg-forest hover:bg-forest-hover text-white shadow-md' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      Solicitar plan
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integraciones Section */}
      <section className="py-20 max-w-7xl mx-auto px-6" id="integraciones">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <span className="text-xs font-extrabold text-orange uppercase tracking-widest font-mono">Conectado con Todo</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
              Sincroniza y expande tu negocio sin límites
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              StayFlow se integra perfectamente con las principales herramientas que ya usas, facilitando el procesamiento de pagos, comunicación con clientes y actualización de disponibilidad.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                <strong className="block text-sm text-slate-800">Pasarelas de Pago</strong>
                <p className="text-[11px] text-slate-500">Mercado Pago, Stripe, tarjetas de crédito/débito locales.</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                <strong className="block text-sm text-slate-800">Mensajería Directa</strong>
                <p className="text-[11px] text-slate-500">Integración con WhatsApp Business para notificaciones y alertas.</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                <strong className="block text-sm text-slate-800">OTAs & Sync</strong>
                <p className="text-[11px] text-slate-500">Google Calendar, Airbnb e iCal sincronizados en tiempo real.</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                <strong className="block text-sm text-slate-800">AI Support Copilot</strong>
                <p className="text-[11px] text-slate-500">Atención inteligente de consultas de huéspedes automatizada.</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-xl p-8 grid grid-cols-3 gap-6 place-items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#00a3ff]/10 text-[#00a3ff] flex items-center justify-center text-xs font-black shadow-inner">Stripe</div>
            <div className="w-16 h-16 rounded-2xl bg-[#20a95a]/10 text-[#20a95a] flex items-center justify-center text-xs font-black shadow-inner">WhatsApp</div>
            <div className="w-16 h-16 rounded-2xl bg-[#009ee3]/10 text-[#009ee3] flex items-center justify-center text-xs font-black shadow-inner">M. Pago</div>
            <div className="w-16 h-16 rounded-2xl bg-[#ff5a5f]/10 text-[#ff5a5f] flex items-center justify-center text-xs font-black shadow-inner">Airbnb</div>
            <div className="w-16 h-16 rounded-2xl bg-[#1a73e8]/10 text-[#1a73e8] flex items-center justify-center text-xs font-black shadow-inner">Google</div>
            <div className="w-16 h-16 rounded-2xl bg-[#0f172a]/10 text-[#0f172a] flex items-center justify-center text-xs font-black shadow-inner">StayFlow</div>
          </div>
        </div>
      </section>

      {/* Blog Section (MÓDULO 1: Estructura Preparada) */}
      <section className="py-20 bg-slate-50" id="blog">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-extrabold text-orange uppercase tracking-widest font-mono">Blog & Recursos</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
              Recursos y Consejos de Gestión Hotelera
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Aprende de los expertos cómo optimizar tu resort, reducir comisiones y ofrecer una experiencia premium.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {blogPosts.map((post, i) => (
              <div key={i} className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                  <div className="p-5 space-y-2.5">
                    <div className="flex justify-between text-[10px] font-bold text-forest uppercase font-mono">
                      <span>{post.category}</span>
                      <span className="text-slate-400">{post.date}</span>
                    </div>
                    <h3 className="font-display font-bold text-base text-slate-900 leading-snug">{post.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{post.excerpt}</p>
                  </div>
                </div>
                <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                  <span className="text-xs font-bold text-forest flex items-center gap-1 hover:underline cursor-pointer">
                    <span>Leer artículo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 max-w-4xl mx-auto px-6" id="faq">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-extrabold text-orange uppercase tracking-widest font-mono">Preguntas Frecuentes</span>
          <h2 className="font-display font-black text-3xl text-slate-900 leading-tight">
            ¿Tienes dudas? Te las respondemos
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left font-bold text-sm text-slate-800 hover:text-forest transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <HelpCircle className={`w-4 h-4 shrink-0 transition-transform text-slate-400 ${isOpen ? 'rotate-180 text-forest' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-50 pt-3 bg-[#fafbfa]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Demo Form Section (MÓDULO 3) */}
      <section className="py-20 bg-[#07140e] text-white relative overflow-hidden" id="demo">
        <div className="absolute inset-0 bg-forest/5 opacity-50 blur-3xl transform rotate-12"></div>
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 relative z-10 items-center">
          <div className="space-y-6 text-left">
            <span className="text-xs font-extrabold text-orange uppercase tracking-widest font-mono">Solicita una Demo</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
              Prueba StayFlow SaaS gratis por 14 días
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Completa el formulario para agendar una sesión guiada de 15 minutos o recibir un enlace para crear tu propio tenant de inmediato. No requerimos tarjeta de crédito.
            </p>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex gap-2 items-center">
                <CheckCircle className="w-4 h-4 text-orange" />
                <span>Creación automática de tu ambiente PMS al ser aprobado.</span>
              </div>
              <div className="flex gap-2 items-center">
                <CheckCircle className="w-4 h-4 text-orange" />
                <span>Asistente de onboarding de 8 pasos para una configuración veloz.</span>
              </div>
              <div className="flex gap-2 items-center">
                <CheckCircle className="w-4 h-4 text-orange" />
                <span>Soporte prioritario para la carga inicial de tus alojamientos.</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 text-left">
            {success ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-orange/10 text-orange rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="font-display font-black text-xl text-white">¡Solicitud recibida!</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Hemos registrado tus datos correctamente. Nuestro equipo se contactará por email o WhatsApp para agendar tu demo y habilitar tu nuevo tenant.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Empresa / Alojamiento</label>
                    <input 
                      type="text" 
                      name="companyName"
                      required
                      placeholder="Ej: Altos de la Patagonia"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:border-forest text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre de contacto</label>
                    <input 
                      type="text" 
                      name="contactName"
                      required
                      placeholder="Ej: Marcelo Gómez"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:border-forest text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="Ej: marcelo@correo.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:border-forest text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Móvil</label>
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      placeholder="Ej: +5492945551234"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:border-forest text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3.5">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">País</label>
                    <input 
                      type="text" 
                      name="country"
                      required
                      placeholder="Argentina"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:border-forest text-white"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo Establecimiento</label>
                    <select 
                      name="accommodationType"
                      value={formData.accommodationType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:border-forest"
                    >
                      <option value="CABIN">Cabañas</option>
                      <option value="GLAMPING">Glamping</option>
                      <option value="HOTEL">Hotel</option>
                      <option value="HOSTEL">Hostel</option>
                      <option value="OTHER">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Habitaciones</label>
                    <input 
                      type="number" 
                      name="roomCount"
                      required
                      min={1}
                      placeholder="12"
                      value={formData.roomCount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:border-forest text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Mensaje (Opcional)</label>
                  <textarea 
                    name="message"
                    rows={2}
                    placeholder="Cuéntanos un poco sobre tu complejo..."
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:border-forest text-white"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[44px] bg-orange hover:bg-orange/90 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando solicitud...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Solicitar Demo y Enviar</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="grid w-6 h-6 place-content-center rounded bg-forest text-white">
              <Sparkles className="w-3" />
            </span>
            <span className="font-display font-black text-sm text-slate-200">StayFlow SaaS Platform</span>
          </div>
          <p>© 2026 StayFlow Commercial Platform. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
