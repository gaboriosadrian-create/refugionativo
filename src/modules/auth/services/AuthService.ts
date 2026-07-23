import { isFirebaseConfigured, auth } from '../../../core/firebase/firebase';
import { 
  loginWithGoogle, 
  loginWithEmailAndPassword, 
  sendPasswordResetEmail, 
  logout, 
  subscribeToAuthChanges 
} from '../../../core/firebase/auth';
import { UserService } from './UserService';
import { ResortService } from '../../../shared/services/ResortService';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { UserProfile, Resort } from '../../../types';
import { AppUser } from '../../../types/auth';

export class AuthService {
  /**
   * Helper unified post-authentication processor for both Google and Email login.
   * Ensures DRY architecture and identical handling of user profile and resort mappings.
   */
  private static async handleAuthenticatedUser(fbUser: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  }): Promise<{ user: AppUser; resorts: { resort: Resort; role: string }[] }> {
    let profile = await UserService.getUserProfile(fbUser.uid);
    if (!profile) {
      profile = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario StayFlow',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || undefined,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        active: true
      };
      await UserService.saveUserProfile(profile);
    } else {
      // Update last login
      profile = {
        ...profile,
        lastLogin: new Date().toISOString()
      };
      await UserService.saveUserProfile(profile);
    }

    const resorts = await ResortService.getResortsForUser(fbUser.uid);
    return { user: profile as AppUser, resorts };
  }

  static async loginWithGoogle(): Promise<{ user: AppUser; resorts: { resort: Resort; role: string }[] }> {
    if (isFirebaseConfigured) {
      const fbUser = await loginWithGoogle();
      return this.handleAuthenticatedUser(fbUser);
    } else {
      // Development mock mode fallback when Firebase keys are not provided
      const users = await UserService.getAllUsers();
      const owner = users[0] || {
        uid: 'superadmin-dev-uid',
        displayName: 'Gabriel Rios (Super Admin)',
        email: 'superadmin@stayflow.com.ar',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        active: true
      };
      const resorts = await ResortService.getResortsForUser(owner.uid);
      return { user: owner as AppUser, resorts };
    }
  }

  static async loginWithEmail(email: string, pass: string): Promise<{ user: AppUser; resorts: { resort: Resort; role: string }[] }> {
    if (isFirebaseConfigured) {
      const fbUser = await loginWithEmailAndPassword(email, pass);
      return this.handleAuthenticatedUser(fbUser);
    } else {
      // Development mock mode fallback
      const cleanEmail = email.trim().toLowerCase();
      const users = await UserService.getAllUsers();
      let match = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!match) {
        match = {
          uid: cleanEmail === 'superadmin@stayflow.com.ar' ? 'superadmin-dev-uid' : `usr_${Date.now()}`,
          displayName: cleanEmail === 'superadmin@stayflow.com.ar' ? 'Super Admin' : cleanEmail.split('@')[0],
          email: cleanEmail,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          active: true
        };
        await UserService.saveUserProfile(match);
      }

      const resorts = await ResortService.getResortsForUser(match.uid);
      return { user: match as AppUser, resorts };
    }
  }

  static async sendPasswordReset(email: string): Promise<void> {
    if (isFirebaseConfigured) {
      await sendPasswordResetEmail(email);
    } else {
      console.log('[STAYFLOW DEV] Simulación de envío de correo de recuperación a:', email);
    }
  }

  static async logout(): Promise<void> {
    if (isFirebaseConfigured) {
      await logout();
    }
  }

  static getCurrentUser(): AppUser | null {
    if (isFirebaseConfigured) {
      const fbUser = auth.currentUser;
      if (!fbUser) return null;
      return {
        uid: fbUser.uid,
        displayName: fbUser.displayName || '',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || undefined,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        active: true
      };
    } else {
      const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
      return (users[0] as AppUser) || null;
    }
  }

  static async getIdToken(): Promise<string | null> {
    if (isFirebaseConfigured) {
      const fbUser = auth.currentUser;
      if (!fbUser) return null;
      return fbUser.getIdToken();
    } else {
      return 'mock-jwt-token-1234';
    }
  }

  static subscribeToAuth(callback: (user: AppUser | null) => void) {
    if (isFirebaseConfigured) {
      return subscribeToAuthChanges(async (fbUser) => {
        if (fbUser) {
          try {
            let profile = await UserService.getUserProfile(fbUser.uid);
            if (!profile) {
              profile = {
                uid: fbUser.uid,
                displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario StayFlow',
                email: fbUser.email || '',
                photoURL: fbUser.photoURL || undefined,
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                active: true
              };
              await UserService.saveUserProfile(profile);
            }
            callback(profile as AppUser);
          } catch (error) {
            console.error('Error in subscribeToAuth profile retrieval:', error);
            callback(null);
          }
        } else {
          callback(null);
        }
      });
    } else {
      // Return unsubscriber mockup
      const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
      const owner = users[0] || null;
      callback(owner as AppUser);
      return () => {};
    }
  }
}
export default AuthService;

