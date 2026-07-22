import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { paymentRepository } from '../../payments/repositories/PaymentRepository';
import { NotificationRepository } from '../../../core/notifications/NotificationRepository';
import { guestRepository } from '../repositories/GuestRepository';
import { GuestTimelineService } from './GuestTimelineService';
import { GuestAnalyticsService } from './GuestAnalyticsService';
import { guestHistoryRepository } from '../repositories/GuestHistoryRepository';
import { Booking } from '../../../types';
import { Payment } from '../../payments/types';
import { NotificationLog, NotificationStatus } from '../../../core/notifications/NotificationTypes';
import { Logger } from '../../../core/logger/Logger';

let hooksInstalled = false;

export class GuestIntegrationService {
  public static installHooks() {
    if (hooksInstalled) {
      Logger.info('[GuestIntegrationService] Hooks are already installed.');
      return;
    }

    Logger.info('[GuestIntegrationService] Installing unified Guest CRM dynamic hooks...');
    
    // 1. Intercept Booking Repository Save
    const originalBookingSave = bookingRepository.save.bind(bookingRepository);
    bookingRepository.save = async function(resortId: string, entity: Booking) {
      let oldBooking: Booking | null = null;
      try {
        oldBooking = await bookingRepository.getById(resortId, entity.id);
      } catch (e) {
        // Ignore
      }

      // Execute original save
      await originalBookingSave(resortId, entity);

      // Post-save CRM tracking
      try {
        // Recalculate metrics & evaluate segments
        const metrics = await GuestAnalyticsService.calculateMetrics(resortId, entity.guestId);
        await GuestAnalyticsService.evaluateSegments(resortId, entity.guestId, metrics);

        if (!oldBooking) {
          // Booking Created
          await GuestTimelineService.logBookingEvent(
            resortId,
            entity.guestId,
            String(entity.id),
            'created',
            `Reserva #${entity.id} registrada. Entrada: ${entity.checkIn}, Salida: ${entity.checkOut}. Total: $${entity.totalPrice}`,
            'sistema'
          );

          await guestHistoryRepository.addRecord(resortId, {
            guestId: entity.guestId,
            resortId,
            eventType: 'booking_created',
            description: `Nueva reserva #${entity.id} registrada en el sistema.`,
            performedBy: 'sistema',
            referenceId: String(entity.id)
          });
        } else if (oldBooking.status !== entity.status) {
          // Status Changed
          let action: 'created' | 'cancelled' | 'check_in' | 'check_out' = 'created';
          let desc = '';
          let histEvent: 'booking_created' | 'booking_cancelled' | 'check_in' | 'check_out' = 'booking_created';

          if (entity.status === 'cancelled') {
            action = 'cancelled';
            desc = `Reserva #${entity.id} cancelada.`;
            histEvent = 'booking_cancelled';
          } else if (entity.status === 'checked_in' || entity.status === 'in_house') {
            action = 'check_in';
            desc = `Huésped realizó Check-In para la reserva #${entity.id}.`;
            histEvent = 'check_in';
          } else if (entity.status === 'completed' || entity.status === 'checked_out') {
            action = 'check_out';
            desc = `Huésped completó estadía (Check-Out) para la reserva #${entity.id}.`;
            histEvent = 'check_out';
          }

          await GuestTimelineService.logBookingEvent(
            resortId,
            entity.guestId,
            String(entity.id),
            action,
            desc,
            'sistema'
          );

          await guestHistoryRepository.addRecord(resortId, {
            guestId: entity.guestId,
            resortId,
            eventType: histEvent,
            description: desc,
            performedBy: 'sistema',
            referenceId: String(entity.id)
          });
        }
      } catch (err) {
        Logger.error('[GuestIntegrationService] Error handling booking post-save:', err);
      }
    };

    // 2. Intercept Payment Repository Save
    const originalPaymentSave = paymentRepository.save.bind(paymentRepository);
    paymentRepository.save = async function(resortId: string, entity: Payment) {
      // Execute original save
      await originalPaymentSave(resortId, entity);

      // Post-payment CRM tracking
      try {
        if (entity.status === 'approved') {
          // Find associated booking to resolve guestId
          const booking = await bookingRepository.getById(resortId, entity.bookingId);
          if (booking) {
            // Recalculate metrics
            const metrics = await GuestAnalyticsService.calculateMetrics(resortId, booking.guestId);
            await GuestAnalyticsService.evaluateSegments(resortId, booking.guestId, metrics);

            // Log Payment Event on Guest Timeline
            await GuestTimelineService.logPaymentEvent(
              resortId,
              booking.guestId,
              entity.id,
              entity.amount,
              entity.provider || 'MercadoPago',
              'sistema'
            );

            // Log in history
            await guestHistoryRepository.addRecord(resortId, {
              guestId: booking.guestId,
              resortId,
              eventType: 'payment_received',
              description: `Pago aprobado de $${entity.amount} para la reserva #${entity.bookingId}.`,
              performedBy: 'sistema',
              referenceId: entity.id
            });
          }
        }
      } catch (err) {
        Logger.error('[GuestIntegrationService] Error handling payment post-save:', err);
      }
    };

    // 3. Intercept Notification Log Save
    const originalSaveLog = NotificationRepository.saveLog.bind(NotificationRepository);
    NotificationRepository.saveLog = async function(log: NotificationLog) {
      // Execute original save
      await originalSaveLog(log);

      // Post-notification CRM tracking
      try {
        if (log.status === NotificationStatus.SENT) {
          const resortId = log.tenantId; // tenantId is resortId
          const recipientClean = log.recipient.trim().toLowerCase();

          // Search guest by email or phone
          const allGuests = await guestRepository.list(resortId);
          const matchedGuest = allGuests.find(g => 
            g.email.toLowerCase().trim() === recipientClean ||
            g.phone.replace(/[\s+()-]/g, '') === recipientClean.replace(/[\s+()-]/g, '')
          );

          if (matchedGuest) {
            // Log Notification Event on Guest Timeline
            await GuestTimelineService.logNotificationEvent(
              resortId,
              matchedGuest.id,
              log.subject || `Alerta ${log.event}`,
              log.channel,
              'sistema'
            );
          }
        }
      } catch (err) {
        Logger.error('[GuestIntegrationService] Error handling notification log post-save:', err);
      }
    };

    hooksInstalled = true;
    Logger.info('[GuestIntegrationService] Unified Guest CRM dynamic hooks installed successfully.');
  }
}

export default GuestIntegrationService;
