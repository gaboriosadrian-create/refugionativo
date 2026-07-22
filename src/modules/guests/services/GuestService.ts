import { Guest, GuestSnapshot } from '../types';
import { GuestProfile } from '../types/crm';
import { guestRepository } from '../repositories/GuestRepository';
import { GuestValidator } from '../validators/GuestValidator';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { Booking } from '../../../types';
import { Logger } from '../../../core/logger/Logger';

// Import our new CRM services
import { GuestProfileService } from './GuestProfileService';
import { GuestMergeService } from './GuestMergeService';
import { GuestSearchService, SmartSearchFilters } from './GuestSearchService';
import { GuestIntegrationService } from './GuestIntegrationService';

export class GuestService {
  /**
   * Lists all guest profiles for a given resort.
   */
  public static async getGuests(resortId: string): Promise<GuestProfile[]> {
    return GuestProfileService.getProfiles(resortId);
  }

  /**
   * Retrieves a specific guest profile by ID.
   */
  public static async getGuestById(resortId: string, id: string): Promise<GuestProfile | null> {
    return GuestProfileService.getProfileById(resortId, id);
  }

  /**
   * Creates a new guest profile with duplicate checks and validations.
   */
  public static async createGuest(
    resortId: string,
    guestData: Omit<GuestProfile, 'id' | 'resortId' | 'createdAt' | 'updatedAt' | 'fullName' | 'isActive' | 'createdBy' | 'updatedBy'> & { isActive?: boolean },
    userId?: string
  ): Promise<GuestProfile> {
    return GuestProfileService.createProfile(resortId, guestData, userId);
  }

  /**
   * Updates an existing guest profile.
   */
  public static async updateGuest(
    resortId: string,
    id: string,
    fields: Partial<GuestProfile>,
    userId?: string
  ): Promise<GuestProfile> {
    return GuestProfileService.updateProfile(resortId, id, fields, userId);
  }

  /**
   * Search and filter guests using flexible smart search.
   */
  public static async searchGuests(
    resortId: string,
    filters: SmartSearchFilters
  ): Promise<GuestProfile[]> {
    return GuestSearchService.search(resortId, filters);
  }

  /**
   * Conflict Resolution Strategy:
   * Finds or creates/updates a guest profile, ensuring no duplicates.
   */
  public static async findOrCreateOrUpdateGuest(
    resortId: string,
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      documentType?: string;
      documentNumber?: string;
      country?: string;
      province?: string;
      city?: string;
      address?: string;
    },
    userId?: string
  ): Promise<GuestProfile> {
    const email = data.email.trim();
    const docType = data.documentType?.trim() || 'DNI';
    const docNum = data.documentNumber?.trim() || '';

    let existingGuest: GuestProfile | null = null;

    // 1. Try to find by document
    if (docNum) {
      existingGuest = await guestRepository.findByDocument(resortId, docType, docNum);
    }

    // 2. Try to find by email
    if (!existingGuest && email) {
      existingGuest = await guestRepository.findByEmail(resortId, email);
    }

    const updater = userId || 'system';

    if (existingGuest) {
      // Merge and enrich empty fields
      const updatedFields: Partial<GuestProfile> = {};
      
      if (!existingGuest.phone && data.phone) updatedFields.phone = data.phone;
      if (!existingGuest.country && data.country) updatedFields.country = data.country;
      if (!existingGuest.province && data.province) updatedFields.province = data.province;
      if (!existingGuest.city && data.city) updatedFields.city = data.city;
      if (!existingGuest.address && data.address) updatedFields.address = data.address;
      if (docNum && !existingGuest.documentNumber) {
        updatedFields.documentType = docType;
        updatedFields.documentNumber = docNum;
      }

      if (Object.keys(updatedFields).length > 0) {
        return GuestProfileService.updateProfile(resortId, existingGuest.id, updatedFields, updater);
      }

      return existingGuest;
    }

    // 3. Not found: create a brand new guest profile
    const newGuestData: Omit<GuestProfile, 'id' | 'resortId' | 'createdAt' | 'updatedAt' | 'fullName' | 'isActive' | 'createdBy' | 'updatedBy'> & { isActive?: boolean } = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: email,
      phone: data.phone,
      country: data.country || 'Argentina',
      nationality: data.country || 'Argentina',
      province: data.province || '',
      city: data.city || '',
      language: 'es',
      documentType: docType,
      documentNumber: docNum || `TEMP_${Date.now()}`,
      birthDate: '',
      address: data.address || '',
      postalCode: '',
      notes: '',
      tags: [],
      isActive: true
    };

    return GuestProfileService.createProfile(resortId, newGuestData, updater);
  }

  /**
   * Merges a duplicate guest record into a main target record.
   */
  public static async mergeGuests(
    resortId: string,
    targetGuestId: string,
    sourceGuestId: string,
    userId?: string
  ): Promise<GuestProfile> {
    return GuestMergeService.mergeProfiles(resortId, targetGuestId, sourceGuestId, userId);
  }

  /**
   * Retrieves the booking history for a specific guest.
   */
  public static async getGuestBookings(resortId: string, guestId: string): Promise<Booking[]> {
    const all = await bookingRepository.getAll(resortId);
    return all.filter(b => b.guestId === guestId);
  }

  /**
   * Subscribes to real-time changes in guests.
   */
  public static subscribeGuests(resortId: string, callback: (guests: GuestProfile[]) => void): () => void {
    return guestRepository.subscribe(resortId, callback);
  }

  /**
   * Mapper to convert Guest model to a GuestSnapshot.
   */
  public static toSnapshot(guest: GuestProfile): GuestSnapshot {
    return {
      firstName: guest.firstName,
      lastName: guest.lastName,
      fullName: guest.fullName,
      email: guest.email,
      phone: guest.phone,
      country: guest.country,
      province: guest.province,
      city: guest.city,
      language: guest.language,
      documentType: guest.documentType,
      documentNumber: guest.documentNumber,
      birthDate: guest.birthDate,
      address: guest.address,
      postalCode: guest.postalCode,
      notes: guest.notes,
      tags: guest.tags,
      isActive: guest.isActive
    };
  }
}

// Automatically install global CRM event hooks on startup
try {
  GuestIntegrationService.installHooks();
} catch (e) {
  Logger.error('[GuestService] Failed to install dynamic hooks on startup:', e);
}

export default GuestService;
