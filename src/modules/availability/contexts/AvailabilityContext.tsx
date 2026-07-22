import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Availability, AvailabilityStatus, AvailabilityBlock, AvailabilityRule, ValidationResult } from '../types';
import { AvailabilityService } from '../services/AvailabilityService';
import { availabilityRepository } from '../repositories/AvailabilityRepository';
import { availabilityBlockRepository } from '../repositories/AvailabilityBlockRepository';
import { availabilityRuleRepository } from '../repositories/AvailabilityRuleRepository';
import { useResort } from '../../../shared/contexts/ResortContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { Logger } from '../../../core/logger/Logger';

interface AvailabilityContextType {
  availabilities: Availability[];
  blocks: AvailabilityBlock[];
  rules: AvailabilityRule[];
  loading: boolean;
  error: string | null;
  applyBlock: (
    accommodationId: string | number,
    startDate: string,
    endDate: string,
    status: AvailabilityStatus,
    reason: string,
    notes?: string
  ) => Promise<void>;
  releaseBlock: (
    accommodationId: string | number,
    startDate: string,
    endDate: string
  ) => Promise<void>;
  
  // Advanced Block CRUD
  createBlock: (
    blockData: Omit<AvailabilityBlock, 'id' | 'resortId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;

  // Advanced Rule CRUD
  createRule: (
    ruleData: Omit<AvailabilityRule, 'id' | 'resortId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;

  // Availability Engine API Wrapper
  validarRangoDeFechas: (
    accommodationId: string | number,
    checkIn: string,
    checkOut: string,
    guests?: number
  ) => Promise<ValidationResult>;
  obtenerDisponibilidad: (
    accommodationId: string | number,
    startDate: string,
    endDate: string
  ) => Promise<Availability[]>;
  obtenerEstadoDelDía: (
    accommodationId: string | number,
    date: string
  ) => Promise<AvailabilityStatus>;

  getAccommodationAvailability: (
    accommodationId: string | number
  ) => Availability[];
  isRangeAvailable: (
    accommodationId: string | number,
    startDate: string,
    endDate: string
  ) => Promise<boolean>;
  getRangeAvailability: (
    accommodationId: string | number,
    startDate: string,
    endDate: string
  ) => Promise<Availability[]>;
  reload: () => Promise<void>;
}

const AvailabilityContext = createContext<AvailabilityContextType | undefined>(undefined);

export const AvailabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resort } = useResort();
  const { user } = useAuth();

  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Static reload of all resort data
   */
  const reload = useCallback(async () => {
    if (!resort) {
      setAvailabilities([]);
      setBlocks([]);
      setRules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [availData, blocksData, rulesData] = await Promise.all([
        availabilityRepository.getAll(resort.id),
        availabilityBlockRepository.getAll(resort.id),
        availabilityRuleRepository.getAll(resort.id)
      ]);
      setAvailabilities(availData);
      setBlocks(blocksData);
      setRules(rulesData);
      setError(null);
    } catch (err: any) {
      Logger.error('Error reloading availability context:', err);
      setError(err.message || 'Error al cargar la disponibilidad');
    } finally {
      setLoading(false);
    }
  }, [resort]);

  /**
   * Firestore real-time updates subscriptions
   */
  useEffect(() => {
    if (!resort) {
      setAvailabilities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Logger.info(`Setting up availability subscriptions for resort ${resort.id}`);

    try {
      const unsubAvail = availabilityRepository.subscribe(resort.id, (list: Availability[]) => {
        setAvailabilities(list);
        setError(null);
        setLoading(false);
      });

      const unsubBlocks = availabilityBlockRepository.subscribe(resort.id, (list: AvailabilityBlock[]) => {
        setBlocks(list);
      });

      const unsubRules = availabilityRuleRepository.subscribe(resort.id, (list: AvailabilityRule[]) => {
        setRules(list);
      });

      return () => {
        Logger.info(`Unsubscribing from availability collections in resort ${resort.id}`);
        unsubAvail();
        unsubBlocks();
        unsubRules();
      };
    } catch (err: any) {
      Logger.error('Failed to subscribe, falling back to static fetch:', err);
      reload();
    }
  }, [resort, reload]);

  /**
   * Applies block/maintenance (legacy single daily entries)
   */
  const applyBlock = useCallback(
    async (
      accommodationId: string | number,
      startDate: string,
      endDate: string,
      status: AvailabilityStatus,
      reason: string,
      notes?: string
    ) => {
      if (!resort) {
        throw new Error('No se ha seleccionado ningún resort activo.');
      }

      setLoading(true);
      try {
        await AvailabilityService.applyBlock(
          resort.id,
          accommodationId,
          startDate,
          endDate,
          status,
          reason,
          notes,
          user?.uid
        );
        setError(null);
        await reload();
      } catch (err: any) {
        Logger.error('Error applying block in Context:', err);
        setError(err.message || 'Error al aplicar el bloqueo');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [resort, user, reload]
  );

  /**
   * Releases block/maintenance (legacy single daily entries)
   */
  const releaseBlock = useCallback(
    async (
      accommodationId: string | number,
      startDate: string,
      endDate: string
    ) => {
      if (!resort) {
        throw new Error('No se ha seleccionado ningún resort activo.');
      }

      setLoading(true);
      try {
        await AvailabilityService.releaseBlock(resort.id, accommodationId, startDate, endDate);
        setError(null);
        await reload();
      } catch (err: any) {
        Logger.error('Error releasing block in Context:', err);
        setError(err.message || 'Error al liberar el bloqueo');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [resort, reload]
  );

  /**
   * Advanced Block: Create
   */
  const createBlock = useCallback(
    async (blockData: Omit<AvailabilityBlock, 'id' | 'resortId' | 'createdAt' | 'updatedAt'>) => {
      if (!resort) throw new Error('No active resort selected.');

      setLoading(true);
      try {
        const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const now = new Date().toISOString();
        const block: AvailabilityBlock = {
          ...blockData,
          id,
          resortId: resort.id,
          createdAt: now,
          updatedAt: now,
          createdBy: user?.uid,
          updatedBy: user?.uid
        };

        await availabilityBlockRepository.save(resort.id, block);
        setError(null);
        await reload();
      } catch (err: any) {
        Logger.error('Error creating advanced block:', err);
        setError(err.message || 'Error al crear el bloqueo');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [resort, user, reload]
  );

  /**
   * Advanced Block: Delete
   */
  const deleteBlock = useCallback(
    async (id: string) => {
      if (!resort) throw new Error('No active resort selected.');

      setLoading(true);
      try {
        await availabilityBlockRepository.delete(resort.id, id);
        setError(null);
        await reload();
      } catch (err: any) {
        Logger.error('Error deleting advanced block:', err);
        setError(err.message || 'Error al eliminar el bloqueo');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [resort, reload]
  );

  /**
   * Advanced Rule: Create
   */
  const createRule = useCallback(
    async (ruleData: Omit<AvailabilityRule, 'id' | 'resortId' | 'createdAt' | 'updatedAt'>) => {
      if (!resort) throw new Error('No active resort selected.');

      setLoading(true);
      try {
        const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const now = new Date().toISOString();
        const rule: AvailabilityRule = {
          ...ruleData,
          id,
          resortId: resort.id,
          createdAt: now,
          updatedAt: now,
          createdBy: user?.uid,
          updatedBy: user?.uid
        };

        await availabilityRuleRepository.save(resort.id, rule);
        setError(null);
        await reload();
      } catch (err: any) {
        Logger.error('Error creating advanced rule:', err);
        setError(err.message || 'Error al crear la regla');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [resort, user, reload]
  );

  /**
   * Advanced Rule: Delete
   */
  const deleteRule = useCallback(
    async (id: string) => {
      if (!resort) throw new Error('No active resort selected.');

      setLoading(true);
      try {
        await availabilityRuleRepository.delete(resort.id, id);
        setError(null);
        await reload();
      } catch (err: any) {
        Logger.error('Error deleting advanced rule:', err);
        setError(err.message || 'Error al eliminar la regla');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [resort, reload]
  );

  /**
   * Availability Engine wrappers
   */
  const validarRangoDeFechas = useCallback(
    async (accommodationId: string | number, checkIn: string, checkOut: string, guests?: number) => {
      if (!resort) return { isValid: false, message: 'Resort no seleccionado.' };
      return await AvailabilityService.validarRangoDeFechas(resort.id, accommodationId, checkIn, checkOut, guests);
    },
    [resort]
  );

  const obtenerDisponibilidad = useCallback(
    async (accommodationId: string | number, startDate: string, endDate: string) => {
      if (!resort) return [];
      return await AvailabilityService.obtenerDisponibilidad(resort.id, accommodationId, startDate, endDate);
    },
    [resort]
  );

  const obtenerEstadoDelDía = useCallback(
    async (accommodationId: string | number, date: string) => {
      if (!resort) return AvailabilityStatus.AVAILABLE;
      return await AvailabilityService.obtenerEstadoDelDía(resort.id, accommodationId, date);
    },
    [resort]
  );

  /**
   * Legacy filtering for local overlays
   */
  const getAccommodationAvailability = useCallback(
    (accommodationId: string | number) => {
      return availabilities.filter(a => String(a.accommodationId) === String(accommodationId));
    },
    [availabilities]
  );

  const isRangeAvailable = useCallback(
    async (accommodationId: string | number, startDate: string, endDate: string) => {
      if (!resort) return false;
      return await AvailabilityService.isRangeAvailable(resort.id, accommodationId, startDate, endDate);
    },
    [resort]
  );

  const getRangeAvailability = useCallback(
    async (accommodationId: string | number, startDate: string, endDate: string) => {
      if (!resort) return [];
      return await AvailabilityService.getRangeAvailability(resort.id, accommodationId, startDate, endDate);
    },
    [resort]
  );

  const value = useMemo(
    () => ({
      availabilities,
      blocks,
      rules,
      loading,
      error,
      applyBlock,
      releaseBlock,
      createBlock,
      deleteBlock,
      createRule,
      deleteRule,
      validarRangoDeFechas,
      obtenerDisponibilidad,
      obtenerEstadoDelDía,
      getAccommodationAvailability,
      isRangeAvailable,
      getRangeAvailability,
      reload
    }),
    [
      availabilities,
      blocks,
      rules,
      loading,
      error,
      applyBlock,
      releaseBlock,
      createBlock,
      deleteBlock,
      createRule,
      deleteRule,
      validarRangoDeFechas,
      obtenerDisponibilidad,
      obtenerEstadoDelDía,
      getAccommodationAvailability,
      isRangeAvailable,
      getRangeAvailability,
      reload
    ]
  );

  return <AvailabilityContext.Provider value={value}>{children}</AvailabilityContext.Provider>;
};

export const useAvailabilityContext = () => {
  const context = useContext(AvailabilityContext);
  if (context === undefined) {
    throw new Error('useAvailabilityContext must be used within an AvailabilityProvider');
  }
  return context;
};
