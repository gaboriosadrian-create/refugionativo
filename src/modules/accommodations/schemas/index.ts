import { 
  AccommodationCapacity, 
  Pricing, 
  AccommodationPolicy, 
  AccommodationGallery, 
  AccommodationLocation 
} from '../types';

export const ACCOMMODATION_CONSTRAINTS = {
  SLUG: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },
  NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100
  },
  CURRENCIES: ['ARS', 'USD', 'BRL', 'EUR', 'CLP', 'UYU'],
  TIME_FORMAT: /^([01]\d|2[0-3]):[0-5]\d$/
};

export const DEFAULT_CAPACITY: AccommodationCapacity = {
  adults: 2,
  children: 0,
  babies: 0,
  pets: 0,
  maxGuests: 2
};

export const DEFAULT_PRICING = (currency = 'ARS'): Pricing => ({
  basePrice: 0,
  currency,
  taxIncluded: true,
  weekendPrice: undefined,
  minimumStay: 1,
  futureSeasonPricing: []
});

export const DEFAULT_LOCATION: AccommodationLocation = {
  address: '',
  city: '',
  province: '',
  country: 'Argentina',
  coordinates: undefined,
  mapUrl: ''
};

export const DEFAULT_POLICIES: AccommodationPolicy = {
  checkIn: '14:00',
  checkOut: '10:00',
  smoking: false,
  pets: false,
  children: true,
  cancellation: 'Cancelación gratuita hasta 7 días antes de la llegada.'
};

export const DEFAULT_GALLERY: AccommodationGallery = {
  coverImage: '',
  images: []
};
