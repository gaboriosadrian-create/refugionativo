import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { GuestSurvey } from '../types/journey';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class GuestSurveyRepository extends BaseRepository<GuestSurvey> {
  constructor() {
    super('guestSurveys');
  }

  override async getAll(resortId: string): Promise<GuestSurvey[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      return LocalSaaSDb.get<GuestSurvey[]>(`guestSurveys_${resortId}`) || [];
    }
  }

  override async save(resortId: string, entity: GuestSurvey): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...entity };
      } else {
        list.push(entity);
      }
      LocalSaaSDb.set(`guestSurveys_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`guestSurveys_${resortId}`, filtered);
    }
  }

  public async findByBookingId(resortId: string, bookingId: string | number): Promise<GuestSurvey | null> {
    const all = await this.getAll(resortId);
    const bIdStr = String(bookingId);
    return all.find(item => String(item.bookingId) === bIdStr) || null;
  }
}

export const guestSurveyRepository = new GuestSurveyRepository();
