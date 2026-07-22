import { Booking } from '../../../types';

export interface BookingHistory {
  id: string;
  resortId: string;
  bookingId: number;
  action: 'creation' | 'update' | 'confirmation' | 'cancellation' | 'date_change' | 'accommodation_change' | 'status_change';
  description: string;
  timestamp: string; // ISO string
  userId?: string;
  payloadBefore?: any;
  payloadAfter?: any;
}
