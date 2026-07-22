import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { Booking } from '../../../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { getResortSubcollection } from '../../../core/firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { Logger } from '../../../core/logger/Logger';

export class BookingRepository extends BaseRepository<Booking> {
  constructor() {
    super('reservations');
  }

  override async getAll(resortId: string): Promise<Booking[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      const data = LocalSaaSDb.get<any[]>(`bookings_${resortId}`) || [];
      return data.map(item => this.deserialize(item));
    }
  }

  override async save(resortId: string, entity: Booking): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const now = new Date().toISOString();
      const payload = {
        ...this.serialize(entity),
        updatedAt: now,
      } as Booking;
      
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        if (!payload.createdAt) {
          payload.createdAt = now;
        }
        list.push(payload);
      }
      LocalSaaSDb.set(`bookings_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`bookings_${resortId}`, filtered);
    }
  }

  subscribe(resortId: string, callback: (bookings: Booking[]) => void): () => void {
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(resortId, this.collectionName);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
          const list: Booking[] = [];
          snapshot.forEach((doc) => {
            const idVal = isNaN(Number(doc.id)) ? doc.id : Number(doc.id);
            try {
              list.push(this.deserialize({ id: idVal, ...doc.data() }));
            } catch (err) {
              Logger.error(`Error deserializing onSnapshot booking item ${doc.id}:`, err);
            }
          });
          callback(list);
        }, (error) => {
          Logger.error(`Subscription error for bookings in resort ${resortId}, falling back to LocalSaaSDb:`, error);
          this.getAll(resortId).then(callback).catch((err) => {
            Logger.error('Local subscription fallback for bookings failed:', err);
          });
        });
        return unsubscribe;
      } catch (error) {
        Logger.error(`Failed to initialize subscription for bookings in resort ${resortId}, falling back to LocalSaaSDb:`, error);
        this.getAll(resortId).then(callback).catch((err) => {
          Logger.error('Local subscription fallback for bookings failed:', err);
        });
        return () => {};
      }
    } else {
      this.getAll(resortId).then(callback).catch((err) => {
        Logger.error('Local subscription fallback for bookings failed:', err);
      });
      // In local mode, return a dummy teardown function. We can also set up a custom window event or interval if we want, but local changes trigger state refreshes anyway.
      return () => {};
    }
  }
}

export const bookingRepository = new BookingRepository();
export default bookingRepository;
