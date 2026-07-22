import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { OperationLog } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class OperationLogRepository extends BaseRepository<OperationLog> {
  constructor() {
    super('operationLogs');
  }

  override async getAll(resortId: string): Promise<OperationLog[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      const data = LocalSaaSDb.get<any[]>(`operationLogs_${resortId}`) || [];
      return data.map(item => this.deserialize(item));
    }
  }

  override async save(resortId: string, entity: OperationLog): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const payload = {
        ...this.serialize(entity),
      } as OperationLog;
      
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        list.push(payload);
      }
      LocalSaaSDb.set(`operationLogs_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`operationLogs_${resortId}`, filtered);
    }
  }
}

export const operationLogRepository = new OperationLogRepository();
export default operationLogRepository;
