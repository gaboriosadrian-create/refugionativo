import { localizationRepository } from '../repositories/localizationRepository';
import { complianceRepository } from '../repositories/complianceRepository';

export class TranslationService {
  public static translate(
    lang: string,
    key: string,
    params?: Record<string, string | number>
  ): string {
    let text = localizationRepository.getTranslation(lang, key);

    if (!text && lang !== 'es') {
      text = localizationRepository.getTranslation('es', key);
    }

    if (!text) {
      text = key;
      // Log missing translation to observability
      complianceRepository.logObservability({
        tenantId: 'tenant-default',
        type: 'translation_missing',
        message: `Missing translation key "${key}" for language "${lang}"`,
        metadata: { lang, key },
        language: lang
      });
    }

    // Interpolation parameters e.g. {count}, {name}
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const value = params[paramKey];
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
      });
    }

    return text;
  }

  public static setTranslation(lang: string, key: string, value: string): void {
    localizationRepository.setTranslation(lang, key, value);
    complianceRepository.logAudit({
      tenantId: 'tenant-default',
      actorEmail: 'system.admin@stayflow.com',
      actorRole: 'CORPORATE_ADMIN',
      action: 'UPDATE_TRANSLATION_KEY',
      category: 'config_change',
      targetResource: `translations/${lang}/${key}`,
      details: { lang, key, value },
      ipAddress: '127.0.0.1'
    });
  }

  public static getFullDictionary(lang: string): Record<string, string> {
    return localizationRepository.getFullDictionary(lang);
  }
}
