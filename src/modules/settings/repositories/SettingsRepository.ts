import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { AppSettings } from '../../../types';

export class SettingsRepository extends BaseRepository<AppSettings & { id: string }> {
  constructor() {
    super('settings');
  }

  async getSettings(resortId: string): Promise<AppSettings | null> {
    const data = await this.getById(resortId, 'general');
    if (!data) return null;
    const { id, ...settings } = data;
    return settings as AppSettings;
  }

  async saveSettings(resortId: string, settings: AppSettings): Promise<void> {
    await this.save(resortId, { id: 'general', ...settings });
  }
}
export const settingsRepository = new SettingsRepository();
