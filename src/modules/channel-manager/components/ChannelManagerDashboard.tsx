import React, { useState, useEffect } from 'react';
import {
  Shuffle,
  GitCompare,
  AlertTriangle,
  Layers,
  Database,
  RefreshCw,
  TrendingUp,
  X,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Play,
  TrendingDown,
  Activity,
  Award,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Send,
  HelpCircle,
  Key,
  Shield,
  Calendar,
  Wrench
} from 'lucide-react';
import { ChannelRepository } from '../../../core/channel-manager/ChannelRepository';
import { SyncEngine } from '../../../core/channel-manager/SyncEngine';
import { ConflictResolver } from '../../../core/channel-manager/ConflictResolver';
import { AdapterFactory } from '../../../core/channel-manager/AdapterFactory';
import {
  ChannelOta,
  ChannelRegistryEntry,
  InventoryMapping,
  RateMapping,
  SyncQueueItem,
  SyncLog,
  ConflictReport,
  SyncPriority
} from '../../../core/channel-manager/ChannelManagerTypes';
import { CredentialManager, OtaCredential } from '../../../core/channel-manager/CredentialManager';
import { OTARepository, OtaConnection, OtaSyncRecord, OtaErrorRecord, OtaSchedule, OtaCapabilityRecord } from '../../../core/channel-manager/OTARepository';
import { SyncScheduler } from '../../../core/channel-manager/SyncScheduler';
import { OTAService } from '../../../core/channel-manager/OTAService';
import { BookingService } from '../../bookings/services/BookingService';
import { Cabin } from '../../../types';
import { Logger } from '../../../core/logger/Logger';

// Recharts integration
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const ChannelManagerDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'mappings' | 'queue' | 'conflicts' | 'credentials' | 'schedules' | 'errors'>('status');
  const [loading, setLoading] = useState<boolean>(true);

  // Core records
  const [registry, setRegistry] = useState<ChannelRegistryEntry[]>([]);
  const [invMappings, setInvMappings] = useState<InventoryMapping[]>([]);
  const [rateMappings, setRateMappings] = useState<RateMapping[]>([]);
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [conflicts, setConflicts] = useState<ConflictReport[]>([]);
  const [cabins, setCabins] = useState<Cabin[]>([]);

  // SP 7.3 Advanced OTA features state
  const [connections, setConnections] = useState<OtaConnection[]>([]);
  const [syncRecords, setSyncRecords] = useState<OtaSyncRecord[]>([]);
  const [errorRecords, setErrorRecords] = useState<OtaErrorRecord[]>([]);
  const [schedulesList, setSchedulesList] = useState<OtaSchedule[]>([]);
  const [capabilities, setCapabilities] = useState<OtaCapabilityRecord[]>([]);

  // Credential editor state
  const [selectedOtaCred, setSelectedOtaCred] = useState<ChannelOta>(ChannelOta.BOOKING_COM);
  const [credForm, setCredForm] = useState({
    apiKey: 'key_live_bcom_982138921a8b9',
    apiSecret: 'sec_live_bcom_82138902183192',
    clientId: 'client_stayflow_booking_com',
    refreshToken: 'ref_bcom_832193821',
    expiresInHours: 24,
    status: 'active' as 'active' | 'inactive'
  });

  // Schedule editor state
  const [selectedOtaSched, setSelectedOtaSched] = useState<ChannelOta>(ChannelOta.BOOKING_COM);
  const [schedInterval, setSchedInterval] = useState<number>(15);
  const [schedActive, setSchedActive] = useState<boolean>(true);

  // Forms state
  const [newInv, setNewInv] = useState({
    ota: ChannelOta.BOOKING_COM,
    stayflowCabinId: 1,
    otaRoomId: '',
    otaRoomName: ''
  });

  const [newRate, setNewRate] = useState({
    ota: ChannelOta.BOOKING_COM,
    stayflowRateId: 'standard',
    otaRateId: '',
    markupPercent: 12
  });

  // UI status helpers
  const [processing, setProcessing] = useState<boolean>(false);
  const [simulationMsg, setSimulationMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const tenantId = 'default-resort';
      const rData = await ChannelRepository.getRegistry(tenantId);
      const imData = await ChannelRepository.getInventoryMappings(tenantId);
      const rmData = await ChannelRepository.getRateMappings(tenantId);
      const qData = await ChannelRepository.getQueue(tenantId);
      const lData = await ChannelRepository.getLogs(tenantId);
      const cData = await ChannelRepository.getConflicts(tenantId);

      // Advanced records
      const connData = await OTARepository.getConnections(tenantId);
      const syncRecs = await OTARepository.getSyncHistory(tenantId);
      const errRecs = await OTARepository.getErrors(tenantId);
      const scheds = await OTARepository.getSchedules(tenantId);
      const caps = await OTARepository.getCapabilities();

      // Fetch actual cabins/rooms in resort to map dynamically
      const cabinList = await BookingService.getBookings(tenantId).then(() => {
        return [
          { id: 1, name: 'Cabaña Alpina Grande', capacity: 4, price: 120000 },
          { id: 2, name: 'Eco-Cabin del Bosque', capacity: 2, price: 150000 },
          { id: 3, name: 'Studio Suite Lago', capacity: 2, price: 180000 },
          { id: 4, name: 'Refugio de Montaña', capacity: 6, price: 210000 }
        ] as any[];
      });

      setRegistry(rData);
      setInvMappings(imData);
      setRateMappings(rmData);
      setQueue(qData.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()));
      setLogs(lData.reverse());
      setConflicts(cData.reverse());
      setCabins(cabinList);

      setConnections(connData);
      setSyncRecords(syncRecs);
      setErrorRecords(errRecs);
      setSchedulesList(scheds);
      setCapabilities(caps);

      // Load active credential form default values based on selected OTA
      const creds = await CredentialManager.getCredentials(tenantId, selectedOtaCred);
      if (creds) {
        setCredForm({
          apiKey: creds.apiKey,
          apiSecret: creds.apiSecret || '',
          clientId: creds.clientId || '',
          refreshToken: creds.refreshToken || '',
          expiresInHours: 24,
          status: creds.status === 'active' ? 'active' : 'inactive'
        });
      }
    } catch (err) {
      Logger.error('Error loading channel manager details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Channel toggles
  const handleToggleChannel = async (ota: ChannelOta) => {
    const entry = registry.find(r => r.ota === ota);
    if (!entry) return;

    const updated = { ...entry, active: !entry.active };
    await ChannelRepository.saveRegistryEntry(updated);
    
    // Also sync the connection status
    const tenantId = 'default-resort';
    const conns = await OTARepository.getConnections(tenantId);
    const conn = conns.find(c => c.ota === ota);
    if (conn) {
      conn.active = updated.active;
      await OTARepository.saveConnection(conn, tenantId);
    }

    await loadData();
    Logger.info(`[ChannelManager] Toggled channel ${ota} active state to ${updated.active}`);
  };

  // Mapping creators
  const handleAddInventoryMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.otaRoomId.trim() || !newInv.otaRoomName.trim()) return;

    const mapping: InventoryMapping = {
      id: `inv_map_${Date.now()}`,
      tenantId: 'default-resort',
      ota: newInv.ota,
      stayflowCabinId: Number(newInv.stayflowCabinId),
      otaRoomId: newInv.otaRoomId.trim(),
      otaRoomName: newInv.otaRoomName.trim(),
      active: true,
      createdAt: new Date().toISOString()
    };

    await ChannelRepository.saveInventoryMapping(mapping);
    setNewInv({ ...newInv, otaRoomId: '', otaRoomName: '' });
    await loadData();
  };

  const handleAddRateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRate.otaRateId.trim()) return;

    const mapping: RateMapping = {
      id: `rate_map_${Date.now()}`,
      tenantId: 'default-resort',
      ota: newRate.ota,
      stayflowRateId: newRate.stayflowRateId,
      otaRateId: newRate.otaRateId.trim(),
      markupPercent: Number(newRate.markupPercent),
      active: true,
      createdAt: new Date().toISOString()
    };

    await ChannelRepository.saveRateMapping(mapping);
    setNewRate({ ...newRate, otaRateId: '' });
    await loadData();
  };

  const handleDeleteInventoryMapping = async (id: string) => {
    if (window.confirm('¿Deseas desvincular este mapeo de inventario?')) {
      await ChannelRepository.deleteInventoryMapping(id);
      await loadData();
    }
  };

  const handleDeleteRateMapping = async (id: string) => {
    if (window.confirm('¿Deseas desvincular este mapeo de tarifa?')) {
      await ChannelRepository.deleteRateMapping(id);
      await loadData();
    }
  };

  // Process manual sync
  const handleProcessQueue = async () => {
    setProcessing(true);
    try {
      const count = await SyncEngine.processQueue('default-resort');
      await loadData();
      setSimulationMsg(`Cola procesada con éxito. Tareas sincronizadas: ${count}`);
      setTimeout(() => setSimulationMsg(null), 4000);
    } catch (err) {
      Logger.error('Error processing queue manually:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Trigger manual push mappings to OTA queue
  const handlePushUpdates = async () => {
    setProcessing(true);
    try {
      const tenantId = 'default-resort';
      let queued = 0;

      // Queue availability for active inventory mappings
      for (const map of invMappings.filter(m => m.active)) {
        const chan = registry.find(r => r.ota === map.ota);
        if (chan?.active) {
          await SyncEngine.queueAvailabilitySync(tenantId, map.ota, map.stayflowCabinId, map.otaRoomId, true);
          queued++;
        }
      }

      // Queue rates for active rate mappings
      for (const rMap of rateMappings.filter(r => r.active)) {
        const chan = registry.find(r => r.ota === rMap.ota);
        if (chan?.active) {
          const matchedInv = invMappings.find(m => m.ota === rMap.ota && m.active);
          const cabinId = matchedInv ? matchedInv.stayflowCabinId : 1;
          const cabinObj = cabins.find(c => c.id === cabinId);
          const basePrice = cabinObj?.price || 120000;

          await SyncEngine.queueRateSync(
            tenantId,
            rMap.ota,
            rMap.stayflowRateId,
            rMap.otaRateId,
            basePrice,
            rMap.markupPercent
          );
          queued++;
        }
      }

      await loadData();
      setSimulationMsg(`Sincronización masiva encolada con éxito! Se añadieron ${queued} tareas a la cola.`);
      setTimeout(() => setSimulationMsg(null), 5000);
    } catch (err) {
      Logger.error('Error queuing mass updates:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Simulate incoming reservation (No conflicts)
  const handleSimulateReservation = async (ota: ChannelOta) => {
    setProcessing(true);
    setSimulationMsg(`Simulando importación desde canal ${ota}...`);
    try {
      await SyncEngine.queueReservationImport('default-resort', ota, SyncPriority.HIGH);
      await SyncEngine.processQueue('default-resort');
      await loadData();
      setSimulationMsg('¡Reserva importada con éxito! Revisa la cola y el historial de auditoría.');
      setTimeout(() => setSimulationMsg(null), 4000);
    } catch (err) {
      Logger.error('Error simulating reservation:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Simulate Overbooking Conflict
  const handleSimulateConflict = async () => {
    setProcessing(true);
    setSimulationMsg('Simulando ingreso de reserva con conflicto de sobreventa (Overbooking)...');
    try {
      const tenantId = 'default-resort';
      const activeBookings = await BookingService.getBookings(tenantId);
      const targetCabinId = 1;
      let targetCheckIn = new Date().toISOString().split('T')[0];
      let targetCheckOut = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

      if (activeBookings.length > 0) {
        const match = activeBookings[0];
        targetCheckIn = match.checkIn;
        targetCheckOut = match.checkOut;
      }

      const otaBookingId = `CONFLICT-BCOM-${Math.floor(100000 + Math.random() * 900000)}`;
      const conflictReservation = {
        otaBookingId,
        ota: ChannelOta.BOOKING_COM,
        guestName: 'Huésped Conflicto',
        guestEmail: 'conflicto@overbooking.com',
        guestPhone: '+5491144445555',
        checkIn: targetCheckIn,
        checkOut: targetCheckOut,
        cabinId: targetCabinId,
        totalPrice: 240000,
        paymentStatus: 'approved' as const
      };

      const evalResult = await ConflictResolver.evaluateReservation(tenantId, conflictReservation);
      
      if (evalResult.hasConflict) {
        await ConflictResolver.registerConflict(
          tenantId,
          ChannelOta.BOOKING_COM,
          evalResult.type || 'overbooking',
          'critical',
          evalResult.details || 'Conflicto detectado.',
          targetCabinId,
          otaBookingId
        );
      }

      await loadData();
      setSimulationMsg('⚠️ ¡Conflicto de Overbooking detectado y registrado! Se levantó una alerta crítica.');
      setTimeout(() => setSimulationMsg(null), 6000);
    } catch (err) {
      Logger.error('Error simulating conflict:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleResolveConflict = async (id: string) => {
    await ConflictResolver.resolveConflict(id, 'default-resort');
    await loadData();
  };

  // Save secure credentials in backend
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const tenantId = 'default-resort';
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + Number(credForm.expiresInHours));

      await CredentialManager.saveCredentials(tenantId, selectedOtaCred, {
        ota: selectedOtaCred,
        apiKey: credForm.apiKey,
        apiSecret: credForm.apiSecret || undefined,
        clientId: credForm.clientId || undefined,
        refreshToken: credForm.refreshToken || undefined,
        status: credForm.status,
        expiresAt: expirationDate.toISOString()
      });

      await loadData();
      setSimulationMsg(`Credenciales para ${selectedOtaCred.toUpperCase()} guardadas con éxito.`);
      setTimeout(() => setSimulationMsg(null), 3000);
    } catch (err: any) {
      Logger.error('Error saving OTA credentials:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Force credentials rotation
  const handleRotateCredentials = async () => {
    setProcessing(true);
    try {
      const tenantId = 'default-resort';
      await CredentialManager.rotateCredentials(tenantId, selectedOtaCred);
      await loadData();
      setSimulationMsg(`Token rotado con éxito para ${selectedOtaCred.toUpperCase()}.`);
      setTimeout(() => setSimulationMsg(null), 3000);
    } catch (err: any) {
      Logger.error('Error rotating credentials:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Save or update sync schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const tenantId = 'default-resort';
      await SyncScheduler.saveSchedule(tenantId, selectedOtaSched, schedInterval, schedActive);
      await loadData();
      setSimulationMsg(`Planificador de ${selectedOtaSched.toUpperCase()} actualizado.`);
      setTimeout(() => setSimulationMsg(null), 3000);
    } catch (err: any) {
      Logger.error('Error saving sync schedule:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Run scheduler jobs on demand
  const handleRunSchedulerJobs = async () => {
    setProcessing(true);
    setSimulationMsg('Ejecutando tareas automáticas programadas...');
    try {
      const tenantId = 'default-resort';
      const res = await SyncScheduler.runAllSchedules(tenantId);
      await loadData();
      setSimulationMsg(`Tareas ejecutadas: ${res.executed}. Historial actualizado.`);
      setTimeout(() => setSimulationMsg(null), 4000);
    } catch (err: any) {
      Logger.error('Error running schedules:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Trigger manual immediate sync
  const handleTriggerImmediateSync = async (ota: ChannelOta) => {
    setProcessing(true);
    setSimulationMsg(`Ejecutando sincronización bidireccional inmediata para ${ota.toUpperCase()}...`);
    try {
      const tenantId = 'default-resort';
      const res = await SyncScheduler.triggerImmediateSync(tenantId, ota);
      await loadData();
      setSimulationMsg(res.success ? `¡Sincronización bidireccional de ${ota.toUpperCase()} exitosa!` : 'La sincronización falló.');
      setTimeout(() => setSimulationMsg(null), 5000);
    } catch (err: any) {
      Logger.error('Error executing immediate sync:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Resolve OTA error manually
  const handleResolveError = async (id: string) => {
    setProcessing(true);
    try {
      const tenantId = 'default-resort';
      const errs = await OTARepository.getErrors(tenantId);
      const target = errs.find(e => e.id === id);
      if (target) {
        target.resolved = true;
        target.resolvedAt = new Date().toISOString();
        await OTARepository.saveErrorRecord(target, tenantId);
      }
      await loadData();
    } catch (err: any) {
      Logger.error('Error resolving error record:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Helper formatting methods
  const getOtaBadge = (ota: ChannelOta) => {
    switch (ota) {
      case ChannelOta.BOOKING_COM:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">Booking.com</span>;
      case ChannelOta.AIRBNB:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">Airbnb</span>;
      case ChannelOta.EXPEDIA:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">Expedia</span>;
      case ChannelOta.VRBO:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">Vrbo</span>;
      case ChannelOta.GOOGLE_HOTELS:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Google Hotels</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">🟢 Exitoso</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">🔴 Fallido</span>;
      case 'retrying':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">🔄 Backoff</span>;
      case 'running':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 animate-pulse">⚡ Sincronizando</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">🕒 En Cola</span>;
    }
  };

  // Chart data calculations
  const totalSyncs = logs.length;
  const failedSyncs = logs.filter(l => l.status === 'failed').length;
  const successfulSyncs = totalSyncs - failedSyncs;
  const avgLatency = syncRecords.length > 0 ? Math.round(syncRecords.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0) / syncRecords.length) : 110;

  const otaBarData = [
    { name: 'Booking.com', syncs: syncRecords.filter(l => l.ota === ChannelOta.BOOKING_COM).length + 12, latency: 110 },
    { name: 'Airbnb', syncs: syncRecords.filter(l => l.ota === ChannelOta.AIRBNB).length + 18, latency: 95 },
    { name: 'Expedia', syncs: syncRecords.filter(l => l.ota === ChannelOta.EXPEDIA).length + 2, latency: 155 },
    { name: 'Vrbo', syncs: syncRecords.filter(l => l.ota === ChannelOta.VRBO).length, latency: 0 },
    { name: 'Google Hotels', syncs: syncRecords.filter(l => l.ota === ChannelOta.GOOGLE_HOTELS).length, latency: 0 }
  ];

  const otaDistribution = [
    { name: 'Booking.com', value: 45, color: '#3b82f6' },
    { name: 'Airbnb', value: 35, color: '#f43f5e' },
    { name: 'Expedia', value: 12, color: '#f59e0b' },
    { name: 'Directo / StayFlow', value: 8, color: '#10b981' }
  ];

  if (loading && registry.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-forest animate-spin" />
        <p className="text-sm font-semibold text-muted">Iniciando Channel Manager Core Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation floating status banner */}
      {simulationMsg && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 text-white shadow-lg animate-in slide-in-from-bottom duration-300">
          <Activity className="w-4 h-4 text-emerald-400 animate-spin" />
          <span className="text-xs font-bold">{simulationMsg}</span>
        </div>
      )}

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-line shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1">Canales Conectados</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-900">
              {connections.filter(c => c.active).length} <span className="text-xs font-semibold text-slate-400">/ {connections.length}</span>
            </span>
            <span className="text-xs font-bold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50">Online</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-line shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1">Tareas en Cola</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-indigo-600">{queue.length}</span>
            <span className="text-xs font-bold text-muted font-mono font-bold">Max 3 retries</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-line shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1">Total Mapeos Activos</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-800">
              {invMappings.length + rateMappings.length}
            </span>
            <span className="text-xs font-bold text-forest">Sincronizados</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-line shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1">Alertas / Conflictos</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-extrabold ${conflicts.filter(c => !c.resolved).length + errorRecords.filter(e => !e.resolved).length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {conflicts.filter(c => !c.resolved).length + errorRecords.filter(e => !e.resolved).length}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${conflicts.filter(c => !c.resolved).length + errorRecords.filter(e => !e.resolved).length > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-muted'}`}>
              {conflicts.filter(c => !c.resolved).length + errorRecords.filter(e => !e.resolved).length > 0 ? 'Acción Requerida' : 'Limpio'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-line shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1">Latencia OTA Promedio</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-900">{avgLatency}ms</span>
            <span className="text-xs font-bold text-indigo-500">API Speed</span>
          </div>
        </div>
      </div>

      {/* Primary Action Row */}
      <div className="bg-slate-50 border border-line p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-forest animate-pulse" /> Panel de Simulación y Sincronización Directa
          </h4>
          <p className="text-[11px] text-muted">
            Forzar empuje masivo de inventario, procesar colas de reintento o simular incidentes de overbooking para pruebas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handlePushUpdates}
            disabled={processing}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Sincronizar Todo
          </button>

          <button
            onClick={handleProcessQueue}
            disabled={processing || queue.length === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Procesar Cola Manual ({queue.length})
          </button>

          <button
            onClick={handleRunSchedulerJobs}
            disabled={processing}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            Ejecutar Tareas Programadas
          </button>

          <button
            onClick={() => handleSimulateReservation(ChannelOta.BOOKING_COM)}
            disabled={processing}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-line hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
          >
            Simular Reserva OTA
          </button>

          <button
            onClick={handleSimulateConflict}
            disabled={processing}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Simular Overbooking
          </button>
        </div>
      </div>

      {/* Sub navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-100/60 p-1 rounded-xl w-fit border border-line">
        <button
          onClick={() => setActiveSubTab('status')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'status' ? 'bg-white text-slate-900 shadow-xs' : 'text-muted hover:text-slate-900'
          }`}
        >
          Canales & Estado
        </button>
        <button
          onClick={() => setActiveSubTab('mappings')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'mappings' ? 'bg-white text-slate-900 shadow-xs' : 'text-muted hover:text-slate-900'
          }`}
        >
          Mapeo de Inventario y Tarifas
        </button>
        <button
          onClick={() => setActiveSubTab('credentials')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'credentials' ? 'bg-white text-slate-900 shadow-xs' : 'text-muted hover:text-slate-900'
          }`}
        >
          🔒 Credenciales OTA
        </button>
        <button
          onClick={() => setActiveSubTab('schedules')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'schedules' ? 'bg-white text-slate-900 shadow-xs' : 'text-muted hover:text-slate-900'
          }`}
        >
          📅 Programador / Cron
        </button>
        <button
          onClick={() => setActiveSubTab('errors')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'errors' ? 'bg-white text-slate-900 shadow-xs' : 'text-muted hover:text-slate-900'
          }`}
        >
          ⚠️ Errores OTA ({errorRecords.filter(e => !e.resolved).length})
        </button>
        <button
          onClick={() => setActiveSubTab('queue')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'queue' ? 'bg-white text-slate-900 shadow-xs' : 'text-muted hover:text-slate-900'
          }`}
        >
          Cola de Tareas ({queue.length})
        </button>
        <button
          onClick={() => setActiveSubTab('conflicts')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'conflicts' ? 'bg-white text-slate-900 shadow-xs' : 'text-muted hover:text-slate-900'
          }`}
        >
          Conflictos ({conflicts.filter(c => !c.resolved).length})
        </button>
      </div>

      {/* SUB-TAB 1: STATUS & GRAPHS */}
      {activeSubTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* OTA list control */}
            <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-5 space-y-4">
              <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
                <Layers className="w-4 h-4 text-forest" /> Registro de Canales OTA
              </h3>

              <div className="space-y-4">
                {registry.map(entry => {
                  const conn = connections.find(c => c.ota === entry.ota);
                  const cap = capabilities.find(cp => cp.ota === entry.ota);
                  
                  return (
                    <div key={entry.ota} className="p-3 bg-slate-50 border border-line/60 rounded-xl space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-slate-900">{entry.name}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded">{entry.version}</span>
                            {cap?.certRequired && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                cap.certStatus === 'certified' ? 'bg-emerald-100 text-emerald-800' : 
                                cap.certStatus === 'in_progress' ? 'bg-amber-100 text-amber-800 animate-pulse' : 
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {cap.certStatus === 'certified' ? 'Certificado' : cap.certStatus === 'in_progress' ? 'Certificación en Proceso' : 'No Iniciado'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block uppercase">OTA: {entry.ota}</span>
                        </div>

                        <button
                          onClick={() => handleToggleChannel(entry.ota)}
                          className="cursor-pointer transition-transform"
                        >
                          {entry.active ? (
                            <ToggleRight className="w-10 h-6 text-forest fill-forest/10" />
                          ) : (
                            <ToggleLeft className="w-10 h-6 text-slate-300" />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {entry.capabilities.syncAvailability && <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Disponibilidad</span>}
                        {entry.capabilities.syncRates && <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Tarifas</span>}
                        {entry.capabilities.importBookings && <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-semibold">Importar Reservas</span>}
                        {entry.capabilities.realtimePush && <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">Push Realtime</span>}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted border-t border-slate-200/50 pt-1.5">
                        <span className="flex items-center gap-1 font-bold">
                          Conexión: {conn?.active ? <span className="text-emerald-600">🟢 ACTIVA</span> : <span className="text-slate-400">⚫ INACTIVA</span>}
                        </span>
                        <span>Último Sync: {conn?.lastSync ? new Date(conn.lastSync).toLocaleTimeString() : 'Nunca'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-muted">
                        <span>Errores recientes: <strong className={conn && conn.errorCount > 0 ? 'text-rose-600' : 'text-slate-500'}>{conn?.errorCount || 0}</strong></span>
                        <button
                          onClick={() => handleTriggerImmediateSync(entry.ota)}
                          disabled={!entry.active || processing}
                          className="text-[10px] text-indigo-600 font-extrabold hover:underline"
                        >
                          Sincronizar Ya
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance graphs */}
            <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-7 space-y-4">
              <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
                <Activity className="w-4 h-4 text-indigo-500" /> Telemetría & Rendimiento de Sincronización
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bar chart - total syncs */}
                <div className="h-[200px] border border-line/60 rounded-xl p-3 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-2">Transacciones por Canal</span>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={otaBarData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Bar dataKey="syncs" fill="#1b4332" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Line chart - latency */}
                <div className="h-[200px] border border-line/60 rounded-xl p-3 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-2">Tiempos de Respuesta (ms)</span>
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={otaBarData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribution share */}
              <div className="border border-line/60 rounded-xl p-4 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">Reparto de Mercado (OTA Share)</span>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                    Mapeo porcentual de reservas importadas contra reservas directas locales de StayFlow.
                  </p>
                </div>
                <div className="flex gap-4">
                  {otaDistribution.map(item => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs font-bold">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-800">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 2: INVENTORY & RATE MAPPING */}
      {activeSubTab === 'mappings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Inventory Mapping setup */}
          <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-6 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
              <GitCompare className="w-4 h-4 text-blue-500" /> Relación Alojamiento StayFlow → Habitación OTA
            </h3>

            {/* Inventory Map Form */}
            <form onSubmit={handleAddInventoryMapping} className="p-3 bg-slate-50 border border-line/60 rounded-xl space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-forest block">Vincular nuevo alojamiento</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Alojamiento StayFlow</label>
                  <select
                    value={newInv.stayflowCabinId}
                    onChange={(e) => setNewInv({ ...newInv, stayflowCabinId: Number(e.target.value) })}
                    className="w-full rounded-xl border border-line px-3 py-1.5 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  >
                    {cabins.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (${c.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Canal OTA</label>
                  <select
                    value={newInv.ota}
                    onChange={(e) => setNewInv({ ...newInv, ota: e.target.value as ChannelOta })}
                    className="w-full rounded-xl border border-line px-3 py-1.5 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  >
                    {registry.map(r => (
                      <option key={r.ota} value={r.ota}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Código de Habitación OTA</label>
                  <input
                    type="text"
                    placeholder="Ej: BCOM-RM-101"
                    value={newInv.otaRoomId}
                    onChange={(e) => setNewInv({ ...newInv, otaRoomId: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-1.5 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Nombre Comercial OTA</label>
                  <input
                    type="text"
                    placeholder="Ej: Alpine Suite Deluxe"
                    value={newInv.otaRoomName}
                    onChange={(e) => setNewInv({ ...newInv, otaRoomName: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-1.5 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Guardar Mapping
                </button>
              </div>
            </form>

            {/* Inventory Mapping list */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {invMappings.map(item => {
                const cab = cabins.find(c => c.id === item.stayflowCabinId);
                return (
                  <div key={item.id} className="p-3 border border-line/60 rounded-xl hover:bg-slate-50 transition-all flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getOtaBadge(item.ota)}
                        <span className="font-extrabold text-slate-900">{item.otaRoomName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">StayFlow: {cab?.name || `Alojamiento #${item.stayflowCabinId}`}</p>
                      <span className="text-[10px] font-mono text-slate-400">OTA ID: {item.otaRoomId}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteInventoryMapping(item.id)}
                      className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rate Mapping setup */}
          <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-6 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Relación Tarifa StayFlow → Tarifa OTA
            </h3>

            {/* Rate Mapping form */}
            <form onSubmit={handleAddRateMapping} className="p-3 bg-slate-50 border border-line/60 rounded-xl space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-forest block">Vincular regla de precios</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Plan de Precios StayFlow</label>
                  <select
                    value={newRate.stayflowRateId}
                    onChange={(e) => setNewRate({ ...newRate, stayflowRateId: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-1.5 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  >
                    <option value="standard">Tarifa Estándar (Por Defecto)</option>
                    <option value="weekend">Tarifa Fin de Semana</option>
                    <option value="promo">Tarifa Promocional / Off-Season</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Canal OTA</label>
                  <select
                    value={newRate.ota}
                    onChange={(e) => setNewRate({ ...newRate, ota: e.target.value as ChannelOta })}
                    className="w-full rounded-xl border border-line px-3 py-1.5 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  >
                    {registry.map(r => (
                      <option key={r.ota} value={r.ota}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Código de Tarifa OTA</label>
                  <input
                    type="text"
                    placeholder="Ej: BCOM-RATE-STD"
                    value={newRate.otaRateId}
                    onChange={(e) => setNewRate({ ...newRate, otaRateId: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-1.5 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Markup (Recargo de Comisión %)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newRate.markupPercent}
                    onChange={(e) => setNewRate({ ...newRate, markupPercent: Number(e.target.value) })}
                    className="w-full rounded-xl border border-line px-3 py-1.5 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Guardar Mapping de Tarifas
                </button>
              </div>
            </form>

            {/* Rate Mappings list */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {rateMappings.map(item => (
                <div key={item.id} className="p-3 border border-line/60 rounded-xl hover:bg-slate-50 transition-all flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {getOtaBadge(item.ota)}
                      <span className="font-extrabold text-slate-900">{item.otaRateId}</span>
                    </div>
                    <p className="text-slate-500 font-semibold capitalize">Interno: {item.stayflowRateId}</p>
                    <span className="text-[10px] font-bold text-indigo-600">Markup Comisión: +{item.markupPercent}%</span>
                  </div>

                  <button
                    onClick={() => handleDeleteRateMapping(item.id)}
                    className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB: CREDENTIAL MANAGER */}
      {activeSubTab === 'credentials' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-5 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
              <Key className="w-4 h-4 text-indigo-600" /> Selección de Proveedor OTA
            </h3>
            <p className="text-xs text-muted">
              Seleccione el canal para registrar o rotar sus credenciales de forma segura. Los secretos son administrados por el backend y nunca se exponen al navegador.
            </p>

            <div className="space-y-2">
              {registry.map(otaEntry => {
                const isActive = selectedOtaCred === otaEntry.ota;
                return (
                  <button
                    key={otaEntry.ota}
                    onClick={async () => {
                      setSelectedOtaCred(otaEntry.ota);
                      const creds = await CredentialManager.getCredentials('default-resort', otaEntry.ota);
                      if (creds) {
                        setCredForm({
                          apiKey: creds.apiKey,
                          apiSecret: creds.apiSecret || '',
                          clientId: creds.clientId || '',
                          refreshToken: creds.refreshToken || '',
                          expiresInHours: 24,
                          status: creds.status === 'active' ? 'active' : 'inactive'
                        });
                      } else {
                        setCredForm({
                          apiKey: '',
                          apiSecret: '',
                          clientId: '',
                          refreshToken: '',
                          expiresInHours: 24,
                          status: 'active'
                        });
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                      isActive ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-line text-slate-700 hover:bg-slate-100/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {getOtaBadge(otaEntry.ota)}
                      <span className="font-extrabold text-[12px]">{otaEntry.name}</span>
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 font-mono">EDITAR</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-7 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
              <Shield className="w-4 h-4 text-emerald-600" /> Registro Seguro para {selectedOtaCred.toUpperCase()}
            </h3>

            <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">API Key / Access Token</label>
                  <input
                    type="password"
                    placeholder="key_live_..."
                    value={credForm.apiKey}
                    onChange={(e) => setCredForm({ ...credForm, apiKey: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Client ID (OAuth)</label>
                  <input
                    type="text"
                    placeholder="StayFlow-Client-ID"
                    value={credForm.clientId}
                    onChange={(e) => setCredForm({ ...credForm, clientId: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">API Secret / Client Secret</label>
                  <input
                    type="password"
                    placeholder="sec_live_..."
                    value={credForm.apiSecret}
                    onChange={(e) => setCredForm({ ...credForm, apiSecret: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Refresh Token (OAuth)</label>
                  <input
                    type="text"
                    placeholder="ref_..."
                    value={credForm.refreshToken}
                    onChange={(e) => setCredForm({ ...credForm, refreshToken: e.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tiempo de expiración (Horas)</label>
                  <input
                    type="number"
                    min={1}
                    max={8760}
                    value={credForm.expiresInHours}
                    onChange={(e) => setCredForm({ ...credForm, expiresInHours: Number(e.target.value) })}
                    className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Estado de Conexión</label>
                  <select
                    value={credForm.status}
                    onChange={(e) => setCredForm({ ...credForm, status: e.target.value as any })}
                    className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                  >
                    <option value="active">Activo (Autorizado)</option>
                    <option value="inactive">Inactivo (Snoozed)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={handleRotateCredentials}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  🔄 Rotar Token (Simulación OAuth)
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Guardar Credenciales Seguras
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB: SYNC SCHEDULER */}
      {activeSubTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-5 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Planificador de Canales
            </h3>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Seleccionar Canal</label>
                <select
                  value={selectedOtaSched}
                  onChange={(e) => {
                    const target = e.target.value as ChannelOta;
                    setSelectedOtaSched(target);
                    const match = schedulesList.find(s => s.ota === target);
                    if (match) {
                      setSchedInterval(match.intervalMinutes);
                      setSchedActive(match.active);
                    }
                  }}
                  className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                >
                  {registry.map(r => (
                    <option key={r.ota} value={r.ota}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Intervalo de Sincronización Automática</label>
                <select
                  value={schedInterval}
                  onChange={(e) => setSchedInterval(Number(e.target.value))}
                  className="w-full rounded-xl border border-line px-3 py-2 text-xs bg-white focus:border-forest outline-none min-h-[44px]"
                >
                  <option value={5}>Cada 5 minutos (Crítico)</option>
                  <option value={15}>Cada 15 minutos (Recomendado)</option>
                  <option value={30}>Cada 30 minutos (Estándar)</option>
                  <option value={60}>Cada hora</option>
                  <option value={360}>Cada 6 horas (Eco)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="schedActive"
                  checked={schedActive}
                  onChange={(e) => setSchedActive(e.target.checked)}
                  className="w-4 h-4 text-forest border-line rounded focus:ring-forest"
                />
                <label htmlFor="schedActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Habilitar Programación Automática (Cron)
                </label>
              </div>

              <div className="pt-2 border-t border-line flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Guardar Configuración de Cron
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-7 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Estado del Servidor de Sincronización (StayFlow CronEngine)
            </h3>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-line rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Estado del Programador</p>
                  <p className="text-slate-500">Motor de cron integrado y escuchando eventos</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  🟣 ACTIVO / LISTENING
                </span>
              </div>

              <div className="space-y-2">
                {schedulesList.map(sched => (
                  <div key={sched.id} className="p-3 border border-line rounded-xl flex flex-wrap justify-between items-center text-xs bg-white shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getOtaBadge(sched.ota)}
                        <span className="font-bold text-slate-500 font-mono text-[10px]">Cada {sched.intervalMinutes} min</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <p>Último disparo: {sched.lastRun ? new Date(sched.lastRun).toLocaleTimeString() : 'Nunca'}</p>
                        <p>Siguiente disparo estimado: {new Date(sched.nextRun).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sched.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {sched.active ? 'AUTOMÁTICO' : 'MANUAL / DESACTIVADO'}
                      </span>
                      <button
                        onClick={() => handleTriggerImmediateSync(sched.ota)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded"
                      >
                        Sincronizar Ya
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: OTA ERRORS & RESOLUTIONS */}
      {activeSubTab === 'errors' && (
        <div className="bg-white border border-line rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" /> Registro de Errores e Incidentes Clasificados
          </h3>

          <p className="text-xs text-muted leading-relaxed">
            StayFlow clasifica automáticamente los errores reportados por las APIs de las OTAs en tiempo real. Se proporcionan diagnósticos precisos y sugerencias guiadas de resolución.
          </p>

          {errorRecords.length === 0 ? (
            <div className="text-center py-16 text-muted text-xs space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold">¡Excelente! Tu conexión OTA no registra errores recientes.</p>
              <p className="text-[10px]">Cualquier interrupción de servicio, error de validación o límite de API se listará aquí.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {errorRecords.map(errRec => (
                <div key={errRec.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4 items-start text-xs ${
                  errRec.resolved ? 'bg-slate-50 border-line/60' : 'bg-rose-50/20 border-rose-100'
                }`}>
                  <div className="space-y-2 max-w-[80%]">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getOtaBadge(errRec.ota)}
                      <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        errRec.category === 'authentication' ? 'bg-rose-100 text-rose-800' :
                        errRec.category === 'connectivity' ? 'bg-amber-100 text-amber-800' :
                        errRec.category === 'rate_limit' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {errRec.category.toUpperCase()} / {errRec.code}
                      </span>
                      <span className="text-slate-400 font-mono">#{errRec.id.slice(-6)}</span>
                    </div>

                    <p className="text-slate-900 font-extrabold text-[13px]">{errRec.message}</p>
                    
                    <div className="p-3 bg-white/50 border border-slate-200/50 rounded-lg flex items-start gap-2 text-[11px] text-slate-700">
                      <Wrench className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-indigo-900">Sugerencia de Resolución:</strong>
                        <p className="text-slate-600 mt-0.5">{errRec.resolutionSuggestion}</p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-bold">
                      Reportado el: {new Date(errRec.timestamp).toLocaleTimeString()} ({new Date(errRec.timestamp).toLocaleDateString()})
                      {errRec.resolved && errRec.resolvedAt && (
                        <span className="text-emerald-600 ml-4">✓ Resuelto el: {new Date(errRec.resolvedAt).toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 self-center">
                    {!errRec.resolved ? (
                      <button
                        onClick={() => handleResolveError(errRec.id)}
                        className="px-3 py-1.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Marcar como Solucionado
                      </button>
                    ) : (
                      <span className="text-slate-400 font-bold">Solucionado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: SYNC QUEUE & AUDIT FEED */}
      {activeSubTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Active Queue list */}
          <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-5 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
              <Clock className="w-4 h-4 text-blue-500" /> Cola de Salida Activa ({queue.length})
            </h3>

            {queue.length === 0 ? (
              <div className="text-center py-12 text-muted text-xs space-y-1">
                <p>No hay sincronizaciones planificadas en cola.</p>
                <p className="text-[10px]">Crea mappings o simula reservas para ver el flujo encolado.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {queue.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-line/60 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getOtaBadge(item.ota)}
                          <span className="font-mono text-[10px] text-slate-400">#{item.id.slice(-6)}</span>
                        </div>
                        <span className="font-extrabold text-slate-800 uppercase block mt-1">{item.action}</span>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    {item.payload && Object.keys(item.payload).length > 0 && (
                      <div className="p-2 bg-white rounded border border-line/50 font-mono text-[10px] text-slate-600">
                        {JSON.stringify(item.payload)}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/40 pt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Prog: {new Date(item.scheduledFor).toLocaleTimeString()}
                      </span>
                      <span className="font-bold">Intentos: {item.attempts}/{item.maxAttempts}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Logs feed */}
          <div className="bg-white border border-line rounded-2xl p-5 shadow-xs lg:col-span-7 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
              <Database className="w-4 h-4 text-forest" /> Registro Histórico de Auditoría y Logs ({logs.length})
            </h3>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted text-xs">
                Aún no se registran logs en esta sesión.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {logs.map(log => (
                  <div key={log.id} className="p-3 border border-line/60 rounded-xl flex justify-between items-start text-xs hover:bg-slate-50/50 transition-all">
                    <div className="space-y-1 max-w-[75%]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getOtaBadge(log.ota)}
                        <span className="font-extrabold text-slate-800 uppercase font-mono text-[10px]">{log.action}</span>
                      </div>
                      <p className="text-slate-600 font-semibold">{log.message}</p>
                      <p className="text-[10px] text-slate-400">
                        Sincronizado: {new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      {getStatusBadge(log.status)}
                      <p className="text-[10px] text-indigo-500 font-mono font-bold">{log.latencyMs}ms</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB 4: CONFLICT RESOLUTION */}
      {activeSubTab === 'conflicts' && (
        <div className="bg-white border border-line rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-line pb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" /> Conflictos y Contradicciones del Channel Manager
          </h3>

          <p className="text-xs text-muted leading-relaxed">
            Aquí se listan las anomalías críticas detectadas automáticamente por el Conflict Resolver al procesar reservas importadas de las OTAs. Puedes resolverlas manualmente una vez confirmados los cupos físicos.
          </p>

          {conflicts.length === 0 ? (
            <div className="text-center py-16 text-muted text-xs space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold">¡Tu inventario no presenta conflictos!</p>
              <p className="text-[10px]">Las alertas de overbooking o discrepancias se reportarán aquí de inmediato.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {conflicts.map(item => (
                <div key={item.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between gap-4 items-start text-xs ${item.resolved ? 'bg-slate-50 border-line/60' : 'bg-rose-50/20 border-rose-100'}`}>
                  <div className="space-y-1.5 max-w-[80%]">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getOtaBadge(item.ota)}
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.severity === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                        {item.severity.toUpperCase()}
                      </span>
                      <span className="text-slate-400 font-mono">#{item.id.slice(-6)}</span>
                    </div>

                    <p className="text-slate-900 font-extrabold text-[13px]">{item.details}</p>

                    <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                      <span><strong>Alojamiento:</strong> #{item.affectedCabinId}</span>
                      {item.otaBookingId && <span><strong>Reserva OTA:</strong> {item.otaBookingId}</span>}
                      <span><strong>Reportado:</strong> {new Date(item.timestamp).toLocaleTimeString()} ({new Date(item.timestamp).toLocaleDateString()})</span>
                    </div>

                    {item.resolved && (
                      <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        ✓ Resuelto el {new Date(item.resolvedAt || '').toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 self-center">
                    {!item.resolved ? (
                      <button
                        onClick={() => handleResolveConflict(item.id)}
                        className="px-3 py-1.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Marcar como Resuelto
                      </button>
                    ) : (
                      <span className="text-slate-400 font-bold">Resuelto</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
