export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  lastLogin: string;
  createdAt: string;
  active: boolean;
}

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'STAFF' | 'RECEPTIONIST' | 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';

export interface Resort {
  id: string;
  name: string;
  slug: string;
  businessType: 'CABIN' | 'HOTEL' | 'GLAMPING' | 'CAMPING' | 'OTHER';
  plan: 'free' | 'pro' | 'enterprise';
  active: boolean;
  logo?: string;
  coverImage?: string;
  email: string;
  phone: string;
  website?: string;
  domain?: string;
  country: string;
  timezone: string;
  currency: string;
  language: string;
  createdAt: string;
}

export interface ResortUser {
  id: string;
  userId: string;
  resortId: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface AppSettings {
  appName: string;
  appSubtitle: string;
  logoIcon: string; // e.g. "trees", "tent", "mountain", "palmtree", "compass"
  address: string;
  locationDetails: string;
  googleMapsLink: string;
  hours: string;
  phone: string;
  whatsapp: string;
  email: string;
  // SaaS and Branding settings
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  seo?: {
    title: string;
    description: string;
    keywords: string;
  };
  terminology?: {
    singular: string; // e.g., "Cabaña", "Habitación", "Domo"
    plural: string; // e.g., "Cabañas", "Habitaciones", "Domos"
  };
}

export interface AccommodationType {
  id: string;
  displayName: string;
  icon: string;
  defaultAmenities: string[];
  customFields: {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean';
  }[];
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string; // Lucide icon name, e.g. "Wifi", "Flame", "Tv"
  category?: string; // e.g. "General", "Cocina", "Exterior", "Servicios"
}

// Replaces Cabin
export interface Accommodation {
  id: number; // compatible with existing numeric IDs
  name: string;
  slug?: string;
  type?: string; // cabin, hotel_room, glamping_dome, etc.
  status?: 'available' | 'maintenance' | 'occupied' | 'inactive';
  description: string;
  shortDescription?: string;
  price: number;
  discount: number; // percentage (0 to 100)
  offer: string; // e.g. "Escapada romántica"
  category: 'couples' | 'family' | 'luxury' | 'standard';
  capacity: number;
  maxGuests?: number;
  minGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  squareMeters?: number;
  rating: number;
  image: string; // compatibility with existing components
  images?: string[];
  amenities?: string[];
  customFields?: Record<string, any>;
  featured?: boolean;
  active?: boolean;
  location?: string;
  coordinates?: { lat: number; lng: number };
  tags?: string[];
  policies?: {
    checkInTime?: string;
    checkOutTime?: string;
    rules?: string[];
    cancellationPolicy?: string;
  };
  seasonPrices?: {
    seasonName: string;
    priceMultiplier: number;
    priceOverride?: number;
  }[];
  availabilityBlockedDates?: string[];
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

// Keep type alias for backwards compatibility
export type Cabin = Accommodation;

import { GuestSnapshot } from './modules/guests/types';

export interface Booking {
  id: number;
  cabinId: number; // compatible with existing code
  accommodationId?: number; // SaaS alignment
  name: string;
  phone: string;
  email?: string;
  guests: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'in_house' | 'checked_out' | 'completed' | 'no_show' | 'pending_approval' | 'expired';
  totalPrice: number;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  guestId?: string;
  guestSnapshot?: GuestSnapshot;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  image: string;
}

export interface Availability {
  id: string;
  date: string; // YYYY-MM-DD
  accommodationId: number;
  status: 'available' | 'blocked' | 'reserved';
  priceOverride?: number;
  minimumStay?: number;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  active: boolean;
  updatedAt: string;
}

export interface Review {
  id: string;
  accommodationId: number;
  guestName: string;
  rating: number;
  comment: string;
  date: string;
  approved: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  active: boolean;
  startDate: string;
  endDate: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  path: string;
  fileName: string;
  size?: number;
  width?: number;
  height?: number;
  createdAt: string;
}
