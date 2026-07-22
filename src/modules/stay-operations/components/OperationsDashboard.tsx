import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Wrench, 
  AlertTriangle, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  RefreshCw, 
  Plus, 
  User, 
  CheckCircle, 
  Play, 
  Check, 
  Clock, 
  Trash2, 
  FileText, 
  BarChart, 
  Activity, 
  Search, 
  Filter, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { accommodationRepository } from '../../accommodations/repositories/AccommodationRepository';
import { RoomStatusService } from '../services/RoomStatusService';
import { HousekeepingService } from '../services/HousekeepingService';
import { MaintenanceService } from '../services/MaintenanceService';
import { IncidentService } from '../services/IncidentService';
import { 
  RoomStatus, 
  HousekeepingTask, 
  MaintenanceOrder, 
  IncidentReport, 
  CleaningChecklist, 
  OperationalStatus, 
  OperationPriority, 
  HousekeepingType, 
  MaintenanceType, 
  IncidentCategory, 
  OperationLog 
} from '../types';
import { Accommodation } from '../../accommodations/types';

interface OperationsDashboardProps {
  resortId?: string;
  userId?: string;
  userName?: string;
}

const STAFF_LIST = [
  { id: 'staff_1', name: 'Marta Gómez', role: 'housekeeper', roleLabel: 'Housekeeping' },
  { id: 'staff_2', name: 'Juan Pérez', role: 'housekeeper', roleLabel: 'Housekeeping' },
  { id: 'staff_3', name: 'Carlos Rodríguez', role: 'maintenance', roleLabel: 'Mantenimiento' },
  { id: 'staff_4', name: 'Ana Martínez', role: 'inspector', roleLabel: 'Inspección' },
  { id: 'staff_5', name: 'Luis Sosa', role: 'maintenance', roleLabel: 'Mantenimiento' }
];

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  resortId = 'default-resort',
  userId = 'staff_admin',
  userName = 'Administrador de Operaciones'
}) => {
  // Tabs: 'summary' | 'rooms' | 'housekeeping' | 'maintenance' | 'incidents' | 'checklists' | 'logs'
  const [activeSubTab, setActiveSubTab] = useState<string>('summary');

  // Core Data
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([]);
  const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [checklists, setChecklists] = useState<CleaningChecklist[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);

  // Loading & Action feedback
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Forms Visibility & Field State
  const [isTaskFormOpen, setIsTaskFormOpen] = useState<boolean>(false);
  const [taskCabinId, setTaskCabinId] = useState<number | ''>('');
  const [taskType, setTaskType] = useState<HousekeepingType>('scheduled');
  const [taskPriority, setTaskPriority] = useState<OperationPriority>('medium');
  const [taskStaffId, setTaskStaffId] = useState<string>('');
  const [taskChecklistId, setTaskChecklistId] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState<string>('');

  const [isMaintFormOpen, setIsMaintFormOpen] = useState<boolean>(false);
  const [maintCabinId, setMaintCabinId] = useState<number | ''>('');
  const [maintType, setMaintType] = useState<MaintenanceType>('corrective');
  const [maintPriority, setMaintPriority] = useState<OperationPriority>('high');
  const [maintStaffId, setMaintStaffId] = useState<string>('');
  const [maintDesc, setMaintDesc] = useState<string>('');
  const [maintCost, setMaintCost] = useState<number>(0);
  const [maintStart, setMaintStart] = useState<string>('');
  const [maintEnd, setMaintEnd] = useState<string>('');

  const [isIncidentFormOpen, setIsIncidentFormOpen] = useState<boolean>(false);
  const [incCabinId, setIncCabinId] = useState<number | ''>('');
  const [incCategory, setIncCategory] = useState<IncidentCategory>('damage');
  const [incPriority, setIncPriority] = useState<OperationPriority>('medium');
  const [incDesc, setIncDesc] = useState<string>('');

  // Active Audit / Execution States
  const [activeTaskExec, setActiveTaskExec] = useState<HousekeepingTask | null>(null);
  const [execChecklistAnswers, setExecChecklistAnswers] = useState<Record<string, boolean>>({});
  const [execNotes, setExecNotes] = useState<string>('');

  const [activeTaskAudit, setActiveTaskAudit] = useState<HousekeepingTask | null>(null);
  const [auditNotes, setAuditNotes] = useState<string>('');

  // Search & Filter overrides
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch Accommodations
      const accList = await accommodationRepository.findAll(resortId);
      setAccommodations(accList);

      // Convert Accommodation list to matching Cabin array structure for status initialization
      const cabinsMock = accList.map(a => ({
        id: Number(a.id),
        name: a.name,
        status: a.status as any,
        price: (a as any).price || a.pricing?.basePrice || 0,
        capacity: a.capacity?.maxGuests || 2,
        featured: a.featured,
        active: a.visible
      }));

      // 2. Initialize Room Statuses
      const statuses = await RoomStatusService.initializeAllRoomStatuses(resortId, cabinsMock as any);
      setRoomStatuses(statuses);

      // 3. Fetch Operations entities
      const tasks = await HousekeepingService.getTasks(resortId);
      setHousekeepingTasks(tasks);

      const maint = await MaintenanceService.getOrders(resortId);
      setMaintenanceOrders(maint);

      const incReports = await IncidentService.getIncidents(resortId);
      setIncidents(incReports);

      const clTemplates = await HousekeepingService.getChecklists(resortId);
      setChecklists(clTemplates);

      const auditLogs = await RoomStatusService.getOperationLogs(resortId);
      setLogs(auditLogs);

    } catch (err) {
      console.error('Error loading operations data:', err);
      showToast('Error al cargar datos operativos de persistencia.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [resortId]);

  // Calculate Operational Metrics
  const metrics = useMemo(() => {
    const total = accommodations.length;
    
    // Status counts
    const statusCounts: Record<OperationalStatus, number> = {
      available: 0,
      occupied: 0,
      pending_cleaning: 0,
      in_cleaning: 0,
      clean: 0,
      inspection: 0,
      maintenance: 0,
      out_of_service: 0,
      blocked: 0
    };

    roomStatuses.forEach(r => {
      if (statusCounts[r.status] !== undefined) {
        statusCounts[r.status]++;
      }
    });

    const pendingCleaning = housekeepingTasks.filter(t => t.status === 'pending').length;
    const inCleaning = housekeepingTasks.filter(t => t.status === 'in_progress').length;
    const pendingMaint = maintenanceOrders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
    const unresolvedIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length;
    const urgentIncidents = incidents.filter(i => (i.priority === 'critical' || i.priority === 'high') && i.status !== 'resolved' && i.status !== 'closed').length;

    // Cleaning stats
    const completedTasks = housekeepingTasks.filter(t => t.status === 'completed' || t.status === 'inspected');
    const totalTasks = housekeepingTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 100;

    const avgCleanMin = completedTasks.length > 0 
      ? Math.round(completedTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0) / completedTasks.length) 
      : 30;

    return {
      total,
      byStatus: statusCounts,
      pendingCleaning,
      inCleaning,
      pendingMaint,
      unresolvedIncidents,
      urgentIncidents,
      completionRate,
      avgCleanMin
    };
  }, [accommodations, roomStatuses, housekeepingTasks, maintenanceOrders, incidents]);

  // --- ACTIONS ---

  // Room Status Quick Change
  const handleUpdateRoomStatus = async (cabinId: number, status: OperationalStatus) => {
    try {
      const cabin = accommodations.find(c => Number(c.id) === cabinId);
      if (!cabin) return;
      await RoomStatusService.updateRoomStatus(resortId, cabinId, cabin.name, status, userId, userName);
      showToast(`Estado de ${cabin.name} actualizado a "${status}"`);
      await loadAllData(true);
    } catch (err) {
      showToast('Error al actualizar estado operativo.');
    }
  };

  // Create Housekeeping Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskCabinId) return;

    try {
      const cabin = accommodations.find(c => Number(c.id) === taskCabinId);
      if (!cabin) return;

      const staff = STAFF_LIST.find(s => s.id === taskStaffId);

      await HousekeepingService.createTask(resortId, {
        cabinId: Number(taskCabinId),
        cabinName: cabin.name,
        type: taskType,
        priority: taskPriority,
        assignedStaffId: taskStaffId,
        assignedStaffName: staff?.name || 'Sin asignar',
        notes: taskNotes,
        checklistId: taskChecklistId
      });

      showToast(`Tarea de limpieza creada para ${cabin.name}`);
      setIsTaskFormOpen(false);
      
      // Clear fields
      setTaskCabinId('');
      setTaskNotes('');
      setTaskStaffId('');
      setTaskChecklistId('');

      await loadAllData(true);
    } catch (err) {
      showToast('Error al registrar la tarea.');
    }
  };

  // Create Maintenance Order
  const handleCreateMaintOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintCabinId || !maintDesc) return;

    try {
      const cabin = accommodations.find(c => Number(c.id) === maintCabinId);
      if (!cabin) return;

      const staff = STAFF_LIST.find(s => s.id === maintStaffId);

      await MaintenanceService.createOrder(resortId, {
        cabinId: Number(maintCabinId),
        cabinName: cabin.name,
        type: maintType,
        priority: maintPriority,
        assignedStaffId: maintStaffId,
        assignedStaffName: staff?.name || 'Sin asignar',
        issueDescription: maintDesc,
        cost: maintCost,
        startDate: maintStart || undefined,
        endDate: maintEnd || undefined
      }, userId, userName);

      showToast(`Orden de mantenimiento creada para ${cabin.name}`);
      setIsMaintFormOpen(false);

      // Clear fields
      setMaintCabinId('');
      setMaintDesc('');
      setMaintStaffId('');
      setMaintCost(0);
      setMaintStart('');
      setMaintEnd('');

      await loadAllData(true);
    } catch (err) {
      showToast('Error al registrar orden de mantenimiento.');
    }
  };

  // Create Incident Report
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incCabinId || !incDesc) return;

    try {
      const cabin = accommodations.find(c => Number(c.id) === incCabinId);
      if (!cabin) return;

      await IncidentService.reportIncident(resortId, {
        cabinId: Number(incCabinId),
        cabinName: cabin.name,
        category: incCategory,
        priority: incPriority,
        reportedBy: userName,
        description: incDesc
      });

      showToast(`Incidencia registrada para ${cabin.name}`);
      setIsIncidentFormOpen(false);

      setIncCabinId('');
      setIncDesc('');

      await loadAllData(true);
    } catch (err) {
      showToast('Error al registrar la incidencia.');
    }
  };

  // Housekeeping Staff Actions
  const handleStartTask = async (task: HousekeepingTask) => {
    try {
      await HousekeepingService.startTask(resortId, task.id, userId, userName);
      showToast(`Limpieza iniciada en ${task.cabinName}`);
      await loadAllData(true);
    } catch (err) {
      showToast('Error al iniciar limpieza.');
    }
  };

  const handleOpenExecution = (task: HousekeepingTask) => {
    setActiveTaskExec(task);
    setExecNotes(task.notes || '');
    
    // Load checklist items
    const checklist = checklists.find(cl => cl.id === task.checklistId) || checklists[0];
    const initialAnswers: Record<string, boolean> = {};
    if (checklist) {
      checklist.items.forEach(item => {
        initialAnswers[item] = !!task.checklistAnswers?.[item];
      });
    }
    setExecChecklistAnswers(initialAnswers);
  };

  const handleSaveExecution = async () => {
    if (!activeTaskExec) return;
    try {
      await HousekeepingService.completeTask(resortId, activeTaskExec.id, {
        notes: execNotes,
        checklistAnswers: execChecklistAnswers
      }, userId, userName);

      showToast(`Limpieza completada en ${activeTaskExec.cabinName}`);
      setActiveTaskExec(null);
      await loadAllData(true);
    } catch (err) {
      showToast('Error al finalizar limpieza.');
    }
  };

  // Housekeeping Audit Action
  const handleOpenAudit = (task: HousekeepingTask) => {
    setActiveTaskAudit(task);
    setAuditNotes('');
  };

  const handleSaveAudit = async (approved: boolean) => {
    if (!activeTaskAudit) return;
    try {
      await HousekeepingService.inspectTask(resortId, activeTaskAudit.id, approved, {
        notes: auditNotes,
        auditorName: userName
      }, userId);

      showToast(approved 
        ? `Cabaña ${activeTaskAudit.cabinName} aprobada e inspeccionada. Ya disponible!` 
        : `Inspección rechazada para ${activeTaskAudit.cabinName}. Tarea re-abierta.`
      );
      setActiveTaskAudit(null);
      await loadAllData(true);
    } catch (err) {
      showToast('Error al auditar limpieza.');
    }
  };

  // Maintenance Actions
  const handleStartMaintOrder = async (orderId: string, cabinName: string) => {
    try {
      await MaintenanceService.startOrder(resortId, orderId, userId, userName);
      showToast(`Mantenimiento iniciado en ${cabinName}`);
      await loadAllData(true);
    } catch (err) {
      showToast('Error al iniciar mantenimiento.');
    }
  };

  const handleCompleteMaintOrder = async (orderId: string, cabinName: string) => {
    try {
      await MaintenanceService.completeOrder(resortId, orderId, {
        comments: 'Reparaciones realizadas con éxito.'
      }, userId, userName);
      showToast(`Mantenimiento completado para ${cabinName}`);
      await loadAllData(true);
    } catch (err) {
      showToast('Error al completar mantenimiento.');
    }
  };

  // Resolve Incident
  const handleResolveIncident = async (incidentId: string, cabinName: string) => {
    try {
      await IncidentService.updateStatus(resortId, incidentId, 'resolved', userId, userName);
      showToast(`Incidencia resuelta para ${cabinName}`);
      await loadAllData(true);
    } catch (err) {
      showToast('Error al resolver incidencia.');
    }
  };

  // Filter and search lists
  const filteredRooms = useMemo(() => {
    return roomStatuses.filter(r => {
      const matchesSearch = r.cabinName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [roomStatuses, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-forest animate-spin" />
        <span className="text-muted text-xs font-bold uppercase tracking-wider">Cargando Smart Operations Engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2.5"
          >
            <div className="w-2 h-2 rounded-full bg-forest animate-pulse" />
            <span className="text-xs font-semibold leading-none">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Sync */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-ink tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-forest" />
            <span>Smart Operations Panel</span>
          </h1>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            Gestión inteligente de Limpieza (Housekeeping), Mantenimiento operativo, Incidencias técnicas y Control en tiempo real del estado de cada alojamiento.
          </p>
        </div>
        <button 
          onClick={() => loadAllData(true)}
          disabled={refreshing}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-ink font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-forest' : ''}`} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* Dashboard Sub-Tabs navigation */}
      <div className="flex flex-wrap items-center gap-1 border-b border-line pb-2.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'summary', label: 'Vista General', Icon: BarChart },
          { id: 'rooms', label: 'Estado Operativo', Icon: Activity },
          { id: 'housekeeping', label: 'Limpieza (Housekeeping)', Icon: CheckSquare },
          { id: 'maintenance', label: 'Mantenimiento', Icon: Wrench },
          { id: 'incidents', label: 'Incidencias', Icon: AlertTriangle },
          { id: 'checklists', label: 'Checklists', Icon: ClipboardList },
          { id: 'logs', label: 'Auditoría / Logs', Icon: FileText }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'bg-forest text-white shadow-xs' 
                  : 'text-muted hover:text-ink hover:bg-slate-100'
              }`}
            >
              <tab.Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- RENDER SUBTAB: SUMMARY / VISTA GENERAL --- */}
      {activeSubTab === 'summary' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-line shadow-xs space-y-1.5">
              <span className="text-[10px] text-muted font-bold tracking-wider uppercase block">Limpieza Pendiente</span>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-ink">{metrics.pendingCleaning}</span>
                <span className="w-7 h-7 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-extrabold text-xs">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[10px] text-muted leading-none">Esperando asignación o inicio</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-line shadow-xs space-y-1.5">
              <span className="text-[10px] text-muted font-bold tracking-wider uppercase block">Limpieza En Curso</span>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-amber-600">{metrics.inCleaning}</span>
                <span className="w-7 h-7 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 animate-pulse">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[10px] text-muted leading-none">Personal trabajando actualmente</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-line shadow-xs space-y-1.5">
              <span className="text-[10px] text-muted font-bold tracking-wider uppercase block">Mantenimiento Activo</span>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-red-600">{metrics.pendingMaint}</span>
                <span className="w-7 h-7 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                  <Wrench className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[10px] text-muted leading-none">Órdenes de servicio activas</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-line shadow-xs space-y-1.5">
              <span className="text-[10px] text-muted font-bold tracking-wider uppercase block">Incidencias Críticas</span>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-red-700">{metrics.urgentIncidents}</span>
                <span className="w-7 h-7 bg-red-100 rounded-xl flex items-center justify-center text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[10px] text-muted leading-none">Afectan la disponibilidad</p>
            </div>
          </div>

          {/* Operational Status Chart & Performance summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-line shadow-xs space-y-4">
              <h3 className="font-display font-bold text-sm text-ink pb-2 border-b border-line flex items-center gap-2">
                <Activity className="w-4 h-4 text-forest" />
                <span>Estado Físico Actual del Complejo</span>
              </h3>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Disponible / Listo', count: metrics.byStatus.available, bg: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
                  { label: 'Ocupado', count: metrics.byStatus.occupied, bg: 'bg-indigo-50 text-indigo-800 border-indigo-100' },
                  { label: 'Sucia / Checkout', count: metrics.byStatus.pending_cleaning, bg: 'bg-amber-50 text-amber-800 border-amber-100' },
                  { label: 'En Limpieza', count: metrics.byStatus.in_cleaning, bg: 'bg-amber-100 text-amber-900 border-amber-200' },
                  { label: 'Limpia (S/I)', count: metrics.byStatus.clean, bg: 'bg-green-50 text-green-800 border-green-100' },
                  { label: 'Esperando Inspección', count: metrics.byStatus.inspection, bg: 'bg-teal-50 text-teal-800 border-teal-100' },
                  { label: 'Mantenimiento', count: metrics.byStatus.maintenance, bg: 'bg-rose-50 text-rose-800 border-rose-100' },
                  { label: 'Fuera de Servicio', count: metrics.byStatus.out_of_service, bg: 'bg-slate-100 text-slate-800 border-slate-200' },
                  { label: 'Bloqueada', count: metrics.byStatus.blocked, bg: 'bg-purple-50 text-purple-800 border-purple-100' }
                ].map((s, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${s.bg}`}>
                    <strong className="block text-lg font-black">{s.count}</strong>
                    <span className="text-[10px] font-bold block mt-1">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-line shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-ink pb-2 border-b border-line flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Productividad y Tiempos</span>
                </h3>

                <div className="space-y-4 pt-3">
                  <div>
                    <div className="flex justify-between items-center text-xs text-ink font-bold mb-1.5">
                      <span>Tasa de Finalización de Limpieza:</span>
                      <span>{metrics.completionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-forest h-full" style={{ width: `${metrics.completionRate}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-line flex items-center gap-3">
                    <Clock className="w-5 h-5 text-forest shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted font-bold uppercase block">Tiempo Promedio de Limpieza</span>
                      <strong className="text-sm font-black text-ink">{metrics.avgCleanMin} Minutos</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-800 text-xs flex gap-2">
                <Info className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <p className="leading-normal">
                  <strong>Regla Automatizada:</strong> Procesar un Check-Out cambia la habitación a <em>Sucia</em> y agenda una tarea de limpieza automática. Completar la limpieza la libera a <em>Disponible</em> tras inspección.
                </p>
              </div>
            </div>
          </div>

          {/* Quick task assignment dashboard view */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-forest" />
              <span>Personal de Operaciones de Turno</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {STAFF_LIST.map((staff) => {
                const activeTasks = housekeepingTasks.filter(t => t.assignedStaffId === staff.id && (t.status === 'pending' || t.status === 'in_progress')).length + 
                                    maintenanceOrders.filter(o => o.assignedStaffId === staff.id && (o.status === 'pending' || o.status === 'in_progress')).length;
                return (
                  <div key={staff.id} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <strong className="block text-xs font-bold">{staff.name}</strong>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">{staff.roleLabel}</span>
                    <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400">
                      <span>Tareas activas:</span>
                      <strong className={activeTasks > 0 ? 'text-amber-400 font-extrabold' : 'text-slate-500'}>{activeTasks}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- RENDER SUBTAB: ROOM STATUS / ESTADO OPERATIVO --- */}
      {activeSubTab === 'rooms' && (
        <div className="space-y-6">
          {/* Filters & Actions bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-1 w-full sm:max-w-md gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted" />
                <input 
                  type="text" 
                  placeholder="Buscar cabaña o alojamiento..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-line bg-white text-xs font-semibold outline-none focus:border-forest"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[44px] rounded-xl border border-line px-3 bg-white text-xs font-bold text-ink outline-none"
              >
                <option value="all">Filtro: Todos</option>
                <option value="available">🟢 Disponible / Listo</option>
                <option value="occupied">🔴 Ocupado</option>
                <option value="pending_cleaning">🧹 Sucio (Checkout)</option>
                <option value="in_cleaning">🧹 En Limpieza</option>
                <option value="clean">✨ Limpio (Esperando Inspección)</option>
                <option value="maintenance">🔧 Mantenimiento</option>
                <option value="out_of_service">❌ Fuera de Servicio</option>
              </select>
            </div>
          </div>

          {/* Grid of rooms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const cabinInfo = accommodations.find(c => Number(c.id) === room.cabinId);
              return (
                <div key={room.id} className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden flex flex-col justify-between">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <strong className="block text-sm font-bold text-ink">{room.cabinName}</strong>
                        {cabinInfo && (
                          <span className="text-[10px] text-muted">Capacidad: {cabinInfo.capacity?.maxGuests} pers · {((cabinInfo as any).price || cabinInfo.pricing?.basePrice) ? `$${((cabinInfo as any).price || cabinInfo.pricing?.basePrice)}/noche` : ''}</span>
                        )}
                      </div>

                      <select
                        value={room.status}
                        onChange={(e) => handleUpdateRoomStatus(room.cabinId, e.target.value as OperationalStatus)}
                        className={`text-[10px] font-black rounded-lg px-2.5 py-1 outline-none border cursor-pointer ${
                          room.status === 'available' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          room.status === 'occupied' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                          room.status === 'pending_cleaning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          room.status === 'in_cleaning' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                          room.status === 'clean' ? 'bg-green-50 text-green-800 border-green-200' :
                          room.status === 'maintenance' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="available">🟢 Disponible / Listo</option>
                        <option value="occupied">🔴 Ocupado</option>
                        <option value="pending_cleaning">🧹 Sucio / Checkout</option>
                        <option value="in_cleaning">🧹 En Limpieza</option>
                        <option value="clean">✨ Limpio</option>
                        <option value="inspection">🔎 En Inspección</option>
                        <option value="maintenance">🔧 En Mantenimiento</option>
                        <option value="out_of_service">❌ Fuera de Servicio</option>
                        <option value="blocked">🔒 Bloqueada</option>
                      </select>
                    </div>

                    <div className="text-[10px] text-muted space-y-1 pt-1.5 border-t border-line/50 font-mono">
                      <div className="flex justify-between">
                        <span>Última Limpieza:</span>
                        <span className="font-semibold text-ink">{room.lastCleanedAt ? new Date(room.lastCleanedAt).toLocaleDateString('es-AR') : 'No registrada'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Última Inspección:</span>
                        <span className="font-semibold text-ink">{room.lastInspectedAt ? new Date(room.lastInspectedAt).toLocaleDateString('es-AR') : 'No registrada'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 border-t border-line flex justify-between gap-2">
                    {/* Action buttons */}
                    <button
                      onClick={() => {
                        setTaskCabinId(room.cabinId);
                        setTaskType('scheduled');
                        setIsTaskFormOpen(true);
                        setActiveSubTab('housekeeping');
                      }}
                      className="text-[10px] bg-white hover:bg-slate-100 border border-line px-2.5 py-1.5 rounded-lg text-ink font-bold cursor-pointer transition-all flex items-center gap-1"
                    >
                      <CheckSquare className="w-3 h-3 text-forest" />
                      <span>Limpieza</span>
                    </button>

                    <button
                      onClick={() => {
                        setMaintCabinId(room.cabinId);
                        setIsMaintFormOpen(true);
                        setActiveSubTab('maintenance');
                      }}
                      className="text-[10px] bg-white hover:bg-slate-100 border border-line px-2.5 py-1.5 rounded-lg text-ink font-bold cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Wrench className="w-3 h-3 text-red-500" />
                      <span>Mantenimiento</span>
                    </button>

                    <button
                      onClick={() => {
                        setIncCabinId(room.cabinId);
                        setIsIncidentFormOpen(true);
                        setActiveSubTab('incidents');
                      }}
                      className="text-[10px] bg-white hover:bg-slate-100 border border-line px-2.5 py-1.5 rounded-lg text-ink font-bold cursor-pointer transition-all flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Incidencia</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- RENDER SUBTAB: HOUSEKEEPING / TAREAS DE LIMPIEZA --- */}
      {activeSubTab === 'housekeeping' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex justify-between items-center">
            <h3 className="font-display font-extrabold text-sm text-ink uppercase tracking-wider">Ordenes de Trabajo de Limpieza</h3>
            <button
              onClick={() => setIsTaskFormOpen(!isTaskFormOpen)}
              className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nueva Tarea</span>
            </button>
          </div>

          {/* Form to Create Task */}
          <AnimatePresence>
            {isTaskFormOpen && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateTask}
                className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-4 overflow-hidden"
              >
                <h4 className="font-bold text-xs text-ink uppercase tracking-wide">Nueva Solicitud de Limpieza</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Alojamiento *</label>
                    <select
                      value={taskCabinId}
                      onChange={(e) => setTaskCabinId(Number(e.target.value))}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white outline-none focus:border-forest font-semibold"
                      required
                    >
                      <option value="">-- Seleccionar Cabaña --</option>
                      {accommodations.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Tipo de Tarea</label>
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value as HousekeepingType)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold"
                    >
                      <option value="check_out">Check-Out (Salida de huésped)</option>
                      <option value="guest_change">Cambio de huésped</option>
                      <option value="scheduled">Programada / Rutinaria</option>
                      <option value="manual">Manual / Especial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Prioridad</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as OperationPriority)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold text-amber-800"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta / Prioridad entrada</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Personal Asignado</label>
                    <select
                      value={taskStaffId}
                      onChange={(e) => setTaskStaffId(e.target.value)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold"
                    >
                      <option value="">Sin asignar (Bolsa de trabajo)</option>
                      {STAFF_LIST.filter(s => s.role === 'housekeeper').map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Checklist Aplicable</label>
                    <select
                      value={taskChecklistId}
                      onChange={(e) => setTaskChecklistId(e.target.value)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold"
                    >
                      <option value="">Ninguno / Por defecto</option>
                      {checklists.map(cl => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Instrucciones / Notas</label>
                    <input
                      type="text"
                      placeholder="Ej: El huésped solicita especial atención al jacuzzi."
                      value={taskNotes}
                      onChange={(e) => setTaskNotes(e.target.value)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2.5 text-xs bg-white outline-none focus:border-forest"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-line/50">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-forest hover:bg-forest-hover text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Asignar Tarea
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTaskFormOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List of Tasks */}
          <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-line">
              <span className="text-[11px] text-muted font-bold tracking-wider uppercase">Listado de Órdenes de Trabajo Activas</span>
            </div>

            {housekeepingTasks.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted font-bold">No hay tareas de limpieza registradas en el resort.</p>
            ) : (
              <div className="divide-y divide-line">
                {housekeepingTasks.map((task) => (
                  <div key={task.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-ink">{task.cabinName}</strong>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          task.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          task.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          task.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                          'bg-emerald-500 text-white'
                        }`}>
                          {task.status === 'pending' ? 'Pendiente' :
                           task.status === 'in_progress' ? 'En Curso' :
                           task.status === 'completed' ? 'Limpio (Auditar)' : 'Aprobado'}
                        </span>

                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                          task.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Prioridad: {task.priority}
                        </span>
                      </div>

                      <div className="text-xs text-muted flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                        <span><strong>Tipo:</strong> {task.type === 'check_out' ? 'Check-Out' : task.type === 'scheduled' ? 'Programada' : 'Manual'}</span>
                        <span><strong>Asignado:</strong> {task.assignedStaffName}</span>
                        {task.notes && <span><strong>Notas:</strong> <em className="text-ink">{task.notes}</em></span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Workflow execution buttons */}
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleStartTask(task)}
                          className="px-3 py-1.5 bg-forest hover:bg-forest-hover text-white text-[10px] font-extrabold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Iniciar Trabajo</span>
                        </button>
                      )}

                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleOpenExecution(task)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-white" />
                          <span>Finalizar Trabajo</span>
                        </button>
                      )}

                      {task.status === 'completed' && (
                        <button
                          onClick={() => handleOpenAudit(task)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-extrabold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Search className="w-3 h-3" />
                          <span>Auditar / Inspección</span>
                        </button>
                      )}

                      {task.status === 'inspected' && (
                        <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Listo
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Execution Checklists Overlay Modal */}
          {activeTaskExec && (
            <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white max-w-lg w-full rounded-2xl border border-line shadow-2xl p-6 space-y-4">
                <h4 className="font-display font-bold text-base text-ink flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-forest" />
                  <span>Completar Limpieza en {activeTaskExec.cabinName}</span>
                </h4>

                <div className="space-y-2 pt-2 border-t border-line">
                  <span className="block text-xs font-bold text-ink">Checklist de Auditoría Obligatorio:</span>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {Object.keys(execChecklistAnswers).map((item) => (
                      <label key={item} className="flex items-start gap-2 text-xs text-ink font-semibold select-none cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={execChecklistAnswers[item]}
                          onChange={(e) => setExecChecklistAnswers(prev => ({ ...prev, [item]: e.target.checked }))}
                          className="w-4 h-4 rounded text-forest focus:ring-forest mt-0.5"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Notas de Cierre de Tarea:</label>
                  <textarea
                    value={execNotes}
                    onChange={(e) => setExecNotes(e.target.value)}
                    rows={2}
                    placeholder="Escribe comentarios sobre las condiciones de la habitación o materiales usados..."
                    className="w-full rounded-xl border border-line p-2.5 text-xs bg-white resize-none outline-none focus:border-forest"
                  />
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-line">
                  <button
                    onClick={handleSaveExecution}
                    className="flex-1 min-h-[40px] bg-forest hover:bg-forest-hover text-white text-xs font-extrabold rounded-xl cursor-pointer"
                  >
                    Confirmar Finalizado
                  </button>
                  <button
                    onClick={() => setActiveTaskExec(null)}
                    className="flex-1 min-h-[40px] bg-slate-100 hover:bg-slate-200 text-ink text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quality Audit Overlay Modal */}
          {activeTaskAudit && (
            <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white max-w-md w-full rounded-2xl border border-line shadow-2xl p-6 space-y-4">
                <h4 className="font-display font-bold text-base text-ink flex items-center gap-2">
                  <Search className="w-5 h-5 text-teal-600" />
                  <span>Inspección de Calidad: {activeTaskAudit.cabinName}</span>
                </h4>

                <div className="space-y-2 border-t border-line/60 pt-3">
                  <span className="block text-[11px] text-muted font-bold tracking-wider uppercase">Respuestas de Checklist Completado:</span>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-line text-xs font-semibold text-ink">
                    {Object.entries(activeTaskAudit.checklistAnswers || {}).map(([item, checked]) => (
                      <div key={item} className="flex items-center gap-2 py-0.5">
                        <span className={checked ? "text-emerald-600" : "text-red-500"}>{checked ? "✓" : "✗"}</span>
                        <span className={checked ? "" : "line-through text-muted"}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Notas de Auditoría / Comentarios:</label>
                  <textarea
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    rows={2}
                    placeholder="Comentarios del supervisor de operaciones..."
                    className="w-full rounded-xl border border-line p-2.5 text-xs bg-white resize-none outline-none focus:border-forest"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveAudit(true)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl cursor-pointer"
                  >
                    Aprobar y Liberar Cabaña
                  </button>
                  <button
                    onClick={() => handleSaveAudit(false)}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl cursor-pointer"
                  >
                    Rechazar Limpieza
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- RENDER SUBTAB: MAINTENANCE / MANTENIMIENTO --- */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-extrabold text-sm text-ink uppercase tracking-wider">Órdenes de Mantenimiento Operativo</h3>
            <button
              onClick={() => setIsMaintFormOpen(!isMaintFormOpen)}
              className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Orden de Servicio</span>
            </button>
          </div>

          {/* Maint Form */}
          <AnimatePresence>
            {isMaintFormOpen && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateMaintOrder}
                className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-4 overflow-hidden"
              >
                <h4 className="font-bold text-xs text-ink uppercase tracking-wide">Registrar Problema Técnico / Servicio</h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Alojamiento *</label>
                    <select
                      value={maintCabinId}
                      onChange={(e) => setMaintCabinId(Number(e.target.value))}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold outline-none focus:border-forest"
                      required
                    >
                      <option value="">-- Seleccionar Cabaña --</option>
                      {accommodations.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Tipo de Mantenimiento</label>
                    <select
                      value={maintType}
                      onChange={(e) => setMaintType(e.target.value as MaintenanceType)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold"
                    >
                      <option value="corrective">Mantenimiento Correctivo (Averías)</option>
                      <option value="preventive">Mantenimiento Preventivo (Mantenimiento periódico)</option>
                      <option value="urgent">Urgente / Emergencia</option>
                      <option value="scheduled">Programado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Prioridad</label>
                    <select
                      value={maintPriority}
                      onChange={(e) => setMaintPriority(e.target.value as OperationPriority)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold text-amber-800"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica (Bloquear fechas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Técnico Asignado</label>
                    <select
                      value={maintStaffId}
                      onChange={(e) => setMaintStaffId(e.target.value)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold"
                    >
                      <option value="">Sin asignar (Bolsa de trabajo)</option>
                      {STAFF_LIST.filter(s => s.role === 'maintenance').map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Costo Estimado (ARS)</label>
                    <input
                      type="number"
                      value={maintCost}
                      onChange={(e) => setMaintCost(Number(e.target.value))}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2.5 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Bloqueo de Disponibilidad: Desde</label>
                    <input
                      type="date"
                      value={maintStart}
                      onChange={(e) => setMaintStart(e.target.value)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2.5 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Bloqueo de Disponibilidad: Hasta</label>
                    <input
                      type="date"
                      value={maintEnd}
                      onChange={(e) => setMaintEnd(e.target.value)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2.5 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Descripción de la Avería / Tarea *</label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Pérdida de agua en la grifería del lavamanos del baño principal."
                    value={maintDesc}
                    onChange={(e) => setMaintDesc(e.target.value)}
                    className="w-full rounded-xl border border-line p-2.5 text-xs bg-white outline-none focus:border-forest"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-line/50">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-forest hover:bg-forest-hover text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Registrar y Bloquear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMaintFormOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List */}
          <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-line">
              <span className="text-[11px] text-muted font-bold tracking-wider uppercase">Órdenes de Servicio Técnicas</span>
            </div>

            {maintenanceOrders.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted font-bold">No hay registros de mantenimiento activos.</p>
            ) : (
              <div className="divide-y divide-line">
                {maintenanceOrders.map((order) => (
                  <div key={order.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-ink">{order.cabinName}</strong>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          order.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          order.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          order.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'
                        }`}>
                          {order.status === 'pending' ? 'Pendiente' :
                           order.status === 'in_progress' ? 'Reparando' :
                           order.status === 'completed' ? 'Resuelto' : 'Cancelado'}
                        </span>

                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          order.priority === 'critical' ? 'bg-rose-100 text-rose-700 font-black animate-pulse' :
                          order.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Prioridad: {order.priority}
                        </span>
                      </div>

                      <p className="text-xs text-ink font-semibold mt-1">{order.issueDescription}</p>

                      <div className="text-[10px] text-muted flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono">
                        <span><strong>Tipo:</strong> {order.type}</span>
                        <span><strong>Asignado:</strong> {order.assignedStaffName}</span>
                        <span><strong>Costo:</strong> {order.cost > 0 ? `$${order.cost}` : 'No presupuestado'}</span>
                        {order.startDate && order.endDate && (
                          <span className="text-amber-600 font-bold">📅 Calendario Bloqueado: {order.startDate} al {order.endDate}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStartMaintOrder(order.id, order.cabinName)}
                          className="px-3 py-1.5 bg-forest hover:bg-forest-hover text-white text-[10px] font-extrabold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Iniciar Servicio</span>
                        </button>
                      )}

                      {order.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteMaintOrder(order.id, order.cabinName)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-white" />
                          <span>Marcar Solucionado</span>
                        </button>
                      )}

                      {order.status === 'completed' && (
                        <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Solucionado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- RENDER SUBTAB: INCIDENTS / INCIDENCIAS --- */}
      {activeSubTab === 'incidents' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-extrabold text-sm text-ink uppercase tracking-wider">Reporte de Incidencias Técnicas o Daños</h3>
            <button
              onClick={() => setIsIncidentFormOpen(!isIncidentFormOpen)}
              className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Reportar Nueva Incidencia</span>
            </button>
          </div>

          {/* Form */}
          <AnimatePresence>
            {isIncidentFormOpen && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleReportIncident}
                className="bg-white p-5 rounded-2xl border border-line shadow-sm space-y-4 overflow-hidden"
              >
                <h4 className="font-bold text-xs text-ink uppercase tracking-wide">Nuevo Reporte de Incidencia</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Alojamiento *</label>
                    <select
                      value={incCabinId}
                      onChange={(e) => setIncCabinId(Number(e.target.value))}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold outline-none focus:border-forest"
                      required
                    >
                      <option value="">-- Seleccionar Cabaña --</option>
                      {accommodations.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Categoría</label>
                    <select
                      value={incCategory}
                      onChange={(e) => setIncCategory(e.target.value as IncidentCategory)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold"
                    >
                      <option value="damage">Daños físicos / Rotura</option>
                      <option value="electrical">Fallo Eléctrico</option>
                      <option value="water">Agua / Sanitarios</option>
                      <option value="internet">Conexión WiFi / Smart TV</option>
                      <option value="ac">Aire Acondicionado / Calefacción</option>
                      <option value="lost_item">Objeto Perdido de Huésped</option>
                      <option value="other">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Prioridad / Gravedad</label>
                    <select
                      value={incPriority}
                      onChange={(e) => setIncPriority(e.target.value as OperationPriority)}
                      className="w-full min-h-[40px] rounded-lg border border-line px-2 text-xs bg-white font-semibold text-amber-800"
                    >
                      <option value="low">Leve (No requiere bloquear)</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta / Bloquear cabaña si es necesario</option>
                      <option value="critical">Crítica (Cabaña no habitable)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Descripción del Problema *</label>
                  <textarea
                    rows={2}
                    placeholder="Describe los detalles de la incidencia reportada por el huésped o el personal..."
                    value={incDesc}
                    onChange={(e) => setIncDesc(e.target.value)}
                    className="w-full rounded-xl border border-line p-2.5 text-xs bg-white outline-none focus:border-forest"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-line/50">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-forest hover:bg-forest-hover text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Registrar Incidencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIncidentFormOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List */}
          <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-line">
              <span className="text-[11px] text-muted font-bold tracking-wider uppercase">Listado de Incidencias Técnicas</span>
            </div>

            {incidents.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted font-bold">No hay incidencias técnicas registradas.</p>
            ) : (
              <div className="divide-y divide-line">
                {incidents.map((incident) => (
                  <div key={incident.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-ink">{incident.cabinName}</strong>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          incident.status === 'reported' ? 'bg-red-50 text-red-700 border border-red-200' :
                          incident.status === 'investigating' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-500 text-white'
                        }`}>
                          {incident.status === 'reported' ? 'Reportado' :
                           incident.status === 'investigating' ? 'Bajo Análisis' : 'Resuelto'}
                        </span>

                        <span className="text-[10px] text-muted font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold">Cat: {incident.category}</span>
                      </div>

                      <p className="text-xs text-ink font-semibold mt-1">{incident.description}</p>
                      <div className="text-[10px] text-muted pt-0.5">
                        Reportado por: <span className="text-ink font-bold">{incident.reportedBy}</span> el {new Date(incident.createdAt).toLocaleString('es-AR')}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {incident.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveIncident(incident.id, incident.cabinName)}
                          className="px-3 py-1.5 bg-forest hover:bg-forest-hover text-white text-[10px] font-extrabold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Marcar Resuelto</span>
                        </button>
                      )}

                      {incident.status === 'resolved' && (
                        <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Resuelto
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- RENDER SUBTAB: CHECKLISTS --- */}
      {activeSubTab === 'checklists' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-line shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-ink pb-2 border-b border-line flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-forest" />
              <span>Plantillas de Auditoría de Limpieza</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {checklists.map((cl) => (
                <div key={cl.id} className="p-4 rounded-xl border border-line bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="block text-xs font-black text-ink">{cl.name}</strong>
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{cl.category}</span>
                    </div>
                  </div>

                  <ul className="space-y-1 text-[11px] text-ink font-semibold list-disc pl-4">
                    {cl.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- RENDER SUBTAB: AUDIT LOGS --- */}
      {activeSubTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <span className="text-[11px] text-muted font-bold tracking-wider uppercase">Historial General de Operaciones (Audit Trail)</span>
            </div>

            {logs.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted font-bold">No hay registros de auditoría de operaciones en este complejo.</p>
            ) : (
              <div className="divide-y divide-line">
                {logs.map((log) => (
                  <div key={log.id} className="p-3.5 flex justify-between items-center text-xs hover:bg-slate-50/50 transition-colors">
                    <div>
                      <span className="text-muted font-mono block text-[10px]">{new Date(log.timestamp).toLocaleString('es-AR')}</span>
                      <strong className="text-ink font-bold">{log.description}</strong>
                      <span className="text-muted block text-[10px] pt-0.5">Operador: <strong className="text-ink">{log.userName}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsDashboard;
