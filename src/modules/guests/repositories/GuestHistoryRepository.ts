import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { GuestHistoryRecord } from '../types/crm';

export class GuestHistoryRepository extends BaseRepository<GuestHistoryRecord> {
  constructor() {
    super('guestHistory');
  }

  public async getByGuestId(resortId: string, guestId: string): Promise<GuestHistoryRecord[]> {
    const all = await this.getAll(resortId);
    return all
      .filter(r => r.guestId === guestId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public async addRecord(resortId: string, record: Omit<GuestHistoryRecord, 'id' | 'timestamp'> & { timestamp?: string }): Promise<GuestHistoryRecord> {
    const id = `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const fullRecord: GuestHistoryRecord = {
      ...record,
      id,
      timestamp: record.timestamp || new Date().toISOString()
    };
    await this.save(resortId, fullRecord);
    return fullRecord;
  }
}

export const guestHistoryRepository = new GuestHistoryRepository();
export default guestHistoryRepository;
