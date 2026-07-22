import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Accommodation } from '../types';
import { AccommodationService } from '../services/AccommodationService';
import { accommodationRepository } from '../repositories/AccommodationRepository';
import { useResort } from '../../../shared/contexts/ResortContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { Logger } from '../../../core/logger/Logger';

interface AccommodationContextType {
  accommodations: Accommodation[];
  loading: boolean;
  error: string | null;
  saveAccommodation: (accommodation: Accommodation) => Promise<Accommodation>;
  deleteAccommodation: (id: string | number) => Promise<void>;
  reload: () => Promise<void>;
  featuredAccommodations: Accommodation[];
  visibleAccommodations: Accommodation[];
  getById: (id: string | number) => Accommodation | undefined;
}

const AccommodationContext = createContext<AccommodationContextType | undefined>(undefined);

export const AccommodationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resort } = useResort();
  const { user } = useAuth();

  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches/reloads accommodations for the current resort.
   */
  const fetchAccommodations = useCallback(async () => {
    if (!resort) {
      setAccommodations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await AccommodationService.getAccommodations(resort.id);
      setAccommodations(data);
      setError(null);
    } catch (err: any) {
      Logger.error('Error fetching accommodations in Context:', err);
      setError(err.message || 'Error loading accommodations');
    } finally {
      setLoading(false);
    }
  }, [resort]);

  /**
   * Subscribes to real-time updates when resort is loaded and Firebase is active.
   */
  useEffect(() => {
    if (!resort) {
      setAccommodations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Logger.info(`Setting up accommodations subscription for resort ${resort.id}`);

    // In a real application, subscribing to real-time events keeps views responsive
    try {
      const unsubscribe = accommodationRepository.subscribe(resort.id, (list: Accommodation[]) => {
        // Sort inside callback to match expected ordered list
        const sorted = list.sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
          }
          return a.name.localeCompare(b.name);
        });
        setAccommodations(sorted);
        setError(null);
        setLoading(false);
      });

      return () => {
        Logger.info(`Unsubscribing from accommodations in resort ${resort.id}`);
        unsubscribe();
      };
    } catch (err: any) {
      Logger.error('Failed to subscribe, falling back to static fetch:', err);
      fetchAccommodations();
    }
  }, [resort, fetchAccommodations]);

  /**
   * Saves (creates or updates) an accommodation.
   */
  const saveAccommodation = useCallback(async (accommodation: Accommodation): Promise<Accommodation> => {
    if (!resort) {
      throw new Error('No active resort selected');
    }

    try {
      const saved = await AccommodationService.saveAccommodation(resort.id, accommodation, user?.uid);
      setError(null);
      // Let subscription handle setAccommodations, but trigger a static reload just in case
      await fetchAccommodations();
      return saved;
    } catch (err: any) {
      Logger.error(`Error saving accommodation ${accommodation.id || 'new'}:`, err);
      setError(err.message || 'Error saving accommodation');
      throw err;
    }
  }, [resort, user, fetchAccommodations]);

  /**
   * Deletes an accommodation.
   */
  const deleteAccommodation = useCallback(async (id: string | number): Promise<void> => {
    if (!resort) {
      throw new Error('No active resort selected');
    }

    try {
      await AccommodationService.deleteAccommodation(resort.id, id, user?.uid);
      setError(null);
      await fetchAccommodations();
    } catch (err: any) {
      Logger.error(`Error deleting accommodation ${id}:`, err);
      setError(err.message || 'Error deleting accommodation');
      throw err;
    }
  }, [resort, fetchAccommodations]);

  // Derived memoized states for sub-views
  const featuredAccommodations = useMemo(() => {
    return accommodations.filter(acc => acc.featured);
  }, [accommodations]);

  const visibleAccommodations = useMemo(() => {
    return accommodations.filter(acc => acc.visible);
  }, [accommodations]);

  const getById = useCallback((id: string | number) => {
    const searchId = isNaN(Number(id)) ? id : Number(id);
    return accommodations.find(acc => {
      const accId = isNaN(Number(acc.id)) ? acc.id : Number(acc.id);
      return accId === searchId;
    });
  }, [accommodations]);

  const value = useMemo(() => ({
    accommodations,
    loading,
    error,
    saveAccommodation,
    deleteAccommodation,
    reload: fetchAccommodations,
    featuredAccommodations,
    visibleAccommodations,
    getById
  }), [
    accommodations,
    loading,
    error,
    saveAccommodation,
    deleteAccommodation,
    fetchAccommodations,
    featuredAccommodations,
    visibleAccommodations,
    getById
  ]);

  return (
    <AccommodationContext.Provider value={value}>
      {children}
    </AccommodationContext.Provider>
  );
};

export const useAccommodationContext = () => {
  const context = useContext(AccommodationContext);
  if (context === undefined) {
    throw new Error('useAccommodationContext must be used within an AccommodationProvider');
  }
  return context;
};
