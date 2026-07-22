import { MetricsService } from './MetricsService';

export class PerformanceService {
  /**
   * Instrument a code execution block and record its duration
   */
  public static async measure<T>(
    operationName: string,
    operationBlock: () => Promise<T> | T,
    labels?: Record<string, string>,
    tenantId?: string | null
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operationBlock();
      const duration = Date.now() - start;
      await MetricsService.recordMetric(operationName, duration, 'ms', { ...labels, status: 'success' }, tenantId);
      return result;
    } catch (err: any) {
      const duration = Date.now() - start;
      await MetricsService.recordMetric(operationName, duration, 'ms', { ...labels, status: 'error', error: err.message || String(err) }, tenantId);
      throw err;
    }
  }

  /**
   * Helper to record database query performance
   */
  public static async recordQuery(durationMs: number, collection: string, queryType: string, tenantId?: string | null): Promise<void> {
    await MetricsService.recordMetric('firestore_query', durationMs, 'ms', { collection, type: queryType }, tenantId);
  }

  /**
   * Helper to record cloud storage operations
   */
  public static async recordStorageOp(durationMs: number, action: string, bytes?: number, tenantId?: string | null): Promise<void> {
    await MetricsService.recordMetric('storage_op', durationMs, 'ms', { action, sizeBytes: bytes ? String(bytes) : 'unknown' }, tenantId);
  }
}

export default PerformanceService;
