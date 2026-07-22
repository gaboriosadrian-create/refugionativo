import { AnalyticsService } from './AnalyticsService';
import { BIRepository } from '../repositories/BIRepositories';
import { 
  ExecutiveDashboard, 
  BusinessReport, 
  ForecastModel, 
  ExecutiveAlert, 
  SavedView, 
  AnalyticsSnapshot,
  BIWidget
} from '../types';
import { Logger } from '../../../core/logger/Logger';
import { MetricsService } from '../../../core/observability/MetricsService';

export class BIEngine {
  /**
   * Central entrypoint to retrieve all Executive Dashboard information, filtered and curated
   */
  public static async getDashboardData(
    resortId: string,
    userId: string,
    filters: any = {}
  ): Promise<{
    kpis: AnalyticsSnapshot['kpis'];
    dashboard: ExecutiveDashboard;
    alerts: ExecutiveAlert[];
    comparisons: { current: AnalyticsSnapshot['kpis']; previous: AnalyticsSnapshot['kpis'] };
  }> {
    const startTime = Date.now();
    Logger.info(`[BIEngine] Serving dashboard data for resort: ${resortId}, user: ${userId}`);

    try {
      // 1. Calculate active KPIs with current filters
      const kpis = await AnalyticsService.calculateKPIs(resortId, filters);

      // 2. Fetch or initialize the User's Configurable Dashboard layout
      const dashboard = await this.getUserDashboard(resortId, userId);

      // 3. Scan and generate automatic Executive Alerts
      const alerts = await this.detectExecutiveAlerts(resortId, kpis);

      // 4. Retrieve comparative dataset (defaults to 'month' comparison)
      const timeframe = filters.timeframe || 'month';
      const comparisons = await AnalyticsService.getComparativeMetrics(resortId, timeframe);

      // Log report/query time to observability metrics
      const durationMs = Date.now() - startTime;
      MetricsService.recordMetric('bi_dashboard_load_time_ms', durationMs, 'ms', { resortId, userId });

      return {
        kpis,
        dashboard,
        alerts,
        comparisons
      };
    } catch (err) {
      Logger.error(`[BIEngine] Failed to retrieve dashboard data:`, err);
      throw err;
    }
  }

  /**
   * Handles user-specific executive dashboard creation or fallback settings
   */
  public static async getUserDashboard(resortId: string, userId: string): Promise<ExecutiveDashboard> {
    const dashboards = await BIRepository.getDashboards(resortId);
    let userDash = dashboards.find(d => d.userId === userId);

    if (!userDash) {
      // Initialize default dashboard layout for the user
      userDash = {
        id: `dashboard_${userId}_${Date.now()}`,
        resortId,
        userId,
        name: 'Mi Panel Principal',
        isDefault: true,
        widgets: this.getDefaultWidgets(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await BIRepository.saveDashboard(resortId, userDash);
    }
    return userDash;
  }

  /**
   * Saves custom user dashboard layouts
   */
  public static async saveUserDashboard(resortId: string, dashboard: ExecutiveDashboard): Promise<void> {
    dashboard.updatedAt = new Date().toISOString();
    await BIRepository.saveDashboard(resortId, dashboard);
    Logger.info(`[BIEngine] Custom dashboard updated: ${dashboard.id}`);
  }

  /**
   * Automatically scans calculated KPIs to raise Executive Alerts with actionable recommendations
   */
  public static async detectExecutiveAlerts(resortId: string, kpis: AnalyticsSnapshot['kpis']): Promise<ExecutiveAlert[]> {
    const alerts: ExecutiveAlert[] = [];
    const timestamp = new Date().toISOString();

    // 1. Drop in Revenue
    if (kpis.revenue < 1000) {
      alerts.push({
        id: `alert_rev_${Date.now()}`,
        resortId,
        title: 'Ingresos por debajo del umbral óptimo',
        description: `Los ingresos actuales ($${kpis.revenue}) se sitúan críticamente por debajo del mínimo objetivo mensual de $5,000.`,
        severity: 'critical',
        metricName: 'revenue',
        currentValue: kpis.revenue,
        thresholdValue: 5000,
        timestamp,
        resolved: false,
        recommendation: 'Active de inmediato el Revenue Management Engine para evaluar tarifas dinámicas automáticas o promueva ofertas de último minuto.'
      });
    }

    // 2. Drop in Occupancy
    if (kpis.occupancy < 40) {
      alerts.push({
        id: `alert_occ_${Date.now()}`,
        resortId,
        title: 'Baja ocupación registrada',
        description: `La ocupación del establecimiento se encuentra en un ${kpis.occupancy}%, por debajo del límite del 60%.`,
        severity: 'warning',
        metricName: 'occupancy',
        currentValue: kpis.occupancy,
        thresholdValue: 60,
        timestamp,
        resolved: false,
        recommendation: 'Revise la distribución de tarifas en el Channel Manager. Considere abrir disponibilidad en OTAs secundarias o lanzar una campaña de newsletter.'
      });
    }

    // 3. Spike in Cancellation Rate
    if (kpis.cancellationRate > 15) {
      alerts.push({
        id: `alert_cancel_${Date.now()}`,
        resortId,
        title: 'Tasa de cancelación inusualmente alta',
        description: `La tasa de cancelaciones ha subido al ${kpis.cancellationRate}%, superando el promedio tolerable del 10%.`,
        severity: 'warning',
        metricName: 'cancellationRate',
        currentValue: kpis.cancellationRate,
        thresholdValue: 10,
        timestamp,
        resolved: false,
        recommendation: 'Audite las políticas de cancelación flexible vigentes. Considere implementar tarifas no reembolsables con un 10% de descuento para asegurar reservas.'
      });
    }

    // 4. Low Guest Lifetime Value (Segment focus needed)
    if (kpis.guestLifetimeValue < 300) {
      alerts.push({
        id: `alert_ltv_${Date.now()}`,
        resortId,
        title: 'Valor de Huésped Histórico Bajo',
        description: `El promedio de valor histórico (LTV) se sitúa en $${kpis.guestLifetimeValue}, indicando baja fidelización o estadías cortas.`,
        severity: 'info',
        metricName: 'guestLifetimeValue',
        currentValue: kpis.guestLifetimeValue,
        thresholdValue: 400,
        timestamp,
        resolved: false,
        recommendation: 'Diseñe un programa de fidelización ("Guests Club") o envíe cupones de recompensa post-estadía para incentivar reservas recurrentes directas.'
      });
    }

    // Save alerts to collection for audit trails
    for (const alert of alerts) {
      await BIRepository.saveAlert(resortId, alert);
    }

    return alerts;
  }

  /**
   * Generates a fully compiled, structured Business Forecast Model
   */
  public static async getForecastProjections(
    resortId: string,
    targetMetric: 'revenue' | 'occupancy' | 'demand',
    days: number = 30
  ): Promise<ForecastModel> {
    const kpis = await AnalyticsService.calculateKPIs(resortId);
    
    // Generate simulated mathematical linear / seasonal projections based on current KPIs
    const projections: ForecastModel['projections'] = [];
    const baseline = targetMetric === 'revenue' 
      ? kpis.revenue / 30 
      : targetMetric === 'occupancy' 
        ? kpis.occupancy 
        : 5; // demand score

    const today = new Date();
    for (let i = 1; i <= days; i++) {
      const projectionDate = new Date(today);
      projectionDate.setDate(today.getDate() + i);
      
      // Introduce weekly seasonality (higher revenue/demand on weekends)
      const dayOfWeek = projectionDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6; // Friday, Saturday, Sunday
      const multiplier = isWeekend ? 1.25 : 0.85;

      const p50 = Math.round(baseline * multiplier * (1 + (i * 0.003)) * 100) / 100; // soft upward trend
      const p10 = Math.round(p50 * 0.85 * 100) / 100;
      const p90 = Math.round(p50 * 1.18 * 100) / 100;

      projections.push({
        date: projectionDate.toISOString().split('T')[0],
        p50,
        p10,
        p90
      });
    }

    const model: ForecastModel = {
      id: `forecast_${targetMetric}_${Date.now()}`,
      resortId,
      targetMetric,
      forecastDays: days,
      historicalPeriodDays: 60,
      modelType: 'seasonal_naive',
      projections,
      confidenceScore: 84, // static high confidence metric
      createdAt: new Date().toISOString()
    };

    // Save forecast configuration to database
    await BIRepository.saveForecastModel(resortId, model);

    return model;
  }

  /**
   * Returns list of default widgets for a fresh executive dashboard
   */
  private static getDefaultWidgets(): BIWidget[] {
    return [
      { id: 'w_1', type: 'kpi_card', title: 'Ocupación Real', metric: 'occupancy', size: 'sm', visible: true, position: 1 },
      { id: 'w_2', type: 'kpi_card', title: 'Tarifa Promedio (ADR)', metric: 'adr', size: 'sm', visible: true, position: 2 },
      { id: 'w_3', type: 'kpi_card', title: 'RevPAR', metric: 'revpar', size: 'sm', visible: true, position: 3 },
      { id: 'w_4', type: 'kpi_card', title: 'GOPPAR Ejecutivo', metric: 'goppar', size: 'sm', visible: true, position: 4 },
      { id: 'w_5', type: 'revenue_chart', title: 'Curva de Ingresos Consolidados', metric: 'revenue', size: 'lg', visible: true, position: 5 },
      { id: 'w_6', type: 'channel_distribution', title: 'Distribución por Canal de Reservas', metric: 'otaDistribution', size: 'md', visible: true, position: 6 },
      { id: 'w_7', type: 'segment_breakdown', title: 'Segmentación de Huéspedes', metric: 'revenueBySegment', size: 'md', visible: true, position: 7 },
      { id: 'w_8', type: 'property_comparison', title: 'Comparativa de Complejos Multi-Propiedad', metric: 'revenueByProperty', size: 'md', visible: true, position: 8 },
      { id: 'w_9', type: 'cleaning_productivity', title: 'Eficiencia de Stay Operations', metric: 'housekeepingProductivity', size: 'sm', visible: true, position: 9 }
    ];
  }
}
