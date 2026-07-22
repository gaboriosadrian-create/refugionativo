import { isFirebaseConfigured } from '../firebase/firebase';
import { saveDocument } from '../firebase/firestore';
import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';

export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  message: string;
  context?: Record<string, any>;
  userId?: string | null;
  resortId?: string | null;
}

export class LoggingService {
  private static prefix = '[STAYFLOW_SaaS]';

  /**
   * General log execution
   */
  public static async log(
    severity: LogSeverity,
    message: string,
    context?: Record<string, any>,
    resortId?: string | null,
    userId?: string | null
  ): Promise<void> {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      severity,
      message,
      context,
      userId,
      resortId,
    };

    // 1. Console Output based on severity
    const logMsg = `${this.prefix} [${severity}] ${message}`;
    switch (severity) {
      case 'DEBUG':
        if (process.env.NODE_ENV !== 'production') {
          console.debug(logMsg, context || '');
        }
        break;
      case 'INFO':
        console.info(logMsg, context || '');
        break;
      case 'WARN':
        console.warn(logMsg, context || '');
        break;
      case 'ERROR':
      case 'CRITICAL':
        console.error(logMsg, context || '');
        break;
    }

    // 2. Persistent Storage for Observability
    try {
      if (isFirebaseConfigured && resortId) {
        // Safe lazy save to system logs collection inside the resort
        await saveDocument(`resorts/${resortId}/system_logs/${entry.id}`, entry);
      } else {
        const key = resortId ? `logs_${resortId}` : 'logs_global';
        const existingLogs = LocalSaaSDb.get<LogEntry[]>(key) || [];
        existingLogs.push(entry);
        // Cap the local logs list to avoid filling localStorage
        if (existingLogs.length > 500) {
          existingLogs.shift();
        }
        LocalSaaSDb.set(key, existingLogs);
      }
    } catch (err) {
      console.warn('[STAYFLOW] Failed to persist log entry:', err);
    }
  }

  public static async debug(message: string, context?: Record<string, any>, resortId?: string | null, userId?: string | null): Promise<void> {
    await this.log('DEBUG', message, context, resortId, userId);
  }

  public static async info(message: string, context?: Record<string, any>, resortId?: string | null, userId?: string | null): Promise<void> {
    await this.log('INFO', message, context, resortId, userId);
  }

  public static async warn(message: string, context?: Record<string, any>, resortId?: string | null, userId?: string | null): Promise<void> {
    await this.log('WARN', message, context, resortId, userId);
  }

  public static async error(message: string, context?: Record<string, any>, resortId?: string | null, userId?: string | null): Promise<void> {
    await this.log('ERROR', message, context, resortId, userId);
  }

  public static async critical(message: string, context?: Record<string, any>, resortId?: string | null, userId?: string | null): Promise<void> {
    await this.log('CRITICAL', message, context, resortId, userId);
  }

  /**
   * Specific helper to register critical system events (creates, cancellations, check-ins, etc.)
   */
  public static async registerCriticalAction(
    action: string,
    resortId: string,
    userId: string,
    entityId: string | number,
    details?: Record<string, any>
  ): Promise<void> {
    const msg = `Critical Action: ${action} on entity ${entityId}`;
    await this.log('INFO', msg, { action, entityId, ...details }, resortId, userId);
  }
}

export default LoggingService;
