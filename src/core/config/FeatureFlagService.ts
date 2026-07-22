import { LoggingService } from '../logger/LoggingService';

export interface EnterpriseFeature {
  id: string;
  name: string;
  description: string;
  category: 'SaaS' | 'Marketing' | 'System' | 'Engine' | 'Beta';
  enabled: boolean;
  tenantOverrides: Record<string, boolean>; // Tenant-specific toggles
}

export class FeatureFlagService {
  private static STORAGE_KEY = 'stayflow_enterprise_feature_flags';

  private static defaultFlags: EnterpriseFeature[] = [
    {
      id: 'enableSaaS',
      name: 'Plataforma SaaS Multicliente',
      description: 'Habilita facturación automatizada de suscripciones, onboarding autónomo de tenants y panel global.',
      category: 'SaaS',
      enabled: true,
      tenantOverrides: {}
    },
    {
      id: 'enableAutomaticBackups',
      name: 'Copias de Seguridad Automatizadas',
      description: 'Generación diaria y exportación segura a almacenamiento cloud frío para recuperación ante desastres.',
      category: 'System',
      enabled: true,
      tenantOverrides: {}
    },
    {
      id: 'enableAuditLogs',
      name: 'Auditoría Global Estricta',
      description: 'Seguimiento de logs de auditoría para rastro forense, cumplimiento de regulaciones y RBAC.',
      category: 'System',
      enabled: true,
      tenantOverrides: {}
    },
    {
      id: 'enablePromotions',
      name: 'Motor de Cupones & Promociones',
      description: 'Reglas avanzadas de descuento, códigos promocionales estacionales y cupones de fidelización.',
      category: 'Marketing',
      enabled: true,
      tenantOverrides: {}
    },
    {
      id: 'enableReviews',
      name: 'Gestión de Reseñas Integrada',
      description: 'Recolección automática de feedback pos-estadía y publicación en portal de huéspedes.',
      category: 'Marketing',
      enabled: true,
      tenantOverrides: {}
    },
    {
      id: 'enableAdvancedBI',
      name: 'BI con Predicciones Predictivas AI',
      description: 'Módulo de Machine Learning para predecir ocupación óptima y tarifa media diaria.',
      category: 'Engine',
      enabled: false,
      tenantOverrides: {
        'patagonia-refugio': true
      }
    },
    {
      id: 'enableRealTimeChannels',
      name: 'Sincronización Bidireccional OTA',
      description: 'Actualizaciones XML en menos de 3 segundos para Airbnb, Booking y Expedia.',
      category: 'Engine',
      enabled: true,
      tenantOverrides: {}
    }
  ];

  /**
   * Loaded features list
   */
  public static getFeatures(): EnterpriseFeature[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        // Merge saved toggles with default schemas to preserve structures
        const parsed: EnterpriseFeature[] = JSON.parse(saved);
        return this.defaultFlags.map(def => {
          const match = parsed.find(p => p.id === def.id);
          return match ? { ...def, enabled: match.enabled, tenantOverrides: match.tenantOverrides || {} } : def;
        });
      }
    } catch (err) {
      LoggingService.warn('Could not read feature flags from localStorage, fallback to defaults');
    }
    return [...this.defaultFlags];
  }

  /**
   * Check if a feature is enabled for a given tenant or environment
   */
  public static isEnabled(featureId: string, tenantId: string = 'patagonia-refugio'): boolean {
    const features = this.getFeatures();
    const feat = features.find(f => f.id === featureId);
    if (!feat) return false;

    // Check specific tenant overrides first
    if (feat.tenantOverrides && feat.tenantOverrides[tenantId] !== undefined) {
      return feat.tenantOverrides[tenantId];
    }
    return feat.enabled;
  }

  /**
   * Save a single flag toggle
   */
  public static toggleFeature(featureId: string, enabled: boolean): void {
    const features = this.getFeatures();
    const updated = features.map(f => f.id === featureId ? { ...f, enabled } : f);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    LoggingService.info(`Feature Flag updated: ${featureId} is now ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Save a tenant-specific feature override
   */
  public static toggleTenantOverride(featureId: string, tenantId: string, enabled: boolean): void {
    const features = this.getFeatures();
    const updated = features.map(f => {
      if (f.id === featureId) {
        const overrides = { ...f.tenantOverrides, [tenantId]: enabled };
        return { ...f, tenantOverrides: overrides };
      }
      return f;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    LoggingService.info(`Feature Flag override: ${featureId} for tenant ${tenantId} is now ${enabled}`);
  }
}
