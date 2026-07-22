import { pricingRecommendationRepository } from '../repositories/PricingRecommendationRepository';
import { revenueHistoryRepository } from '../repositories/RevenueHistoryRepository';
import { PricingRecommendation, RevenueHistoryItem } from '../types';
import { Logger } from '../../../core/logger/Logger';
import { ObservabilityService } from '../../../core/observability/ObservabilityService';

export class PricingRecommendationService {
  public static async getRecommendations(resortId: string): Promise<PricingRecommendation[]> {
    try {
      return await pricingRecommendationRepository.getAll(resortId);
    } catch (e) {
      Logger.error('[PricingRecommendationService] Error loading recommendations:', e);
      return [];
    }
  }

  public static async saveRecommendation(resortId: string, recommendation: PricingRecommendation): Promise<void> {
    await pricingRecommendationRepository.save(resortId, recommendation);
  }

  public static async approveRecommendation(resortId: string, id: string, approvedBy: string): Promise<void> {
    const list = await pricingRecommendationRepository.getAll(resortId);
    const rec = list.find(r => r.id === id);
    if (!rec) {
      throw new Error(`Recomendación #${id} no encontrada.`);
    }

    const start = Date.now();
    rec.status = 'applied';
    rec.approvedBy = approvedBy;
    rec.approvedAt = new Date().toISOString();
    rec.updatedAt = new Date().toISOString();

    await pricingRecommendationRepository.save(resortId, rec);

    // Register Audit Log in revenueHistory
    const auditItem: RevenueHistoryItem = {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      action: 'Aprobación de Tarifa Dinámica',
      details: `Recomendación aprobada para el día ${rec.date}. Tipo: ${rec.type}. Alojamiento: ${rec.accommodationId}. Razón: ${rec.reason}.`,
      performedBy: approvedBy,
      timestamp: new Date().toISOString(),
    };
    await revenueHistoryRepository.save(resortId, auditItem);

    // Record Observability Metric
    ObservabilityService.recordMetric('revenue_recommendation_approved', 1, 'count', {
      resortId,
      recommendationId: id,
      type: rec.type,
    });
    ObservabilityService.recordMetric('revenue_calculation_time_ms', Date.now() - start, 'ms', {
      action: 'approve_recommendation',
    });

    Logger.info(`[PricingRecommendationService] Recommendation approved and applied: ${id}`);
  }

  public static async rejectRecommendation(resortId: string, id: string, rejectedBy: string): Promise<void> {
    const list = await pricingRecommendationRepository.getAll(resortId);
    const rec = list.find(r => r.id === id);
    if (!rec) {
      throw new Error(`Recomendación #${id} no encontrada.`);
    }

    rec.status = 'rejected';
    rec.updatedAt = new Date().toISOString();

    await pricingRecommendationRepository.save(resortId, rec);

    // Register Audit Log
    const auditItem: RevenueHistoryItem = {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      action: 'Rechazo de Tarifa Dinámica',
      details: `Recomendación rechazada para el día ${rec.date}. Tipo: ${rec.type}. Razón original: ${rec.reason}.`,
      performedBy: rejectedBy,
      timestamp: new Date().toISOString(),
    };
    await revenueHistoryRepository.save(resortId, auditItem);

    Logger.info(`[PricingRecommendationService] Recommendation rejected: ${id}`);
  }
}
export const pricingRecommendationService = new PricingRecommendationService();
