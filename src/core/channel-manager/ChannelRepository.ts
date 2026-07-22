import { isFirebaseConfigured } from '../firebase/firebase';
import { getDocument, saveDocument, getResortSubcollection } from '../firebase/firestore';
import { doc, getDocs, deleteDoc } from 'firebase/firestore';
import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';
import { Logger } from '../logger/Logger';
import { TenantManager } from '../tenant/TenantManager';
import {
  ChannelOta,
  ChannelRegistryEntry,
  InventoryMapping,
  RateMapping,
  SyncQueueItem,
  SyncLog,
  ConflictReport
} from './ChannelManagerTypes';

export class ChannelRepository {
  private static REGISTRY_KEY = 'channelRegistry';
  private static INVENTORY_MAPPING_KEY = 'channelInventoryMappings';
  private static RATE_MAPPING_KEY = 'channelRateMappings';
  private static QUEUE_KEY = 'channelSyncQueue';
  private static LOGS_KEY = 'channelSyncLogs';
  private static CONFLICTS_KEY = 'channelConflicts';

  private static getTenantId(tenantId?: string): string {
    return tenantId || TenantManager.getCurrentTenantId() || 'default-resort';
  }

  // --- CHANNEL REGISTRY ---
  public static async getRegistry(tenantId?: string): Promise<ChannelRegistryEntry[]> {
    const tid = this.getTenantId(tenantId);

    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.REGISTRY_KEY);
        const snap = await getDocs(colRef);
        const list: ChannelRegistryEntry[] = [];
        snap.forEach(d => {
          list.push({ ota: d.id as ChannelOta, ...d.data() } as ChannelRegistryEntry);
        });
        if (list.length > 0) return list;
      } catch (err) {
        Logger.error(`Error loading channel registry from Firestore for tenant ${tid}:`, err);
      }
    }

    const local = LocalSaaSDb.get<ChannelRegistryEntry[]>(`${this.REGISTRY_KEY}_${tid}`);
    if (local && local.length > 0) return local;

    // Default channels seeded
    const defaults = this.getDefaultRegistry();
    LocalSaaSDb.set(`${this.REGISTRY_KEY}_${tid}`, defaults);
    return defaults;
  }

  public static async saveRegistryEntry(entry: ChannelRegistryEntry, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.REGISTRY_KEY}/${entry.ota}`;
        await saveDocument(path, entry, true);
      } catch (err) {
        Logger.error(`Error saving registry entry to Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getRegistry(tid);
    const idx = list.findIndex(r => r.ota === entry.ota);
    if (idx !== -1) {
      list[idx] = entry;
    } else {
      list.push(entry);
    }
    LocalSaaSDb.set(`${this.REGISTRY_KEY}_${tid}`, list);
  }

  // --- INVENTORY MAPPING ---
  public static async getInventoryMappings(tenantId?: string): Promise<InventoryMapping[]> {
    const tid = this.getTenantId(tenantId);

    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.INVENTORY_MAPPING_KEY);
        const snap = await getDocs(colRef);
        const list: InventoryMapping[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as InventoryMapping);
        });
        if (list.length > 0) return list;
      } catch (err) {
        Logger.error(`Error loading inventory mappings from Firestore for tenant ${tid}:`, err);
      }
    }

    const local = LocalSaaSDb.get<InventoryMapping[]>(`${this.INVENTORY_MAPPING_KEY}_${tid}`);
    if (local && local.length > 0) return local;

    // Seed defaults
    const defaults = this.getDefaultInventoryMappings(tid);
    LocalSaaSDb.set(`${this.INVENTORY_MAPPING_KEY}_${tid}`, defaults);
    return defaults;
  }

  public static async saveInventoryMapping(mapping: InventoryMapping, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.INVENTORY_MAPPING_KEY}/${mapping.id}`;
        await saveDocument(path, mapping, true);
      } catch (err) {
        Logger.error(`Error saving inventory mapping to Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getInventoryMappings(tid);
    const idx = list.findIndex(m => m.id === mapping.id);
    if (idx !== -1) {
      list[idx] = mapping;
    } else {
      list.push(mapping);
    }
    LocalSaaSDb.set(`${this.INVENTORY_MAPPING_KEY}_${tid}`, list);
  }

  public static async deleteInventoryMapping(id: string, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.INVENTORY_MAPPING_KEY);
        await deleteDoc(doc(colRef, id));
      } catch (err) {
        Logger.error(`Error deleting inventory mapping from Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getInventoryMappings(tid);
    const filtered = list.filter(m => m.id !== id);
    LocalSaaSDb.set(`${this.INVENTORY_MAPPING_KEY}_${tid}`, filtered);
  }

  // --- RATE MAPPING ---
  public static async getRateMappings(tenantId?: string): Promise<RateMapping[]> {
    const tid = this.getTenantId(tenantId);

    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.RATE_MAPPING_KEY);
        const snap = await getDocs(colRef);
        const list: RateMapping[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as RateMapping);
        });
        if (list.length > 0) return list;
      } catch (err) {
        Logger.error(`Error loading rate mappings from Firestore for tenant ${tid}:`, err);
      }
    }

    const local = LocalSaaSDb.get<RateMapping[]>(`${this.RATE_MAPPING_KEY}_${tid}`);
    if (local && local.length > 0) return local;

    // Seed defaults
    const defaults = this.getDefaultRateMappings(tid);
    LocalSaaSDb.set(`${this.RATE_MAPPING_KEY}_${tid}`, defaults);
    return defaults;
  }

  public static async saveRateMapping(mapping: RateMapping, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.RATE_MAPPING_KEY}/${mapping.id}`;
        await saveDocument(path, mapping, true);
      } catch (err) {
        Logger.error(`Error saving rate mapping to Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getRateMappings(tid);
    const idx = list.findIndex(m => m.id === mapping.id);
    if (idx !== -1) {
      list[idx] = mapping;
    } else {
      list.push(mapping);
    }
    LocalSaaSDb.set(`${this.RATE_MAPPING_KEY}_${tid}`, list);
  }

  public static async deleteRateMapping(id: string, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.RATE_MAPPING_KEY);
        await deleteDoc(doc(colRef, id));
      } catch (err) {
        Logger.error(`Error deleting rate mapping from Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getRateMappings(tid);
    const filtered = list.filter(m => m.id !== id);
    LocalSaaSDb.set(`${this.RATE_MAPPING_KEY}_${tid}`, filtered);
  }

  // --- SYNC QUEUE ---
  public static async getQueue(tenantId?: string): Promise<SyncQueueItem[]> {
    const tid = this.getTenantId(tenantId);

    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.QUEUE_KEY);
        const snap = await getDocs(colRef);
        const list: SyncQueueItem[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as SyncQueueItem);
        });
        return list;
      } catch (err) {
        Logger.error(`Error loading sync queue from Firestore for tenant ${tid}:`, err);
      }
    }

    const local = LocalSaaSDb.get<SyncQueueItem[]>(`${this.QUEUE_KEY}_${tid}`);
    return local || [];
  }

  public static async saveQueueItem(item: SyncQueueItem, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.QUEUE_KEY}/${item.id}`;
        await saveDocument(path, item, true);
      } catch (err) {
        Logger.error(`Error saving queue item to Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getQueue(tid);
    const idx = list.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    LocalSaaSDb.set(`${this.QUEUE_KEY}_${tid}`, list);
  }

  public static async deleteQueueItem(id: string, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.QUEUE_KEY);
        await deleteDoc(doc(colRef, id));
      } catch (err) {
        Logger.error(`Error deleting queue item from Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getQueue(tid);
    const filtered = list.filter(i => i.id !== id);
    LocalSaaSDb.set(`${this.QUEUE_KEY}_${tid}`, filtered);
  }

  // --- SYNC LOGS ---
  public static async getLogs(tenantId?: string): Promise<SyncLog[]> {
    const tid = this.getTenantId(tenantId);

    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.LOGS_KEY);
        const snap = await getDocs(colRef);
        const list: SyncLog[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as SyncLog);
        });
        return list;
      } catch (err) {
        Logger.error(`Error loading sync logs from Firestore for tenant ${tid}:`, err);
      }
    }

    const local = LocalSaaSDb.get<SyncLog[]>(`${this.LOGS_KEY}_${tid}`);
    return local || [];
  }

  public static async saveLog(log: SyncLog, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.LOGS_KEY}/${log.id}`;
        await saveDocument(path, log, true);
      } catch (err) {
        Logger.error(`Error saving sync log to Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getLogs(tid);
    list.push(log);
    if (list.length > 500) {
      list.shift();
    }
    LocalSaaSDb.set(`${this.LOGS_KEY}_${tid}`, list);
  }

  // --- CONFLICT REPORTS ---
  public static async getConflicts(tenantId?: string): Promise<ConflictReport[]> {
    const tid = this.getTenantId(tenantId);

    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tid, this.CONFLICTS_KEY);
        const snap = await getDocs(colRef);
        const list: ConflictReport[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as ConflictReport);
        });
        return list;
      } catch (err) {
        Logger.error(`Error loading conflict reports from Firestore for tenant ${tid}:`, err);
      }
    }

    const local = LocalSaaSDb.get<ConflictReport[]>(`${this.CONFLICTS_KEY}_${tid}`);
    return local || [];
  }

  public static async saveConflict(conflict: ConflictReport, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    if (isFirebaseConfigured) {
      try {
        const path = `resorts/${tid}/${this.CONFLICTS_KEY}/${conflict.id}`;
        await saveDocument(path, conflict, true);
      } catch (err) {
        Logger.error(`Error saving conflict report to Firestore for tenant ${tid}:`, err);
      }
    }

    const list = await this.getConflicts(tid);
    const idx = list.findIndex(c => c.id === conflict.id);
    if (idx !== -1) {
      list[idx] = conflict;
    } else {
      list.push(conflict);
    }
    LocalSaaSDb.set(`${this.CONFLICTS_KEY}_${tid}`, list);
  }

  // --- DEFAULTS ---
  private static getDefaultRegistry(): ChannelRegistryEntry[] {
    return [
      {
        ota: ChannelOta.BOOKING_COM,
        name: 'Booking.com',
        version: 'v1.4.2',
        active: true,
        capabilities: { syncRates: true, syncAvailability: true, syncRestrictions: true, importBookings: true, realtimePush: true },
        healthStatus: 'online'
      },
      {
        ota: ChannelOta.AIRBNB,
        name: 'Airbnb',
        version: 'v2.1.0',
        active: true,
        capabilities: { syncRates: true, syncAvailability: true, syncRestrictions: false, importBookings: true, realtimePush: true },
        healthStatus: 'online'
      },
      {
        ota: ChannelOta.EXPEDIA,
        name: 'Expedia',
        version: 'v1.1.0',
        active: false,
        capabilities: { syncRates: true, syncAvailability: true, syncRestrictions: true, importBookings: true, realtimePush: false },
        healthStatus: 'online'
      },
      {
        ota: ChannelOta.VRBO,
        name: 'Vrbo',
        version: 'v1.0.0',
        active: false,
        capabilities: { syncRates: false, syncAvailability: true, syncRestrictions: false, importBookings: true, realtimePush: false },
        healthStatus: 'online'
      },
      {
        ota: ChannelOta.GOOGLE_HOTELS,
        name: 'Google Hotels',
        version: 'v1.0.0',
        active: false,
        capabilities: { syncRates: true, syncAvailability: true, syncRestrictions: false, importBookings: false, realtimePush: false },
        healthStatus: 'online'
      }
    ];
  }

  private static getDefaultInventoryMappings(tenantId: string): InventoryMapping[] {
    return [
      {
        id: 'map_inv_1',
        tenantId,
        ota: ChannelOta.BOOKING_COM,
        stayflowCabinId: 1, // Standard Cabin ID
        otaRoomId: 'BCOM-RM-101',
        otaRoomName: 'Cabaña Alpina Superior',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'map_inv_2',
        tenantId,
        ota: ChannelOta.AIRBNB,
        stayflowCabinId: 1,
        otaRoomId: 'ABNB-LIST-9872',
        otaRoomName: 'Cabaña Bosque Exclusive',
        active: true,
        createdAt: new Date().toISOString()
      }
    ];
  }

  private static getDefaultRateMappings(tenantId: string): RateMapping[] {
    return [
      {
        id: 'map_rate_1',
        tenantId,
        ota: ChannelOta.BOOKING_COM,
        stayflowRateId: 'standard',
        otaRateId: 'BCOM-RATE-STD',
        markupPercent: 15, // To cover commission
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'map_rate_2',
        tenantId,
        ota: ChannelOta.AIRBNB,
        stayflowRateId: 'standard',
        otaRateId: 'ABNB-PRICING-BASE',
        markupPercent: 8,
        active: true,
        createdAt: new Date().toISOString()
      }
    ];
  }
}
