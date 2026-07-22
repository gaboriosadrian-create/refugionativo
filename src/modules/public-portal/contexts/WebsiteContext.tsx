import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WebsiteSettings } from '../types';
import { WebsiteSettingsService } from '../services/WebsiteSettingsService';
import { AccommodationService } from '../../accommodations/services/AccommodationService';
import { Accommodation } from '../../accommodations/types';
import { useResort } from '../../../shared/contexts/ResortContext';
import { Logger } from '../../../core/logger/Logger';
import { WebsiteContent } from '../../website-cms/types';
import { WebsiteContentService } from '../../website-cms/services/WebsiteContentService';

interface WebsiteContextType {
  settings: WebsiteSettings | null;
  websiteContent: WebsiteContent | null;
  accommodations: Accommodation[];
  loading: boolean;
  currency: string;
  language: string;
  activePage: 'home' | 'accommodations' | 'accommodation-detail' | 'contact' | 'policies' | 'not-found' | 'booking-request';
  selectedSlug: string | null;
  setCurrency: (c: string) => void;
  setLanguage: (l: string) => void;
  navigateTo: (page: 'home' | 'accommodations' | 'accommodation-detail' | 'contact' | 'policies' | 'not-found' | 'booking-request', slug?: string) => void;
  saveWebsiteSettings: (settings: WebsiteSettings) => Promise<void>;
  reload: () => Promise<void>;
}

const WebsiteContext = createContext<WebsiteContextType | undefined>(undefined);

export const WebsiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resort } = useResort();
  const resortId = resort?.id || 'demo_resort';

  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent | null>(null);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrencyState] = useState('ARS');
  const [language, setLanguageState] = useState('es');
  const [activePage, setActivePage] = useState<'home' | 'accommodations' | 'accommodation-detail' | 'contact' | 'policies' | 'not-found' | 'booking-request'>('home');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const fetchWebsiteData = useCallback(async () => {
    setLoading(true);
    try {
      Logger.info(`WebsiteContext: Loading public portal data for resort: ${resortId}`);
      
      // Load settings
      const webSettings = await WebsiteSettingsService.getSettings(resortId);
      setSettings(webSettings);
      setCurrencyState(webSettings.currency || 'ARS');
      if (webSettings.languages && webSettings.languages.length > 0) {
        setLanguageState(webSettings.languages[0]);
      }

      // Load website CMS content (using WebsiteContentService, no direct Firestore query)
      const content = await WebsiteContentService.getContent(resortId);
      setWebsiteContent(content);

      // Load accommodations using AccommodationService (no direct Firestore)
      const visibleAccs = await AccommodationService.getVisibleAccommodations(resortId);
      setAccommodations(visibleAccs);
    } catch (err) {
      Logger.error(`WebsiteContext: Error loading public portal data`, err);
    } finally {
      setLoading(false);
    }
  }, [resortId]);

  useEffect(() => {
    fetchWebsiteData();
  }, [fetchWebsiteData]);

  const navigateTo = (page: 'home' | 'accommodations' | 'accommodation-detail' | 'contact' | 'policies' | 'not-found' | 'booking-request', slug?: string) => {
    setActivePage(page);
    if (slug) {
      setSelectedSlug(slug);
    } else {
      setSelectedSlug(null);
    }
    // Scroll to top on navigation for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setCurrency = (c: string) => {
    setCurrencyState(c);
  };

  const setLanguage = (l: string) => {
    setLanguageState(l);
  };

  const saveWebsiteSettings = async (updated: WebsiteSettings) => {
    try {
      await WebsiteSettingsService.saveSettings(resortId, updated);
      setSettings(updated);
    } catch (err) {
      Logger.error(`WebsiteContext: Error saving website settings`, err);
      throw err;
    }
  };

  return (
    <WebsiteContext.Provider
      value={{
        settings,
        websiteContent,
        accommodations,
        loading,
        currency,
        language,
        activePage,
        selectedSlug,
        setCurrency,
        setLanguage,
        navigateTo,
        saveWebsiteSettings,
        reload: fetchWebsiteData
      }}
    >
      {children}
    </WebsiteContext.Provider>
  );
};

export const useWebsite = () => {
  const context = useContext(WebsiteContext);
  if (context === undefined) {
    throw new Error('useWebsite must be used within a WebsiteProvider');
  }
  return context;
};
