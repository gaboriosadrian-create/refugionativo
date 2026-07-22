import { BaseRepository } from '../../core/repositories/BaseRepository';
import { Booking } from '../../types';
import { isFirebaseConfigured } from '../../core/firebase/firebase';
import { LocalSaaSDb } from '../services/LocalSaaSDb';

export class ReservationRepository extends BaseRepository<Booking> {
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
}
export const reservationRepository = new ReservationRepository();
