import { ChannelOta, OtaReservation } from './ChannelManagerTypes';
import { AdapterFactory } from './AdapterFactory';
import { OTARepository, OtaSyncRecord, OtaErrorRecord } from './OTARepository';
import { CredentialManager } from './CredentialManager';
import { Logger } from '../logger/Logger';
import { MetricsService } from '../observability/MetricsService';
import { AlertService } from '../observability/AlertService';

export class OTAService {
  
  /**
   * Performs outward synchronization from StayFlow to an OTA (Availability, Rates, Restrictions)
   */
  public static async syncToOta(
    tenantId: string,
    ota: ChannelOta,
    action: 'sync_availability' | 'sync_rates' | 'sync_restrictions',
    params: {
      cabinId?: number;
      otaRoomId?: string;
      available?: boolean;
      minStay?: number;
      maxStay?: number;
      leadTimeDays?: number;
      stayflowRateId?: string;
      otaRateId?: string;
      basePrice?: number;
      markupPercent?: number;
      closed?: boolean;
    }
  ): Promise<any> {
    const startTime = Date.now();
    Logger.info(`[OTAService] Starting ${action} for ${ota} (Tenant: ${tenantId})`);

    try {
      // 1. Get correct adapter using AdapterFactory
      const adapter = AdapterFactory.getAdapter(ota);
      let result: any;

      // 2. Dispatch the correct action
      if (action === 'sync_availability') {
        if (params.cabinId === undefined || !params.otaRoomId) {
          throw new Error('Missing cabinId or otaRoomId for availability sync');
        }
        result = await adapter.syncAvailability(
          params.cabinId,
          params.otaRoomId,
          params.available ?? true,
          params.minStay,
          params.maxStay,
          params.leadTimeDays
        );
      } else if (action === 'sync_rates') {
        if (!params.stayflowRateId || !params.otaRateId || params.basePrice === undefined || params.markupPercent === undefined) {
          throw new Error('Missing rate plan configurations for rate sync');
        }
        result = await adapter.syncRates(
          params.stayflowRateId,
          params.otaRateId,
          params.basePrice,
          params.markupPercent
        );
      } else if (action === 'sync_restrictions') {
        if (!params.otaRoomId) {
          throw new Error('Missing otaRoomId for restrictions sync');
        }
        result = await adapter.syncRestrictions(
          params.otaRoomId,
          params.closed ?? false,
          params.minStay,
          params.maxStay
        );
      } else {
        throw new Error(`Unsupported outward synchronization action: ${action}`);
      }

      const durationMs = Date.now() - startTime;

      // 3. Register history, metrics and potential errors
      if (result && result.success) {
        // Log successful sync
        const syncRecord: OtaSyncRecord = {
          id: `sync_rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          tenantId,
          ota,
          action,
          status: 'success',
          message: `Successfully synchronized ${action.split('_')[1]} with ${adapter.getOtaName()}`,
          latencyMs: durationMs,
          timestamp: new Date().toISOString(),
          payload: result.payloadSent
        };
        await OTARepository.saveSyncRecord(syncRecord, tenantId);

        // Record metrics
        await MetricsService.recordMetric(
          `ota_sync_success_latency_${ota}`,
          durationMs,
          'ms',
          { ota, action },
          tenantId
        );

        // Update connection lastSync
        const connections = await OTARepository.getConnections(tenantId);
        const conn = connections.find(c => c.ota === ota);
        if (conn) {
          conn.lastSync = new Date().toISOString();
          conn.errorCount = Math.max(0, conn.errorCount - 1);
          await OTARepository.saveConnection(conn, tenantId);
        }

        return result;
      } else {
        const errMsg = result?.error || 'Unknown adapter error occurred';
        throw new Error(errMsg);
      }

    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      Logger.error(`[OTAService] Sync error during ${action} for ${ota}: ${err.message}`);

      // Handle and classify error
      const errorRecord = this.classifyAndRecordError(tenantId, ota, err.message);
      
      // Save failed sync history
      const syncRecord: OtaSyncRecord = {
        id: `sync_rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        tenantId,
        ota,
        action,
        status: 'failed',
        message: `Failed: ${err.message}`,
        latencyMs: durationMs,
        timestamp: new Date().toISOString()
      };
      await OTARepository.saveSyncRecord(syncRecord, tenantId);

      // Record metric
      await MetricsService.recordMetric(
        `ota_sync_failure_${ota}`,
        1,
        'count',
        { ota, action, error: err.message },
        tenantId
      );

      // Increment error count in connection
      const connections = await OTARepository.getConnections(tenantId);
      const conn = connections.find(c => c.ota === ota);
      if (conn) {
        conn.errorCount += 1;
        await OTARepository.saveConnection(conn, tenantId);
      }

      // Raise critical alert if connection or credential failed completely
      if (errorRecord.category === 'authentication') {
        await AlertService.raiseAlert(
          `OTAService_${ota}`,
          'CRITICAL',
          `Fallo de Autenticación en ${ota.toUpperCase()}`,
          `Las credenciales para el resort ${tenantId} fallaron durante ${action}: ${err.message}. Rotación sugerida.`
        );
      } else {
        await AlertService.raiseAlert(
          `OTAService_${ota}`,
          'WARNING',
          `Sincronización Fallida en ${ota.toUpperCase()}`,
          `La acción ${action} falló con latencia ${durationMs}ms: ${err.message}`
        );
      }

      return {
        success: false,
        latencyMs: durationMs,
        error: err.message
      };
    }
  }

  /**
   * Pulls and imports reservations from the OTA (Inward sync)
   */
  public static async importReservations(tenantId: string, ota: ChannelOta): Promise<OtaReservation[]> {
    const startTime = Date.now();
    Logger.info(`[OTAService] Fetching incoming reservations from ${ota} (Tenant: ${tenantId})`);

    try {
      const adapter = AdapterFactory.getAdapter(ota);
      const reservations = await adapter.fetchReservations();
      const durationMs = Date.now() - startTime;

      Logger.info(`[OTAService] Successfully pulled ${reservations.length} reservations from ${ota}`);

      // Log successful sync if we found bookings
      if (reservations.length > 0) {
        for (const res of reservations) {
          const syncRecord: OtaSyncRecord = {
            id: `sync_rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            tenantId,
            ota,
            action: 'import_booking',
            status: 'success',
            message: `Imported reservation ${res.otaBookingId} for guest ${res.guestName} (${res.checkIn} to ${res.checkOut})`,
            latencyMs: durationMs,
            timestamp: new Date().toISOString(),
            payload: res
          };
          await OTARepository.saveSyncRecord(syncRecord, tenantId);
        }
      }

      // Record metrics
      await MetricsService.recordMetric(
        `ota_import_success_${ota}`,
        reservations.length,
        'count',
        { ota },
        tenantId
      );

      return reservations;
    } catch (err: any) {
      Logger.error(`[OTAService] Failed to import reservations from ${ota}: ${err.message}`);
      
      this.classifyAndRecordError(tenantId, ota, err.message);

      return [];
    }
  }

  /**
   * Helper to parse and classify error logs
   */
  private static classifyAndRecordError(tenantId: string, ota: ChannelOta, message: string): OtaErrorRecord {
    const lowerMsg = message.toLowerCase();
    let category: OtaErrorRecord['category'] = 'unknown';
    let code = 'UNKNOWN_ERROR';
    let suggestion = 'Check general connectivity and parameters.';

    if (lowerMsg.includes('credential') || lowerMsg.includes('auth') || lowerMsg.includes('unauthorized') || lowerMsg.includes('token') || lowerMsg.includes('key')) {
      category = 'authentication';
      code = 'AUTH_FAILED';
      suggestion = 'Revise y rote las credenciales en el Panel OTA.';
    } else if (lowerMsg.includes('timeout') || lowerMsg.includes('network') || lowerMsg.includes('connect') || lowerMsg.includes('host')) {
      category = 'connectivity';
      code = 'CONNECTIVITY_TIMEOUT';
      suggestion = 'Verifique si el servidor de la OTA está respondiendo o reintente en unos minutos.';
    } else if (lowerMsg.includes('invalid') || lowerMsg.includes('missing') || lowerMsg.includes('validation') || lowerMsg.includes('format')) {
      category = 'validation';
      code = 'VALIDATION_FAILED';
      suggestion = 'Revise los mapeos de cabañas o categorías de tarifas.';
    } else if (lowerMsg.includes('rate limit') || lowerMsg.includes('429') || lowerMsg.includes('too many')) {
      category = 'rate_limit';
      code = 'API_RATE_LIMIT';
      suggestion = 'Límite de peticiones de API excedido. La plataforma reintentará de forma diferida.';
    }

    const errorRecord: OtaErrorRecord = {
      id: `err_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId,
      ota,
      code,
      category,
      message,
      resolutionSuggestion: suggestion,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    // Save async
    OTARepository.saveErrorRecord(errorRecord, tenantId).catch(err => {
      console.error('[OTAService] Failed to save error record:', err);
    });

    return errorRecord;
  }
}
