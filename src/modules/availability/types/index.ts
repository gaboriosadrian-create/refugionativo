export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  BLOCKED = 'BLOCKED',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

export interface Availability {
  id: string;
  resortId: string;
  accommodationId: string | number;
  date: string; // YYYY-MM-DD
  status: AvailabilityStatus;
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export type BlockType = 'manual' | 'maintenance' | 'closure';

export interface AvailabilityBlock {
  id: string;
  resortId: string;
  accommodationId: string | number; // specific accommodation ID, or 'all' for all
  type: BlockType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AvailabilityRule {
  id: string;
  resortId: string;
  accommodationId: string | number; // specific ID or 'all'
  name: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  seasonName?: string; // e.g. "Temporada Alta", "Temporada Baja"
  daysOfWeek?: number[]; // 0-6 (0 is Sunday, etc.)
  
  // Rules criteria
  minStay?: number; // estadía mínima
  maxStay?: number; // estadía máxima
  minStayArrival?: number; // llegada mínima (min stay if check-in is on this day)
  minStayDeparture?: number; // salida mínima (min stay if check-out is on this day)
  closedToArrival?: boolean; // llegada deshabilitada
  closedToDeparture?: boolean; // salida deshabilitada
  minDaysInAdvance?: number; // llegada mínima con anticipación

  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface BlockedPeriod {
  id: string;
  resortId: string;
  accommodationId: string | number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface MaintenancePeriod {
  id: string;
  resortId: string;
  accommodationId: string | number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  description: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AvailabilityCalendar {
  accommodationId: string | number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: { [date: string]: Availability };
}

export interface ValidationResult {
  isValid: boolean;
  reason?: 'MIN_STAY_NOT_MET' | 'MAX_STAY_NOT_MET' | 'NO_AVAILABILITY' | 'BLOCKED' | 'MAINTENANCE' | 'CLOSED_TEMPORARILY' | 'CLOSED_TO_ARRIVAL' | 'CLOSED_TO_DEPARTURE' | 'MIN_ADVANCE_NOT_MET' | 'INVALID_DATES' | 'CAPACITY_EXCEEDED';
  message?: string;
}
