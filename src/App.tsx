import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  MapPin, 
  Trees, 
  ShieldCheck, 
  Leaf, 
  Heart, 
  MessageCircle, 
  Star, 
  CalendarDays, 
  LockKeyhole, 
  X, 
  BadgePercent,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Send,
  Loader2
} from 'lucide-react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CabinCard } from './components/CabinCard';
import { CabinDetailModal } from './components/CabinDetailModal';
import { PaymentModal } from './components/PaymentModal';
import { AdminPanel } from './components/AdminPanel';
import { Activities } from './components/Activities';
import { Location } from './components/Location';
import { Cabin, Booking, AppSettings } from './types';

export default function App() {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedCabinId, setSelectedCabinId] = useState<number | null>(null);
  
  // Filters
  const [cabinFilter, setCabinFilter] = useState<string>('all');

  // Booking Form State
  const [formCabinId, setFormCabinId] = useState<number>(1);
  const [formCheckIn, setFormCheckIn] = useState<string>('');
  const [formCheckOut, setFormCheckOut] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formGuestsCount, setFormGuestsCount] = useState<number>(2);
  const [formNotice, setFormNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);

  // Instant Checkout Payment State
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState<boolean>(false);
  const [activePaymentModal, setActivePaymentModal] = useState<boolean>(false);

  // Admin states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('refugio_admin_token') === 'fake-admin-token-1234';
  });
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminLoginError, setAdminLoginError] = useState<string>('');

  // Toast System
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  // Fetch Cabins, Bookings and Settings
  const fetchData = async () => {
    try {
      const cabinsRes = await fetch('/api/cabins');
      if (cabinsRes.ok) {
        const cabinsData = await cabinsRes.json();
        setCabins(cabinsData);
        if (cabinsData.length > 0) {
          setFormCabinId(cabinsData[0].id);
        }
      }

      const bookingsRes = await fetch('/api/bookings');
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }

      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (err) {
      console.error('Error fetching data from API:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Setup standard real-time polling to keep data synchronized seamlessly
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Date converters
  const getTodayISO = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getMinCheckOut = () => {
    if (!formCheckIn) return getTodayISO();
    const date = new Date(formCheckIn + 'T12:00:00');
    date.setDate(date.getDate() + 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Get total nights calculation
  const getNights = () => {
    if (!formCheckIn || !formCheckOut) return 0;
    const start = new Date(formCheckIn + 'T12:00:00');
    const end = new Date(formCheckOut + 'T12:00:00');
    const diff = end.getTime() - start.getTime();
    return Math.max(0, Math.round(diff / 86400000));
  };

  const getEstimatedPrice = () => {
    const cabin = cabins.find(c => c.id === formCabinId);
    if (!cabin) return 0;
    const effectivePrice = Math.round(cabin.price * (1 - (cabin.discount || 0) / 100));
    return effectivePrice * getNights();
  };

  // WhatsApp redirection
  const handleOpenWhatsApp = () => {
    const number = settings?.whatsapp || "5492945550138";
    const appName = settings?.appName || "Refugio Nativo";
    const message = encodeURIComponent(`Hola ${appName}, quisiera consultar disponibilidad de alojamiento.`);
    window.open(`https://wa.me/${number}?text=${message}`, "_blank", "noopener noreferrer");
  };

  const handleUpdateSettings = async (updatedSettings: Partial<AppSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
          triggerToast('Ajustes guardados correctamente');
        }
      } else {
        throw new Error('Error al guardar ajustes');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  };

  // Filter Cabins
  const filteredCabins = cabins.filter(c => {
    if (cabinFilter === 'offer') return (c.discount || 0) > 0 || c.offer;
    if (cabinFilter === 'couples') return c.category === 'couples';
    if (cabinFilter === 'family') return c.category === 'family';
    return true;
  });

  const featuredCabin = cabins.find(c => (c.discount || 0) > 0) || cabins[0];

  // Client Submit Booking Flow
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormNotice(null);

    if (!formCheckIn || !formCheckOut) {
      setFormNotice({ message: 'Por favor completa las fechas de llegada y salida.', type: 'error' });
      return;
    }

    if (new Date(formCheckOut) <= new Date(formCheckIn)) {
      setFormNotice({ message: 'La fecha de salida debe ser posterior a la fecha de llegada.', type: 'error' });
      return;
    }

    if (formCheckIn < getTodayISO()) {
      setFormNotice({ message: 'La fecha de llegada no puede ser anterior a hoy.', type: 'error' });
      return;
    }

    const cabin = cabins.find(c => c.id === formCabinId);
    if (cabin && formGuestsCount > cabin.capacity) {
      setFormNotice({ message: `La capacidad máxima de la cabaña es de ${cabin.capacity} huéspedes.`, type: 'error' });
      return;
    }

    // Check conflict locally before sending
    const conflict = bookings.some(b => {
      if (b.cabinId !== formCabinId || b.status === 'cancelled') return false;
      const start = new Date(formCheckIn + 'T12:00:00');
      const end = new Date(formCheckOut + 'T12:00:00');
      const bStart = new Date(b.checkIn + 'T12:00:00');
      const bEnd = new Date(b.checkOut + 'T12:00:00');
      return start < bEnd && end > bStart;
    });

    if (conflict) {
      setFormNotice({ message: 'Las fechas seleccionadas ya están reservadas. Intenta con otro rango de fechas.', type: 'error' });
      return;
    }

    // Form is fully validated! Open checkout confirmation modal
    setShowCheckoutConfirm(true);
  };

  const createBooking = async (paymentMethod?: string) => {
    setIsSubmittingBooking(true);
    setFormNotice(null);
    try {
      const payload = {
        cabinId: formCabinId,
        name: formName,
        phone: formPhone,
        email: formEmail,
        guests: formGuestsCount,
        checkIn: formCheckIn,
        checkOut: formCheckOut,
        paymentMethod
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setFormNotice({ 
          message: paymentMethod 
            ? '¡Reserva confirmada con éxito! Tu pago ha sido procesado de manera segura. Te esperamos.' 
            : '¡Solicitud de reserva enviada! Ha quedado registrada como pendiente. Nos comunicaremos contigo para coordinar el pago y confirmar.', 
          type: 'success' 
        });
        
        // Reset form fields
        setFormName('');
        setFormPhone('');
        setFormEmail('');
        setFormCheckIn('');
        setFormCheckOut('');
        setFormGuestsCount(2);

        triggerToast(paymentMethod ? 'Reserva pagada y confirmada' : 'Solicitud de reserva enviada');
        fetchData();
      } else {
        setFormNotice({ message: data.error || 'Ocurrió un error al procesar la reserva.', type: 'error' });
      }
    } catch (err) {
      setFormNotice({ message: 'Error de conexión con el servidor. Inténtalo nuevamente.', type: 'error' });
    } finally {
      setIsSubmittingBooking(false);
      setShowCheckoutConfirm(false);
      setActivePaymentModal(false);
    }
  };

  // Secure instant checkout success handler
  const handlePaymentSuccess = (paymentMethod: string) => {
    createBooking(paymentMethod);
  };

  // Admin login flow
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('refugio_admin_token', data.token);
        setIsAdminAuthenticated(true);
        setShowAdminLogin(false);
        setAdminPin('');
        setActivePage('admin');
        triggerToast('Sesión administrativa iniciada');
      } else {
        setAdminLoginError(data.error || 'Código incorrecto.');
      }
    } catch (err) {
      setAdminLoginError('Error de conexión.');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('refugio_admin_token');
    setIsAdminAuthenticated(false);
    setActivePage('home');
    triggerToast('Sesión cerrada');
  };

  // Admin Update Cabin details
  const handleUpdateCabin = async (id: number, updatedFields: Partial<Cabin>) => {
    try {
      const res = await fetch(`/api/cabins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        triggerToast('Cabaña actualizada correctamente');
        fetchData();
      } else {
        triggerToast('Error al actualizar cabaña');
      }
    } catch (err) {
      triggerToast('Error de conexión');
    }
  };

  // Admin Update Booking status
  const handleUpdateBookingStatus = async (id: number, status: 'confirmed' | 'cancelled') => {
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(status === 'confirmed' ? 'Reserva confirmada con éxito' : 'Reserva cancelada');
        fetchData();
      } else {
        triggerToast(data.error || 'Error al cambiar estado');
      }
    } catch (err) {
      triggerToast('Error de conexión');
    }
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[480px] overflow-hidden bg-cream md:border-[9px] md:border-[#1a211e] md:rounded-[42px] md:my-7 app-shell">
      
      <Header 
        settings={settings}
        onNavigate={setActivePage}
        onOpenWhatsApp={handleOpenWhatsApp}
        onOpenAdminLogin={() => setShowAdminLogin(true)}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      <main className="min-h-[calc(100vh-76px)]">
        
        {/* Page 1: Home View */}
        {activePage === 'home' && (
          <div className="animate-fade-in duration-200">
            <div className="relative min-h-[525px] overflow-hidden bg-forest hero">
              <img 
                src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=88" 
                alt="Refugio Nativo" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-10 flex min-h-[525px] flex-col justify-end p-6 pb-9 text-white">
                <span className="inline-flex items-center gap-1.5 w-max rounded-full border border-white/35 bg-[#0e231a]/34 px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase backdrop-blur-md mb-3">
                  <MapPin className="w-3.5 h-3.5 text-orange" />
                  Valle del Bosque
                </span>
                <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight leading-none mb-3">
                  Tu refugio comienza aquí.
                </h1>
                <p className="text-white/84 text-sm leading-relaxed max-w-[365px] mb-6">
                  Seis cabañas únicas para descansar, respirar aire puro y volver a conectar con lo esencial.
                </p>
                <button 
                  onClick={() => setActivePage('cabins')}
                  className="w-full sm:w-auto inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white text-forest hover:bg-slate-100 font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>Explorar cabañas</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Quick sections navigation */}
            <div className="relative z-20 px-4 -mt-6">
              <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-[23px] border border-forest/8 bg-white shadow-xl">
                <button 
                  onClick={() => setActivePage('cabins')}
                  className="flex flex-col items-center justify-center py-3 rounded-2xl text-center text-ink hover:text-forest hover:bg-sage transition-all active:scale-95 cursor-pointer"
                >
                  <span className="grid w-9 h-9 place-content-center bg-sage text-forest rounded-xl mb-1.5">
                    <Trees className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-extrabold leading-tight">Cabañas</span>
                </button>

                <button 
                  onClick={() => setActivePage('booking')}
                  className="flex flex-col items-center justify-center py-3 rounded-2xl text-center text-ink hover:text-forest hover:bg-sage transition-all active:scale-95 cursor-pointer"
                >
                  <span className="grid w-9 h-9 place-content-center bg-sage text-forest rounded-xl mb-1.5">
                    <CalendarDays className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-extrabold leading-tight">Reservas</span>
                </button>

                <button 
                  onClick={handleOpenWhatsApp}
                  className="flex flex-col items-center justify-center py-3 rounded-2xl text-center text-ink hover:text-forest hover:bg-sage transition-all active:scale-95 cursor-pointer"
                >
                  <span className="grid w-9 h-9 place-content-center bg-sage text-forest rounded-xl mb-1.5">
                    <MessageCircle className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-extrabold leading-tight">WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Featured cabin card */}
            {featuredCabin && (
              <div className="px-4 py-8">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="font-display font-extrabold text-2xl text-ink">Cabaña Recomendada</h2>
                    <p className="text-muted text-xs leading-none mt-1">La favorita de nuestros huéspedes actuales</p>
                  </div>
                  <button 
                    onClick={() => setActivePage('cabins')}
                    className="text-xs font-bold text-forest hover:underline"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="overflow-hidden rounded-[23px] bg-white border border-line shadow-sm">
                  <img 
                    src={featuredCabin.image} 
                    alt={featuredCabin.name} 
                    className="w-full h-[205px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80';
                    }}
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-display font-extrabold text-xl text-ink leading-tight">{featuredCabin.name}</h3>
                      <span className="flex items-center gap-1 text-warning font-extrabold text-xs">
                        <Star className="w-3.5 h-3.5 fill-warning" />
                        {featuredCabin.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-muted text-xs leading-relaxed mb-4">{featuredCabin.description}</p>
                    <div className="flex justify-between items-center border-t border-line/60 pt-3">
                      <div className="flex flex-col">
                        <span className="font-display font-extrabold text-lg text-forest">
                          {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Math.round(featuredCabin.price * (1 - (featuredCabin.discount || 0) / 100)))}
                        </span>
                        <span className="text-[10px] text-muted">por noche</span>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedCabinId(featuredCabin.id);
                        }}
                        className="inline-flex min-h-[38px] items-center justify-center rounded-xl bg-forest hover:bg-forest-hover px-4 text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trust strips */}
            <div className="grid grid-cols-3 gap-2 px-4 pb-12">
              <div className="flex flex-col items-center justify-center p-3.5 border border-line rounded-2xl bg-white text-center">
                <ShieldCheck className="w-5 h-5 text-orange mb-1.5" />
                <strong className="text-[11px] text-ink block leading-tight font-bold">Reserva segura</strong>
              </div>
              <div className="flex flex-col items-center justify-center p-3.5 border border-line rounded-2xl bg-white text-center">
                <Leaf className="w-5 h-5 text-orange mb-1.5" />
                <strong className="text-[11px] text-ink block leading-tight font-bold">Entorno natural</strong>
              </div>
              <div className="flex flex-col items-center justify-center p-3.5 border border-line rounded-2xl bg-white text-center">
                <Heart className="w-5 h-5 text-orange mb-1.5" />
                <strong className="text-[11px] text-ink block leading-tight font-bold">Atención única</strong>
              </div>
            </div>
          </div>
        )}

        {/* Page 2: Cabins Directory */}
        {activePage === 'cabins' && (
          <div className="animate-fade-in duration-200 pb-28">
            <div className="px-5 py-6">
              <h1 className="font-display font-extrabold text-3xl text-ink">Nuestras cabañas</h1>
              <p className="text-muted text-sm mt-1 leading-relaxed">Seis refugios independientes completamente equipados en medio del bosque nativo.</p>
            </div>

            {/* Filter Slider Row */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar">
              <button 
                onClick={() => setCabinFilter('all')}
                className={`flex-none min-h-[38px] px-4 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  cabinFilter === 'all' 
                    ? 'border-forest bg-forest text-white' 
                    : 'border-line bg-white text-muted hover:border-forest hover:text-forest'
                }`}
              >
                Todas
              </button>
              <button 
                onClick={() => setCabinFilter('offer')}
                className={`flex-none min-h-[38px] px-4 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  cabinFilter === 'offer' 
                    ? 'border-forest bg-forest text-white' 
                    : 'border-line bg-white text-muted hover:border-forest hover:text-forest'
                }`}
              >
                Con oferta
              </button>
              <button 
                onClick={() => setCabinFilter('couples')}
                className={`flex-none min-h-[38px] px-4 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  cabinFilter === 'couples' 
                    ? 'border-forest bg-forest text-white' 
                    : 'border-line bg-white text-muted hover:border-forest hover:text-forest'
                }`}
              >
                Parejas
              </button>
              <button 
                onClick={() => setCabinFilter('family')}
                className={`flex-none min-h-[38px] px-4 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  cabinFilter === 'family' 
                    ? 'border-forest bg-forest text-white' 
                    : 'border-line bg-white text-muted hover:border-forest hover:text-forest'
                }`}
              >
                Familias
              </button>
            </div>

            {/* Cabins listing grid */}
            <div className="grid grid-cols-2 gap-3.5 px-4">
              {filteredCabins.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-muted text-sm">
                  No se encontraron cabañas con este filtro.
                </div>
              ) : (
                filteredCabins.map(cabin => (
                  <CabinCard 
                    key={cabin.id}
                    cabin={cabin}
                    onOpen={setSelectedCabinId}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Page 3: Booking Form */}
        {activePage === 'booking' && (
          <div className="animate-fade-in duration-200 pb-28">
            <div className="px-5 py-6">
              <h1 className="font-display font-extrabold text-3xl text-ink">Reservar estadía</h1>
              <p className="text-muted text-sm mt-1 leading-relaxed">Elige tu cabaña y las fechas deseadas. Tu experiencia patagónica comienza aquí.</p>
            </div>

            <form onSubmit={handleBookingSubmit} className="mx-4 p-5 border border-line rounded-[23px] bg-white shadow-sm space-y-4">
              <h2 className="font-display font-extrabold text-lg text-ink">Consulta de disponibilidad</h2>
              <p className="text-xs text-muted">Completa los campos para simular disponibilidad y realizar la reserva en tiempo real.</p>
              
              {formNotice && (
                <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                  formNotice.type === 'success' 
                    ? 'bg-success/10 border border-success/25 text-success-800' 
                    : 'bg-danger/10 border border-danger/25 text-danger-800'
                }`}>
                  <strong>{formNotice.type === 'success' ? 'Éxito: ' : 'Atención: '}</strong>
                  {formNotice.message}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Cabaña de preferencia</label>
                <select 
                  value={formCabinId}
                  onChange={(e) => setFormCabinId(Number(e.target.value))}
                  className="w-full min-h-[48px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  required
                >
                  {cabins.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Math.round(c.price * (1 - (c.discount || 0) / 100)))} / noche
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Fecha de llegada</label>
                  <input 
                    type="date"
                    value={formCheckIn}
                    min={getTodayISO()}
                    onChange={(e) => {
                      setFormCheckIn(e.target.value);
                      setFormCheckOut('');
                    }}
                    className="w-full min-h-[48px] rounded-xl border border-line px-3 py-2 text-xs bg-white outline-none focus:border-forest"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Fecha de salida</label>
                  <input 
                    type="date"
                    value={formCheckOut}
                    min={getMinCheckOut()}
                    onChange={(e) => setFormCheckOut(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-line px-3 py-2 text-xs bg-white outline-none focus:border-forest"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Nombre y apellido</label>
                  <input 
                    type="text"
                    placeholder="Ej: Sofía Martínez"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Teléfono móvil</label>
                  <input 
                    type="tel"
                    placeholder="Ej: +54 9 11 1234 5678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Correo electrónico</label>
                <input 
                  type="email"
                  placeholder="Ej: sofia@correo.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full min-h-[48px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Cantidad de huéspedes</label>
                <select
                  value={formGuestsCount}
                  onChange={(e) => setFormGuestsCount(Number(e.target.value))}
                  className="w-full min-h-[48px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                >
                  <option value={1}>1 persona</option>
                  <option value={2}>2 personas</option>
                  <option value={3}>3 personas</option>
                  <option value={4}>4 personas</option>
                  <option value={5}>5 personas</option>
                  <option value={6}>6 personas</option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-sage/80 p-4 text-forest">
                <span className="text-xs font-bold">Total Estimado ({getNights()} {getNights() === 1 ? 'noche' : 'noches'})</span>
                <strong className="font-display font-extrabold text-xl">
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(getEstimatedPrice())}
                </strong>
              </div>

              <button
                type="submit"
                disabled={isSubmittingBooking}
                className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-2xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmittingBooking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Solicitar reserva
                  </>
                )}
              </button>
            </form>

            <div className="mx-4 p-5 border border-line rounded-[23px] bg-white shadow-sm mt-5 text-center">
              <h3 className="font-display font-bold text-lg text-ink mb-1">¿Prefieres consultarnos?</h3>
              <p className="text-muted text-xs leading-relaxed mb-4">Escríbenos directamente por WhatsApp para recibir atención personalizada o responder dudas específicas.</p>
              <button 
                onClick={handleOpenWhatsApp}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#20a95a] text-white font-bold text-sm shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Escribir por WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* Page 4: Activities (rendered modularly) */}
        {activePage === 'activities' && <Activities />}

        {/* Page 5: Location Map (rendered modularly) */}
        {activePage === 'location' && <Location settings={settings} />}

        {/* Page 6: Admin Panel (requires Auth) */}
        {activePage === 'admin' && isAdminAuthenticated && (
          <AdminPanel 
            cabins={cabins}
            bookings={bookings}
            settings={settings}
            onUpdateCabin={handleUpdateCabin}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onUpdateSettings={handleUpdateSettings}
            onLogout={handleAdminLogout}
          />
        )}

      </main>

      <BottomNav activePage={activePage} onNavigate={setActivePage} />

      {/* Global Cabin details popup */}
      {selectedCabinId !== null && (
        <CabinDetailModal 
          cabin={cabins.find(c => c.id === selectedCabinId) || null}
          onClose={() => setSelectedCabinId(null)}
          onBook={(cabinId) => {
            setSelectedCabinId(null);
            setFormCabinId(cabinId);
            setActivePage('booking');
          }}
        />
      )}

      {/* Booking Payment Checkout Choice Option Modal */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#07140e]/58 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-3xl bg-cream shadow-2xl p-6 border border-line space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-extrabold text-xl text-forest">Confirmar solicitud</h3>
              <button 
                onClick={() => setShowCheckoutConfirm(false)}
                className="grid w-8 h-8 place-content-center bg-white border border-line rounded-full cursor-pointer hover:bg-slate-50 text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-muted text-xs leading-relaxed">
              Para garantizar tu estadía y bloquear las fechas elegidas en tiempo real en la plataforma, te sugerimos realizar el pago ahora con nuestra pasarela segura.
            </p>

            <div className="bg-white border border-line rounded-2xl p-3.5 space-y-1.5 text-xs text-ink">
              <div>Cabaña: <span className="font-bold">{cabins.find(c => c.id === formCabinId)?.name}</span></div>
              <div>Estadía: <span className="font-bold">{formCheckIn} al {formCheckOut} ({getNights()} {getNights() === 1 ? 'noche' : 'noches'})</span></div>
              <div>Huéspedes: <span className="font-bold">{formGuestsCount} personas</span></div>
              <div className="text-forest font-bold text-sm pt-2 border-t border-line/50 mt-1.5 flex justify-between">
                <span>Total a pagar</span>
                <span>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(getEstimatedPrice())}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCheckoutConfirm(false);
                  setActivePaymentModal(true);
                }}
                className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-2xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pagar Online y Confirmar Ya</span>
              </button>
              
              <button
                type="button"
                onClick={() => createBooking()}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-1 rounded-2xl bg-white border border-line text-ink hover:bg-slate-50 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>Enviar solicitud sin pagar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secure card checkout modal */}
      {activePaymentModal && cabins.find(c => c.id === formCabinId) && (
        <PaymentModal 
          cabin={cabins.find(c => c.id === formCabinId)!}
          nights={getNights()}
          checkIn={formCheckIn}
          checkOut={formCheckOut}
          guestName={formName}
          guestPhone={formPhone}
          guestsCount={formGuestsCount}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setActivePaymentModal(false)}
        />
      )}

      {/* Admin PIN authentication modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#07140e]/58 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-3xl bg-cream shadow-2xl p-6 border border-line">
            <div className="flex justify-between items-start mb-2">
              <span className="grid w-10 h-10 place-content-center bg-forest text-white rounded-xl">
                <LockKeyhole className="w-5 h-5 text-gold" />
              </span>
              <button 
                onClick={() => {
                  setShowAdminLogin(false);
                  setAdminPin('');
                  setAdminLoginError('');
                }}
                className="grid w-8 h-8 place-content-center bg-white border border-line rounded-full cursor-pointer hover:bg-slate-50 text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2 className="font-display font-extrabold text-2xl text-ink mt-2">Acceso Administrador</h2>
            <p className="text-muted text-xs leading-relaxed mt-1 mb-4">Ingresa el código PIN para acceder a la administración de cabañas, precios y reservas en tiempo real.</p>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Código PIN</label>
                <input 
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full min-h-[48px] rounded-xl border border-line px-3.5 py-2 text-center text-lg tracking-[8px] bg-white outline-none focus:border-forest"
                  required
                />
                <span className="block text-[10px] text-muted mt-2">Código PIN de demostración: <strong className="text-forest font-bold">1234</strong></span>
              </div>

              {adminLoginError && (
                <div className="bg-danger/10 border border-danger/20 text-danger text-xs px-3 py-2 rounded-xl">
                  {adminLoginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] inline-flex items-center justify-center rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Ingresar al Panel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast Alert */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-110 w-[calc(100%-32px)] max-w-[430px] rounded-xl bg-forest text-white p-3.5 text-xs font-bold shadow-2xl transition-all duration-300 flex items-center gap-2.5 ${
        showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'
      }`}>
        <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
        <span>{toastMessage}</span>
      </div>

    </div>
  );
}
