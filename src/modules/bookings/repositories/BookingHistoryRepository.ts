import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { BookingHistory } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { getResortSubcollection } from '../../../core/firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { Logger } from '../../../core/logger/Logger';

export class BookingHistoryRepository extends BaseRepository<BookingHistory> {
  constructor() {
    super('booking_history');
  }

  override async getAll(resortId: string): Promise<BookingHistory[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      const data = LocalSaaSDb.get<any[]>(`booking_history_${resortId}`) || [];
      return data.map(item => this.deserialize(item));
    }
  }

  override async save(resortId: string, entity: BookingHistory): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const now = new Date().toISOString();
      const payload = {
        ...this.serialize(entity),
        updatedAt: now,
      } as unknown as BookingHistory;
      
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        if (!(payload as any).createdAt) {
          (payload as any).createdAt = now;
        }
        list.push(payload);
      }
      LocalSaaSDb.set(`booking_history_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`booking_history_${resortId}`, filtered);
    }
  }

  subscribe(resortId: string, callback: (history: BookingHistory[]) => void): () => void {
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(resortId, this.collectionName);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
          const list: BookingHistory[] = [];
          snapshot.forEach((doc) => {
            try {
              list.push(this.deserialize({ id: doc.id, ...doc.data() }));
            } catch (err) {
              Logger.error(`Error deserializing onSnapshot history item ${doc.id}:`, err);
            }
          });
          callback(list);
        }, (error) => {
          Logger.error(`Subscription error for booking_history in resort ${resortId}, falling back to LocalSaaSDb:`, error);
          this.getAll(resortId).then(callback).catch((err) => {
            Logger.error('Local subscription fallback for booking_history failed:', err);
          });
        });
        return unsubscribe;
      } catch (error) {
        Logger.error(`Failed to initialize subscription for booking_history in resort ${resortId}, falling back to LocalSaaSDb:`, error);
        this.getAll(resortId).then(callback).catch((err) => {
          Logger.error('Local subscription fallback for booking_history failed:', err);
        });
        return () => {};
      }
    } else {
      this.getAll(resortId).then(callback).catch((err) => {
        Logger.error('Local subscription fallback for booking_history failed:', err);
      });
      return () => {};
    }
  }
}

export const bookingHistoryRepository = new BookingHistoryRepository();
export default bookingHistoryRepository;
