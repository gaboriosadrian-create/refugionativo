import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { WebsiteSettings } from '../types';

export class WebsiteSettingsRepository extends BaseRepository<WebsiteSettings & { id: string }> {
  constructor() {
    super('websiteSettings');
  }

  async getSettings(resortId: string): Promise<WebsiteSettings | null> {
    const data = await this.getById(resortId, 'general');
    if (!data) return null;
    const { id, ...settings } = data;
    return settings as WebsiteSettings;
  }

  async saveSettings(resortId: string, settings: WebsiteSettings): Promise<void> {
    await this.save(resortId, { id: 'general', ...settings });
  }
}

export const websiteSettingsRepository = new WebsiteSettingsRepository();
