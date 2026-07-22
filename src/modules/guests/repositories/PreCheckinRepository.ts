import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { PreCheckin } from '../types/journey';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class PreCheckinRepository extends BaseRepository<PreCheckin> {
  constructor() {
    super('preCheckins');
  }

  override async getAll(resortId: string): Promise<PreCheckin[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      return LocalSaaSDb.get<PreCheckin[]>(`preCheckins_${resortId}`) || [];
    }
  }

  override async save(resortId: string, entity: PreCheckin): Promise<void> {
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
      LocalSaaSDb.set(`preCheckins_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`preCheckins_${resortId}`, filtered);
    }
  }

  public async findByBookingId(resortId: string, bookingId: string | number): Promise<PreCheckin | null> {
    const all = await this.getAll(resortId);
    const bIdStr = String(bookingId);
    return all.find(item => String(item.bookingId) === bIdStr) || null;
  }
}

export const preCheckinRepository = new PreCheckinRepository();
