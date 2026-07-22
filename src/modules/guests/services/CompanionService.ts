import { companionRepository } from '../repositories/CompanionRepository';
import { checkinAuditRepository } from '../repositories/CheckinAuditRepository';
import { Companion } from '../types/journey';

export class CompanionService {
  /**
   * Retrieves all companions for a booking.
   */
  public static async getCompanions(resortId: string, bookingId: string | number): Promise<Companion[]> {
    return companionRepository.findByBookingId(resortId, bookingId);
  }

  /**
   * Adds a companion to a booking.
   */
  public static async addCompanion(
    resortId: string,
    bookingId: string | number,
    data: Omit<Companion, 'id' | 'resortId' | 'bookingId' | 'preCheckinStatus'>
  ): Promise<Companion> {
    const bookingIdStr = String(bookingId);

    const companion: Companion = {
      ...data,
      id: `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: bookingIdStr,
      preCheckinStatus: 'completed'
    };

    await companionRepository.save(resortId, companion);

    // Audit log
    await checkinAuditRepository.save(resortId, {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: bookingIdStr,
      action: 'COMPANION_ADDED',
      performedBy: 'guest',
      timestamp: new Date().toISOString(),
      details: `Acompañante agregado: ${companion.firstName} ${companion.lastName} (${companion.documentNumber}).`
    });

    return companion;
  }

  /**
   * Deletes a companion.
   */
  public static async deleteCompanion(resortId: string, companionId: string): Promise<void> {
    const companion = await companionRepository.getById(resortId, companionId);
    if (companion) {
      await companionRepository.delete(resortId, companionId);

      // Audit log
      await checkinAuditRepository.save(resortId, {
        id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        resortId,
        bookingId: String(companion.bookingId),
        action: 'COMPANION_REMOVED',
        performedBy: 'guest',
        timestamp: new Date().toISOString(),
        details: `Acompañante removido: ${companion.firstName} ${companion.lastName}.`
      });
    }
  }
}
