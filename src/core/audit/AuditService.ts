import { isFirebaseConfigured } from '../firebase/firebase';
import { saveDocument } from '../firebase/firestore';
import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';
import { LoggingService } from '../logger/LoggingService';

export interface AuditLog {
  id: string;
  timestamp: string;
  resortId: string;
  userId: string;
  userEmail?: string;
  action: string; // e.g. "CREATE_BOOKING", "CANCEL_BOOKING", "UPDATE_PRICING", "CHECK_IN"
  entityType: string; // e.g. "booking", "priceRule", "accommodation", "season"
  entityId: string | number;
  previousState?: Record<string, any> | null;
  newState?: Record<string, any> | null;
}

export class AuditService {
  /**
   * Records an administrative action for auditing
   */
  public static async record(
    resortId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string | number,
    previousState?: Record<string, any> | null,
    newState?: Record<string, any> | null,
    userEmail?: string
  ): Promise<void> {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      resortId,
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      previousState: previousState ? this.sanitizeState(previousState) : null,
      newState: newState ? this.sanitizeState(newState) : null,
    };

    // Log the event through the logging service
    await LoggingService.info(`Audit Log: User ${userId} performed ${action} on ${entityType} ${entityId}`, {
      action,
      entityType,
      entityId,
    }, resortId, userId);

    try {
      if (isFirebaseConfigured) {
        // Save to dedicated subcollection of the resort
        await saveDocument(`resorts/${resortId}/audit_logs/${log.id}`, log);
      } else {
        const key = `audit_${resortId}`;
        const existingLogs = LocalSaaSDb.get<AuditLog[]>(key) || [];
        existingLogs.push(log);
        // Cap local storage log count to prevent quota exceeded errors
        if (existingLogs.length > 300) {
          existingLogs.shift();
        }
        LocalSaaSDb.set(key, existingLogs);
      }
    } catch (err) {
      console.warn('[STAYFLOW] Failed to persist audit log:', err);
    }
  }

  /**
   * Read-only retrieval of audit logs
   */
  public static async getLogs(resortId: string): Promise<AuditLog[]> {
    if (isFirebaseConfigured) {
      // In production, you would fetch from the subcollection. Let's return local list as fallback or principal container.
      const key = `audit_${resortId}`;
      return LocalSaaSDb.get<AuditLog[]>(key) || [];
    } else {
      const key = `audit_${resortId}`;
      return LocalSaaSDb.get<AuditLog[]>(key) || [];
    }
  }

  /**
   * Sanitizes sensitive fields from state copies (e.g. passwords, direct credit card numbers if any)
   */
  private static sanitizeState(state: Record<string, any>): Record<string, any> {
    const sanitized = { ...state };
    const sensitiveKeys = ['password', 'token', 'secret', 'creditCard', 'cvv'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeState(sanitized[key]);
      }
    }
    return sanitized;
  }
}

export default AuditService;
