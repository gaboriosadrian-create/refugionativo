export type TicketStatus = 'Nuevo' | 'En revisión' | 'En progreso' | 'Esperando cliente' | 'Resuelto' | 'Cerrado';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'billing' | 'onboarding' | 'feedback' | 'other';

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  videoUrl?: string;
  steps?: string[];
  language: string; // 'es' | 'en' | etc.
  version: string;
  publishDate: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  views: number;
  helpfulCount: number;
  unhelpfulCount: number;
  faq?: boolean;
}

export interface KnowledgeArticle extends HelpArticle {
  aiSummary?: string;
  internalNotes?: string;
}

export interface TicketHistoryItem {
  timestamp: string;
  action: string;
  actor: string;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userEmail: string;
  userName: string;
  attachments?: string[];
  history: TicketHistoryItem[];
  firstResponseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  createdAt: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: 'client' | 'agent' | 'customer_success' | 'super_admin';
  isInternal?: boolean;
}

export type HealthStatus = 'Excelente' | 'Saludable' | 'En riesgo' | 'Crítico';

export interface CustomerHealth {
  id: string;
  tenantId: string;
  companyName: string;
  healthScore: number; // 0 to 100
  status: HealthStatus;
  usageFrequency: number; // logins or actions per week
  featureAdoptionRate: number; // percentage of modules used
  activeUsersCount: number;
  openIncidentsCount: number;
  renewalsProbability: number; // percentage
  satisfactionRate: number; // average CSAT (1-5) converted to percentage
  lastCalculated: string;
}

export interface Feedback {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  module: string; // e.g. 'bookings', 'payments', 'mobile'
  rating: number; // 1 to 5
  comment: string;
  suggestion?: string;
  createdAt: string;
}

export interface NpsResponse {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  score: number; // 0 to 10
  comment?: string;
  createdAt: string;
}

export interface CsatResponse {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  score: number; // 1 to 5
  comment?: string;
  createdAt: string;
}

export type IncidentSeverity = 'operational' | 'degraded' | 'partial_outage' | 'major_outage';

export interface StatusIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  createdAt: string;
  updatedAt: string;
  updates: {
    timestamp: string;
    message: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  }[];
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  module: string;
  completedAt?: string;
}

export interface OnboardingProgress {
  id: string; // tenantId
  tenantId: string;
  userId: string;
  progressPercentage: number;
  tasks: OnboardingTask[];
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  details: string;
}
