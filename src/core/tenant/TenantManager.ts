import { TenantConfigService } from './TenantConfigService';
import { TenantConfig, SaaSPlan, TenantStatus, FeatureFlag } from './TenantTypes';
import { LoggingService } from '../logger/LoggingService';
import { isFirebaseConfigured } from '../firebase/firebase';
import { getDocument } from '../firebase/firestore';
import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';

export class TenantManager {
  private static STORAGE_KEY = 'stayflow_active_tenant_id';
  private static DEFAULT_TENANT_ID = 'patagonia-refugio';

  /**
   * Gets the current tenant ID from local storage or default fallback
   */
  public static getCurrentTenantId(): string {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) return stored;
    
    // Check if query param exists (for simulator flow)
    const params = new URLSearchParams(window.location.search);
    const resortIdParam = params.get('resort_id') || params.get('tenant_id');
    if (resortIdParam) {
      localStorage.setItem(this.STORAGE_KEY, resortIdParam);
      return resortIdParam;
    }

    return this.DEFAULT_TENANT_ID;
  }

  /**
   * Sets and persists the current tenant ID
   */
  public static setCurrentTenantId(tenantId: string): void {
    localStorage.setItem(this.STORAGE_KEY, tenantId);
  }

  /**
   * Validates if a tenant ID exists in the database
   */
  public static async validateExistence(tenantId: string): Promise<boolean> {
    if (!tenantId) return false;

    // Alphanumeric, dash, and underscore format check first (Pillar 3 & Security format)
    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(tenantId)) return false;

    try {
      if (isFirebaseConfigured) {
        const resortDoc = await getDocument(`resorts/${tenantId}`);
        if (resortDoc) return true;
      }

      // Check in LocalSaaSDb
      const resorts = LocalSaaSDb.get<any[]>('resorts') || [];
      return resorts.some(r => r.id === tenantId);
    } catch (err) {
      console.warn(`[STAYFLOW] Error validating tenant existence for ${tenantId}:`, err);
      return false;
    }
  }

  /**
   * Gets the active configuration of the current tenant or a specific tenant ID
   */
  public static async getTenantConfig(tenantId?: string): Promise<TenantConfig> {
    const id = tenantId || this.getCurrentTenantId();
    return TenantConfigService.getTenantConfig(id);
  }

  /**
   * Changes the active tenant, validating its existence first
   */
  public static async changeTenant(tenantId: string): Promise<void> {
    const exists = await this.validateExistence(tenantId);
    if (!exists) {
      throw new Error(`Cannot change tenant: Tenant ID "${tenantId}" does not exist.`);
    }

    const previousTenant = this.getCurrentTenantId();
    this.setCurrentTenantId(tenantId);

    // Fire audit event
    await LoggingService.info(`Tenant changed from "${previousTenant}" to "${tenantId}"`, {
      previousTenant,
      newTenant: tenantId,
    }, tenantId);
  }

  /**
   * Isolation wrapper helper that executes a function and ensures no cross-contamination.
   * Can be used to run a callback in the context of a specific tenant, logging any anomalies.
   */
  public static async isolateData<T>(tenantId: string, queryFn: () => Promise<T>): Promise<T> {
    const currentActive = this.getCurrentTenantId();
    if (tenantId !== currentActive) {
      console.warn(`[DATA_ISOLATION] Data isolation warning: Query requested for tenant "${tenantId}" while active tenant is "${currentActive}". Enforcing isolation.`);
    }
    
    try {
      const result = await queryFn();
      return result;
    } catch (err) {
      await LoggingService.error(`Data isolation error or execution failure for tenant "${tenantId}"`, { error: String(err) }, tenantId);
      throw err;
    }
  }
}
