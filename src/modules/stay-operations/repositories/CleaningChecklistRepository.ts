import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { CleaningChecklist } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class CleaningChecklistRepository extends BaseRepository<CleaningChecklist> {
  constructor() {
    super('cleaningChecklists');
  }

  override async getAll(resortId: string): Promise<CleaningChecklist[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      const data = LocalSaaSDb.get<any[]>(`cleaningChecklists_${resortId}`) || [];
      return data.map(item => this.deserialize(item));
    }
  }

  override async save(resortId: string, entity: CleaningChecklist): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const now = new Date().toISOString();
      const payload = {
        ...this.serialize(entity),
      } as CleaningChecklist;
      
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        if (!payload.createdAt) {
          payload.createdAt = now;
        }
        list.push(payload);
      }
      LocalSaaSDb.set(`cleaningChecklists_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`cleaningChecklists_${resortId}`, filtered);
    }
  }
}

export const cleaningChecklistRepository = new CleaningChecklistRepository();
export default cleaningChecklistRepository;
