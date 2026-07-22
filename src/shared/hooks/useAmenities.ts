import { useState, useEffect, useCallback } from 'react';
import { Amenity } from '../../types';
import { AmenityService } from '../services/AmenityService';
import { useResort } from '../contexts/ResortContext';

export const useAmenities = () => {
  const { resort } = useResort();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAmenities = useCallback(async () => {
    if (!resort) {
      setAmenities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await AmenityService.getAmenities(resort.id);
      setAmenities(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar amenities');
    } finally {
      setLoading(false);
    }
  }, [resort]);

  useEffect(() => {
    fetchAmenities();
  }, [fetchAmenities]);

  const saveAmenity = async (amenity: Amenity) => {
    if (!resort) return;
    try {
      await AmenityService.saveAmenity(resort.id, amenity);
      await fetchAmenities();
    } catch (err: any) {
      setError(err.message || 'Error al guardar amenity');
      throw err;
    }
  };

  const deleteAmenity = async (id: string) => {
    if (!resort) return;
    try {
      await AmenityService.deleteAmenity(resort.id, id);
      await fetchAmenities();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar amenity');
      throw err;
    }
  };

  return {
    amenities,
    loading,
    error,
    saveAmenity,
    deleteAmenity,
    reload: fetchAmenities
  };
};

export default useAmenities;
