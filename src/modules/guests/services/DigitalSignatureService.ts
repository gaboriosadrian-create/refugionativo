import { digitalSignatureRepository } from '../repositories/DigitalSignatureRepository';
import { checkinAuditRepository } from '../repositories/CheckinAuditRepository';
import { guestTimelineRepository } from '../repositories/GuestTimelineRepository';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { DigitalSignature } from '../types/journey';

export class DigitalSignatureService {
  /**
   * Saves a digital signature, logs audit trace, and links to the guest timeline.
   */
  public static async saveSignature(
    resortId: string,
    bookingId: string | number,
    guestId: string,
    signerName: string,
    signerType: 'primary' | 'companion',
    signatureData: string, // Base64 dataURL
    documentType: 'internal_rules' | 'privacy_policy' | 'terms_of_stay',
    ipAddress?: string,
    userAgent?: string
  ): Promise<DigitalSignature> {
    const bookingIdStr = String(bookingId);

    const signature: DigitalSignature = {
      id: `sig_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: bookingIdStr,
      guestId,
      signerName,
      signerType,
      signatureData,
      documentType,
      signedAt: new Date().toISOString(),
      ipAddress,
      userAgent
    };

    await digitalSignatureRepository.save(resortId, signature);

    // Audit log
    await checkinAuditRepository.save(resortId, {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: bookingIdStr,
      action: `SIGNATURE_${documentType.toUpperCase()}`,
      performedBy: signerType === 'primary' ? 'guest' : 'companion',
      timestamp: new Date().toISOString(),
      details: `Firma digital registrada para el documento "${documentType}" por ${signerName}.`
    });

    // Add event to CRM timeline if primary guest
    if (signerType === 'primary') {
      const booking = await bookingRepository.getById(resortId, bookingIdStr);
      if (booking && booking.guestId) {
        await guestTimelineRepository.addEvent(resortId, {
          resortId,
          guestId: String(booking.guestId),
          type: 'change',
          title: 'Firma electrónica registrada',
          description: `Firmó reglamento y políticas (${documentType}). Firmante: ${signerName}.`,
          createdBy: 'guest',
          referenceId: bookingIdStr
        });
      }
    }

    return signature;
  }

  /**
   * Retrieves all signatures for a booking.
   */
  public static async getSignaturesByBooking(resortId: string, bookingId: string | number): Promise<DigitalSignature[]> {
    return digitalSignatureRepository.findByBookingId(resortId, bookingId);
  }
}
