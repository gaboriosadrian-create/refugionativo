import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  UserCheck, 
  Clock, 
  FileText, 
  Users, 
  HelpCircle, 
  Search, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  MapPin, 
  Wifi, 
  Key, 
  Sparkles,
  RefreshCw,
  QrCode,
  BookOpen,
  ArrowRight,
  ClipboardList,
  Flame,
  Star,
  FileSignature
} from 'lucide-react';
import { useResort } from '../../../shared/contexts/ResortContext';
import { useReservations } from '../../../shared/hooks/useReservations';
import { useAccommodations } from '../../../shared/hooks/useAccommodations';
import { 
  GuestJourneyService, 
  PreCheckinService, 
  DigitalSignatureService, 
  GuestDocumentService, 
  CompanionService, 
  SurveyService, 
  JourneyTimelineService 
} from '../index';
import { JourneyStage, GuestJourney, PreCheckin, Companion, GuestSurvey, DigitalSignature, GuestDocument } from '../types/journey';

interface GuestJourneyDashboardProps {
  onSelectBookingForPortal?: (bookingId: string) => void;
}

export const GuestJourneyDashboard: React.FC<GuestJourneyDashboardProps> = ({ onSelectBookingForPortal }) => {
  const { resort } = useResort();
  const { reservations: bookings, loading: bookingsLoading } = useReservations();
  const { accommodations } = useAccommodations();
  const resortId = resort?.id || 'default';

  const getCabinName = (cabinId: number) => {
    const cabin = accommodations.find(c => c.id === cabinId);
    return cabin ? cabin.name : `Alojamiento #${cabinId}`;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [journeys, setJourneys] = useState<Record<string, GuestJourney>>({});
  const [preCheckins, setPreCheckins] = useState<Record<string, PreCheckin>>({});
  const [companions, setCompanions] = useState<Record<string, Companion[]>>({});
  const [signatures, setSignatures] = useState<Record<string, DigitalSignature[]>>({});
  const [documents, setDocuments] = useState<Record<string, GuestDocument[]>>({});
  const [surveys, setSurveys] = useState<Record<string, GuestSurvey>>({});
  const [timelines, setTimelines] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  // Fetch all journey data for all bookings
  const loadJourneyData = async () => {
    if (bookingsLoading || !bookings.length) return;
    setLoading(true);
    try {
      const activeJourneys: Record<string, GuestJourney> = {};
      const activePreCheckins: Record<string, PreCheckin> = {};
      const activeCompanions: Record<string, Companion[]> = {};
      const activeSignatures: Record<string, DigitalSignature[]> = {};
      const activeDocuments: Record<string, GuestDocument[]> = {};
      const activeSurveys: Record<string, GuestSurvey> = {};
      const activeTimelines: Record<string, any[]> = {};

      for (const b of bookings) {
        const bId = String(b.id);
        const j = await GuestJourneyService.getJourney(resortId, bId);
        activeJourneys[bId] = j;

        const p = await PreCheckinService.getPreCheckin(resortId, bId);
        activePreCheckins[bId] = p;

        const c = await CompanionService.getCompanions(resortId, bId);
        activeCompanions[bId] = c;

        const sig = await DigitalSignatureService.getSignaturesByBooking(resortId, bId);
        activeSignatures[bId] = sig;

        const doc = await GuestDocumentService.getDocumentsByBooking(resortId, bId);
        activeDocuments[bId] = doc;

        const s = await SurveyService.getSurvey(resortId, bId);
        if (s) activeSurveys[bId] = s;

        const t = await JourneyTimelineService.getTimelineEvents(resortId, bId);
        activeTimelines[bId] = t;
      }

      setJourneys(activeJourneys);
      setPreCheckins(activePreCheckins);
      setCompanions(activeCompanions);
      setSignatures(activeSignatures);
      setDocuments(activeDocuments);
      setSurveys(activeSurveys);
      setTimelines(activeTimelines);

      if (bookings.length > 0 && !selectedJourneyId) {
        setSelectedJourneyId(String(bookings[0].id));
      }
    } catch (error) {
      console.error('Error loading digital journey data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJourneyData();
  }, [bookings, bookingsLoading]);

  // Handle stage transition from dashboard
  const handleStageTransition = async (bId: string, stage: JourneyStage) => {
    try {
      await GuestJourneyService.updateStage(resortId, bId, stage, 'receptionist');
      
      // If checked in, confirm into CRM profile
      if (stage === JourneyStage.CHECKED_IN) {
        await PreCheckinService.confirmPreCheckinIntoCRM(resortId, bId);
      }

      await loadJourneyData();
    } catch (err) {
      console.error('Error changing stage:', err);
    }
  };

  // Filtered bookings
  const filteredBookings = bookings.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.name?.toLowerCase().includes(q) ||
      String(b.id).includes(q) ||
      getCabinName(b.cabinId).toLowerCase().includes(q)
    );
  });

  const selectedBooking = bookings.find(b => String(b.id) === selectedJourneyId);
  const selectedJourney = selectedJourneyId ? journeys[selectedJourneyId] : null;
  const selectedPreCheckin = selectedJourneyId ? preCheckins[selectedJourneyId] : null;
  const selectedCompanionsList = selectedJourneyId ? (companions[selectedJourneyId] || []) : [];
  const selectedSignaturesList = selectedJourneyId ? (signatures[selectedJourneyId] || []) : [];
  const selectedDocumentsList = selectedJourneyId ? (documents[selectedJourneyId] || []) : [];
  const selectedSurvey = selectedJourneyId ? surveys[selectedJourneyId] : null;
  const selectedTimeline = selectedJourneyId ? (timelines[selectedJourneyId] || []) : [];

  // Calculate stats in real-time
  const stats = React.useMemo(() => {
    let checkinsToday = 0;
    let completedCheckins = 0;
    let pendingCheckins = 0;
    let checkouts = 0;
    let answeredSurveys = Object.keys(surveys).length;
    let missingDocs = 0;
    let pendingSignatures = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    bookings.forEach(b => {
      const bId = String(b.id);
      const j = journeys[bId];
      const p = preCheckins[bId];
      const docs = documents[bId] || [];
      const sigs = signatures[bId] || [];
      const comps = companions[bId] || [];

      const isToday = b.checkIn && b.checkIn.includes(todayStr);

      if (isToday) {
        checkinsToday++;
        if (j?.stage === JourneyStage.CHECKED_IN || j?.stage === JourneyStage.IN_STAY) {
          completedCheckins++;
        } else {
          pendingCheckins++;
        }
      }

      if (j?.stage === JourneyStage.CHECKED_OUT) {
        checkouts++;
      }

      // Check missing docs: primary needs doc if precheckin is completed
      if (p?.status === 'completed' && docs.length === 0) {
        missingDocs++;
      }
      // Check pending signatures
      if (p?.status === 'completed' && sigs.length === 0) {
        pendingSignatures++;
      }
    });

    return {
      checkinsToday,
      completedCheckins,
      pendingCheckins,
      checkouts,
      answeredSurveys,
      missingDocs,
      pendingSignatures
    };
  }, [bookings, journeys, preCheckins, documents, signatures, companions, surveys]);

  if (bookingsLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Sincronizando el motor de Guest Journey...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Check-ins */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Check-ins del Día</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">{stats.checkinsToday}</span>
              <span className="text-xs text-gray-500">({stats.completedCheckins} listos)</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Check-outs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Check-outs Realizados</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">{stats.checkouts}</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Pendientes Documentos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Documentos Faltantes</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-amber-600">{stats.missingDocs}</span>
              <span className="text-xs text-gray-500">pre check-in sin foto</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Firmas Pendientes */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Firmas Pendientes</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-rose-600">{stats.pendingSignatures}</span>
              <span className="text-xs text-gray-500">reglamentos</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <FileSignature className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left List, Right Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Search and Journey List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 border-b border-gray-50 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              Estadías Digitales
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por huésped, cabaña, reserva..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No se encontraron estadías con los filtros aplicados.
              </div>
            ) : (
              filteredBookings.map(b => {
                const bId = String(b.id);
                const j = journeys[bId];
                const isSelected = selectedJourneyId === bId;

                return (
                  <button
                    key={bId}
                    onClick={() => setSelectedJourneyId(bId)}
                    className={`w-full text-left p-4 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-emerald-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 text-sm">{b.name}</span>
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          #{bId}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {getCabinName(b.cabinId)}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {b.checkIn} — {b.checkOut}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        j?.stage === JourneyStage.CHECKED_IN || j?.stage === JourneyStage.IN_STAY ? 'bg-emerald-100 text-emerald-800' :
                        j?.stage === JourneyStage.CHECKED_OUT ? 'bg-gray-100 text-gray-800' :
                        j?.stage === JourneyStage.PRE_CHECKIN ? 'bg-blue-100 text-blue-800' :
                        j?.stage === JourneyStage.CHECKIN_PENDING ? 'bg-amber-100 text-amber-800' :
                        j?.stage === JourneyStage.CHECKOUT_PENDING ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {j?.stage || 'BOOKED'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected Journey Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedBooking && selectedJourney ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              {/* Profile Overview */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-50 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-gray-900">{selectedBooking.name}</h2>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium">
                      Estadía #{selectedBooking.id}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Cabaña: <span className="font-semibold text-gray-800">{getCabinName(selectedBooking.cabinId)}</span> | {selectedBooking.checkIn} a {selectedBooking.checkOut}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {onSelectBookingForPortal && (
                    <button
                      onClick={() => onSelectBookingForPortal(String(selectedBooking.id))}
                      className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      Simular Portal Móvil
                    </button>
                  )}

                  {/* Operational Override Buttons */}
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/50">
                    <button
                      onClick={() => handleStageTransition(String(selectedBooking.id), JourneyStage.CHECKED_IN)}
                      disabled={selectedJourney.stage === JourneyStage.CHECKED_IN || selectedJourney.stage === JourneyStage.IN_STAY}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        selectedJourney.stage === JourneyStage.CHECKED_IN || selectedJourney.stage === JourneyStage.IN_STAY
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Hacer Check-in
                    </button>
                    <button
                      onClick={() => handleStageTransition(String(selectedBooking.id), JourneyStage.CHECKED_OUT)}
                      disabled={selectedJourney.stage === JourneyStage.CHECKED_OUT}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        selectedJourney.stage === JourneyStage.CHECKED_OUT
                          ? 'bg-gray-800 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Hacer Check-out
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid: Details, Checklist, Survey, Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left pane: Personal Information & Companions */}
                <div className="space-y-6">
                  {/* Pre Check-in Form Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                      Datos de Pre Check-in
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm border border-gray-200/40">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-400">Documento</p>
                          <p className="font-medium text-gray-800">
                            {selectedPreCheckin?.documentType || 'DNI'} {selectedPreCheckin?.documentNumber || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Nacionalidad</p>
                          <p className="font-medium text-gray-800">{selectedPreCheckin?.nationality || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Nacimiento</p>
                          <p className="font-medium text-gray-800">{selectedPreCheckin?.dateOfBirth || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Email</p>
                          <p className="font-medium text-gray-800 truncate">{selectedPreCheckin?.email || '—'}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200/60 pt-2 text-xs">
                        <p className="text-gray-400">Domicilio</p>
                        <p className="font-medium text-gray-800">{selectedPreCheckin?.address || '—'}</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-gray-400">Estado de carga:</span>
                        <span className={`font-bold uppercase ${
                          selectedPreCheckin?.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'
                        }`}>
                          {selectedPreCheckin?.status === 'completed' ? '✓ Completado' : '⚡ Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Companions */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-emerald-600" />
                      Acompañantes Registrados ({selectedCompanionsList.length})
                    </h4>
                    {selectedCompanionsList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No se agregaron acompañantes para esta estadía.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedCompanionsList.map((c, idx) => (
                          <div key={idx} className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold text-gray-800">{c.firstName} {c.lastName}</p>
                              <p className="text-gray-400 text-[10px]">
                                {c.documentType} {c.documentNumber} | Nacimiento: {c.dateOfBirth}
                              </p>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                              Pre check-in listo
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Welcoming Access & Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="h-4 w-4 text-emerald-600" />
                      Acceso & Servicios (CMS)
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/40 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Código de Acceso:</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-sm">
                          {selectedJourney.arrivalInfo.accessCode || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">WiFi:</span>
                        <div className="text-right">
                          <p className="font-medium text-gray-800 flex items-center justify-end gap-1">
                            <Wifi className="h-3 w-3 text-emerald-600" />
                            {selectedJourney.arrivalInfo.wifiSsid}
                          </p>
                          <p className="text-[10px] text-gray-400">Pass: {selectedJourney.arrivalInfo.wifiPassword}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right pane: Document Checklist, Audits, Signatures, and Survey */}
                <div className="space-y-6">
                  {/* Digital Signature & Document copy status */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSignature className="h-4 w-4 text-emerald-600" />
                      Fichas, Firmas & Documentación
                    </h4>
                    <div className="space-y-2">
                      {/* Signature check */}
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <FileSignature className={`h-4 w-4 ${selectedSignaturesList.length > 0 ? 'text-emerald-500' : 'text-gray-400'}`} />
                          <span className="font-medium text-gray-700">Contratos & Reglamento Firmado</span>
                        </div>
                        <span className={`text-[10px] font-bold ${
                          selectedSignaturesList.length > 0 ? 'text-emerald-600' : 'text-amber-500'
                        }`}>
                          {selectedSignaturesList.length > 0 ? `✓ ${selectedSignaturesList.length} Firmados` : '⚠️ Sin Firmar'}
                        </span>
                      </div>

                      {/* Documents check */}
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <FileText className={`h-4 w-4 ${selectedDocumentsList.length > 0 ? 'text-emerald-500' : 'text-gray-400'}`} />
                          <span className="font-medium text-gray-700">Copias Digitales de ID / Pasaporte</span>
                        </div>
                        <span className={`text-[10px] font-bold ${
                          selectedDocumentsList.length > 0 ? 'text-emerald-600' : 'text-amber-500'
                        }`}>
                          {selectedDocumentsList.length > 0 ? `✓ ${selectedDocumentsList.length} Cargados` : '⚠️ Sin Documentos'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Satisfaction Survey Results */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-emerald-600" />
                      Encuesta de Satisfacción
                    </h4>
                    {selectedSurvey ? (
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-900">Puntuación General</span>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < selectedSurvey.overallRating ? 'fill-current' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-600 pt-1 border-t border-emerald-100">
                          <div>
                            <p className="text-gray-400">Limpieza</p>
                            <p className="font-bold text-emerald-800">{selectedSurvey.cleanlinessRating}/5</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Atención</p>
                            <p className="font-bold text-emerald-800">{selectedSurvey.serviceRating}/5</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Instalaciones</p>
                            <p className="font-bold text-emerald-800">{selectedSurvey.facilitiesRating}/5</p>
                          </div>
                        </div>
                        {selectedSurvey.comments && (
                          <div className="bg-white p-2.5 rounded-lg border border-emerald-100/60 italic text-gray-500 text-[11px] leading-relaxed">
                            "{selectedSurvey.comments}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No se ha enviado la encuesta aún (habilitado tras check-out).</p>
                    )}
                  </div>

                  {/* Timeline Audit log */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4 text-emerald-600" />
                      Historial del Journey (Auditoría)
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/40 max-h-48 overflow-y-auto space-y-3">
                      {selectedTimeline.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No hay registros de auditoría aún.</p>
                      ) : (
                        <div className="relative border-l border-gray-200 pl-4 ml-2 space-y-4">
                          {selectedTimeline.map((t, idx) => (
                            <div key={idx} className="relative text-xs">
                              <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
                              <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                                <span className="font-medium text-gray-500 bg-gray-100 px-1 py-0.2 rounded">{t.performedBy}</span>
                                <span>{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="font-bold text-gray-800">{t.action}</p>
                              <p className="text-gray-500 text-[11px] leading-relaxed mt-0.5">{t.details}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
              Seleccione un huésped para ver los detalles de su Guest Journey digital.
            </div>
          )}
        </div>
      </div>

      {/* Prepare Architecture Interfaces */}
      <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
        <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Puntos de Extensión de Arquitectura (Sprint 7.6 Ready)
        </h4>
        <p className="text-emerald-700 text-xs mt-1 leading-relaxed">
          La base de datos y la capa de servicios ya se encuentran modeladas cumpliendo SOLID para habilitar con facilidad:
          <span className="font-semibold"> OCR de Documentos, Reconocimiento Facial, y Cerraduras Inteligentes</span>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-[11px]">
          <div className="bg-white p-3 rounded-xl border border-emerald-200/50">
            <span className="font-bold text-emerald-800">Doc OCR Interface</span>
            <p className="text-gray-500 mt-1">Conexión con Cloud Vision API o servicios locales de escaneo.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-emerald-200/50">
            <span className="font-bold text-emerald-800">Cerraduras Digitales</span>
            <p className="text-gray-500 mt-1">Asociación de llaves virtuales en base al `accessCode` generado.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-emerald-200/50">
            <span className="font-bold text-emerald-800">Kiosco de Auto Check-in</span>
            <p className="text-gray-500 mt-1">Sincronización bidireccional inmediata vía Firestore triggers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
