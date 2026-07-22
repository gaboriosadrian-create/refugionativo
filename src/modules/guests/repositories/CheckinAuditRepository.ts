import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { CheckinAudit } from '../types/journey';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class CheckinAuditRepository extends BaseRepository<CheckinAudit> {
  constructor() {
    super('checkinAudit');
  }

  override async getAll(resortId: string): Promise<CheckinAudit[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      return LocalSaaSDb.get<CheckinAudit[]>(`checkinAudit_${resortId}`) || [];
    }
  }

  override async save(resortId: string, entity: CheckinAudit): Promise<void> {
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
      LocalSaaSDb.set(`checkinAudit_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`checkinAudit_${resortId}`, filtered);
    }
  }

  public async findByBookingId(resortId: string, bookingId: string | number): Promise<CheckinAudit[]> {
    const all = await this.getAll(resortId);
    const bIdStr = String(bookingId);
    return all.filter(item => String(item.bookingId) === bIdStr);
  }
}

export const checkinAuditRepository = new CheckinAuditRepository();
