import { isFirebaseConfigured } from '../firebase/firebase';

export interface SystemLimits {
  maxGuestsPerAccommodation: number;
  maxSeasonsPerResort: number;
  maxUploadSizeMb: number;
  maxReservationsPerDay: number;
  sessionTimeoutMinutes: number;
}

export interface FeatureFlags {
  enableSaaS: boolean;
  enableGallery: boolean;
  enableReviews: boolean;
  enablePromotions: boolean;
  enableAuditLogs: boolean;
  enableMultiCurrency: boolean;
  enableAutomaticBackups: boolean;
}

export interface TenantConfig {
  id: string;
  maxAccommodations: number;
  allowedFeatures: string[];
  restrictedRoles: string[];
}

export interface AppConfig {
  isFirebaseConfigured: boolean;
  environment: string;
  defaultResortId: string;
  features: FeatureFlags;
  limits: SystemLimits;
  tenantDefaults: Record<string, TenantConfig>;
  defaults: {
    appName: string;
    appSubtitle: string;
    terminology: {
      singular: string;
      plural: string;
    };
  };
}

const metaEnv = (import.meta as { env?: Record<string, string> }).env || {};

export const Config: AppConfig = {
  isFirebaseConfigured,
  environment: metaEnv.MODE || 'development',
  defaultResortId: 'patagonia-refugio',
  features: {
    enableSaaS: true,
    enableGallery: true,
    enableReviews: true,
    enablePromotions: true,
    enableAuditLogs: true,
    enableMultiCurrency: false,
    enableAutomaticBackups: false,
  },
  limits: {
    maxGuestsPerAccommodation: 20,
    maxSeasonsPerResort: 10,
    maxUploadSizeMb: 10,
    maxReservationsPerDay: 100,
    sessionTimeoutMinutes: 60,
  },
  tenantDefaults: {
    'patagonia-refugio': {
      id: 'patagonia-refugio',
      maxAccommodations: 15,
      allowedFeatures: ['gallery', 'reviews', 'promotions'],
      restrictedRoles: [],
    },
    'demo-resort': {
      id: 'demo-resort',
      maxAccommodations: 5,
      allowedFeatures: ['gallery'],
      restrictedRoles: ['viewer'],
    }
  },
  defaults: {
    appName: 'Refugio Nativo',
    appSubtitle: 'Cabañas & naturaleza',
    terminology: {
      singular: 'Cabaña',
      plural: 'Cabañas',
    },
  },
};

