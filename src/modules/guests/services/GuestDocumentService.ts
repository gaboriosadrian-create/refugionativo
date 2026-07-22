import { guestDocumentRepository } from '../repositories/GuestDocumentRepository';
import { checkinAuditRepository } from '../repositories/CheckinAuditRepository';
import { guestTimelineRepository } from '../repositories/GuestTimelineRepository';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { GuestDocument } from '../types/journey';

export class GuestDocumentService {
  /**
   * Registers a document upload for a guest/companion.
   */
  public static async uploadDocument(
    resortId: string,
    bookingId: string | number,
    guestId: string,
    documentType: 'passport' | 'id_card' | 'driver_license' | 'other',
    side: 'front' | 'back' | 'all',
    fileUrl: string,
    fileName: string
  ): Promise<GuestDocument> {
    const bookingIdStr = String(bookingId);

    const document: GuestDocument = {
      id: `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: bookingIdStr,
      guestId,
      documentType,
      side,
      fileUrl,
      fileName,
      uploadedAt: new Date().toISOString()
    };

    await guestDocumentRepository.save(resortId, document);

    // Audit trace log
    await checkinAuditRepository.save(resortId, {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: bookingIdStr,
      action: 'DOCUMENT_UPLOADED',
      performedBy: 'guest',
      timestamp: new Date().toISOString(),
      details: `Documento de tipo ${documentType} (${side}) cargado como ${fileName}.`
    });

    // Add event to CRM timeline
    const booking = await bookingRepository.getById(resortId, bookingIdStr);
    if (booking && booking.guestId && String(booking.guestId) === guestId) {
      await guestTimelineRepository.addEvent(resortId, {
        resortId,
        guestId: String(booking.guestId),
        type: 'change',
        title: 'Documentación digital adjuntada',
        description: `Se cargó copia digital de ${documentType} (${side}). Archivo: ${fileName}.`,
        createdBy: 'guest',
        referenceId: bookingIdStr
      });
    }

    return document;
  }

  /**
   * Retrieves all documents for a booking.
   */
  public static async getDocumentsByBooking(resortId: string, bookingId: string | number): Promise<GuestDocument[]> {
    return guestDocumentRepository.findByBookingId(resortId, bookingId);
  }
}
