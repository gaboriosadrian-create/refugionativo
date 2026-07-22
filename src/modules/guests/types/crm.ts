import { Guest } from './index';

export interface GuestProfile extends Guest {
  nationality: string;
  profession?: string;
}

export interface GuestTimelineEvent {
  id: string;
  resortId: string;
  guestId: string;
  type: 'booking' | 'payment' | 'message' | 'notification' | 'change' | 'incident' | 'observation' | 'check_in' | 'check_out';
  title: string;
  description: string;
  timestamp: string;
  createdBy: string;
  referenceId?: string; // e.g., bookingId or paymentId
  metadata?: Record<string, any>;
}

export interface GuestPreferences {
  id: string; // usually same as guestId
  resortId: string;
  guestId: string;
  favoriteRoomType?: string;
  preferredFloor?: string;
  preferredView?: string;
  bedType?: string;
  pillowType?: string;
  dietaryRestrictions?: string;
  hasPets: boolean;
  accessibilityNeeds?: string;
  favoriteDrinks?: string;
  remarks?: string;
  updatedAt: string;
}

export interface GuestTag {
  id: string;
  resortId: string;
  name: string;
  color: string; // hex or tailwind color class
  description?: string;
  createdAt: string;
}

export interface GuestSegment {
  id: string;
  resortId: string;
  name: string; // e.g., 'VIP', 'Frecuente', 'Larga Estadía'
  description: string;
  ruleType: 'auto' | 'manual';
  criteria?: {
    minBookings?: number;
    minRevenue?: number;
    minNights?: number;
    tagsRequired?: string[];
    isInternational?: boolean;
    hasSpecialNeeds?: boolean;
  };
  isActive: boolean;
}

export interface GuestHistoryRecord {
  id: string;
  resortId: string;
  guestId: string;
  eventType: 'booking_created' | 'booking_cancelled' | 'check_in' | 'check_out' | 'payment_received' | 'incident_reported' | 'profile_merged' | 'preference_updated';
  description: string;
  timestamp: string;
  performedBy: string;
  referenceId?: string;
  details?: string;
}

export interface GuestMetrics {
  id: string; // same as guestId
  resortId: string;
  guestId: string;
  bookingsCount: number;
  nightsStayed: number;
  totalRevenue: number;
  lastStayDate?: string;
  nextBookingDate?: string;
  preferredChannel?: string;
  frequency: number; // bookings per year or numeric ratio
  estimatedLtv: number; // Lifetime Value
  updatedAt: string;
}
