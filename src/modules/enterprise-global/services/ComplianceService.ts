import {
  AuditTrailRecord,
  ComplianceSettings,
  ConsentRecord,
  ObservabilityLog
} from '../types';
import { complianceRepository } from '../repositories/complianceRepository';

export class ComplianceService {
  public static getComplianceSettings(): ComplianceSettings {
    return complianceRepository.getComplianceSettings();
  }

  public static updateComplianceSettings(updates: Partial<ComplianceSettings>): ComplianceSettings {
    const updated = complianceRepository.updateComplianceSettings(updates);
    complianceRepository.logAudit({
      tenantId: 'tenant-default',
      actorEmail: 'system.admin@stayflow.com',
      actorRole: 'CORPORATE_ADMIN',
      action: 'UPDATE_COMPLIANCE_SETTINGS',
      category: 'config_change',
      targetResource: 'compliance/settings',
      details: updates,
      ipAddress: '127.0.0.1'
    });
    return updated;
  }

  public static getAuditLogs(): AuditTrailRecord[] {
    return complianceRepository.getAuditLogs();
  }

  public static logAudit(record: Omit<AuditTrailRecord, 'id' | 'timestamp'>): AuditTrailRecord {
    return complianceRepository.logAudit(record);
  }

  public static getConsents(): ConsentRecord[] {
    return complianceRepository.getConsents();
  }

  public static recordConsent(consent: Omit<ConsentRecord, 'id' | 'timestamp'>): ConsentRecord {
    return complianceRepository.recordConsent(consent);
  }

  public static getObservabilityLogs(): ObservabilityLog[] {
    return complianceRepository.getObservabilityLogs();
  }

  public static exportGuestData(guestEmail: string): {
    guestEmail: string;
    exportedAt: string;
    consents: ConsentRecord[];
    audits: AuditTrailRecord[];
  } {
    const consents = complianceRepository.getConsents().filter(c => c.guestEmail === guestEmail);
    const audits = complianceRepository.getAuditLogs().filter(a => a.actorEmail === guestEmail);

    this.logAudit({
      tenantId: 'tenant-default',
      actorEmail: 'dpo@stayflow.com',
      actorRole: 'CORPORATE_ADMIN',
      action: 'DATA_SUBJECT_EXPORT_REQUEST',
      category: 'export',
      targetResource: `guests/${guestEmail}`,
      details: { guestEmail, format: 'JSON' },
      ipAddress: '127.0.0.1'
    });

    return {
      guestEmail,
      exportedAt: new Date().toISOString(),
      consents,
      audits
    };
  }
}
