import { isFirebaseConfigured } from '../firebase/firebase';
import { getDocument, saveDocument, getResortSubcollection } from '../firebase/firestore';
import { doc, getDocs, deleteDoc } from 'firebase/firestore';
import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';
import { Logger } from '../logger/Logger';
import { TenantManager } from '../tenant/TenantManager';
import { ChannelOta } from './ChannelManagerTypes';

export interface OtaConnection {
  id: string;
  tenantId: string;
  ota: ChannelOta;
  active: boolean;
  connectedAt: string;
  lastSync?: string;
  errorCount: number;
}

export interface OtaSyncRecord {
  id: string;
  tenantId: string;
  ota: ChannelOta;
  action: string; // e.g. sync_availability, sync_rates
  status: 'success' | 'failed';
  message: string;
  latencyMs: number;
  timestamp: string;
  payload?: any;
}

export interface OtaErrorRecord {
  id: string;
  tenantId: string;
  ota: ChannelOta;
  code: string; // e.g. AUTH_FAILED, RATE_LIMIT_EXCEEDED
  category: 'authentication' | 'connectivity' | 'validation' | 'rate_limit' | 'unknown';
  message: string;
  resolutionSuggestion: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface OtaSchedule {
  id: string;
  tenantId: string;
  ota: ChannelOta;
  intervalMinutes: number;
  active: boolean;
  lastRun?: string;
  nextRun: string;
  mode: 'manual' | 'automatic' | 'immediate' | 'scheduled';
}

export interface OtaCapabilityRecord {
  ota: ChannelOta;
  name: string;
  syncRates: boolean;
  syncAvailability: boolean;
  syncRestrictions: boolean;
  importBookings: boolean;
  realtimePush: boolean;
  certRequired: boolean;
  certStatus: 'not_started' | 'in_progress' | 'certified';
}

export class OTARepository {
  private static CONNECTIONS_KEY = 'otaConnections';
  private static HISTORY_KEY = 'otaSyncHistory';
  private static ERRORS_KEY = 'otaErrors';
  private static SCHEDULES_KEY = 'otaSchedules';
  private static CAPABILITIES_KEY = 'otaCapabilities';

  private static getTenantId(tenantId?: string): string {
    return tenantId || TenantManager.getCurrentTenantId() || 'default-resort';
  }

  // --- CONNECTIONS ---
  public static async getConnections(tenantId?: string): Promise<OtaConnection[]> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.CONNECTIONS_KEY);
        const snap = await getDocs(colRef);
        const list: OtaConnection[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as OtaConnection);
        });
        if (list.length > 0) return list;
      } catch (err: any) {
        Logger.error(`Error loading connections from Firestore: ${err.message}`);
      }
    }

    const local = LocalSaaSDb.get<OtaConnection[]>(`${this.CONNECTIONS_KEY}_${tid}`);
    if (local && local.length > 0) return local;

    // Default connections seeded
    const defaults = this.getDefaultConnections(tid);
    LocalSaaSDb.set(`${this.CONNECTIONS_KEY}_${tid}`, defaults);
    return defaults;
  }

  public static async saveConnection(conn: OtaConnection, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.CONNECTIONS_KEY}/${conn.id}`;
        await saveDocument(path, conn, true);
      } catch (err: any) {
        Logger.error(`Error saving connection to Firestore: ${err.message}`);
      }
    }

    const list = await this.getConnections(tid);
    const idx = list.findIndex(c => c.id === conn.id);
    if (idx !== -1) {
      list[idx] = conn;
    } else {
      list.push(conn);
    }
    LocalSaaSDb.set(`${this.CONNECTIONS_KEY}_${tid}`, list);
  }

  // --- SYNC HISTORY ---
  public static async getSyncHistory(tenantId?: string): Promise<OtaSyncRecord[]> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.HISTORY_KEY);
        const snap = await getDocs(colRef);
        const list: OtaSyncRecord[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as OtaSyncRecord);
        });
        if (list.length > 0) return list;
      } catch (err: any) {
        Logger.error(`Error loading history from Firestore: ${err.message}`);
      }
    }

    const local = LocalSaaSDb.get<OtaSyncRecord[]>(`${this.HISTORY_KEY}_${tid}`);
    if (local && local.length > 0) return local;

    const defaults = this.getDefaultSyncHistory(tid);
    LocalSaaSDb.set(`${this.HISTORY_KEY}_${tid}`, defaults);
    return defaults;
  }

  public static async saveSyncRecord(record: OtaSyncRecord, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.HISTORY_KEY}/${record.id}`;
        await saveDocument(path, record, true);
      } catch (err: any) {
        Logger.error(`Error saving sync record to Firestore: ${err.message}`);
      }
    }

    const list = await this.getSyncHistory(tid);
    list.unshift(record); // newest first
    if (list.length > 200) {
      list.pop();
    }
    LocalSaaSDb.set(`${this.HISTORY_KEY}_${tid}`, list);
  }

  // --- ERRORS ---
  public static async getErrors(tenantId?: string): Promise<OtaErrorRecord[]> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.ERRORS_KEY);
        const snap = await getDocs(colRef);
        const list: OtaErrorRecord[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as OtaErrorRecord);
        });
        if (list.length > 0) return list;
      } catch (err: any) {
        Logger.error(`Error loading errors from Firestore: ${err.message}`);
      }
    }

    const local = LocalSaaSDb.get<OtaErrorRecord[]>(`${this.ERRORS_KEY}_${tid}`);
    if (local && local.length > 0) return local;

    const defaults = this.getDefaultErrors(tid);
    LocalSaaSDb.set(`${this.ERRORS_KEY}_${tid}`, defaults);
    return defaults;
  }

  public static async saveErrorRecord(record: OtaErrorRecord, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.ERRORS_KEY}/${record.id}`;
        await saveDocument(path, record, true);
      } catch (err: any) {
        Logger.error(`Error saving error to Firestore: ${err.message}`);
      }
    }

    const list = await this.getErrors(tid);
    const idx = list.findIndex(e => e.id === record.id);
    if (idx !== -1) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    LocalSaaSDb.set(`${this.ERRORS_KEY}_${tid}`, list);
  }

  // --- SCHEDULES ---
  public static async getSchedules(tenantId?: string): Promise<OtaSchedule[]> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.SCHEDULES_KEY);
        const snap = await getDocs(colRef);
        const list: OtaSchedule[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as OtaSchedule);
        });
        if (list.length > 0) return list;
      } catch (err: any) {
        Logger.error(`Error loading schedules from Firestore: ${err.message}`);
      }
    }

    const local = LocalSaaSDb.get<OtaSchedule[]>(`${this.SCHEDULES_KEY}_${tid}`);
    if (local && local.length > 0) return local;

    const defaults = this.getDefaultSchedules(tid);
    LocalSaaSDb.set(`${this.SCHEDULES_KEY}_${tid}`, defaults);
    return defaults;
  }

  public static async saveSchedule(schedule: OtaSchedule, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.SCHEDULES_KEY}/${schedule.id}`;
        await saveDocument(path, schedule, true);
      } catch (err: any) {
        Logger.error(`Error saving schedule to Firestore: ${err.message}`);
      }
    }

    const list = await this.getSchedules(tid);
    const idx = list.findIndex(s => s.id === schedule.id);
    if (idx !== -1) {
      list[idx] = schedule;
    } else {
      list.push(schedule);
    }
    LocalSaaSDb.set(`${this.SCHEDULES_KEY}_${tid}`, list);
  }

  // --- CAPABILITIES ---
  public static async getCapabilities(): Promise<OtaCapabilityRecord[]> {
    const local = LocalSaaSDb.get<OtaCapabilityRecord[]>(this.CAPABILITIES_KEY);
    if (local && local.length > 0) return local;

    const defaults: OtaCapabilityRecord[] = [
      {
        ota: ChannelOta.BOOKING_COM,
        name: 'Booking.com',
        syncRates: true,
        syncAvailability: true,
        syncRestrictions: true,
        importBookings: true,
        realtimePush: true,
        certRequired: false,
        certStatus: 'certified'
      },
      {
        ota: ChannelOta.AIRBNB,
        name: 'Airbnb',
        syncRates: true,
        syncAvailability: true,
        syncRestrictions: true,
        importBookings: true,
        realtimePush: true,
        certRequired: false,
        certStatus: 'certified'
      },
      {
        ota: ChannelOta.EXPEDIA,
        name: 'Expedia Partner Solutions',
        syncRates: true,
        syncAvailability: true,
        syncRestrictions: true,
        importBookings: true,
        realtimePush: false,
        certRequired: true,
        certStatus: 'certified'
      },
      {
        ota: ChannelOta.GOOGLE_HOTELS,
        name: 'Google Hotels XML',
        syncRates: true,
        syncAvailability: true,
        syncRestrictions: true,
        importBookings: false,
        realtimePush: false,
        certRequired: true,
        certStatus: 'in_progress'
      },
      {
        ota: ChannelOta.VRBO,
        name: 'Vrbo Listing API',
        syncRates: false,
        syncAvailability: true,
        syncRestrictions: false,
        importBookings: true,
        realtimePush: false,
        certRequired: true,
        certStatus: 'not_started'
      }
    ];

    LocalSaaSDb.set(this.CAPABILITIES_KEY, defaults);
    return defaults;
  }

  // --- SEED DEFAULTS ---
  private static getDefaultConnections(tenantId: string): OtaConnection[] {
    return [
      {
        id: 'conn_booking',
        tenantId,
        ota: ChannelOta.BOOKING_COM,
        active: true,
        connectedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        lastSync: new Date().toISOString(),
        errorCount: 0
      },
      {
        id: 'conn_airbnb',
        tenantId,
        ota: ChannelOta.AIRBNB,
        active: true,
        connectedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        lastSync: new Date().toISOString(),
        errorCount: 1
      },
      {
        id: 'conn_expedia',
        tenantId,
        ota: ChannelOta.EXPEDIA,
        active: false,
        connectedAt: new Date().toISOString(),
        errorCount: 0
      },
      {
        id: 'conn_google',
        tenantId,
        ota: ChannelOta.GOOGLE_HOTELS,
        active: false,
        connectedAt: new Date().toISOString(),
        errorCount: 0
      }
    ];
  }

  private static getDefaultSyncHistory(tenantId: string): OtaSyncRecord[] {
    return [
      {
        id: 'sync_h_1',
        tenantId,
        ota: ChannelOta.BOOKING_COM,
        action: 'sync_availability',
        status: 'success',
        message: 'Successfully synced 12 available nights for Room BCOM-RM-101',
        latencyMs: 142,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 'sync_h_2',
        tenantId,
        ota: ChannelOta.AIRBNB,
        action: 'sync_rates',
        status: 'success',
        message: 'Successfully updated standard rates to $145.00 for Listing ABNB-LIST-9872',
        latencyMs: 110,
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString()
      },
      {
        id: 'sync_h_3',
        tenantId,
        ota: ChannelOta.BOOKING_COM,
        action: 'import_booking',
        status: 'success',
        message: 'Imported reservation BCOM-883192 (Carlos Gomez)',
        latencyMs: 165,
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'sync_h_4',
        tenantId,
        ota: ChannelOta.AIRBNB,
        action: 'sync_availability',
        status: 'failed',
        message: 'Unauthorized access. Refresh token invalid or expired.',
        latencyMs: 84,
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      }
    ];
  }

  private static getDefaultErrors(tenantId: string): OtaErrorRecord[] {
    return [
      {
        id: 'err_rec_1',
        tenantId,
        ota: ChannelOta.AIRBNB,
        code: 'AUTH_FAILED',
        category: 'authentication',
        message: 'Invalid access token. Client authentication failed.',
        resolutionSuggestion: 'Go to Credential Manager, click "Rotar Credenciales" or re-authorize OAuth credentials.',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        resolved: false
      },
      {
        id: 'err_rec_2',
        tenantId,
        ota: ChannelOta.BOOKING_COM,
        code: 'RATE_LIMIT_EXCEEDED',
        category: 'rate_limit',
        message: 'Too many inventory updates sent in the last 15 minutes (HTTP 429).',
        resolutionSuggestion: 'StayFlow SyncEngine will automatically delay and retry using exponential backoff.',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        resolved: true,
        resolvedAt: new Date(Date.now() - 11.5 * 3600 * 1000).toISOString()
      }
    ];
  }

  private static getDefaultSchedules(tenantId: string): OtaSchedule[] {
    return [
      {
        id: 'sched_booking',
        tenantId,
        ota: ChannelOta.BOOKING_COM,
        intervalMinutes: 15,
        active: true,
        lastRun: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 7 * 60 * 1000).toISOString(),
        mode: 'automatic'
      },
      {
        id: 'sched_airbnb',
        tenantId,
        ota: ChannelOta.AIRBNB,
        intervalMinutes: 30,
        active: true,
        lastRun: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
        mode: 'automatic'
      },
      {
        id: 'sched_expedia',
        tenantId,
        ota: ChannelOta.EXPEDIA,
        intervalMinutes: 60,
        active: false,
        nextRun: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        mode: 'manual'
      }
    ];
  }
}
