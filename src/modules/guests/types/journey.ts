export enum JourneyStage {
  BOOKED = 'BOOKED',
  PRE_CHECKIN = 'PRE_CHECKIN',
  CHECKIN_PENDING = 'CHECKIN_PENDING',
  CHECKED_IN = 'CHECKED_IN',
  IN_STAY = 'IN_STAY',
  CHECKOUT_PENDING = 'CHECKOUT_PENDING',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED'
}

export interface ArrivalInfo {
  address: string;
  mapUrl?: string;
  checkInTime: string;
  checkOutTime: string;
  wifiSsid: string;
  wifiPassword?: string;
  parkingInstructions?: string;
  accessCode?: string;
  contactPhone?: string;
}

export interface GuestJourney {
  id: string; // matches bookingId
  resortId: string;
  bookingId: string | number;
  guestId: string;
  stage: JourneyStage;
  arrivalInfo: ArrivalInfo;
  createdAt: string;
  updatedAt: string;
}

export interface PreCheckin {
  id: string; // matches bookingId or journeyId
  resortId: string;
  bookingId: string | number;
  guestId: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  nationality: string;
  address: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  status: 'pending' | 'completed';
  completedAt?: string;
}

export interface DigitalSignature {
  id: string;
  resortId: string;
  bookingId: string | number;
  guestId: string; // guestId or companionId
  signerName: string;
  signerType: 'primary' | 'companion';
  signatureData: string; // Base64 png/svg representation
  documentType: 'internal_rules' | 'privacy_policy' | 'terms_of_stay';
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface GuestDocument {
  id: string;
  resortId: string;
  bookingId: string | number;
  guestId: string; // guestId or companionId
  documentType: 'passport' | 'id_card' | 'driver_license' | 'other';
  side: 'front' | 'back' | 'all';
  fileUrl: string; // File path or base64
  fileName: string;
  uploadedAt: string;
}

export interface Companion {
  id: string;
  resortId: string;
  bookingId: string | number;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  nationality: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  preCheckinStatus: 'pending' | 'completed';
}

export interface GuestSurvey {
  id: string;
  resortId: string;
  bookingId: string | number;
  guestId: string;
  overallRating: number; // 1-5
  cleanlinessRating: number; // 1-5
  serviceRating: number; // 1-5
  facilitiesRating: number; // 1-5
  comments: string;
  submittedAt: string;
}

export interface CheckinAudit {
  id: string;
  resortId: string;
  bookingId: string | number;
  action: string;
  performedBy: string; // e.g., 'guest', 'system', 'receptionist'
  timestamp: string;
  details: string;
}
