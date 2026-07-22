import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { GuestJourney } from '../types/journey';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class GuestJourneyRepository extends BaseRepository<GuestJourney> {
  constructor() {
    super('guestJourney');
  }

  override async getAll(resortId: string): Promise<GuestJourney[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      return LocalSaaSDb.get<GuestJourney[]>(`guestJourney_${resortId}`) || [];
    }
  }

  override async save(resortId: string, entity: GuestJourney): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const now = new Date().toISOString();
      const payload = {
        ...entity,
        updatedAt: now,
      };
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        payload.createdAt = entity.createdAt || now;
        list.push(payload);
      }
      LocalSaaSDb.set(`guestJourney_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`guestJourney_${resortId}`, filtered);
    }
  }

  public async findByBookingId(resortId: string, bookingId: string | number): Promise<GuestJourney | null> {
    const all = await this.getAll(resortId);
    const bIdStr = String(bookingId);
    return all.find(item => String(item.bookingId) === bIdStr) || null;
  }
}

export const guestJourneyRepository = new GuestJourneyRepository();
