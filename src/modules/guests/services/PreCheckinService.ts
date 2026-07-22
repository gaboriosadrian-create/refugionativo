import { preCheckinRepository } from '../repositories/PreCheckinRepository';
import { guestRepository } from '../repositories/GuestRepository';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { guestTimelineRepository } from '../repositories/GuestTimelineRepository';
import { checkinAuditRepository } from '../repositories/CheckinAuditRepository';
import { GuestJourneyService } from './GuestJourneyService';
import { PreCheckin, JourneyStage } from '../types/journey';

export class PreCheckinService {
  /**
   * Retrieves or initializes pre-checkin data for a booking.
   */
  public static async getPreCheckin(resortId: string, bookingId: string | number): Promise<PreCheckin> {
    const bookingIdStr = String(bookingId);
    let preCheckin = await preCheckinRepository.findByBookingId(resortId, bookingIdStr);

    if (!preCheckin) {
      const booking = await bookingRepository.getById(resortId, bookingIdStr);
      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      // Try to load current details from CRM if profile exists
      let firstName = '';
      let lastName = '';
      let email = booking.email || '';
      let phone = booking.phone || '';
      let documentType = 'DNI';
      let documentNumber = '';
      let nationality = 'Argentina';
      let address = '';
      let dateOfBirth = '';

      if (booking.guestId) {
        const guest = await guestRepository.getById(resortId, String(booking.guestId));
        if (guest) {
          firstName = guest.firstName || '';
          lastName = guest.lastName || '';
          email = guest.email || email;
          phone = guest.phone || phone;
          documentType = guest.documentType || documentType;
          documentNumber = guest.documentNumber || documentNumber;
          nationality = guest.nationality || nationality;
          address = guest.address || address;
          dateOfBirth = guest.birthDate || dateOfBirth;
        }
      }

      if (!firstName && booking.name) {
        const parts = booking.name.split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }

      preCheckin = {
        id: bookingIdStr,
        resortId,
        bookingId: bookingIdStr,
        guestId: String(booking.guestId),
        firstName,
        lastName,
        documentType,
        documentNumber,
        nationality,
        address,
        dateOfBirth,
        phone,
        email,
        status: 'pending'
      };

      await preCheckinRepository.save(resortId, preCheckin);
    }

    return preCheckin;
  }

  /**
   * Submits pre-checkin, validating details, saving, and moving journey to PRE_CHECKIN stage.
   */
  public static async submitPreCheckin(
    resortId: string,
    bookingId: string | number,
    data: Partial<Omit<PreCheckin, 'id' | 'resortId' | 'bookingId' | 'status'>>,
    operator: string = 'guest'
  ): Promise<PreCheckin> {
    const bookingIdStr = String(bookingId);
    const preCheckin = await this.getPreCheckin(resortId, bookingIdStr);

    // Validate required fields
    const required: (keyof PreCheckin)[] = [
      'firstName',
      'lastName',
      'documentType',
      'documentNumber',
      'nationality',
      'address',
      'dateOfBirth',
      'phone',
      'email'
    ];

    const updated = {
      ...preCheckin,
      ...data,
    };

    const missing = required.filter(field => !updated[field]);
    if (missing.length > 0) {
      throw new Error(`Los siguientes campos son obligatorios: ${missing.join(', ')}`);
    }

    updated.status = 'completed';
    updated.completedAt = new Date().toISOString();

    await preCheckinRepository.save(resortId, updated);

    // Update journey stage to PRE_CHECKIN
    await GuestJourneyService.updateStage(resortId, bookingIdStr, JourneyStage.PRE_CHECKIN, operator);

    // Audit trail log
    await checkinAuditRepository.save(resortId, {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: bookingIdStr,
      action: 'PRE_CHECKIN_COMPLETED',
      performedBy: operator,
      timestamp: new Date().toISOString(),
      details: `Pre check-in completado exitosamente por ${updated.firstName} ${updated.lastName}.`
    });

    return updated;
  }

  /**
   * Confirms pre-checkin details into Guest CRM (primary profile update)
   */
  public static async confirmPreCheckinIntoCRM(resortId: string, bookingId: string | number): Promise<void> {
    const bookingIdStr = String(bookingId);
    const preCheckin = await preCheckinRepository.findByBookingId(resortId, bookingIdStr);

    if (preCheckin && preCheckin.status === 'completed') {
      const booking = await bookingRepository.getById(resortId, bookingIdStr);
      if (booking && booking.guestId) {
        const guest = await guestRepository.getById(resortId, String(booking.guestId));
        if (guest) {
          guest.firstName = preCheckin.firstName;
          guest.lastName = preCheckin.lastName;
          guest.fullName = `${preCheckin.firstName} ${preCheckin.lastName}`.trim();
          guest.email = preCheckin.email;
          guest.phone = preCheckin.phone;
          guest.documentType = preCheckin.documentType;
          guest.documentNumber = preCheckin.documentNumber;
          guest.nationality = preCheckin.nationality;
          guest.address = preCheckin.address;
          guest.birthDate = preCheckin.dateOfBirth;
          guest.updatedAt = new Date().toISOString();

          await guestRepository.save(resortId, guest);

          // Add timeline entry
          await guestTimelineRepository.addEvent(resortId, {
            resortId,
            guestId: String(booking.guestId),
            type: 'change',
            title: 'Perfil actualizado desde Pre Check-in',
            description: 'Los datos personales del huésped fueron verificados y actualizados en el CRM.',
            createdBy: 'system',
            referenceId: bookingIdStr
          });
        }
      }
    }
  }
}
