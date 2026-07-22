import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { GuestProfile, GuestTimelineEvent, GuestPreferences, GuestTag, GuestSegment, GuestMetrics } from '../types/crm';
import { GuestService } from '../services/GuestService';
import { useResort } from '../../../shared/contexts/ResortContext';
import { Booking } from '../../../types';
import { Logger } from '../../../core/logger/Logger';

// Import our new CRM repositories and services
import { guestPreferencesRepository } from '../repositories/GuestPreferencesRepository';
import { guestTimelineRepository } from '../repositories/GuestTimelineRepository';
import { guestTagsRepository } from '../repositories/GuestTagsRepository';
import { guestSegmentsRepository } from '../repositories/GuestSegmentsRepository';
import { GuestAnalyticsService } from '../services/GuestAnalyticsService';

interface GuestContextType {
  guests: GuestProfile[];
  loading: boolean;
  error: string | null;
  
  // Selected Guest CRM State
  selectedGuestId: string | null;
  timeline: GuestTimelineEvent[];
  preferences: GuestPreferences | null;
  metrics: GuestMetrics | null;
  segments: string[];
  loadingCrm: boolean;

  // Configuration CRM data
  tags: GuestTag[];
  allSegments: GuestSegment[];

  // Actions
  setSelectedGuestId: (id: string | null) => void;
  createGuest: (guestData: Omit<GuestProfile, 'id' | 'resortId' | 'createdAt' | 'updatedAt' | 'fullName' | 'isActive' | 'createdBy' | 'updatedBy'> & { isActive?: boolean }) => Promise<GuestProfile>;
  updateGuest: (id: string, fields: Partial<GuestProfile>) => Promise<GuestProfile>;
  mergeGuests: (targetId: string, sourceId: string) => Promise<GuestProfile>;
  getGuestBookings: (guestId: string) => Promise<Booking[]>;
  searchGuests: (filters: Parameters<typeof GuestService.searchGuests>[1]) => Promise<GuestProfile[]>;
  
  // CRM-Specific Actions
  loadGuestCrmData: (guestId: string) => Promise<void>;
  updatePreferences: (guestId: string, fields: Partial<GuestPreferences>) => Promise<GuestPreferences>;
  addCustomTimelineEvent: (type: GuestTimelineEvent['type'], title: string, description: string) => Promise<GuestTimelineEvent>;
  createCustomTag: (name: string, color: string, description?: string) => Promise<GuestTag>;
  clearError: () => void;
}

export const GuestContext = createContext<GuestContextType | undefined>(undefined);

interface GuestProviderProps {
  children: ReactNode;
}

export const GuestProvider: React.FC<GuestProviderProps> = ({ children }) => {
  const { resort } = useResort();
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Guest CRM State
  const [selectedGuestId, setSelectedGuestIdState] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<GuestTimelineEvent[]>([]);
  const [preferences, setPreferences] = useState<GuestPreferences | null>(null);
  const [metrics, setMetrics] = useState<GuestMetrics | null>(null);
  const [segments, setSegments] = useState<string[]>([]);
  const [loadingCrm, setLoadingCrm] = useState(false);

  // Customizable configurations
  const [tags, setTags] = useState<GuestTag[]>([]);
  const [allSegments, setAllSegments] = useState<GuestSegment[]>([]);

  const clearError = () => setError(null);

  // Load configuration details (tags & segments) on resort load
  useEffect(() => {
    if (!resort) {
      setTags([]);
      setAllSegments([]);
      return;
    }

    guestTagsRepository.getAll(resort.id).then(setTags).catch(err => {
      Logger.error('Error cargando etiquetas configuradas:', err);
    });

    guestSegmentsRepository.getAll(resort.id).then(setAllSegments).catch(err => {
      Logger.error('Error cargando reglas de segmentación:', err);
    });
  }, [resort]);

  // Set up real-time listener for guests
  useEffect(() => {
    if (!resort) {
      setGuests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Logger.info(`Iniciando suscripción en tiempo real para huéspedes en Resort: ${resort.id}`);
    
    const unsubscribe = GuestService.subscribeGuests(resort.id, (updatedGuests) => {
      const sorted = [...updatedGuests].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setGuests(sorted);
      setLoading(false);
    });

    return () => {
      Logger.info(`Removiendo suscripción en tiempo real para huéspedes`);
      unsubscribe();
    };
  }, [resort]);

  // Trigger CRM load whenever guest is selected
  useEffect(() => {
    if (selectedGuestId) {
      loadGuestCrmData(selectedGuestId);
    } else {
      setTimeline([]);
      setPreferences(null);
      setMetrics(null);
      setSegments([]);
    }
  }, [selectedGuestId]);

  // Load CRM details for a guest
  const loadGuestCrmData = async (guestId: string) => {
    if (!resort) return;
    setLoadingCrm(true);
    try {
      // 1. Load preferences (repository returns default if none exist)
      const prefs = await guestPreferencesRepository.getByGuestId(resort.id, guestId);
      setPreferences(prefs);

      // 2. Load Timeline Events
      const evts = await guestTimelineRepository.getByGuestId(resort.id, guestId);
      setTimeline(evts);

      // 3. Recalculate and load Metrics
      const mets = await GuestAnalyticsService.calculateMetrics(resort.id, guestId);
      setMetrics(mets);

      // 4. Evaluate Segments
      const profile = guests.find(g => g.id === guestId);
      const segs = await GuestAnalyticsService.evaluateSegments(resort.id, guestId, mets, profile);
      setSegments(segs);
    } catch (err) {
      Logger.error(`Error al cargar datos CRM del huésped ${guestId}:`, err);
    } finally {
      setLoadingCrm(false);
    }
  };

  const setSelectedGuestId = (id: string | null) => {
    setSelectedGuestIdState(id);
  };

  const createGuest = async (
    guestData: Omit<GuestProfile, 'id' | 'resortId' | 'createdAt' | 'updatedAt' | 'fullName' | 'isActive' | 'createdBy' | 'updatedBy'> & { isActive?: boolean }
  ): Promise<GuestProfile> => {
    if (!resort) {
      throw new Error('No hay un resort/complejo activo seleccionado.');
    }
    setError(null);
    try {
      const created = await GuestService.createGuest(resort.id, guestData, 'Backoffice Staff');
      // Trigger reload configurations in case default tags were written
      guestTagsRepository.getAll(resort.id).then(setTags).catch(() => {});
      return created;
    } catch (err: any) {
      const msg = err.message || 'Error al crear huésped';
      setError(msg);
      throw err;
    }
  };

  const updateGuest = async (id: string, fields: Partial<GuestProfile>): Promise<GuestProfile> => {
    if (!resort) {
      throw new Error('No hay un resort/complejo activo seleccionado.');
    }
    setError(null);
    try {
      const updated = await GuestService.updateGuest(resort.id, id, fields, 'Backoffice Staff');
      // Recalculate metrics in case of profile changes affecting segments
      if (id === selectedGuestId) {
        await loadGuestCrmData(id);
      }
      return updated;
    } catch (err: any) {
      const msg = err.message || 'Error al actualizar huésped';
      setError(msg);
      throw err;
    }
  };

  const mergeGuests = async (targetId: string, sourceId: string): Promise<GuestProfile> => {
    if (!resort) {
      throw new Error('No hay un resort/complejo activo seleccionado.');
    }
    setError(null);
    try {
      const merged = await GuestService.mergeGuests(resort.id, targetId, sourceId, 'Backoffice Staff');
      if (selectedGuestId === targetId || selectedGuestId === sourceId) {
        setSelectedGuestId(targetId);
        await loadGuestCrmData(targetId);
      }
      return merged;
    } catch (err: any) {
      const msg = err.message || 'Error al fusionar huéspedes';
      setError(msg);
      throw err;
    }
  };

  const getGuestBookings = async (guestId: string): Promise<Booking[]> => {
    if (!resort) {
      throw new Error('No hay un resort/complejo activo seleccionado.');
    }
    try {
      return await GuestService.getGuestBookings(resort.id, guestId);
    } catch (err: any) {
      Logger.error(`Error al obtener historial de reservas para huésped ${guestId}:`, err);
      return [];
    }
  };

  const searchGuests = async (filters: Parameters<typeof GuestService.searchGuests>[1]): Promise<GuestProfile[]> => {
    if (!resort) return [];
    try {
      return await GuestService.searchGuests(resort.id, filters);
    } catch (err: any) {
      Logger.error('Error al realizar búsqueda de huéspedes:', err);
      return [];
    }
  };

  // CRM Actions
  const updatePreferences = async (guestId: string, fields: Partial<GuestPreferences>): Promise<GuestPreferences> => {
    if (!resort) throw new Error('No active resort found.');
    setError(null);
    try {
      const current = await guestPreferencesRepository.getByGuestId(resort.id, guestId);
      const updated: GuestPreferences = {
        ...current,
        ...fields,
        updatedAt: new Date().toISOString()
      };
      await guestPreferencesRepository.savePreferences(resort.id, updated);
      
      if (selectedGuestId === guestId) {
        setPreferences(updated);
        // Log event
        await guestTimelineRepository.addEvent(resort.id, {
          guestId,
          resortId: resort.id,
          type: 'change',
          title: 'Preferencias Actualizadas',
          description: `Se actualizaron las preferencias de estadía del huésped.`,
          createdBy: 'Backoffice Staff'
        });
        const evts = await guestTimelineRepository.getByGuestId(resort.id, guestId);
        setTimeline(evts);
      }
      return updated;
    } catch (err: any) {
      setError(err.message || 'Error updating preferences');
      throw err;
    }
  };

  const addCustomTimelineEvent = async (type: GuestTimelineEvent['type'], title: string, description: string): Promise<GuestTimelineEvent> => {
    if (!resort || !selectedGuestId) throw new Error('No active resort or selected guest.');
    setError(null);
    try {
      const newEvt = await guestTimelineRepository.addEvent(resort.id, {
        guestId: selectedGuestId,
        resortId: resort.id,
        type,
        title,
        description,
        createdBy: 'Backoffice Staff'
      });
      const evts = await guestTimelineRepository.getByGuestId(resort.id, selectedGuestId);
      setTimeline(evts);
      return newEvt;
    } catch (err: any) {
      setError(err.message || 'Error adding timeline event');
      throw err;
    }
  };

  const createCustomTag = async (name: string, color: string, description?: string): Promise<GuestTag> => {
    if (!resort) throw new Error('No active resort.');
    setError(null);
    try {
      const newTag: GuestTag = {
        id: `tag_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        resortId: resort.id,
        name,
        color,
        description,
        createdAt: new Date().toISOString()
      };
      await guestTagsRepository.save(resort.id, newTag);
      const updatedTags = await guestTagsRepository.getAll(resort.id);
      setTags(updatedTags);
      return newTag;
    } catch (err: any) {
      setError(err.message || 'Error creating tag');
      throw err;
    }
  };

  return (
    <GuestContext.Provider
      value={{
        guests,
        loading,
        error,
        selectedGuestId,
        timeline,
        preferences,
        metrics,
        segments,
        loadingCrm,
        tags,
        allSegments,
        setSelectedGuestId,
        createGuest,
        updateGuest,
        mergeGuests,
        getGuestBookings,
        searchGuests,
        loadGuestCrmData,
        updatePreferences,
        addCustomTimelineEvent,
        createCustomTag,
        clearError
      }}
    >
      {children}
    </GuestContext.Provider>
  );
};

export const useGuests = () => {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuests must be used within a GuestProvider');
  }
  return context;
};
export default useGuests;
