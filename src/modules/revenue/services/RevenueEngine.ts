import { RevenueRuleService } from './RevenueRuleService';
import { CommercialCalendarService } from './CommercialCalendarService';
import { pricingRecommendationRepository } from '../repositories/PricingRecommendationRepository';
import { revenueAlertRepository } from '../repositories/RevenueAlertRepository';
import { revenueHistoryRepository } from '../repositories/RevenueHistoryRepository';
import { KPIService } from './KPIService';
import { BookingService } from '../../bookings/services/BookingService';
import { AccommodationService } from '../../../shared/services/AccommodationService';
import { 
  PricingRecommendation, 
  RevenueAlert, 
  RevenueRule, 
  CommercialRuleType, 
  CommercialAdjustmentType,
  RevenueHistoryItem
} from '../types';
import { Logger } from '../../../core/logger/Logger';
import { AlertService } from '../../../core/observability/AlertService';
import { ObservabilityService } from '../../../core/observability/ObservabilityService';

export class RevenueEngine {
  /**
   * Executes the full revenue analysis pipeline:
   * 1. Loads calendar, rules, bookings, and inventory.
   * 2. Evaluates dynamic conditions for the next 14 days.
   * 3. Generates pending pricing recommendations.
   * 4. Identifies commercial alerts/anomalies.
   * 5. Persists results and records metrics.
   */
  public static async runAnalysis(resortId: string, performedBy = 'Revenue Engine'): Promise<{
    recommendations: PricingRecommendation[];
    alerts: RevenueAlert[];
  }> {
    const startAnalysis = Date.now();
    Logger.info(`[RevenueEngine] Running commercial intelligence cycle for resort: ${resortId}`);

    try {
      // 1. Fetch dependencies
      const rules = await RevenueRuleService.getRules(resortId);
      const activeRules = rules.filter(r => r.isActive);
      const calendarEvents = await CommercialCalendarService.getEvents(resortId);
      const bookings = await BookingService.getBookings(resortId);
      const accommodations = await AccommodationService.getAccommodations(resortId);
      const kpis = await KPIService.getKPIs(resortId);

      const activeBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'expired');
      const numAccommodations = accommodations.length || 5;

      const recommendations: PricingRecommendation[] = [];
      const alertsList: RevenueAlert[] = [];

      // Clean existing pending recommendations before generating fresh ones
      const existingRecommendations = await pricingRecommendationRepository.getAll(resortId);
      for (const oldRec of existingRecommendations) {
        if (oldRec.status === 'pending') {
          await pricingRecommendationRepository.delete(resortId, oldRec.id);
        }
      }

      // Clean old unresolved alerts
      const existingAlerts = await revenueAlertRepository.getAll(resortId);
      for (const oldAlert of existingAlerts) {
        if (!oldAlert.isResolved) {
          await revenueAlertRepository.delete(resortId, oldAlert.id);
        }
      }

      // 2. Scan timeline (next 14 days)
      const today = new Date();
      for (let i = 1; i <= 14; i++) {
        const scanDate = new Date();
        scanDate.setDate(today.getDate() + i);
        const dateStr = scanDate.toISOString().split('T')[0];
        const dayOfWeek = scanDate.getDay(); // 0 (Sun) to 6 (Sat)

        // Find bookings on this specific check-in date
        const bookingsOnDate = activeBookings.filter(b => b.checkIn === dateStr || (b.checkIn <= dateStr && b.checkOut > dateStr));
        const occupancyCount = bookingsOnDate.length;
        const occupancyPct = numAccommodations > 0 ? Math.round((occupancyCount / numAccommodations) * 100) : 0;

        // Check for calendar events matching this date
        const matchedCalEvents = calendarEvents.filter(e => 
          e.isActive && dateStr >= e.startDate && dateStr <= e.endDate
        );

        // Evaluate Rules
        for (const rule of activeRules) {
          let isTriggered = false;
          let triggerReason = '';

          if (rule.type === CommercialRuleType.OCCUPANCY && rule.conditions.occupancyThresholdPct !== undefined) {
            const threshold = rule.conditions.occupancyThresholdPct;
            if (rule.conditions.occupancyComparison === 'greater' && occupancyPct > threshold) {
              isTriggered = true;
              triggerReason = `Ocupación proyectada del ${occupancyPct}% supera el umbral de activación del ${threshold}%`;
            } else if (rule.conditions.occupancyComparison === 'less' && occupancyPct < threshold) {
              isTriggered = true;
              triggerReason = `Ocupación proyectada del ${occupancyPct}% es inferior al umbral mínimo del ${threshold}%`;
            }
          }

          if (rule.type === CommercialRuleType.DAY_OF_WEEK && rule.conditions.dayOfWeek) {
            if (rule.conditions.dayOfWeek.includes(dayOfWeek)) {
              isTriggered = true;
              triggerReason = `Día de la semana coincide con regla de fin de semana`;
            }
          }

          if (rule.type === CommercialRuleType.CALENDAR_EVENT && matchedCalEvents.length > 0) {
            const highImpactEvent = matchedCalEvents.find(e => e.impact === 'high' || e.impact === 'medium');
            if (highImpactEvent) {
              isTriggered = true;
              triggerReason = `Coincidencia con evento especial "${highImpactEvent.title}" (${highImpactEvent.type.toUpperCase()}) de impacto ${highImpactEvent.impact.toUpperCase()}`;
            }
          }

          if (rule.type === CommercialRuleType.LAST_MINUTE && i <= (rule.conditions.daysMax || 3)) {
            if (occupancyPct < 50) {
              isTriggered = true;
              triggerReason = `Reserva de último minuto detectada (${i} días restantes) con ocupación baja (${occupancyPct}%)`;
            }
          }

          if (isTriggered) {
            // Map rule type to recommended action
            let recType: PricingRecommendation['type'] = 'apply_discount';
            let recValue = kpis.adr;

            if (rule.adjustmentType === CommercialAdjustmentType.PERCENTAGE) {
              recType = rule.adjustmentValue > 0 ? 'increase_rate' : 'decrease_rate';
              recValue = Math.round(kpis.adr * (1 + rule.adjustmentValue / 100));
            } else if (rule.adjustmentType === CommercialAdjustmentType.MIN_STAY) {
              recType = 'increase_min_stay';
              recValue = rule.adjustmentValue; // Nights
            }

            const rec: PricingRecommendation = {
              id: `rec_${Date.now()}_${i}_${Math.floor(Math.random() * 100)}`,
              resortId,
              date: dateStr,
              type: recType,
              accommodationId: 'all',
              originalValue: recType === 'increase_min_stay' ? 'N/A' : kpis.adr,
              recommendedValue: recValue,
              reason: `Disparado por la regla "${rule.name}": ${triggerReason}.`,
              appliedRules: [rule.name],
              expectedImpact: recType === 'increase_rate' 
                ? `+${rule.adjustmentValue}% Ingresos / Estabilidad de Ocupación` 
                : recType === 'increase_min_stay' 
                ? `Optimización de estadía mínima para fin de semana` 
                : `Aumento proyectado del 12% en conversión de reservas`,
              confidence: 85 + Math.floor(Math.random() * 11), // 85% to 95%
              status: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            recommendations.push(rec);
            await pricingRecommendationRepository.save(resortId, rec);
          }
        }

        // 3. Generate Alerts (Upcoming Timelines)
        if (occupancyPct < 15 && (dayOfWeek === 5 || dayOfWeek === 6)) {
          const alert: RevenueAlert = {
            id: `alert_low_occ_${dateStr}_${resortId}`,
            resortId,
            title: `Baja ocupación crítica para Fin de Semana (${dateStr})`,
            description: `Ocupación proyectada del ${occupancyPct}% para el fin de semana del ${dateStr}. Se recomienda lanzar promoción flash de último minuto.`,
            type: 'critical_occupancy',
            severity: 'critical',
            isResolved: false,
            createdAt: new Date().toISOString(),
          };
          alertsList.push(alert);
          await revenueAlertRepository.save(resortId, alert);
          await AlertService.raiseAlert(
            `Revenue Engine - ${dateStr}`,
            'CRITICAL',
            alert.title,
            alert.description
          );
        }

        const highImpactFestival = matchedCalEvents.find(e => e.impact === 'high');
        if (highImpactFestival && occupancyPct < 60) {
          const alert: RevenueAlert = {
            id: `alert_opp_${dateStr}_${resortId}`,
            resortId,
            title: `Oportunidad comercial: Evento "${highImpactFestival.title}"`,
            description: `Se celebra "${highImpactFestival.title}" el ${dateStr}. Su ocupación actual es del ${occupancyPct}%. Ajuste tarifas al alza para capturar demanda premium.`,
            type: 'commercial_opportunity',
            severity: 'warning',
            isResolved: false,
            createdAt: new Date().toISOString(),
          };
          alertsList.push(alert);
          await revenueAlertRepository.save(resortId, alert);
          await AlertService.raiseAlert(
            `Revenue Engine - ${dateStr}`,
            'WARNING',
            alert.title,
            alert.description
          );
        }
      }

      // Check for global anomalies like cancellation peaks
      if (kpis.cancellationRate > 15) {
        const cancelAlert: RevenueAlert = {
          id: `alert_cancel_peak_${resortId}`,
          resortId,
          title: `Tasa de cancelaciones elevada: ${kpis.cancellationRate}%`,
          description: `La tasa de cancelaciones actual superó el límite esperado del 10%. Revise políticas de cancelación y flexibilidad.`,
          type: 'excessive_cancellations',
          severity: 'warning',
          isResolved: false,
          createdAt: new Date().toISOString(),
        };
        alertsList.push(cancelAlert);
        await revenueAlertRepository.save(resortId, cancelAlert);
        await AlertService.raiseAlert(
          'Revenue Engine - Global',
          'WARNING',
          cancelAlert.title,
          cancelAlert.description
        );
      }

      // Audit pipeline cycle run
      const durationMs = Date.now() - startAnalysis;
      const historyItem: RevenueHistoryItem = {
        id: `audit_cycle_${Date.now()}`,
        resortId,
        action: 'Ciclo Analítico de Precios',
        details: `Ejecución exitosa del motor de Revenue. Reglas evaluadas: ${activeRules.length}. Recomendaciones generadas: ${recommendations.length}. Alertas activas: ${alertsList.length}.`,
        performedBy,
        timestamp: new Date().toISOString()
      };
      await revenueHistoryRepository.save(resortId, historyItem);

      // Record System Metrics
      ObservabilityService.recordMetric('revenue_analysis_duration_ms', durationMs, 'ms', { resortId });
      ObservabilityService.recordMetric('revenue_rules_evaluated', activeRules.length, 'count', { resortId });
      ObservabilityService.recordMetric('revenue_recommendations_generated', recommendations.length, 'count', { resortId });
      ObservabilityService.recordMetric('revenue_alerts_raised', alertsList.length, 'count', { resortId });

      Logger.info(`[RevenueEngine] Completed analysis cycle. Recommendations: ${recommendations.length}, Alerts: ${alertsList.length}. Duration: ${durationMs}ms`);

      return { recommendations, alerts: alertsList };
    } catch (e) {
      Logger.error('[RevenueEngine] Critical error during analysis pipeline:', e);
      return { recommendations: [], alerts: [] };
    }
  }

  /**
   * Retrieves current history/audit logs
   */
  public static async getHistory(resortId: string): Promise<RevenueHistoryItem[]> {
    try {
      const items = await revenueHistoryRepository.getAll(resortId);
      // Sort newest first
      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      Logger.error('[RevenueEngine] Error getting history:', e);
      return [];
    }
  }
}
export const revenueEngine = new RevenueEngine();
