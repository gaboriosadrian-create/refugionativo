import { UserProfile, UserRole } from '../types';
import { RolePermissions } from '../core/security/PermissionService';

export interface AppUser extends UserProfile {}

export interface AuthenticatedUser {
  user: AppUser;
  role: UserRole | null;
}

export interface AuthContextType {
  user: AppUser | null;
  currentUser: AppUser | null;
  role: UserRole | null;
  roles: string[];
  permissions: RolePermissions | null;
  tenant: string | null;
  plan: string | null;
  featureFlags: string[];
  tenantStatus: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setRoleForResort: (resortId: string) => Promise<void>;
  hasPermission: (permissionId: string) => boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}
