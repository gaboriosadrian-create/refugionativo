import {
  CurrencyConfig,
  LanguageConfig,
  LocalizationConfig,
  TranslationRecord
} from '../types';

export const INITIAL_LANGUAGES: LanguageConfig[] = [
  {
    code: 'es',
    name: 'Español',
    nativeName: 'Español (Latinoamérica & España)',
    flag: '🇪🇸',
    enabled: true,
    isDefault: true
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US & Global)',
    flag: '🇺🇸',
    enabled: true
  },
  {
    code: 'pt',
    name: 'Português',
    nativeName: 'Português (Brasil & Portugal)',
    flag: '🇧🇷',
    enabled: true
  }
];

export const INITIAL_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    exchangeRateToBase: 1.0,
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    symbolPosition: 'prefix',
    isBaseCurrency: true,
    enabled: true
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    exchangeRateToBase: 0.92,
    decimalPlaces: 2,
    decimalSeparator: ',',
    thousandsSeparator: '.',
    symbolPosition: 'suffix',
    enabled: true
  },
  {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileño',
    exchangeRateToBase: 5.45,
    decimalPlaces: 2,
    decimalSeparator: ',',
    thousandsSeparator: '.',
    symbolPosition: 'prefix',
    enabled: true
  },
  {
    code: 'ARS',
    symbol: '$',
    name: 'Peso Argentino',
    exchangeRateToBase: 920.0,
    decimalPlaces: 2,
    decimalSeparator: ',',
    thousandsSeparator: '.',
    symbolPosition: 'prefix',
    enabled: true
  },
  {
    code: 'CLP',
    symbol: '$',
    name: 'Peso Chileno',
    exchangeRateToBase: 940.0,
    decimalPlaces: 0,
    decimalSeparator: ',',
    thousandsSeparator: '.',
    symbolPosition: 'prefix',
    enabled: true
  },
  {
    code: 'MXN',
    symbol: '$',
    name: 'Peso Mexicano',
    exchangeRateToBase: 18.25,
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    symbolPosition: 'prefix',
    enabled: true
  }
];

export const INITIAL_LOCALIZATION: LocalizationConfig = {
  id: 'loc-default',
  tenantId: 'tenant-default',
  organizationId: 'org-stayflow-global',
  defaultLanguage: 'es',
  defaultCurrency: 'USD',
  timezone: 'America/New_York',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  decimalSeparator: '.',
  thousandsSeparator: ',',
  defaultTaxRate: 12.5,
  taxLabel: 'IVA / VAT / Tax',
  addressFormat: '{street}, {city}, {state} {zip}, {country}',
  updatedAt: new Date().toISOString()
};

// Common dynamic translations dictionary for Español, English, Português
export const BUILTIN_TRANSLATIONS: Record<string, Record<string, string>> = {
  es: {
    'welcome': 'Bienvenido a StayFlow Enterprise',
    'occupancy': 'Ocupación Consolidada',
    'revenue': 'Ingresos Totales',
    'adr': 'Tarifa Promedio Diaria (ADR)',
    'revpar': 'Ingreso por Habitación Disponible (RevPAR)',
    'bookings': 'Reservas Activas',
    'cancellations': 'Cancelaciones',
    'housekeeping': 'Housekeeping Pendiente',
    'maintenance': 'Mantenimiento Pendiente',
    'organization': 'Organización Empresarial',
    'brand': 'Marca Hotelera',
    'property': 'Propiedad / Hotel',
    'currency': 'Moneda Principal',
    'language': 'Idioma',
    'save_changes': 'Guardar Cambios',
    'compliance_vault': 'Centro de Cumplimiento & Auditoría',
    'audit_logs': 'Registro de Auditoría',
    'retention_policy': 'Política de Retención de Datos',
    'multi_org_dashboard': 'Panel Control Multi-Organización',
    'nights': 'Noches',
    'guests': 'Huéspedes',
    'total_paid': 'Total Pagado'
  },
  en: {
    'welcome': 'Welcome to StayFlow Enterprise',
    'occupancy': 'Consolidated Occupancy',
    'revenue': 'Total Revenue',
    'adr': 'Average Daily Rate (ADR)',
    'revpar': 'Revenue Per Available Room (RevPAR)',
    'bookings': 'Active Bookings',
    'cancellations': 'Cancellations',
    'housekeeping': 'Pending Housekeeping',
    'maintenance': 'Pending Maintenance',
    'organization': 'Enterprise Organization',
    'brand': 'Hotel Brand',
    'property': 'Property / Hotel',
    'currency': 'Primary Currency',
    'language': 'Language',
    'save_changes': 'Save Changes',
    'compliance_vault': 'Compliance & Audit Vault',
    'audit_logs': 'Audit Logs',
    'retention_policy': 'Data Retention Policy',
    'multi_org_dashboard': 'Multi-Organization Dashboard',
    'nights': 'Nights',
    'guests': 'Guests',
    'total_paid': 'Total Paid'
  },
  pt: {
    'welcome': 'Bem-vindo ao StayFlow Enterprise',
    'occupancy': 'Ocupação Consolidada',
    'revenue': 'Receita Total',
    'adr': 'Diária Média (ADR)',
    'revpar': 'Receita por Quarto Disponível (RevPAR)',
    'bookings': 'Reservas Ativas',
    'cancellations': 'Cancelamentos',
    'housekeeping': 'Governança Pendente',
    'maintenance': 'Manutenção Pendente',
    'organization': 'Organização Empresarial',
    'brand': 'Marca Hoteleira',
    'property': 'Propriedade / Hotel',
    'currency': 'Moeda Principal',
    'language': 'Idioma',
    'save_changes': 'Salvar Alterações',
    'compliance_vault': 'Central de Conformidade e Auditoria',
    'audit_logs': 'Registros de Auditoria',
    'retention_policy': 'Política de Retenção de Dados',
    'multi_org_dashboard': 'Painel Multi-Organização',
    'nights': 'Noites',
    'guests': 'Hóspedes',
    'total_paid': 'Total Pago'
  }
};

class LocalizationRepository {
  private languages: LanguageConfig[] = [...INITIAL_LANGUAGES];
  private currencies: CurrencyConfig[] = [...INITIAL_CURRENCIES];
  private localizationConfig: LocalizationConfig = { ...INITIAL_LOCALIZATION };
  private translationStore: Record<string, Record<string, string>> = JSON.parse(JSON.stringify(BUILTIN_TRANSLATIONS));

  public getLanguages(): LanguageConfig[] {
    return this.languages;
  }

  public addLanguage(lang: LanguageConfig): void {
    if (!this.languages.some(l => l.code === lang.code)) {
      this.languages.push(lang);
      this.translationStore[lang.code] = this.translationStore[lang.code] || {};
    }
  }

  public getCurrencies(): CurrencyConfig[] {
    return this.currencies;
  }

  public updateCurrencyRate(code: string, newRate: number): void {
    const c = this.currencies.find(item => item.code === code);
    if (c) {
      c.exchangeRateToBase = newRate;
    }
  }

  public getLocalizationConfig(): LocalizationConfig {
    return this.localizationConfig;
  }

  public updateLocalizationConfig(updates: Partial<LocalizationConfig>): LocalizationConfig {
    this.localizationConfig = {
      ...this.localizationConfig,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.localizationConfig;
  }

  public getTranslation(lang: string, key: string): string {
    const dict = this.translationStore[lang] || this.translationStore['es'] || {};
    return dict[key] || BUILTIN_TRANSLATIONS['es'][key] || key;
  }

  public setTranslation(lang: string, key: string, value: string): void {
    if (!this.translationStore[lang]) {
      this.translationStore[lang] = {};
    }
    this.translationStore[lang][key] = value;
  }

  public getFullDictionary(lang: string): Record<string, string> {
    return {
      ...(this.translationStore['es'] || {}),
      ...(this.translationStore[lang] || {})
    };
  }
}

export const localizationRepository = new LocalizationRepository();
