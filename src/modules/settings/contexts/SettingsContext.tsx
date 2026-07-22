import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '../../../types';
import { SettingsService } from '../services/SettingsService';
import { useResort } from '../../../shared/contexts/ResortContext';

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  terminology: {
    singular: string;
    plural: string;
  };
  saveSettings: (updated: AppSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resort } = useResort();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!resort) {
        setSettings(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await SettingsService.getSettings(resort.id);
        setSettings(data);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [resort]);

  // Dynamic Terminology fallback based on business type
  const getTerminology = () => {
    if (settings?.terminology?.singular && settings?.terminology?.plural) {
      return {
        singular: settings.terminology.singular,
        plural: settings.terminology.plural
      };
    }

    if (!resort) {
      return { singular: 'Cabaña', plural: 'Cabañas' };
    }

    switch (resort.businessType) {
      case 'HOTEL':
        return { singular: 'Habitación', plural: 'Habitaciones' };
      case 'GLAMPING':
        return { singular: 'Domo', plural: 'Domos' };
      case 'CAMPING':
        return { singular: 'Parcela', plural: 'Parcelas' };
      case 'CABIN':
      default:
        return { singular: 'Cabaña', plural: 'Cabañas' };
    }
  };

  const saveSettings = async (updated: AppSettings) => {
    if (!resort) return;
    try {
      await SettingsService.saveSettings(resort.id, updated);
      setSettings(updated);
    } catch (err) {
      console.error('Error saving settings:', err);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        loading, 
        terminology: getTerminology(), 
        saveSettings 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
};
export default SettingsContext;
