export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'refunded';

export interface PaymentHistoryEvent {
  id: string;
  status: PaymentStatus;
  message: string;
  timestamp: string;
  payload?: any; // To store third-party provider response payload securely for auditing
}

export interface Payment {
  id: string; // e.g. pay_123456789
  resortId: string;
  bookingId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string; // 'mercado_pago' | 'stripe' | 'bank_transfer' etc.
  externalId?: string; // Transaction ID from Mercado Pago or Stripe
  paymentUrl?: string; // Redirect link for the user
  history: PaymentHistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentConfig {
  provider: string;
  enabled: boolean;
  sandboxMode: boolean;
  publicKey?: string;
  // Private keys (accessToken) should NOT be exposed to the client or stored in Firestore.
  // They are accessed via environment variables server-side.
}
