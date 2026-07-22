import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { GuestPreferences } from '../types/crm';

export class GuestPreferencesRepository extends BaseRepository<GuestPreferences> {
  constructor() {
    super('guestPreferences');
  }

  public async getByGuestId(resortId: string, guestId: string): Promise<GuestPreferences> {
    const all = await this.getAll(resortId);
    const existing = all.find(p => p.guestId === guestId);
    if (existing) return existing;

    // Default empty preferences
    return {
      id: guestId, // Use guestId as the unique ID for easy fetching
      resortId,
      guestId,
      hasPets: false,
      updatedAt: new Date().toISOString()
    };
  }

  public async savePreferences(resortId: string, preferences: GuestPreferences): Promise<void> {
    const payload: GuestPreferences = {
      ...preferences,
      updatedAt: new Date().toISOString()
    };
    await this.save(resortId, payload);
  }
}

export const guestPreferencesRepository = new GuestPreferencesRepository();
export default guestPreferencesRepository;
