import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MobileDevice, 
  MobileSession, 
  OfflineQueueItem, 
  SyncConflict, 
  SyncLog, 
  PushSubscription, 
  MobileSettings, 
  MobileMetrics,
  DeviceAuditLog
} from '../types';
import { MobileFirestore } from '../services/MobileFirestore';
import { OfflineRepository } from '../services/OfflineRepository';
import { DeviceManager } from '../services/DeviceManager';
import { MobileSessionService } from '../services/MobileSessionService';
import { OfflineSyncService } from '../services/OfflineSyncService';
import { SyncEngine } from '../services/SyncEngine';
import { PushNotificationService } from '../services/PushNotificationService';
import { MobileGateway } from '../services/MobileGateway';
import { useAuth } from '../../auth/hooks/useAuth';
import { TenantManager } from '../../../core/tenant/TenantManager';
import { Accommodation, Booking } from '../../../types';
import { HousekeepingTask, MaintenanceOrder } from '../../stay-operations/types';

interface MobileContextProps {
  isOnline: boolean;
  setOnline: (online: boolean) => void;
  currentSession: MobileSession | null;
  currentDevice: MobileDevice | null;
  syncLogs: SyncLog[];
  pendingQueue: OfflineQueueItem[];
  conflicts: SyncConflict[];
  metrics: MobileMetrics;
  lastSync: string;
  alerts: Array<{ id: string; title: string; body: string; category: string; timestamp: string }>;
  
  // Cache items
  cachedAccommodations: Accommodation[];
  cachedHousekeeping: HousekeepingTask[];
  cachedMaintenance: MaintenanceOrder[];
  cachedReservations: any[];

  // Actions
  loginMobile: (email: string, role: any, deviceId: string, model: string, os: 'iOS' | 'Android' | 'WebMobile') => Promise<void>;
  logoutMobile: () => void;
  triggerSync: () => Promise<void>;
  resolveSyncConflict: (queueItemId: string, strategy: 'use_local' | 'use_server' | 'merge') => Promise<void>;
  toggleBiometrics: (enabled: boolean) => void;
  updatePushSettings: (categories: any[]) => Promise<void>;
  simulateNotification: (category: any, title: string, body: string) => void;
  clearAlerts: () => void;

  // Operational Actions
  startHousekeeping: (taskId: string) => Promise<void>;
  completeHousekeeping: (taskId: string, notes?: string, checklistAnswers?: Record<string, boolean>) => Promise<void>;
  createMaintenance: (cabinId: number, cabinName: string, type: any, priority: any, issueDescription: string, comments?: string, cost?: number, startDate?: string, endDate?: string) => Promise<void>;
  startMaintenance: (orderId: string) => Promise<void>;
  completeMaintenance: (orderId: string, comments?: string, cost?: number) => Promise<void>;
  quickCheckIn: (bookingId: number) => Promise<void>;
  quickCheckOut: (bookingId: number) => Promise<void>;
  revokeOtherDevice: (deviceId: string) => Promise<void>;
  getDeviceAuditHistory: (deviceId: string) => DeviceAuditLog[];
}

const MobileContext = createContext<MobileContextProps | undefined>(undefined);

export const MobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const activeTenantId = TenantManager.getCurrentTenantId() || 'patagonia-refugio';

  const [isOnline, setIsOnline] = useState<boolean>(SyncEngine.getConnectivity());
  const [currentSession, setCurrentSession] = useState<MobileSession | null>(null);
  const [currentDevice, setCurrentDevice] = useState<MobileDevice | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [pendingQueue, setPendingQueue] = useState<OfflineQueueItem[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [lastSync, setLastSync] = useState<string>(new Date().toISOString());
  const [alerts, setAlerts] = useState<Array<{ id: string; title: string; body: string; category: string; timestamp: string }>>([]);

  // Local Secure Cached lists
  const [cachedAccommodations, setCachedAccommodations] = useState<Accommodation[]>([]);
  const [cachedHousekeeping, setCachedHousekeeping] = useState<HousekeepingTask[]>([]);
  const [cachedMaintenance, setCachedMaintenance] = useState<MaintenanceOrder[]>([]);
  const [cachedReservations, setCachedReservations] = useState<any[]>([]);

  const [metrics, setMetrics] = useState<MobileMetrics>({
    apiLatencyMs: 0,
    payloadSizeKb: 0,
    batterySavingsPct: 0,
    cacheHitRatio: 0.95,
    syncDelaysSec: 0,
    networkRequestsCount: 0
  });

  // Watch network connectivity simulation
  useEffect(() => {
    const handleConnectivity = (online: boolean) => {
      setIsOnline(online);
    };

    SyncEngine.addConnectionListener(handleConnectivity);
    return () => {
      SyncEngine.removeConnectionListener(handleConnectivity);
    };
  }, []);

  // Sync state helpers
  const refreshLocalState = async () => {
    const deviceList = MobileFirestore.mobileDevices.getAll();
    const activeSessions = MobileFirestore.mobileSessions.getAll();
    const queue = MobileFirestore.offlineQueue.getAll().filter(i => i.tenantId === activeTenantId);
    
    setPendingQueue(queue);
    setSyncLogs(MobileFirestore.syncLogs.queryByTenant(activeTenantId));

    // Pull from secure local on-device encrypted cache (Module 3 - Offline First)
    setCachedAccommodations(OfflineRepository.getCachedAccommodations(activeTenantId));
    setCachedHousekeeping(OfflineRepository.getCachedHousekeepingTasks(activeTenantId));
    setCachedMaintenance(OfflineRepository.getCachedMaintenanceOrders(activeTenantId));

    // Attempt to pull reservations from LocalSaaSDb
    const rRes = await MobileGateway.getOptimizedReservations(activeTenantId);
    setCachedReservations(rRes.items);
  };

  useEffect(() => {
    refreshLocalState();
  }, [activeTenantId]);

  // Handle push notification reactive callback
  const handlePushTriggered = (title: string, body: string, category: string) => {
    setAlerts(prev => [
      {
        id: `alert_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title,
        body,
        category,
        timestamp: new Date().toISOString()
      },
      ...prev
    ]);
  };

  // Login handler
  const loginMobile = async (
    email: string,
    role: any,
    deviceId: string,
    model: string,
    os: 'iOS' | 'Android' | 'WebMobile'
  ) => {
    // 1. Register device
    const device = DeviceManager.registerDevice(activeTenantId, email, {
      id: deviceId,
      model,
      os,
      osVersion: '16.4',
      appVersion: '2.4.0'
    });

    // 2. Start mobile authenticated session (Supports multiple devices + biometric ready)
    const session = await MobileSessionService.authenticateDeviceUser(
      activeTenantId,
      deviceId,
      email,
      user?.uid || `user_${Date.now()}`,
      role,
      false
    );

    // 3. Register initial standard push notifications for the user device
    await PushNotificationService.registerDeviceToken(
      activeTenantId,
      deviceId,
      email,
      `token_push_${deviceId}`,
      ['booking', 'housekeeping', 'maintenance', 'critical', 'payments']
    );

    setCurrentDevice(device);
    setCurrentSession(session);

    // Prime the local cache with optimized payloads (API Layer - Module 1)
    await downloadOptimizedPayloads();
    await refreshLocalState();
  };

  const logoutMobile = () => {
    if (currentSession) {
      MobileSessionService.logoutSession(currentSession.id);
    }
    setCurrentSession(null);
    setCurrentDevice(null);
  };

  const downloadOptimizedPayloads = async () => {
    if (!isOnline) return;

    try {
      // 1. Fetch optimized accommodations (Module 1)
      const cabinsRes = await MobileGateway.getOptimizedAccommodations(activeTenantId, 1, 50);
      OfflineRepository.cacheAccommodations(activeTenantId, cabinsRes.items as Accommodation[]);

      // 2. Fetch optimized housekeeping tasks (Module 1)
      const hkRes = await MobileGateway.getOptimizedHousekeepingTasks(activeTenantId);
      OfflineRepository.cacheHousekeepingTasks(activeTenantId, hkRes.items as HousekeepingTask[]);

      // 3. Fetch optimized maintenance orders (Module 1)
      const maintRes = await MobileGateway.getOptimizedMaintenanceOrders(activeTenantId);
      OfflineRepository.cacheMaintenanceOrders(activeTenantId, maintRes.items as MaintenanceOrder[]);

      // Update aggregate performance observability metrics
      setMetrics({
        apiLatencyMs: cabinsRes.metrics.apiLatencyMs + hkRes.metrics.apiLatencyMs + maintRes.metrics.apiLatencyMs,
        payloadSizeKb: parseFloat((cabinsRes.metrics.payloadSizeKb + hkRes.metrics.payloadSizeKb + maintRes.metrics.payloadSizeKb).toFixed(2)),
        batterySavingsPct: Math.round((cabinsRes.metrics.batterySavingsPct + hkRes.metrics.batterySavingsPct + maintRes.metrics.batterySavingsPct) / 3),
        cacheHitRatio: 0.92,
        syncDelaysSec: 1,
        networkRequestsCount: 3
      });

      setLastSync(new Date().toISOString());
    } catch (err) {
      console.error('Error downloading optimized payloads for mobile:', err);
    }
  };

  const triggerSync = async () => {
    if (!isOnline) return;
    if (!currentDevice || !currentSession) return;

    // 1. Trigger queue sync (offline -> server replay)
    const result = await OfflineSyncService.syncPendingQueue(
      activeTenantId,
      currentDevice.id,
      currentSession.userEmail
    );

    setConflicts(result.conflicts);

    // 2. Re-download fresh optimized snapshots from server
    await downloadOptimizedPayloads();

    // 3. Update view states
    await refreshLocalState();
  };

  const resolveSyncConflict = async (
    queueItemId: string,
    strategy: 'use_local' | 'use_server' | 'merge'
  ) => {
    if (!currentSession) return;
    await OfflineSyncService.resolveConflict(
      activeTenantId,
      queueItemId,
      strategy,
      currentSession.userEmail
    );
    // Re-sync and refresh
    await triggerSync();
  };

  const toggleBiometrics = (enabled: boolean) => {
    if (currentSession) {
      MobileSessionService.setBiometricsState(currentSession.id, enabled);
      refreshLocalState();
    }
  };

  const updatePushSettings = async (
    categories: ('booking' | 'housekeeping' | 'maintenance' | 'critical' | 'payments')[]
  ) => {
    if (!currentDevice || !currentSession) return;
    await PushNotificationService.registerDeviceToken(
      activeTenantId,
      currentDevice.id,
      currentSession.userEmail,
      `token_push_${currentDevice.id}`,
      categories
    );
    await refreshLocalState();
  };

  const simulateNotification = (
    category: 'booking' | 'housekeeping' | 'maintenance' | 'critical' | 'payments',
    title: string,
    body: string
  ) => {
    PushNotificationService.dispatchNotification(
      activeTenantId,
      category,
      title,
      body,
      handlePushTriggered
    );
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  // Set connectivity wrapper
  const setOnline = (online: boolean) => {
    if (!currentDevice || !currentSession) {
      SyncEngine.setConnectivity(online, activeTenantId, 'temp', 'temp');
      setIsOnline(online);
      return;
    }

    SyncEngine.setConnectivity(
      online,
      activeTenantId,
      currentDevice.id,
      currentSession.userEmail,
      (result) => {
        setConflicts(result.conflicts);
        downloadOptimizedPayloads().then(() => refreshLocalState());
      }
    );
    setIsOnline(online);
  };

  // --- OPERATIONAL OFF-LINE ACTIONS (Enqueue Action Pattern) ---
  const startHousekeeping = async (taskId: string) => {
    if (!currentSession || !currentDevice) return;
    
    OfflineSyncService.enqueueAction(
      activeTenantId,
      currentSession.userId,
      currentSession.userEmail,
      currentDevice.id,
      'start_housekeeping',
      { taskId },
      isOnline
    );

    if (isOnline) {
      await triggerSync();
    } else {
      await refreshLocalState();
    }
  };

  const completeHousekeeping = async (
    taskId: string,
    notes?: string,
    checklistAnswers?: Record<string, boolean>
  ) => {
    if (!currentSession || !currentDevice) return;

    OfflineSyncService.enqueueAction(
      activeTenantId,
      currentSession.userId,
      currentSession.userEmail,
      currentDevice.id,
      'complete_housekeeping',
      { taskId, notes, checklistAnswers, photos: ['photo_simulated_housekeeping.png'] },
      isOnline
    );

    if (isOnline) {
      await triggerSync();
      // Dispatch push alert simulation (Module 4 integration)
      simulateNotification(
        'housekeeping',
        'Limpieza Completada',
        `Habitación #${taskId.substring(5, 8)} completada por ${currentSession.userEmail}`
      );
    } else {
      await refreshLocalState();
    }
  };

  const createMaintenance = async (
    cabinId: number,
    cabinName: string,
    type: any,
    priority: any,
    issueDescription: string,
    comments?: string,
    cost?: number,
    startDate?: string,
    endDate?: string
  ) => {
    if (!currentSession || !currentDevice) return;

    OfflineSyncService.enqueueAction(
      activeTenantId,
      currentSession.userId,
      currentSession.userEmail,
      currentDevice.id,
      'create_maintenance',
      { cabinId, cabinName, type, priority, issueDescription, comments, cost, startDate, endDate },
      isOnline
    );

    if (isOnline) {
      await triggerSync();
      simulateNotification(
        'maintenance',
        'Nueva Orden de Mantenimiento',
        `Orden creada para ${cabinName}: "${issueDescription}"`
      );
    } else {
      await refreshLocalState();
    }
  };

  const startMaintenance = async (orderId: string) => {
    if (!currentSession || !currentDevice) return;

    OfflineSyncService.enqueueAction(
      activeTenantId,
      currentSession.userId,
      currentSession.userEmail,
      currentDevice.id,
      'start_maintenance',
      { orderId },
      isOnline
    );

    if (isOnline) {
      await triggerSync();
    } else {
      await refreshLocalState();
    }
  };

  const completeMaintenance = async (orderId: string, comments?: string, cost?: number) => {
    if (!currentSession || !currentDevice) return;

    OfflineSyncService.enqueueAction(
      activeTenantId,
      currentSession.userId,
      currentSession.userEmail,
      currentDevice.id,
      'complete_maintenance',
      { orderId, comments, cost },
      isOnline
    );

    if (isOnline) {
      await triggerSync();
      simulateNotification(
        'maintenance',
        'Mantenimiento Resuelto',
        `Orden ${orderId.substring(6, 12)}... resuelta por ${currentSession.userEmail}`
      );
    } else {
      await refreshLocalState();
    }
  };

  const quickCheckIn = async (bookingId: number) => {
    if (!currentSession || !currentDevice) return;

    OfflineSyncService.enqueueAction(
      activeTenantId,
      currentSession.userId,
      currentSession.userEmail,
      currentDevice.id,
      'quick_checkin',
      { bookingId },
      isOnline
    );

    if (isOnline) {
      await triggerSync();
      simulateNotification(
        'booking',
        'Check-In Exitoso',
        `Se registró ingreso para la reserva #${bookingId}.`
      );
    } else {
      await refreshLocalState();
    }
  };

  const quickCheckOut = async (bookingId: number) => {
    if (!currentSession || !currentDevice) return;

    OfflineSyncService.enqueueAction(
      activeTenantId,
      currentSession.userId,
      currentSession.userEmail,
      currentDevice.id,
      'quick_checkout',
      { bookingId },
      isOnline
    );

    if (isOnline) {
      await triggerSync();
      simulateNotification(
        'booking',
        'Check-Out Exitoso',
        `Se registró egreso para la reserva #${bookingId}.`
      );
    } else {
      await refreshLocalState();
    }
  };

  const revokeOtherDevice = async (deviceId: string) => {
    if (!currentSession) return;
    DeviceManager.revokeDevice(activeTenantId, deviceId, currentSession.userEmail);
    await refreshLocalState();
  };

  const getDeviceAuditHistory = (deviceId: string) => {
    return MobileFirestore.deviceAudit.queryByDevice(deviceId);
  };

  return (
    <MobileContext.Provider value={{
      isOnline,
      setOnline,
      currentSession,
      currentDevice,
      syncLogs,
      pendingQueue,
      conflicts,
      metrics,
      lastSync,
      alerts,
      cachedAccommodations,
      cachedHousekeeping,
      cachedMaintenance,
      cachedReservations,
      loginMobile,
      logoutMobile,
      triggerSync,
      resolveSyncConflict,
      toggleBiometrics,
      updatePushSettings,
      simulateNotification,
      clearAlerts,
      startHousekeeping,
      completeHousekeeping,
      createMaintenance,
      startMaintenance,
      completeMaintenance,
      quickCheckIn,
      quickCheckOut,
      revokeOtherDevice,
      getDeviceAuditHistory
    }}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobile = () => {
  const context = useContext(MobileContext);
  if (!context) throw new Error('useMobile must be used within a MobileProvider');
  return context;
};
