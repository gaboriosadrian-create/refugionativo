import { TenantConfig, SaaSPlan, TenantStatus } from '../../core/tenant/TenantTypes';

export interface SuperAdminDashboardMetrics {
  totalClients: number;
  activeClients: number;
  suspendedClients: number;
  trialClients: number;
  totalReservations: number;
  dailyReservations: number;
  completedPayments: number;
  estimatedRevenue: number;
  totalUsers: number;
  storageUtilization: number; // in MB
  totalAccommodationsCount: number;
}

export interface TenantWithConfig {
  id: string; // tenant ID
  name: string;
  slug: string;
  businessType: 'CABIN' | 'HOTEL' | 'GLAMPING' | 'CAMPING' | 'OTHER';
  plan: SaaSPlan;
  active: boolean;
  email: string;
  phone: string;
  domain?: string;
  createdAt: string;
  status: TenantStatus;
  commercialStatus: 'Trial' | 'Activo' | 'Suspendido' | 'Cancelado' | 'Pendiente de Pago' | 'Vencido';
  config: TenantConfig;
}

export interface SaaSPlanConfig {
  id: SaaSPlan;
  name: string;
  price: number;
  currency: string;
  maxUsers: number;
  maxAccommodations: number;
  maxStorageMB: number;
  enabledFeatures: string[];
}

export interface PlatformHealthComponent {
  name: string;
  status: 'healthy' | 'warning' | 'degraded' | 'offline';
  latencyMs?: number;
  lastChecked: string;
  details?: string;
}

export interface PlatformHealthStatus {
  overallStatus: 'healthy' | 'warning' | 'degraded' | 'offline';
  components: PlatformHealthComponent[];
  lastSyncTime: string;
}

export interface GlobalPlatformConfig {
  platformName: string;
  logoUrl?: string;
  contactEmail: string;
  supportEmail: string;
  phone?: string;
  socialNetworks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  commercialWebsite?: string;
  version: string;
  maintenanceMode: boolean;
  globalNotificationMessage?: string;
}

export interface GlobalAuditLog {
  id: string;
  timestamp: string;
  tenantId: string;
  userId: string;
  userEmail?: string;
  action: string; // e.g. "TENANT_CREATED", "PLAN_UPGRADED", "TENANT_SUSPENDED"
  entityType: string; // e.g. "tenant", "plan", "user", "global_config"
  entityId: string;
  details?: string;
  previousState?: any;
  newState?: any;
}
