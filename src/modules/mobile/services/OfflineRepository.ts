import { HousekeepingTask, MaintenanceOrder } from '../../stay-operations/types';
import { Accommodation } from '../../../types';

/**
 * OfflineRepository simulates an on-device encrypted cache (such as SQLite with SQLCipher
 * or SecureStore in React Native / Keychain in iOS). It prepares the storage schema for
 * full local encryption and supports viewing critical entities without active connection.
 */
export class OfflineRepository {
  private static readonly STORAGE_PREFIX = 'sf_offline_secure_';
  private static readonly ENCRYPTION_KEY_STUB = 'stayflow-mobile-secret-vault-key';

  /**
   * Simple reversible cipher mimicking on-device encryption (e.g. AES/ChaCha20 placeholder).
   */
  private static encrypt(data: string): string {
    // Standard Base64 obfuscuration to simulate encrypted storage payload
    try {
      return btoa(encodeURIComponent(data));
    } catch {
      return data;
    }
  }

  private static decrypt(cipher: string): string {
    try {
      return decodeURIComponent(atob(cipher));
    } catch {
      return cipher;
    }
  }

  private static getSecureItem<T>(key: string): T | null {
    const raw = localStorage.getItem(this.STORAGE_PREFIX + key);
    if (!raw) return null;
    try {
      const decrypted = this.decrypt(raw);
      return JSON.parse(decrypted);
    } catch (e) {
      console.error(`Error decrypting offline storage key ${key}:`, e);
      return null;
    }
  }

  private static setSecureItem(key: string, data: any): void {
    try {
      const serialized = JSON.stringify(data);
      const encrypted = this.encrypt(serialized);
      localStorage.setItem(this.STORAGE_PREFIX + key, encrypted);
    } catch (e) {
      console.error(`Error encrypting offline storage key ${key}:`, e);
    }
  }

  // --- Cache operations ---
  public static cacheAccommodations(tenantId: string, items: Accommodation[]): void {
    this.setSecureItem(`accommodations_${tenantId}`, items);
  }

  public static getCachedAccommodations(tenantId: string): Accommodation[] {
    return this.getSecureItem<Accommodation[]>(`accommodations_${tenantId}`) || [];
  }

  public static cacheHousekeepingTasks(tenantId: string, items: HousekeepingTask[]): void {
    this.setSecureItem(`housekeeping_${tenantId}`, items);
  }

  public static getCachedHousekeepingTasks(tenantId: string): HousekeepingTask[] {
    return this.getSecureItem<HousekeepingTask[]>(`housekeeping_${tenantId}`) || [];
  }

  public static cacheMaintenanceOrders(tenantId: string, items: MaintenanceOrder[]): void {
    this.setSecureItem(`maintenance_${tenantId}`, items);
  }

  public static getCachedMaintenanceOrders(tenantId: string): MaintenanceOrder[] {
    return this.getSecureItem<MaintenanceOrder[]>(`maintenance_${tenantId}`) || [];
  }

  // --- Single entity state mutators for offline view ---
  public static updateCachedTaskStatus(tenantId: string, taskId: string, status: any): void {
    const tasks = this.getCachedHousekeepingTasks(tenantId);
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx >= 0) {
      tasks[idx].status = status;
      tasks[idx].updatedAt = new Date().toISOString();
      this.cacheHousekeepingTasks(tenantId, tasks);
    }
  }

  public static updateCachedOrderStatus(tenantId: string, orderId: string, status: any, comments?: string): void {
    const orders = this.getCachedMaintenanceOrders(tenantId);
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      orders[idx].status = status;
      if (comments !== undefined) orders[idx].comments = comments;
      orders[idx].updatedAt = new Date().toISOString();
      this.cacheMaintenanceOrders(tenantId, orders);
    }
  }

  public static clearCache(tenantId: string): void {
    localStorage.removeItem(this.STORAGE_PREFIX + `accommodations_${tenantId}`);
    localStorage.removeItem(this.STORAGE_PREFIX + `housekeeping_${tenantId}`);
    localStorage.removeItem(this.STORAGE_PREFIX + `maintenance_${tenantId}`);
  }
}
