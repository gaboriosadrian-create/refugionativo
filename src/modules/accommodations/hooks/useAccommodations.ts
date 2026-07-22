import { useAccommodationContext } from '../contexts/AccommodationContext';

/**
 * A highly scalable, reusable hook to consume all accommodation domain actions, states, loading indicators, and errors.
 */
export const useAccommodations = () => {
  return useAccommodationContext();
};

export default useAccommodations;
