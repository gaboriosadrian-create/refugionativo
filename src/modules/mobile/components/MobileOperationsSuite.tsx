import React, { useState, useRef, useEffect } from 'react';
import { useMobile } from '../contexts/MobileContexts';
import { 
  Wifi, 
  WifiOff, 
  LayoutDashboard, 
  CheckSquare, 
  Wrench, 
  Bell, 
  Smartphone, 
  Database, 
  User, 
  TrendingUp, 
  DollarSign, 
  Hotel, 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  Activity, 
  QrCode, 
  Search, 
  ChevronRight, 
  Power, 
  Plus, 
  Camera, 
  PenTool, 
  Cpu, 
  ShieldCheck, 
  FileText,
  Percent,
  Check,
  Battery,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MobileOperationsSuite: React.FC<{ onBackToPortal: () => void }> = ({ onBackToPortal }) => {
  const mobile = useMobile();
  const [activeTab, setActiveTab] = useState<'dash' | 'house' | 'maint' | 'desk' | 'system'>('dash');
  
  // Login states
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('mariana@example.com');
  const [loginRole, setLoginRole] = useState<'staff' | 'manager' | 'receptionist' | 'owner'>('staff');
  const [deviceId, setDeviceId] = useState<string>('iphone_15_pro_stayflow');
  const [deviceModel, setDeviceModel] = useState<string>('iPhone 15 Pro Max');

  // New ticket state
  const [showNewTicket, setShowNewTicket] = useState<boolean>(false);
  const [newTicketCabin, setNewTicketCabin] = useState<number>(1);
  const [newTicketDesc, setNewTicketDesc] = useState<string>('');
  const [newTicketType, setNewTicketType] = useState<'urgent' | 'preventive' | 'corrective'>('corrective');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTicketComments, setNewTicketComments] = useState<string>('');
  const [newTicketCost, setNewTicketCost] = useState<number>(0);

  // Search state
  const [deskSearch, setDeskSearch] = useState<string>('');
  const [showQrScanner, setShowQrScanner] = useState<boolean>(false);

  // Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [selectedOrderForSignature, setSelectedOrderForSignature] = useState<string | null>(null);

  // Housekeeping checklists
  const [selectedHkTask, setSelectedHkTask] = useState<any>(null);
  const [hkNotes, setHkNotes] = useState<string>('');
  const [hkChecklist, setHkChecklist] = useState<Record<string, boolean>>({
    'Sabanas cambiadas': false,
    'Toallas limpias': false,
    'Minibar recargado': false,
    'Bano desinfectado': false,
    'Ventilacion completada': false
  });

  // Maintenance complete details
  const [selectedMaintOrder, setSelectedMaintOrder] = useState<any>(null);
  const [maintComments, setMaintComments] = useState<string>('');
  const [maintCost, setMaintCost] = useState<number>(45);
  const [spareParts, setSpareParts] = useState<string>('');

  // Handle drawing canvas
  useEffect(() => {
    if (selectedOrderForSignature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [selectedOrderForSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mobile.loginMobile(loginEmail, loginRole, deviceId, deviceModel, 'iOS');
      setIsLogged(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSignatureSubmit = async (orderId: string) => {
    await mobile.completeMaintenance(orderId, maintComments || 'Mantenimiento completado con firma', maintCost);
    setSelectedOrderForSignature(null);
    setSelectedMaintOrder(null);
    setMaintComments('');
    setMaintCost(45);
  };

  // Auto pre-login if context has session already
  useEffect(() => {
    if (mobile.currentSession) {
      setIsLogged(true);
    }
  }, [mobile.currentSession]);

  const activeUserEmail = mobile.currentSession?.userEmail || 'mariana@example.com';
  const activeUserRole = mobile.currentSession?.role || 'staff';

  // Metrics for dashboard and executive counters
  const totalRooms = mobile.cachedAccommodations.length || 8;
  const occupiedRoomsCount = mobile.cachedAccommodations.filter(c => c.status === 'occupied').length || 2;
  const maintenanceRoomsCount = mobile.cachedAccommodations.filter(c => c.status === 'maintenance').length || 1;
  const availableRoomsCount = totalRooms - occupiedRoomsCount - maintenanceRoomsCount;
  
  const occupancyPct = Math.round((occupiedRoomsCount / totalRooms) * 100);
  const adr = 145; // Simulated Average Daily Rate
  const revpar = Math.round(adr * (occupancyPct / 100));
  const estimatedRevenue = occupiedRoomsCount * adr;

  // Filter tasks or orders by role (RBAC)
  const isAllowedToEditHousekeeping = activeUserRole === 'owner' || activeUserRole === 'manager' || activeUserRole === 'staff';
  const isAllowedToEditMaintenance = activeUserRole === 'owner' || activeUserRole === 'manager' || activeUserRole === 'staff';
  const isAllowedFrontDesk = activeUserRole === 'owner' || activeUserRole === 'manager' || activeUserRole === 'receptionist';

  if (!isLogged) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 border border-slate-200">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 text-indigo-600">
              <Smartphone className="w-10 h-10" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">StayFlow Mobile Suite</h1>
            <p className="text-xs text-slate-500 text-center mt-1">
              Plataforma móvil empresarial para operaciones diarias (PMS, Limpieza y Mantenimiento)
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email del Operador</label>
              <select 
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (e.target.value === 'mariana@example.com') setLoginRole('staff');
                  if (e.target.value === 'gaboriosadrian@gmail.com') setLoginRole('owner');
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="mariana@example.com">mariana@example.com (Housekeeping / Staff)</option>
                <option value="tecnico@stayflow.app">tecnico@stayflow.app (Maintenance / Tech)</option>
                <option value="recepcion@stayflow.app">recepcion@stayflow.app (Front Desk / Receptionist)</option>
                <option value="gaboriosadrian@gmail.com">gaboriosadrian@gmail.com (Owner / Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rol Operativo</label>
              <select 
                value={loginRole}
                onChange={(e: any) => setLoginRole(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="staff">Personal Operativo (Housekeeping/Maint)</option>
                <option value="receptionist">Recepcionista (Front Desk)</option>
                <option value="manager">Gerente de Operaciones</option>
                <option value="owner">Propietario / Super Admin</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ID de Dispositivo</label>
                <input 
                  type="text" 
                  value={deviceId} 
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Modelo Comercial</label>
                <input 
                  type="text" 
                  value={deviceModel} 
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-slate-500">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Seguridad & Multi-Device</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Este inicio registrará las credenciales biométricas, asignará un token de sesión seguro único en Firestore y vinculará la firma digital.
              </p>
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition-all shadow-md"
            >
              Autenticar Dispositivo & Acceder
            </button>
          </form>

          <button 
            onClick={onBackToPortal}
            className="w-full mt-4 text-center text-xs text-indigo-600 hover:underline cursor-pointer"
          >
            Regresar al Sitio Principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-4 px-2 sm:py-8 sm:px-4">
      
      {/* PHONE WRAPPER FOR SIMULATOR FEELING */}
      <div className="w-full max-w-md bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border-[12px] border-slate-900 flex flex-col relative aspect-[9/19.5] min-h-[820px] max-h-[920px]">
        
        {/* Dynamic Notch / Camera */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-3 h-3 bg-slate-800 rounded-full mr-4"></div>
          <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
        </div>

        {/* TOP STATUS BAR */}
        <div className="bg-slate-950 text-white px-6 pt-7 pb-2 flex items-center justify-between text-xs font-bold z-40 select-none">
          <div className="flex items-center gap-1">
            <span>09:41</span>
            {mobile.isOnline ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-amber-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-950 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-tight">
              {activeUserRole}
            </span>
            <div className="flex items-center gap-1 text-emerald-400">
              <Battery className="w-4 h-4" />
              <span className="text-[10px]">100%</span>
            </div>
          </div>
        </div>

        {/* APP TOP NAVIGATION BAR */}
        <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 leading-none">
                {activeUserEmail.split('@')[0]}
              </h2>
              <span className="text-[10px] text-slate-400 leading-none">StayFlow Mobile Ops</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* ALERT CENTER */}
            <div className="relative">
              <button 
                onClick={() => {
                  if (mobile.alerts.length > 0) {
                    alert(`Alertas del Dispositivo:\n\n` + mobile.alerts.map(a => `[${a.category.toUpperCase()}] ${a.title}: ${a.body}`).join('\n\n'));
                    mobile.clearAlerts();
                  } else {
                    alert('No hay nuevas notificaciones.');
                  }
                }}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {mobile.alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                    {mobile.alerts.length}
                  </span>
                )}
              </button>
            </div>

            {/* CONNECTIVITY SWAPPER */}
            <button 
              onClick={() => mobile.setOnline(!mobile.isOnline)}
              className={`px-2 py-1 rounded text-[10px] font-extrabold tracking-tight cursor-pointer uppercase transition-all flex items-center gap-1 ${
                mobile.isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {mobile.isOnline ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>

        {/* PENDING SYNC BANNER */}
        {mobile.pendingQueue.length > 0 && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-[10px] font-extrabold flex items-center justify-between select-none animate-pulse">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{mobile.pendingQueue.length} acciones guardadas en cola local</span>
            </div>
            <button 
              onClick={mobile.triggerSync}
              disabled={!mobile.isOnline}
              className="px-2 py-0.5 bg-slate-950 text-white rounded text-[9px] font-bold disabled:opacity-50 cursor-pointer"
            >
              Sincronizar
            </button>
          </div>
        )}

        {/* MAIN BODY WINDOW (SCROLLABLE) */}
        <div className="flex-1 bg-slate-50 overflow-y-auto pb-24 p-4 scrollbar-thin">
          <AnimatePresence mode="wait">
            
            {/* TABS 1: EXECUTIVE DASHBOARD */}
            {activeTab === 'dash' && (
              <motion.div 
                key="dash"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <h1 className="text-base font-extrabold text-slate-800">Dashboard Ejecutivo</h1>
                  <p className="text-[10px] text-slate-500">Métricas clave e ingresos del resort en tiempo real</p>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                      <Percent className="w-4 h-4 text-indigo-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Ocupación</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xl font-black text-slate-800">{occupancyPct}%</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">{occupiedRoomsCount} de {totalRooms} cabañas</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Ingresos Est.</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xl font-black text-slate-800">${estimatedRevenue}</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">ADR Promedio: ${adr}</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">RevPAR</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xl font-black text-slate-800">${revpar}</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">Rendimiento por unidad</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                      <Clock className="w-4 h-4 text-sky-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Last Sync</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-black text-slate-800 block truncate">
                        {new Date(mobile.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {mobile.isOnline ? 'Online Sync' : 'Offline Mode'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Operations Checklist Overview */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Estado Operativo</span>
                    <span className="text-[10px] text-slate-400">StayFlow Engine</span>
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-teal-500" />
                        <div>
                          <p className="text-[11px] font-bold text-slate-700">Limpiezas Pendientes</p>
                          <p className="text-[9px] text-slate-400">Housekeeping Tasks</p>
                        </div>
                      </div>
                      <span className="bg-teal-50 text-teal-700 font-bold text-xs px-2 py-0.5 rounded-full">
                        {mobile.cachedHousekeeping.filter(t => t.status === 'pending' || t.status === 'in_progress').length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-rose-500" />
                        <div>
                          <p className="text-[11px] font-bold text-slate-700">Órdenes Mantenimiento</p>
                          <p className="text-[9px] text-slate-400">Correctivos y Urgentes</p>
                        </div>
                      </div>
                      <span className="bg-rose-50 text-rose-700 font-bold text-xs px-2 py-0.5 rounded-full">
                        {mobile.cachedMaintenance.filter(o => o.status === 'pending' || o.status === 'in_progress').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick actions shortcut */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setActiveTab('house')}
                    className="p-3 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-xl text-indigo-700 text-left cursor-pointer transition-colors"
                  >
                    <CheckSquare className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold block">Limpieza</span>
                    <span className="text-[9px] text-indigo-500">Un solo toque</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('maint')}
                    className="p-3 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl text-rose-700 text-left cursor-pointer transition-colors"
                  >
                    <Wrench className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold block">Mantenimiento</span>
                    <span className="text-[9px] text-rose-500">Crear reporte técnico</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* TABS 2: HOUSEKEEPING MOBILE */}
            {activeTab === 'house' && (
              <motion.div 
                key="house"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-base font-extrabold text-slate-800">Housekeeping Mobile</h1>
                    <p className="text-[10px] text-slate-500">Optimizado para operar con una sola mano</p>
                  </div>
                </div>

                {!isAllowedToEditHousekeeping && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg font-bold">
                    Su rol operativo actual ({activeUserRole}) no permite modificar estados de limpieza.
                  </div>
                )}

                {/* Selected Task Details with Checklist */}
                {selectedHkTask ? (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-extrabold text-sm text-slate-800">Tarea: {selectedHkTask.cabinName}</h3>
                      <button 
                        onClick={() => setSelectedHkTask(null)}
                        className="text-xs text-indigo-600 font-bold"
                      >
                        Volver a la lista
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700 mb-1">Checklist de Limpieza Obligatorio</p>
                      {Object.keys(hkChecklist).map(item => (
                        <label key={item} className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-xs">
                          <input 
                            type="checkbox" 
                            checked={hkChecklist[item]}
                            disabled={!isAllowedToEditHousekeeping}
                            onChange={(e) => setHkChecklist(prev => ({ ...prev, [item]: e.target.checked }))}
                            className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-slate-700">{item}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600">Observaciones o Incidencias</label>
                      <textarea 
                        value={hkNotes}
                        disabled={!isAllowedToEditHousekeeping}
                        onChange={(e) => setHkNotes(e.target.value)}
                        placeholder="Agregar detalles de roturas, toallas faltantes..."
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-16"
                      />
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-lg flex items-center justify-between text-indigo-700 text-xs">
                      <span className="flex items-center gap-1">
                        <Camera className="w-4 h-4" />
                        <span>Subir fotografía</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded">
                        Simulado
                      </span>
                    </div>

                    {isAllowedToEditHousekeeping && (
                      <button 
                        onClick={async () => {
                          await mobile.completeHousekeeping(selectedHkTask.id, hkNotes, hkChecklist);
                          setSelectedHkTask(null);
                          setHkNotes('');
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                      >
                        Completar Limpieza e Inspeccionar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mobile.cachedHousekeeping.map(task => (
                      <div 
                        key={task.id}
                        className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-slate-200 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">{task.cabinName}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 font-extrabold uppercase rounded ${
                              (task.priority as string) === 'urgent' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-600'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Tipo: {task.type === 'check_out' ? 'Check-out' : 'Manual'} • {task.assignedStaffName}
                          </p>
                          {task.notes && (
                            <p className="text-[10px] text-indigo-600 italic">"{task.notes}"</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {task.status === 'pending' ? (
                            isAllowedToEditHousekeeping ? (
                              <button 
                                onClick={() => mobile.startHousekeeping(task.id)}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                              >
                                Iniciar
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Pendiente</span>
                            )
                          ) : task.status === 'in_progress' ? (
                            <button 
                              onClick={() => {
                                setSelectedHkTask(task);
                                setHkNotes(task.notes || '');
                              }}
                              className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <span>Trabajando</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Completa</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TABS 3: MAINTENANCE MOBILE */}
            {activeTab === 'maint' && (
              <motion.div 
                key="maint"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-base font-extrabold text-slate-800">Mantenimiento Suite</h1>
                    <p className="text-[10px] text-slate-500">Reporte de daños, firmas digitales y repuestos</p>
                  </div>
                  <button 
                    onClick={() => setShowNewTicket(true)}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-0.5 text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear</span>
                  </button>
                </div>

                {!isAllowedToEditMaintenance && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg font-bold">
                    Su rol operativo actual ({activeUserRole}) no permite modificar órdenes de mantenimiento.
                  </div>
                )}

                {/* Form to Create New Ticket */}
                {showNewTicket && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-md space-y-3 relative">
                    <button 
                      onClick={() => setShowNewTicket(false)}
                      className="absolute top-3 right-3 text-slate-400 font-bold"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Nueva Orden de Mantenimiento</h3>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600">Unidad Afectada</label>
                        <select 
                          value={newTicketCabin}
                          onChange={(e) => setNewTicketCabin(Number(e.target.value))}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          {mobile.cachedAccommodations.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600">Descripción del Daño</label>
                        <input 
                          type="text" 
                          value={newTicketDesc}
                          onChange={(e) => setNewTicketDesc(e.target.value)}
                          placeholder="Ej: Calefacción apagada o rota"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600">Tipo</label>
                          <select 
                            value={newTicketType}
                            onChange={(e: any) => setNewTicketType(e.target.value)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                          >
                            <option value="preventive">Preventivo</option>
                            <option value="corrective">Correctivo</option>
                            <option value="urgent">Urgente</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600">Prioridad</label>
                          <select 
                            value={newTicketPriority}
                            onChange={(e: any) => setNewTicketPriority(e.target.value)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                          >
                            <option value="low">Baja</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={async () => {
                          if (!newTicketDesc.trim()) return alert('Debe describir el problema.');
                          const cabin = mobile.cachedAccommodations.find(c => c.id === newTicketCabin);
                          await mobile.createMaintenance(
                            newTicketCabin,
                            cabin?.name || `Cabaña ${newTicketCabin}`,
                            newTicketType,
                            newTicketPriority,
                            newTicketDesc,
                            newTicketComments,
                            newTicketCost
                          );
                          setShowNewTicket(false);
                          setNewTicketDesc('');
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg"
                      >
                        Enviar Orden de Trabajo
                      </button>
                    </div>
                  </div>
                )}

                {/* Draw Signature modal inside view */}
                {selectedOrderForSignature && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-md space-y-4">
                    <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Firma Digital del Técnico</h3>
                    <p className="text-[10px] text-slate-500">Dibuje la firma abajo con el dedo para autorizar la entrega de repuestos.</p>
                    
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <canvas 
                        ref={canvasRef}
                        width={320}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseUp={endDrawing}
                        onMouseLeave={endDrawing}
                        onMouseMove={draw}
                        onTouchStart={startDrawing}
                        onTouchEnd={endDrawing}
                        onTouchMove={draw}
                        className="w-full cursor-crosshair block bg-white h-24"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={clearSignature}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Limpiar
                      </button>
                      <button 
                        onClick={() => handleSignatureSubmit(selectedOrderForSignature)}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Confirmar y Completar Orden
                      </button>
                    </div>
                  </div>
                )}

                {/* List of active orders */}
                <div className="space-y-2">
                  {mobile.cachedMaintenance.map(order => (
                    <div 
                      key={order.id}
                      className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800">{order.cabinName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          order.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-700 mt-1 font-semibold">"{order.issueDescription}"</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tipo: {order.type} • Prioridad: {order.priority}</p>

                      {order.status === 'pending' && isAllowedToEditMaintenance && (
                        <div className="mt-2 text-right">
                          <button 
                            onClick={() => mobile.startMaintenance(order.id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                          >
                            Aceptar Tarea
                          </button>
                        </div>
                      )}

                      {order.status === 'in_progress' && isAllowedToEditMaintenance && (
                        <div className="mt-2 space-y-2 bg-slate-50 p-2 rounded-lg">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-500">Costo Repuestos ($)</label>
                              <input 
                                type="number" 
                                value={maintCost}
                                onChange={(e) => setMaintCost(Number(e.target.value))}
                                className="w-full p-1 bg-white border border-slate-200 rounded text-xs" 
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-500">Observaciones</label>
                              <input 
                                type="text" 
                                value={maintComments}
                                onChange={(e) => setHkNotes(e.target.value)}
                                placeholder="Foco led reemplazado"
                                className="w-full p-1 bg-white border border-slate-200 rounded text-xs" 
                              />
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <button 
                              onClick={() => setSelectedOrderForSignature(order.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              <span>Completar con Firma</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TABS 4: FRONT DESK MOBILE */}
            {activeTab === 'desk' && (
              <motion.div 
                key="desk"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <h1 className="text-base font-extrabold text-slate-800">Front Desk Mobile</h1>
                  <p className="text-[10px] text-slate-500">Check-in, Check-out y asignación instantánea</p>
                </div>

                {!isAllowedFrontDesk && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg font-bold">
                    Su rol operativo actual ({activeUserRole}) no está autorizado para realizar operaciones de recepción.
                  </div>
                )}

                {/* QR Code scanning simulation */}
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-6 h-6 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Escanear QR de Huésped</p>
                      <p className="text-[9px] text-slate-400">Verificar identidad y reserva al instante</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowQrScanner(true);
                      setTimeout(() => {
                        setShowQrScanner(false);
                        alert('Código QR simulado escaneado con éxito! Huésped: "Adrián Gaborios"');
                        setDeskSearch('Adrián');
                      }, 2000);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Escanear
                  </button>
                </div>

                {showQrScanner && (
                  <div className="bg-slate-950 p-6 rounded-2xl flex flex-col items-center justify-center space-y-3">
                    <div className="w-32 h-32 border-4 border-dashed border-indigo-500 flex items-center justify-center animate-pulse">
                      <QrCode className="w-20 h-20 text-white" />
                    </div>
                    <span className="text-[10px] text-slate-400">Escaneando cámara trasera (simulado)</span>
                  </div>
                )}

                {/* Search query reservations */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Búsqueda rápida por nombre de huésped..." 
                    value={deskSearch}
                    onChange={(e) => setDeskSearch(e.target.value)}
                    className="w-full p-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Active/upcoming reservations */}
                <div className="space-y-2">
                  {mobile.cachedReservations
                    .filter(res => !deskSearch || res.guestName.toLowerCase().includes(deskSearch.toLowerCase()))
                    .map(b => (
                      <div 
                        key={b.id}
                        className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2 hover:border-slate-200 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-slate-800 block">{b.guestName}</span>
                            <span className="text-[9px] text-slate-400 font-mono">Reserva #{b.id}</span>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            b.status === 'occupied' || b.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {b.status}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <p>Cabaña asignada: <strong className="text-slate-700">{b.cabinName}</strong></p>
                          <p>Check-in: {b.checkIn} | Check-out: {b.checkOut}</p>
                          <p>Pax: {b.guestsCount} personas • Total: ${b.totalPrice}</p>
                        </div>

                        {isAllowedFrontDesk && (
                          <div className="flex gap-2 justify-end border-t border-slate-50 pt-2">
                            {(b.status === 'confirmed' || b.status === 'paid' || b.status === 'pending') && (
                              <button 
                                onClick={() => mobile.quickCheckIn(b.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Check-In Rápido
                              </button>
                            )}

                            {b.status === 'occupied' && (
                              <button 
                                onClick={() => mobile.quickCheckOut(b.id)}
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Registrar Check-Out
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* TABS 5: MOBILE DEVICE & OFFLINE CONFIGS */}
            {activeTab === 'system' && (
              <motion.div 
                key="system"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <h1 className="text-base font-extrabold text-slate-800">Configuración & Seguridad</h1>
                  <p className="text-[10px] text-slate-500">Manejo de dispositivos autorizados y logs de sincronización</p>
                </div>

                {/* Device summary info */}
                {mobile.currentDevice && (
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Smartphone className="w-5 h-5" />
                      <span className="text-xs font-black text-slate-800">Dispositivo Actual</span>
                    </div>

                    <div className="text-[10px] text-slate-600 space-y-0.5 font-mono">
                      <p>Modelo: {mobile.currentDevice.model}</p>
                      <p>SO: {mobile.currentDevice.os} (v{mobile.currentDevice.osVersion})</p>
                      <p>ID: {mobile.currentDevice.id}</p>
                      <p>Versión App: {mobile.currentDevice.appVersion}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                      <span className="text-[10px] text-slate-500 font-semibold">Autenticación Biométrica</span>
                      <button 
                        onClick={() => mobile.toggleBiometrics(!mobile.currentSession?.biometricRegistered)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                          mobile.currentSession?.biometricRegistered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {mobile.currentSession?.biometricRegistered ? 'Activada (FaceID)' : 'Configurar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Observability Platform Integration */}
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>Métricas de Observabilidad Móvil</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider block">API Latency</span>
                      <strong className="text-xs font-black text-slate-800">{mobile.metrics.apiLatencyMs} ms</strong>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider block">Optimized Payload</span>
                      <strong className="text-xs font-black text-slate-800">{mobile.metrics.payloadSizeKb} KB</strong>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider block">Battery Savings</span>
                      <strong className="text-xs font-black text-slate-800">+{mobile.metrics.batterySavingsPct}%</strong>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider block">Requests Count</span>
                      <strong className="text-xs font-black text-slate-800">{mobile.metrics.networkRequestsCount}</strong>
                    </div>
                  </div>
                </div>

                {/* Conflict Resolution panel */}
                {mobile.conflicts.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-700 text-xs font-extrabold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Conflicto de Sincronización Detectado</span>
                    </div>

                    {mobile.conflicts.map(c => (
                      <div key={c.id} className="bg-white p-2.5 rounded-lg border border-rose-100 space-y-2 text-[10px]">
                        <p className="text-slate-600">
                          Acción: <strong className="text-slate-800 font-mono">{c.actionType}</strong>
                        </p>
                        
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="bg-slate-50 p-1.5 rounded">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Local Edits</span>
                            <pre className="text-[9px] mt-0.5 text-indigo-700">{JSON.stringify(c.localData, null, 1)}</pre>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Server State</span>
                            <pre className="text-[9px] mt-0.5 text-emerald-700">{JSON.stringify(c.serverData, null, 1)}</pre>
                          </div>
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <button 
                            onClick={() => mobile.resolveSyncConflict(c.id, 'use_local')}
                            className="flex-1 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded"
                          >
                            Forzar Local
                          </button>
                          <button 
                            onClick={() => mobile.resolveSyncConflict(c.id, 'use_server')}
                            className="flex-1 py-1 bg-slate-200 text-slate-700 font-bold text-[9px] rounded"
                          >
                            Descartar
                          </button>
                          <button 
                            onClick={() => mobile.resolveSyncConflict(c.id, 'merge')}
                            className="flex-1 py-1 bg-teal-600 text-white font-bold text-[9px] rounded"
                          >
                            Mezclar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sync Logs */}
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2">
                  <h3 className="text-xs font-bold text-slate-800">Logs de Sincronización</h3>
                  
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {mobile.syncLogs.map(log => (
                      <div key={log.id} className="p-2 bg-slate-50 rounded-lg text-[10px] space-y-1">
                        <div className="flex items-center justify-between font-mono">
                          <span className={`font-bold ${log.status === 'success' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {log.status.toUpperCase()}
                          </span>
                          <span className="text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-normal">{log.details}</p>
                      </div>
                    ))}

                    {mobile.syncLogs.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic text-center py-4">No hay logs de sincronización todavía.</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={mobile.logoutMobile}
                    className="w-full py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Power className="w-4 h-4" />
                    <span>Cerrar Sesión Móvil</span>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* BOTTOM TAB NAV BAR */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-900 px-2 py-2.5 flex items-center justify-around text-slate-400 z-40 select-none">
          <button 
            onClick={() => setActiveTab('dash')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'dash' ? 'text-indigo-400 font-extrabold' : 'hover:text-white'}`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            <span className="text-[8px] uppercase tracking-wider">Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab('house')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'house' ? 'text-indigo-400 font-extrabold' : 'hover:text-white'}`}
          >
            <CheckSquare className="w-4.5 h-4.5" />
            <span className="text-[8px] uppercase tracking-wider">Limpieza</span>
          </button>

          <button 
            onClick={() => setActiveTab('maint')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'maint' ? 'text-indigo-400 font-extrabold' : 'hover:text-white'}`}
          >
            <Wrench className="w-4.5 h-4.5" />
            <span className="text-[8px] uppercase tracking-wider">Mantenimiento</span>
          </button>

          <button 
            onClick={() => setActiveTab('desk')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'desk' ? 'text-indigo-400 font-extrabold' : 'hover:text-white'}`}
          >
            <Hotel className="w-4.5 h-4.5" />
            <span className="text-[8px] uppercase tracking-wider">Recepción</span>
          </button>

          <button 
            onClick={() => setActiveTab('system')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'system' ? 'text-indigo-400 font-extrabold' : 'hover:text-white'}`}
          >
            <Smartphone className="w-4.5 h-4.5" />
            <span className="text-[8px] uppercase tracking-wider">Sistema</span>
          </button>
        </div>

        {/* Bottom indicator bar */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-full z-50"></div>

      </div>

      <p className="mt-4 text-xs text-slate-500 font-medium max-w-sm text-center leading-relaxed">
        StayFlow Multi-Tenant Mobile Sandbox • Conecte y desconecte el estado de red arriba para probar el modo <strong>Offline First</strong> y la resolución de conflictos.
      </p>

    </div>
  );
};
