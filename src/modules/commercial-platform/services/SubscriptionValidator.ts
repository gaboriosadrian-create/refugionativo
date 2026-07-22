import { LicenseService } from './LicenseService';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class SubscriptionValidator {
  /**
   * Main check to verify if the general tenant access is active and unexpired.
   */
  public static async isTenantActive(tenantId: string): Promise<{ active: boolean; reason?: string }> {
    const result = await LicenseService.validateLicense(tenantId);
    if (!result.valid) {
      return { active: false, reason: result.reason };
    }
    return { active: true };
  }

  /**
   * Validate if a tenant is allowed to add a new Accommodation/Property based on current limits.
   */
  public static async canAddAccommodation(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const license = await LicenseService.getLicense(tenantId);
    if (!license) return { allowed: false, reason: 'No se encontró licencia activa para validar' };

    // Suspend or expired license blocks adding records
    if (license.status === 'suspended' || license.status === 'expired') {
      return { allowed: false, reason: `Límite denegado: Licencia actual está en estado ${license.status}.` };
    }

    const accommodations = LocalSaaSDb.get<any[]>(`accommodations_${tenantId}`) || [];
    const currentCount = accommodations.length;

    if (currentCount >= license.maxRooms) { // Inside StayFlow rooms map to accommodations list
      return { 
        allowed: false, 
        reason: `Límite alcanzado: Su plan "${license.planId}" permite un máximo de ${license.maxRooms} habitaciones. Cuenta con ${currentCount} actualmente. Solicite un Upgrade.` 
      };
    }

    return { allowed: true };
  }

  /**
   * Validate if a tenant can create a new user profile based on plan limits.
   */
  public static async canAddUser(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const license = await LicenseService.getLicense(tenantId);
    if (!license) return { allowed: false, reason: 'Licencia no encontrada' };

    if (license.status === 'suspended' || license.status === 'expired') {
      return { allowed: false, reason: `Límite denegado: Licencia actual está en estado ${license.status}.` };
    }

    const resortUsers = LocalSaaSDb.get<any[]>('resortUsers') || [];
    const tenantUsers = resortUsers.filter(ru => ru.resortId === tenantId).length;

    if (tenantUsers >= license.maxUsers) {
      return {
        allowed: false,
        reason: `Límite alcanzado: Su plan "${license.planId}" permite un máximo de ${license.maxUsers} usuarios. Cuenta con ${tenantUsers} actualmente.`
      };
    }

    return { allowed: true };
  }

  /**
   * Validate if a specific module is accessible under the current license.
   */
  public static async isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean> {
    const license = await LicenseService.getLicense(tenantId);
    if (!license) return false;

    if (license.status === 'suspended' || license.status === 'expired') {
      return false;
    }

    return license.enabledModules.includes(moduleId);
  }
}
