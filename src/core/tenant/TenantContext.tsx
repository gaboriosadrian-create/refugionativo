import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantConfig, SaaSPlan, TenantStatus, FeatureFlag } from './TenantTypes';
import { TenantManager } from './TenantManager';
import { TenantConfigService } from './TenantConfigService';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { AuditService } from '../audit/AuditService';
import { LoggingService } from '../logger/LoggingService';

export interface TenantContextType {
  tenantId: string;
  tenantName: string;
  plan: SaaSPlan;
  estado: TenantStatus;
  configuracion: TenantConfig;
  loading: boolean;
  isFeatureEnabled: (feature: FeatureFlag) => boolean;
  changeTenant: (tenantId: string) => Promise<void>;
  updateConfiguracion: (newConfig: Partial<TenantConfig>) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string>(TenantManager.getCurrentTenantId());
  const [configuracion, setConfiguracion] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load configuration whenever tenantId changes
  const loadTenant = async (id: string) => {
    setLoading(true);
    try {
      const config = await TenantConfigService.getTenantConfig(id);
      setConfiguracion(config);
    } catch (err) {
      console.error(`[TENANT_CONTEXT] Error loading tenant configuration for ${id}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant(tenantId);
  }, [tenantId]);

  const changeTenant = async (newTenantId: string) => {
    try {
      await TenantManager.changeTenant(newTenantId);
      setTenantId(newTenantId);
      
      if (user) {
        await AuditService.record(
          newTenantId,
          user.uid,
          'CHANGE_TENANT',
          'tenant',
          newTenantId,
          { previousTenant: tenantId },
          { newTenant: newTenantId },
          user.email
        );
      }
    } catch (err: any) {
      console.error('[TENANT_CONTEXT] Error changing tenant:', err);
      if (user) {
        await LoggingService.error(`Failed to change tenant to ${newTenantId}`, { error: err.message || String(err) }, tenantId, user.uid);
      }
      throw err;
    }
  };

  const updateConfiguracion = async (newConfig: Partial<TenantConfig>) => {
    if (!configuracion) return;
    
    const previousState = { ...configuracion };
    const updated = {
      ...configuracion,
      ...newConfig,
      branding: {
        ...configuracion.branding,
        ...(newConfig.branding || {}),
      },
      emails: {
        ...configuracion.emails,
        ...(newConfig.emails || {}),
      },
      regionalSettings: {
        ...configuracion.regionalSettings,
        ...(newConfig.regionalSettings || {}),
      }
    };

    setConfiguracion(updated);
    await TenantConfigService.saveTenantConfig(tenantId, updated);

    if (user) {
      await AuditService.record(
        tenantId,
        user.uid,
        'UPDATE_CONFIG',
        'tenant_config',
        tenantId,
        previousState,
        updated,
        user.email
      );
    }
  };

  const isFeatureEnabled = (feature: FeatureFlag): boolean => {
    if (!configuracion) return false;
    return TenantConfigService.isFeatureEnabled(configuracion, feature);
  };

  // Safe default until config is loaded
  const currentConfig = configuracion || TenantConfigService.getDefaultConfig(tenantId);

  const value: TenantContextType = {
    tenantId,
    tenantName: currentConfig.commercialName,
    plan: currentConfig.contractedPlan,
    estado: currentConfig.status,
    configuracion: currentConfig,
    loading,
    isFeatureEnabled,
    changeTenant,
    updateConfiguracion,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export default TenantContext;
