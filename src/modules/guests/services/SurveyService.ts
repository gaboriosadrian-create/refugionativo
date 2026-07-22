import { guestSurveyRepository } from '../repositories/GuestSurveyRepository';
import { checkinAuditRepository } from '../repositories/CheckinAuditRepository';
import { guestTimelineRepository } from '../repositories/GuestTimelineRepository';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { GuestSurvey } from '../types/journey';

export class SurveyService {
  /**
   * Submits a guest satisfaction survey, updating audits and guest timelines.
   */
  public static async submitSurvey(
    resortId: string,
    bookingId: string | number,
    data: Omit<GuestSurvey, 'id' | 'resortId' | 'bookingId' | 'submittedAt'>
  ): Promise<GuestSurvey> {
    const bookingIdStr = String(bookingId);

    const survey: GuestSurvey = {
      ...data,
      id: `srv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: bookingIdStr,
      submittedAt: new Date().toISOString()
    };

    await guestSurveyRepository.save(resortId, survey);

    // Log audit action
    await checkinAuditRepository.save(resortId, {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: bookingIdStr,
      action: 'SURVEY_SUBMITTED',
      performedBy: 'guest',
      timestamp: new Date().toISOString(),
      details: `Encuesta de satisfacción enviada. Calificación general: ${survey.overallRating}/5.`
    });

    // Add event to CRM timeline
    const booking = await bookingRepository.getById(resortId, bookingIdStr);
    if (booking && booking.guestId) {
      await guestTimelineRepository.addEvent(resortId, {
        resortId,
        guestId: String(booking.guestId),
        type: 'observation',
        title: 'Encuesta de Satisfacción completada',
        description: `Calificaciones - General: ${survey.overallRating}/5, Limpieza: ${survey.cleanlinessRating}/5, Atención: ${survey.serviceRating}/5, Instalaciones: ${survey.facilitiesRating}/5. Comentarios: "${survey.comments || 'Sin comentarios'}"`,
        createdBy: 'guest',
        referenceId: bookingIdStr
      });
    }

    return survey;
  }

  /**
   * Retrieves a satisfaction survey for a booking.
   */
  public static async getSurvey(resortId: string, bookingId: string | number): Promise<GuestSurvey | null> {
    return guestSurveyRepository.findByBookingId(resortId, bookingId);
  }
}
