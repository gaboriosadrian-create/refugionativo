import { AccommodationService } from '../../accommodations/services/AccommodationService';
import { BookingService } from '../../bookings/services/BookingService';
import { PricingService } from '../../pricing/services/PricingService';
import { SearchCriteria, SearchResultItem } from '../types';
import { validateSearchCriteria } from '../validators/searchValidator';

export class SearchService {
  /**
   * Main public availability search engine.
   * Leverages core Services for business rules, ensuring compliance with StayFlow architecture.
   */
  public static async search(
    resortId: string,
    criteria: SearchCriteria
  ): Promise<{ results: SearchResultItem[]; errors: string[] }> {
    // 1. Validate inputs
    const validationErrors = validateSearchCriteria(criteria);
    if (validationErrors.length > 0) {
      return {
        results: [],
        errors: validationErrors.map(e => e.message)
      };
    }

    try {
      // 2. Fetch all visible/active accommodations
      const visibleAccommodations = await AccommodationService.getVisibleAccommodations(resortId);

      // 3. Filter and quote each accommodation
      const results: SearchResultItem[] = [];

      for (const acc of visibleAccommodations) {
        // A. Filter by accommodation type if specified
        if (criteria.accommodationTypeId && acc.typeId !== criteria.accommodationTypeId) {
          continue;
        }

        // B. Filter by capacity rules
        const totalGuests = criteria.adults + criteria.children;
        const maxCapacity = acc.capacity?.maxGuests || 1;
        
        if (totalGuests > maxCapacity) {
          continue; // Exceeds absolute maximum capacity
        }

        // Check detailed capacity constraints if defined
        if (acc.capacity) {
          if (criteria.adults > (acc.capacity.adults || maxCapacity)) continue;
          if (criteria.children > (acc.capacity.children || 0)) continue;
          if (criteria.babies > (acc.capacity.babies || 0)) continue;
          if (criteria.pets > 0 && !acc.policies?.pets) continue; // Pets not allowed
          if (criteria.pets > (acc.capacity.pets || 0)) continue; // Too many pets
        }

        // C. Check availability conflicts using BookingService.hasConflict
        // This is the source of truth for both reservations overlaps and manual blocks
        const hasConflict = await BookingService.hasConflict(
          resortId,
          Number(acc.id),
          criteria.checkIn,
          criteria.checkOut
        );

        if (hasConflict) {
          continue; // Not available
        }

        // D. Calculate pricing quote using PricingService
        const basePrice = acc.pricing?.basePrice || 0;
        const quote = await PricingService.prepareBookingQuote(
          resortId,
          Number(acc.id),
          criteria.checkIn,
          criteria.checkOut,
          totalGuests,
          criteria.pets,
          basePrice
        );

        results.push({
          accommodation: acc,
          pricingResult: quote.pricingResult,
          minimumStayValid: quote.minimumStayValid,
          minNightsRequired: quote.minNightsRequired,
          ruleMessage: quote.ruleMessage
        });
      }

      // Sort by featured first, then by price ascending
      results.sort((a, b) => {
        if (a.accommodation.featured && !b.accommodation.featured) return -1;
        if (!a.accommodation.featured && b.accommodation.featured) return 1;
        return a.pricingResult.totalPrice - b.pricingResult.totalPrice;
      });

      return {
        results,
        errors: []
      };
    } catch (err: any) {
      return {
        results: [],
        errors: [err.message || 'Ocurrió un error inesperado al buscar disponibilidad.']
      };
    }
  }
}

export default SearchService;
