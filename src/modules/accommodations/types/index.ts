export type AccommodationStatus = 'available' | 'maintenance' | 'occupied' | 'inactive';

export interface AccommodationCapacity {
  adults: number;
  children: number;
  babies: number;
  pets: number;
  maxGuests: number;
}

export interface SeasonPricing {
  seasonName: string;
  priceMultiplier: number;
  priceOverride?: number;
  startDate?: string;
  endDate?: string;
}

export interface Pricing {
  basePrice: number;
  currency: string;
  taxIncluded: boolean;
  weekendPrice?: number;
  minimumStay?: number;
  futureSeasonPricing?: SeasonPricing[];
}

export interface AccommodationLocation {
  address: string;
  city: string;
  province: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  mapUrl?: string;
}

export interface AccommodationPolicy {
  checkIn: string; // Clock format "14:00"
  checkOut: string; // Clock format "10:00"
  smoking: boolean;
  pets: boolean;
  children: boolean;
  cancellation: string;
}

export interface GalleryImageMetadata {
  url: string;
  title?: string;
  alt?: string;
  sortOrder?: number;
}

export interface AccommodationGallery {
  coverImage: string;
  images: GalleryImageMetadata[];
}

export interface CustomField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
  value: string | number | boolean | null;
}

export interface AccommodationTypeField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
}

export interface AccommodationType {
  id: string;
  resortId: string;
  displayName: string;
  icon: string;
  defaultAmenities: string[];
  customFields: AccommodationTypeField[];
}

export interface Amenity {
  id: string;
  resortId: string;
  name: string;
  icon?: string;
  category?: string;
}

export interface Accommodation {
  id: string | number;
  resortId: string;
  slug: string;
  name: string;
  typeId: string;
  status: AccommodationStatus;
  description: string;
  shortDescription?: string;
  capacity: AccommodationCapacity;
  pricing: Pricing;
  gallery: AccommodationGallery;
  amenities: string[]; // List of Amenity IDs
  policies: AccommodationPolicy;
  location: AccommodationLocation;
  customFields: Record<string, string | number | boolean | null>;
  featured: boolean;
  visible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}
