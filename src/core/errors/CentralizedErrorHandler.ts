import { LoggingService } from '../logger/LoggingService';
import { AppError } from './AppErrors';

export interface CaughtException {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  type: string;
  code?: string;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  resolved: boolean;
  context?: any;
}

export class CentralizedErrorHandler {
  private static STORAGE_KEY = 'stayflow_central_exceptions';
  private static registeredListeners: ((error: CaughtException) => void)[] = [];

  /**
   * Retrieves logged system exceptions from LocalStorage for NOC Dashboard display
   */
  public static getCaughtExceptions(): CaughtException[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      LoggingService.warn('Could not read exceptions log');
    }
    return [
      {
        id: 'err-20260721-01',
        timestamp: '2026-07-21T03:12:00Z',
        message: 'Timeout de API detectado al conectar con el conector Expedia OTA',
        type: 'RepositoryError',
        code: 'API_TIMEOUT_GATE',
        severity: 'WARNING',
        resolved: true,
        stack: 'Error: Connection timed out at ExpediaOTAConnector.ts:84'
      },
      {
        id: 'err-20260720-05',
        timestamp: '2026-07-20T21:44:10Z',
        message: 'Falla crítica al validar clave de Webhook Stripe para Tenant patagonia-refugio',
        type: 'ValidationError',
        code: 'WEBHOOK_SIGNATURE_INVALID',
        severity: 'ERROR',
        resolved: false,
        stack: 'ValidationError: Signature mismatch. at StripeWebhookHandler.ts:192'
      }
    ];
  }

  /**
   * Captures and centralized logs an exception
   */
  public static handleException(error: unknown, severity: 'WARNING' | 'ERROR' | 'CRITICAL' = 'ERROR', context?: any): CaughtException {
    let message = 'An unexpected system fault has occurred';
    let stack = '';
    let type = 'UnknownError';
    let code = 'SYSTEM_FAULT';

    if (error instanceof AppError) {
      message = error.message;
      type = error.name;
      code = error.code || 'APP_ERROR';
      stack = error.stack || '';
    } else if (error instanceof Error) {
      message = error.message;
      type = error.name;
      stack = error.stack || '';
    } else if (typeof error === 'string') {
      message = error;
    }

    const caught: CaughtException = {
      id: `err-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      message,
      stack,
      type,
      code,
      severity,
      resolved: false,
      context
    };

    LoggingService.error(`[CentralizedErrorHandler] Caught: ${message}`, caught);

    // Persist to local storage exceptions log
    try {
      const all = this.getCaughtExceptions();
      all.unshift(caught);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all.slice(0, 100))); // keep last 100 errors
    } catch {
      // safe bypass
    }

    // Trigger listeners (NOC panels, active alerts, etc.)
    this.registeredListeners.forEach(listener => {
      try {
        listener(caught);
      } catch (err) {
        // avoid feedback loop
      }
    });

    return caught;
  }

  /**
   * Researches listener callbacks for live error notifications
   */
  public static subscribe(callback: (error: CaughtException) => void): () => void {
    this.registeredListeners.push(callback);
    return () => {
      this.registeredListeners = this.registeredListeners.filter(l => l !== callback);
    };
  }

  /**
   * Marks exception log as resolved
   */
  public static resolveException(errorId: string): void {
    const all = this.getCaughtExceptions();
    const updated = all.map(err => err.id === errorId ? { ...err, resolved: true } : err);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    LoggingService.info(`Exception marked as resolved in central log: ${errorId}`);
  }
}
export default CentralizedErrorHandler;
