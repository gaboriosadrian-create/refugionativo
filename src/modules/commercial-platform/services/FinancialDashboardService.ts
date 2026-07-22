import { FinancialMetrics } from '../types';
import { CommercialRepository } from './CommercialRepository';

export class FinancialDashboardService {
  /**
   * Recalculate full financial KPIs and persist them (MÓDULO 10)
   */
  public static async recalculateFinancialMetrics(): Promise<FinancialMetrics> {
    const subscriptions = await CommercialRepository.getSubscriptions();
    const billingHistory = await CommercialRepository.getBillingHistory();
    const accounts = await CommercialRepository.getBillingAccounts();

    // 1. Client counts
    const activeSubs = subscriptions.filter(s => s.status === 'active');
    const trialSubs = subscriptions.filter(s => s.status === 'trial');
    const suspendedSubs = subscriptions.filter(s => s.status === 'suspended' || s.status === 'cancelled');

    const activeCount = activeSubs.length;
    const trialCount = trialSubs.length;
    const suspendedCount = suspendedSubs.length;

    // 2. Revenue by Plan & Country (aggregating MRR)
    const byPlan: Record<string, number> = {
      Starter: 0,
      Professional: 0,
      Business: 0,
      Enterprise: 0
    };
    const byCountry: Record<string, number> = {};

    let mrr = 0;
    let monthlyBilling = 0;
    let yearlyBilling = 0;

    for (const sub of activeSubs) {
      const planAmount = sub.amount;
      const equivalentMonthlyAmount = sub.billingPeriod === 'yearly' ? planAmount / 12 : planAmount;
      
      mrr += equivalentMonthlyAmount;
      byPlan[sub.planId] = (byPlan[sub.planId] || 0) + equivalentMonthlyAmount;

      if (sub.billingPeriod === 'yearly') {
        yearlyBilling += planAmount;
      } else {
        monthlyBilling += planAmount;
      }

      // Resolve country
      const acc = accounts.find(a => a.tenantId === sub.tenantId);
      const country = acc?.country || 'Argentina';
      byCountry[country] = (byCountry[country] || 0) + equivalentMonthlyAmount;
    }

    const arr = mrr * 12;

    // 3. Metrics (ARPU, Churn, LTV)
    const totalClients = activeCount + suspendedCount;
    // Churn rate calculation based on history vs cancellations (or simulated default 2.5% if empty)
    const cancelledCount = subscriptions.filter(s => s.status === 'cancelled').length;
    const churn = totalClients > 0 ? Number(((cancelledCount / totalClients) * 100).toFixed(1)) : 2.5;

    const arpu = activeCount > 0 ? Number((mrr / activeCount).toFixed(2)) : 0;
    const churnFraction = churn / 100;
    const ltv = churnFraction > 0 ? Number((arpu / churnFraction).toFixed(2)) : arpu * 24; // If churn is 0, estimate LTV on 24 months

    const metrics: FinancialMetrics = {
      id: 'summary',
      mrr: Number(mrr.toFixed(2)),
      arr: Number(arr.toFixed(2)),
      churn,
      ltv: Number(ltv.toFixed(2)),
      arpu,
      activeCount,
      trialCount,
      suspendedCount,
      monthlyBilling,
      yearlyBilling,
      byPlan,
      byCountry,
      timestamp: new Date().toISOString()
    };

    await CommercialRepository.saveFinancialMetrics(metrics);
    return metrics;
  }

  /**
   * Retrieve current cached financial metrics or compute them immediately
   */
  public static async getFinancialMetrics(): Promise<FinancialMetrics> {
    const cached = await CommercialRepository.getFinancialMetrics();
    if (cached) return cached;
    return this.recalculateFinancialMetrics();
  }
}
