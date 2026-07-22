import { websiteSettingsRepository } from '../repositories/WebsiteSettingsRepository';
import { WebsiteSettings } from '../types';
import { SettingsService } from '../../settings/services/SettingsService';
import { Logger } from '../../../core/logger/Logger';

export class WebsiteSettingsService {
  /**
   * Retrieves WebsiteSettings for a given resort, seeding defaults if none exist.
   */
  static async getSettings(resortId: string): Promise<WebsiteSettings> {
    Logger.info(`Retrieving WebsiteSettings for resort: ${resortId}`);
    try {
      const existing = await websiteSettingsRepository.getSettings(resortId);
      if (existing) {
        return existing;
      }
    } catch (err) {
      Logger.error(`Error fetching WebsiteSettings, using fallback defaults`, err);
    }

    // Seeding logic: construct defaults using general AppSettings if available
    Logger.info(`WebsiteSettings not found for ${resortId}. Seeding default configuration.`);
    let businessName = 'StayFlow Resort';
    let email = 'contacto@stayflow.app';
    let phone = '+54 294 555-0138';
    let whatsapp = '5492945550138';
    let address = 'Ruta 40, Km 1900, Patagonia Argentina';
    let desc = 'Tu refugio ideal en la naturaleza de la Patagonia. Cabañas totalmente equipadas con vistas espectaculares, tranquilidad y servicios premium de primer nivel.';

    try {
      const generalSettings = await SettingsService.getSettings(resortId);
      if (generalSettings) {
        businessName = generalSettings.appName || businessName;
        email = generalSettings.email || email;
        phone = generalSettings.phone || phone;
        whatsapp = generalSettings.whatsapp || whatsapp;
        address = generalSettings.address || address;
        desc = generalSettings.appSubtitle || desc;
      }
    } catch (err) {
      Logger.warn(`Could not read general AppSettings to seed WebsiteSettings, using default fallbacks`, err);
    }

    const defaultSettings: WebsiteSettings = {
      resortId,
      businessName,
      description: desc,
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#0f3c25', // Forest green
      secondaryColor: '#f7f9f5', // Cream
      typography: 'sans',
      languages: ['es'],
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      socialLinks: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com'
      },
      whatsapp,
      email,
      phone,
      address,
      seo: {
        title: `${businessName} | Refugio & Naturaleza Patagonia`,
        description: desc,
        keywords: 'cabins, resort, patagonia, alquiler, turismo, vacaciones, glamping'
      },
      updatedAt: new Date().toISOString()
    };

    try {
      await websiteSettingsRepository.saveSettings(resortId, defaultSettings);
    } catch (err) {
      Logger.error(`Failed to save seeded WebsiteSettings`, err);
    }

    return defaultSettings;
  }

  /**
   * Saves updated WebsiteSettings.
   */
  static async saveSettings(resortId: string, settings: WebsiteSettings): Promise<void> {
    Logger.info(`Saving WebsiteSettings for resort: ${resortId}`);
    const updated = {
      ...settings,
      resortId,
      updatedAt: new Date().toISOString()
    };
    await websiteSettingsRepository.saveSettings(resortId, updated);
  }
}

export default WebsiteSettingsService;
