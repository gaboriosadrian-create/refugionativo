import { UserRole } from '../../types';
import { RBACService } from './rbacService';
import { TenantManager } from '../tenant/TenantManager';

export interface RolePermissions {
  screens: string[];
  actions: string[];
  modules: string[];
  featureFlags: string[];
}

export class PermissionService {
  private static rolePermissions: Record<string, RolePermissions> = {
    super_admin: {
      screens: ['*'],
      actions: ['*'],
      modules: ['*'],
      featureFlags: ['*'],
    },
    super_admin_upper: {
      screens: ['*'],
      actions: ['*'],
      modules: ['*'],
      featureFlags: ['*'],
    },
    owner: {
      screens: ['dashboard', 'cabins', 'bookings', 'calendar', 'pricing', 'promotions', 'settings', 'guests', 'media', 'cms', 'audit'],
      actions: ['view', 'create', 'edit', 'delete', 'manage'],
      modules: ['backoffice', 'public-portal'],
      featureFlags: ['enableGallery', 'enableReviews', 'enablePromotions', 'enableAuditLogs'],
    },
    admin: {
      screens: ['dashboard', 'cabins', 'bookings', 'calendar', 'pricing', 'promotions', 'settings', 'guests', 'media', 'cms'],
      actions: ['view', 'create', 'edit', 'manage'],
      modules: ['backoffice', 'public-portal'],
      featureFlags: ['enableGallery', 'enableReviews', 'enablePromotions'],
    },
    manager: {
      screens: ['dashboard', 'cabins', 'bookings', 'calendar', 'pricing', 'guests', 'media'],
      actions: ['view', 'create', 'edit'],
      modules: ['backoffice'],
      featureFlags: ['enableGallery'],
    },
    staff: {
      screens: ['dashboard', 'bookings', 'calendar', 'guests'],
      actions: ['view', 'edit'],
      modules: ['backoffice'],
      featureFlags: [],
    },
    receptionist: {
      screens: ['dashboard', 'bookings', 'calendar', 'guests'],
      actions: ['view', 'edit'],
      modules: ['backoffice'],
      featureFlags: [],
    },
    viewer: {
      screens: ['dashboard', 'calendar'],
      actions: ['view'],
      modules: ['backoffice'],
      featureFlags: [],
    }
  };

  /**
   * Helper to normalize a role string to match the permission configuration keys.
   */
  private static normalizeRole(role: string | null | undefined): string {
    if (!role) return 'viewer';
    const clean = role.toLowerCase().trim();
    if (clean === 'super_admin' || clean === 'superadmin') {
      return 'super_admin';
    }
    if (clean === 'owner') return 'owner';
    if (clean === 'admin') return 'admin';
    if (clean === 'manager') return 'manager';
    if (clean === 'staff') return 'staff';
    if (clean === 'receptionist') return 'receptionist';
    return clean;
  }

  /**
   * Retrieves the permission definition for a specific role.
   */
  public static getPermissionsForRole(role: string | null | undefined): RolePermissions {
    const normRole = this.normalizeRole(role);

    try {
      const tenantId = TenantManager.getCurrentTenantId();
      if (tenantId) {
        const tenantRoles = RBACService.getRoles(tenantId);
        const match = tenantRoles.find(r => r.id.toLowerCase() === normRole.toLowerCase());
        if (match) {
          const screens = new Set<string>();
          const actions = new Set<string>();
          const modules = new Set<string>();
          const featureFlags = new Set<string>();

          match.permissions.forEach(pId => {
            const parts = pId.split('.');
            if (parts.length >= 2) {
              const mod = parts[0];
              const act = parts[1];
              
              modules.add('backoffice');
              if (mod === 'website' || mod === 'cms') {
                modules.add('public-portal');
              }
              
              if (mod === 'bookings') screens.add('bookings').add('calendar').add('dashboard');
              if (mod === 'payments') screens.add('payments').add('dashboard');
              if (mod === 'guests') screens.add('guests');
              if (mod === 'accommodations') screens.add('cabins');
              if (mod === 'pricing') screens.add('pricing');
              if (mod === 'promotions') screens.add('promotions');
              if (mod === 'cms') screens.add('cms');
              if (mod === 'audit') screens.add('audit');
              if (mod === 'settings' || mod === 'rbac') screens.add('settings');

              actions.add(act);
              if (act === 'edit') {
                actions.add('create').add('cancel');
              }
            }
          });

          // Fallbacks for feature flags based on role level
          if (['owner', 'admin', 'manager', 'super_admin'].includes(normRole)) {
            featureFlags.add('enableGallery').add('enableReviews').add('enablePromotions');
          }
          if (['owner', 'super_admin'].includes(normRole)) {
            featureFlags.add('enableAuditLogs');
          }

          return {
            screens: Array.from(screens),
            actions: Array.from(actions),
            modules: Array.from(modules),
            featureFlags: Array.from(featureFlags)
          };
        }
      }
    } catch (e) {
      console.warn('[PermissionService] Failed to dynamically resolve role permissions:', e);
    }

    return this.rolePermissions[normRole] || this.rolePermissions['viewer'];
  }

  /**
   * Checks if a role has access to a specific screen/view.
   */
  public static hasScreen(role: string | null | undefined, screen: string): boolean {
    const permissions = this.getPermissionsForRole(role);
    if (permissions.screens.includes('*')) return true;
    return permissions.screens.includes(screen);
  }

  /**
   * Checks if a role has permission to perform a specific action.
   */
  public static hasAction(role: string | null | undefined, action: string): boolean {
    const permissions = this.getPermissionsForRole(role);
    if (permissions.actions.includes('*')) return true;
    return permissions.actions.includes(action);
  }

  /**
   * Checks if a role has access to a specific module.
   */
  public static hasModule(role: string | null | undefined, moduleName: string): boolean {
    const permissions = this.getPermissionsForRole(role);
    if (permissions.modules.includes('*')) return true;
    return permissions.modules.includes(moduleName);
  }

  /**
   * Checks if a specific feature flag is allowed for the role.
   */
  public static isFeatureAllowed(role: string | null | undefined, featureFlag: string): boolean {
    const permissions = this.getPermissionsForRole(role);
    if (permissions.featureFlags.includes('*')) return true;
    return permissions.featureFlags.includes(featureFlag);
  }

  /**
   * Check if a role is SUPER_ADMIN.
   */
  public static isSuperAdmin(role: string | null | undefined, email?: string): boolean {
    if (email === 'gaboriosadrian@gmail.com') return true;
    const normRole = this.normalizeRole(role);
    return normRole === 'super_admin';
  }

  /**
   * Direct granular permission check for any user and tenant
   */
  public static hasPermission(
    userId: string | null | undefined,
    tenantId: string | null | undefined,
    permissionId: string,
    fallbackRole?: string | null
  ): boolean {
    return RBACService.hasPermission(userId, tenantId, permissionId, fallbackRole);
  }
}

export default PermissionService;
