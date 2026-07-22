export enum CommercialRuleType {
  DEMAND = 'demand',
  SEASON = 'season',
  DAY_OF_WEEK = 'day_of_week',
  CALENDAR_EVENT = 'calendar_event',
  OCCUPANCY = 'occupancy',
  LEAD_TIME = 'lead_time',
  LAST_MINUTE = 'last_minute'
}

export enum CommercialAdjustmentType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  MIN_STAY = 'min_stay',
  AVAILABILITY = 'availability'
}

export interface RevenueRule {
  id: string;
  resortId: string;
  name: string;
  description: string;
  type: CommercialRuleType;
  isActive: boolean;
  conditions: {
    occupancyThresholdPct?: number; // e.g. 80 (for rules triggered >80% or <20%)
    occupancyComparison?: 'greater' | 'less'; // greater, less
    daysMin?: number; // for lead time
    daysMax?: number; // for last minute
    dayOfWeek?: number[]; // [0, 6] for weekend (Sunday=0, Saturday=6)
    seasonId?: string; // e.g. "season_alta_default"
    calendarEventType?: string; // e.g. "holiday", "congress", "event"
  };
  adjustmentType: CommercialAdjustmentType;
  adjustmentValue: number; // e.g. +15 for 15% increase, -10 for fixed discount, or number of nights for min_stay
  createdAt: string;
  updatedAt: string;
}

export interface CommercialCalendarEvent {
  id: string;
  resortId: string;
  title: string;
  type: 'holiday' | 'event' | 'festival' | 'congress' | 'vacation' | 'season';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  impact: 'high' | 'medium' | 'low';
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PricingRecommendation {
  id: string;
  resortId: string;
  date: string; // YYYY-MM-DD target date or range start
  endDate?: string; // YYYY-MM-DD range end
  type: 'increase_rate' | 'decrease_rate' | 'create_promo' | 'apply_discount' | 'increase_min_stay' | 'decrease_min_stay' | 'close_availability' | 'open_availability';
  accommodationId: number | 'all';
  originalValue: number | string;
  recommendedValue: number | string;
  reason: string;
  appliedRules: string[]; // names or IDs of the commercial rules applied
  expectedImpact: string; // e.g., "+$45,000 Revenue / +8% Occupancy"
  confidence: number; // percentage, e.g. 92 (92% confidence)
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricingSimulation {
  id: string;
  resortId: string;
  name: string;
  description: string;
  priceAdjustmentPct: number; // e.g. +12 (12% price increase)
  occupancyElasticity: number; // e.g. -0.5
  baseRevenue: number;
  baseOccupancy: number; // percentage, e.g. 65
  baseAdr: number;
  baseRevPar: number;
  simulatedRevenue: number;
  simulatedOccupancy: number;
  simulatedAdr: number;
  simulatedRevPar: number;
  createdBy: string;
  createdAt: string;
}

export interface RevenueMetric {
  id: string; // e.g. "metric_date_resortId"
  resortId: string;
  date: string; // YYYY-MM-DD
  occupancyPct: number;
  adr: number;
  revPar: number;
  revenue: number;
  pickupBookings: number;
  pickupRevenue: number;
  cancellations: number;
  createdAt: string;
}

export interface RevenueHistoryItem {
  id: string;
  resortId: string;
  action: string; // e.g., "Aprobación de Recomendación", "Creación de Regla", "Ejecución de Simulación"
  details: string;
  performedBy: string;
  timestamp: string;
  createdAt?: string;
}

export interface RevenueAlert {
  id: string;
  resortId: string;
  title: string;
  description: string;
  type: 'low_occupancy' | 'critical_occupancy' | 'rate_out_of_range' | 'booking_drop' | 'excessive_cancellations' | 'high_demand' | 'commercial_opportunity';
  severity: 'info' | 'warning' | 'critical';
  isResolved: boolean;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface CommercialKPIs {
  id: string; // "kpi_general_resortId" or periodic
  resortId: string;
  adr: number;
  revPar: number;
  occupancy: number; // 0 to 100
  revenue: number;
  pickup: number; // new bookings in past 7 days
  bookingPace: number; // e.g. +5% vs last month
  alos: number; // average length of stay
  cancellationRate: number; // 0 to 100
  leadTime: number; // average days in advance
  revenuePerGuest: number;
  ltv: number; // lifetime value average per client
  updatedAt: string;
  createdAt?: string;
}
