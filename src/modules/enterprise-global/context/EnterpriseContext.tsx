import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Organization,
  Brand,
  SupportedLanguageCode,
  CorporateRole,
  CurrencyConfig,
  LanguageConfig
} from '../types';
import { OrganizationService } from '../services/OrganizationService';
import { BrandService } from '../services/BrandService';
import { LocalizationService } from '../services/LocalizationService';
import { TranslationService } from '../services/TranslationService';

interface EnterpriseContextType {
  organizations: Organization[];
  selectedOrg: Organization | null;
  setSelectedOrg: (org: Organization | null) => void;
  brands: Brand[];
  selectedBrand: Brand | null;
  setSelectedBrand: (brand: Brand | null) => void;
  currentLanguage: SupportedLanguageCode;
  setLanguage: (lang: SupportedLanguageCode) => void;
  currentCurrency: string;
  setCurrency: (currency: string) => void;
  currentRole: CorporateRole;
  setRole: (role: CorporateRole) => void;
  availableLanguages: LanguageConfig[];
  availableCurrencies: CurrencyConfig[];
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number, overrideCurrency?: string) => string;
  formatDate: (date: Date | string, overrideFormat?: string) => string;
  refreshData: () => void;
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

export const EnterpriseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguageCode>('es');
  const [currentCurrency, setCurrentCurrencyState] = useState<string>('USD');
  const [currentRole, setRole] = useState<CorporateRole>('CORPORATE_ADMIN');

  const [availableLanguages, setAvailableLanguages] = useState<LanguageConfig[]>([]);
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyConfig[]>([]);

  const loadAll = () => {
    const orgs = OrganizationService.getOrganizations();
    setOrganizations(orgs);
    if (orgs.length > 0 && !selectedOrg) {
      setSelectedOrg(orgs[0]);
    }

    const allBrands = BrandService.getAllBrands();
    setBrands(allBrands);

    const langs = LocalizationService.getLanguages();
    setAvailableLanguages(langs);

    const currs = LocalizationService.getCurrencies();
    setAvailableCurrencies(currs);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const setLanguage = (lang: SupportedLanguageCode) => {
    setCurrentLanguageState(lang);
  };

  const setCurrency = (curr: string) => {
    setCurrentCurrencyState(curr);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return TranslationService.translate(currentLanguage, key, params);
  };

  const formatCurrency = (amount: number, overrideCurrency?: string): string => {
    const targetCurrency = overrideCurrency || currentCurrency;
    return LocalizationService.formatCurrency(amount, targetCurrency);
  };

  const formatDate = (date: Date | string, overrideFormat?: string): string => {
    return LocalizationService.formatDate(date, overrideFormat || 'DD/MM/YYYY');
  };

  return (
    <EnterpriseContext.Provider
      value={{
        organizations,
        selectedOrg,
        setSelectedOrg,
        brands: selectedOrg ? brands.filter(b => b.organizationId === selectedOrg.id) : brands,
        selectedBrand,
        setSelectedBrand,
        currentLanguage,
        setLanguage,
        currentCurrency,
        setCurrency,
        currentRole,
        setRole,
        availableLanguages,
        availableCurrencies,
        t,
        formatCurrency,
        formatDate,
        refreshData: loadAll
      }}
    >
      {children}
    </EnterpriseContext.Provider>
  );
};

export const useEnterprise = (): EnterpriseContextType => {
  const context = useContext(EnterpriseContext);
  if (!context) {
    throw new Error('useEnterprise must be used within an EnterpriseProvider');
  }
  return context;
};
