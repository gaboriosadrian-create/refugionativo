import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { AccommodationConfig } from '../types';

export class AccommodationConfigRepository extends BaseRepository<AccommodationConfig & { id: string }> {
  constructor() {
    super('settings');
  }

  async getConfig(resortId: string): Promise<AccommodationConfig | null> {
    const data = await this.getById(resortId, 'accommodations');
    if (!data) return null;
    const { id, ...config } = data;
    return config as AccommodationConfig;
  }

  async saveConfig(resortId: string, config: AccommodationConfig): Promise<void> {
    await this.save(resortId, { id: 'accommodations', ...config });
  }
}

export const accommodationConfigRepository = new AccommodationConfigRepository();
