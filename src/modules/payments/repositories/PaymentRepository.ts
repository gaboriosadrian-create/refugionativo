import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { Payment } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { getResortSubcollection } from '../../../core/firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { Logger } from '../../../core/logger/Logger';

export class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super('payments');
  }

  override async getAll(resortId: string): Promise<Payment[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      const data = LocalSaaSDb.get<any[]>(`payments_${resortId}`) || [];
      return data.map(item => this.deserialize(item));
    }
  }

  override async save(resortId: string, entity: Payment): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const now = new Date().toISOString();
      const payload = {
        ...this.serialize(entity),
        updatedAt: now,
      } as Payment;
      
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        if (!payload.createdAt) {
          payload.createdAt = now;
        }
        list.push(payload);
      }
      LocalSaaSDb.set(`payments_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`payments_${resortId}`, filtered);
    }
  }

  subscribe(resortId: string, callback: (payments: Payment[]) => void): () => void {
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(resortId, this.collectionName);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
          const list: Payment[] = [];
          snapshot.forEach((doc) => {
            const idVal = doc.id;
            try {
              list.push(this.deserialize({ id: idVal, ...doc.data() }));
            } catch (err) {
              Logger.error(`Error deserializing onSnapshot payment item ${doc.id}:`, err);
            }
          });
          callback(list);
        }, (error) => {
          Logger.error(`Subscription error for payments in resort ${resortId}, falling back to LocalSaaSDb:`, error);
          this.getAll(resortId).then(callback).catch((err) => {
            Logger.error('Local subscription fallback for payments failed:', err);
          });
        });
        return unsubscribe;
      } catch (error) {
        Logger.error(`Failed to initialize subscription for payments in resort ${resortId}, falling back to LocalSaaSDb:`, error);
        this.getAll(resortId).then(callback).catch((err) => {
          Logger.error('Local subscription fallback for payments failed:', err);
        });
        return () => {};
      }
    } else {
      this.getAll(resortId).then(callback).catch((err) => {
        Logger.error('Local subscription fallback for payments failed:', err);
      });
      return () => {};
    }
  }

  protected serialize(entity: Payment): any {
    return { ...entity };
  }

  protected deserialize(data: any): Payment {
    return { ...data } as Payment;
  }
}

export const paymentRepository = new PaymentRepository();
export default paymentRepository;
