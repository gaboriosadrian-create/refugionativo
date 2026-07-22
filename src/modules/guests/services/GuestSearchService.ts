import { guestRepository } from '../repositories/GuestRepository';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { GuestProfile } from '../types/crm';
import { Logger } from '../../../core/logger/Logger';

export interface SmartSearchFilters {
  query?: string;
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  bookingCode?: string;
  country?: string;
  tag?: string;
  isActive?: boolean;
}

export class GuestSearchService {
  public static async search(resortId: string, filters: SmartSearchFilters): Promise<GuestProfile[]> {
    Logger.info(`[GuestSearchService] Invocando búsqueda inteligente con filtros:`, filters);

    let list = await guestRepository.list(resortId);

    // 1. Filter by booking code if provided
    let matchingGuestIdsFromBooking: string[] = [];
    if (filters.bookingCode && filters.bookingCode.trim()) {
      const bCode = filters.bookingCode.trim().toLowerCase();
      const bookings = await bookingRepository.getAll(resortId);
      const matched = bookings.filter(b => 
        String(b.id).toLowerCase().includes(bCode) || 
        (b as any).reservationCode?.toLowerCase().includes(bCode)
      );
      matchingGuestIdsFromBooking = matched.map(b => b.guestId);
    }

    // 2. Global intelligent text search query (can match name, document, email, phone, country, booking code, or tag)
    if (filters.query && filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      
      // Let's check bookings for booking code matches as part of the global search
      const bookings = await bookingRepository.getAll(resortId);
      const bMatched = bookings.filter(b => 
        String(b.id).toLowerCase().includes(q) || 
        (b as any).reservationCode?.toLowerCase().includes(q)
      );
      const bGuestIds = bMatched.map(b => b.guestId);

      list = list.filter(g => {
        const matchesName = g.fullName.toLowerCase().includes(q) || 
                            g.firstName.toLowerCase().includes(q) || 
                            g.lastName.toLowerCase().includes(q);
        const matchesDoc = g.documentNumber.toLowerCase().includes(q);
        const matchesEmail = g.email.toLowerCase().includes(q);
        const matchesPhone = g.phone.toLowerCase().includes(q);
        const matchesCountry = g.country.toLowerCase().includes(q);
        const matchesTags = g.tags && g.tags.some(t => t.toLowerCase().includes(q));
        const matchesBooking = bGuestIds.includes(g.id);

        return matchesName || matchesDoc || matchesEmail || matchesPhone || matchesCountry || matchesTags || matchesBooking;
      });
    }

    // 3. Fine-grained filters
    if (filters.firstName && filters.firstName.trim()) {
      const val = filters.firstName.trim().toLowerCase();
      list = list.filter(g => g.firstName.toLowerCase().includes(val));
    }
    if (filters.lastName && filters.lastName.trim()) {
      const val = filters.lastName.trim().toLowerCase();
      list = list.filter(g => g.lastName.toLowerCase().includes(val));
    }
    if (filters.documentNumber && filters.documentNumber.trim()) {
      const val = filters.documentNumber.trim().toLowerCase();
      list = list.filter(g => g.documentNumber.toLowerCase().includes(val));
    }
    if (filters.email && filters.email.trim()) {
      const val = filters.email.trim().toLowerCase();
      list = list.filter(g => g.email.toLowerCase().includes(val));
    }
    if (filters.phone && filters.phone.trim()) {
      const val = filters.phone.trim().toLowerCase();
      list = list.filter(g => g.phone.includes(val));
    }
    if (filters.country && filters.country.trim()) {
      const val = filters.country.trim().toLowerCase();
      list = list.filter(g => g.country.toLowerCase().includes(val));
    }
    if (filters.tag && filters.tag.trim()) {
      const val = filters.tag.trim().toLowerCase();
      list = list.filter(g => g.tags && g.tags.some(t => t.toLowerCase() === val));
    }
    if (filters.isActive !== undefined) {
      list = list.filter(g => g.isActive === filters.isActive);
    }
    if (filters.bookingCode && filters.bookingCode.trim()) {
      list = list.filter(g => matchingGuestIdsFromBooking.includes(g.id));
    }

    return list;
  }
}

export default GuestSearchService;
