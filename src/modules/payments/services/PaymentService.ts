import { paymentRepository } from '../repositories/PaymentRepository';
import { Payment, PaymentStatus, PaymentHistoryEvent } from '../types';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { bookingHistoryRepository } from '../../bookings/repositories/BookingHistoryRepository';
import { Booking } from '../../../types';
import { Logger } from '../../../core/logger/Logger';

export class PaymentService {
  /**
   * Retrieves all payments for a resort.
   */
  static async getPayments(resortId: string): Promise<Payment[]> {
    try {
      return await paymentRepository.getAll(resortId);
    } catch (err) {
      Logger.error(`Error in getPayments for resort ${resortId}:`, err);
      return [];
    }
  }

  /**
   * Retrieves payments associated with a specific booking.
   */
  static async getPaymentsByBookingId(resortId: string, bookingId: number): Promise<Payment[]> {
    try {
      const all = await this.getPayments(resortId);
      return all.filter(p => p.bookingId === bookingId);
    } catch (err) {
      Logger.error(`Error in getPaymentsByBookingId for booking #${bookingId}:`, err);
      return [];
    }
  }

  /**
   * Retrieves a single payment by ID.
   */
  static async getPaymentById(resortId: string, paymentId: string): Promise<Payment | null> {
    try {
      return await paymentRepository.getById(resortId, paymentId);
    } catch (err) {
      Logger.error(`Error in getPaymentById for ID ${paymentId}:`, err);
      return null;
    }
  }

  /**
   * Creates a new payment preference with the provider and records it locally.
   */
  static async createPayment(
    resortId: string,
    bookingId: number,
    amount: number,
    providerCode: string,
    cabinName: string,
    baseUrl: string
  ): Promise<Payment> {
    Logger.info(`PaymentService: Initiating payment for booking #${bookingId}, amount: ${amount}`);
    
    let preferenceId = `mock_pref_${Math.random().toString(36).substring(2, 9)}`;
    let paymentUrl = `${baseUrl}/?simulated_payment=true&booking_id=${bookingId}&amount=${amount}&resort_id=${resortId}&pref_id=${preferenceId}`;

    try {
      // Fetch preference from our full-stack Express backend
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resortId,
          bookingId,
          amount,
          provider: providerCode,
          cabinName,
          baseUrl
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.payment) {
          preferenceId = result.payment.id;
          paymentUrl = result.payment.paymentUrl;
          Logger.info(`PaymentService: Successfully fetched payment preference from Express server. PrefId: ${preferenceId}`);
        }
      } else {
        Logger.warn('PaymentService: Backend endpoint /api/payments/create-preference failed. Falling back to frontend generator.');
      }
    } catch (err) {
      Logger.error('PaymentService: Error requesting preference from backend:', err);
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newPayment: Payment = {
      id: paymentId,
      resortId,
      bookingId,
      amount,
      currency: 'ARS',
      status: 'pending',
      provider: providerCode,
      externalId: preferenceId, // Initially store preferenceId
      paymentUrl,
      history: [
        {
          id: `ev_${Date.now()}_1`,
          status: 'pending',
          message: `Iniciación de pago vía ${providerCode === 'mercado_pago' ? 'Mercado Pago' : providerCode}`,
          timestamp: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    await paymentRepository.save(resortId, newPayment);
    Logger.info(`PaymentService: Payment record ${paymentId} saved successfully.`);
    return newPayment;
  }

  /**
   * Updates payment status and performs atomic cascade updates on the booking state.
   */
  static async updatePaymentStatus(
    resortId: string,
    paymentId: string,
    newStatus: PaymentStatus,
    message: string,
    externalTransactionId?: string,
    payload?: any
  ): Promise<Payment | null> {
    const payment = await this.getPaymentById(resortId, paymentId);
    if (!payment) {
      Logger.error(`PaymentService: Payment ${paymentId} not found for resort ${resortId}`);
      return null;
    }

    // Safety constraint: approved payments cannot be changed back unless to refunded
    if (payment.status === 'approved' && newStatus !== 'refunded') {
      Logger.warn(`PaymentService: Attempted to change approved payment ${paymentId} to ${newStatus}. Blocked for security.`);
      return payment;
    }

    const now = new Date().toISOString();
    const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    
    const newEvent: PaymentHistoryEvent = {
      id: eventId,
      status: newStatus,
      message,
      timestamp: now,
      payload
    };

    payment.status = newStatus;
    if (externalTransactionId) {
      payment.externalId = externalTransactionId;
    }
    payment.history.push(newEvent);
    payment.updatedAt = now;

    await paymentRepository.save(resortId, payment);
    Logger.info(`PaymentService: Payment ${paymentId} status updated to ${newStatus}`);

    // Cascade update to Booking state
    try {
      const bookings = await bookingRepository.getAll(resortId);
      const booking = bookings.find(b => b.id === payment.bookingId);
      
      if (booking) {
        let updatedBooking: Booking = { ...booking };
        let statusChanged = false;

        if (newStatus === 'approved') {
          updatedBooking.paymentStatus = 'paid';
          updatedBooking.status = 'confirmed'; // Auto confirm booking on payment approval
          updatedBooking.paymentMethod = payment.provider;
          statusChanged = true;
        } else if (newStatus === 'refunded') {
          updatedBooking.paymentStatus = 'refunded';
          statusChanged = true;
        } else if (newStatus === 'rejected') {
          updatedBooking.paymentStatus = 'pending'; // or failed
          statusChanged = true;
        }

        if (statusChanged) {
          await bookingRepository.save(resortId, updatedBooking);
          Logger.info(`PaymentService: Cascaded booking #${booking.id} update: status=${updatedBooking.status}, paymentStatus=${updatedBooking.paymentStatus}`);
          
          // Log in Booking Audit History
          const historyId = Date.now() + Math.floor(Math.random() * 1000);
          await bookingHistoryRepository.save(resortId, {
            id: historyId as any,
            bookingId: booking.id,
            action: newStatus === 'approved' ? 'CONFIRM' : 'UPDATE',
            user: 'Sistema de Pagos (Automático)',
            notes: `Pago de ${payment.amount} ARS ${newStatus === 'approved' ? 'Aprobado' : 'Modificado'} vía ${payment.provider}. ID Transacción: ${externalTransactionId || 'N/A'}. Detalles: ${message}`,
            timestamp: now
          } as any);
        }
      } else {
        Logger.warn(`PaymentService: Associated booking #${payment.bookingId} not found for payment cascade.`);
      }
    } catch (err) {
      Logger.error(`PaymentService: Error cascading payment status to booking:`, err);
    }

    return payment;
  }

  /**
   * Refunder function. Initiates a refund and propagates states down.
   */
  static async refundPayment(resortId: string, paymentId: string): Promise<Payment | null> {
    Logger.info(`PaymentService: Refunding payment ${paymentId}`);
    return this.updatePaymentStatus(
      resortId,
      paymentId,
      'refunded',
      'Reembolso total procesado de manera manual por el administrador'
    );
  }
}
