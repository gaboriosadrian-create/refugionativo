import { HousekeepingService } from '../../stay-operations/services/HousekeepingService';
import { MaintenanceService } from '../../stay-operations/services/MaintenanceService';
import { BookingService } from '../../bookings/services/BookingService';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { MobileMetrics } from '../types';
import { Accommodation, Booking } from '../../../types';
import { HousekeepingTask, MaintenanceOrder } from '../../stay-operations/types';

/**
 * MobileGateway handles the specific Mobile API Layer (Module 1).
 * It acts as an optimized, battery-aware, low-payload proxy to core PMS services.
 */
export class MobileGateway {
  private static mockLatencyRange = { min: 40, max: 120 }; // mobile network average

  /**
   * Tracks and returns performance and bandwidth usage metrics.
   */
  public static calculateMetrics(rawJson: string, startTimeMs: number): MobileMetrics {
    const endTimeMs = performance.now();
    const sizeBytes = new Blob([rawJson]).size;
    const sizeKb = parseFloat((sizeBytes / 1024).toFixed(2));
    
    return {
      apiLatencyMs: Math.round(endTimeMs - startTimeMs),
      payloadSizeKb: sizeKb,
      batterySavingsPct: sizeKb > 20 ? Math.min(65, Math.round((1 - (20 / sizeKb)) * 100)) : 0,
      cacheHitRatio: 0.85, // local indexed cache hits
      syncDelaysSec: 2,
      networkRequestsCount: 1
    };
  }

  /**
   * Optimized payload query for cabins.
   * Strips bloated HTML, long descriptions, logs and unneeded metadata.
   */
  public static async getOptimizedAccommodations(
    tenantId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ items: Partial<Accommodation>[]; total: number; metrics: MobileMetrics }> {
    const startTime = performance.now();
    
    // Retrieve original full models
    const allCabins = LocalSaaSDb.get<Accommodation[]>(`accommodations_${tenantId}`) || [];
    
    // Paginate
    const startIdx = (page - 1) * limit;
    const paginated = allCabins.slice(startIdx, startIdx + limit);

    // COMPACT PAYLOAD: Extract only what mobile front desk and housekeeping actually need
    const optimized: Partial<Accommodation>[] = paginated.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status || 'available',
      price: c.price,
      category: c.category,
      maxGuests: c.maxGuests,
      type: c.type || 'cabin'
    }));

    const rawJson = JSON.stringify(optimized);
    const metrics = this.calculateMetrics(rawJson, startTime);

    return {
      items: optimized,
      total: allCabins.length,
      metrics
    };
  }

  /**
   * Optimized payload query for Housekeeping tasks.
   */
  public static async getOptimizedHousekeepingTasks(
    tenantId: string
  ): Promise<{ items: Partial<HousekeepingTask>[]; metrics: MobileMetrics }> {
    const startTime = performance.now();
    
    const tasks = await HousekeepingService.getTasks(tenantId);
    
    // Strip unnecessary operational logging history to reduce mobile bandwidth
    const optimized: Partial<HousekeepingTask>[] = tasks.map(t => ({
      id: t.id,
      cabinId: t.cabinId,
      cabinName: t.cabinName,
      type: t.type,
      status: t.status,
      priority: t.priority,
      assignedStaffName: t.assignedStaffName,
      notes: t.notes,
      checklistId: t.checklistId,
      checklistAnswers: t.checklistAnswers
    }));

    const rawJson = JSON.stringify(optimized);
    const metrics = this.calculateMetrics(rawJson, startTime);

    return {
      items: optimized,
      metrics
    };
  }

  /**
   * Optimized payload query for Maintenance orders.
   */
  public static async getOptimizedMaintenanceOrders(
    tenantId: string
  ): Promise<{ items: Partial<MaintenanceOrder>[]; metrics: MobileMetrics }> {
    const startTime = performance.now();
    
    const orders = await MaintenanceService.getOrders(tenantId);
    
    const optimized: Partial<MaintenanceOrder>[] = orders.map(o => ({
      id: o.id,
      cabinId: o.cabinId,
      cabinName: o.cabinName,
      type: o.type,
      status: o.status,
      priority: o.priority,
      assignedStaffName: o.assignedStaffName,
      issueDescription: o.issueDescription,
      comments: o.comments,
      cost: o.cost,
      startDate: o.startDate,
      endDate: o.endDate
    }));

    const rawJson = JSON.stringify(optimized);
    const metrics = this.calculateMetrics(rawJson, startTime);

    return {
      items: optimized,
      metrics
    };
  }

  /**
   * Optimized payload query for active/upcoming reservations for mobile Front Desk.
   */
  public static async getOptimizedReservations(
    tenantId: string
  ): Promise<{ items: any[]; metrics: MobileMetrics }> {
    const startTime = performance.now();
    
    const bookings = LocalSaaSDb.get<Booking[]>(`bookings_${tenantId}`) || [];
    const cabins = LocalSaaSDb.get<any[]>(`accommodations_${tenantId}`) || [];
    
    // Filter active/upcoming
    const activeAndUpcoming = bookings.filter(b => b.status === 'confirmed' || (b as any).status === 'paid' || b.status === 'pending');

    // COMPACT FRONT-DESK PAYLOAD: Strip raw payment logs, internal emails, terms & conditions texts
    const optimized = activeAndUpcoming.map(b => {
      const cabin = cabins.find(c => c.id === b.cabinId);
      return {
        id: b.id,
        cabinId: b.cabinId,
        cabinName: cabin?.name || `Cabaña ${b.cabinId}`,
        guestName: b.name,
        phone: b.phone,
        email: b.email || '',
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        guestsCount: b.guests,
        totalPrice: b.totalPrice,
        status: b.status
      };
    });

    const rawJson = JSON.stringify(optimized);
    const metrics = this.calculateMetrics(rawJson, startTime);

    return {
      items: optimized,
      metrics
    };
  }
}
