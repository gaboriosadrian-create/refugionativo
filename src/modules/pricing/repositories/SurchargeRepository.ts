import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { Surcharge } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { getResortSubcollection } from '../../../core/firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { Logger } from '../../../core/logger/Logger';

export class SurchargeRepository extends BaseRepository<Surcharge> {
  constructor() {
    super('pricing_surcharges');
  }

  private getLocalKey(resortId: string): string {
    return `pricing_surcharges_${resortId}`;
  }

  override async getAll(resortId: string): Promise<Surcharge[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      const data = LocalSaaSDb.get<any[]>(this.getLocalKey(resortId)) || [];
      return data.map(item => this.deserialize(item));
    }
  }

  override async save(resortId: string, entity: Surcharge): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const now = new Date().toISOString();
      const payload = {
        ...this.serialize(entity),
        updatedAt: now,
      } as Surcharge;

      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        if (!payload.createdAt) {
          payload.createdAt = now;
        }
        list.push(payload);
      }
      LocalSaaSDb.set(this.getLocalKey(resortId), list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(this.getLocalKey(resortId), filtered);
    }
  }

  public subscribe(resortId: string, callback: (surcharges: Surcharge[]) => void): () => void {
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(resortId, this.collectionName);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
          const list: Surcharge[] = [];
          snapshot.forEach((doc) => {
            list.push(this.deserialize({ id: doc.id, ...doc.data() }));
          });
          callback(list);
        }, (error) => {
          Logger.error(`Subscription error for surcharges in resort ${resortId}, falling back to LocalSaaSDb:`, error);
          this.getAll(resortId).then(callback).catch((err) => {
            Logger.error('Local subscription fallback for surcharges failed:', err);
          });
        });
        return unsubscribe;
      } catch (error) {
        Logger.error(`Failed to initialize subscription for surcharges in resort ${resortId}, falling back to LocalSaaSDb:`, error);
        this.getAll(resortId).then(callback).catch((err) => {
          Logger.error('Local subscription fallback for surcharges failed:', err);
        });
        return () => {};
      }
    } else {
      this.getAll(resortId).then(callback).catch((err) => {
        Logger.error('Local subscription fallback for surcharges failed:', err);
      });
      return () => {};
    }
  }
}

export const surchargeRepository = new SurchargeRepository();
export default surchargeRepository;
