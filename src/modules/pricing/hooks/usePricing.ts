import { usePricingContext } from '../contexts/PricingContext';

export const usePricing = () => {
  return usePricingContext();
};

export default usePricing;
