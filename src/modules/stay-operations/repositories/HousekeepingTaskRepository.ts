import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { HousekeepingTask } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class HousekeepingTaskRepository extends BaseRepository<HousekeepingTask> {
  constructor() {
    super('housekeepingTasks');
  }

  override async getAll(resortId: string): Promise<HousekeepingTask[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      const data = LocalSaaSDb.get<any[]>(`housekeepingTasks_${resortId}`) || [];
      return data.map(item => this.deserialize(item));
    }
  }

  override async save(resortId: string, entity: HousekeepingTask): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const now = new Date().toISOString();
      const payload = {
        ...this.serialize(entity),
        updatedAt: now,
      } as HousekeepingTask;
      
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        if (!payload.createdAt) {
          payload.createdAt = now;
        }
        list.push(payload);
      }
      LocalSaaSDb.set(`housekeepingTasks_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`housekeepingTasks_${resortId}`, filtered);
    }
  }
}

export const housekeepingTaskRepository = new HousekeepingTaskRepository();
export default housekeepingTaskRepository;
