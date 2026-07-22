import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';
import { isFirebaseConfigured } from '../firebase/firebase';
import { saveDocument } from '../firebase/firestore';

export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  message: string;
  context?: Record<string, any>;
  userId?: string | null;
  resortId?: string | null;
  count?: number; // For error grouping
  lastOccurrence?: string;
}

export class LoggerService {
  private static PREFIX = '[STAYFLOW_OBSERVABILITY]';
  private static LOGS_KEY = 'saas_platform_logs';
  private static REPEATED_ERRORS_KEY = 'saas_grouped_errors';

  /**
   * Log a centralized system event
   */
  public static async log(
    severity: LogSeverity,
    message: string,
    context?: Record<string, any>,
    resortId?: string | null,
    userId?: string | null
  ): Promise<LogEntry> {
    const timestamp = new Date().toISOString();
    
    // Create base entry
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      timestamp,
      severity,
      message,
      context,
      userId,
      resortId,
    };

    // 1. Terminal / Console output based on severity
    const consoleMsg = `${this.PREFIX} [${severity}] ${message}`;
    switch (severity) {
      case 'DEBUG':
        if (process.env.NODE_ENV !== 'production') {
          console.debug(consoleMsg, context || '');
        }
        break;
      case 'INFO':
        console.info(consoleMsg, context || '');
        break;
      case 'WARN':
        console.warn(consoleMsg, context || '');
        break;
      case 'ERROR':
      case 'CRITICAL':
        console.error(consoleMsg, context || '');
        break;
    }

    // 2. Error tracking / Grouping for ERROR and CRITICAL logs
    if (severity === 'ERROR' || severity === 'CRITICAL') {
      this.trackAndGroupError(entry);
    }

    // 3. Persistent Storage
    try {
      const logs = LocalSaaSDb.get<LogEntry[]>(this.LOGS_KEY) || [];
      logs.unshift(entry);
      // Cap at 1000 platform logs in localStorage to keep it lightweight
      if (logs.length > 1000) {
        logs.pop();
      }
      LocalSaaSDb.set(this.LOGS_KEY, logs);

      if (isFirebaseConfigured) {
        // Save to global platformLogs collection in Firestore if connected
        await saveDocument(`platformLogs/${entry.id}`, entry);
      }
    } catch (err) {
      console.warn('[LoggerService] Failed to persist log entry:', err);
    }

    return entry;
  }

  public static async debug(message: string, context?: Record<string, any>, resortId?: string | null, userId?: string | null): Promise<LogEntry> {
    return this.log('DEBUG', message, context, resortId, userId);
  }

  public static async info(message: string, context?: Record<string, any>, resortId?: string | null, userId?: string | null): Promise<LogEntry> {
    return this.log('INFO', message, context, resortId, userId);
  }

  public static async warn(message: string, context?: Record<string, any>, resortId?: string | null, userId?: string | null): Promise<LogEntry> {
    return this.log('WARN', message, context, resortId, userId);
  }

  public static async error(message: string, context?: Record<string, any>, resortId?: string | null, userId?: string | null): Promise<LogEntry> {
    return this.log('ERROR', message, context, resortId, userId);
  }

  public static async critical(message: string, context?: Record<string, any>, resortId?: string | null, userId?: string | null): Promise<LogEntry> {
    return this.log('CRITICAL', message, context, resortId, userId);
  }

  /**
   * Retrieves all logs
   */
  public static getLogs(): LogEntry[] {
    return LocalSaaSDb.get<LogEntry[]>(this.LOGS_KEY) || [];
  }

  /**
   * Clear logs
   */
  public static clearLogs(): void {
    LocalSaaSDb.set(this.LOGS_KEY, []);
    LocalSaaSDb.set(this.REPEATED_ERRORS_KEY, []);
  }

  /**
   * Group repeated errors to prevent log flooding
   */
  private static trackAndGroupError(entry: LogEntry): void {
    const grouped = LocalSaaSDb.get<Record<string, LogEntry>>(this.REPEATED_ERRORS_KEY) || {};
    // Use the message as key to group duplicates
    const key = entry.message;
    if (grouped[key]) {
      grouped[key].count = (grouped[key].count || 1) + 1;
      grouped[key].lastOccurrence = entry.timestamp;
      grouped[key].context = entry.context; // Keep latest context
    } else {
      grouped[key] = {
        ...entry,
        count: 1,
        lastOccurrence: entry.timestamp
      };
    }
    LocalSaaSDb.set(this.REPEATED_ERRORS_KEY, grouped);
  }

  /**
   * Retrieves grouped errors
   */
  public static getGroupedErrors(): LogEntry[] {
    const grouped = LocalSaaSDb.get<Record<string, LogEntry>>(this.REPEATED_ERRORS_KEY) || {};
    return Object.values(grouped).sort((a, b) => (b.count || 0) - (a.count || 0));
  }
}

export default LoggerService;
