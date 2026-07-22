import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';
import { isFirebaseConfigured } from '../firebase/firebase';
import { saveDocument, queryCollection } from '../firebase/firestore';
import { AuditService } from '../audit/AuditService';
import { 
  CustomRole, 
  RoleAssignment, 
  DEFAULT_SYSTEM_ROLES, 
  SYSTEM_PERMISSIONS 
} from './rbacTypes';

export class RBACService {
  private static ROLES_KEY_PREFIX = 'rbac_roles_';
  private static ASSIGNMENTS_KEY_PREFIX = 'rbac_assignments_';

  /**
   * Initializes or returns all roles for a tenant, including pre-defined protected system roles.
   */
  public static getRoles(tenantId: string): CustomRole[] {
    if (!tenantId) return [];
    const key = `${this.ROLES_KEY_PREFIX}${tenantId}`;
    let roles = LocalSaaSDb.get<CustomRole[]>(key);
    
    if (!roles || roles.length === 0) {
      // Seed tenant roles with default system roles
      roles = DEFAULT_SYSTEM_ROLES.map(role => ({
        ...role,
        id: role.id, // Keep standard system role IDs
        tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      LocalSaaSDb.set(key, roles);
    }
    return roles.filter(r => r.active !== false);
  }

  /**
   * Save roles list for a tenant
   */
  private static saveRoles(tenantId: string, roles: CustomRole[]): void {
    const key = `${this.ROLES_KEY_PREFIX}${tenantId}`;
    LocalSaaSDb.set(key, roles);

    // If Firebase is configured, mirror changes
    if (isFirebaseConfigured) {
      saveDocument(`resorts/${tenantId}/rbac/roles`, { roles }).catch(err => {
        console.warn('[RBACService] Failed to sync roles to Firestore:', err);
      });
    }
  }

  /**
   * Create a new custom role inside a tenant
   */
  public static async createRole(
    tenantId: string,
    roleData: { name: string; description: string; permissions: string[] },
    userId: string,
    userEmail?: string
  ): Promise<CustomRole> {
    const roles = this.getRoles(tenantId);
    
    // Generate simple slug-based ID or random ID
    const sanitizedName = roleData.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const roleId = `custom_${sanitizedName}_${Date.now().toString().slice(-4)}`;

    const newRole: CustomRole = {
      id: roleId,
      name: roleData.name,
      description: roleData.description,
      tenantId,
      isSystem: false,
      permissions: roleData.permissions,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    roles.push(newRole);
    this.saveRoles(tenantId, roles);

    // Audit creation
    await AuditService.record(
      tenantId,
      userId,
      'CREATE_ROLE',
      'role',
      roleId,
      null,
      newRole,
      userEmail
    );

    return newRole;
  }

  /**
   * Update an existing role's permissions or metadata (cannot modify system roles' core settings)
   */
  public static async updateRole(
    tenantId: string,
    roleId: string,
    updates: { name?: string; description?: string; permissions?: string[] },
    userId: string,
    userEmail?: string
  ): Promise<CustomRole> {
    const roles = this.getRoles(tenantId);
    const roleIdx = roles.findIndex(r => r.id === roleId);

    if (roleIdx === -1) {
      throw new Error(`Role with ID ${roleId} not found in tenant ${tenantId}`);
    }

    const previousRole = { ...roles[roleIdx] };

    // Prevent modifying system roles' permissions directly if required, or let custom tenants modify non-system custom roles.
    // Let's protect system roles: we cannot edit system role definitions directly.
    if (roles[roleIdx].isSystem) {
      throw new Error('System roles are protected and cannot be modified. Try duplicating the role instead.');
    }

    roles[roleIdx] = {
      ...roles[roleIdx],
      name: updates.name ?? roles[roleIdx].name,
      description: updates.description ?? roles[roleIdx].description,
      permissions: updates.permissions ?? roles[roleIdx].permissions,
      updatedAt: new Date().toISOString()
    };

    this.saveRoles(tenantId, roles);

    // Audit modification
    await AuditService.record(
      tenantId,
      userId,
      'UPDATE_ROLE',
      'role',
      roleId,
      previousRole,
      roles[roleIdx],
      userEmail
    );

    return roles[roleIdx];
  }

  /**
   * Logically delete a role (system roles cannot be deleted)
   */
  public static async deleteRole(
    tenantId: string,
    roleId: string,
    userId: string,
    userEmail?: string
  ): Promise<void> {
    const roles = this.getRoles(tenantId);
    const roleIdx = roles.findIndex(r => r.id === roleId);

    if (roleIdx === -1) {
      throw new Error(`Role with ID ${roleId} not found in tenant ${tenantId}`);
    }

    if (roles[roleIdx].isSystem) {
      throw new Error('System roles are protected and cannot be deleted.');
    }

    const previousRole = { ...roles[roleIdx] };
    
    // Perform logical delete
    roles[roleIdx].active = false;
    roles[roleIdx].updatedAt = new Date().toISOString();

    this.saveRoles(tenantId, roles);

    // Remove this role from any assignment
    const assignments = this.getAssignments(tenantId);
    let assignmentChanged = false;
    const updatedAssignments = assignments.map(as => {
      if (as.roleIds.includes(roleId)) {
        assignmentChanged = true;
        return {
          ...as,
          roleIds: as.roleIds.filter(id => id !== roleId)
        };
      }
      return as;
    });

    if (assignmentChanged) {
      this.saveAssignments(tenantId, updatedAssignments);
    }

    // Audit deletion
    await AuditService.record(
      tenantId,
      userId,
      'DELETE_ROLE',
      'role',
      roleId,
      previousRole,
      { active: false },
      userEmail
    );
  }

  /**
   * Duplicates an existing role (herencia/copy)
   */
  public static async duplicateRole(
    tenantId: string,
    roleId: string,
    newName: string,
    userId: string,
    userEmail?: string
  ): Promise<CustomRole> {
    const roles = this.getRoles(tenantId);
    const sourceRole = roles.find(r => r.id === roleId);

    if (!sourceRole) {
      throw new Error(`Source role with ID ${roleId} not found in tenant ${tenantId}`);
    }

    const sanitizedName = newName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const newRoleId = `custom_${sanitizedName}_${Date.now().toString().slice(-4)}`;

    const duplicatedRole: CustomRole = {
      id: newRoleId,
      name: newName,
      description: `Copia de ${sourceRole.name}. ${sourceRole.description}`,
      tenantId,
      isSystem: false,
      permissions: [...sourceRole.permissions],
      active: true,
      copiedFrom: roleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    roles.push(duplicatedRole);
    this.saveRoles(tenantId, roles);

    // Audit duplication
    await AuditService.record(
      tenantId,
      userId,
      'DUPLICATE_ROLE',
      'role',
      newRoleId,
      { sourceRoleId: roleId },
      duplicatedRole,
      userEmail
    );

    return duplicatedRole;
  }

  /**
   * Get all user role assignments for a tenant
   */
  public static getAssignments(tenantId: string): RoleAssignment[] {
    if (!tenantId) return [];
    const key = `${this.ASSIGNMENTS_KEY_PREFIX}${tenantId}`;
    const assignments = LocalSaaSDb.get<RoleAssignment[]>(key);
    return assignments ?? [];
  }

  /**
   * Save role assignments for a tenant
   */
  private static saveAssignments(tenantId: string, assignments: RoleAssignment[]): void {
    const key = `${this.ASSIGNMENTS_KEY_PREFIX}${tenantId}`;
    LocalSaaSDb.set(key, assignments);

    if (isFirebaseConfigured) {
      saveDocument(`resorts/${tenantId}/rbac/assignments`, { assignments }).catch(err => {
        console.warn('[RBACService] Failed to sync assignments to Firestore:', err);
      });
    }
  }

  /**
   * Get assignment for a specific user in a tenant
   */
  public static getUserAssignments(tenantId: string, userId: string): RoleAssignment | null {
    const list = this.getAssignments(tenantId);
    return list.find(as => as.userId === userId && as.active !== false) || null;
  }

  /**
   * Assign multiple roles to a user in a tenant (creates or updates assignment)
   */
  public static async assignRolesToUser(
    tenantId: string,
    userId: string,
    roleIds: string[],
    userIdActor: string,
    userEmailActor?: string
  ): Promise<RoleAssignment> {
    const assignments = this.getAssignments(tenantId);
    const existingIdx = assignments.findIndex(as => as.userId === userId);
    
    let previousState = null;
    let assignment: RoleAssignment;

    if (existingIdx !== -1) {
      previousState = { ...assignments[existingIdx] };
      assignments[existingIdx] = {
        ...assignments[existingIdx],
        roleIds: [...new Set(roleIds)], // Deduplicate
        active: true,
        assignedBy: userIdActor,
        assignedAt: new Date().toISOString()
      };
      assignment = assignments[existingIdx];
    } else {
      assignment = {
        id: `as_${userId}_${Date.now().toString().slice(-4)}`,
        userId,
        resortId: tenantId,
        roleIds: [...new Set(roleIds)],
        active: true,
        assignedBy: userIdActor,
        assignedAt: new Date().toISOString()
      };
      assignments.push(assignment);
    }

    this.saveAssignments(tenantId, assignments);

    // Audit assignment/modification
    await AuditService.record(
      tenantId,
      userIdActor,
      'ASSIGN_ROLES',
      'roleAssignment',
      userId,
      previousState,
      assignment,
      userEmailActor
    );

    return assignment;
  }

  /**
   * Revoke roles from a user (empty assignment)
   */
  public static async revokeRolesFromUser(
    tenantId: string,
    userId: string,
    userIdActor: string,
    userEmailActor?: string
  ): Promise<void> {
    const assignments = this.getAssignments(tenantId);
    const existingIdx = assignments.findIndex(as => as.userId === userId);

    if (existingIdx !== -1) {
      const previousState = { ...assignments[existingIdx] };
      assignments[existingIdx].roleIds = [];
      assignments[existingIdx].active = false;
      assignments[existingIdx].assignedAt = new Date().toISOString();
      assignments[existingIdx].assignedBy = userIdActor;

      this.saveAssignments(tenantId, assignments);

      // Audit revocation
      await AuditService.record(
        tenantId,
        userIdActor,
        'REVOKE_ROLES',
        'roleAssignment',
        userId,
        previousState,
        assignments[existingIdx],
        userEmailActor
      );
    }
  }

  /**
   * Central Permission Resolver:
   * Returns true if user profile has access to specific permission.
   * If they are SUPER_ADMIN (either by email or explicit role), they have all permissions.
   * If there are no assignments, fall back to standard ResortUser role if known.
   */
  public static hasPermission(
    userId: string | null | undefined,
    tenantId: string | null | undefined,
    permissionId: string,
    fallbackRole?: string | null
  ): boolean {
    if (!userId) return false;

    // 1. Super admin has everything
    // Adrian is hardcoded as global platform super admin
    if (userId === 'demo-owner-uid' && fallbackRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check if the permission requires custom bypass or is globally enabled
    if (!tenantId) return false;

    // 2. Fetch assigned roles for the user in this tenant
    const userAssignment = this.getUserAssignments(tenantId, userId);
    let activeRoleIds: string[] = [];

    if (userAssignment && userAssignment.roleIds.length > 0) {
      activeRoleIds = userAssignment.roleIds;
    } else if (fallbackRole) {
      // Fallback to the default single role assigned in ResortUser (normalized)
      const normRole = fallbackRole.toLowerCase().trim();
      activeRoleIds = [normRole];
    } else {
      // Viewer default fallback
      activeRoleIds = ['viewer'];
    }

    // 3. Resolve permissions from active roles
    const tenantRoles = this.getRoles(tenantId);
    const combinedPermissions = new Set<string>();

    for (const roleId of activeRoleIds) {
      // Standard static/system role or custom role
      const roleObj = tenantRoles.find(r => r.id.toLowerCase() === roleId.toLowerCase());
      if (roleObj) {
        roleObj.permissions.forEach(p => combinedPermissions.add(p));
      } else {
        // Fallback for system defaults if not found in db
        const defaultRole = DEFAULT_SYSTEM_ROLES.find(r => r.id.toLowerCase() === roleId.toLowerCase());
        if (defaultRole) {
          defaultRole.permissions.forEach(p => combinedPermissions.add(p));
        }
      }
    }

    // 4. Return whether permissionId is in set
    return combinedPermissions.has(permissionId);
  }

  /**
   * Helper to check if a user has access to a specific screen
   */
  public static hasScreenAccess(
    userId: string | null | undefined,
    tenantId: string | null | undefined,
    screen: string,
    fallbackRole?: string | null
  ): boolean {
    if (!userId || !tenantId) return false;
    
    // Find all permissions for this screen.
    // If user has any permission associated with this screen, they can access it.
    const screenPerms = SYSTEM_PERMISSIONS.filter(p => p.screen === screen).map(p => p.id);
    if (screenPerms.length === 0) return true; // Screen is open if no explicit permission controls it

    return screenPerms.some(permId => this.hasPermission(userId, tenantId, permId, fallbackRole));
  }
}
