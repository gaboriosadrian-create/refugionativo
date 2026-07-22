import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Globe, 
  Calendar, 
  Tag, 
  SlidersHorizontal, 
  Plus, 
  Edit, 
  Check, 
  X, 
  ChevronRight, 
  Merge, 
  History, 
  Search, 
  MapPin, 
  UserCheck, 
  UserX,
  AlertCircle,
  TrendingUp,
  Coins,
  Award,
  Clock,
  Heart,
  Coffee,
  Bookmark,
  Shield,
  Activity,
  Briefcase,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { useGuests } from '../contexts/GuestContext';
import { GuestProfile, GuestPreferences, GuestTimelineEvent, GuestTag } from '../types/crm';
import { Booking } from '../../../types';
import { useAccommodations } from '../../../shared/hooks/useAccommodations';
import { Logger } from '../../../core/logger/Logger';

export const GuestManagement: React.FC = () => {
  const { 
    guests, 
    loading, 
    error, 
    selectedGuestId,
    timeline,
    preferences,
    metrics,
    segments,
    loadingCrm,
    tags,
    allSegments,
    setSelectedGuestId,
    createGuest,
    updateGuest,
    mergeGuests,
    getGuestBookings,
    searchGuests,
    updatePreferences,
    addCustomTimelineEvent,
    createCustomTag,
    clearError 
  } = useGuests();

  const { accommodations: cabins } = useAccommodations();

  // Selected Tab inside selected guest CRM panel
  const [crmTab, setCrmTab] = useState<'dashboard' | 'profile' | 'preferences' | 'timeline' | 'loyalty' | 'tags'>('dashboard');

  // Search and Advanced Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Specific Filters
  const [filterFirstName, setFilterFirstName] = useState('');
  const [filterLastName, setFilterLastName] = useState('');
  const [filterDocumentNumber, setFilterDocumentNumber] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterBookingCode, setFilterBookingCode] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [localGuests, setLocalGuests] = useState<GuestProfile[]>([]);
  const [searching, setSearching] = useState(false);

  // Selected Guest general bookings list
  const [guestBookings, setGuestBookings] = useState<Booking[]>([]);

  // Edit / Creation Form States
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCountry, setFormCountry] = useState('Argentina');
  const [formNationality, setFormNationality] = useState('Argentina');
  const [formProvince, setFormProvince] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formLanguage, setFormLanguage] = useState('es');
  const [formDocumentType, setFormDocumentType] = useState('DNI');
  const [formDocumentNumber, setFormDocumentNumber] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPostalCode, setFormPostalCode] = useState('');
  const [formProfession, setFormProfession] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [localFormError, setLocalFormError] = useState<string | null>(null);

  // Merge modal states
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  // Custom Tag Creation State
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10B981');
  const [newTagDesc, setNewTagDesc] = useState('');

  // Custom Timeline Comment State
  const [customComment, setCustomComment] = useState('');
  const [customCommentType, setCustomCommentType] = useState<GuestTimelineEvent['type']>('observation');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Find selected guest details
  const selectedGuest = useMemo(() => {
    return guests.find(g => g.id === selectedGuestId) || null;
  }, [guests, selectedGuestId]);

  // Handle Search and Filter changes
  useEffect(() => {
    const applyFilters = async () => {
      setSearching(true);
      try {
        const results = await searchGuests({
          query: searchQuery,
          firstName: filterFirstName,
          lastName: filterLastName,
          documentNumber: filterDocumentNumber,
          email: filterEmail,
          phone: filterPhone,
          bookingCode: filterBookingCode,
          country: filterCountry,
          tag: filterTag,
          isActive: filterStatus === 'all' ? undefined : filterStatus === 'active'
        });
        setLocalGuests(results);
      } catch (err) {
        Logger.error('Error searching guests:', err);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(applyFilters, 300);
    return () => clearTimeout(timer);
  }, [
    guests,
    searchQuery, 
    filterFirstName, 
    filterLastName, 
    filterDocumentNumber, 
    filterEmail, 
    filterPhone,
    filterBookingCode,
    filterCountry, 
    filterTag, 
    filterStatus
  ]);

  // Load bookings for selected guest
  useEffect(() => {
    if (selectedGuestId) {
      getGuestBookings(selectedGuestId)
        .then(res => {
          const sorted = [...res].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
          setGuestBookings(sorted);
        })
        .catch(err => Logger.error('Error fetching guest bookings:', err));
    } else {
      setGuestBookings([]);
    }
  }, [selectedGuestId, guests]);

  // Loyalty Program calculation (Infra structure)
  const loyaltyDetails = useMemo(() => {
    if (!metrics) return { tier: 'Bronze', points: 0, nextTier: 'Silver', progress: 0, pointsNeeded: 100 };
    
    // 1 stay = 100 points, $10 spend = 1 point
    const points = Math.round((metrics.bookingsCount * 100) + (metrics.totalRevenue * 0.1));
    
    let tier = 'Bronze';
    let nextTier = 'Silver';
    let progress = 0;
    let pointsNeeded = 1000;

    if (points >= 5000) {
      tier = 'Platinum';
      nextTier = 'Elite';
      progress = 100;
      pointsNeeded = 0;
    } else if (points >= 2500) {
      tier = 'Gold';
      nextTier = 'Platinum';
      progress = Math.round(((points - 2500) / 2500) * 100);
      pointsNeeded = 5000 - points;
    } else if (points >= 1000) {
      tier = 'Silver';
      nextTier = 'Gold';
      progress = Math.round(((points - 1000) / 1500) * 100);
      pointsNeeded = 2500 - points;
    } else {
      tier = 'Bronze';
      nextTier = 'Silver';
      progress = Math.round((points / 1000) * 100);
      pointsNeeded = 1000 - points;
    }

    return { tier, points, nextTier, progress, pointsNeeded };
  }, [metrics]);

  // Dynamic Chart Data
  const chartData = useMemo(() => {
    if (guestBookings.length === 0) return [];
    
    // Sort chronological (oldest to newest)
    const sorted = [...guestBookings]
      .filter(b => b.status !== 'cancelled')
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

    return sorted.map((b, idx) => {
      const checkInDate = new Date(b.checkIn);
      const label = checkInDate.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      return {
        name: `Reserva ${idx + 1}`,
        fecha: label,
        monto: b.totalPrice || 0,
        noches: Math.max(1, Math.ceil((new Date(b.checkOut).getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
      };
    });
  }, [guestBookings]);

  // Fill form for editing
  const handleStartEdit = (guest: GuestProfile) => {
    setFormFirstName(guest.firstName);
    setFormLastName(guest.lastName);
    setFormEmail(guest.email);
    setFormPhone(guest.phone);
    setFormCountry(guest.country);
    setFormNationality(guest.nationality || guest.country || 'Argentina');
    setFormProvince(guest.province || '');
    setFormCity(guest.city || '');
    setFormLanguage(guest.language || 'es');
    setFormDocumentType(guest.documentType);
    setFormDocumentNumber(guest.documentNumber);
    setFormBirthDate(guest.birthDate || '');
    setFormAddress(guest.address || '');
    setFormPostalCode(guest.postalCode || '');
    setFormProfession(guest.profession || '');
    setFormNotes(guest.notes || '');
    setFormTags(guest.tags || []);
    setFormIsActive(guest.isActive);
    setLocalFormError(null);
    setIsEditing(true);
    setIsCreating(false);
  };

  // Setup form for creating
  const handleStartCreate = () => {
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormCountry('Argentina');
    setFormNationality('Argentina');
    setFormProvince('');
    setFormCity('');
    setFormLanguage('es');
    setFormDocumentType('DNI');
    setFormDocumentNumber('');
    setFormBirthDate('');
    setFormAddress('');
    setFormPostalCode('');
    setFormProfession('');
    setFormNotes('');
    setFormTags([]);
    setFormIsActive(true);
    setLocalFormError(null);
    setIsCreating(true);
    setIsEditing(false);
  };

  // Submit form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalFormError(null);

    const payload = {
      firstName: formFirstName.trim(),
      lastName: formLastName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      country: formCountry.trim(),
      nationality: formNationality.trim(),
      province: formProvince.trim(),
      city: formCity.trim(),
      language: formLanguage,
      documentType: formDocumentType,
      documentNumber: formDocumentNumber.trim(),
      birthDate: formBirthDate,
      address: formAddress.trim(),
      postalCode: formPostalCode.trim(),
      profession: formProfession.trim(),
      notes: formNotes.trim(),
      tags: formTags,
      isActive: formIsActive
    };

    try {
      if (isEditing && selectedGuestId) {
        await updateGuest(selectedGuestId, payload);
        setIsEditing(false);
      } else {
        const created = await createGuest(payload);
        setSelectedGuestId(created.id);
        setIsCreating(false);
      }
    } catch (err: any) {
      Logger.error('Error saving guest form:', err);
      setLocalFormError(err.message || 'Error al procesar el formulario.');
    }
  };

  // Toggle active status quickly
  const handleToggleActive = async (guest: GuestProfile) => {
    try {
      await updateGuest(guest.id, { isActive: !guest.isActive });
    } catch (err: any) {
      Logger.error('Error toggling guest active state:', err);
    }
  };

  // Execute Merge
  const handleExecuteMerge = async () => {
    if (!selectedGuestId || !mergeSourceId) return;
    setMergeLoading(true);
    setMergeError(null);
    try {
      await mergeGuests(selectedGuestId, mergeSourceId);
      setShowMergeModal(false);
      setMergeSourceId('');
    } catch (err: any) {
      setMergeError(err.message || 'Fallo al fusionar huéspedes.');
    } finally {
      setMergeLoading(false);
    }
  };

  // Save Preferences
  const handleSavePreferences = async (field: keyof GuestPreferences, value: any) => {
    if (!selectedGuestId) return;
    try {
      await updatePreferences(selectedGuestId, { [field]: value });
    } catch (err) {
      Logger.error('Error saving guest preferences:', err);
    }
  };

  // Submit custom comment timeline event
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customComment.trim() || !selectedGuestId) return;
    setSubmittingComment(true);
    try {
      const typeLabel = customCommentType === 'incident' ? 'Incidencia Registrada' : 'Comentario Interno';
      await addCustomTimelineEvent(customCommentType, typeLabel, customComment.trim());
      setCustomComment('');
    } catch (err) {
      Logger.error('Error logging custom timeline observation:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Create Tag Action
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await createCustomTag(newTagName.trim(), newTagColor, newTagDesc.trim());
      setNewTagName('');
      setNewTagDesc('');
      setShowAddTagModal(false);
    } catch (err) {
      Logger.error('Error creating tag:', err);
    }
  };

  // Toggle tag on selected guest
  const handleToggleGuestTag = async (tagName: string) => {
    if (!selectedGuest || !selectedGuestId) return;
    const currentTags = selectedGuest.tags || [];
    const updatedTags = currentTags.includes(tagName)
      ? currentTags.filter(t => t !== tagName)
      : [...currentTags, tagName];

    try {
      await updateGuest(selectedGuestId, { tags: updatedTags });
    } catch (err) {
      Logger.error('Error toggling tag on guest:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar & Advanced Filters Header */}
      <div className="bg-white p-5 rounded-2xl border border-line shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Búsqueda Inteligente por Nombre, Email, Teléfono, Documento, País o Reserva..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-line text-xs bg-white outline-none focus:border-forest"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-bold text-xs shadow-sm transition-all cursor-pointer ${
                showFilters 
                  ? 'border-forest bg-forest/5 text-forest' 
                  : 'border-line bg-white text-ink hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Búsqueda Avanzada {showFilters ? '▲' : '▼'}</span>
            </button>

            <button
              onClick={handleStartCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Huésped</span>
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-line/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Nombre</label>
              <input
                type="text"
                placeholder="Filtrar por nombre..."
                value={filterFirstName}
                onChange={(e) => setFilterFirstName(e.target.value)}
                className="w-full h-9 rounded-lg border border-line px-2.5 text-xs outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Apellido</label>
              <input
                type="text"
                placeholder="Filtrar por apellido..."
                value={filterLastName}
                onChange={(e) => setFilterLastName(e.target.value)}
                className="w-full h-9 rounded-lg border border-line px-2.5 text-xs outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Email</label>
              <input
                type="text"
                placeholder="Filtrar por email..."
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                className="w-full h-9 rounded-lg border border-line px-2.5 text-xs outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Teléfono</label>
              <input
                type="text"
                placeholder="Filtrar por teléfono..."
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
                className="w-full h-9 rounded-lg border border-line px-2.5 text-xs outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Cód. Reserva</label>
              <input
                type="text"
                placeholder="Ej: 17204593"
                value={filterBookingCode}
                onChange={(e) => setFilterBookingCode(e.target.value)}
                className="w-full h-9 rounded-lg border border-line px-2.5 text-xs outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Documento de Identidad</label>
              <input
                type="text"
                placeholder="Filtrar por documento..."
                value={filterDocumentNumber}
                onChange={(e) => setFilterDocumentNumber(e.target.value)}
                className="w-full h-9 rounded-lg border border-line px-2.5 text-xs outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">País</label>
              <input
                type="text"
                placeholder="Filtrar por país..."
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full h-9 rounded-lg border border-line px-2.5 text-xs outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Etiqueta Especial</label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full h-9 rounded-lg border border-line px-2 text-xs bg-white outline-none focus:border-forest font-semibold"
              >
                <option value="">Cualquier etiqueta</option>
                {tags.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Estado en CRM</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full h-9 rounded-lg border border-line px-2 text-xs bg-white outline-none focus:border-forest font-semibold"
              >
                <option value="all">Todos los huéspedes</option>
                <option value="active">Solo Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Creation or Editing Form overlay / panel */}
      {(isCreating || isEditing) && (
        <div className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-4 animate-slideIn">
          <h2 className="text-sm font-extrabold text-forest flex items-center gap-1.5 pb-3 border-b border-line">
            <User className="w-4 h-4" />
            <span>{isEditing ? 'Editar Perfil de Huésped' : 'Registrar Nuevo Huésped Unificado'}</span>
          </h2>

          <form onSubmit={handleSaveForm} className="space-y-4">
            {localFormError && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{localFormError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Apellido *</label>
                <input
                  type="text"
                  required
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Idioma de preferencia</label>
                <select
                  value={formLanguage}
                  onChange={(e) => setFormLanguage(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white outline-none focus:border-forest font-semibold"
                >
                  <option value="es">Español (es)</option>
                  <option value="en">Inglés (en)</option>
                  <option value="pt">Portugués (pt)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Tipo Documento *</label>
                <select
                  value={formDocumentType}
                  onChange={(e) => setFormDocumentType(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white outline-none focus:border-forest font-semibold"
                >
                  <option value="DNI">DNI (Documento Nacional)</option>
                  <option value="Pasaporte">Pasaporte (Internacional)</option>
                  <option value="LC">Libreta Cívica</option>
                  <option value="Otro">Otro Identificador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Número Documento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 39123456 o ABC1234"
                  value={formDocumentNumber}
                  onChange={(e) => setFormDocumentNumber(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Fecha Nacimiento</label>
                <input
                  type="date"
                  value={formBirthDate}
                  onChange={(e) => setFormBirthDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Teléfono *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: +5492944123456"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Nacionalidad</label>
                <input
                  type="text"
                  value={formNationality}
                  placeholder="Nacionalidad del huésped"
                  onChange={(e) => setFormNationality(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">País de Residencia</label>
                <input
                  type="text"
                  value={formCountry}
                  onChange={(e) => setFormCountry(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Provincia / Estado</label>
                <input
                  type="text"
                  value={formProvince}
                  onChange={(e) => setFormProvince(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Ciudad</label>
                <input
                  type="text"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Profesión / Ocupación</label>
                <input
                  type="text"
                  value={formProfession}
                  placeholder="Ej: Ingeniero, Abogado, etc."
                  onChange={(e) => setFormProfession(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-ink mb-1">Dirección postal</label>
                <input
                  type="text"
                  value={formAddress}
                  placeholder="Calle, número, depto"
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Código Postal</label>
                <input
                  type="text"
                  value={formPostalCode}
                  onChange={(e) => setFormPostalCode(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Observaciones Iniciales / Notas Internas</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
                placeholder="Detalles sobre preferencias, alergias relevantes..."
                className="w-full rounded-xl border border-line p-3 text-xs outline-none focus:border-forest"
              />
            </div>

            <div className="flex items-center gap-3 py-1">
              <input
                type="checkbox"
                id="formIsActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 text-forest focus:ring-forest border-line rounded"
              />
              <label htmlFor="formIsActive" className="text-xs font-bold text-ink select-none cursor-pointer">
                Huésped Activo (Permite realizar futuras reservas y acumular beneficios en el CRM)
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Huésped CRM'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Registered Guests list (Col-span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
            <div className="px-4 py-3.5 border-b border-line bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Users className="w-4 h-4 text-forest" />
                <span>Base CRM de Huéspedes ({localGuests.length})</span>
              </span>
            </div>

            {loading || searching ? (
              <div className="p-8 text-center text-xs text-muted flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin"></div>
                <span>Cargando perfiles unificados...</span>
              </div>
            ) : localGuests.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted">
                No se encontraron perfiles con los filtros actuales.
              </div>
            ) : (
              <div className="divide-y divide-line max-h-[640px] overflow-y-auto">
                {localGuests.map(g => {
                  const isSelected = g.id === selectedGuestId;

                  return (
                    <div 
                      key={g.id}
                      className={`p-3.5 transition-all hover:bg-slate-50/70 flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected ? 'bg-forest/5 border-l-4 border-l-forest pl-2.5' : ''
                      }`}
                      onClick={() => setSelectedGuestId(g.id)}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs ${
                          g.isActive ? 'bg-forest/80 font-semibold' : 'bg-slate-300'
                        }`}>
                          {g.firstName.charAt(0)}{g.lastName.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-ink truncate">{g.fullName}</span>
                            {!g.isActive && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-400 text-[8px] font-bold uppercase">
                                Inactivo
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[11px] text-muted space-y-0.5 mt-0.5 truncate">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-muted/60 shrink-0" /> {g.email}
                            </span>
                            <span className="flex items-center gap-1 text-[10px]">
                              <FileText className="w-3 h-3 text-muted/60 shrink-0" /> {g.documentType}: {g.documentNumber}
                            </span>
                          </div>

                          {g.tags && g.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {g.tags.slice(0, 3).map(tag => {
                                const dbTag = tags.find(t => t.name === tag);
                                return (
                                  <span 
                                    key={tag} 
                                    style={{ backgroundColor: dbTag ? `${dbTag.color}15` : '#10B98115', color: dbTag ? dbTag.color : '#10B981' }}
                                    className="px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-tight uppercase"
                                  >
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right text-[10px] hidden sm:block">
                          <span className="font-bold text-forest block">LTV Activo</span>
                          <span className="text-muted font-mono">${g.isActive ? 'Calculando...' : 'N/A'}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-forest' : 'text-muted'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Unified CRM Dashboard & Tabs (Col-span 7) */}
        <div className="lg:col-span-7">
          {selectedGuest ? (
            <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden flex flex-col min-h-[640px]">
              
              {/* Customer Profile Banner Header */}
              <div className="p-5 bg-gradient-to-r from-forest/5 via-slate-50 to-white border-b border-line flex flex-col sm:flex-row items-center sm:justify-between gap-4 relative">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md border-2 border-white ${
                    selectedGuest.isActive ? 'bg-forest' : 'bg-slate-400'
                  }`}>
                    {selectedGuest.firstName.charAt(0)}{selectedGuest.lastName.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-extrabold text-base text-ink">{selectedGuest.fullName}</h3>
                      {segments.map(seg => (
                        <span key={seg} className="px-2 py-0.5 rounded-full bg-forest text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{seg}</span>
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-muted flex items-center gap-3 mt-1 flex-wrap font-medium">
                      <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-muted/70" /> {selectedGuest.country}</span>
                      <span className="text-line">|</span>
                      <span>ID: {selectedGuest.id.substring(selectedGuest.id.indexOf('_') + 1)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleStartEdit(selectedGuest)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-white text-muted hover:text-forest hover:border-forest font-bold text-xs shadow-xs transition-all cursor-pointer"
                    title="Editar Ficha"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Editar</span>
                  </button>
                  <button
                    onClick={() => setShowMergeModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-white text-muted hover:text-forest hover:border-forest font-bold text-xs shadow-xs transition-all cursor-pointer"
                    title="Fusionar con Duplicado"
                  >
                    <Merge className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Fusionar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(selectedGuest)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      selectedGuest.isActive 
                        ? 'border-success/20 bg-success/5 text-success hover:bg-success/10' 
                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                    title={selectedGuest.isActive ? "Desactivar Huésped" : "Activar Huésped"}
                  >
                    {selectedGuest.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-line overflow-x-auto scrollbar-none bg-slate-50/40">
                {[
                  { id: 'dashboard', label: 'CRM Resumen', icon: TrendingUp },
                  { id: 'profile', label: 'Ficha Unificada', icon: FileText },
                  { id: 'preferences', label: 'Preferencias', icon: Heart },
                  { id: 'timeline', label: 'Línea Temporal', icon: Clock },
                  { id: 'loyalty', label: 'Fidelización', icon: Award },
                  { id: 'tags', label: 'Etiquetas', icon: Tag }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = crmTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCrmTab(tab.id as any)}
                      className={`px-4 py-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                        isActive 
                          ? 'border-forest text-forest bg-white' 
                          : 'border-transparent text-muted hover:text-ink hover:bg-slate-100/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* CRM Tab Content Panels */}
              <div className="p-5 flex-1 min-h-[460px]">
                {loadingCrm ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-muted">
                    <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando datos históricos del CRM...</span>
                  </div>
                ) : (
                  <div className="space-y-5">
                    
                    {/* PANEL 1: DASHBOARD AND CHARTS */}
                    {crmTab === 'dashboard' && metrics && (
                      <div className="space-y-5 animate-fadeIn">
                        
                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-slate-50 border border-line rounded-2xl p-3.5 space-y-1">
                            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Monto Total Invertido (LTV)</span>
                            <span className="text-sm font-extrabold text-ink font-mono">${metrics.totalRevenue.toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-50 border border-line rounded-2xl p-3.5 space-y-1">
                            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Estadías Totales</span>
                            <span className="text-sm font-extrabold text-forest">{metrics.bookingsCount} reservas</span>
                          </div>
                          <div className="bg-slate-50 border border-line rounded-2xl p-3.5 space-y-1">
                            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Noches Hospedadas</span>
                            <span className="text-sm font-extrabold text-ink">{metrics.nightsStayed} noches</span>
                          </div>
                          <div className="bg-slate-50 border border-line rounded-2xl p-3.5 space-y-1">
                            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Frecuencia Anual</span>
                            <span className="text-sm font-extrabold text-ink">{metrics.frequency} / año</span>
                          </div>
                        </div>

                        {/* Stays info details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-slate-50 border border-line rounded-2xl p-3.5 space-y-1">
                            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Última Estadía</span>
                            <span className="text-xs font-semibold text-ink">{metrics.lastStayDate || 'Ninguna registrada'}</span>
                          </div>
                          <div className="bg-slate-50 border border-line rounded-2xl p-3.5 space-y-1">
                            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Próxima Reserva</span>
                            <span className="text-xs font-semibold text-forest font-bold">{metrics.nextBookingDate || 'Sin reservas futuras'}</span>
                          </div>
                          <div className="bg-slate-50 border border-line rounded-2xl p-3.5 space-y-1">
                            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Canal de Origen Favorito</span>
                            <span className="text-xs font-semibold text-ink font-semibold flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-muted shrink-0" />
                              {metrics.preferredChannel || 'Directo'}
                            </span>
                          </div>
                        </div>

                        {/* Spending Chart Over Time */}
                        <div className="bg-slate-50 border border-line rounded-2xl p-4 space-y-3">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-forest" />
                            <span>Evolución Histórica de Gasto & Consumo</span>
                          </h4>

                          {chartData.length === 0 ? (
                            <div className="h-40 flex items-center justify-center text-xs text-muted italic">
                              No hay datos suficientes para graficar estadías.
                            </div>
                          ) : (
                            <div className="h-44 w-full text-xs">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                  <defs>
                                    <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#1e3f20" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#1e3f20" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <XAxis dataKey="fecha" stroke="#888888" fontSize={10} tickLine={false} />
                                  <YAxis stroke="#888888" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                  <Tooltip formatter={(value) => [`$${value}`, 'Inversión']} labelFormatter={() => ''} />
                                  <Area type="monotone" dataKey="monto" stroke="#1e3f20" strokeWidth={2} fillOpacity={1} fill="url(#colorMonto)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>

                        {/* Core CRM Notes section */}
                        <div className="p-3 bg-forest/5 border border-forest/10 rounded-2xl text-xs leading-relaxed">
                          <span className="block font-bold text-[10px] text-forest uppercase tracking-wider mb-1">Notas de Servicio e Historial Interno</span>
                          {selectedGuest.notes ? (
                            <p className="text-ink whitespace-pre-wrap font-medium">{selectedGuest.notes}</p>
                          ) : (
                            <p className="text-muted italic">No hay notas de servicio cargadas. Ve a la ficha para cargarlas.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* PANEL 2: UNIFIED PROFILE */}
                    {crmTab === 'profile' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-3 bg-slate-50 p-4 border border-line rounded-2xl">
                            <h5 className="font-extrabold text-[10px] uppercase text-muted tracking-wider border-b border-line pb-1">Identidad</h5>
                            <div className="space-y-2">
                              <div>
                                <span className="text-muted block text-[10px]">Nombre Completo</span>
                                <span className="font-bold text-ink text-xs">{selectedGuest.fullName}</span>
                              </div>
                              <div>
                                <span className="text-muted block text-[10px]">Documento Identidad</span>
                                <span className="font-bold text-ink">{selectedGuest.documentType} {selectedGuest.documentNumber}</span>
                              </div>
                              <div>
                                <span className="text-muted block text-[10px]">Nacionalidad</span>
                                <span className="font-bold text-ink">{selectedGuest.nationality || 'Argentina'}</span>
                              </div>
                              <div>
                                <span className="text-muted block text-[10px]">Fecha Nacimiento</span>
                                <span className="font-bold text-ink flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3.5 h-3.5 text-muted" /> {selectedGuest.birthDate || 'No especificada'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted block text-[10px]">Profesión / Ocupación</span>
                                <span className="font-bold text-ink flex items-center gap-1 mt-0.5">
                                  <Briefcase className="w-3.5 h-3.5 text-muted" /> {selectedGuest.profession || 'Sin especificar'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 bg-slate-50 p-4 border border-line rounded-2xl">
                            <h5 className="font-extrabold text-[10px] uppercase text-muted tracking-wider border-b border-line pb-1">Contacto & Residencia</h5>
                            <div className="space-y-2">
                              <div>
                                <span className="text-muted block text-[10px]">Correo Electrónico</span>
                                <span className="font-bold text-ink flex items-center gap-1.5 mt-0.5">
                                  <Mail className="w-3.5 h-3.5 text-muted" /> {selectedGuest.email}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted block text-[10px]">Teléfono</span>
                                <span className="font-bold text-ink flex items-center gap-1.5 mt-0.5">
                                  <Phone className="w-3.5 h-3.5 text-muted" /> {selectedGuest.phone}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted block text-[10px]">Residencia</span>
                                <span className="font-bold text-ink flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                                  <span>{[selectedGuest.address, selectedGuest.city, selectedGuest.province, selectedGuest.country].filter(Boolean).join(', ') || 'Sin dirección'}</span>
                                </span>
                              </div>
                              <div>
                                <span className="text-muted block text-[10px]">Idioma de Preferencia</span>
                                <span className="font-bold text-ink uppercase">{selectedGuest.language || 'ES'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick edits section button */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(selectedGuest)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Editar Información de Ficha</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* PANEL 3: INTERACTIVE PREFERENCES */}
                    {crmTab === 'preferences' && preferences && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="p-3 bg-slate-50 border border-line rounded-2xl">
                          <p className="text-[10px] font-semibold text-muted leading-relaxed">
                            Completa las preferencias históricas del huésped. Las modificaciones se guardan automáticamente en el CRM para futuras estadías.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          
                          {/* Stay Preferences */}
                          <div className="space-y-3 bg-slate-50 p-4 border border-line rounded-2xl">
                            <h5 className="font-extrabold text-[10px] uppercase text-muted tracking-wider border-b border-line pb-1 flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" /> Alojamiento & Estructura</h5>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-ink mb-1">Tipo de Habitación Favorita</label>
                                <select
                                  value={preferences.favoriteRoomType || ''}
                                  onChange={(e) => handleSavePreferences('favoriteRoomType', e.target.value)}
                                  className="w-full h-8.5 rounded-lg border border-line px-2 text-xs bg-white font-semibold outline-none focus:border-forest"
                                >
                                  <option value="">-- No especificado --</option>
                                  <option value="Doble">Doble Matrimonial</option>
                                  <option value="Triple">Triple Familiar</option>
                                  <option value="Suite">Suite Superior</option>
                                  <option value="Cabaña">Cabaña Alpina</option>
                                  <option value="Apartamento">Apartamento Loft</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-ink mb-1">Piso Preferido</label>
                                <select
                                  value={preferences.preferredFloor || ''}
                                  onChange={(e) => handleSavePreferences('preferredFloor', e.target.value)}
                                  className="w-full h-8.5 rounded-lg border border-line px-2 text-xs bg-white font-semibold outline-none focus:border-forest"
                                >
                                  <option value="">-- No especificado --</option>
                                  <option value="Planta Baja">Planta Baja (Fácil Acceso)</option>
                                  <option value="Primer Piso">Primer Piso</option>
                                  <option value="Pisos Altos">Pisos Altos (Mejor Vista)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-ink mb-1">Vista Preferida</label>
                                <select
                                  value={preferences.preferredView || ''}
                                  onChange={(e) => handleSavePreferences('preferredView', e.target.value)}
                                  className="w-full h-8.5 rounded-lg border border-line px-2 text-xs bg-white font-semibold outline-none focus:border-forest"
                                >
                                  <option value="">-- No especificado --</option>
                                  <option value="Lago">Vista al Lago</option>
                                  <option value="Bosque">Vista al Bosque/Parque</option>
                                  <option value="Montaña">Vista a la Montaña</option>
                                  <option value="Interno">Cualquiera / Silencioso</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-ink mb-1">Tipo de Cama</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: King Size, Twin..."
                                    value={preferences.bedType || ''}
                                    onBlur={(e) => handleSavePreferences('bedType', e.target.value)}
                                    className="w-full h-8.5 rounded-lg border border-line px-2 text-xs bg-white outline-none focus:border-forest"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-ink mb-1">Almohadas</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: Plumas, Ergo..."
                                    value={preferences.pillowType || ''}
                                    onBlur={(e) => handleSavePreferences('pillowType', e.target.value)}
                                    className="w-full h-8.5 rounded-lg border border-line px-2 text-xs bg-white outline-none focus:border-forest"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Personal Needs Preferences */}
                          <div className="space-y-3 bg-slate-50 p-4 border border-line rounded-2xl">
                            <h5 className="font-extrabold text-[10px] uppercase text-muted tracking-wider border-b border-line pb-1 flex items-center gap-1"><Coffee className="w-3.5 h-3.5" /> Alimentación & Especiales</h5>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-ink mb-1">Restricciones Alimentarias</label>
                                <input
                                  type="text"
                                  placeholder="Ej: Celíaco, Vegano, Alérgico a la nuez..."
                                  value={preferences.dietaryRestrictions || ''}
                                  onBlur={(e) => handleSavePreferences('dietaryRestrictions', e.target.value)}
                                  className="w-full h-8.5 rounded-lg border border-line px-2.5 text-xs bg-white outline-none focus:border-forest"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-ink mb-1">Bebidas Favoritas</label>
                                <input
                                  type="text"
                                  placeholder="Ej: Café Espresso, Vino Tinto Malbec..."
                                  value={preferences.favoriteDrinks || ''}
                                  onBlur={(e) => handleSavePreferences('favoriteDrinks', e.target.value)}
                                  className="w-full h-8.5 rounded-lg border border-line px-2.5 text-xs bg-white outline-none focus:border-forest"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-ink mb-1">Necesidades de Accesibilidad</label>
                                <input
                                  type="text"
                                  placeholder="Ej: Rampa silla de ruedas, sin escaleras..."
                                  value={preferences.accessibilityNeeds || ''}
                                  onBlur={(e) => handleSavePreferences('accessibilityNeeds', e.target.value)}
                                  className="w-full h-8.5 rounded-lg border border-line px-2.5 text-xs bg-white outline-none focus:border-forest"
                                />
                              </div>

                              <div className="flex items-center gap-3 py-1 bg-white p-2.5 border border-line rounded-lg">
                                <input
                                  type="checkbox"
                                  id="hasPets"
                                  checked={preferences.hasPets}
                                  onChange={(e) => handleSavePreferences('hasPets', e.target.checked)}
                                  className="w-4 h-4 text-forest focus:ring-forest border-line rounded"
                                />
                                <label htmlFor="hasPets" className="text-[11px] font-bold text-ink select-none cursor-pointer">
                                  Viaja con Mascotas
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* General remarks textarea */}
                        <div className="bg-slate-50 p-4 border border-line rounded-2xl">
                          <label className="block text-[10px] font-extrabold uppercase text-muted tracking-wider mb-1.5">Observaciones de Conserjería / Preferencias Generales</label>
                          <textarea
                            rows={2}
                            placeholder="Anotar detalles especiales (ej: Siempre solicita agua sin gas al ingresar, prefiere sábanas adicionales...)"
                            value={preferences.remarks || ''}
                            onBlur={(e) => handleSavePreferences('remarks', e.target.value)}
                            className="w-full rounded-xl border border-line p-3 text-xs bg-white outline-none focus:border-forest"
                          />
                        </div>
                      </div>
                    )}

                    {/* PANEL 4: CHRONOLOGICAL TIMELINE */}
                    {crmTab === 'timeline' && (
                      <div className="space-y-5 animate-fadeIn">
                        
                        {/* Custom Observation entry */}
                        <form onSubmit={handleSubmitComment} className="bg-slate-50 border border-line p-4 rounded-2xl space-y-3">
                          <span className="block font-bold text-[10px] text-muted uppercase tracking-wider">Añadir Observación o Incidencia al Historial</span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              placeholder="Escribe un comentario interno sobre la estadía, reclamo o solicitud especial..."
                              value={customComment}
                              onChange={(e) => setCustomComment(e.target.value)}
                              className="flex-1 h-9 rounded-lg border border-line px-3 text-xs bg-white outline-none focus:border-forest"
                            />

                            <select
                              value={customCommentType}
                              onChange={(e) => setCustomCommentType(e.target.value as any)}
                              className="h-9 rounded-lg border border-line px-2 text-xs bg-white font-semibold outline-none focus:border-forest shrink-0"
                            >
                              <option value="observation">Comentario</option>
                              <option value="incident">Incidencia/Reclamo</option>
                              <option value="message">Mensaje Interno</option>
                            </select>

                            <button
                              type="submit"
                              disabled={submittingComment || !customComment.trim()}
                              className="h-9 px-4 rounded-lg bg-forest hover:bg-forest-hover text-white text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              Registrar
                            </button>
                          </div>
                        </form>

                        {/* Scrollable Events list */}
                        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                          {timeline.length === 0 ? (
                            <div className="text-center py-8 text-xs text-muted italic">
                              Este huésped no registra eventos o interacciones en su línea temporal.
                            </div>
                          ) : (
                            <div className="relative border-l-2 border-line/60 ml-3.5 pl-5 space-y-4">
                              {timeline.map((evt) => {
                                let badgeColor = 'bg-slate-100 text-slate-600';
                                if (evt.type === 'booking' || evt.type === 'check_in') {
                                  badgeColor = 'bg-forest/10 text-forest';
                                } else if (evt.type === 'payment') {
                                  badgeColor = 'bg-success/15 text-success';
                                } else if (evt.type === 'incident') {
                                  badgeColor = 'bg-danger/10 text-danger border border-danger/10';
                                } else if (evt.type === 'notification') {
                                  badgeColor = 'bg-info/10 text-info';
                                } else if (evt.type === 'change') {
                                  badgeColor = 'bg-warning/10 text-warning';
                                }

                                return (
                                  <div key={evt.id} className="relative animate-slideIn">
                                    {/* Timeline Node Dot */}
                                    <span className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-forest/80 shadow-xs"></span>
                                    
                                    <div className="bg-slate-50/50 hover:bg-slate-50 border border-line/80 rounded-2xl p-3.5 transition-all space-y-1.5">
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-xs text-ink">{evt.title}</span>
                                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-tight ${badgeColor}`}>
                                            {evt.type}
                                          </span>
                                        </div>
                                        <span className="text-[9px] text-muted font-semibold font-mono">
                                          {new Date(evt.timestamp).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                      </div>

                                      <p className="text-xs text-ink/90 font-medium leading-relaxed">{evt.description}</p>
                                      
                                      <div className="flex items-center justify-between text-[9px] text-muted font-semibold pt-1 border-t border-line/40">
                                        <span>Registrado por: <strong>{evt.createdBy}</strong></span>
                                        {evt.referenceId && (
                                          <span className="font-mono">Ref: #{evt.referenceId}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* PANEL 5: LOYALTY PLATFORM INFRA */}
                    {crmTab === 'loyalty' && (
                      <div className="space-y-4 animate-fadeIn">
                        
                        {/* Elite Loyalty Card representation */}
                        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4 relative overflow-hidden">
                          {/* Radial ambient background shine */}
                          <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-forest/20 blur-xl"></div>
                          
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">StayFlow Elite Club</span>
                              <h4 className="text-sm font-extrabold tracking-wide flex items-center gap-1.5">
                                <Award className="w-5 h-5 text-warning" />
                                <span>Categoría {loyaltyDetails.tier}</span>
                              </h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Puntos Acumulados</span>
                              <span className="text-base font-extrabold text-warning font-mono">{loyaltyDetails.points.toLocaleString()} PTS</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-[10px] font-bold text-slate-300">
                              <span>Próximo Nivel: {loyaltyDetails.nextTier}</span>
                              {loyaltyDetails.pointsNeeded > 0 ? (
                                <span>Faltan {loyaltyDetails.pointsNeeded.toLocaleString()} pts</span>
                              ) : (
                                <span>¡Nivel Máximo Alcanzado!</span>
                              )}
                            </div>
                            
                            {/* Visual Progress bar */}
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${loyaltyDetails.progress}%` }} 
                                className="h-full bg-gradient-to-r from-warning to-forest transition-all duration-500"
                              ></div>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 italic font-medium">
                            * Los puntos se acumulan automáticamente basándose en estadías completadas (+100 PTS) y consumos registrados (+1 PT por cada $10 gastados).
                          </div>
                        </div>

                        {/* Configured Benefits lists */}
                        <div className="bg-slate-50 border border-line rounded-2xl p-4 space-y-3">
                          <h5 className="font-extrabold text-xs text-ink flex items-center gap-1.5"><Shield className="w-4 h-4 text-forest" /> Beneficios Exclusivos Activados</h5>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed text-ink/90">
                            <div className="p-3 bg-white border border-line rounded-xl space-y-1">
                              <span className="font-bold text-forest text-xs block">✔ Check-In Temprano</span>
                              <p className="text-[10px] text-muted">Sujeto a disponibilidad, a partir de las 11:00 hs sin cargo adicional.</p>
                            </div>
                            <div className="p-3 bg-white border border-line rounded-xl space-y-1">
                              <span className="font-bold text-forest text-xs block">✔ Bebida de Bienvenida</span>
                              <p className="text-[10px] text-muted">Vino de cortesía o jugo orgánico servido en la cabaña durante el ingreso.</p>
                            </div>
                            <div className="p-3 bg-white border border-line rounded-xl space-y-1">
                              <span className="font-bold text-forest text-xs block">✔ Prioridad de Vista</span>
                              <p className="text-[10px] text-muted">Bloqueo preferencial en unidades con mejores vistas al lago y montañas.</p>
                            </div>
                            <div className="p-3 bg-white border border-line rounded-xl space-y-1">
                              <span className="font-semibold text-muted text-xs block">🔒 Upgrade de Habitación</span>
                              <p className="text-[10px] text-muted">Disponible para categoría Oro y superior. Mejora automática a Suite.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PANEL 6: CUSTOM GUEST TAGS AND LABELS */}
                    {crmTab === 'tags' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="p-3 bg-slate-50 border border-line rounded-2xl text-xs text-muted flex items-center justify-between gap-4">
                          <span>Administra y asigna etiquetas específicas para segmentar visualmente este huésped.</span>
                          <button
                            type="button"
                            onClick={() => setShowAddTagModal(true)}
                            className="px-3 py-1.5 rounded-lg bg-forest hover:bg-forest-hover text-white font-bold text-[10px] shrink-0 transition-all cursor-pointer"
                          >
                            + Crear Nueva Etiqueta
                          </button>
                        </div>

                        {/* List of tags */}
                        <div className="bg-slate-50 p-4 border border-line rounded-2xl space-y-3">
                          <span className="block font-bold text-[10px] text-muted uppercase tracking-wider">Haga clic en una etiqueta para asignarla o removerla</span>
                          
                          <div className="flex flex-wrap gap-2.5">
                            {tags.map(t => {
                              const isActive = selectedGuest.tags && selectedGuest.tags.includes(t.name);
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => handleToggleGuestTag(t.name)}
                                  style={{ 
                                    backgroundColor: isActive ? t.color : '#FFFFFF',
                                    color: isActive ? '#FFFFFF' : t.color,
                                    borderColor: t.color
                                  }}
                                  className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>{t.name}</span>
                                  {isActive && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Audit Log representation */}
                        <div className="bg-slate-50 p-4 border border-line rounded-2xl space-y-2 text-xs">
                          <span className="block font-bold text-[10px] text-muted uppercase tracking-wider">Historial de Auditoría de Modificaciones</span>
                          <p className="text-[10px] text-muted font-medium">
                            Última modificación realizada por: <strong>{selectedGuest.updatedBy || 'sistema'}</strong> el {selectedGuest.updatedAt ? new Date(selectedGuest.updatedAt).toLocaleDateString() : 'N/A'}.
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-line/60 border-dashed p-12 text-center text-xs text-muted h-96 flex flex-col items-center justify-center space-y-3">
              <Users className="w-10 h-10 text-muted/50" />
              <span className="font-bold text-ink text-sm">Plataforma CRM de Huéspedes</span>
              <p className="max-w-md leading-relaxed text-muted font-medium">
                Selecciona un huésped del panel izquierdo para acceder a su expediente histórico unificado, preferencias de alojamiento, historial de reservas y segmentación automatizada de StayFlow.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Duplicate Merging Resolution Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-lg overflow-hidden flex flex-col animate-scaleUp">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5">
                <Merge className="w-4 h-4 text-forest" />
                <span>Unificar Perfiles Duplicados</span>
              </h3>
              <button 
                onClick={() => {
                  setShowMergeModal(false);
                  setMergeSourceId('');
                  setMergeError(null);
                }}
                className="text-muted hover:text-ink cursor-pointer border border-transparent hover:border-line p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                Esta acción fusionará al huésped duplicado seleccionado abajo dentro de la ficha principal de <strong className="text-ink">{selectedGuest?.fullName}</strong>.
              </p>
              
              <div className="p-3.5 bg-warning/10 border border-warning/20 rounded-xl text-[11px] text-ink leading-relaxed font-medium">
                <strong>Efectos colaterales de la unificación de perfil:</strong>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-muted">
                  <li>Todas las reservas asociadas al duplicado se re-asignarán a esta ficha.</li>
                  <li>Las notas internas, observaciones, y etiquetas se unificarán.</li>
                  <li>Se calcularán los KPI históricos consolidados (LTV, noches).</li>
                  <li>El perfil secundario se desactivará para evitar futuras discrepancias de CRM.</li>
                </ul>
              </div>

              {mergeError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{mergeError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Seleccionar Perfil Duplicado *</label>
                <select
                  value={mergeSourceId}
                  onChange={(e) => setMergeSourceId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white outline-none focus:border-forest font-semibold"
                >
                  <option value="">-- Seleccionar registro duplicado --</option>
                  {guests
                    .filter(g => g.id !== selectedGuestId && g.isActive)
                    .map(g => (
                      <option key={g.id} value={g.id}>
                        {g.fullName} ({g.documentType}: {g.documentNumber} | {g.email})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-line flex justify-end gap-2">
              <button
                type="button"
                disabled={mergeLoading}
                onClick={() => {
                  setShowMergeModal(false);
                  setMergeSourceId('');
                  setMergeError(null);
                }}
                className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!mergeSourceId || mergeLoading}
                onClick={handleExecuteMerge}
                className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {mergeLoading ? 'Fusionando...' : 'Fusionar Fichas de Huésped'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Tag Modal */}
      {showAddTagModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateTag} className="bg-white rounded-2xl max-w-sm w-full border border-line shadow-lg overflow-hidden flex flex-col animate-scaleUp">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-forest" />
                <span>Crear Nueva Etiqueta</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddTagModal(false)}
                className="text-muted hover:text-ink cursor-pointer border border-transparent p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Nombre de la Etiqueta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cliente Frecuente, Masajes, etc."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Color Identificador *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-10 h-10 border-0 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono text-xs font-bold uppercase text-muted bg-slate-50 p-2.5 rounded-lg border border-line">{newTagColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Descripción corta (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Requiere atención preferencial"
                  value={newTagDesc}
                  onChange={(e) => setNewTagDesc(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-line flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddTagModal(false)}
                className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Crear Etiqueta
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GuestManagement;
