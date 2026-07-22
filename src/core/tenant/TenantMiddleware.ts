import { TenantConfig, FeatureFlag, SaaSPlan } from './TenantTypes';
import { TenantConfigService } from './TenantConfigService';
import { PermissionError, ValidationError, AppError } from '../errors/AppErrors';
import { UserRole } from '../../types';
import { LoggingService } from '../logger/LoggingService';

export class TenantMiddleware {
  /**
   * Validates if a tenant is active and has the required plan/features to perform an action.
   * Throws descriptive errors if any requirement is not met.
   */
  public static validateTenantAccess(
    tenantId: string,
    config: TenantConfig,
    requiredFeature?: FeatureFlag,
    requiredMinPlan?: SaaSPlan
  ): void {
    // 1. Validate Tenant ID format
    const formatRegex = /^[a-zA-Z0-9_-]+$/;
    if (!tenantId || !formatRegex.test(tenantId)) {
      throw new ValidationError(`Formato de ID de tenant inválido: "${tenantId}"`);
    }

    // 2. Validate Tenant Status
    if (config.status === 'suspended') {
      const errMsg = `El Tenant "${config.commercialName}" (${tenantId}) se encuentra suspendido. Acceso denegado.`;
      LoggingService.warn(errMsg, { tenantId, status: config.status });
      throw new PermissionError(errMsg, 'TENANT_SUSPENDED');
    }

    if (config.status === 'pending') {
      const errMsg = `El Tenant "${config.commercialName}" (${tenantId}) está pendiente de activación. Acceso limitado.`;
      LoggingService.warn(errMsg, { tenantId, status: config.status });
      throw new PermissionError(errMsg, 'TENANT_PENDING');
    }

    // 3. Validate Feature Flag Habilitada (no hardcoded ifs)
    if (requiredFeature) {
      const enabled = TenantConfigService.isFeatureEnabled(config, requiredFeature);
      if (!enabled) {
        const errMsg = `La funcionalidad "${requiredFeature}" no está incluida en tu plan actual (${config.contractedPlan}). Actualiza tu suscripción para continuar.`;
        LoggingService.warn(errMsg, { tenantId, feature: requiredFeature, plan: config.contractedPlan });
        throw new PermissionError(errMsg, 'FEATURE_DISABLED_FOR_PLAN');
      }
    }

    // 4. Validate Minimum Plan
    if (requiredMinPlan) {
      const plansHierarchy: Record<SaaSPlan, number> = {
        Starter: 1,
        Professional: 2,
        Business: 3,
        Enterprise: 4,
      };

      const tenantPlanLevel = plansHierarchy[config.contractedPlan] || 0;
      const requiredPlanLevel = plansHierarchy[requiredMinPlan] || 0;

      if (tenantPlanLevel < requiredPlanLevel) {
        const errMsg = `Esta operación requiere un plan mínimo "${requiredMinPlan}". El plan actual es "${config.contractedPlan}".`;
        LoggingService.warn(errMsg, { tenantId, currentPlan: config.contractedPlan, requiredMinPlan });
        throw new PermissionError(errMsg, 'INSUFFICIENT_PLAN_LEVEL');
      }
    }
  }

  /**
   * Enforces role-based permissions (RBAC) within the tenant context.
   */
  public static validateUserRole(
    tenantId: string,
    userRole: UserRole | null,
    requiredMinRole: UserRole
  ): void {
    if (!userRole) {
      throw new PermissionError(`Acceso denegado: El usuario no posee un rol asignado para el tenant "${tenantId}".`, 'ROLE_UNDEFINED');
    }

    const roleHierarchy: Record<UserRole, number> = {
      SUPER_ADMIN: 10,
      OWNER: 5,
      ADMIN: 4,
      STAFF: 2,
      RECEPTIONIST: 2,
      owner: 5,
      admin: 4,
      manager: 3,
      staff: 2,
      viewer: 1,
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredMinRole] || 0;

    if (userLevel < requiredLevel) {
      const errMsg = `Permisos insuficientes: Se requiere rol "${requiredMinRole}", pero el rol asignado es "${userRole}".`;
      LoggingService.warn(errMsg, { tenantId, userRole, requiredMinRole });
      throw new PermissionError(errMsg, 'INSUFFICIENT_PERMISSIONS');
    }
  }
}
export default TenantMiddleware;
