import { 
  AccommodationCapacity, 
  Pricing, 
  AccommodationPolicy, 
  AccommodationTypeField 
} from '../types';
import { AccommodationValidationError } from '../errors';

/**
 * Validates whether a slug is correctly formatted (URL-safe, lowercase, alphanumeric, hyphenated).
 */
export function validateSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Validates the Capacity structure of an accommodation.
 */
export function validateCapacity(capacity: AccommodationCapacity): void {
  const errors: Record<string, string> = {};

  if (!capacity) {
    throw new AccommodationValidationError('Capacity data is missing');
  }

  if (capacity.adults < 0) {
    errors.adults = 'Adults count cannot be negative';
  }
  if (capacity.children < 0) {
    errors.children = 'Children count cannot be negative';
  }
  if (capacity.babies < 0) {
    errors.babies = 'Babies count cannot be negative';
  }
  if (capacity.pets < 0) {
    errors.pets = 'Pets count cannot be negative';
  }

  const totalGuests = (capacity.adults || 0) + (capacity.children || 0) + (capacity.babies || 0);
  if (totalGuests === 0) {
    errors.maxGuests = 'Accommodation must accommodate at least 1 guest';
  }

  if (capacity.maxGuests < totalGuests) {
    errors.maxGuests = `Max guests (${capacity.maxGuests}) must be at least equal to the sum of adults, children, and babies (${totalGuests})`;
  }

  if (Object.keys(errors).length > 0) {
    throw new AccommodationValidationError('Capacity validation failed', errors);
  }
}

/**
 * Validates the Pricing structure of an accommodation.
 */
export function validatePricing(pricing: Pricing): void {
  const errors: Record<string, string> = {};

  if (!pricing) {
    throw new AccommodationValidationError('Pricing data is missing');
  }

  if (pricing.basePrice === undefined || pricing.basePrice === null || typeof pricing.basePrice !== 'number') {
    errors.basePrice = 'Base price must be a valid number';
  } else if (pricing.basePrice < 0) {
    errors.basePrice = 'Base price cannot be negative';
  }

  if (!pricing.currency || typeof pricing.currency !== 'string' || pricing.currency.length !== 3) {
    errors.currency = 'Currency must be a valid 3-letter ISO code (e.g. ARS, USD)';
  }

  if (pricing.weekendPrice !== undefined && pricing.weekendPrice !== null) {
    if (typeof pricing.weekendPrice !== 'number' || pricing.weekendPrice < 0) {
      errors.weekendPrice = 'Weekend price must be a positive number';
    }
  }

  if (pricing.minimumStay !== undefined && pricing.minimumStay !== null) {
    if (typeof pricing.minimumStay !== 'number' || pricing.minimumStay < 1) {
      errors.minimumStay = 'Minimum stay must be at least 1 night';
    }
  }

  if (pricing.futureSeasonPricing) {
    pricing.futureSeasonPricing.forEach((season, index) => {
      if (!season.seasonName || typeof season.seasonName !== 'string') {
        errors[`season_${index}_name`] = 'Season name is required';
      }
      if (season.priceMultiplier === undefined || typeof season.priceMultiplier !== 'number' || season.priceMultiplier <= 0) {
        errors[`season_${index}_multiplier`] = 'Season price multiplier must be a positive number';
      }
      if (season.priceOverride !== undefined && (typeof season.priceOverride !== 'number' || season.priceOverride < 0)) {
        errors[`season_${index}_override`] = 'Season price override must be a positive number';
      }
    });
  }

  if (Object.keys(errors).length > 0) {
    throw new AccommodationValidationError('Pricing validation failed', errors);
  }
}

/**
 * Validates the Policies structure.
 */
export function validatePolicies(policies: AccommodationPolicy): void {
  const errors: Record<string, string> = {};

  if (!policies) {
    throw new AccommodationValidationError('Policies data is missing');
  }

  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!policies.checkIn || !timeRegex.test(policies.checkIn)) {
    errors.checkIn = 'Check-in time must be in HH:MM format';
  }
  if (!policies.checkOut || !timeRegex.test(policies.checkOut)) {
    errors.checkOut = 'Check-out time must be in HH:MM format';
  }

  if (typeof policies.smoking !== 'boolean') {
    errors.smoking = 'Smoking policy must be a boolean';
  }
  if (typeof policies.pets !== 'boolean') {
    errors.pets = 'Pets policy must be a boolean';
  }
  if (typeof policies.children !== 'boolean') {
    errors.children = 'Children policy must be a boolean';
  }

  if (Object.keys(errors).length > 0) {
    throw new AccommodationValidationError('Policies validation failed', errors);
  }
}

/**
 * Validates dynamic custom fields against their registered schema.
 */
export function validateCustomFields(
  customFields: Record<string, string | number | boolean | null>,
  fieldsDef?: AccommodationTypeField[]
): void {
  if (!customFields) return;
  if (!fieldsDef || fieldsDef.length === 0) return;

  const errors: Record<string, string> = {};

  fieldsDef.forEach((field) => {
    const val = customFields[field.key];

    if (field.required && (val === undefined || val === null || val === '')) {
      errors[field.key] = `Field "${field.label}" is required`;
      return;
    }

    if (val !== undefined && val !== null && val !== '') {
      const actualType = typeof val;
      if (field.type === 'number' && actualType !== 'number') {
        errors[field.key] = `Field "${field.label}" must be a number`;
      } else if (field.type === 'boolean' && actualType !== 'boolean') {
        errors[field.key] = `Field "${field.label}" must be a boolean`;
      } else if (field.type === 'string' && actualType !== 'string') {
        errors[field.key] = `Field "${field.label}" must be a string`;
      }
    }
  });

  if (Object.keys(errors).length > 0) {
    throw new AccommodationValidationError('Custom fields validation failed', errors);
  }
}
