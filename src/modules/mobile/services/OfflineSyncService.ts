import { MobileFirestore } from './MobileFirestore';
import { OfflineRepository } from './OfflineRepository';
import { OfflineQueueItem, SyncConflict, SyncLog } from '../types';
import { HousekeepingService } from '../../stay-operations/services/HousekeepingService';
import { MaintenanceService } from '../../stay-operations/services/MaintenanceService';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { Booking } from '../../../types';

/**
 * OfflineSyncService drives synchronization, transaction logging, and
 * conflict resolution when offline operations need to be replayed onto StayFlow core databases.
 */
export class OfflineSyncService {
  /**
   * Pushes a new operation to the queue. If offline, immediately mutates the
   * device secure cache to provide zero-latency local feedback.
   */
  public static enqueueAction(
    tenantId: string,
    userId: string,
    userEmail: string,
    deviceId: string,
    actionType: OfflineQueueItem['actionType'],
    payload: any,
    isOnline: boolean
  ): OfflineQueueItem {
    const queueId = `q_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const queueItem: OfflineQueueItem = {
      id: queueId,
      tenantId,
      userId,
      userEmail,
      deviceId,
      actionType,
      payload,
      createdAt: now,
      status: 'pending'
    };

    // Save in queue collection
    MobileFirestore.offlineQueue.save(queueItem);

    // Apply immediate optimistic cache mutation in the offline storage
    this.optimisticallyApplyLocalCache(tenantId, actionType, payload);

    return queueItem;
  }

  /**
   * Applies mutations directly to the decrypted local database cache
   * so the housekeeping or maintenance worker sees their work instantly in low signal zones.
   */
  private static optimisticallyApplyLocalCache(
    tenantId: string,
    actionType: OfflineQueueItem['actionType'],
    payload: any
  ): void {
    switch (actionType) {
      case 'start_housekeeping':
        OfflineRepository.updateCachedTaskStatus(tenantId, payload.taskId, 'in_progress');
        break;
      case 'complete_housekeeping':
        OfflineRepository.updateCachedTaskStatus(tenantId, payload.taskId, 'completed');
        break;
      case 'start_maintenance':
        OfflineRepository.updateCachedOrderStatus(tenantId, payload.orderId, 'in_progress');
        break;
      case 'complete_maintenance':
        OfflineRepository.updateCachedOrderStatus(tenantId, payload.orderId, 'completed', payload.comments);
        break;
      case 'quick_checkin': {
        const cachedBookings = LocalSaaSDb.get<Booking[]>(`bookings_${tenantId}`) || [];
        const bIdx = cachedBookings.findIndex(b => b.id === payload.bookingId);
        if (bIdx >= 0) {
          cachedBookings[bIdx].status = 'occupied' as any; // checked in
          LocalSaaSDb.set(`bookings_${tenantId}`, cachedBookings);
        }
        break;
      }
      case 'quick_checkout': {
        const cachedBookings = LocalSaaSDb.get<Booking[]>(`bookings_${tenantId}`) || [];
        const bIdx = cachedBookings.findIndex(b => b.id === payload.bookingId);
        if (bIdx >= 0) {
          cachedBookings[bIdx].status = 'completed' as any; // checked out
          LocalSaaSDb.set(`bookings_${tenantId}`, cachedBookings);
        }
        break;
      }
    }
  }

  /**
   * Synchronizes all pending items from the queue with core StayFlow engines.
   * If any item conflicts (e.g. server modified task after cache), flags as conflict.
   */
  public static async syncPendingQueue(
    tenantId: string,
    deviceId: string,
    userEmail: string
  ): Promise<{ processed: number; conflicts: SyncConflict[]; log: SyncLog }> {
    const startTime = performance.now();
    const pendingItems = MobileFirestore.offlineQueue.queryPending(tenantId);
    const conflicts: SyncConflict[] = [];
    let processed = 0;

    for (const item of pendingItems) {
      try {
        const hasConflict = await this.detectAndResolveConflict(tenantId, item);
        
        if (hasConflict) {
          item.status = 'conflict';
          MobileFirestore.offlineQueue.save(item);
          
          conflicts.push(hasConflict);
        } else {
          // Replay operation on standard PMS APIs
          await this.replayOnServer(tenantId, item);
          item.status = 'synced';
          MobileFirestore.offlineQueue.save(item);
          
          // Remove from queue upon success to keep db small
          MobileFirestore.offlineQueue.delete(item.id);
          processed++;
        }
      } catch (err: any) {
        console.error(`Sync error for queue item ${item.id}:`, err);
        item.status = 'conflict';
        item.error = err.message || 'Error desconocido';
        MobileFirestore.offlineQueue.save(item);
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    const status = conflicts.length > 0 ? 'partial' : 'success';
    
    const log: SyncLog = {
      id: `sync_log_${Date.now()}`,
      tenantId,
      deviceId,
      userEmail,
      timestamp: new Date().toISOString(),
      durationMs,
      itemsProcessed: pendingItems.length,
      conflictsCount: conflicts.length,
      status,
      details: `Procesados: ${processed}. Conflictos detectados: ${conflicts.length}. Duración: ${durationMs}ms.`
    };

    MobileFirestore.syncLogs.add(log);

    // Audit trace
    MobileFirestore.deviceAudit.log({
      id: `audit_${Date.now()}`,
      deviceId,
      userEmail,
      tenantId,
      timestamp: new Date().toISOString(),
      action: 'SYNC_RUN',
      status: status === 'success' ? 'success' : 'failure',
      details: log.details
    });

    return { processed, conflicts, log };
  }

  /**
   * Dispatches the action payload onto core PMS APIs safely.
   */
  private static async replayOnServer(tenantId: string, item: OfflineQueueItem): Promise<void> {
    const { actionType, payload, userId, userEmail } = item;

    switch (actionType) {
      case 'start_housekeeping':
        await HousekeepingService.startTask(tenantId, payload.taskId, userId, userEmail);
        break;
      case 'complete_housekeeping':
        await HousekeepingService.completeTask(tenantId, payload.taskId, {
          notes: payload.notes,
          photos: payload.photos,
          checklistAnswers: payload.checklistAnswers
        }, userId, userEmail);
        break;
      case 'create_maintenance':
        await MaintenanceService.createOrder(tenantId, {
          cabinId: payload.cabinId,
          cabinName: payload.cabinName,
          type: payload.type,
          priority: payload.priority,
          issueDescription: payload.issueDescription,
          assignedStaffId: userId,
          assignedStaffName: userEmail,
          comments: payload.comments,
          cost: payload.cost,
          startDate: payload.startDate,
          endDate: payload.endDate
        }, userId, userEmail);
        break;
      case 'start_maintenance':
        await MaintenanceService.startOrder(tenantId, payload.orderId, userId, userEmail);
        break;
      case 'complete_maintenance':
        await MaintenanceService.completeOrder(tenantId, payload.orderId, {
          comments: payload.comments,
          cost: payload.cost
        }, userId, userEmail);
        break;
      case 'quick_checkin': {
        const bookings = LocalSaaSDb.get<Booking[]>(`bookings_${tenantId}`) || [];
        const idx = bookings.findIndex(b => b.id === payload.bookingId);
        if (idx >= 0) {
          bookings[idx].status = 'occupied' as any;
          LocalSaaSDb.set(`bookings_${tenantId}`, bookings);
        }
        break;
      }
      case 'quick_checkout': {
        const bookings = LocalSaaSDb.get<Booking[]>(`bookings_${tenantId}`) || [];
        const idx = bookings.findIndex(b => b.id === payload.bookingId);
        if (idx >= 0) {
          bookings[idx].status = 'completed' as any;
          LocalSaaSDb.set(`bookings_${tenantId}`, bookings);
        }
        break;
      }
    }
  }

  /**
   * Detects if there has been concurrent server modifications.
   */
  private static async detectAndResolveConflict(
    tenantId: string,
    item: OfflineQueueItem
  ): Promise<SyncConflict | null> {
    const { actionType, payload } = item;

    if (actionType === 'complete_housekeeping') {
      const serverTasks = await HousekeepingService.getTasks(tenantId);
      const serverTask = serverTasks.find(t => t.id === payload.taskId);
      
      // If the server task has been already completed or inspected on another device
      if (serverTask && (serverTask.status === 'completed' || serverTask.status === 'inspected')) {
        return {
          id: item.id,
          actionType,
          localData: payload,
          serverData: serverTask
        };
      }
    }

    if (actionType === 'complete_maintenance') {
      const serverOrders = await MaintenanceService.getOrders(tenantId);
      const serverOrder = serverOrders.find(o => o.id === payload.orderId);

      if (serverOrder && (serverOrder.status === 'completed' || serverOrder.status === 'cancelled')) {
        return {
          id: item.id,
          actionType,
          localData: payload,
          serverData: serverOrder
        };
      }
    }

    return null;
  }

  /**
   * Manual or automated Conflict Resolution picker.
   */
  public static async resolveConflict(
    tenantId: string,
    queueItemId: string,
    strategy: 'use_local' | 'use_server' | 'merge',
    operatorEmail: string
  ): Promise<void> {
    const allQueue = MobileFirestore.offlineQueue.getAll();
    const item = allQueue.find(i => i.id === queueItemId);
    if (!item) throw new Error('Item de cola no encontrado.');

    if (strategy === 'use_local') {
      // Force replay on server, ignoring conflict detection checks
      await this.replayOnServer(tenantId, item);
    } else if (strategy === 'merge' && item.actionType === 'complete_housekeeping') {
      // Merge comments / notes field
      const serverTasks = await HousekeepingService.getTasks(tenantId);
      const serverTask = serverTasks.find(t => t.id === item.payload.taskId);
      if (serverTask) {
        item.payload.notes = `${serverTask.notes || ''} [Sincronizado: ${item.payload.notes || ''}]`;
        await this.replayOnServer(tenantId, item);
      }
    } else if (strategy === 'merge' && item.actionType === 'complete_maintenance') {
      // Merge comments
      const serverOrders = await MaintenanceService.getOrders(tenantId);
      const serverOrder = serverOrders.find(o => o.id === item.payload.orderId);
      if (serverOrder) {
        item.payload.comments = `${serverOrder.comments || ''} [Sincronizado: ${item.payload.comments || ''}]`;
        await this.replayOnServer(tenantId, item);
      }
    }
    // 'use_server' simply discards local changes, which means we just delete the queue item

    // Delete item from queue now that it's resolved
    MobileFirestore.offlineQueue.delete(queueItemId);

    // Track conflict resolution in audit log
    MobileFirestore.deviceAudit.log({
      id: `audit_${Date.now()}`,
      deviceId: item.deviceId,
      userEmail: operatorEmail,
      tenantId,
      timestamp: new Date().toISOString(),
      action: 'RESOLVE_CONFLICT',
      status: 'success',
      details: `Conflicto en transacción ${item.id} resuelto usando la estrategia: ${strategy.toUpperCase()}.`
    });
  }
}
