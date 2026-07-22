export type SaaSPlanType = 'Starter' | 'Professional' | 'Business' | 'Enterprise';

export interface CommercialPlan {
  id: SaaSPlanType;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  maxAccommodations: number;
  maxRooms: number;
  maxUsers: number;
  storageGB: number;
  supportLevel: 'Email' | 'Chat & Email' | '24/7 Priority Phone' | 'Dedicated Account Manager';
  integrations: string[];
  features: string[];
  active: boolean;
}

export interface CommercialLead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  accommodationType: 'CABIN' | 'HOTEL' | 'GLAMPING' | 'HOSTEL' | 'OTHER';
  roomCount: number;
  message?: string;
  status: 'Lead' | 'Demo' | 'Proposal' | 'Negotiation' | 'Cliente' | 'Inactivo';
  stageHistory: { stage: string; timestamp: string; note?: string }[];
  createdAt: string;
}

export interface CustomerOnboardingProgress {
  id: string; // Tenant ID
  userId: string;
  currentStep: number;
  profile: {
    fullName: string;
    phone: string;
    roleInCompany: string;
  };
  company: {
    legalName: string;
    taxId: string;
    billingAddress: string;
  };
  resort: {
    name: string;
    businessType: 'CABIN' | 'GLAMPING' | 'HOTEL' | 'HOSTEL';
    country: string;
    currency: string;
    timezone: string;
    email: string;
    phone: string;
  };
  rooms: {
    id: string;
    name: string;
    category: string;
    price: number;
    capacity: number;
  }[];
  branding: {
    logoUrl?: string;
    logoIcon: string;
    primaryColor: string;
    secondaryColor: string;
  };
  domain: {
    requestedSubdomain: string;
    customDomain?: string;
    status: 'pending' | 'active' | 'failed';
  };
  payments: {
    selectedPlan: SaaSPlanType;
    billingCycle: 'monthly' | 'yearly';
    paymentMethodPlaceholder?: string;
  };
  completed: boolean;
  updatedAt: string;
}

export interface BillingProfile {
  id: string; // Tenant ID
  tenantName: string;
  planId: SaaSPlanType;
  status: 'active' | 'past_due' | 'unpaid' | 'cancelled';
  trialEndDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  currency: string;
  paymentMethod: {
    brand: string;
    last4: string;
  };
  invoices: {
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    pdfUrl?: string;
  }[];
}

export interface CommercialMetrics {
  totalLeads: number;
  totalDemos: number;
  conversionRate: number; // percentage
  mrr: number;
  arr: number;
  churnRate: number; // percentage
  activeClientsCount: number;
  demosScheduledCount: number;
  planDistribution: Record<SaaSPlanType, number>;
  monthlyRevenueHistory: { month: string; revenue: number }[];
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: SaaSPlanType;
  status: 'active' | 'past_due' | 'unpaid' | 'cancelled' | 'suspended' | 'trial';
  startDate: string;
  endDate: string;
  trialStartDate?: string;
  trialEndDate?: string;
  trialDurationDays: number;
  amount: number;
  billingPeriod: 'monthly' | 'yearly';
  currency: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface License {
  id: string;
  tenantId: string;
  planId: SaaSPlanType;
  status: 'active' | 'suspended' | 'expired' | 'trial';
  startDate: string;
  endDate: string;
  maxAccommodations: number;
  maxRooms: number;
  maxUsers: number;
  storageGB: number;
  enabledModules: string[];
  supportLevel: string;
  updatedAt: string;
}

export interface BillingAccount {
  id: string; // Tenant ID
  tenantId: string;
  companyName: string;
  taxId: string;
  billingAddress: string;
  country: string;
  currency: string;
  email: string;
  phone: string;
  paymentProvider: 'stripe' | 'mercadopago' | 'paypal' | 'none';
  paymentMethod?: {
    brand: string;
    last4: string;
  };
  credits: number;
  updatedAt: string;
}

export interface BillingHistory {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  date: string;
  dueDate: string;
  paidAt?: string;
  pdfUrl?: string;
  discountCode?: string;
  items: { description: string; amount: number }[];
}

export interface BillingEvent {
  id: string;
  tenantId: string;
  eventType: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' | 'payment_succeeded' | 'payment_failed' | 'license_expired' | 'account_suspended' | 'account_reactivated' | 'trial_started' | 'trial_converted';
  details: string;
  timestamp: string;
  metadata?: any;
}

export interface PaymentAttempt {
  id: string;
  tenantId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'mercadopago' | 'paypal';
  status: 'success' | 'failed' | 'retry_scheduled';
  errorCode?: string;
  errorMessage?: string;
  attemptNumber: number;
  nextRetryDate?: string;
  timestamp: string;
}

export interface FinancialMetrics {
  id: string;
  mrr: number;
  arr: number;
  churn: number;
  ltv: number;
  arpu: number;
  activeCount: number;
  trialCount: number;
  suspendedCount: number;
  monthlyBilling: number;
  yearlyBilling: number;
  byPlan: Record<string, number>;
  byCountry: Record<string, number>;
  timestamp: string;
}

export interface TrialAccount {
  id: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  convertedToPaid: boolean;
  convertedAt?: string;
  cancelledAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate: string;
  active: boolean;
  maxRedemptions?: number;
  redemptionsCount: number;
}
