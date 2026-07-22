import { BIRepository } from '../repositories/BIRepositories';
import { BusinessReport } from '../types';
import { Logger } from '../../../core/logger/Logger';
import { MetricsService } from '../../../core/observability/MetricsService';

export class ReportService {
  /**
   * Generates a dynamic report with full custom logic, filtration, and groupings
   */
  public static async runReport(
    resortId: string,
    report: BusinessReport,
    kpis: any
  ): Promise<{
    columns: string[];
    rows: Record<string, any>[];
    summary: { totalRows: number; generationTimeMs: number };
  }> {
    const startTime = Date.now();
    Logger.info(`[ReportService] Running report: ${report.title}`, report);

    try {
      const rows: Record<string, any>[] = [];
      const columns = ['Métrica', 'Valor', 'Grupo', 'Porcentaje'];

      // Process rows based on requested metrics & groupBys
      report.metrics.forEach(metricKey => {
        const value = kpis[metricKey];
        if (value === undefined) return;

        if (typeof value === 'object' && value !== null) {
          // Object group metrics (like revenueByChannel, otaDistribution, etc.)
          let total = 0;
          Object.values(value).forEach((v: any) => { total += Number(v); });

          Object.entries(value).forEach(([groupName, groupValue]) => {
            const numVal = Number(groupValue);
            const percentage = total > 0 ? `${Math.round((numVal / total) * 100)}%` : '0%';

            rows.push({
              Métrica: this.normalizeMetricLabel(metricKey),
              Valor: this.formatValue(metricKey, numVal),
              Grupo: groupName,
              Porcentaje: percentage,
              rawValue: numVal // for sorting
            });
          });
        } else {
          // Flat KPI cards
          rows.push({
            Métrica: this.normalizeMetricLabel(metricKey),
            Valor: this.formatValue(metricKey, Number(value)),
            Grupo: 'General',
            Porcentaje: '100%',
            rawValue: Number(value)
          });
        }
      });

      // Apply dynamic filtering if user set specific metric filters
      let filteredRows = [...rows];
      if (report.filters.segment) {
        filteredRows = filteredRows.filter(r => r.Grupo === 'General' || r.Grupo.toLowerCase() === report.filters.segment?.toLowerCase());
      }

      // Apply sorting
      if (report.sortBy) {
        const order = report.sortOrder || 'desc';
        filteredRows.sort((a, b) => {
          const valA = a[report.sortBy!] !== undefined ? a[report.sortBy!] : a.rawValue;
          const valB = b[report.sortBy!] !== undefined ? b[report.sortBy!] : b.rawValue;

          if (typeof valA === 'number' && typeof valB === 'number') {
            return order === 'asc' ? valA - valB : valB - valA;
          }
          return order === 'asc' 
            ? String(valA).localeCompare(String(valB)) 
            : String(valB).localeCompare(String(valA));
        });
      }

      const durationMs = Date.now() - startTime;
      
      // Observability: Log report generation times
      MetricsService.recordMetric('bi_report_generation_duration_ms', durationMs, 'ms', { resortId, reportType: report.reportType });
      Logger.info(`[ReportService] Finished generating report in ${durationMs}ms`);

      return {
        columns,
        rows: filteredRows,
        summary: {
          totalRows: filteredRows.length,
          generationTimeMs: durationMs
        }
      };
    } catch (err) {
      Logger.error(`[ReportService] Error generating report:`, err);
      throw err;
    }
  }

  /**
   * Standard label normalizer
   */
  private static normalizeMetricLabel(key: string): string {
    const labels: Record<string, string> = {
      occupancy: 'Tasa de Ocupación',
      adr: 'Tarifa Promedio Diaria (ADR)',
      revpar: 'Ingresos por Habitación Disponible (RevPAR)',
      goppar: 'Beneficio Operativo por Habitación (GOPPAR)',
      revenue: 'Ingresos Brutos',
      netRevenue: 'Ingresos Netos',
      avgStay: 'Estadía Promedio',
      avgBookingWindow: 'Antelación de Reserva Promedio',
      cancellationRate: 'Tasa de Cancelación',
      repeatGuestRate: 'Tasa de Clientes Recurrentes',
      guestLifetimeValue: 'Valor de Ciclo de Vida del Huésped (LTV)',
      housekeepingProductivity: 'Productividad de Housekeeping',
      maintenanceCost: 'Costos de Mantenimiento',
      avgCleaningTime: 'Tiempo de Limpieza Promedio',
      responseTime: 'Tiempo de Respuesta a Incidentes',
      otaDistribution: 'Distribución por OTAs',
      revenueByChannel: 'Ingresos por Canal',
      revenueByProperty: 'Ingresos por Complejo / Propiedad',
      revenueByAccommodation: 'Ingresos por Habitación / Unidad',
      revenueByCountry: 'Ingresos por País de Origen',
      revenueBySegment: 'Ingresos por Segmento de Cliente'
    };
    return labels[key] || key;
  }

  /**
   * Helper to format output value types properly
   */
  private static formatValue(key: string, val: number): string {
    if (['revenue', 'netRevenue', 'adr', 'revpar', 'goppar', 'maintenanceCost', 'guestLifetimeValue'].includes(key)) {
      return `$${val.toLocaleString('es-AR')}`;
    }
    if (['occupancy', 'cancellationRate', 'repeatGuestRate', 'housekeepingProductivity'].includes(key)) {
      return `${val}%`;
    }
    if (key === 'avgStay') {
      return `${val} noches`;
    }
    if (key === 'avgBookingWindow') {
      return `${val} días`;
    }
    if (key === 'avgCleaningTime') {
      return `${val} mins`;
    }
    if (key === 'responseTime') {
      return `${val} segs`;
    }
    return String(val);
  }

  /**
   * Configures a recurring scheduled email or platform notification dispatch for a business report
   */
  public static async scheduleReport(resortId: string, reportId: string, frequency: BusinessReport['scheduleFrequency'], recipient: string): Promise<void> {
    const reports = await BIRepository.getReports(resortId);
    const report = reports.find(r => r.id === reportId);
    if (!report) {
      throw new Error(`Report with id ${reportId} not found`);
    }

    report.isScheduled = true;
    report.scheduleFrequency = frequency;
    report.scheduleRecipient = recipient;

    await BIRepository.saveReport(resortId, report);
    Logger.info(`[ReportService] Report scheduled successfully: ${report.id} [${frequency}] to ${recipient}`);
  }
}
