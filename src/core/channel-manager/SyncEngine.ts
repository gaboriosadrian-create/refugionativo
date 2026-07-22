import { 
  ChannelOta, 
  SyncQueueItem, 
  SyncStatus, 
  SyncPriority, 
  SyncLog, 
  OtaReservation 
} from './ChannelManagerTypes';
import { ChannelRepository } from './ChannelRepository';
import { AdapterFactory } from './AdapterFactory';
import { ConflictResolver } from './ConflictResolver';
import { BookingService } from '../../modules/bookings/services/BookingService';
import { MetricsService } from '../observability/MetricsService';
import { AlertService } from '../observability/AlertService';
import { Logger } from '../logger/Logger';

export class SyncEngine {
  /**
   * Queues an inventory/availability sync action for a specific StayFlow room.
   */
  public static async queueAvailabilitySync(
    tenantId: string,
    ota: ChannelOta,
    cabinId: number,
    otaRoomId: string,
    available: boolean,
    priority: SyncPriority = SyncPriority.MEDIUM
  ): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: `sync_avail_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      tenantId,
      ota,
      action: 'sync_availability',
      payload: { cabinId, otaRoomId, available },
      priority,
      status: SyncStatus.PENDING,
      attempts: 0,
      maxAttempts: 3,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await ChannelRepository.saveQueueItem(item, tenantId);
    Logger.info(`[SyncEngine] Queued availability sync for ${ota} | Cabin #${cabinId}`);
    return item;
  }

  /**
   * Queues a rate sync action for a specific StayFlow pricing plan.
   */
  public static async queueRateSync(
    tenantId: string,
    ota: ChannelOta,
    stayflowRateId: string,
    otaRateId: string,
    basePrice: number,
    markupPercent: number,
    priority: SyncPriority = SyncPriority.MEDIUM
  ): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: `sync_rate_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      tenantId,
      ota,
      action: 'sync_rates',
      payload: { stayflowRateId, otaRateId, basePrice, markupPercent },
      priority,
      status: SyncStatus.PENDING,
      attempts: 0,
      maxAttempts: 3,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await ChannelRepository.saveQueueItem(item, tenantId);
    Logger.info(`[SyncEngine] Queued rate sync for ${ota} | Rate ${otaRateId} ($${basePrice})`);
    return item;
  }

  /**
   * Queues an import reservations check from a specific OTA.
   */
  public static async queueReservationImport(
    tenantId: string,
    ota: ChannelOta,
    priority: SyncPriority = SyncPriority.HIGH
  ): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: `import_booking_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      tenantId,
      ota,
      action: 'import_booking',
      payload: {},
      priority,
      status: SyncStatus.PENDING,
      attempts: 0,
      maxAttempts: 3,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await ChannelRepository.saveQueueItem(item, tenantId);
    Logger.info(`[SyncEngine] Queued reservation import check for ${ota}`);
    return item;
  }

  /**
   * Processes all pending and retrying sync queue items whose scheduledFor date has arrived.
   * Returns the count of successfully processed tasks.
   */
  public static async processQueue(tenantId: string): Promise<number> {
    let processedCount = 0;
    try {
      const queue = await ChannelRepository.getQueue(tenantId);
      const now = new Date();
      
      // Filter tasks to run
      const tasksToRun = queue
        .filter(item => 
          (item.status === SyncStatus.PENDING || item.status === SyncStatus.RETRYING) &&
          new Date(item.scheduledFor) <= now
        )
        // Sort by priority and then creation date
        .sort((a, b) => {
          const priorityWeight = { [SyncPriority.HIGH]: 3, [SyncPriority.MEDIUM]: 2, [SyncPriority.LOW]: 1 };
          if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
            return priorityWeight[b.priority] - priorityWeight[a.priority];
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

      Logger.info(`[SyncEngine] Processing ${tasksToRun.length} eligible channel manager tasks from queue.`);

      for (const task of tasksToRun) {
        // Mark as running to avoid race conditions
        task.status = SyncStatus.RUNNING;
        task.lastAttempt = new Date().toISOString();
        task.attempts += 1;
        await ChannelRepository.saveQueueItem(task, tenantId);

        const startTime = Date.now();
        try {
          const adapter = AdapterFactory.getAdapter(task.ota);
          let syncResult: { success: boolean; latencyMs: number; error?: string; payloadSent?: any };

          // Execute action using adapter pattern
          if (task.action === 'sync_availability') {
            const { cabinId, otaRoomId, available } = task.payload;
            syncResult = await adapter.syncAvailability(cabinId, otaRoomId, available);
          } else if (task.action === 'sync_rates') {
            const { stayflowRateId, otaRateId, basePrice, markupPercent } = task.payload;
            syncResult = await adapter.syncRates(stayflowRateId, otaRateId, basePrice, markupPercent);
          } else if (task.action === 'sync_restrictions') {
            const { otaRoomId, closed, minStay, maxStay } = task.payload;
            syncResult = await adapter.syncRestrictions(otaRoomId, closed, minStay, maxStay);
          } else if (task.action === 'import_booking') {
            const importedReservations = await adapter.fetchReservations();
            Logger.info(`[SyncEngine] Fetched ${importedReservations.length} incoming bookings from OTA ${task.ota}`);
            
            // Process imported reservations
            for (const res of importedReservations) {
              await this.importSingleReservation(tenantId, res);
            }
            syncResult = { success: true, latencyMs: Date.now() - startTime };
          } else {
            throw new Error(`Invalid sync action requested: ${task.action}`);
          }

          if (syncResult.success) {
            task.status = SyncStatus.COMPLETED;
            task.latencyMs = syncResult.latencyMs;
            await ChannelRepository.saveQueueItem(task, tenantId);

            // Save Sync Audit Log
            const auditLog: SyncLog = {
              id: `log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
              tenantId,
              ota: task.ota,
              action: task.action,
              status: 'success',
              message: `Operación ${task.action} completada exitosamente.`,
              latencyMs: syncResult.latencyMs,
              timestamp: new Date().toISOString()
            };
            await ChannelRepository.saveLog(auditLog, tenantId);

            // Record telemetry metrics
            await MetricsService.recordMetric(
              'channel_sync_latency',
              syncResult.latencyMs,
              'ms',
              { ota: task.ota, action: task.action },
              tenantId
            );
            await MetricsService.recordMetric(
              'channel_sync_count',
              1,
              'count',
              { ota: task.ota, action: task.action, status: 'success' },
              tenantId
            );

            // Once completed, delete from queue to keep clean (or keep for history and we filter it, 
            // let's delete to prevent bloating but keep the logs for full auditability!)
            await ChannelRepository.deleteQueueItem(task.id, tenantId);
            processedCount++;
          } else {
            throw new Error(syncResult.error || 'Unknown failure reported by channel adapter.');
          }
        } catch (err: any) {
          const errorMessage = err.message || 'Sincronización interrumpida.';
          Logger.error(`[SyncEngine] Queue task ${task.id} failed: ${errorMessage}`);

          // Retry logic using Exponential Backoff
          if (task.attempts < task.maxAttempts) {
            task.status = SyncStatus.RETRYING;
            // Backoff delay: 10s * 2^attempts (1st retry after 20s, 2nd retry after 40s)
            const delayMs = 10000 * Math.pow(2, task.attempts);
            task.scheduledFor = new Date(Date.now() + delayMs).toISOString();
            task.error = errorMessage;
            await ChannelRepository.saveQueueItem(task, tenantId);

            Logger.warn(`[SyncEngine] Task ${task.id} set to retry at ${task.scheduledFor} (Attempt ${task.attempts}/${task.maxAttempts})`);
          } else {
            // Permanently failed
            task.status = SyncStatus.FAILED;
            task.error = errorMessage;
            await ChannelRepository.saveQueueItem(task, tenantId);

            // Save Failed Audit Log
            const auditLog: SyncLog = {
              id: `log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
              tenantId,
              ota: task.ota,
              action: task.action,
              status: 'failed',
              message: `Sincronización falló permanentemente tras ${task.attempts} intentos: ${errorMessage}`,
              latencyMs: Date.now() - startTime,
              timestamp: new Date().toISOString()
            };
            await ChannelRepository.saveLog(auditLog, tenantId);

            // Raise System-wide Alarm
            await AlertService.raiseAlert(
              `SyncEngine_${task.ota}`,
              'CRITICAL',
              `Falla Crítica de Sincronización OTA`,
              `La sincronización de ${task.action} falló permanentemente tras ${task.maxAttempts} intentos. Error: ${errorMessage}`
            );

            // Record Metrics
            await MetricsService.recordMetric(
              'channel_sync_count',
              1,
              'count',
              { ota: task.ota, action: task.action, status: 'failed' },
              tenantId
            );
          }
        }
      }
    } catch (err) {
      Logger.error('[SyncEngine] Error during queue processing loop:', err);
    }
    return processedCount;
  }

  /**
   * Imports a single OTA Reservation after evaluating potential overbookings and conflicts.
   */
  private static async importSingleReservation(tenantId: string, otaRes: OtaReservation): Promise<void> {
    Logger.info(`[SyncEngine] Evaluating incoming OTA reservation ${otaRes.otaBookingId} from ${otaRes.ota}`);

    // Evaluate conflicts
    const evaluation = await ConflictResolver.evaluateReservation(tenantId, otaRes);

    if (evaluation.hasConflict) {
      // Conflict detected!
      Logger.warn(`[SyncEngine] Conflict detected during OTA reservation import! Type: ${evaluation.type}. details: ${evaluation.details}`);
      
      await ConflictResolver.registerConflict(
        tenantId,
        otaRes.ota,
        evaluation.type || 'overbooking',
        evaluation.type === 'overbooking' ? 'critical' : 'warning',
        evaluation.details || 'Conflicto genérico en importación.',
        otaRes.cabinId,
        otaRes.otaBookingId
      );
      return;
    }

    // No conflict, safe to proceed and create booking inside StayFlow core
    try {
      const bData = {
        cabinId: otaRes.cabinId,
        checkIn: otaRes.checkIn,
        checkOut: otaRes.checkOut,
        guests: 2, // Standard mapping guest count
        name: otaRes.guestName,
        phone: otaRes.guestPhone,
        email: otaRes.guestEmail,
        paymentMethod: 'credit_card' as const,
        status: 'confirmed' as const,
        notes: `[OTA IMPORT] Canal: ${otaRes.ota.toUpperCase()} | Código OTA: ${otaRes.otaBookingId} | Pasarela de Pago: Pre-Aprobado por Canal`,
        totalPrice: otaRes.totalPrice
      };

      const createdBooking = await BookingService.createBooking(tenantId, bData, 'system_channel_manager');
      
      // Save Success Audit Log
      const auditLog: SyncLog = {
        id: `log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        tenantId,
        ota: otaRes.ota,
        action: 'import_booking',
        status: 'success',
        message: `Reserva importada con éxito. Código StayFlow: #${createdBooking.id} (OTA: ${otaRes.otaBookingId}) para ${otaRes.guestName}.`,
        latencyMs: 150,
        timestamp: new Date().toISOString()
      };
      await ChannelRepository.saveLog(auditLog, tenantId);

      Logger.info(`[SyncEngine] Successfully registered reservation ${otaRes.otaBookingId} as StayFlow booking #${createdBooking.id}`);
    } catch (err: any) {
      Logger.error(`[SyncEngine] Error creating booking programmatically in BookingService for ${otaRes.otaBookingId}:`, err);
      
      // Record mapping or processing validation error as a Conflict report
      await ConflictResolver.registerConflict(
        tenantId,
        otaRes.ota,
        'simultaneous_modification',
        'warning',
        `Error de validación del motor de reservas al intentar registrar la reserva de OTA: ${err.message || 'Error Desconocido'}`,
        otaRes.cabinId,
        otaRes.otaBookingId
      );
    }
  }
}
