import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';
import { isFirebaseConfigured } from '../firebase/firebase';
import { saveDocument } from '../firebase/firestore';

export interface AlertEvent {
  id: string;
  timestamp: string;
  source: string;
  severity: 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  resolved: boolean;
  resolvedAt?: string;
}

export class AlertService {
  private static ALERTS_KEY = 'saas_system_alerts';

  /**
   * Raise a new alert event and persist it
   */
  public static async raiseAlert(
    source: string,
    severity: 'WARNING' | 'CRITICAL',
    title: string,
    message: string
  ): Promise<AlertEvent> {
    const alert: AlertEvent = {
      id: `alert_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      source,
      severity,
      title,
      message,
      resolved: false,
    };

    try {
      const alerts = LocalSaaSDb.get<AlertEvent[]>(this.ALERTS_KEY) || [];
      
      // Prevent duplicate active alerts
      const duplicate = alerts.find(a => a.source === source && a.title === title && !a.resolved);
      if (duplicate) {
        return duplicate; // Alert is already active
      }

      alerts.unshift(alert);
      if (alerts.length > 500) {
        alerts.pop();
      }
      LocalSaaSDb.set(this.ALERTS_KEY, alerts);

      if (isFirebaseConfigured) {
        await saveDocument(`alerts/${alert.id}`, alert);
      }
    } catch (err) {
      console.warn('[AlertService] Failed to persist alert:', err);
    }

    return alert;
  }

  /**
   * Resolve an existing alert
   */
  public static async resolveAlert(alertId: string): Promise<void> {
    try {
      const alerts = LocalSaaSDb.get<AlertEvent[]>(this.ALERTS_KEY) || [];
      const idx = alerts.findIndex(a => a.id === alertId);
      if (idx !== -1) {
        alerts[idx].resolved = true;
        alerts[idx].resolvedAt = new Date().toISOString();
        LocalSaaSDb.set(this.ALERTS_KEY, alerts);

        if (isFirebaseConfigured) {
          await saveDocument(`alerts/${alertId}`, alerts[idx]);
        }
      }
    } catch (err) {
      console.warn('[AlertService] Failed to resolve alert:', err);
    }
  }

  /**
   * Get all active and historic system alerts
   */
  public static getAlerts(): AlertEvent[] {
    const alerts = LocalSaaSDb.get<AlertEvent[]>(this.ALERTS_KEY) || [];
    
    // Seed some baseline alerts if empty
    if (alerts.length === 0) {
      const seeded: AlertEvent[] = [
        {
          id: 'alert_seeded_1',
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
          source: 'Payment Engine',
          severity: 'WARNING',
          title: 'Latencia elevada en API de Pasarela',
          message: 'La respuesta de la pasarela de pagos (Mercado Pago API) superó los 2500ms durante pruebas automatizadas.',
          resolved: true,
          resolvedAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
        },
        {
          id: 'alert_seeded_2',
          timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
          source: 'Storage Service',
          severity: 'WARNING',
          title: 'Operación Storage degradada',
          message: 'La subida de imágenes reportó timeout parcial debido a inestabilidad de red temporal.',
          resolved: false,
        }
      ];
      LocalSaaSDb.set(this.ALERTS_KEY, seeded);
      return seeded;
    }

    return alerts;
  }

  /**
   * Run automated metric & health evaluation rule scans to detect performance bottlenecks, high error rates, etc.
   */
  public static async scanAndRaiseAlerts(metrics: any[], healthReport: any, groupedErrors: any[]): Promise<void> {
    // Rule 1: High Response Time (> 300ms)
    const rtMetrics = metrics.filter(m => m.name === 'response_time');
    if (rtMetrics.length > 0) {
      const avgRt = rtMetrics.reduce((sum, m) => sum + m.value, 0) / rtMetrics.length;
      if (avgRt > 300) {
        await this.raiseAlert(
          'Performance Core',
          'WARNING',
          'Tiempo de respuesta de plataforma elevado',
          `El tiempo promedio de respuesta actual del servidor se ubica en ${Math.round(avgRt)}ms, superando el SLA estándar de 300ms.`
        );
      }
    }

    // Rule 2: Component offline or warning status in Health Check
    if (healthReport && healthReport.components) {
      for (const comp of healthReport.components) {
        if (comp.status === 'WARNING' || comp.status === 'DEGRADED') {
          await this.raiseAlert(
            comp.name,
            'WARNING',
            `Componente ${comp.name} degradado`,
            `El monitor de salud reportó estado degradado para ${comp.name}. Detalles: ${comp.details}`
          );
        } else if (comp.status === 'OFFLINE') {
          await this.raiseAlert(
            comp.name,
            'CRITICAL',
            `SERVICIO CAÍDO: ${comp.name}`,
            `ALERTA CRÍTICA: El servicio ${comp.name} no responde a los pings de salud.`
          );
        }
      }
    }

    // Rule 3: High Error frequency
    const totalErrors = groupedErrors.reduce((sum, e) => sum + (e.count || 1), 0);
    if (totalErrors > 15) {
      await this.raiseAlert(
        'Error Tracker',
        'WARNING',
        'Incremento inusual en tasa de errores',
        `Se han registrado más de 15 excepciones/errores en las últimas 24 horas. Verifique la bitácora de logs.`
      );
    }
  }
}

export default AlertService;
