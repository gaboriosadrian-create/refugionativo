import { CustomerSuccessDb } from './CustomerSuccessDb';
import { CustomerHealth, Feedback, NpsResponse, CsatResponse, HealthStatus, SupportTicket, OnboardingProgress, HelpArticle } from '../types';

export class CustomerSuccessEngine {
  /**
   * Retrieves health status data for all active complexes.
   */
  public static getCustomerHealths(): CustomerHealth[] {
    return CustomerSuccessDb.getAll<CustomerHealth>('customerHealth');
  }

  /**
   * Recalculates the Health Score of a specific client/tenant based on direct metrics.
   * Health Score calculation algorithm (0-100):
   * - Usage Frequency: weekly logins / 20 * 30 points max
   * - Feature Adoption: adoption % * 30 points max
   * - Active Users: active users / 5 * 10 points max
   * - Open Tickets: minus 5 points per open incident (up to 20 points penalty)
   * - Satisfaction: satisfaction rate % * 30 points max
   */
  public static calculateHealthScore(tenantId: string): CustomerHealth | null {
    const healths = this.getCustomerHealths();
    const idx = healths.findIndex(h => h.tenantId === tenantId);
    if (idx === -1) return null;

    const h = healths[idx];

    // Base Math
    const usageScore = Math.min(30, (h.usageFrequency / 20) * 30);
    const adoptionScore = Math.min(30, (h.featureAdoptionRate / 100) * 30);
    const usersScore = Math.min(10, (h.activeUsersCount / 5) * 10);
    const ticketPenalty = Math.min(20, h.openIncidentsCount * 5);
    const satisfactionScore = Math.min(30, (h.satisfactionRate / 100) * 30);

    const calculatedScore = Math.round(
      Math.max(0, Math.min(100, usageScore + adoptionScore + usersScore - ticketPenalty + satisfactionScore))
    );

    let status: HealthStatus = 'Excelente';
    if (calculatedScore >= 80) status = 'Excelente';
    else if (calculatedScore >= 65) status = 'Saludable';
    else if (calculatedScore >= 40) status = 'En riesgo';
    else status = 'Crítico';

    const updatedHealth: CustomerHealth = {
      ...h,
      healthScore: calculatedScore,
      status,
      lastCalculated: new Date().toISOString()
    };

    healths[idx] = updatedHealth;
    CustomerSuccessDb.setAll('customerHealth', healths);

    return updatedHealth;
  }

  /**
   * Adds custom feedback linked to specific modules.
   */
  public static submitFeedback(params: {
    tenantId: string;
    userId: string;
    userEmail: string;
    module: string;
    rating: number;
    comment: string;
    suggestion?: string;
  }): Feedback {
    const feedbacks = CustomerSuccessDb.getAll<Feedback>('feedback');
    const newId = `fb-${feedbacks.length + 1}`;

    const newFeedback: Feedback = {
      id: newId,
      tenantId: params.tenantId,
      userId: params.userId,
      userEmail: params.userEmail,
      module: params.module,
      rating: params.rating,
      comment: params.comment,
      suggestion: params.suggestion,
      createdAt: new Date().toISOString()
    };

    feedbacks.push(newFeedback);
    CustomerSuccessDb.setAll('feedback', feedbacks);

    // Update customer satisfaction in health if applicable
    this.updateHealthSatisfactionRate(params.tenantId);

    return newFeedback;
  }

  /**
   * Submits an NPS response.
   */
  public static submitNps(params: {
    tenantId: string;
    userId: string;
    userEmail: string;
    score: number;
    comment?: string;
  }): NpsResponse {
    const npsList = CustomerSuccessDb.getAll<NpsResponse>('npsResponses');
    const newId = `nps-${npsList.length + 1}`;

    const newNps: NpsResponse = {
      id: newId,
      tenantId: params.tenantId,
      userId: params.userId,
      userEmail: params.userEmail,
      score: params.score,
      comment: params.comment,
      createdAt: new Date().toISOString()
    };

    npsList.push(newNps);
    CustomerSuccessDb.setAll('npsResponses', npsList);

    return newNps;
  }

  /**
   * Submits a CSAT response.
   */
  public static submitCsat(params: {
    tenantId: string;
    userId: string;
    userEmail: string;
    score: number;
    comment?: string;
  }): CsatResponse {
    const csatList = CustomerSuccessDb.getAll<CsatResponse>('csatResponses');
    const newId = `csat-${csatList.length + 1}`;

    const newCsat: CsatResponse = {
      id: newId,
      tenantId: params.tenantId,
      userId: params.userId,
      userEmail: params.userEmail,
      score: params.score,
      comment: params.comment,
      createdAt: new Date().toISOString()
    };

    csatList.push(newCsat);
    CustomerSuccessDb.setAll('csatResponses', csatList);

    // Update customer satisfaction in health
    this.updateHealthSatisfactionRate(params.tenantId);

    return newCsat;
  }

  /**
   * Updates average satisfaction score of health record based on feedback ratings.
   */
  private static updateHealthSatisfactionRate(tenantId: string) {
    const feedbacks = CustomerSuccessDb.getAll<Feedback>('feedback').filter(f => f.tenantId === tenantId);
    const csats = CustomerSuccessDb.getAll<CsatResponse>('csatResponses').filter(c => c.tenantId === tenantId);

    const ratings: number[] = [
      ...feedbacks.map(f => f.rating),
      ...csats.map(c => c.score)
    ];

    if (ratings.length === 0) return;

    const avgScore = ratings.reduce((acc, curr) => acc + curr, 0) / ratings.length; // e.g. 4.5 out of 5
    const satisfactionPercentage = Math.round((avgScore / 5) * 100);

    const healths = this.getCustomerHealths();
    const idx = healths.findIndex(h => h.tenantId === tenantId);
    if (idx !== -1) {
      healths[idx].satisfactionRate = satisfactionPercentage;
      CustomerSuccessDb.setAll('customerHealth', healths);
      // Recalculate full score
      this.calculateHealthScore(tenantId);
    }
  }

  /**
   * Retrieves Onboarding checklist progress.
   */
  public static getOnboardingProgress(tenantId: string): OnboardingProgress | null {
    const progressList = CustomerSuccessDb.getAll<OnboardingProgress>('onboardingProgress');
    return progressList.find(p => p.tenantId === tenantId) || null;
  }

  /**
   * Mark an onboarding checklist task as complete.
   */
  public static completeOnboardingTask(tenantId: string, taskId: string): OnboardingProgress | null {
    const progressList = CustomerSuccessDb.getAll<OnboardingProgress>('onboardingProgress');
    const idx = progressList.findIndex(p => p.tenantId === tenantId);
    if (idx === -1) return null;

    const p = progressList[idx];
    p.tasks = p.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, completed: true, completedAt: new Date().toISOString() };
      }
      return t;
    });

    // Calculate percent
    const completedCount = p.tasks.filter(t => t.completed).length;
    p.progressPercentage = Math.round((completedCount / p.tasks.length) * 100);
    p.updatedAt = new Date().toISOString();

    progressList[idx] = p;
    CustomerSuccessDb.setAll('onboardingProgress', progressList);

    // Dynamic adoption rate update
    const healths = CustomerSuccessDb.getAll<CustomerHealth>('customerHealth');
    const hIdx = healths.findIndex(h => h.tenantId === tenantId);
    if (hIdx !== -1) {
      healths[hIdx].featureAdoptionRate = p.progressPercentage;
      CustomerSuccessDb.setAll('customerHealth', healths);
      this.calculateHealthScore(tenantId);
    }

    return p;
  }

  /**
   * Computes Customer Success Dashboard KPIs and analytics.
   */
  public static getDashboardMetrics(tenantId: string) {
    const healths = this.getCustomerHealths();
    const activeClientsCount = healths.length;

    // Filter by tenant if applicable, or get system aggregate
    const tickets = CustomerSuccessDb.getAll<SupportTicket>('supportTickets');
    const openTicketsCount = tickets.filter(t => t.status !== 'Resuelto' && t.status !== 'Cerrado').length;

    // Average resolution time
    const resolvedTickets = tickets.filter(t => t.resolutionTimeMinutes !== undefined);
    const averageResolutionMinutes = resolvedTickets.length > 0
      ? Math.round(resolvedTickets.reduce((acc, curr) => acc + (curr.resolutionTimeMinutes || 0), 0) / resolvedTickets.length)
      : 0;

    // Average first response time
    const responseTickets = tickets.filter(t => t.firstResponseTimeMinutes !== undefined);
    const averageResponseMinutes = responseTickets.length > 0
      ? Math.round(responseTickets.reduce((acc, curr) => acc + (curr.firstResponseTimeMinutes || 0), 0) / responseTickets.length)
      : 0;

    // Popular help articles
    const articles = CustomerSuccessDb.getAll<HelpArticle>('helpArticles');
    const popularArticles = [...articles].sort((a, b) => b.views - a.views).slice(0, 3);

    // Onboarding progress averages
    const progressList = CustomerSuccessDb.getAll<OnboardingProgress>('onboardingProgress');
    const completedOnboardings = progressList.filter(p => p.progressPercentage === 100).length;

    // Average health score
    const avgHealthScore = healths.length > 0
      ? Math.round(healths.reduce((acc, curr) => acc + curr.healthScore, 0) / healths.length)
      : 80;

    // NPS score calculation: % promoters (9-10) - % detractors (0-6)
    const npsList = CustomerSuccessDb.getAll<NpsResponse>('npsResponses');
    let npsScore = 0;
    if (npsList.length > 0) {
      const promoters = npsList.filter(n => n.score >= 9).length;
      const detractors = npsList.filter(n => n.score <= 6).length;
      npsScore = Math.round(((promoters - detractors) / npsList.length) * 100);
    } else {
      npsScore = 85; // seeded default
    }

    // CSAT calculation (% of 4 or 5 ratings)
    const csatList = CustomerSuccessDb.getAll<CsatResponse>('csatResponses');
    const feedbacks = CustomerSuccessDb.getAll<Feedback>('feedback');
    const allSatisfactions = [
      ...csatList.map(c => c.score),
      ...feedbacks.map(f => f.rating)
    ];

    let csatPercentage = 90;
    if (allSatisfactions.length > 0) {
      const positiveScores = allSatisfactions.filter(s => s >= 4).length;
      csatPercentage = Math.round((positiveScores / allSatisfactions.length) * 100);
    }

    return {
      activeClientsCount,
      completedOnboardings,
      openTicketsCount,
      averageResolutionMinutes,
      averageResponseMinutes,
      popularArticles,
      averageHealthScore: avgHealthScore,
      npsScore,
      csatPercentage,
      totalOnboardingsCount: progressList.length
    };
  }
}
