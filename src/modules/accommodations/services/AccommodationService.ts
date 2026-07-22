import { accommodationRepository } from '../repositories/AccommodationRepository';
import { Accommodation } from '../types';
import { 
  validateSlug, 
  validateCapacity, 
  validatePricing, 
  validatePolicies, 
  validateCustomFields 
} from '../validators';
import { AccommodationValidationError, AccommodationNotFoundError } from '../errors';
import { Logger } from '../../../core/logger/Logger';

export class AccommodationService {
  /**
   * Generates a URL-safe, lowercase slug from a name string.
   */
  static generateSlug(name: string): string {
    if (!name || typeof name !== 'string') return '';
    return name
      .toLowerCase()
      .normalize('NFD') // decompose accent characters
      .replace(/[\u0300-\u036f]/g, '') // remove accent diacritics
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .trim()
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // collapse multiple hyphens
  }

  /**
   * Runs all validation rules on the accommodation domain model.
   */
  static validate(accommodation: Accommodation): void {
    const errors: Record<string, string> = {};

    if (!accommodation.name || typeof accommodation.name !== 'string' || accommodation.name.trim().length < 3) {
      errors.name = 'Name is required and must be at least 3 characters long';
    }

    if (!accommodation.typeId) {
      errors.typeId = 'Accommodation Type ID is required';
    }

    if (Object.keys(errors).length > 0) {
      throw new AccommodationValidationError('Basic accommodation information is invalid', errors);
    }

    // Run specialized structured validators
    validateCapacity(accommodation.capacity);
    validatePricing(accommodation.pricing);
    validatePolicies(accommodation.policies);
    validateCustomFields(accommodation.customFields);

    // If slug is provided explicitly, validate it
    if (accommodation.slug && !validateSlug(accommodation.slug)) {
      throw new AccommodationValidationError('Slug format is invalid', { slug: 'Slug must contain only alphanumeric characters and hyphens' });
    }
  }

  /**
   * Retrieves all accommodations for a resort, ordered by sortOrder (ascending) and name (alphabetical).
   */
  static async getAccommodations(resortId: string): Promise<Accommodation[]> {
    Logger.info(`Retrieving accommodations for resort: ${resortId}`);
    const list = await accommodationRepository.findAll(resortId);
    
    // Sort logic
    return list.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Retrieves all visible accommodations for a resort.
   */
  static async getVisibleAccommodations(resortId: string): Promise<Accommodation[]> {
    Logger.info(`Retrieving visible accommodations for resort: ${resortId}`);
    const list = await accommodationRepository.findVisible(resortId);
    return list.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Retrieves featured accommodations for a resort.
   */
  static async getFeaturedAccommodations(resortId: string): Promise<Accommodation[]> {
    Logger.info(`Retrieving featured accommodations for resort: ${resortId}`);
    return accommodationRepository.findFeatured(resortId);
  }

  /**
   * Retrieves a single accommodation by its ID.
   */
  static async getAccommodation(resortId: string, id: string | number): Promise<Accommodation | null> {
    Logger.info(`Retrieving accommodation by ID: ${id} (Resort: ${resortId})`);
    return accommodationRepository.findById(resortId, id);
  }

  /**
   * Retrieves a single accommodation by its slug.
   */
  static async getAccommodationBySlug(resortId: string, slug: string): Promise<Accommodation | null> {
    Logger.info(`Retrieving accommodation by slug: ${slug} (Resort: ${resortId})`);
    return accommodationRepository.findBySlug(resortId, slug);
  }

  /**
   * Saves (creates or updates) an accommodation, ensuring strict business logic and validation.
   */
  static async saveAccommodation(resortId: string, accommodation: Accommodation, userId?: string): Promise<Accommodation> {
    Logger.info(`Preparing to save accommodation: ${accommodation.id || 'NEW'} (Resort: ${resortId})`);

    const now = new Date().toISOString();
    
    // Determine if it is a new entity
    let isNew = false;
    let existing: Accommodation | null = null;

    if (accommodation.id) {
      existing = await accommodationRepository.findById(resortId, accommodation.id);
    }

    if (!accommodation.id || !existing) {
      isNew = true;
    }

    // Auto-generate slug if not provided or empty
    const slug = accommodation.slug && accommodation.slug.trim() !== ''
      ? accommodation.slug
      : this.generateSlug(accommodation.name);

    // Build finalized domain entity to validate
    const finalizedEntity: Accommodation = {
      ...accommodation,
      resortId,
      slug,
      createdAt: isNew ? (accommodation.createdAt || now) : (existing?.createdAt || now),
      updatedAt: now,
      createdBy: isNew ? (userId || accommodation.createdBy || 'system') : (existing?.createdBy || 'system'),
      updatedBy: userId || 'system'
    };

    // Run strict domain validations
    this.validate(finalizedEntity);

    // Save
    if (isNew) {
      // Auto-assign a numeric or string ID if missing
      if (!finalizedEntity.id) {
        finalizedEntity.id = Date.now(); // compatible with local numeric IDs
      }
      await accommodationRepository.create(resortId, finalizedEntity);
    } else {
      await accommodationRepository.update(resortId, finalizedEntity);
    }

    Logger.info(`Successfully saved accommodation: ${finalizedEntity.id} (Resort: ${resortId})`);
    return finalizedEntity;
  }

  /**
   * Deletes an accommodation logically (soft delete).
   */
  static async deleteAccommodation(resortId: string, id: string | number, userId?: string): Promise<void> {
    Logger.warn(`Deleting accommodation ID: ${id} logically from resort: ${resortId}`);
    
    const existing = await accommodationRepository.findById(resortId, id);
    if (!existing) {
      throw new AccommodationNotFoundError(id);
    }

    const now = new Date().toISOString();
    const softDeleted: Accommodation = {
      ...existing,
      deleted: true,
      deletedAt: now,
      deletedBy: userId || 'system',
      updatedAt: now,
      updatedBy: userId || 'system'
    };

    await accommodationRepository.update(resortId, softDeleted);
    Logger.info(`Successfully logically deleted accommodation ID: ${id}`);
  }
}

export default AccommodationService;
