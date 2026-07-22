import { isFirebaseConfigured } from '../firebase/firebase';
import { getDocument, saveDocument } from '../firebase/firestore';
import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';
import { TenantConfig, SaaSPlan, TenantStatus, FeatureFlag } from './TenantTypes';
import { LoggingService } from '../logger/LoggingService';

// Standard mapping of Plans to their automatically enabled features
export const PLAN_FEATURES_MAP: Record<SaaSPlan, FeatureFlag[]> = {
  Starter: ['bookingEngine'],
  Professional: ['bookingEngine', 'payments', 'checkinDigital'],
  Business: ['bookingEngine', 'payments', 'checkinDigital', 'analytics', 'marketing'],
  Enterprise: ['bookingEngine', 'payments', 'checkinDigital', 'analytics', 'marketing', 'channelManager', 'multiProperty'],
};

export class TenantConfigService {
  private static CACHE: Record<string, TenantConfig> = {};

  /**
   * Generates a default configuration for a tenant id
   */
  public static getDefaultConfig(tenantId: string): TenantConfig {
    // Map existing resort ids to appropriate plans for backward compatibility
    let plan: SaaSPlan = 'Starter';
    let commercialName = 'Refugio Nativo';
    let currency = 'ARS';
    let email = 'contacto@refugionativo.com';

    if (tenantId === 'patagonia-refugio') {
      plan = 'Professional';
      commercialName = 'Refugio Nativo';
      currency = 'ARS';
      email = 'gaboriosadrian@gmail.com';
    } else if (tenantId === 'andes-glamping') {
      plan = 'Enterprise'; // Andes has many amenities/telescope, let's give them Enterprise
      commercialName = 'Andes Glamping Domes';
      currency = 'USD';
      email = 'domos@andesglamping.com';
    } else {
      commercialName = tenantId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return {
      logo: '',
      commercialName,
      contractedPlan: plan,
      status: 'active',
      language: 'es',
      currency,
      timezone: tenantId === 'andes-glamping' ? 'America/Argentina/Mendoza' : 'America/Argentina/Buenos_Aires',
      domain: `${tenantId}.stayflow.app`,
      branding: {
        primaryColor: '#0f172a',
        secondaryColor: '#0284c7',
        fontFamily: 'Inter',
      },
      emails: {
        supportEmail: email,
        bookingNotificationsEmail: email,
        senderName: commercialName,
      },
      regionalSettings: {
        country: 'Argentina',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'es-AR',
      }
    };
  }

  /**
   * Fetches the tenant configuration from Firestore or LocalSaaSDb
   */
  public static async getTenantConfig(tenantId: string): Promise<TenantConfig> {
    if (this.CACHE[tenantId]) {
      return this.CACHE[tenantId];
    }

    const path = `resorts/${tenantId}/saas_config/settings`;
    const localKey = `saas_config_${tenantId}`;

    try {
      if (isFirebaseConfigured) {
        const docData = await getDocument(path);
        if (docData) {
          this.CACHE[tenantId] = docData as any as TenantConfig;
          return docData as any as TenantConfig;
        }
      }

      // Check LocalSaaSDb
      const localData = LocalSaaSDb.get<TenantConfig>(localKey);
      if (localData) {
        this.CACHE[tenantId] = localData;
        return localData;
      }
    } catch (err) {
      console.warn(`[STAYFLOW] Failed to load tenant config for ${tenantId}:`, err);
    }

    // Default Fallback
    const defaultConfig = this.getDefaultConfig(tenantId);
    await this.saveTenantConfig(tenantId, defaultConfig);
    this.CACHE[tenantId] = defaultConfig;
    return defaultConfig;
  }

  /**
   * Saves or updates the tenant configuration
   */
  public static async saveTenantConfig(tenantId: string, config: TenantConfig): Promise<void> {
    this.CACHE[tenantId] = config;
    const path = `resorts/${tenantId}/saas_config/settings`;
    const localKey = `saas_config_${tenantId}`;

    try {
      if (isFirebaseConfigured) {
        await saveDocument(path, config, true);
      }
      LocalSaaSDb.set(localKey, config);
      await LoggingService.info(`Tenant configuration updated for: ${tenantId}`, { contractedPlan: config.contractedPlan, status: config.status }, tenantId);
    } catch (err) {
      console.error(`[STAYFLOW] Failed to save tenant config for ${tenantId}:`, err);
    }
  }

  /**
   * Check if a feature is enabled for a given tenant config
   */
  public static isFeatureEnabled(config: TenantConfig, feature: FeatureFlag): boolean {
    // 1. Check feature override first
    if (config.featuresOverride && config.featuresOverride[feature] !== undefined) {
      return !!config.featuresOverride[feature];
    }

    // 2. Check Plan permissions
    const allowedFeatures = PLAN_FEATURES_MAP[config.contractedPlan] || [];
    return allowedFeatures.includes(feature);
  }
}
