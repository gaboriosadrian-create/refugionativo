import { NotificationChannel, NotificationQueueItem } from './NotificationTypes';
import { Logger } from '../logger/Logger';

export interface DeliveryResult {
  success: boolean;
  error?: string;
  latencyMs: number;
}

export class DeliveryService {
  /**
   * Transmits a notification across the specified channel
   */
  public static async deliver(item: NotificationQueueItem): Promise<DeliveryResult> {
    const startTime = Date.now();
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Simulate real network request latencies depending on the channel
    let latencyMs = 50;
    let success = true;
    let error: string | undefined;

    try {
      switch (item.channel) {
        case NotificationChannel.EMAIL:
          latencyMs = Math.floor(Math.random() * 150) + 100; // 100-250ms
          await delay(latencyMs);
          
          // Basic validation of email recipient
          if (!item.recipient || !item.recipient.includes('@')) {
            success = false;
            error = 'Invalid email address format';
          } else {
            Logger.info(`[DeliveryService] EMAIL sent to ${item.recipient} with subject: "${item.subject}"`);
          }
          break;

        case NotificationChannel.WHATSAPP:
          latencyMs = Math.floor(Math.random() * 200) + 150; // 150-350ms
          await delay(latencyMs);
          
          if (!item.recipient || item.recipient.length < 8) {
            success = false;
            error = 'Invalid phone number format for WhatsApp';
          } else {
            Logger.info(`[DeliveryService] WHATSAPP message sent to ${item.recipient}: "${item.content.substring(0, 50)}..."`);
          }
          break;

        case NotificationChannel.SMS:
          latencyMs = Math.floor(Math.random() * 100) + 50; // 50-150ms
          await delay(latencyMs);
          
          if (!item.recipient || item.recipient.length < 8) {
            success = false;
            error = 'Invalid mobile number for SMS';
          } else {
            Logger.info(`[DeliveryService] SMS message sent to ${item.recipient}: "${item.content.substring(0, 30)}..."`);
          }
          break;

        case NotificationChannel.PUSH:
          latencyMs = Math.floor(Math.random() * 80) + 30; // 30-110ms
          await delay(latencyMs);
          
          if (!item.recipient) {
            success = false;
            error = 'Missing destination device token for Push notification';
          } else {
            Logger.info(`[DeliveryService] PUSH notification sent to device token: ${item.recipient}`);
          }
          break;

        case NotificationChannel.INTERNAL:
          latencyMs = 5;
          await delay(latencyMs);
          Logger.info(`[DeliveryService] INTERNAL dashboard alert recorded for user/tenant`);
          break;

        case NotificationChannel.WEBHOOK:
          latencyMs = Math.floor(Math.random() * 300) + 200; // 200-500ms
          await delay(latencyMs);
          
          if (!item.recipient || !item.recipient.startsWith('http')) {
            success = false;
            error = 'Invalid webhook URL endpoint';
          } else {
            Logger.info(`[DeliveryService] WEBHOOK triggered to endpoint: ${item.recipient}`);
            // In a real Node/Express backend or client, we could call:
            // fetch(item.recipient, { method: 'POST', body: JSON.stringify(item) })
          }
          break;

        default:
          success = false;
          error = `Unsupported notification channel: ${item.channel}`;
          break;
      }
    } catch (err: any) {
      success = false;
      error = err?.message || 'Unknown transport network error';
    }

    const duration = Date.now() - startTime;
    return {
      success,
      error,
      latencyMs: duration
    };
  }
}
