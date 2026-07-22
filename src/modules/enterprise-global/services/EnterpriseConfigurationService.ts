import { OrganizationSettings, EnterprisePolicy } from '../types';
import { organizationRepository } from '../repositories/organizationRepository';
import { complianceRepository } from '../repositories/complianceRepository';

export class EnterpriseConfigurationService {
  public static getPolicies(organizationId: string): EnterprisePolicy[] {
    return organizationRepository.getPolicies(organizationId);
  }

  public static createPolicy(policy: Omit<EnterprisePolicy, 'id' | 'createdAt' | 'updatedAt'>): EnterprisePolicy {
    const created = organizationRepository.createPolicy(policy);
    complianceRepository.logAudit({
      organizationId: policy.organizationId,
      tenantId: 'tenant-default',
      actorEmail: 'system.admin@stayflow.com',
      actorRole: 'CORPORATE_ADMIN',
      action: 'CREATE_ENTERPRISE_POLICY',
      category: 'config_change',
      targetResource: `enterprisePolicies/${created.id}`,
      details: { name: policy.name, type: policy.policyType, version: policy.version },
      ipAddress: '127.0.0.1'
    });
    return created;
  }
}
