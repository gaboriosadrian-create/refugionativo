export interface Season {
  id: string;
  resortId: string;
  name: string;
  color: string; // hex or tailwind class name
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  priority: number; // For overlapping resolutions, higher is more important
  status: 'active' | 'inactive';
  description: string;
  createdAt: string;
  updatedAt: string;
  basePrice?: number; // Base rate for this season
  cabinRates?: Record<string, number>; // Specific rate override per cabin ID
}

export interface Promotion {
  id: string;
  resortId: string;
  name: string;
  description: string;
  type: 'percent' | 'fixed' | 'free_nights';
  value: number; // percentage (e.g., 15 for 15%), flat discount amount, or number of free nights
  minNightsRequired: number; // minimum stay nights to apply
  freeNightsConfig?: {
    multiplier: number; // e.g. buy 3, get 1 free (so multiplier = 3)
  };
  startDate?: string; // start validity date
  endDate?: string; // end validity date
  promoCode?: string; // optional promo code structure
  status: 'active' | 'inactive';
  cabinIds?: number[]; // list of cabin IDs this applies to (empty/undefined = all)
  createdAt: string;
  updatedAt: string;
}

export interface Surcharge {
  id: string;
  resortId: string;
  name: 'cleaning' | 'pet' | 'early_checkin' | 'late_checkout' | 'extra_service' | 'other';
  label: string; // display name
  calcType: 'fixed' | 'percentage' | 'per_night' | 'per_guest' | 'per_guest_per_night';
  value: number; // rate or flat fee
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tax {
  id: string;
  resortId: string;
  name: string; // e.g. "IVA", "City Tax"
  rate: number; // e.g. 21 for 21%
  type: 'percentage' | 'fixed_per_night' | 'fixed_per_person' | 'fixed_per_booking';
  country: string; // country code e.g. "ES", "AR", "CL"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyRateConfig {
  id: string;
  resortId: string;
  seasonId?: string; // applies only to specific season
  cabinId?: number; // applies only to specific cabin
  rates: {
    1: number; // Mon rate override or multiplier
    2: number; // Tue
    3: number; // Wed
    4: number; // Thu
    5: number; // Fri
    6: number; // Sat
    0: number; // Sun
  };
  type: 'fixed' | 'multiplier' | 'percentage'; // fixed override, multiplier (e.g. 1.2), or percentage increase (e.g. 20 for +20%)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RatePlan {
  id: string;
  resortId: string;
  name: string;
  description: string;
  cabinIds?: number[]; // list of cabin IDs this rate plan applies to (empty/undefined = all)
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type PriceRuleType = 
  | 'base_price' // Overrides or sets base price per night
  | 'person_price' // Direct price per person
  | 'additional_guest' // Fee for guests exceeding a threshold
  | 'cleaning_fee' // Flat cleaning fee per booking
  | 'pet_fee' // Flat pet fee per booking
  | 'fixed_fee' // General flat fee per booking
  | 'discount_percent' // Percentage discount on base nightly subtotal
  | 'discount_amount' // Fixed discount amount
  | 'surcharge_percent' // Percentage surcharge on nightly base subtotal
  | 'surcharge_amount'; // Fixed surcharge amount

export interface PriceRule {
  id: string;
  resortId: string;
  ratePlanId: string; // Associated RatePlan
  seasonId?: string; // Optional: Only applies during this Season
  type: PriceRuleType;
  value: number; // numeric value (price, percentage, or flat fee)
  appliesToGuestsFrom?: number; // threshold for 'additional_guest' rule
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface MinimumStayRule {
  id: string;
  resortId: string;
  cabinId?: number; // Optional: applies to specific cabin
  seasonId?: string; // Optional: applies to specific season
  daysOfWeek?: number[]; // Optional: 0 = Sun, 1 = Mon, ..., 6 = Sat
  minNights: number;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface NightlyBreakdownItem {
  date: string;
  basePrice: number;
  seasonName?: string;
  seasonColor?: string;
  finalPrice: number;
  explanation: string;
}

export interface PricingResult {
  totalPrice: number;
  basePrice: number; // Original nightly sum
  nightlyBreakdown: NightlyBreakdownItem[];
  appliedSeason?: Season;
  appliedRatePlan?: RatePlan;
  discountsTotal: number;
  feesTotal: number;
  taxesTotal: number;
  explanation: string[];
}

export interface PricingHistory {
  id: string;
  resortId: string;
  bookingId?: number;
  cabinId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  petsCount: number;
  result: PricingResult;
  calculatedAt: string;
}

export interface OccupancyRule {
  id: string;
  resortId: string;
  ratePlanId: string;
  minOccupancy: number; // e.g. 2
  basePriceForMinOccupancy: number; // base rate for min occupancy
  extraGuestFee: number; // cost per extra guest
  maxOccupancy: number; // max occupancy allowed
  childRateMultiplier?: number; // structure for minor rate multiplier
  childRateFlat?: number; // structure for minor flat rate
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

