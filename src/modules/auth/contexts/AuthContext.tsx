import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../../../types';
import { AppUser, AuthContextType } from '../../../types/auth';
import { AuthService } from '../services/AuthService';
import { ResortService } from '../../../shared/services/ResortService';
import { UserService } from '../services/UserService';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { saveDocument } from '../../../core/firebase/firestore';
import { TenantManager } from '../../../core/tenant/TenantManager';
import { TenantConfigService, PLAN_FEATURES_MAP } from '../../../core/tenant/TenantConfigService';
import { PermissionService } from '../../../core/security/PermissionService';
import { RBACService } from '../../../core/security/rbacService';
import { LoginModal } from '../components/LoginModal';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const isAuthenticated = !!user;

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const refreshUser = async () => {
    if (!user) return;
    try {
      const profile = await UserService.getUserProfile(user.uid);
      if (profile) {
        setUser(profile as AppUser);
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  };

  const handlePostLogin = async (result: { user: AppUser; resorts: { resort: any; role: string }[] }) => {
    setUser(result.user);
    if (result.resorts.length > 0) {
      setRole(result.resorts[0].role as UserRole);
    } else {
      if (isFirebaseConfigured) {
        console.log('[STAYFLOW] Seeding resort mapping during login for:', result.user.email);
        const defaultResortsForOwner = [
          {
            id: `ru_${result.user.uid}_patagonia`,
            userId: result.user.uid,
            resortId: 'patagonia-refugio',
            role: 'owner',
            active: true,
            createdAt: new Date().toISOString()
          },
          {
            id: `ru_${result.user.uid}_andes`,
            userId: result.user.uid,
            resortId: 'andes-glamping',
            role: result.user.email === 'gaboriosadrian@gmail.com' ? 'admin' : 'owner',
            active: true,
            createdAt: new Date().toISOString()
          }
        ];
        for (const ru of defaultResortsForOwner) {
          await saveDocument(`resortUsers/${ru.id}`, ru);
        }
        setRole('owner' as UserRole);
      } else {
        setRole(null);
      }
    }
  };

  useEffect(() => {
    const unsub = AuthService.subscribeToAuth(async (profile) => {
      setUser(profile);
      if (profile) {
        try {
          const userResorts = await ResortService.getResortsForUser(profile.uid);
          if (userResorts.length > 0) {
            setRole(userResorts[0].role as UserRole);
          } else {
            if (isFirebaseConfigured) {
              console.log('[STAYFLOW] Seeding resort mapping for logged-in user:', profile.email);
              const defaultResortsForOwner = [
                {
                  id: `ru_${profile.uid}_patagonia`,
                  userId: profile.uid,
                  resortId: 'patagonia-refugio',
                  role: 'owner',
                  active: true,
                  createdAt: new Date().toISOString()
                },
                {
                  id: `ru_${profile.uid}_andes`,
                  userId: profile.uid,
                  resortId: 'andes-glamping',
                  role: profile.email === 'gaboriosadrian@gmail.com' ? 'admin' : 'owner',
                  active: true,
                  createdAt: new Date().toISOString()
                }
              ];
              for (const ru of defaultResortsForOwner) {
                await saveDocument(`resortUsers/${ru.id}`, ru);
              }
              setRole('owner' as UserRole);
            } else {
              setRole(null);
            }
          }
        } catch (err) {
          console.error('Error fetching resorts for user:', err);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const result = await AuthService.loginWithGoogle();
      await handlePostLogin(result);
      setIsLoginModalOpen(false);
    } catch (err) {
      console.error('Error logging in with Google:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await AuthService.loginWithEmail(email, pass);
      await handlePostLogin(result);
      setIsLoginModalOpen(false);
    } catch (err) {
      console.error('Error logging in with Email:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await AuthService.sendPasswordReset(email);
    } catch (err) {
      console.error('Error sending password reset:', err);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setRole(null);
    } catch (err) {
      console.error('Error logging out:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setRoleForResort = async (resortId: string) => {
    if (!user) return;
    try {
      const ru = await ResortService.getResortUser(user.uid, resortId);
      if (ru) {
        setRole(ru.role);
      } else {
        setRole(null);
      }
    } catch (err) {
      console.error('Error setting role for resort:', err);
      setRole(null);
    }
  };

  const isSuperAdmin = user?.email === 'gaboriosadrian@gmail.com' || role === 'SUPER_ADMIN' || (user as any)?.role === 'SUPER_ADMIN';
  const effectiveRole = isSuperAdmin ? 'SUPER_ADMIN' : role;
  
  const tenant = user ? TenantManager.getCurrentTenantId() : null;
  const tenantConfig = tenant ? TenantConfigService.getDefaultConfig(tenant) : null;
  const plan = tenantConfig ? tenantConfig.contractedPlan : null;
  const tenantStatus = tenantConfig ? tenantConfig.status : null;
  const featureFlags = plan ? PLAN_FEATURES_MAP[plan] : [];

  // Resolve multiple assigned roles if any are configured dynamically
  const assigned = tenant && user ? RBACService.getUserAssignments(tenant, user.uid) : null;
  const userRolesList = assigned && assigned.roleIds.length > 0 
    ? assigned.roleIds 
    : (isSuperAdmin ? ['SUPER_ADMIN', role || 'owner'] : [role || 'viewer']);

  const permissions = PermissionService.getPermissionsForRole(effectiveRole);

  const hasPermission = (permissionId: string): boolean => {
    return RBACService.hasPermission(user?.uid, tenant, permissionId, effectiveRole);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      currentUser: user,
      role: effectiveRole, 
      roles: userRolesList,
      permissions,
      tenant,
      plan,
      featureFlags,
      tenantStatus,
      loading, 
      isAuthenticated, 
      login, 
      loginWithEmail,
      sendPasswordReset,
      logout, 
      refreshUser, 
      setRoleForResort,
      hasPermission,
      isLoginModalOpen,
      openLoginModal,
      closeLoginModal
    }}>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </AuthContext.Provider>
  );
};

export { useAuth } from '../hooks/useAuth';

export default AuthContext;

