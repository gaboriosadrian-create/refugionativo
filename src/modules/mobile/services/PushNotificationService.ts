import { MobileFirestore } from './MobileFirestore';
import { PushSubscription, DeviceAuditLog } from '../types';

/**
 * PushNotificationService registers mobile devices to categories and models
 * push notifications triggered on reservations, housekeeping, or critical outages.
 */
export class PushNotificationService {
  /**
   * Registers or updates a device push token and subscriptions.
   */
  public static async registerDeviceToken(
    tenantId: string,
    deviceId: string,
    userEmail: string,
    pushToken: string,
    categories: ('booking' | 'housekeeping' | 'maintenance' | 'critical' | 'payments')[]
  ): Promise<PushSubscription> {
    const existing = MobileFirestore.pushSubscriptions.getByDevice(deviceId);

    const subscription: PushSubscription = {
      id: existing?.id || `push_sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      deviceId,
      userEmail,
      tenantId,
      pushToken,
      categories,
      active: true
    };

    MobileFirestore.pushSubscriptions.save(subscription);

    // Audit trace
    MobileFirestore.deviceAudit.log({
      id: `audit_${Date.now()}`,
      deviceId,
      userEmail,
      tenantId,
      timestamp: new Date().toISOString(),
      action: 'REGISTER_PUSH_TOKEN',
      status: 'success',
      details: `Dispositivo registrado para recibir notificaciones de: ${categories.join(', ')}`
    });

    return subscription;
  }

  /**
   * Mock utility simulating sending a push notification to subscribers.
   * If a matching subscriber with active filters is found, we can trigger an alert callback.
   */
  public static dispatchNotification(
    tenantId: string,
    category: 'booking' | 'housekeeping' | 'maintenance' | 'critical' | 'payments',
    title: string,
    body: string,
    onAlertTriggered?: (title: string, body: string, category: string) => void
  ): void {
    const subs = MobileFirestore.pushSubscriptions.queryByTenant(tenantId);
    
    // Filter matching subscribers that have the current category registered
    const targetedSubs = subs.filter(s => s.active && s.categories.includes(category));

    targetedSubs.forEach(sub => {
      console.log(`[PUSH DISPATCH] Sent push to device ${sub.deviceId} (${sub.userEmail}) [${category}]: ${title} - ${body}`);
      
      // Log in device audit
      MobileFirestore.deviceAudit.log({
        id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        deviceId: sub.deviceId,
        userEmail: sub.userEmail,
        tenantId,
        timestamp: new Date().toISOString(),
        action: `PUSH_${category.toUpperCase()}`,
        status: 'success',
        details: `Notificación push enviada. Título: "${title}".`
      });

      // Notify reactive mobile listeners if online
      if (onAlertTriggered) {
        onAlertTriggered(title, body, category);
      }
    });
  }
}
