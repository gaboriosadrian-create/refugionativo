import { useState, useEffect, useCallback } from 'react';
import { AccommodationType } from '../../types';
import { AccommodationTypeService } from '../services/AccommodationTypeService';
import { useResort } from '../contexts/ResortContext';

export const useAccommodationTypes = () => {
  const { resort } = useResort();
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    if (!resort) {
      setTypes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await AccommodationTypeService.getAccommodationTypes(resort.id);
      setTypes(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tipos de alojamiento');
    } finally {
      setLoading(false);
    }
  }, [resort]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const saveType = async (type: AccommodationType) => {
    if (!resort) return;
    try {
      await AccommodationTypeService.saveAccommodationType(resort.id, type);
      await fetchTypes();
    } catch (err: any) {
      setError(err.message || 'Error al guardar tipo de alojamiento');
      throw err;
    }
  };

  const deleteType = async (id: string) => {
    if (!resort) return;
    try {
      await AccommodationTypeService.deleteAccommodationType(resort.id, id);
      await fetchTypes();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar tipo de alojamiento');
      throw err;
    }
  };

  return {
    types,
    loading,
    error,
    saveType,
    deleteType,
    reload: fetchTypes
  };
};

export default useAccommodationTypes;
