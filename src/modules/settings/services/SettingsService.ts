import { settingsRepository } from '../repositories/SettingsRepository';
import { AppSettings } from '../../../types';
import { Logger } from '../../../core/logger/Logger';

export class SettingsService {
  static getDefaultSettings(resortId: string): AppSettings {
    return {
      appName: "Mi Complejo Turístico",
      appSubtitle: "Configuración de StayFlow",
      logoIcon: "trees",
      address: "Calle Principal 123",
      locationDetails: "Configura la ubicación exacta y detalles de cómo llegar aquí.",
      googleMapsLink: "",
      hours: "Todos los días, 08:00 a 22:00 hs",
      phone: "+54 9 11 1234 5678",
      whatsapp: "5491112345678",
      email: "contacto@micomplejo.com",
      terminology: {
        singular: "Alojamiento",
        plural: "Alojamientos"
      }
    };
  }

  static async getSettings(resortId: string): Promise<AppSettings> {
    try {
      let settings = await settingsRepository.getSettings(resortId);
      if (!settings) {
        Logger.info(`Configuración general no encontrada para Resort: ${resortId}. Creando valores por defecto...`);
        settings = this.getDefaultSettings(resortId);
        await settingsRepository.saveSettings(resortId, settings);
      }
      return settings;
    } catch (err) {
      Logger.error(`Error en getSettings para Resort: ${resortId}:`, err);
      return this.getDefaultSettings(resortId);
    }
  }

  static async saveSettings(resortId: string, settings: AppSettings): Promise<void> {
    await settingsRepository.saveSettings(resortId, settings);
  }
}


