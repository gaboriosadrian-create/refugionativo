import { guestTimelineRepository } from '../repositories/GuestTimelineRepository';
import { GuestTimelineEvent } from '../types/crm';
import { Logger } from '../../../core/logger/Logger';

export class GuestTimelineService {
  public static async getTimelineForGuest(resortId: string, guestId: string): Promise<GuestTimelineEvent[]> {
    return guestTimelineRepository.getByGuestId(resortId, guestId);
  }

  public static async logEvent(
    resortId: string,
    guestId: string,
    type: GuestTimelineEvent['type'],
    title: string,
    description: string,
    createdBy: string,
    referenceId?: string,
    metadata?: Record<string, any>
  ): Promise<GuestTimelineEvent> {
    Logger.info(`[GuestTimelineService] Logging CRM event for guest ${guestId}: ${title}`);
    return guestTimelineRepository.addEvent(resortId, {
      guestId,
      resortId,
      type,
      title,
      description,
      createdBy,
      referenceId,
      metadata
    });
  }

  public static async logBookingEvent(
    resortId: string,
    guestId: string,
    bookingId: string,
    action: 'created' | 'cancelled' | 'check_in' | 'check_out',
    details: string,
    createdBy: string
  ): Promise<GuestTimelineEvent> {
    const typeMap = {
      created: 'booking' as const,
      cancelled: 'change' as const,
      check_in: 'check_in' as const,
      check_out: 'check_out' as const
    };

    const titleMap = {
      created: 'Nueva Reserva Creada',
      cancelled: 'Reserva Cancelada',
      check_in: 'Check-In Realizado',
      check_out: 'Check-Out Completado'
    };

    return this.logEvent(
      resortId,
      guestId,
      typeMap[action],
      titleMap[action],
      details,
      createdBy,
      bookingId
    );
  }

  public static async logPaymentEvent(
    resortId: string,
    guestId: string,
    paymentId: string,
    amount: number,
    method: string,
    createdBy: string
  ): Promise<GuestTimelineEvent> {
    return this.logEvent(
      resortId,
      guestId,
      'payment',
      'Pago Registrado',
      `Pago recibido de $${amount} procesado vía ${method}.`,
      createdBy,
      paymentId
    );
  }

  public static async logNotificationEvent(
    resortId: string,
    guestId: string,
    title: string,
    channel: string,
    createdBy: string
  ): Promise<GuestTimelineEvent> {
    return this.logEvent(
      resortId,
      guestId,
      'notification',
      'Notificación Enviada',
      `Mensaje enviado con éxito: "${title}" por canal ${channel}.`,
      createdBy
    );
  }
}

export default GuestTimelineService;
