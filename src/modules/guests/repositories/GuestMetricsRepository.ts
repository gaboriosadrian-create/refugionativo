import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { GuestMetrics } from '../types/crm';

export class GuestMetricsRepository extends BaseRepository<GuestMetrics> {
  constructor() {
    super('guestMetrics');
  }

  public async getByGuestId(resortId: string, guestId: string): Promise<GuestMetrics> {
    const all = await this.getAll(resortId);
    const existing = all.find(m => m.guestId === guestId);
    if (existing) return existing;

    // Default metrics structure
    return {
      id: guestId, // Use guestId as unique ID for ease of use
      resortId,
      guestId,
      bookingsCount: 0,
      nightsStayed: 0,
      totalRevenue: 0,
      frequency: 0,
      estimatedLtv: 0,
      updatedAt: new Date().toISOString()
    };
  }

  public async saveMetrics(resortId: string, metrics: GuestMetrics): Promise<void> {
    const payload: GuestMetrics = {
      ...metrics,
      updatedAt: new Date().toISOString()
    };
    await this.save(resortId, payload);
  }
}

export const guestMetricsRepository = new GuestMetricsRepository();
export default guestMetricsRepository;
