import { useAvailabilityContext } from '../contexts/AvailabilityContext';

/**
 * A highly reusable hook to access the StayFlow Availability Engine state and actions.
 */
export const useAvailability = () => {
  return useAvailabilityContext();
};

export default useAvailability;
