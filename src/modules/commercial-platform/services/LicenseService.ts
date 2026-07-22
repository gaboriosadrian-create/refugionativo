import { License, SaaSPlanType } from '../types';
import { CommercialRepository } from './CommercialRepository';
import { PlanService } from './PlanService';

export class LicenseService {
  public static async getLicense(tenantId: string): Promise<License | null> {
    return CommercialRepository.getLicense(tenantId);
  }

  public static async issueLicense(
    tenantId: string, 
    planId: SaaSPlanType, 
    status: 'active' | 'suspended' | 'expired' | 'trial',
    startDate: string,
    endDate: string
  ): Promise<License> {
    const plan = await PlanService.getPlan(planId);
    
    // Determine enabled modules based on plan
    const enabledModules = ['bookings', 'guests'];
    if (planId !== 'Starter') {
      enabledModules.push('payments', 'pricing');
    }
    if (planId === 'Business' || planId === 'Enterprise') {
      enabledModules.push('ai_platform', 'business_intelligence', 'channel_manager', 'revenue');
    }
    if (planId === 'Enterprise') {
      enabledModules.push('super_admin');
    }

    const license: License = {
      id: tenantId,
      tenantId,
      planId,
      status,
      startDate,
      endDate,
      maxAccommodations: plan.maxAccommodations,
      maxRooms: plan.maxRooms,
      maxUsers: plan.maxUsers,
      storageGB: plan.storageGB,
      enabledModules,
      supportLevel: plan.supportLevel,
      updatedAt: new Date().toISOString()
    };

    await CommercialRepository.saveLicense(license);
    return license;
  }

  public static async suspendLicense(tenantId: string): Promise<void> {
    const license = await this.getLicense(tenantId);
    if (license) {
      license.status = 'suspended';
      license.updatedAt = new Date().toISOString();
      await CommercialRepository.saveLicense(license);
    }
  }

  public static async reactivateLicense(tenantId: string, planId: SaaSPlanType, endDate: string): Promise<void> {
    const license = await this.getLicense(tenantId);
    if (license) {
      license.status = 'active';
      license.planId = planId;
      license.endDate = endDate;
      license.updatedAt = new Date().toISOString();
      await CommercialRepository.saveLicense(license);
    } else {
      await this.issueLicense(tenantId, planId, 'active', new Date().toISOString(), endDate);
    }
  }

  public static async validateLicense(tenantId: string): Promise<{
    valid: boolean;
    reason?: string;
    license: License | null;
  }> {
    const license = await this.getLicense(tenantId);
    if (!license) {
      return { valid: false, reason: 'Licencia no encontrada', license: null };
    }

    if (license.status === 'suspended') {
      return { valid: false, reason: 'Licencia suspendida por falta de pago', license };
    }

    const now = new Date();
    const expiration = new Date(license.endDate);
    if (now > expiration) {
      // Auto-update status to expired
      license.status = 'expired';
      await CommercialRepository.saveLicense(license);
      return { valid: false, reason: 'Licencia vencida', license };
    }

    return { valid: true, license };
  }
}
