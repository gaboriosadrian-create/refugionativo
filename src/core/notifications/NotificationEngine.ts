import { 
  NotificationEvent, 
  NotificationChannel, 
  NotificationQueueItem, 
  NotificationStats, 
  NotificationStatus 
} from './NotificationTypes';
import { NotificationRepository } from './NotificationRepository';
import { TemplateService } from './TemplateService';
import { QueueService } from './QueueService';
import { Logger } from '../logger/Logger';

export class NotificationEngine {
  /**
   * Triggers an event-driven notification flow.
   * Resolves templates, maps dynamic variables, and queues delivery.
   */
  public static async trigger(
    event: NotificationEvent,
    payload: Record<string, any>,
    options?: {
      scheduledFor?: string; // Specify custom trigger date
      delayHours?: number;   // Specify trigger delay
    },
    tenantId?: string
  ): Promise<void> {
    try {
      const settings = await NotificationRepository.getSettings(tenantId);
      const tid = settings.tenantId;

      Logger.info(`[NotificationEngine] Triggering event: "${event}" for tenant "${tid}"`);

      // Resolve standard recipients and dynamic variables from payload
      const mappedVars = await this.mapVariables(payload, settings, tid);
      
      // Determine scheduled trigger date
      let scheduledFor = new Date();
      if (options?.scheduledFor) {
        scheduledFor = new Date(options.scheduledFor);
      } else if (options?.delayHours) {
        scheduledFor.setHours(scheduledFor.getHours() + options.delayHours);
      }
      
      const scheduledStr = scheduledFor.toISOString();

      // Send to each enabled channel
      for (const channel of settings.enabledChannels) {
        // Find if template exists for this event + channel combination
        const template = await TemplateService.resolveTemplate(event, channel, settings.language, tid);
        if (!template || !template.active) {
          continue; // No active template for this event/channel, skip
        }

        // Determine recipient
        const recipient = this.resolveRecipient(channel, payload, settings);
        if (!recipient) {
          Logger.warn(`[NotificationEngine] No valid recipient resolved for channel "${channel}" on event "${event}"`);
          continue;
        }

        // Compile subject and body
        const subject = template.subject 
          ? TemplateService.compile(template.subject, mappedVars) 
          : undefined;
          
        const title = template.title 
          ? TemplateService.compile(template.title, mappedVars) 
          : undefined;

        const content = TemplateService.compile(template.content, mappedVars);

        // Queue notification
        const queueItem: Omit<NotificationQueueItem, 'id' | 'createdAt' | 'attempts'> = {
          tenantId: tid,
          event,
          channel,
          recipient,
          subject,
          title,
          content,
          variables: mappedVars,
          scheduledFor: scheduledStr,
          status: NotificationStatus.PENDING,
          maxAttempts: settings.retryConfig?.maxAttempts || 3
        };

        await QueueService.enqueue(queueItem, tid);
      }

      // Background non-blocking trigger to process queue immediately if scheduled for now
      if (!options?.scheduledFor && !options?.delayHours) {
        setTimeout(async () => {
          try {
            await QueueService.processQueue(tid);
          } catch (qErr) {
            Logger.error('[NotificationEngine] Immediate queue processing error:', qErr);
          }
        }, 100);
      }
    } catch (err: any) {
      Logger.error(`[NotificationEngine] Failed to trigger event "${event}":`, err);
    }
  }

  /**
   * Helper to map raw booking/payment payloads into structured variables for templates
   */
  private static async mapVariables(
    payload: Record<string, any>,
    settings: any,
    tenantId: string
  ): Promise<Record<string, any>> {
    const booking = payload.booking || payload.reservation || {};
    const payment = payload.payment || {};
    
    // Fallback constants
    const wifiName = settings.contactInfo?.wifiName || 'StayFlow_HighSpeed';
    const wifiPassword = settings.contactInfo?.wifiPassword || 'stayflow2026';
    const mapUrl = settings.contactInfo?.mapUrl || 'https://maps.google.com/?q=Patagonia+Argentina';
    const propertyName = settings.appName || 'Refugio StayFlow';
    const guestName = booking.name || payload.guestName || payload.userName || 'Huésped';
    const roomName = booking.cabinName || payload.roomName || 'Habitación Superior';

    return {
      guest: {
        name: guestName,
        email: booking.email || payload.userEmail || '',
        phone: booking.phone || payload.userPhone || ''
      },
      booking: {
        code: booking.id || booking.code || 'SF-XXXX',
        status: booking.status || 'pending',
        createdAt: booking.createdAt || new Date().toISOString()
      },
      checkin: {
        date: booking.checkIn || ''
      },
      checkout: {
        date: booking.checkOut || ''
      },
      property: {
        name: propertyName,
        phone: settings.contactInfo?.phone || ''
      },
      room: {
        name: roomName
      },
      payment: {
        amount: booking.totalPrice 
          ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(booking.totalPrice)
          : (payment.amount ? `$${payment.amount}` : '$0'),
        status: booking.paymentMethod ? 'Aprobado' : (booking.status === 'confirmed' ? 'Confirmado' : 'Pendiente')
      },
      wifi: {
        name: wifiName,
        password: wifiPassword
      },
      map: {
        url: mapUrl
      },
      // Pass other raw fields for extensibility
      ...payload
    };
  }

  /**
   * Resolves recipient target depending on notification channel
   */
  private static resolveRecipient(channel: NotificationChannel, payload: Record<string, any>, settings: any): string | null {
    const booking = payload.booking || payload.reservation || {};
    const user = payload.user || {};
    
    if (channel === NotificationChannel.EMAIL) {
      return booking.email || user.email || payload.email || settings.contactInfo?.email || null;
    }
    
    if (channel === NotificationChannel.WHATSAPP || channel === NotificationChannel.SMS) {
      return booking.phone || user.phone || payload.phone || settings.contactInfo?.phone || null;
    }

    if (channel === NotificationChannel.PUSH) {
      return user.deviceToken || payload.deviceToken || 'mock_token_123456';
    }

    if (channel === NotificationChannel.WEBHOOK) {
      return payload.webhookUrl || settings.contactInfo?.webhookUrl || 'https://api.stayflow.com/v1/webhooks/mock';
    }

    if (channel === NotificationChannel.INTERNAL) {
      return user.id || payload.userId || 'admin_user';
    }

    return null;
  }

  /**
   * Computes statistical indicators for the notification dashboard
   */
  public static async getStats(tenantId?: string): Promise<NotificationStats> {
    const tid = tenantId || 'default-resort';
    const queue = await NotificationRepository.getQueue(tid);
    const logs = await NotificationRepository.getLogs(tid);

    const sentCount = logs.filter(l => l.status === NotificationStatus.SENT).length;
    const failedCount = logs.filter(l => l.status === NotificationStatus.FAILED).length;
    
    const pendingCount = queue.filter(q => q.status === NotificationStatus.PENDING).length;
    const queuedCount = queue.filter(q => q.status === NotificationStatus.QUEUED).length;
    const retryingCount = queue.filter(q => q.status === NotificationStatus.RETRYING).length;

    const totalCount = queue.length + logs.length;

    // Latency math
    const logsWithLatency = logs.filter(l => l.latencyMs !== undefined);
    const averageLatencyMs = logsWithLatency.length > 0
      ? Math.round(logsWithLatency.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / logsWithLatency.length)
      : 120;

    // Channels
    const channelDistribution: Record<NotificationChannel, number> = {
      [NotificationChannel.EMAIL]: 0,
      [NotificationChannel.WHATSAPP]: 0,
      [NotificationChannel.SMS]: 0,
      [NotificationChannel.PUSH]: 0,
      [NotificationChannel.INTERNAL]: 0,
      [NotificationChannel.WEBHOOK]: 0
    };

    const allItems = [...queue, ...logs];
    allItems.forEach(i => {
      if (channelDistribution[i.channel] !== undefined) {
        channelDistribution[i.channel]++;
      }
    });

    // 7 days history daily trend
    const dailyTrend: { date: string; sent: number; failed: number }[] = [];
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
      dates.push(dayStr);
      dailyTrend.push({ date: dayStr, sent: 0, failed: 0 });
    }

    logs.forEach(l => {
      const logDate = new Date(l.createdAt);
      const dayStr = logDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
      const trendIndex = dates.indexOf(dayStr);
      if (trendIndex !== -1) {
        if (l.status === NotificationStatus.SENT) {
          dailyTrend[trendIndex].sent++;
        } else if (l.status === NotificationStatus.FAILED) {
          dailyTrend[trendIndex].failed++;
        }
      }
    });

    return {
      sentCount,
      pendingCount,
      failedCount,
      queuedCount,
      retryingCount,
      totalCount,
      averageLatencyMs,
      channelDistribution,
      dailyTrend
    };
  }
}
