export enum ChannelOta {
  BOOKING_COM = 'booking_com',
  AIRBNB = 'airbnb',
  EXPEDIA = 'expedia',
  VRBO = 'vrbo',
  GOOGLE_HOTELS = 'google_hotels'
}

export enum SyncStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export enum SyncPriority {
  HIGH = 'high', // e.g. immediate reservation imports
  MEDIUM = 'medium', // e.g. manual inventory syncs
  LOW = 'low' // e.g. bulk rate update cron-jobs
}

export interface ChannelRegistryEntry {
  ota: ChannelOta;
  name: string;
  version: string;
  active: boolean;
  capabilities: {
    syncRates: boolean;
    syncAvailability: boolean;
    syncRestrictions: boolean;
    importBookings: boolean;
    realtimePush: boolean;
  };
  lastHealthCheck?: string;
  healthStatus: 'online' | 'degraded' | 'offline';
}

export interface InventoryMapping {
  id: string;
  tenantId: string;
  ota: ChannelOta;
  stayflowCabinId: number; // references StayFlow Room/Cabin ID
  otaRoomId: string; // OTA identifier
  otaRoomName: string;
  active: boolean;
  createdAt: string;
}

export interface RateMapping {
  id: string;
  tenantId: string;
  ota: ChannelOta;
  stayflowRateId: string; // standard, weekend, promo
  otaRateId: string;
  markupPercent: number; // e.g. 15% markup to offset OTA commission
  active: boolean;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  tenantId: string;
  ota: ChannelOta;
  action: 'sync_availability' | 'sync_rates' | 'sync_restrictions' | 'import_booking';
  payload: Record<string, any>;
  priority: SyncPriority;
  status: SyncStatus;
  attempts: number;
  maxAttempts: number;
  scheduledFor: string;
  lastAttempt?: string;
  error?: string;
  latencyMs?: number;
  createdAt: string;
}

export interface SyncLog {
  id: string;
  tenantId: string;
  ota: ChannelOta;
  action: string;
  status: 'success' | 'failed';
  message: string;
  latencyMs: number;
  timestamp: string;
}

export interface ConflictReport {
  id: string;
  tenantId: string;
  ota: ChannelOta;
  type: 'overbooking' | 'duplicate_booking' | 'simultaneous_modification' | 'cross_cancellation';
  severity: 'warning' | 'critical';
  resolved: boolean;
  resolvedAt?: string;
  details: string;
  affectedCabinId: number;
  affectedBookingId?: string;
  otaBookingId?: string;
  timestamp: string;
}

export interface OtaReservation {
  otaBookingId: string;
  ota: ChannelOta;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  cabinId: number;
  totalPrice: number;
  paymentStatus: 'approved' | 'pending';
}
