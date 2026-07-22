import { revenueRuleRepository } from '../repositories/RevenueRuleRepository';
import { RevenueRule, CommercialRuleType, CommercialAdjustmentType } from '../types';
import { Logger } from '../../../core/logger/Logger';

export class RevenueRuleService {
  public static async getRules(resortId: string): Promise<RevenueRule[]> {
    try {
      let rules = await revenueRuleRepository.getAll(resortId);
      if (rules.length === 0) {
        rules = await this.seedDefaultRules(resortId);
      }
      return rules;
    } catch (e) {
      Logger.error('[RevenueRuleService] Error loading rules:', e);
      return [];
    }
  }

  public static async saveRule(resortId: string, rule: RevenueRule): Promise<void> {
    await revenueRuleRepository.save(resortId, rule);
    Logger.info(`[RevenueRuleService] Saved rule: ${rule.name}`);
  }

  public static async deleteRule(resortId: string, id: string): Promise<void> {
    await revenueRuleRepository.delete(resortId, id);
    Logger.info(`[RevenueRuleService] Deleted rule: ${id}`);
  }

  private static async seedDefaultRules(resortId: string): Promise<RevenueRule[]> {
    const defaultRules: RevenueRule[] = [
      {
        id: `rule_high_dem_${resortId}`,
        resortId,
        name: 'Tarifa por Alta Ocupación (>80%)',
        description: 'Incrementa automáticamente la tarifa un 15% cuando la ocupación de la propiedad supera el 80% para maximizar el RevPAR.',
        type: CommercialRuleType.OCCUPANCY,
        isActive: true,
        conditions: {
          occupancyThresholdPct: 80,
          occupancyComparison: 'greater'
        },
        adjustmentType: CommercialAdjustmentType.PERCENTAGE,
        adjustmentValue: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `rule_low_dem_${resortId}`,
        resortId,
        name: 'Promoción por Baja Ocupación (<30%)',
        description: 'Aplica un descuento del 10% en tarifa cuando la ocupación proyectada es menor al 30% con el fin de traccionar volumen.',
        type: CommercialRuleType.OCCUPANCY,
        isActive: true,
        conditions: {
          occupancyThresholdPct: 30,
          occupancyComparison: 'less'
        },
        adjustmentType: CommercialAdjustmentType.PERCENTAGE,
        adjustmentValue: -10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `rule_weekend_${resortId}`,
        resortId,
        name: 'Estadía Mínima Fin de Semana',
        description: 'Exige una estadía mínima de 2 noches los fines de semana (viernes y sábados) para evitar noches aisladas difíciles de vender.',
        type: CommercialRuleType.DAY_OF_WEEK,
        isActive: true,
        conditions: {
          dayOfWeek: [5, 6] // Viernes y Sábado
        },
        adjustmentType: CommercialAdjustmentType.MIN_STAY,
        adjustmentValue: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `rule_early_bird_${resortId}`,
        resortId,
        name: 'Descuento Compra Anticipada (>60 días)',
        description: 'Ofrece un 12% de descuento a las reservas realizadas con más de 60 días de anticipación, asegurando ocupación base anticipada.',
        type: CommercialRuleType.LEAD_TIME,
        isActive: true,
        conditions: {
          daysMin: 60
        },
        adjustmentType: CommercialAdjustmentType.PERCENTAGE,
        adjustmentValue: -12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `rule_last_minute_${resortId}`,
        resortId,
        name: 'Último Minuto (<3 días de llegada)',
        description: 'Aplica una reducción de tarifa del 15% para reservas que ingresen con menos de 3 días de anticipación si queda disponibilidad vacante.',
        type: CommercialRuleType.LAST_MINUTE,
        isActive: true,
        conditions: {
          daysMax: 3
        },
        adjustmentType: CommercialAdjustmentType.PERCENTAGE,
        adjustmentValue: -15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `rule_event_boost_${resortId}`,
        resortId,
        name: 'Fórmula para Eventos y Festivales de Impacto Alto',
        description: 'Incrementa un 20% la tarifa en fechas coincidentes con eventos locales de alta afluencia registrados en el calendario comercial.',
        type: CommercialRuleType.CALENDAR_EVENT,
        isActive: true,
        conditions: {
          calendarEventType: 'festival'
        },
        adjustmentType: CommercialAdjustmentType.PERCENTAGE,
        adjustmentValue: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    for (const rule of defaultRules) {
      await revenueRuleRepository.save(resortId, rule);
    }

    return defaultRules;
  }
}
export const revenueRuleService = new RevenueRuleService();
