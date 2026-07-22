import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { Companion } from '../types/journey';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class CompanionRepository extends BaseRepository<Companion> {
  constructor() {
    super('companions');
  }

  override async getAll(resortId: string): Promise<Companion[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      return LocalSaaSDb.get<Companion[]>(`companions_${resortId}`) || [];
    }
  }

  override async save(resortId: string, entity: Companion): Promise<void> {
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
      LocalSaaSDb.set(`companions_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`companions_${resortId}`, filtered);
    }
  }

  public async findByBookingId(resortId: string, bookingId: string | number): Promise<Companion[]> {
    const all = await this.getAll(resortId);
    const bIdStr = String(bookingId);
    return all.filter(item => String(item.bookingId) === bIdStr);
  }
}

export const companionRepository = new CompanionRepository();
