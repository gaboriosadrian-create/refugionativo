import { NotificationQueueItem, NotificationStatus, NotificationLog } from './NotificationTypes';
import { NotificationRepository } from './NotificationRepository';
import { DeliveryService } from './DeliveryService';
import { RetryService } from './RetryService';
import { Logger } from '../logger/Logger';

export class QueueService {
  /**
   * Pushes a new notification to the tenant's processing queue
   */
  public static async enqueue(
    item: Omit<NotificationQueueItem, 'id' | 'createdAt' | 'attempts'>,
    tenantId?: string
  ): Promise<NotificationQueueItem> {
    const tid = tenantId || item.tenantId;
    const now = new Date().toISOString();
    
    const newItem: NotificationQueueItem = {
      ...item,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId: tid,
      attempts: 0,
      createdAt: now,
      status: NotificationStatus.QUEUED
    };

    await NotificationRepository.saveQueueItem(newItem);
    Logger.info(`[QueueService] Enqueued ${newItem.channel} notification for ${newItem.recipient}. Scheduled for: ${newItem.scheduledFor}`);
    
    return newItem;
  }

  /**
   * Scans and processes queued items that are ready to be sent (scheduledFor <= now)
   */
  public static async processQueue(tenantId?: string): Promise<number> {
    const tid = tenantId || 'default-resort';
    const queue = await NotificationRepository.getQueue(tid);
    const settings = await NotificationRepository.getSettings(tid);
    const nowStr = new Date().toISOString();
    
    // Find items scheduled to send now or earlier and aren't already completed
    const processable = queue.filter(item => {
      const isDue = new Date(item.scheduledFor) <= new Date(nowStr);
      const isPending = [
        NotificationStatus.QUEUED,
        NotificationStatus.PENDING,
        NotificationStatus.RETRYING
      ].includes(item.status);
      
      return isDue && isPending;
    });

    if (processable.length === 0) {
      return 0;
    }

    Logger.info(`[QueueService] Processing ${processable.length} due notifications for tenant ${tid}`);
    let processedCount = 0;

    for (const item of processable) {
      try {
        // Increment attempts
        item.attempts += 1;
        item.lastAttempt = new Date().toISOString();
        
        // Deliver message
        const result = await DeliveryService.deliver(item);
        
        // Log history/audit
        const logEntry: NotificationLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          tenantId: tid,
          queueItemId: item.id,
          event: item.event,
          channel: item.channel,
          recipient: item.recipient,
          status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          subject: item.subject,
          content: item.content,
          attempts: item.attempts,
          sentAt: result.success ? new Date().toISOString() : undefined,
          error: result.error,
          latencyMs: result.latencyMs,
          createdAt: new Date().toISOString()
        };
        await NotificationRepository.saveLog(logEntry);

        if (result.success) {
          // Delivery succeeded
          item.status = NotificationStatus.SENT;
          await NotificationRepository.saveQueueItem(item);
          processedCount++;
        } else {
          // Delivery failed, check retry policy
          const canRetry = RetryService.canRetry(item, settings);
          if (canRetry) {
            const nextRetry = RetryService.calculateNextRetry(item, settings);
            item.status = NotificationStatus.RETRYING;
            item.scheduledFor = nextRetry;
            item.error = result.error;
            await NotificationRepository.saveQueueItem(item);
            Logger.warn(`[QueueService] Delivery failed to ${item.recipient}. Scheduled for retry at ${nextRetry}. Error: ${result.error}`);
          } else {
            // Exhausted retries
            item.status = NotificationStatus.FAILED;
            item.error = `Max attempts reached. Last error: ${result.error}`;
            await NotificationRepository.saveQueueItem(item);
            Logger.error(`[QueueService] Delivery permanently failed to ${item.recipient}. Exhausted max attempts.`);
          }
          processedCount++;
        }
      } catch (err: any) {
        Logger.error(`[QueueService] Fatal error processing queue item ${item.id}:`, err);
      }
    }

    return processedCount;
  }

  /**
   * Clears all items in the queue (cancelling pending sends)
   */
  public static async clearQueue(tenantId?: string): Promise<void> {
    const tid = tenantId || 'default-resort';
    const queue = await NotificationRepository.getQueue(tid);
    
    for (const item of queue) {
      if ([NotificationStatus.QUEUED, NotificationStatus.PENDING, NotificationStatus.RETRYING].includes(item.status)) {
        item.status = NotificationStatus.CANCELLED;
        await NotificationRepository.saveQueueItem(item);
      }
    }
    Logger.info(`[QueueService] Cleared queue for tenant ${tid}`);
  }
}
