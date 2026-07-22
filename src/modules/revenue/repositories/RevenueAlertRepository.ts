import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { RevenueAlert } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class RevenueAlertRepository extends BaseRepository<RevenueAlert> {
  constructor() {
    super('revenueAlerts');
  }

  private getLocalKey(resortId: string): string {
    return `revenue_alerts_${resortId}`;
  }

  override async getAll(resortId: string): Promise<RevenueAlert[]> {
    if (isFirebaseConfigured) {
      return super.getAll(resortId);
    } else {
      const data = LocalSaaSDb.get<any[]>(this.getLocalKey(resortId)) || [];
      return data.map(item => this.deserialize(item));
    }
  }

  override async save(resortId: string, entity: RevenueAlert): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const now = new Date().toISOString();
      const payload = {
        ...this.serialize(entity),
        updatedAt: now,
      } as RevenueAlert;

      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        if (!payload.createdAt) {
          payload.createdAt = now;
        }
        list.push(payload);
      }
      LocalSaaSDb.set(this.getLocalKey(resortId), list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(this.getLocalKey(resortId), filtered);
    }
  }
}

export const revenueAlertRepository = new RevenueAlertRepository();
