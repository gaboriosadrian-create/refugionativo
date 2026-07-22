export type CorporateRole =
  | 'CORPORATE_ADMIN'
  | 'REGIONAL_MANAGER'
  | 'BRAND_MANAGER'
  | 'OPERATIONS_MANAGER'
  | 'FINANCIAL_MANAGER';

export interface CorporateRoleDefinition {
  role: CorporateRole;
  label: string;
  description: string;
  permissions: string[];
}

export type SupportedLanguageCode = 'es' | 'en' | 'pt' | string;

export interface LanguageConfig {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  flag: string; // Emoji flag or icon code
  isRTL?: boolean;
  enabled: boolean;
  isDefault?: boolean;
}

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

export interface TranslationRecord {
  id: string;
  language: SupportedLanguageCode;
  namespace: string;
  translations: Record<string, string>;
  lastUpdated: string;
  updatedBy?: string;
}

export interface CurrencyConfig {
  code: string; // e.g. "USD", "EUR", "BRL", "ARS", "CLP", "MXN"
  symbol: string; // e.g. "$", "€", "R$"
  name: string;
  exchangeRateToBase: number; // Rate relative to base currency (base = 1.0)
  decimalPlaces: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  symbolPosition: 'prefix' | 'suffix';
  isBaseCurrency?: boolean;
  enabled: boolean;
}

export interface LocalizationConfig {
  id: string;
  tenantId: string;
  organizationId?: string;
  defaultLanguage: SupportedLanguageCode;
  defaultCurrency: string;
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  decimalSeparator: string;
  thousandsSeparator: string;
  defaultTaxRate: number;
  taxLabel: string;
  addressFormat: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  baseCurrency: string;
  defaultTimezone: string;
  country: string;
  plan: 'enterprise' | 'custom';
  status: 'active' | 'suspended';
  brandIds: string[];
  propertyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  brandColor: string;
  secondaryColor?: string;
  description?: string;
  propertyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  id: string;
  organizationId: string;
  sharedPolicies: Record<string, any>;
  globalAmenities: string[];
  sharedBranding: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily?: string;
    customCss?: string;
  };
  allowedCurrencies: string[];
  allowedLanguages: string[];
  autoSyncOTAs: boolean;
  centralizedBilling: boolean;
  updatedAt: string;
}

export interface OrganizationUser {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  corporateRole: CorporateRole;
  assignedBrands: string[]; // Brand IDs
  assignedCountries: string[]; // Country ISO codes
  assignedPropertyIds: string[]; // Property / Resort IDs
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface RegionalManager {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  regionCode: string;
  regionName: string;
  assignedCountries: string[];
  propertyIds: string[];
  createdAt: string;
}

export interface PropertyMetrics {
  propertyId: string;
  propertyName: string;
  brandId: string;
  brandName: string;
  organizationId: string;
  organizationName: string;
  country: string;
  countryFlag: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  totalRevenue: number;
  adr: number; // Average Daily Rate
  revpar: number; // Revenue Per Available Room
  totalBookings: number;
  cancellations: number;
  cancellationRate: number;
  maintenancePending: number;
  housekeepingPending: number;
  nativeCurrency: string;
  revenueInBaseCurrency: number;
}

export interface CrossPropertyFilter {
  organizationId?: string;
  brandId?: string;
  country?: string;
  propertyId?: string;
  dateRange: 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year';
  displayCurrency: string;
}

export interface ConsentRecord {
  id: string;
  userId?: string;
  guestEmail?: string;
  tenantId: string;
  organizationId?: string;
  consentType: 'cookies' | 'terms' | 'privacy' | 'marketing' | 'data_processing';
  status: 'granted' | 'revoked';
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface AuditTrailRecord {
  id: string;
  organizationId?: string;
  tenantId: string;
  actorEmail: string;
  actorRole: string;
  action: string; // e.g. "UPDATE_RATE_POLICY", "EXPORT_GUEST_DATA"
  category: 'security' | 'data_access' | 'config_change' | 'export' | 'deletion';
  targetResource: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress: string;
}

export interface ComplianceSettings {
  id: string;
  organizationId: string;
  dataRetentionDays: number;
  enableAuditLogging: boolean;
  gdprEnabled: boolean;
  lgpdEnabled: boolean;
  ccpaEnabled: boolean;
  automaticAnonymizationDays: number;
  privacyPolicyUrl: string;
  dpoEmail: string; // Data Protection Officer
  updatedAt: string;
}

export interface EnterprisePolicy {
  id: string;
  organizationId: string;
  policyType: 'cancellation' | 'privacy' | 'security' | 'financial' | 'operational';
  name: string;
  content: string;
  version: string;
  isGlobal: boolean;
  appliesToBrands: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ObservabilityLog {
  id: string;
  organizationId?: string;
  tenantId: string;
  type: 'usage_country' | 'usage_language' | 'config_change' | 'translation_missing' | 'error';
  message: string;
  metadata: Record<string, any>;
  timestamp: string;
  country?: string;
  language?: string;
}
