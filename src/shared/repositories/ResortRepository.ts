import { isFirebaseConfigured } from '../../core/firebase/firebase';
import { getDocument, saveDocument, queryCollection } from '../../core/firebase/firestore';
import { where } from 'firebase/firestore';
import { LocalSaaSDb } from '../services/LocalSaaSDb';
import { Resort, ResortUser } from '../../types';

export class ResortRepository {
  async getResort(resortId: string): Promise<Resort | null> {
    if (isFirebaseConfigured) {
      try {
        const doc = await getDocument(`resorts/${resortId}`);
        return doc as Resort | null;
      } catch (error) {
        console.warn(`[STAYFLOW] Error in getResort for resorts/${resortId}, falling back to LocalSaaSDb:`, error);
        const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
        return resorts.find(r => r.id === resortId) || null;
      }
    } else {
      const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
      return resorts.find(r => r.id === resortId) || null;
    }
  }

  async getResortBySlug(slug: string): Promise<Resort | null> {
    if (isFirebaseConfigured) {
      try {
        const results = await queryCollection('resorts', where('slug', '==', slug), where('active', '==', true));
        return results.length > 0 ? (results[0] as Resort) : null;
      } catch (error) {
        console.warn(`[STAYFLOW] Error in getResortBySlug for ${slug}, falling back to LocalSaaSDb:`, error);
        const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
        return resorts.find(r => r.slug === slug && r.active) || null;
      }
    } else {
      const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
      return resorts.find(r => r.slug === slug && r.active) || null;
    }
  }

  async getResortUser(userId: string, resortId: string): Promise<ResortUser | null> {
    if (isFirebaseConfigured) {
      try {
        const results = await queryCollection(
          'resortUsers', 
          where('userId', '==', userId), 
          where('resortId', '==', resortId),
          where('active', '==', true)
        );
        return results.length > 0 ? (results[0] as ResortUser) : null;
      } catch (error) {
        console.warn(`[STAYFLOW] Error in getResortUser for ${userId}/${resortId}, falling back to LocalSaaSDb:`, error);
        const resortUsers = LocalSaaSDb.get<ResortUser[]>('resortUsers') || [];
        return resortUsers.find(ru => ru.userId === userId && ru.resortId === resortId && ru.active) || null;
      }
    } else {
      const resortUsers = LocalSaaSDb.get<ResortUser[]>('resortUsers') || [];
      return resortUsers.find(ru => ru.userId === userId && ru.resortId === resortId && ru.active) || null;
    }
  }

  async getResortUsersForUser(userId: string): Promise<ResortUser[]> {
    if (isFirebaseConfigured) {
      try {
        const results = await queryCollection('resortUsers', where('userId', '==', userId), where('active', '==', true));
        return results as ResortUser[];
      } catch (error) {
        console.warn(`[STAYFLOW] Error in getResortUsersForUser for ${userId}, falling back to LocalSaaSDb:`, error);
        const resortUsers = LocalSaaSDb.get<ResortUser[]>('resortUsers') || [];
        return resortUsers.filter(ru => ru.userId === userId && ru.active);
      }
    } else {
      const resortUsers = LocalSaaSDb.get<ResortUser[]>('resortUsers') || [];
      return resortUsers.filter(ru => ru.userId === userId && ru.active);
    }
  }

  async saveResort(resort: Resort): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        await saveDocument(`resorts/${resort.id}`, resort);
      } catch (error) {
        console.warn(`[STAYFLOW] Error in saveResort for ${resort.id}, falling back to LocalSaaSDb:`, error);
        const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
        const idx = resorts.findIndex(r => r.id === resort.id);
        if (idx !== -1) {
          resorts[idx] = { ...resorts[idx], ...resort };
        } else {
          resorts.push(resort);
        }
        LocalSaaSDb.set('resorts', resorts);
      }
    } else {
      const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
      const idx = resorts.findIndex(r => r.id === resort.id);
      if (idx !== -1) {
        resorts[idx] = { ...resorts[idx], ...resort };
      } else {
        resorts.push(resort);
      }
      LocalSaaSDb.set('resorts', resorts);
    }
  }
}
export const resortRepository = new ResortRepository();
