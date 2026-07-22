import { isFirebaseConfigured } from '../../core/firebase/firebase';
import { getDocument, saveDocument } from '../../core/firebase/firestore';
import { LocalSaaSDb } from '../services/LocalSaaSDb';
import { UserProfile } from '../../types';

export class UserRepository {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured) {
      try {
        const doc = await getDocument(`users/${uid}`);
        return doc as unknown as UserProfile | null;
      } catch (error) {
        console.warn(`[STAYFLOW] Error in getUserProfile for users/${uid}, falling back to LocalSaaSDb:`, error);
        const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
        return users.find(u => u.uid === uid) || null;
      }
    } else {
      const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
      return users.find(u => u.uid === uid) || null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        await saveDocument(`users/${profile.uid}`, profile);
      } catch (error) {
        console.warn(`[STAYFLOW] Error in saveUserProfile for ${profile.uid}, falling back to LocalSaaSDb:`, error);
        const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
        const idx = users.findIndex(u => u.uid === profile.uid);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...profile, lastLogin: new Date().toISOString() };
        } else {
          users.push({ ...profile, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() });
        }
        LocalSaaSDb.set('users', users);
      }
    } else {
      const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
      const idx = users.findIndex(u => u.uid === profile.uid);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...profile, lastLogin: new Date().toISOString() };
      } else {
        users.push({ ...profile, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() });
      }
      LocalSaaSDb.set('users', users);
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    if (isFirebaseConfigured) {
      return [];
    } else {
      return LocalSaaSDb.get<UserProfile[]>('users') || [];
    }
  }
}
export const userRepository = new UserRepository();
