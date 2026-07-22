import { useAccommodationConfigContext } from '../contexts/AccommodationConfigContext';

export const useAccommodationConfig = () => {
  return useAccommodationConfigContext();
};

export default useAccommodationConfig;
