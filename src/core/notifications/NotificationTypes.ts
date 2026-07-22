export enum NotificationEvent {
  BOOKING_CREATED = 'booking_created',
  BOOKING_CONFIRMED = 'booking_confirmed',
  PAYMENT_APPROVED = 'payment_approved',
  PAYMENT_REJECTED = 'payment_rejected',
  CHECKIN_UPCOMING = 'checkin_upcoming',
  CHECKIN_COMPLETED = 'checkin_completed',
  CHECKOUT_UPCOMING = 'checkout_upcoming',
  CHECKOUT_COMPLETED = 'checkout_completed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_CHANGED = 'booking_changed',
  PRICING_CHANGED = 'pricing_changed',
  USER_CREATED = 'user_created',
  PLAN_CHANGED = 'plan_changed',
  TENANT_SUSPENDED = 'tenant_suspended',
  SUBSCRIPTION_RENEWED = 'subscription_renewed'
}

export enum NotificationChannel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  PUSH = 'push',
  INTERNAL = 'internal',
  WEBHOOK = 'webhook'
}

export enum NotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled'
}

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  name: string;
  subject?: string;
  title?: string;
  content: string; // Dynamic content using template variables {{var}}
  language: string; // e.g. 'es', 'en', 'pt'
  version: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  tenantId: string;
  language: string; // Default template language
  enabledChannels: NotificationChannel[];
  appName?: string;
  signature?: string;
  logo?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  allowedHoursStart?: string; // e.g. "08:00"
  allowedHoursEnd?: string; // e.g. "22:00"
  retryConfig?: {
    maxAttempts: number;
    backoffExponential: boolean;
    initialIntervalSeconds: number;
  };
}

export interface NotificationQueueItem {
  id: string;
  tenantId: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient: string; // email address, phone number, token, or webhook url
  subject?: string;
  title?: string;
  content: string;
  variables: Record<string, any>;
  scheduledFor: string; // ISO string when it should be sent
  status: NotificationStatus;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: string;
  error?: string;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  tenantId: string;
  queueItemId?: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient: string;
  status: NotificationStatus;
  subject?: string;
  content: string;
  attempts: number;
  sentAt?: string;
  error?: string;
  latencyMs?: number;
  createdAt: string;
}

export interface NotificationStats {
  sentCount: number;
  pendingCount: number;
  failedCount: number;
  queuedCount: number;
  retryingCount: number;
  totalCount: number;
  averageLatencyMs: number;
  channelDistribution: Record<NotificationChannel, number>;
  dailyTrend: {
    date: string;
    sent: number;
    failed: number;
  }[];
}
