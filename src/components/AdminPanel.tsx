import React, { useState } from 'react';
import { Calendar as CalendarIcon, House, FileText, ChevronDown, ChevronUp, Save, CheckCircle, XCircle, Sliders, Trees, Tent, Mountain, Palmtree, Compass, TreePine } from 'lucide-react';
import { Cabin, Booking, AppSettings } from '../types';
import { Calendar } from './Calendar';

interface AdminPanelProps {
  cabins: Cabin[];
  bookings: Booking[];
  settings: AppSettings | null;
  onUpdateCabin: (id: number, updatedData: Partial<Cabin>) => Promise<void>;
  onUpdateBookingStatus: (id: number, status: 'confirmed' | 'cancelled') => Promise<void>;
  onUpdateSettings: (updatedData: Partial<AppSettings>) => Promise<void>;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  cabins,
  bookings,
  settings,
  onUpdateCabin,
  onUpdateBookingStatus,
  onUpdateSettings,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'cabins' | 'calendar' | 'bookings' | 'settings'>('cabins');
  const [openCabinId, setOpenCabinId] = useState<number | null>(null);
  const [selectedCalendarCabinId, setSelectedCalendarCabinId] = useState<number>(() => cabins[0]?.id || 1);

  // Sorting bookings to show latest first
  const sortedBookings = [...bookings].sort((a, b) => b.id - a.id);

  // State for cabins forms
  const [editingCabins, setEditingCabins] = useState<Record<number, Partial<Cabin>>>({});

  // State for Settings form
  const [editingSettings, setEditingSettings] = useState<AppSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    if (settings) {
      setEditingSettings(settings);
    }
  }, [settings]);

  const handleSettingsFieldChange = (field: keyof AppSettings, value: string) => {
    if (!editingSettings) return;
    setEditingSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSettings) return;
    setSaveStatus('saving');
    try {
      await onUpdateSettings(editingSettings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleFieldChange = (cabinId: number, field: keyof Cabin, value: any) => {
    setEditingCabins(prev => ({
      ...prev,
      [cabinId]: {
        ...prev[cabinId],
        [field]: value
      }
    }));
  };

  const handleSaveCabin = async (e: React.FormEvent, cabinId: number) => {
    e.preventDefault();
    const updatedFields = editingCabins[cabinId] || {};
    await onUpdateCabin(cabinId, updatedFields);
    // Remove from editing dictionary
    const copy = { ...editingCabins };
    delete copy[cabinId];
    setEditingCabins(copy);
    setOpenCabinId(null);
  };

  return (
    <div className="px-4 pb-28">
      <div className="flex justify-between items-center mb-5 border-b border-line pb-3.5 mt-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-ink">Panel de Control</h1>
          <p className="text-xs text-muted">Gestión de cabañas, disponibilidad y reservas en tiempo real.</p>
        </div>
        <button 
          onClick={onLogout}
          className="bg-danger/10 hover:bg-danger/15 text-danger font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          Salir
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 mb-6">
        <button
          onClick={() => setActiveTab('cabins')}
          className={`flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cabins' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <House className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cabañas</span>
          <span className="sm:hidden">Cab.</span>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'calendar' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Calendario</span>
          <span className="sm:hidden">Cal.</span>
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'bookings' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reservas</span>
          <span className="sm:hidden">Res.</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'settings' ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ajustes</span>
          <span className="sm:hidden">Aju.</span>
        </button>
      </div>

      {/* Tab 1: Cabins Manager */}
      {activeTab === 'cabins' && (
        <div className="space-y-4">
          {cabins.map((cabin) => {
            const isOpen = openCabinId === cabin.id;
            const currentEdit = editingCabins[cabin.id] || {};
            const finalFields = { ...cabin, ...currentEdit };

            return (
              <div 
                key={cabin.id}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all"
              >
                {/* Header accordion */}
                <div 
                  onClick={() => setOpenCabinId(isOpen ? null : cabin.id)}
                  className="flex items-center gap-3.5 p-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <img 
                    src={cabin.image} 
                    alt={cabin.name}
                    className="w-[62px] h-[55px] object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <strong className="block text-sm font-bold text-ink truncate">{cabin.name}</strong>
                    <small className="block text-xs text-muted mt-1">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cabin.price)} / noche
                      {cabin.discount > 0 && ` · ${cabin.discount}% desc`}
                    </small>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                </div>

                {/* Form Editor content */}
                {isOpen && (
                  <form onSubmit={(e) => handleSaveCabin(e, cabin.id)} className="p-4 border-t border-line/60 bg-[#fafbf9] space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Nombre de la Cabaña</label>
                      <input 
                        type="text"
                        value={finalFields.name}
                        onChange={(e) => handleFieldChange(cabin.id, 'name', e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">URL de Imagen</label>
                      <input 
                        type="url"
                        value={finalFields.image}
                        onChange={(e) => handleFieldChange(cabin.id, 'image', e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Descripción</label>
                      <textarea 
                        value={finalFields.description}
                        onChange={(e) => handleFieldChange(cabin.id, 'description', e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest resize-y"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Precio base por noche</label>
                        <input 
                          type="number"
                          value={finalFields.price}
                          min={0}
                          onChange={(e) => handleFieldChange(cabin.id, 'price', Number(e.target.value))}
                          className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Descuento (%)</label>
                        <input 
                          type="number"
                          value={finalFields.discount}
                          min={0}
                          max={100}
                          onChange={(e) => handleFieldChange(cabin.id, 'discount', Number(e.target.value))}
                          className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Texto de Oferta / Promoción</label>
                      <input 
                        type="text"
                        value={finalFields.offer}
                        placeholder="Ej: Escapada de fin de semana"
                        onChange={(e) => handleFieldChange(cabin.id, 'offer', e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Tipo / Categoría</label>
                        <select 
                          value={finalFields.category}
                          onChange={(e) => handleFieldChange(cabin.id, 'category', e.target.value)}
                          className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                        >
                          <option value="couples">Parejas</option>
                          <option value="family">Familias</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Capacidad (huéspedes)</label>
                        <input 
                          type="number"
                          value={finalFields.capacity}
                          min={1}
                          max={10}
                          onChange={(e) => handleFieldChange(cabin.id, 'capacity', Number(e.target.value))}
                          className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Guardar Cabaña
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Calendar Visualization */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink mb-2">Seleccionar Cabaña a Visualizar</label>
            <select
              value={selectedCalendarCabinId}
              onChange={(e) => setSelectedCalendarCabinId(Number(e.target.value))}
              className="w-full min-h-[48px] rounded-xl border border-line px-3.5 py-2 text-sm bg-white outline-none focus:border-forest"
            >
              {cabins.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Calendar cabinId={selectedCalendarCabinId} bookings={bookings} />
        </div>
      )}

      {/* Tab 3: Reservations Feed */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {sortedBookings.length === 0 ? (
            <div className="text-center text-muted text-sm py-12 bg-white rounded-2xl border border-line">
              No hay solicitudes de reservas registradas.
            </div>
          ) : (
            sortedBookings.map((booking) => {
              const cabin = cabins.find(c => c.id === booking.cabinId);
              
              const checkInDate = new Date(booking.checkIn + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
              const checkOutDate = new Date(booking.checkOut + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

              const statusLabels: Record<string, string> = {
                pending: "Pendiente",
                confirmed: "Confirmada",
                cancelled: "Cancelada"
              };

              const statusColors: Record<string, string> = {
                pending: "bg-warning/25 text-amber-800",
                confirmed: "bg-success/20 text-emerald-800",
                cancelled: "bg-danger/15 text-red-800"
              };

              return (
                <article key={booking.id} className="p-4 border border-line rounded-2xl bg-white shadow-xs">
                  <div className="flex justify-between items-start gap-2 border-b border-line/60 pb-2 mb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-ink">{booking.name}</h4>
                      <p className="text-[11px] text-muted font-medium mt-0.5">{booking.phone} {booking.email ? `· ${booking.email}` : ''}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${statusColors[booking.status] || ''}`}>
                      {statusLabels[booking.status] || booking.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#3d4842] space-y-1">
                    <div>Cabaña: <span className="font-semibold text-ink">{cabin?.name || 'Cabaña'}</span></div>
                    <div>Estadía: <span className="font-semibold text-ink">{checkInDate} al {checkOutDate}</span></div>
                    <div>Huéspedes: <span className="font-semibold text-ink">{booking.guests} personas</span></div>
                    {booking.paymentMethod && (
                      <div className="flex items-center gap-1.5 mt-1 text-success font-semibold text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Pago vía tarjeta ({booking.paymentMethod.toUpperCase()}) - Pagado</span>
                      </div>
                    )}
                    <div className="text-forest font-bold text-sm pt-1.5 border-t border-line/40 mt-1.5 flex justify-between">
                      <span>Total cobrado/estimado</span>
                      <span>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(booking.totalPrice)}</span>
                    </div>
                  </div>

                  {booking.status === 'pending' && (
                    <div className="flex gap-2.5 mt-3 pt-2.5 border-t border-line/50">
                      <button
                        onClick={() => onUpdateBookingStatus(booking.id, 'confirmed')}
                        className="flex-1 min-h-[36px] inline-flex items-center justify-center gap-1 rounded-xl bg-success text-white font-bold text-[10px] uppercase tracking-wide cursor-pointer hover:bg-emerald-700 transition-all active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirmar</span>
                      </button>
                      <button
                        onClick={() => onUpdateBookingStatus(booking.id, 'cancelled')}
                        className="flex-1 min-h-[36px] inline-flex items-center justify-center gap-1 rounded-xl bg-danger/10 text-danger hover:bg-danger/15 font-bold text-[10px] uppercase tracking-wide cursor-pointer transition-all active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  )}

                  {booking.status === 'confirmed' && (
                    <div className="mt-3 pt-2.5 border-t border-line/50">
                      <button
                        onClick={() => onUpdateBookingStatus(booking.id, 'cancelled')}
                        className="w-full min-h-[36px] inline-flex items-center justify-center gap-1 rounded-xl bg-danger/10 text-danger hover:bg-danger/15 font-bold text-[10px] uppercase tracking-wide cursor-pointer transition-all active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Anular / Cancelar Reserva</span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Tab 4: Configuración */}
      {activeTab === 'settings' && editingSettings && (
        <form onSubmit={handleSaveSettings} className="space-y-4 bg-white p-5 rounded-2xl border border-line shadow-sm">
          <h2 className="font-display font-bold text-lg text-ink pb-2 border-b border-line">Configuración General del Sitio</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Nombre de la Empresa</label>
              <input
                type="text"
                value={editingSettings.appName}
                onChange={(e) => handleSettingsFieldChange('appName', e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Título del Sitio (Slogan)</label>
              <input
                type="text"
                value={editingSettings.appSubtitle}
                onChange={(e) => handleSettingsFieldChange('appSubtitle', e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-2">Icono del Logo</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'trees', label: 'Arboleda', Icon: Trees },
                { id: 'tent', label: 'Carpa', Icon: Tent },
                { id: 'mountain', label: 'Montaña', Icon: Mountain },
                { id: 'palmtree', label: 'Palmera', Icon: Palmtree },
                { id: 'compass', label: 'Brújula', Icon: Compass },
                { id: 'treepine', label: 'Pino', Icon: TreePine },
              ].map((opt) => {
                const isSelected = editingSettings.logoIcon === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSettingsFieldChange('logoIcon', opt.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs gap-1 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-forest bg-forest/5 text-forest font-bold shadow-xs' 
                        : 'border-line bg-white text-muted hover:text-ink'
                    }`}
                  >
                    <opt.Icon className="w-5 h-5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Dirección Física</label>
              <input
                type="text"
                value={editingSettings.address}
                onChange={(e) => handleSettingsFieldChange('address', e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Enlace de Google Maps</label>
              <input
                type="text"
                value={editingSettings.googleMapsLink}
                onChange={(e) => handleSettingsFieldChange('googleMapsLink', e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">Detalles de Ubicación</label>
            <textarea
              value={editingSettings.locationDetails}
              onChange={(e) => handleSettingsFieldChange('locationDetails', e.target.value)}
              className="w-full min-h-[70px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest resize-y"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Horarios de Recepción</label>
              <input
                type="text"
                value={editingSettings.hours}
                onChange={(e) => handleSettingsFieldChange('hours', e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                value={editingSettings.phone}
                onChange={(e) => handleSettingsFieldChange('phone', e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Número de WhatsApp (ej: 5492945550138)</label>
              <input
                type="text"
                value={editingSettings.whatsapp}
                onChange={(e) => handleSettingsFieldChange('whatsapp', e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Correo Electrónico de Contacto</label>
              <input
                type="email"
                value={editingSettings.email}
                onChange={(e) => handleSettingsFieldChange('email', e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line px-3 py-2 text-sm bg-white outline-none focus:border-forest"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {saveStatus === 'saving' && (
                <span className="text-xs text-forest animate-pulse font-medium">Guardando ajustes...</span>
              )}
              {saveStatus === 'success' && (
                <span className="text-xs text-success font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> ¡Ajustes guardados correctamente!
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-xs text-danger font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Error al guardar ajustes. Inténtalo de nuevo.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="min-h-[44px] px-6 rounded-2xl bg-forest hover:bg-forest-hover text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
