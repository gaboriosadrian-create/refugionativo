import { ChannelOta } from './ChannelManagerTypes';
import { OTARepository, OtaSchedule } from './OTARepository';
import { OTAService } from './OTAService';
import { Logger } from '../logger/Logger';

export class SyncScheduler {
  
  /**
   * Triggers an immediate full bidirectional sync for a channel.
   * Pulls bookings and pushes current availability and rates.
   */
  public static async triggerImmediateSync(tenantId: string, ota: ChannelOta): Promise<{ success: boolean; logs: string[] }> {
    const logs: string[] = [];
    logs.push(`Starting immediate bidirectional sync for ${ota.toUpperCase()}...`);
    Logger.info(`[SyncScheduler] Immediate sync requested for ${ota} (Tenant: ${tenantId})`);

    try {
      // 1. Inward Sync: Import reservations
      logs.push(`Pulling reservations from ${ota.toUpperCase()}...`);
      const imported = await OTAService.importReservations(tenantId, ota);
      logs.push(`Pulled ${imported.length} new bookings from ${ota.toUpperCase()}.`);

      // 2. Outward Sync: Availability
      logs.push(`Syncing StayFlow inventory and allotments...`);
      const availRes = await OTAService.syncToOta(tenantId, ota, 'sync_availability', {
        cabinId: 1,
        otaRoomId: ota === ChannelOta.BOOKING_COM ? 'BCOM-RM-101' : 'ABNB-LIST-9872',
        available: true,
        minStay: 2,
        leadTimeDays: 0
      });
      logs.push(`Availability sync: ${availRes.success ? 'SUCCESS' : 'FAILED'} (latency ${availRes.latencyMs}ms)`);

      // 3. Outward Sync: Rates
      logs.push(`Syncing rates...`);
      const ratesRes = await OTAService.syncToOta(tenantId, ota, 'sync_rates', {
        stayflowRateId: 'standard',
        otaRateId: ota === ChannelOta.BOOKING_COM ? 'BCOM-RATE-STD' : 'ABNB-PRICING-BASE',
        basePrice: 15000,
        markupPercent: 12
      });
      logs.push(`Rates sync: ${ratesRes.success ? 'SUCCESS' : 'FAILED'} (latency ${ratesRes.latencyMs}ms)`);

      // 4. Update the schedule record
      const schedules = await OTARepository.getSchedules(tenantId);
      const sched = schedules.find(s => s.ota === ota);
      if (sched) {
        sched.lastRun = new Date().toISOString();
        const next = new Date();
        next.setMinutes(next.getMinutes() + sched.intervalMinutes);
        sched.nextRun = next.toISOString();
        sched.mode = 'immediate';
        await OTARepository.saveSchedule(sched, tenantId);
      }

      logs.push(`Immediate sync cycle completed successfully for ${ota.toUpperCase()}.`);
      return { success: true, logs };
    } catch (err: any) {
      logs.push(`Sync cycle failed: ${err.message}`);
      Logger.error(`[SyncScheduler] Immediate sync failed: ${err.message}`);
      return { success: false, logs };
    }
  }

  /**
   * Executes scheduled background updates.
   * This is called by clock cycles or manual trigger to simulate background cron runs.
   */
  public static async runAllSchedules(tenantId: string): Promise<{ executed: number; logs: string[] }> {
    const logs: string[] = [];
    logs.push(`Executing scheduled sync cycles...`);
    
    const schedules = await OTARepository.getSchedules(tenantId);
    const activeSchedules = schedules.filter(s => s.active);
    let executedCount = 0;

    for (const sched of activeSchedules) {
      const now = new Date();
      const nextRun = new Date(sched.nextRun);

      // In simulation mode, we can always run or run if due
      logs.push(`Checking schedule for ${sched.ota.toUpperCase()}...`);
      logs.push(`Current: ${now.toLocaleTimeString()}, Scheduled: ${nextRun.toLocaleTimeString()}`);

      // We trigger the sync
      logs.push(`Executing automatic sync for ${sched.ota.toUpperCase()}...`);
      
      const availRes = await OTAService.syncToOta(tenantId, sched.ota, 'sync_availability', {
        cabinId: 1,
        otaRoomId: sched.ota === ChannelOta.BOOKING_COM ? 'BCOM-RM-101' : 'ABNB-LIST-9872',
        available: true
      });

      // Update timestamps
      sched.lastRun = now.toISOString();
      const next = new Date();
      next.setMinutes(next.getMinutes() + sched.intervalMinutes);
      sched.nextRun = next.toISOString();
      sched.mode = 'automatic';
      await OTARepository.saveSchedule(sched, tenantId);

      executedCount++;
      logs.push(`Scheduler updated ${sched.ota.toUpperCase()}. Next run scheduled for ${next.toLocaleTimeString()}`);
    }

    logs.push(`Scheduled execution cycle finished. Processed ${executedCount} active schedules.`);
    return { executed: executedCount, logs };
  }

  /**
   * Creates or updates a synchronization schedule.
   */
  public static async saveSchedule(tenantId: string, ota: ChannelOta, intervalMinutes: number, active: boolean): Promise<OtaSchedule> {
    const schedules = await OTARepository.getSchedules(tenantId);
    let existing = schedules.find(s => s.ota === ota);

    const nextRun = new Date();
    nextRun.setMinutes(nextRun.getMinutes() + intervalMinutes);

    if (!existing) {
      existing = {
        id: `sched_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        tenantId,
        ota,
        intervalMinutes,
        active,
        nextRun: nextRun.toISOString(),
        mode: 'scheduled'
      };
    } else {
      existing.intervalMinutes = intervalMinutes;
      existing.active = active;
      existing.nextRun = nextRun.toISOString();
    }

    await OTARepository.saveSchedule(existing, tenantId);
    Logger.info(`[SyncScheduler] Saved schedule for ${ota} with interval ${intervalMinutes} mins`);
    return existing;
  }
}
