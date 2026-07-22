import { CurrencyConfig, LanguageConfig, LocalizationConfig } from '../types';
import { localizationRepository } from '../repositories/localizationRepository';
import { complianceRepository } from '../repositories/complianceRepository';

export class LocalizationService {
  public static getLanguages(): LanguageConfig[] {
    return localizationRepository.getLanguages();
  }

  public static addLanguage(lang: LanguageConfig): void {
    localizationRepository.addLanguage(lang);
    complianceRepository.logAudit({
      tenantId: 'tenant-default',
      actorEmail: 'system.admin@stayflow.com',
      actorRole: 'CORPORATE_ADMIN',
      action: 'ADD_SUPPORTED_LANGUAGE',
      category: 'config_change',
      targetResource: `languages/${lang.code}`,
      details: { code: lang.code, name: lang.name },
      ipAddress: '127.0.0.1'
    });
  }

  public static getCurrencies(): CurrencyConfig[] {
    return localizationRepository.getCurrencies();
  }

  public static updateExchangeRate(code: string, newRate: number): void {
    localizationRepository.updateCurrencyRate(code, newRate);
    complianceRepository.logAudit({
      tenantId: 'tenant-default',
      actorEmail: 'system.admin@stayflow.com',
      actorRole: 'FINANCIAL_MANAGER',
      action: 'UPDATE_EXCHANGE_RATE',
      category: 'config_change',
      targetResource: `currencies/${code}`,
      details: { currencyCode: code, newRate },
      ipAddress: '127.0.0.1'
    });
  }

  public static getLocalizationConfig(): LocalizationConfig {
    return localizationRepository.getLocalizationConfig();
  }

  public static updateLocalizationConfig(updates: Partial<LocalizationConfig>): LocalizationConfig {
    const updated = localizationRepository.updateLocalizationConfig(updates);
    complianceRepository.logAudit({
      tenantId: 'tenant-default',
      actorEmail: 'system.admin@stayflow.com',
      actorRole: 'CORPORATE_ADMIN',
      action: 'UPDATE_LOCALIZATION_SETTINGS',
      category: 'config_change',
      targetResource: 'localization/config',
      details: updates,
      ipAddress: '127.0.0.1'
    });
    return updated;
  }

  // Format currency with regional rules
  public static formatCurrency(
    amount: number,
    currencyCode: string = 'USD'
  ): string {
    const currencies = localizationRepository.getCurrencies();
    const curr = currencies.find(c => c.code === currencyCode) || currencies[0];

    const formattedNum = amount.toLocaleString('en-US', {
      minimumFractionDigits: curr.decimalPlaces,
      maximumFractionDigits: curr.decimalPlaces
    });

    if (curr.symbolPosition === 'suffix') {
      return `${formattedNum} ${curr.symbol}`;
    }
    return `${curr.symbol}${formattedNum}`;
  }

  // Convert amount from base currency to target currency
  public static convertCurrency(
    amountInBase: number,
    targetCurrencyCode: string
  ): number {
    const currencies = localizationRepository.getCurrencies();
    const curr = currencies.find(c => c.code === targetCurrencyCode) || currencies[0];
    return amountInBase * (curr.exchangeRateToBase || 1.0);
  }

  // Format date with configured date format
  public static formatDate(dateInput: Date | string, format: string = 'DD/MM/YYYY'): string {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    if (format === 'MM/DD/YYYY') {
      return `${month}/${day}/${year}`;
    }
    if (format === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    }
    return `${day}/${month}/${year}`;
  }
}
