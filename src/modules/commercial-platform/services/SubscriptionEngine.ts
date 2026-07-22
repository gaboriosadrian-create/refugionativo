import { Subscription, TrialAccount, SaaSPlanType, License } from '../types';
import { CommercialRepository } from './CommercialRepository';
import { PlanService } from './PlanService';
import { LicenseService } from './LicenseService';
import { BillingEngine } from './BillingEngine';
import { AuditService } from '../../../core/audit/AuditService';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class SubscriptionEngine {
  /**
   * Start a new subscription for a tenant. Default to a free trial (MÓDULO 4).
   */
  public static async createSubscription(
    tenantId: string,
    planId: SaaSPlanType,
    trialDurationDays = 14,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<Subscription> {
    const plan = await PlanService.getPlan(planId);
    
    const startDate = new Date().toISOString();
    const trialEndDate = new Date(Date.now() + trialDurationDays * 24 * 3600 * 1000).toISOString();
    // End date is trial end date initially, or subscription start
    const endDate = trialEndDate;

    const sub: Subscription = {
      id: `sub-${Date.now()}`,
      tenantId,
      planId,
      status: 'trial',
      startDate,
      endDate,
      trialStartDate: startDate,
      trialEndDate,
      trialDurationDays,
      amount: plan.price,
      billingPeriod: billingCycle,
      currency: 'USD',
      cancelAtPeriodEnd: false,
      createdAt: startDate,
      updatedAt: startDate
    };

    // Save Subscription
    await CommercialRepository.saveSubscription(sub);

    // Save Trial Account record
    const trialAcc: TrialAccount = {
      id: tenantId,
      tenantId,
      startDate,
      endDate: trialEndDate,
      durationDays: trialDurationDays,
      convertedToPaid: false
    };
    await CommercialRepository.saveTrialAccount(trialAcc);

    // Issue trial license
    await LicenseService.issueLicense(tenantId, planId, 'trial', startDate, trialEndDate);

    // Create billing event
    await BillingEngine.logBillingEvent(tenantId, 'trial_started', `Periodo de prueba gratuito iniciado para plan ${planId}. Expira en ${trialDurationDays} días.`);

    return sub;
  }

  /**
   * Get days remaining in trial (MÓDULO 4)
   */
  public static async getTrialDaysRemaining(tenantId: string): Promise<number> {
    const sub = await CommercialRepository.getSubscription(tenantId);
    if (!sub || sub.status !== 'trial' || !sub.trialEndDate) return 0;

    const diff = new Date(sub.trialEndDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }

  /**
   * Convert trial to paid subscription (MÓDULO 4)
   */
  public static async convertTrialToPaid(tenantId: string, couponCode?: string): Promise<Subscription> {
    const sub = await CommercialRepository.getSubscription(tenantId);
    if (!sub) throw new Error('Suscripción no encontrada');

    sub.status = 'active';
    sub.startDate = new Date().toISOString();
    sub.endDate = new Date(Date.now() + (sub.billingPeriod === 'monthly' ? 30 : 365) * 24 * 3600 * 1000).toISOString();
    sub.updatedAt = new Date().toISOString();

    await CommercialRepository.saveSubscription(sub);

    // Update trial convert status
    const trialAcc = await CommercialRepository.getTrialAccount(tenantId);
    if (trialAcc) {
      trialAcc.convertedToPaid = true;
      trialAcc.convertedAt = new Date().toISOString();
      await CommercialRepository.saveTrialAccount(trialAcc);
    }

    // Process initial paid charge
    await BillingEngine.processSubscriptionCharge(tenantId, sub.amount, couponCode);

    await BillingEngine.logBillingEvent(tenantId, 'trial_converted', `Prueba de servicio convertida exitosamente a cliente de pago en plan ${sub.planId}.`);
    
    return sub;
  }

  /**
   * Change Plan: Upgrade / Downgrade (MÓDULO 7)
   */
  public static async changePlan(
    tenantId: string, 
    newPlanId: SaaSPlanType, 
    operatorEmail: string
  ): Promise<Subscription> {
    const sub = await CommercialRepository.getSubscription(tenantId);
    if (!sub) throw new Error('Suscripción no encontrada');

    const currentPlanId = sub.planId;
    if (currentPlanId === newPlanId) {
      return sub;
    }

    const newPlan = await PlanService.getPlan(newPlanId);
    const oldPlan = await PlanService.getPlan(currentPlanId);

    const isUpgrade = newPlan.price > oldPlan.price;

    // RULE VALIDATIONS (MÓDULO 7)
    // If it's a downgrade, we must validate limits!
    if (!isUpgrade) {
      // Validate Rooms Count
      const accommodations = LocalSaaSDb.get<any[]>(`accommodations_${tenantId}`) || [];
      const roomsCount = accommodations.length; // We use accommodations as rooms inside StayFlow
      if (roomsCount > newPlan.maxRooms) {
        throw new Error(
          `No se puede realizar downgrade al plan "${newPlan.name}": El plan tiene un límite de ${newPlan.maxRooms} habitaciones, pero el tenant tiene registradas ${roomsCount} actualmente.`
        );
      }

      // Validate Users Count
      const resortUsers = LocalSaaSDb.get<any[]>('resortUsers') || [];
      const tenantUsers = resortUsers.filter(ru => ru.resortId === tenantId).length;
      if (tenantUsers > newPlan.maxUsers) {
        throw new Error(
          `No se puede realizar downgrade al plan "${newPlan.name}": El plan tiene un límite de ${newPlan.maxUsers} usuarios, pero el tenant tiene registrados ${tenantUsers} actualmente.`
        );
      }
    }

    // Process upgrade or downgrade
    sub.planId = newPlanId;
    sub.amount = newPlan.price;
    sub.updatedAt = new Date().toISOString();
    await CommercialRepository.saveSubscription(sub);

    // Re-issue updated license immediately
    const license = await LicenseService.issueLicense(
      tenantId, 
      newPlanId, 
      sub.status === 'trial' ? 'trial' : 'active', 
      sub.startDate, 
      sub.endDate
    );

    // Create events and audit logs
    const actionType = isUpgrade ? 'UPGRADE_SUBSCRIPTION' : 'DOWNGRADE_SUBSCRIPTION';
    const actionMsg = isUpgrade 
      ? `Cambio de plan (Upgrade) exitoso de ${currentPlanId} a ${newPlanId}. Nuevo costo: $${newPlan.price}/mes.`
      : `Cambio de plan (Downgrade) exitoso de ${currentPlanId} a ${newPlanId}. Nuevo costo: $${newPlan.price}/mes.`;

    await BillingEngine.logBillingEvent(tenantId, 'subscription_updated', actionMsg);
    
    await AuditService.record(
      'system',
      'system-admin',
      actionType,
      'subscription',
      tenantId,
      { currentPlanId },
      sub as any,
      operatorEmail
    );

    return sub;
  }

  /**
   * Cancel subscription (MÓDULO 7)
   */
  public static async cancelSubscription(tenantId: string, operatorEmail: string): Promise<Subscription> {
    const sub = await CommercialRepository.getSubscription(tenantId);
    if (!sub) throw new Error('Suscripción no encontrada');

    sub.status = 'cancelled';
    sub.updatedAt = new Date().toISOString();
    await CommercialRepository.saveSubscription(sub);

    // Suspend license on cancel
    await LicenseService.suspendLicense(tenantId);

    // Disable resort publicly
    const resorts = LocalSaaSDb.get<any[]>('resorts') || [];
    const idx = resorts.findIndex(r => r.id === tenantId);
    if (idx >= 0) {
      resorts[idx].active = false;
      LocalSaaSDb.set('resorts', resorts);
    }

    await BillingEngine.logBillingEvent(tenantId, 'subscription_cancelled', 'La suscripción ha sido cancelada por el administrador.');
    
    await AuditService.record(
      'system',
      'system-admin',
      'CANCEL_SUBSCRIPTION',
      'subscription',
      tenantId,
      null,
      sub as any,
      operatorEmail
    );

    return sub;
  }

  /**
   * Pause / Suspend subscription (MÓDULO 7)
   */
  public static async pauseSubscription(tenantId: string, operatorEmail: string): Promise<Subscription> {
    const sub = await CommercialRepository.getSubscription(tenantId);
    if (!sub) throw new Error('Suscripción no encontrada');

    sub.status = 'suspended';
    sub.updatedAt = new Date().toISOString();
    await CommercialRepository.saveSubscription(sub);

    await LicenseService.suspendLicense(tenantId);

    // Disable resort publicly
    const resorts = LocalSaaSDb.get<any[]>('resorts') || [];
    const idx = resorts.findIndex(r => r.id === tenantId);
    if (idx >= 0) {
      resorts[idx].active = false;
      LocalSaaSDb.set('resorts', resorts);
    }

    await BillingEngine.logBillingEvent(tenantId, 'account_suspended', 'Suscripción pausada temporalmente por el administrador.');
    
    await AuditService.record(
      'system',
      'system-admin',
      'SUSPEND_SUBSCRIPTION',
      'subscription',
      tenantId,
      null,
      sub as any,
      operatorEmail
    );

    return sub;
  }

  /**
   * Reactivate subscription (MÓDULO 7)
   */
  public static async reactivateSubscription(tenantId: string, operatorEmail: string): Promise<Subscription> {
    const sub = await CommercialRepository.getSubscription(tenantId);
    if (!sub) throw new Error('Suscripción no encontrada');

    sub.status = 'active';
    sub.endDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    sub.updatedAt = new Date().toISOString();
    await CommercialRepository.saveSubscription(sub);

    await LicenseService.reactivateLicense(tenantId, sub.planId, sub.endDate);

    // Enable resort publicly
    const resorts = LocalSaaSDb.get<any[]>('resorts') || [];
    const idx = resorts.findIndex(r => r.id === tenantId);
    if (idx >= 0) {
      resorts[idx].active = true;
      LocalSaaSDb.set('resorts', resorts);
    }

    await BillingEngine.logBillingEvent(tenantId, 'account_reactivated', 'Suscripción reactivada y habilitada con éxito.');
    
    await AuditService.record(
      'system',
      'system-admin',
      'REACTIVATE_SUBSCRIPTION',
      'subscription',
      tenantId,
      null,
      sub as any,
      operatorEmail
    );

    return sub;
  }
}
