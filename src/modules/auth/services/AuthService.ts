import { isFirebaseConfigured, auth } from '../../../core/firebase/firebase';
import { loginWithGoogle, logout, subscribeToAuthChanges } from '../../../core/firebase/auth';
import { UserService } from './UserService';
import { ResortService } from '../../../shared/services/ResortService';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { UserProfile, Resort } from '../../../types';
import { AppUser } from '../../../types/auth';

export class AuthService {
  static async loginWithGoogle(): Promise<{ user: AppUser; resorts: { resort: Resort; role: string }[] }> {
    if (isFirebaseConfigured) {
      const fbUser = await loginWithGoogle();
      const profile: UserProfile = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'Usuario de Google',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || undefined,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        active: true
      };
      await UserService.saveUserProfile(profile);
      const resorts = await ResortService.getResortsForUser(fbUser.uid);
      return { user: profile as AppUser, resorts };
    } else {
      // Simulate Google login by returning the first mock owner user
      const users = await UserService.getAllUsers();
      const owner = users[0];
      const resorts = await ResortService.getResortsForUser(owner?.uid || 'mock-owner');
      return { user: owner as AppUser, resorts };
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
                displayName: fbUser.displayName || 'Usuario de Google',
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
