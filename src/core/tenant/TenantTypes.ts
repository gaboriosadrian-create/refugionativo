export type SaaSPlan = 'Starter' | 'Professional' | 'Business' | 'Enterprise';

export type TenantStatus = 'active' | 'suspended' | 'pending';

export type FeatureFlag =
  | 'bookingEngine'
  | 'payments'
  | 'channelManager'
  | 'marketing'
  | 'analytics'
  | 'multiProperty'
  | 'checkinDigital';

export interface TenantBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  customCss?: string;
}

export interface TenantEmails {
  supportEmail: string;
  bookingNotificationsEmail: string;
  senderName?: string;
}

export interface TenantRegionalSettings {
  country: string;
  dateFormat: string;
  numberFormat: string;
}

export interface TenantConfig {
  logo?: string;
  commercialName: string;
  contractedPlan: SaaSPlan;
  status: TenantStatus;
  language: string;
  currency: string;
  timezone: string;
  domain?: string;
  branding: TenantBranding;
  emails: TenantEmails;
  regionalSettings: TenantRegionalSettings;
  featuresOverride?: Partial<Record<FeatureFlag, boolean>>;
}

export interface Tenant {
  id: string;
  config: TenantConfig;
}
