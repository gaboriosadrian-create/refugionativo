import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { guestRepository } from '../repositories/GuestRepository';
import { guestTimelineRepository } from '../repositories/GuestTimelineRepository';
import { guestHistoryRepository } from '../repositories/GuestHistoryRepository';
import { WebsiteContentService } from '../../website-cms/services/WebsiteContentService';
import { NotificationEngine } from '../../../core/notifications/NotificationEngine';
import { NotificationEvent } from '../../../core/notifications/NotificationTypes';
import { ObservabilityService } from '../../../core/observability/ObservabilityService';
import { guestJourneyRepository } from '../repositories/GuestJourneyRepository';
import { checkinAuditRepository } from '../repositories/CheckinAuditRepository';
import { GuestJourney, JourneyStage, ArrivalInfo } from '../types/journey';

export class GuestJourneyService {
  /**
   * Retrieves or creates a guest journey for a booking.
   */
  public static async getJourney(resortId: string, bookingId: string | number): Promise<GuestJourney> {
    const bookingIdStr = String(bookingId);
    let journey = await guestJourneyRepository.findByBookingId(resortId, bookingIdStr);

    if (!journey) {
      // Find the associated booking
      const booking = await bookingRepository.getById(resortId, bookingIdStr);
      if (!booking) {
        throw new Error(`Booking with ID ${bookingId} not found`);
      }

      // Fetch arrival info from CMS content
      const arrivalInfo = await this.fetchArrivalInfoFromCMS(resortId);

      journey = {
        id: bookingIdStr,
        resortId,
        bookingId: bookingIdStr,
        guestId: String(booking.guestId),
        stage: JourneyStage.BOOKED,
        arrivalInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await guestJourneyRepository.save(resortId, journey);

      // Log initial audit
      await checkinAuditRepository.save(resortId, {
        id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        resortId,
        bookingId: bookingIdStr,
        action: 'JOURNEY_INITIALIZED',
        performedBy: 'system',
        timestamp: new Date().toISOString(),
        details: 'El recorrido digital del huésped se inició automáticamente en estado BOOKED.'
      });
    }

    return journey;
  }

  /**
   * Updates the journey stage, logging audits, updating CRM and triggering notifications.
   */
  public static async updateStage(
    resortId: string,
    bookingId: string | number,
    newStage: JourneyStage,
    operator: string = 'system'
  ): Promise<GuestJourney> {
    const journey = await this.getJourney(resortId, bookingId);
    const oldStage = journey.stage;

    if (oldStage === newStage) {
      return journey;
    }

    journey.stage = newStage;
    journey.updatedAt = new Date().toISOString();
    await guestJourneyRepository.save(resortId, journey);

    // Update reservation status or custom field if needed
    const booking = await bookingRepository.getById(resortId, String(bookingId));
    if (booking) {
      // We can map certain journey stages back to booking status if needed,
      // e.g. checked_in status.
      if (newStage === JourneyStage.CHECKED_IN || newStage === JourneyStage.IN_STAY) {
        (booking as any).checkInStatus = 'checked_in';
        await bookingRepository.save(resortId, booking);
      } else if (newStage === JourneyStage.CHECKED_OUT) {
        (booking as any).checkInStatus = 'checked_out';
        await bookingRepository.save(resortId, booking);
      }
    }

    // Record audit trail
    await checkinAuditRepository.save(resortId, {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: String(bookingId),
      action: `STAGE_TRANSITION_${newStage}`,
      performedBy: operator,
      timestamp: new Date().toISOString(),
      details: `Cambio de estado del Journey de ${oldStage} a ${newStage}.`
    });

    // Record observability metric
    ObservabilityService.recordMetric('guest_journey_stage_change', 1, 'count', {
      resortId,
      bookingId: String(bookingId),
      fromStage: oldStage,
      toStage: newStage,
    });

    // Add event to Guest CRM profile timeline & history
    if (booking && booking.guestId) {
      await guestTimelineRepository.addEvent(resortId, {
        resortId,
        guestId: String(booking.guestId),
        type: newStage === JourneyStage.CHECKED_IN ? 'check_in' : newStage === JourneyStage.CHECKED_OUT ? 'check_out' : 'change',
        title: `Journey Stage: ${newStage}`,
        description: `El estado del viaje del huésped cambió de ${oldStage} a ${newStage}. Operado por: ${operator}`,
        createdBy: operator,
        referenceId: String(bookingId)
      });

      await guestHistoryRepository.addRecord(resortId, {
        resortId,
        guestId: String(booking.guestId),
        eventType: newStage === JourneyStage.CHECKED_IN ? 'check_in' : newStage === JourneyStage.CHECKED_OUT ? 'check_out' : 'preference_updated',
        description: `Transición de estado digital: ${oldStage} -> ${newStage}`,
        performedBy: operator,
        referenceId: String(bookingId)
      });
    }

    // Trigger Notification Engine
    try {
      if (newStage === JourneyStage.PRE_CHECKIN) {
        await NotificationEngine.trigger(NotificationEvent.CHECKIN_UPCOMING, {
          bookingId: String(bookingId),
          guestName: booking?.name || 'Huésped',
          email: booking?.email || '',
        }, undefined, resortId);
      } else if (newStage === JourneyStage.CHECKED_IN) {
        await NotificationEngine.trigger(NotificationEvent.CHECKIN_COMPLETED, {
          bookingId: String(bookingId),
          guestName: booking?.name || 'Huésped',
          email: booking?.email || '',
        }, undefined, resortId);
      } else if (newStage === JourneyStage.CHECKOUT_PENDING) {
        await NotificationEngine.trigger(NotificationEvent.CHECKOUT_UPCOMING, {
          bookingId: String(bookingId),
          guestName: booking?.name || 'Huésped',
          email: booking?.email || '',
        }, undefined, resortId);
      } else if (newStage === JourneyStage.CHECKED_OUT) {
        await NotificationEngine.trigger(NotificationEvent.CHECKOUT_COMPLETED, {
          bookingId: String(bookingId),
          guestName: booking?.name || 'Huésped',
          email: booking?.email || '',
        }, undefined, resortId);
      }
    } catch (e) {
      console.error('Error triggering notification for journey stage update:', e);
    }

    return journey;
  }

  /**
   * Fetches arrival info from the website CMS.
   */
  private static async fetchArrivalInfoFromCMS(resortId: string): Promise<ArrivalInfo> {
    try {
      const cms = await WebsiteContentService.getContent(resortId);
      return {
        address: cms?.contact?.address || 'Av. de los Pioneros 100, Bariloche',
        mapUrl: cms?.contact?.googleMapsUrl || 'https://maps.google.com',
        checkInTime: cms?.policies?.checkIn || '15:00',
        checkOutTime: cms?.policies?.checkOut || '11:00',
        wifiSsid: 'StayFlow_Guest_WiFi',
        wifiPassword: 'stayflowpremium',
        parkingInstructions: 'Estacionamiento libre y gratuito dentro del predio del complejo.',
        accessCode: 'SF-' + Math.floor(1000 + Math.random() * 9000),
        contactPhone: cms?.contact?.phone || '+54 294 455-1234'
      };
    } catch (err) {
      return {
        address: 'Av. de los Pioneros 100, Bariloche',
        mapUrl: 'https://maps.google.com',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        wifiSsid: 'StayFlow_Guest_WiFi',
        wifiPassword: 'stayflowpremium',
        parkingInstructions: 'Estacionamiento libre y gratuito dentro del predio.',
        accessCode: 'SF-1234',
        contactPhone: '+54 294 455-1234'
      };
    }
  }
}
