import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AccommodationConfig, AccommodationType, Amenity, AccommodationPolicies, CustomFieldConfig, CapacityOptions, StatusOption } from '../types';
import { AccommodationConfigService } from '../services/AccommodationConfigService';
import { useResort } from '../../../shared/contexts/ResortContext';

interface AccommodationConfigContextType {
  config: AccommodationConfig | null;
  loading: boolean;
  error: string | null;
  saveConfig: (newConfig: AccommodationConfig) => Promise<void>;
  saveAccommodationType: (type: AccommodationType) => Promise<void>;
  deleteAccommodationType: (id: string) => Promise<void>;
  saveAmenity: (amenity: Amenity) => Promise<void>;
  deleteAmenity: (id: string) => Promise<void>;
  savePolicies: (policies: AccommodationPolicies) => Promise<void>;
  saveCustomField: (field: CustomFieldConfig) => Promise<void>;
  deleteCustomField: (key: string) => Promise<void>;
  saveCapacityOptions: (options: CapacityOptions) => Promise<void>;
  saveStatusOptions: (options: StatusOption[]) => Promise<void>;
  reload: () => Promise<void>;
}

const AccommodationConfigContext = createContext<AccommodationConfigContextType | undefined>(undefined);

export const AccommodationConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resort } = useResort();
  const [config, setConfig] = useState<AccommodationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!resort) {
      setConfig(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await AccommodationConfigService.getAccommodationConfig(resort.id);
      setConfig(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la configuración de alojamientos');
    } finally {
      setLoading(false);
    }
  }, [resort]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (newConfig: AccommodationConfig) => {
    if (!resort) return;
    try {
      await AccommodationConfigService.saveAccommodationConfig(resort.id, newConfig);
      setConfig(newConfig);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración');
      throw err;
    }
  };

  const saveAccommodationType = async (type: AccommodationType) => {
    if (!config) return;
    const types = [...config.accommodationTypes];
    const idx = types.findIndex(t => t.id === type.id);
    if (idx !== -1) {
      types[idx] = type;
    } else {
      types.push(type);
    }
    await saveConfig({ ...config, accommodationTypes: types });
  };

  const deleteAccommodationType = async (id: string) => {
    if (!config) return;
    const types = config.accommodationTypes.filter(t => t.id !== id);
    await saveConfig({ ...config, accommodationTypes: types });
  };

  const saveAmenity = async (amenity: Amenity) => {
    if (!config) return;
    const amenities = [...config.amenities];
    const idx = amenities.findIndex(a => a.id === amenity.id);
    if (idx !== -1) {
      amenities[idx] = amenity;
    } else {
      amenities.push(amenity);
    }
    await saveConfig({ ...config, amenities });
  };

  const deleteAmenity = async (id: string) => {
    if (!config) return;
    const amenities = config.amenities.filter(a => a.id !== id);
    await saveConfig({ ...config, amenities });
  };

  const savePolicies = async (policies: AccommodationPolicies) => {
    if (!config) return;
    await saveConfig({ ...config, policies });
  };

  const saveCustomField = async (field: CustomFieldConfig) => {
    if (!config) return;
    const fields = [...config.customFields];
    const idx = fields.findIndex(f => f.key === field.key);
    if (idx !== -1) {
      fields[idx] = field;
    } else {
      fields.push(field);
    }
    await saveConfig({ ...config, customFields: fields });
  };

  const deleteCustomField = async (key: string) => {
    if (!config) return;
    const fields = config.customFields.filter(f => f.key !== key);
    await saveConfig({ ...config, customFields: fields });
  };

  const saveCapacityOptions = async (options: CapacityOptions) => {
    if (!config) return;
    await saveConfig({ ...config, capacityOptions: options });
  };

  const saveStatusOptions = async (options: StatusOption[]) => {
    if (!config) return;
    await saveConfig({ ...config, statusOptions: options });
  };

  return (
    <AccommodationConfigContext.Provider
      value={{
        config,
        loading,
        error,
        saveConfig,
        saveAccommodationType,
        deleteAccommodationType,
        saveAmenity,
        deleteAmenity,
        savePolicies,
        saveCustomField,
        deleteCustomField,
        saveCapacityOptions,
        saveStatusOptions,
        reload: fetchConfig,
      }}
    >
      {children}
    </AccommodationConfigContext.Provider>
  );
};

export const useAccommodationConfigContext = () => {
  const ctx = useContext(AccommodationConfigContext);
  if (!ctx) {
    throw new Error('useAccommodationConfigContext debe usarse dentro de un AccommodationConfigProvider');
  }
  return ctx;
};
