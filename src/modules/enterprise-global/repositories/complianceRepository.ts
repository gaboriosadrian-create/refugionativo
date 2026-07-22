import {
  AuditTrailRecord,
  ComplianceSettings,
  ConsentRecord,
  ObservabilityLog
} from '../types';

const INITIAL_COMPLIANCE_SETTINGS: ComplianceSettings = {
  id: 'cs-org-stayflow-global',
  organizationId: 'org-stayflow-global',
  dataRetentionDays: 1825, // 5 years
  enableAuditLogging: true,
  gdprEnabled: true,
  lgpdEnabled: true,
  ccpaEnabled: true,
  automaticAnonymizationDays: 730, // 2 years after checkout
  privacyPolicyUrl: 'https://stayflow.com/privacy-policy',
  dpoEmail: 'dpo@stayflow.com',
  updatedAt: '2026-07-01T12:00:00.000Z'
};

const INITIAL_AUDIT_LOGS: AuditTrailRecord[] = [
  {
    id: 'audit-101',
    organizationId: 'org-stayflow-global',
    tenantId: 'tenant-default',
    actorEmail: 'director.global@stayflow.com',
    actorRole: 'CORPORATE_ADMIN',
    action: 'UPDATE_ENTERPRISE_CURRENCY_RATES',
    category: 'config_change',
    targetResource: 'currencies/EUR',
    details: { oldRate: 0.91, newRate: 0.92, source: 'Central Bank Manual Override' },
    timestamp: '2026-07-22T04:15:00.000Z',
    ipAddress: '190.160.12.88'
  },
  {
    id: 'audit-102',
    organizationId: 'org-stayflow-global',
    tenantId: 'tenant-default',
    actorEmail: 'cfo@stayflow.com',
    actorRole: 'FINANCIAL_MANAGER',
    action: 'EXPORT_CONSOLIDATED_FINANCIAL_REPORT',
    category: 'export',
    targetResource: 'reports/cross-property-revenue',
    details: { format: 'CSV', propertiesIncluded: 8, currency: 'USD' },
    timestamp: '2026-07-21T18:30:00.000Z',
    ipAddress: '186.105.42.10'
  },
  {
    id: 'audit-103',
    organizationId: 'org-stayflow-global',
    tenantId: 'tenant-default',
    actorEmail: 'latam.manager@stayflow.com',
    actorRole: 'REGIONAL_MANAGER',
    action: 'UPDATE_REGIONAL_CANCELLATION_POLICY',
    category: 'config_change',
    targetResource: 'enterprisePolicies/policy-canc-global',
    details: { region: 'LATAM-SOUTH', policyVersion: '2.1' },
    timestamp: '2026-07-20T11:45:00.000Z',
    ipAddress: '201.239.88.102'
  }
];

const INITIAL_CONSENTS: ConsentRecord[] = [
  {
    id: 'cnst-001',
    userId: 'usr-guest-501',
    guestEmail: 'alex.morgan@gmail.com',
    tenantId: 'tenant-default',
    organizationId: 'org-stayflow-global',
    consentType: 'privacy',
    status: 'granted',
    ipAddress: '190.160.12.88',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: '2026-07-15T09:20:00.000Z'
  },
  {
    id: 'cnst-002',
    userId: 'usr-guest-502',
    guestEmail: 'martina.silva@br.com',
    tenantId: 'tenant-default',
    organizationId: 'org-stayflow-global',
    consentType: 'data_processing',
    status: 'granted',
    ipAddress: '200.180.15.22',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
    timestamp: '2026-07-18T14:10:00.000Z'
  }
];

const INITIAL_OBSERVABILITY_LOGS: ObservabilityLog[] = [
  {
    id: 'obs-01',
    organizationId: 'org-stayflow-global',
    tenantId: 'tenant-default',
    type: 'usage_country',
    message: 'Tráfico de reservas con alta demanda desde Brasil (BR) y Chile (CL)',
    metadata: { country: 'BR', bookingsCount: 42, growthRate: '+18%' },
    timestamp: '2026-07-22T05:00:00.000Z',
    country: 'BR',
    language: 'pt'
  },
  {
    id: 'obs-02',
    organizationId: 'org-stayflow-global',
    tenantId: 'tenant-default',
    type: 'usage_language',
    message: 'Sesión activa en idioma Portugués (pt-BR) iniciada en Booking Engine',
    metadata: { userAgent: 'Mobile Safari', ipCountry: 'BR' },
    timestamp: '2026-07-22T05:12:00.000Z',
    country: 'BR',
    language: 'pt'
  }
];

class ComplianceRepository {
  private complianceSettings: ComplianceSettings = { ...INITIAL_COMPLIANCE_SETTINGS };
  private auditLogs: AuditTrailRecord[] = [...INITIAL_AUDIT_LOGS];
  private consents: ConsentRecord[] = [...INITIAL_CONSENTS];
  private observabilityLogs: ObservabilityLog[] = [...INITIAL_OBSERVABILITY_LOGS];

  public getComplianceSettings(): ComplianceSettings {
    return this.complianceSettings;
  }

  public updateComplianceSettings(updates: Partial<ComplianceSettings>): ComplianceSettings {
    this.complianceSettings = {
      ...this.complianceSettings,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.complianceSettings;
  }

  public getAuditLogs(): AuditTrailRecord[] {
    return this.auditLogs;
  }

  public logAudit(record: Omit<AuditTrailRecord, 'id' | 'timestamp'>): AuditTrailRecord {
    const newRecord: AuditTrailRecord = {
      ...record,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(newRecord);
    return newRecord;
  }

  public getConsents(): ConsentRecord[] {
    return this.consents;
  }

  public recordConsent(consent: Omit<ConsentRecord, 'id' | 'timestamp'>): ConsentRecord {
    const newConsent: ConsentRecord = {
      ...consent,
      id: `cnst-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.consents.unshift(newConsent);
    return newConsent;
  }

  public getObservabilityLogs(): ObservabilityLog[] {
    return this.observabilityLogs;
  }

  public logObservability(log: Omit<ObservabilityLog, 'id' | 'timestamp'>): ObservabilityLog {
    const newLog: ObservabilityLog = {
      ...log,
      id: `obs-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.observabilityLogs.unshift(newLog);
    return newLog;
  }
}

export const complianceRepository = new ComplianceRepository();
