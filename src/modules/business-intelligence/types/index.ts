export type BIWidgetType = 
  | 'kpi_card' 
  | 'revenue_chart' 
  | 'occupancy_gauge' 
  | 'channel_distribution' 
  | 'property_comparison' 
  | 'segment_breakdown' 
  | 'forecast_projection' 
  | 'alerts_feed' 
  | 'cleaning_productivity';

export interface BIWidget {
  id: string;
  type: BIWidgetType;
  title: string;
  metric: string; // Key of KPI
  size: 'sm' | 'md' | 'lg' | 'full'; // grid width sizing
  visible: boolean;
  position: number;
}

export interface ExecutiveDashboard {
  id: string;
  resortId: string;
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: BIWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardLayout {
  id: string;
  resortId: string;
  userId: string;
  dashboardId: string;
  columns: number;
  widgetsOrder: string[]; // List of widget IDs
  updatedAt: string;
}

export type BusinessReportType = 'revenue' | 'occupancy' | 'operations' | 'guests' | 'custom';

export interface BusinessReport {
  id: string;
  resortId: string;
  userId: string;
  title: string;
  description?: string;
  reportType: BusinessReportType;
  metrics: string[]; // List of selected KPI keys
  filters: {
    startDate?: string;
    endDate?: string;
    propertyId?: string;
    roomType?: string;
    channel?: string;
    segment?: string;
    status?: string;
  };
  groupBy?: 'day' | 'week' | 'month' | 'property' | 'channel' | 'roomType' | 'segment';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  savedAt: string;
  isScheduled?: boolean;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly';
  scheduleRecipient?: string;
}

export interface BusinessMetric {
  id: string;
  resortId: string;
  timestamp: string;
  name: string;
  value: number;
  unit: string;
  labels?: Record<string, string>;
}

export interface ForecastModel {
  id: string;
  resortId: string;
  targetMetric: 'revenue' | 'occupancy' | 'demand';
  forecastDays: number;
  historicalPeriodDays: number;
  modelType: 'linear' | 'moving_average' | 'weighted_moving_average' | 'seasonal_naive';
  projections: {
    date: string;
    p50: number; // median projection
    p10: number; // pessimistic bound
    p90: number; // optimistic bound
  }[];
  confidenceScore: number; // 0 to 100
  createdAt: string;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface ExecutiveAlert {
  id: string;
  resortId: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  metricName: string;
  currentValue: number;
  thresholdValue: number;
  timestamp: string;
  resolved: boolean;
  recommendation: string;
  dismissed?: boolean;
}

export interface SavedView {
  id: string;
  resortId: string;
  userId: string;
  name: string;
  path: string; // URL or route
  state: any; // Serialized state parameters
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSnapshot {
  id: string;
  resortId: string;
  period: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate: string;
  endDate: string;
  kpis: {
    occupancy: number;
    adr: number;
    revpar: number;
    goppar: number;
    revenue: number;
    netRevenue: number;
    avgStay: number;
    avgBookingWindow: number;
    cancellationRate: number;
    repeatGuestRate: number;
    guestLifetimeValue: number;
    housekeepingProductivity: number; // tasks completed per hour/staff
    maintenanceCost: number;
    avgCleaningTime: number; // in minutes
    responseTime: number; // alert response time in seconds/mins
    otaDistribution: Record<string, number>; // e.g. { Direct: 45, Airbnb: 30, Booking: 25 }
    revenueByChannel: Record<string, number>;
    revenueByProperty: Record<string, number>;
    revenueByAccommodation: Record<string, number>;
    revenueByCountry: Record<string, number>;
    revenueBySegment: Record<string, number>;
  };
  generatedAt: string;
}
