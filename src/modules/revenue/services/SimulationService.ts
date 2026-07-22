import { pricingSimulationRepository } from '../repositories/PricingSimulationRepository';
import { revenueHistoryRepository } from '../repositories/RevenueHistoryRepository';
import { PricingSimulation, RevenueHistoryItem } from '../types';
import { KPIService } from './KPIService';
import { Logger } from '../../../core/logger/Logger';
import { ObservabilityService } from '../../../core/observability/ObservabilityService';

export class SimulationService {
  public static async getSimulations(resortId: string): Promise<PricingSimulation[]> {
    try {
      return await pricingSimulationRepository.getAll(resortId);
    } catch (e) {
      Logger.error('[SimulationService] Error loading simulations:', e);
      return [];
    }
  }

  public static async runAndSaveSimulation(
    resortId: string,
    name: string,
    description: string,
    priceAdjustmentPct: number, // e.g., 12 for +12%, -10 for -10%
    occupancyElasticity: number, // e.g., -0.5
    createdBy: string
  ): Promise<PricingSimulation> {
    const start = Date.now();
    
    // Get current/base KPIs
    const kpis = await KPIService.getKPIs(resortId);

    const baseRevenue = kpis.revenue || 120000;
    const baseOccupancy = kpis.occupancy || 65; // e.g., 65%
    const baseAdr = kpis.adr || 12000;
    const baseRevPar = kpis.revPar || (baseAdr * baseOccupancy / 100);

    // Perform economic elasticity simulation
    // simulatedAdr = baseAdr * (1 + deltaPrice)
    const simulatedAdr = Math.round(baseAdr * (1 + priceAdjustmentPct / 100));

    // % Change in Occupancy = % Change in Price * Elasticity
    // e.g. +10% price * -0.5 elasticity = -5% occupancy change (multiplicative or additive)
    // Multiplicative: simulatedOccupancy = baseOccupancy * (1 + (priceAdjustmentPct * elasticity) / 100)
    const occupancyChangePct = priceAdjustmentPct * occupancyElasticity;
    let simulatedOccupancy = baseOccupancy * (1 + occupancyChangePct / 100);
    simulatedOccupancy = Math.max(0, Math.min(100, Math.round(simulatedOccupancy * 10) / 10));

    // RevPAR = ADR * Occupancy%
    const simulatedRevPar = Math.round(simulatedAdr * (simulatedOccupancy / 100));

    // simulatedRevenue = baseRevenue * (ADR factor) * (Occupancy factor)
    const simulatedRevenue = Math.round(
      baseRevenue * (simulatedAdr / baseAdr) * (simulatedOccupancy / (baseOccupancy || 1))
    );

    const simulation: PricingSimulation = {
      id: `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      name,
      description,
      priceAdjustmentPct,
      occupancyElasticity,
      baseRevenue,
      baseOccupancy,
      baseAdr,
      baseRevPar,
      simulatedRevenue,
      simulatedOccupancy,
      simulatedAdr,
      simulatedRevPar,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    await pricingSimulationRepository.save(resortId, simulation);

    // Save audit log
    const audit: RevenueHistoryItem = {
      id: `audit_sim_${Date.now()}`,
      resortId,
      action: 'Ejecución de Simulación',
      details: `Escenario "${name}": Ajuste de precio ${priceAdjustmentPct}% con elasticidad ${occupancyElasticity}. Ingresos sim: $${simulatedRevenue.toLocaleString()} vs base: $${baseRevenue.toLocaleString()}.`,
      performedBy: createdBy,
      timestamp: new Date().toISOString(),
    };
    await revenueHistoryRepository.save(resortId, audit);

    // Record Metrics
    ObservabilityService.recordMetric('revenue_simulations_run', 1, 'count', { resortId });
    ObservabilityService.recordMetric('revenue_calculation_time_ms', Date.now() - start, 'ms', {
      action: 'run_simulation',
    });

    Logger.info(`[SimulationService] Simulation executed and saved: ${name}`);
    return simulation;
  }

  public static async deleteSimulation(resortId: string, id: string): Promise<void> {
    await pricingSimulationRepository.delete(resortId, id);
    Logger.info(`[SimulationService] Deleted simulation: ${id}`);
  }
}
export const simulationService = new SimulationService();
