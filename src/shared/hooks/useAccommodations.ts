import { useAccommodationContext } from '../../modules/accommodations/contexts/AccommodationContext';
import { toLegacy, toDomain } from '../../modules/accommodations/mappers';
import { Accommodation } from '../../types';

export const useAccommodations = () => {
  const { 
    accommodations: domainAccommodations, 
    loading, 
    error, 
    saveAccommodation: saveDomainAccommodation, 
    deleteAccommodation: deleteDomainAccommodation, 
    reload 
  } = useAccommodationContext();

  const legacyAccommodations = domainAccommodations.map(toLegacy) as Accommodation[];

  const saveAccommodation = async (accommodation: Accommodation) => {
    const domainAcc = toDomain(accommodation);
    await saveDomainAccommodation(domainAcc);
  };

  const deleteAccommodation = async (id: number | string) => {
    await deleteDomainAccommodation(id);
  };

  return {
    accommodations: legacyAccommodations,
    loading,
    error,
    saveAccommodation,
    deleteAccommodation,
    reload
  };
};
export default useAccommodations;
