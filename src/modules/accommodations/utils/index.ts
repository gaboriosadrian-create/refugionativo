import { AccommodationCapacity } from '../types';

/**
 * Calculates the final price of an accommodation after applying a percentage discount.
 */
export function calculateDiscountedPrice(basePrice: number, discountPercent: number): number {
  if (basePrice < 0) return 0;
  if (discountPercent < 0) return basePrice;
  if (discountPercent >= 100) return 0;
  
  const discountFactor = (100 - discountPercent) / 100;
  return Math.round(basePrice * discountFactor);
}

/**
 * Formats a given monetary amount into a clean, localized string based on the ISO currency.
 */
export function formatCurrency(amount: number, currency: string, locale = 'es-AR'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (err) {
    // Basic fallback if currency code is not supported by standard formatting engine
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/**
 * Generates a clean human-readable summary of the accommodation's capacity.
 */
export function getOccupancySummary(capacity: AccommodationCapacity): string {
  if (!capacity) return '';
  const parts: string[] = [];
  
  if (capacity.adults > 0) {
    parts.push(`${capacity.adults} ${capacity.adults === 1 ? 'adulto' : 'adultos'}`);
  }
  if (capacity.children > 0) {
    parts.push(`${capacity.children} ${capacity.children === 1 ? 'niño' : 'niños'}`);
  }
  if (capacity.babies > 0) {
    parts.push(`${capacity.babies} ${capacity.babies === 1 ? 'bebé' : 'bebés'}`);
  }
  if (capacity.pets > 0) {
    parts.push(`${capacity.pets} ${capacity.pets === 1 ? 'mascota' : 'mascotas'}`);
  }
  
  return parts.join(', ');
}
