import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  UserCheck, 
  Clock, 
  FileText, 
  Users, 
  HelpCircle, 
  MapPin, 
  Wifi, 
  Key, 
  Sparkles,
  CheckCircle2, 
  AlertTriangle,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Send,
  Star,
  BookOpen,
  ArrowRight,
  FileSignature,
  Download,
  Info
} from 'lucide-react';
import { useResort } from '../../../shared/contexts/ResortContext';
import { useReservations } from '../../../shared/hooks/useReservations';
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

interface GuestJourneyPortalProps {
  bookingId: string;
  onClose?: () => void;
}

export const GuestJourneyPortal: React.FC<GuestJourneyPortalProps> = ({ bookingId, onClose }) => {
  const { resort } = useResort();
  const resortId = resort?.id || 'default';

  const [activeStep, setActiveStep] = useState<'welcome' | 'precheckin' | 'companions' | 'documents' | 'signature' | 'stay' | 'checkout' | 'completed'>('welcome');

  // Core records
  const [journey, setJourney] = useState<GuestJourney | null>(null);
  const [preCheckin, setPreCheckin] = useState<PreCheckin | null>(null);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [documents, setDocuments] = useState<GuestDocument[]>([]);
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [survey, setSurvey] = useState<GuestSurvey | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for Pre Check-in
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formDocType, setFormDocType] = useState('DNI');
  const [formDocNum, setFormDocNum] = useState('');
  const [formNationality, setFormNationality] = useState('Argentina');
  const [formAddress, setFormAddress] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states for Companion
  const [compFirstName, setCompFirstName] = useState('');
  const [compLastName, setCompLastName] = useState('');
  const [compDocType, setCompDocType] = useState('DNI');
  const [compDocNum, setCompDocNum] = useState('');
  const [compNationality, setCompNationality] = useState('Argentina');
  const [compBirthDate, setCompBirthDate] = useState('');
  const [showCompForm, setShowCompForm] = useState(false);

  // Document upload mock state
  const [selectedDocType, setSelectedDocType] = useState<'passport' | 'id_card' | 'driver_license' | 'other'>('id_card');
  const [selectedDocSide, setSelectedDocSide] = useState<'front' | 'back' | 'all'>('front');
  const [mockFileName, setMockFileName] = useState('');
  const [mockDocUploading, setMockDocUploading] = useState(false);

  // Signature canvas simulation state
  const [signedName, setSignedName] = useState('');
  const [isRulesChecked, setIsRulesChecked] = useState(false);
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [signatureBase64, setSignatureBase64] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Survey & Check-out state
  const [surveyOverall, setSurveyOverall] = useState(5);
  const [surveyClean, setSurveyClean] = useState(5);
  const [surveyService, setSurveyService] = useState(5);
  const [surveyFacilities, setSurveyFacilities] = useState(5);
  const [surveyComments, setSurveyComments] = useState('');
  const [requestInvoice, setRequestInvoice] = useState(false);
  const [checkoutIncident, setCheckoutIncident] = useState('');

  // Fetch all data
  const loadPortalData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const j = await GuestJourneyService.getJourney(resortId, bookingId);
      setJourney(j);

      const p = await PreCheckinService.getPreCheckin(resortId, bookingId);
      setPreCheckin(p);
      
      // Seed form fields
      setFormFirstName(p.firstName || '');
      setFormLastName(p.lastName || '');
      setFormDocType(p.documentType || 'DNI');
      setFormDocNum(p.documentNumber || '');
      setFormNationality(p.nationality || 'Argentina');
      setFormAddress(p.address || '');
      setFormBirthDate(p.dateOfBirth || '');
      setFormPhone(p.phone || '');
      setFormEmail(p.email || '');

      const c = await CompanionService.getCompanions(resortId, bookingId);
      setCompanions(c);

      const d = await GuestDocumentService.getDocumentsByBooking(resortId, bookingId);
      setDocuments(d);

      const s = await DigitalSignatureService.getSignaturesByBooking(resortId, bookingId);
      setSignatures(s);

      const sv = await SurveyService.getSurvey(resortId, bookingId);
      setSurvey(sv);

      const t = await JourneyTimelineService.getTimelineEvents(resortId, bookingId);
      setTimeline(t);

      // Map stage to appropriate screen
      if (j.stage === JourneyStage.BOOKED) {
        setActiveStep('welcome');
      } else if (j.stage === JourneyStage.PRE_CHECKIN) {
        if (s.length === 0) {
          setActiveStep('signature');
        } else if (d.length === 0) {
          setActiveStep('documents');
        } else {
          setActiveStep('stay');
        }
      } else if (j.stage === JourneyStage.CHECKED_IN || j.stage === JourneyStage.IN_STAY) {
        setActiveStep('stay');
      } else if (j.stage === JourneyStage.CHECKOUT_PENDING) {
        setActiveStep('checkout');
      } else if (j.stage === JourneyStage.CHECKED_OUT) {
        setActiveStep('completed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al sincronizar datos del portal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [bookingId]);

  // Signature Pad drawing utilities
  useEffect(() => {
    if (activeStep === 'signature' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#059669'; // Emerald-600
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeStep]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureBase64(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureBase64('');
  };

  // Submit Pre Check-in Form
  const handleSubmitPreCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await PreCheckinService.submitPreCheckin(resortId, bookingId, {
        firstName: formFirstName,
        lastName: formLastName,
        documentType: formDocType,
        documentNumber: formDocNum,
        nationality: formNationality,
        address: formAddress,
        dateOfBirth: formBirthDate,
        phone: formPhone,
        email: formEmail,
      });

      await loadPortalData();
      setActiveStep('companions');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Companion
  const handleAddCompanion = async () => {
    if (!compFirstName || !compLastName || !compDocNum) {
      alert('Por favor complete los campos obligatorios del acompañante');
      return;
    }
    try {
      await CompanionService.addCompanion(resortId, bookingId, {
        firstName: compFirstName,
        lastName: compLastName,
        documentType: compDocType,
        documentNumber: compDocNum,
        nationality: compNationality,
        dateOfBirth: compBirthDate,
      });

      // Reset
      setCompFirstName('');
      setCompLastName('');
      setCompDocNum('');
      setShowCompForm(false);

      await loadPortalData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Companion
  const handleDeleteCompanion = async (id: string) => {
    if (confirm('¿Desea remover este acompañante?')) {
      try {
        await CompanionService.deleteCompanion(resortId, id);
        await loadPortalData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Document Upload Sim
  const handleUploadDocumentSim = async () => {
    if (!mockFileName) {
      alert('Por favor, arrastre o seleccione un archivo de imagen/documento simulado.');
      return;
    }
    setMockDocUploading(true);
    try {
      await GuestDocumentService.uploadDocument(
        resortId,
        bookingId,
        preCheckin?.guestId || 'primary',
        selectedDocType,
        selectedDocSide,
        'https://via.placeholder.com/600x400.png?text=Document_Copy_StayFlow',
        mockFileName
      );

      setMockFileName('');
      await loadPortalData();
    } catch (err) {
      console.error(err);
    } finally {
      setMockDocUploading(false);
    }
  };

  // Signature Submit
  const handleSubmitSignature = async () => {
    if (!signedName) {
      alert('Por favor ingrese su nombre para firmar digitalmente.');
      return;
    }
    if (!signatureBase64) {
      alert('Por favor, dibuje su firma digital en la pizarra.');
      return;
    }
    if (!isRulesChecked || !isPrivacyChecked || !isTermsChecked) {
      alert('Debe aceptar todas las condiciones, políticas y reglamentos antes de firmar.');
      return;
    }

    setSubmitting(true);
    try {
      // Save signature for rules
      await DigitalSignatureService.saveSignature(
        resortId,
        bookingId,
        preCheckin?.guestId || 'primary',
        signedName,
        'primary',
        signatureBase64,
        'internal_rules',
        '192.168.1.1',
        navigator.userAgent
      );

      // Save for privacy policy
      await DigitalSignatureService.saveSignature(
        resortId,
        bookingId,
        preCheckin?.guestId || 'primary',
        signedName,
        'primary',
        signatureBase64,
        'privacy_policy',
        '192.168.1.1',
        navigator.userAgent
      );

      // Save for terms
      await DigitalSignatureService.saveSignature(
        resortId,
        bookingId,
        preCheckin?.guestId || 'primary',
        signedName,
        'primary',
        signatureBase64,
        'terms_of_stay',
        '192.168.1.1',
        navigator.userAgent
      );

      // Update journey stage to checkin pending
      await GuestJourneyService.updateStage(resortId, bookingId, JourneyStage.CHECKIN_PENDING, 'guest');

      await loadPortalData();
      setActiveStep('stay');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Check-out & survey
  const handleSubmitCheckout = async () => {
    setSubmitting(true);
    try {
      await SurveyService.submitSurvey(resortId, bookingId, {
        guestId: preCheckin?.guestId || 'primary',
        overallRating: surveyOverall,
        cleanlinessRating: surveyClean,
        serviceRating: surveyService,
        facilitiesRating: surveyFacilities,
        comments: surveyComments,
      });

      // Update journey stage to checked_out
      await GuestJourneyService.updateStage(resortId, bookingId, JourneyStage.CHECKED_OUT, 'guest');

      await loadPortalData();
      setActiveStep('completed');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[500px]">
        <Clock className="h-10 w-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Sincronizando portal de huéspedes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-slate-900 text-slate-100 rounded-[3rem] border-[10px] border-slate-950 p-4 shadow-2xl relative overflow-hidden flex flex-col h-[750px] font-sans">
      {/* Phone Notch/Status Bar */}
      <div className="flex justify-between items-center px-4 py-1 text-xs text-slate-400 bg-slate-950/20 rounded-full mb-3 select-none">
        <span className="font-semibold">09:41</span>
        <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto -mt-2 absolute left-1/2 -translate-x-1/2" />
        <div className="flex items-center space-x-1.5">
          <Wifi className="h-3.5 w-3.5" />
          <Key className="h-3.5 w-3.5 text-emerald-400" />
        </div>
      </div>

      {/* Header */}
      <div className="px-3 pb-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Compass className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-bold tracking-tight text-slate-100">Portal de Huéspedes</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Main interactive viewport container */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 text-slate-200">
        
        {/* Welcome screen */}
        {activeStep === 'welcome' && (
          <div className="space-y-6 text-center py-6">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">¡Bienvenido a tu Estadía Digital!</h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Disfruta de una llegada sin fricciones. Completa tu Pre Check-in online, firma reglamentos y obtén llaves digitales.
              </p>
            </div>

            {/* Quick summary of reservation */}
            {journey && (
              <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl text-left text-xs space-y-2.5">
                <p className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px]">Detalles de Reserva</p>
                <div className="flex justify-between">
                  <span className="text-slate-400">Huésped Principal:</span>
                  <span className="font-medium text-slate-200">{preCheckin?.firstName} {preCheckin?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cabaña:</span>
                  <span className="font-medium text-slate-100">{journey.arrivalInfo.address.split(',')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Horarios Check-in:</span>
                  <span className="font-medium text-slate-200">{journey.arrivalInfo.checkInTime} hs</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveStep('precheckin')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              Comenzar Pre Check-in
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Pre Check-in Form Screen */}
        {activeStep === 'precheckin' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
              <UserCheck className="h-4 w-4" />
              <span>Paso 1: Datos Personales</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Complete la información obligatoria para su registro de hospedaje. Sus datos serán almacenados con absoluta seguridad.
            </p>

            <form onSubmit={handleSubmitPreCheckin} className="space-y-3.5 text-xs text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Nombre</label>
                  <input 
                    type="text" 
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Apellido</label>
                  <input 
                    type="text" 
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Tipo Doc</label>
                  <select 
                    value={formDocType}
                    onChange={(e) => setFormDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="DNI">DNI</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="CI">C.I.</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-400 font-medium">Número Documento</label>
                  <input 
                    type="text" 
                    required
                    value={formDocNum}
                    onChange={(e) => setFormDocNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Nacionalidad</label>
                  <input 
                    type="text" 
                    required
                    value={formNationality}
                    onChange={(e) => setFormNationality(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Fecha Nacimiento</label>
                  <input 
                    type="date" 
                    required
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Dirección de Domicilio</label>
                <input 
                  type="text" 
                  required
                  value={formAddress}
                  placeholder="Calle, Ciudad, Provincia, País"
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Teléfono</label>
                  <input 
                    type="tel" 
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold rounded-xl transition-all shadow-md mt-4"
              >
                {submitting ? 'Guardando...' : 'Siguiente Paso'}
              </button>
            </form>
          </div>
        )}

        {/* Companions Screen */}
        {activeStep === 'companions' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
              <Users className="h-4 w-4" />
              <span>Paso 2: Acompañantes</span>
            </div>

            <p className="text-[11px] text-slate-400">
              ¿Vienes acompañado? Registra los datos de las personas que se hospedarán contigo para agilizar su ingreso.
            </p>

            {companions.length === 0 ? (
              <div className="p-6 bg-slate-950/20 rounded-2xl border border-slate-800/50 text-center italic text-slate-500 text-xs">
                No hay acompañantes registrados aún.
              </div>
            ) : (
              <div className="space-y-2.5">
                {companions.map((c, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{c.firstName} {c.lastName}</p>
                      <p className="text-slate-400 text-[10px]">
                        {c.documentType} {c.documentNumber} | Nacimiento: {c.dateOfBirth}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCompanion(c.id)}
                      className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-slate-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showCompForm ? (
              <button
                onClick={() => setShowCompForm(true)}
                className="w-full py-2.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Acompañante
              </button>
            ) : (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3.5 text-xs text-left">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/80">
                  <span className="font-bold text-slate-300">Nuevo Acompañante</span>
                  <button onClick={() => setShowCompForm(false)} className="text-slate-400 hover:text-slate-200">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Nombre</label>
                    <input 
                      type="text" 
                      value={compFirstName}
                      onChange={(e) => setCompFirstName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Apellido</label>
                    <input 
                      type="text" 
                      value={compLastName}
                      onChange={(e) => setCompLastName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Tipo Doc</label>
                    <select 
                      value={compDocType}
                      onChange={(e) => setCompDocType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300"
                    >
                      <option value="DNI">DNI</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-slate-400 font-medium">Número Documento</label>
                    <input 
                      type="text" 
                      value={compDocNum}
                      onChange={(e) => setCompDocNum(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Nacionalidad</label>
                    <input 
                      type="text" 
                      value={compNationality}
                      onChange={(e) => setCompNationality(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">F. Nacimiento</label>
                    <input 
                      type="date" 
                      value={compBirthDate}
                      onChange={(e) => setCompBirthDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-400"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddCompanion}
                  className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500"
                >
                  Confirmar Acompañante
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveStep('signature')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold rounded-xl text-sm transition-all shadow-md mt-4"
            >
              Continuar a Firmar
            </button>
          </div>
        )}

        {/* Digital Signature screen */}
        {activeStep === 'signature' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
              <FileSignature className="h-4 w-4" />
              <span>Paso 3: Firma Electrónica</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Acepte los términos de hospedaje y dibuje su firma para confirmar su conformidad legal.
            </p>

            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-3.5 text-xs text-left max-h-40 overflow-y-auto leading-relaxed text-slate-300">
              <p className="font-bold text-slate-200">Reglamento Interno StayFlow:</p>
              <p>1. El horario de silencio rige de 22:00 a 08:00 hs.</p>
              <p>2. Se prohíbe fumar dentro de las cabañas y áreas cubiertas.</p>
              <p>3. El cuidado de las instalaciones es responsabilidad del huésped.</p>
              <p>4. No se admiten visitas ajenas al complejo sin previo registro.</p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2.5 text-left text-xs">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isRulesChecked} 
                  onChange={(e) => setIsRulesChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-800 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
                />
                <span className="text-slate-300 text-[11px]">Acepto los términos del Reglamento Interno del complejo</span>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPrivacyChecked} 
                  onChange={(e) => setIsPrivacyChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-800 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
                />
                <span className="text-slate-300 text-[11px]">Acepto la Política de Tratamiento de Datos y Privacidad</span>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isTermsChecked} 
                  onChange={(e) => setIsTermsChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-800 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
                />
                <span className="text-slate-300 text-[11px]">Confirmo los datos informados en la ficha de ingreso digital</span>
              </label>
            </div>

            {/* Signer Full Name */}
            <div className="space-y-1 text-left text-xs">
              <label className="text-slate-400 font-medium">Nombre Completo del Firmante</label>
              <input 
                type="text" 
                required
                value={signedName}
                placeholder="Escriba su nombre exactamente"
                onChange={(e) => setSignedName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>

            {/* Drawing board */}
            <div className="space-y-1.5 text-left text-xs">
              <div className="flex justify-between items-center">
                <label className="text-slate-400 font-medium">Firme dentro del cuadro</label>
                <button onClick={clearCanvas} className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-semibold">
                  Borrar trazo
                </button>
              </div>
              <div className="bg-white rounded-xl overflow-hidden border border-slate-800">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={120}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[120px] touch-none cursor-crosshair bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleSubmitSignature}
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold rounded-xl text-sm transition-all shadow-md mt-4"
            >
              {submitting ? 'Registrando firma...' : 'Firmar y Continuar'}
            </button>
          </div>
        )}

        {/* Document upload screen */}
        {activeStep === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
              <UploadCloud className="h-4 w-4" />
              <span>Paso 4: Adjuntar Identificación</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Adjunte una foto clara de su DNI, Pasaporte o Licencia de conducir para validar su identidad al arribar.
            </p>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3.5 text-xs text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Tipo Documento</label>
                  <select 
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300"
                  >
                    <option value="id_card">DNI / Tarjeta de ID</option>
                    <option value="passport">Pasaporte</option>
                    <option value="driver_license">Licencia de Conducir</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Cara del Documento</label>
                  <select 
                    value={selectedDocSide}
                    onChange={(e) => setSelectedDocSide(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300"
                  >
                    <option value="front">Frente</option>
                    <option value="back">Dorso</option>
                    <option value="all">Completo / Único</option>
                  </select>
                </div>
              </div>

              {/* Upload Dropzone simulation */}
              <div className="border border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950 rounded-xl p-5 text-center transition-colors cursor-pointer space-y-2 flex flex-col items-center">
                <UploadCloud className="h-8 w-8 text-slate-500" />
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-300">Arrastre su foto o haga click</span>
                  <p className="text-[10px] text-slate-500">Soporta PNG, JPG, PDF (máx 10MB)</p>
                </div>
                {/* Simulated file selector */}
                <input 
                  type="text" 
                  placeholder="Simular nombre de archivo (ej: dni_frente.jpg)" 
                  value={mockFileName}
                  onChange={(e) => setMockFileName(e.target.value)}
                  className="w-full max-w-xs mt-2 bg-slate-900 border border-slate-800 text-center rounded text-slate-300 py-1"
                />
              </div>

              <button
                onClick={handleUploadDocumentSim}
                disabled={mockDocUploading}
                className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500"
              >
                {mockDocUploading ? 'Subiendo copia...' : 'Subir Documento'}
              </button>
            </div>

            {/* List uploaded documents */}
            {documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider text-left">Documentos Cargados ({documents.length})</p>
                {documents.map((d, i) => (
                  <div key={i} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-slate-300 uppercase text-[10px] bg-slate-900 px-1.5 py-0.5 rounded mr-1">
                          {d.documentType}
                        </span>
                        <span className="text-slate-400 text-[11px]">{d.fileName}</span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setActiveStep('stay')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold rounded-xl text-sm transition-all shadow-md mt-4"
            >
              Continuar a Mi Estadía
            </button>
          </div>
        )}

        {/* Welcome stay screen (horarios, wifi, contact, check-out button) */}
        {activeStep === 'stay' && journey && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
              <BookOpen className="h-4 w-4" />
              <span>Guía del Huésped & Estadía</span>
            </div>

            {/* Stage indicator banner */}
            <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between text-left">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Estado de Check-in</span>
                <p className="text-sm font-extrabold text-slate-100">
                  {journey.stage === JourneyStage.CHECKED_IN || journey.stage === JourneyStage.IN_STAY ? '¡Bienvenido! Estás hospedado.' : 'Tu Check-in está listo'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {journey.stage === JourneyStage.CHECKED_IN || journey.stage === JourneyStage.IN_STAY ? 'Disfruta al máximo del complejo.' : 'Presenta tu código de acceso en recepción.'}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
            </div>

            {/* Access Code widget */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Código de Entrada</span>
              <h3 className="text-3xl font-black text-emerald-400 tracking-wider font-mono">
                {journey.arrivalInfo.accessCode || 'SF-9901'}
              </h3>
            </div>

            {/* CMS Info list */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 text-xs text-left space-y-3">
              <p className="font-semibold text-slate-300 flex items-center gap-1">
                <Info className="h-4 w-4 text-emerald-400" />
                Información Útil del Complejo
              </p>
              
              <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-slate-800/80">
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">Entrada (Check-in)</span>
                  <p className="text-slate-300 font-semibold">{journey.arrivalInfo.checkInTime} hs</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">Salida (Check-out)</span>
                  <p className="text-slate-300 font-semibold">{journey.arrivalInfo.checkOutTime} hs</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-slate-500 font-medium">Dirección del Complejo</span>
                  <p className="text-slate-300 font-semibold">{journey.arrivalInfo.address}</p>
                  <a href={journey.arrivalInfo.mapUrl} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:underline">
                    Ver en Google Maps
                  </a>
                </div>
              </div>

              {/* Wifi */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs mt-3">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="font-bold text-slate-300">{journey.arrivalInfo.wifiSsid}</p>
                    <p className="text-[10px] text-slate-500">Clave: {journey.arrivalInfo.wifiPassword}</p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                  Internet Libre
                </span>
              </div>

              {/* Parking */}
              {journey.arrivalInfo.parkingInstructions && (
                <div className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  <span className="font-semibold text-slate-300 block">Estacionamiento:</span>
                  {journey.arrivalInfo.parkingInstructions}
                </div>
              )}
            </div>

            {/* Check-out Activation button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setActiveStep('checkout')}
                className="w-full py-3 bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600/20 font-bold rounded-xl text-sm transition-all"
              >
                Comenzar Check-out Digital
              </button>
            </div>
          </div>
        )}

        {/* Check-out & survey screen */}
        {activeStep === 'checkout' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs text-rose-400 font-bold uppercase tracking-wider">
              <Clock className="h-4 w-4" />
              <span>Check-out & Calificación</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Complete su salida en segundos. Califique su estadía y solicite su factura si lo desea.
            </p>

            <div className="space-y-4 text-left text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {/* Ratings */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-200">Encuesta de Satisfacción</h5>
                
                {/* Overall Rating */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">¿Cómo calificarías tu estadía general?</span>
                  <div className="flex items-center space-x-2.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} onClick={() => setSurveyOverall(i + 1)}>
                        <Star className={`h-6 w-6 ${i < surveyOverall ? 'fill-current' : 'text-slate-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1 text-center">
                    <span className="text-slate-500 text-[10px]">Limpieza</span>
                    <div className="flex justify-center text-amber-500">
                      <select 
                        value={surveyClean} 
                        onChange={(e) => setSurveyClean(Number(e.target.value))}
                        className="bg-slate-950 border border-slate-800 rounded p-1 text-xs"
                      >
                        {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} ★</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-slate-500 text-[10px]">Atención</span>
                    <div className="flex justify-center text-amber-500">
                      <select 
                        value={surveyService} 
                        onChange={(e) => setSurveyService(Number(e.target.value))}
                        className="bg-slate-950 border border-slate-800 rounded p-1 text-xs"
                      >
                        {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} ★</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-slate-500 text-[10px]">Instalaciones</span>
                    <div className="flex justify-center text-amber-500">
                      <select 
                        value={surveyFacilities} 
                        onChange={(e) => setSurveyFacilities(Number(e.target.value))}
                        className="bg-slate-950 border border-slate-800 rounded p-1 text-xs"
                      >
                        {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} ★</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Incident report */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">¿Hubo alguna incidencia o problema?</label>
                <input 
                  type="text" 
                  value={checkoutIncident}
                  placeholder="Detalle si algo no funcionó (opcional)"
                  onChange={(e) => setCheckoutIncident(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              {/* Comments */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Dejar comentarios o sugerencias</label>
                <textarea 
                  value={surveyComments}
                  rows={2}
                  placeholder="Sus sugerencias nos ayudan a mejorar..."
                  onChange={(e) => setSurveyComments(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              {/* Invoice Request */}
              <label className="flex items-center space-x-2.5 cursor-pointer pt-1">
                <input 
                  type="checkbox" 
                  checked={requestInvoice} 
                  onChange={(e) => setRequestInvoice(e.target.checked)}
                  className="rounded border-slate-800 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
                />
                <span className="text-slate-300 text-[11px]">Solicitar factura de hospedaje por email</span>
              </label>
            </div>

            <button
              onClick={handleSubmitCheckout}
              disabled={submitting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-slate-100 font-bold rounded-xl text-sm transition-all shadow-md mt-4"
            >
              {submitting ? 'Registrando salida...' : 'Confirmar Check-out'}
            </button>
          </div>
        )}

        {/* Journey Completed Screen */}
        {activeStep === 'completed' && (
          <div className="space-y-6 text-center py-12">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">¡Check-out Exitoso!</h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Gracias por hospedarte en StayFlow. Tu salida digital ha sido registrada y tu encuesta ha sido enviada con éxito.
              </p>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-left text-xs space-y-2.5">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Próximos pasos</span>
              <p className="text-slate-300">📧 Enviaremos tu factura electrónica en las próximas horas.</p>
              <p className="text-slate-300">👋 ¡Esperamos verte pronto de regreso en nuestro resort!</p>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl font-bold hover:bg-slate-700"
              >
                Cerrar Simulador
              </button>
            )}
          </div>
        )}

      </div>

      {/* Phone Navigation Bar Line */}
      <div className="w-32 h-1 bg-slate-800 rounded-full mx-auto mt-2 shrink-0 select-none" />
    </div>
  );
};
