import { Config } from '../config/Config';
import { isFirebaseConfigured } from '../firebase/firebase';
import { MetricsService, PerformanceMetric } from './MetricsService';
import { HealthService, HealthReport } from './HealthService';
import { LoggerService } from './LoggerService';

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  labels?: Record<string, string>;
}

export interface HealthComponentStatus {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  message?: string;
  latencyMs?: number;
}

export interface HealthStatusReport {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  timestamp: string;
  environment: string;
  components: {
    database: HealthComponentStatus;
    authentication: HealthComponentStatus;
    localStorage: HealthComponentStatus;
    configuration: HealthComponentStatus;
  };
}

export interface DiagnosticInfo {
  browserAgent: string;
  screenResolution: string;
  connectionStatus: 'online' | 'offline';
  localStorageQuotaUsedBytes: number;
  firebaseActive: boolean;
  activeFeatures: string[];
}

export class ObservabilityService {
  /**
   * Record a performance or business metric for diagnostic analysis
   */
  public static recordMetric(name: string, value: number, unit: string, labels?: Record<string, string>): void {
    MetricsService.recordMetric(name, value, unit, labels);
  }

  /**
   * Retrieves all recorded metrics in memory
   */
  public static getMetrics(): SystemMetric[] {
    const rawMetrics = MetricsService.getMetrics();
    return rawMetrics.map(m => ({
      name: m.name,
      value: m.value,
      unit: m.unit,
      timestamp: m.timestamp,
      labels: m.labels,
    }));
  }

  /**
   * Runs a quick system health check diagnostic
   */
  public static async checkHealth(): Promise<HealthStatusReport> {
    const start = Date.now();
    const detailedHealth = await HealthService.runDiagnostics();

    // Adapt to legacy output structure to prevent breaking any component
    let localDbStatus: 'UP' | 'DOWN' = 'UP';
    try {
      localStorage.setItem('__health_check__', '1');
      localStorage.removeItem('__health_check__');
    } catch {
      localDbStatus = 'DOWN';
    }

    const report: HealthStatusReport = {
      status: detailedHealth.overallStatus === 'ONLINE' ? 'UP' : 'DEGRADED',
      timestamp: detailedHealth.timestamp,
      environment: Config.environment,
      components: {
        database: {
          status: isFirebaseConfigured ? 'UP' : 'DEGRADED',
          message: isFirebaseConfigured 
            ? 'Firebase Firestore is configured and operational.' 
            : 'SaaS running on Local Persistence (Firebase Config missing).',
          latencyMs: isFirebaseConfigured ? Date.now() - start : 0,
        },
        authentication: {
          status: 'UP',
          message: isFirebaseConfigured ? 'Firebase Auth active' : 'Mock authentication active',
        },
        localStorage: {
          status: localDbStatus,
          message: localDbStatus === 'UP' ? 'Local storage read/write active.' : 'Local storage unavailable.',
        },
        configuration: {
          status: 'UP',
          message: `Tenant limit: ${Config.limits.maxGuestsPerAccommodation} max guests, SaaS Active: ${Config.features.enableSaaS}`,
        }
      }
    };

    return report;
  }

  /**
   * Generates a technical diagnosis report for frontend client and tenant state
   */
  public static getDiagnostics(): DiagnosticInfo {
    let localStorageBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          localStorageBytes += (localStorage.getItem(key) || '').length * 2;
        }
      }
    } catch {
      // Ignored
    }

    const activeFeatures: string[] = [];
    if (Config.features.enableSaaS) activeFeatures.push('SaaS');
    if (Config.features.enableGallery) activeFeatures.push('Gallery');
    if (Config.features.enableReviews) activeFeatures.push('Reviews');
    if (Config.features.enablePromotions) activeFeatures.push('Promotions');
    if (Config.features.enableAuditLogs) activeFeatures.push('AuditLogs');

    return {
      browserAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      connectionStatus: navigator.onLine ? 'online' : 'offline',
      localStorageQuotaUsedBytes: localStorageBytes,
      firebaseActive: isFirebaseConfigured,
      activeFeatures,
    };
  }
}

export default ObservabilityService;
