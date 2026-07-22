import { Booking } from '../../types';
import { BookingService } from '../../modules/bookings/services/BookingService';

export class ReservationService {
  static async getReservations(resortId: string): Promise<Booking[]> {
    return BookingService.getBookings(resortId);
  }

  static async saveReservation(resortId: string, booking: Booking): Promise<void> {
    // Delegate fully to the new atomic createBooking flow in BookingService.
    // If the booking is already in the system, we route through updateBooking.
    const existing = await BookingService.getBookings(resortId);
    const exists = existing.some(b => b.id === booking.id);
    
    if (exists) {
      await BookingService.updateBooking(resortId, booking.id, booking);
    } else {
      await BookingService.createBooking(resortId, booking);
    }
  }

  static async hasConflict(
    resortId: string, 
    cabinId: number, 
    start: string, 
    end: string, 
    excludeId?: number
  ): Promise<boolean> {
    return BookingService.hasConflict(resortId, cabinId, start, end, excludeId);
  }

  static async updateReservationStatus(
    resortId: string, 
    id: number, 
    status: 'pending' | 'confirmed' | 'cancelled'
  ): Promise<Booking | null> {
    const updated = await BookingService.updateBookingStatus(resortId, id, status);
    return updated;
  }
}

export default ReservationService;
