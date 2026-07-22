import { Booking } from '../../../types';
import { BookingService } from '../../bookings/services/BookingService';
import { StayStatus, StayTransition, STAY_TRANSITIONS } from '../types';

export class StayOperationsService {
  /**
   * Retrieves the allowed state transitions for a given booking based on its current status.
   */
  public static getAllowedTransitions(booking: Booking): StayTransition[] {
    const currentStatus = booking.status as StayStatus;
    
    // Filter transitions where the source state matches the current status
    return STAY_TRANSITIONS.filter(t => t.from === currentStatus);
  }

  /**
   * Evaluates if a specific transition is valid for a booking.
   */
  public static isValidTransition(booking: Booking, action: string): boolean {
    const allowed = this.getAllowedTransitions(booking);
    return allowed.some(t => t.action === action);
  }

  /**
   * Executes a stay transition by delegating to BookingService.
   */
  public static async executeTransition(
    resortId: string,
    bookingId: number,
    action: string,
    userId?: string
  ): Promise<Booking> {
    const opUserId = userId || 'Backoffice Staff';
    
    switch (action) {
      case 'confirm':
        return BookingService.confirmBooking(resortId, bookingId, opUserId);
        
      case 'check_in':
        return BookingService.performCheckIn(resortId, bookingId, opUserId);
        
      case 'start_stay':
        return BookingService.setInHouse(resortId, bookingId, opUserId);
        
      case 'check_out':
        return BookingService.performCheckOut(resortId, bookingId, opUserId);
        
      case 'complete':
        return BookingService.completeStay(resortId, bookingId, opUserId);
        
      case 'no_show':
      case 'no_show_pending':
        return BookingService.markNoShow(resortId, bookingId, opUserId);
        
      case 'cancel':
      case 'cancel_confirmed':
        return BookingService.cancelBooking(resortId, bookingId, opUserId);
        
      default:
        throw new Error(`Acción de estadía no reconocida: "${action}".`);
    }
  }
}

export default StayOperationsService;
