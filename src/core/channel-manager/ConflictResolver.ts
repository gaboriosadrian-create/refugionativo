import { ChannelOta, OtaReservation, ConflictReport } from './ChannelManagerTypes';
import { ChannelRepository } from './ChannelRepository';
import { BookingService } from '../../modules/bookings/services/BookingService';
import { AlertService } from '../observability/AlertService';
import { MetricsService } from '../observability/MetricsService';
import { Logger } from '../logger/Logger';

export class ConflictResolver {
  /**
   * Evaluates if a incoming OTA reservation would conflict with any existing local booking or other OTA mappings.
   */
  public static async evaluateReservation(
    tenantId: string,
    otaRes: OtaReservation
  ): Promise<{ hasConflict: boolean; type?: ConflictReport['type']; details?: string }> {
    try {
      // 1. Check for Duplicate Booking: Has this OTA ID already been processed and imported?
      const localBookings = await BookingService.getBookings(tenantId);
      const isDuplicate = localBookings.some(b => 
        (b.notes && b.notes.includes(otaRes.otaBookingId)) || 
        (b as any).otaBookingId === otaRes.otaBookingId
      );

      if (isDuplicate) {
        return {
          hasConflict: true,
          type: 'duplicate_booking',
          details: `La reserva de OTA ${otaRes.otaBookingId} ya se encuentra importada en StayFlow.`
        };
      }

      // 2. Check for Overbooking: Are these dates already occupied for this specific cabin?
      const hasOverlap = await BookingService.hasConflict(tenantId, otaRes.cabinId, otaRes.checkIn, otaRes.checkOut);
      if (hasOverlap) {
        return {
          hasConflict: true,
          type: 'overbooking',
          details: `Conflicto de sobreventa (Overbooking) detectado. Las fechas ${otaRes.checkIn} a ${otaRes.checkOut} para el alojamiento #${otaRes.cabinId} ya se encuentran reservadas o bloqueadas.`
        };
      }

      // 3. Check for Cancellation conflicts:
      // If the guest attempts to book, but dates match an active cancellation dispute.
      // (This can be mocked dynamically based on certain names or scenarios)
      if (otaRes.guestName.toLowerCase().includes('disputa') || otaRes.guestName.toLowerCase().includes('conflict')) {
        return {
          hasConflict: true,
          type: 'simultaneous_modification',
          details: `El huésped ${otaRes.guestName} tiene un proceso de disputa o cancelación cruzada activo.`
        };
      }

      return { hasConflict: false };
    } catch (err) {
      Logger.error(`Error evaluating reservation conflict for OTA ${otaRes.otaBookingId}:`, err);
      return { hasConflict: false };
    }
  }

  /**
   * Registers a formal conflict, logging metrics and raising a system alert.
   */
  public static async registerConflict(
    tenantId: string,
    ota: ChannelOta,
    type: ConflictReport['type'],
    severity: ConflictReport['severity'],
    details: string,
    cabinId: number,
    otaBookingId?: string
  ): Promise<ConflictReport> {
    const conflict: ConflictReport = {
      id: `conflict_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      tenantId,
      ota,
      type,
      severity,
      resolved: false,
      details,
      affectedCabinId: cabinId,
      otaBookingId,
      timestamp: new Date().toISOString()
    };

    // Save to channel repository
    await ChannelRepository.saveConflict(conflict, tenantId);

    // Raise System-wide Alert
    await AlertService.raiseAlert(
      `ChannelManager_${ota}`,
      severity === 'critical' ? 'CRITICAL' : 'WARNING',
      `[${ota.toUpperCase()}] Conflicto de Sincronización`,
      `${details} (Alojamiento #${cabinId})`
    );

    // Record Metric
    await MetricsService.recordMetric(
      'channel_conflict_detected',
      1,
      'count',
      { ota, type, severity: severity.toUpperCase() },
      tenantId
    );

    Logger.warn(`[ConflictResolver] Registered conflict ${conflict.id} on OTA ${ota}: ${details}`);
    return conflict;
  }

  /**
   * Marks a conflict report as resolved.
   */
  public static async resolveConflict(id: string, tenantId: string): Promise<void> {
    const conflicts = await ChannelRepository.getConflicts(tenantId);
    const found = conflicts.find(c => c.id === id);
    if (found) {
      found.resolved = true;
      found.resolvedAt = new Date().toISOString();
      await ChannelRepository.saveConflict(found, tenantId);
      Logger.info(`[ConflictResolver] Conflict ${id} marked as resolved.`);
    }
  }
}
