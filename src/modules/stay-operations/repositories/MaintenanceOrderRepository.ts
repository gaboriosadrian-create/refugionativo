import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { MaintenanceOrder } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class MaintenanceOrderRepository extends BaseRepository<MaintenanceOrder> {
  constructor() {
    super('maintenanceOrders');
  }

  override async getAll(resortId: string): Promise<MaintenanceOrder[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      const data = LocalSaaSDb.get<any[]>(`maintenanceOrders_${resortId}`) || [];
      return data.map(item => this.deserialize(item));
    }
  }

  override async save(resortId: string, entity: MaintenanceOrder): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const now = new Date().toISOString();
      const payload = {
        ...this.serialize(entity),
        updatedAt: now,
      } as MaintenanceOrder;
      
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        if (!payload.createdAt) {
          payload.createdAt = now;
        }
        list.push(payload);
      }
      LocalSaaSDb.set(`maintenanceOrders_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`maintenanceOrders_${resortId}`, filtered);
    }
  }
}

export const maintenanceOrderRepository = new MaintenanceOrderRepository();
export default maintenanceOrderRepository;
