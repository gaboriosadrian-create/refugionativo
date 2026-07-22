import { 
  MobileDevice, 
  MobileSession, 
  OfflineQueueItem, 
  SyncLog, 
  PushSubscription, 
  MobileSettings, 
  DeviceAuditLog 
} from '../types';

/**
 * MobileFirestore simulates our Firebase Firestore database engine for stayflow mobile.
 * It is dedicated strictly to the seven requested mobile collections to prevent duplicating
 * core PMS tables in local state, complying with SOLID principles and Epic 11 specifications.
 */
export class MobileFirestore {
  private static readonly KEYS = {
    devices: 'sf_mobile_devices',
    sessions: 'sf_mobile_sessions',
    queue: 'sf_mobile_offline_queue',
    logs: 'sf_mobile_sync_logs',
    push: 'sf_mobile_push_subscriptions',
    settings: 'sf_mobile_settings',
    audit: 'sf_mobile_device_audit'
  };

  private static getCollection<T>(key: string): T[] {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  private static saveCollection<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- mobileDevices Collection ---
  public static mobileDevices = {
    getAll: (): MobileDevice[] => MobileFirestore.getCollection<MobileDevice>(MobileFirestore.KEYS.devices),
    getById: (id: string): MobileDevice | undefined => 
      MobileFirestore.mobileDevices.getAll().find(d => d.id === id),
    save: (device: MobileDevice): void => {
      const all = MobileFirestore.mobileDevices.getAll();
      const idx = all.findIndex(d => d.id === device.id);
      if (idx >= 0) all[idx] = device;
      else all.push(device);
      MobileFirestore.saveCollection(MobileFirestore.KEYS.devices, all);
    },
    queryByTenant: (tenantId: string): MobileDevice[] => 
      MobileFirestore.mobileDevices.getAll().filter(d => d.tenantId === tenantId),
    revoke: (id: string): void => {
      const device = MobileFirestore.mobileDevices.getById(id);
      if (device) {
        device.status = 'revoked';
        MobileFirestore.mobileDevices.save(device);
        MobileFirestore.deviceAudit.log({
          id: `audit_${Date.now()}`,
          deviceId: id,
          userEmail: device.userEmail,
          tenantId: device.tenantId,
          timestamp: new Date().toISOString(),
          action: 'REVOKE_DEVICE',
          status: 'success',
          details: `Dispositivo ${device.model} revocado por seguridad.`
        });
      }
    }
  };

  // --- mobileSessions Collection ---
  public static mobileSessions = {
    getAll: (): MobileSession[] => MobileFirestore.getCollection<MobileSession>(MobileFirestore.KEYS.sessions),
    getById: (id: string): MobileSession | undefined => 
      MobileFirestore.mobileSessions.getAll().find(s => s.id === id),
    save: (session: MobileSession): void => {
      const all = MobileFirestore.mobileSessions.getAll();
      const idx = all.findIndex(s => s.id === session.id);
      if (idx >= 0) all[idx] = session;
      else all.push(session);
      MobileFirestore.saveCollection(MobileFirestore.KEYS.sessions, all);
    },
    delete: (id: string): void => {
      const all = MobileFirestore.mobileSessions.getAll().filter(s => s.id !== id);
      MobileFirestore.saveCollection(MobileFirestore.KEYS.sessions, all);
    },
    queryByDevice: (deviceId: string): MobileSession[] =>
      MobileFirestore.mobileSessions.getAll().filter(s => s.deviceId === deviceId),
    revokeAllForUser: (userEmail: string): void => {
      const all = MobileFirestore.mobileSessions.getAll().filter(s => s.userEmail !== userEmail);
      MobileFirestore.saveCollection(MobileFirestore.KEYS.sessions, all);
    }
  };

  // --- offlineQueue Collection ---
  public static offlineQueue = {
    getAll: (): OfflineQueueItem[] => MobileFirestore.getCollection<OfflineQueueItem>(MobileFirestore.KEYS.queue),
    save: (item: OfflineQueueItem): void => {
      const all = MobileFirestore.offlineQueue.getAll();
      const idx = all.findIndex(i => i.id === item.id);
      if (idx >= 0) all[idx] = item;
      else all.push(item);
      MobileFirestore.saveCollection(MobileFirestore.KEYS.queue, all);
    },
    delete: (id: string): void => {
      const all = MobileFirestore.offlineQueue.getAll().filter(i => i.id !== id);
      MobileFirestore.saveCollection(MobileFirestore.KEYS.queue, all);
    },
    queryPending: (tenantId: string): OfflineQueueItem[] => 
      MobileFirestore.offlineQueue.getAll().filter(i => i.tenantId === tenantId && i.status === 'pending')
  };

  // --- syncLogs Collection ---
  public static syncLogs = {
    getAll: (): SyncLog[] => MobileFirestore.getCollection<SyncLog>(MobileFirestore.KEYS.logs),
    add: (log: SyncLog): void => {
      const all = MobileFirestore.syncLogs.getAll();
      all.unshift(log); // newest first
      // Cap at 100 entries for efficiency
      if (all.length > 100) all.pop();
      MobileFirestore.saveCollection(MobileFirestore.KEYS.logs, all);
    },
    queryByTenant: (tenantId: string): SyncLog[] => 
      MobileFirestore.syncLogs.getAll().filter(l => l.tenantId === tenantId)
  };

  // --- pushSubscriptions Collection ---
  public static pushSubscriptions = {
    getAll: (): PushSubscription[] => MobileFirestore.getCollection<PushSubscription>(MobileFirestore.KEYS.push),
    save: (sub: PushSubscription): void => {
      const all = MobileFirestore.pushSubscriptions.getAll();
      const idx = all.findIndex(s => s.deviceId === sub.deviceId);
      if (idx >= 0) all[idx] = sub;
      else all.push(sub);
      MobileFirestore.saveCollection(MobileFirestore.KEYS.push, all);
    },
    getByDevice: (deviceId: string): PushSubscription | undefined => 
      MobileFirestore.pushSubscriptions.getAll().find(s => s.deviceId === deviceId),
    queryByTenant: (tenantId: string): PushSubscription[] =>
      MobileFirestore.pushSubscriptions.getAll().filter(s => s.tenantId === tenantId)
  };

  // --- mobileSettings Collection ---
  public static mobileSettings = {
    get: (tenantId: string): MobileSettings => {
      const raw = localStorage.getItem(`${MobileFirestore.KEYS.settings}_${tenantId}`);
      if (raw) return JSON.parse(raw);
      // default config
      return {
        tenantId,
        syncIntervalSeconds: 30,
        batterySaverEnabled: false,
        biometricEnabled: false,
        offlineModeAllowed: true,
        maxOfflineDays: 7
      };
    },
    save: (settings: MobileSettings): void => {
      localStorage.setItem(`${MobileFirestore.KEYS.settings}_${settings.tenantId}`, JSON.stringify(settings));
    }
  };

  // --- deviceAudit Collection ---
  public static deviceAudit = {
    getAll: (): DeviceAuditLog[] => MobileFirestore.getCollection<DeviceAuditLog>(MobileFirestore.KEYS.audit),
    log: (entry: DeviceAuditLog): void => {
      const all = MobileFirestore.deviceAudit.getAll();
      all.unshift(entry);
      if (all.length > 200) all.pop(); // Keep audit log bounded
      MobileFirestore.saveCollection(MobileFirestore.KEYS.audit, all);
    },
    queryByDevice: (deviceId: string): DeviceAuditLog[] => 
      MobileFirestore.deviceAudit.getAll().filter(a => a.deviceId === deviceId)
  };
}
