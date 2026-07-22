import { HousekeepingTask, MaintenanceOrder } from '../stay-operations/types';

export type MobileUserRole = 'owner' | 'manager' | 'staff' | 'receptionist';

export interface MobileDevice {
  id: string;
  model: string;
  os: 'iOS' | 'Android' | 'WebMobile';
  osVersion: string;
  appVersion: string;
  userEmail: string;
  tenantId: string;
  registeredAt: string;
  lastSyncAt: string;
  status: 'active' | 'revoked';
}

export interface MobileSession {
  id: string;
  deviceId: string;
  userId: string;
  userEmail: string;
  tenantId: string;
  role: MobileUserRole;
  loginAt: string;
  lastActivityAt: string;
  token: string;
  biometricRegistered: boolean;
}

export interface OfflineQueueItem {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  deviceId: string;
  actionType: 'start_housekeeping' | 'complete_housekeeping' | 'create_maintenance' | 'start_maintenance' | 'complete_maintenance' | 'quick_checkin' | 'quick_checkout';
  payload: any;
  createdAt: string;
  status: 'pending' | 'synced' | 'conflict';
  error?: string;
}

export interface SyncConflict {
  id: string; // matches QueueItem.id
  actionType: string;
  localData: any;
  serverData: any;
  resolvedAt?: string;
  resolution?: 'use_local' | 'use_server' | 'merge';
}

export interface SyncLog {
  id: string;
  tenantId: string;
  deviceId: string;
  userEmail: string;
  timestamp: string;
  durationMs: number;
  itemsProcessed: number;
  conflictsCount: number;
  status: 'success' | 'failed' | 'partial';
  details: string;
}

export interface PushSubscription {
  id: string;
  deviceId: string;
  userEmail: string;
  tenantId: string;
  pushToken: string;
  categories: ('booking' | 'housekeeping' | 'maintenance' | 'critical' | 'payments')[];
  active: boolean;
}

export interface MobileSettings {
  tenantId: string;
  syncIntervalSeconds: number;
  batterySaverEnabled: boolean;
  biometricEnabled: boolean;
  offlineModeAllowed: boolean;
  maxOfflineDays: number;
}

export interface DeviceAuditLog {
  id: string;
  deviceId: string;
  userEmail: string;
  tenantId: string;
  timestamp: string;
  action: string;
  status: 'success' | 'failure';
  details: string;
  ipAddress?: string;
}

export interface MobileMetrics {
  apiLatencyMs: number;
  payloadSizeKb: number;
  batterySavingsPct: number;
  cacheHitRatio: number;
  syncDelaysSec: number;
  networkRequestsCount: number;
}
