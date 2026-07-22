import { BillingHistory, PaymentAttempt, BillingEvent, Subscription } from '../types';
import { CommercialRepository } from './CommercialRepository';
import { BillingProviderFactory } from './BillingProviderFactory';
import { InvoiceService } from './InvoiceService';
import { LicenseService } from './LicenseService';
import { AuditService } from '../../../core/audit/AuditService';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';

export class BillingEngine {
  /**
   * Process a subscription charge. Returns true if successful.
   */
  public static async processSubscriptionCharge(
    tenantId: string, 
    baseAmount: number, 
    couponCode?: string
  ): Promise<boolean> {
    const billingAcc = await CommercialRepository.getBillingAccount(tenantId);
    if (!billingAcc) {
      throw new Error(`Cuenta de facturación no encontrada para el Tenant ${tenantId}`);
    }

    const sub = await CommercialRepository.getSubscription(tenantId);
    if (!sub) {
      throw new Error(`Suscripción activa no encontrada para el Tenant ${tenantId}`);
    }

    // 1. Generate the pending invoice with regional VAT and discounts
    const invoice = await InvoiceService.generateInvoice(tenantId, baseAmount, couponCode);
    
    // Check if billing account has enough credit to cover the invoice
    if (billingAcc.credits >= invoice.total) {
      billingAcc.credits -= invoice.total;
      invoice.status = 'paid';
      invoice.paidAt = new Date().toISOString();
      await CommercialRepository.saveBillingHistory(invoice);
      await CommercialRepository.saveBillingAccount(billingAcc);

      // Log success event
      await this.logBillingEvent(tenantId, 'payment_succeeded', `Factura ${invoice.invoiceNumber} pagada con saldo a favor/créditos de la cuenta.`);
      return true;
    }

    // 2. Obtain designated payment provider based on country
    const providerName = billingAcc.paymentProvider !== 'none' 
      ? billingAcc.paymentProvider 
      : BillingProviderFactory.getProviderForCountry(billingAcc.country);
    
    const provider = BillingProviderFactory.getProvider(providerName);
    
    // Fallback payment method
    const paymentMethod = billingAcc.paymentMethod || { brand: 'Visa', last4: '4242' };

    // 3. Request charge execution from provider (abstraction)
    const response = await provider.charge({
      tenantId,
      subscriptionId: sub.id,
      amount: invoice.total,
      currency: invoice.currency,
      paymentMethod
    });

    if (response.success) {
      invoice.status = 'paid';
      invoice.paidAt = new Date().toISOString();
      await CommercialRepository.saveBillingHistory(invoice);

      // Update subscription dates
      sub.status = 'active';
      sub.updatedAt = new Date().toISOString();
      await CommercialRepository.saveSubscription(sub);

      // Restore active license
      const license = await LicenseService.getLicense(tenantId);
      if (license && license.status !== 'active') {
        await LicenseService.reactivateLicense(tenantId, sub.planId, sub.endDate);
      }

      await this.logBillingEvent(tenantId, 'payment_succeeded', `Factura ${invoice.invoiceNumber} procesada exitosamente vía ${providerName.toUpperCase()}. Transacción ID: ${response.transactionId}`);
      await this.triggerSystemNotification(
        'Pago SaaS Exitoso', 
        `Se ha procesado exitosamente el cobro mensual del plan ${sub.planId} por un total de $${invoice.total} para el tenant "${tenantId}".`
      );

      return true;
    } else {
      invoice.status = 'failed';
      await CommercialRepository.saveBillingHistory(invoice);

      await this.handlePaymentFailure(tenantId, sub, invoice, response.errorMessage || 'Declinado por el banco.');
      return false;
    }
  }

  /**
   * Handle payment failure, retries, and eventual suspension (Cobranza / MÓDULO 9)
   */
  public static async handlePaymentFailure(
    tenantId: string, 
    sub: Subscription, 
    invoice: BillingHistory, 
    errorMessage: string
  ) {
    // Save failed payment attempt
    const failedEvent = await this.logBillingEvent(
      tenantId, 
      'payment_failed', 
      `Intento de cobro fallido para la factura ${invoice.invoiceNumber}. Motivo: ${errorMessage}`
    );

    // Get payment attempts for this subscription to check how many failures
    const attempts = await CommercialRepository.getPaymentAttempts();
    const subAttempts = attempts.filter(a => a.subscriptionId === sub.id && a.status === 'failed');
    const attemptCount = subAttempts.length;

    if (attemptCount < 3) {
      // Schedule Retry (Cobranza engine retry cycle)
      sub.status = 'past_due';
      await CommercialRepository.saveSubscription(sub);

      const nextRetryHours = attemptCount === 1 ? 24 : 48;
      const nextRetryDate = new Date(Date.now() + nextRetryHours * 3600 * 1000).toISOString();
      
      const retryAttempt: PaymentAttempt = {
        id: `att-retry-${Date.now()}`,
        tenantId,
        subscriptionId: sub.id,
        amount: invoice.total,
        currency: invoice.currency,
        provider: 'stripe',
        status: 'retry_scheduled',
        attemptNumber: attemptCount + 1,
        nextRetryDate,
        timestamp: new Date().toISOString()
      };
      await CommercialRepository.savePaymentAttempt(retryAttempt);

      await this.triggerSystemNotification(
        'Intento de Cobro SaaS Fallido (Reintento Programado)', 
        `El cobro mensual de $${invoice.total} falló para "${tenantId}". Se programó un reintento en ${nextRetryHours} horas. Tarjeta terminada en ${subAttempts[0]?.id || '4242'}`
      );
    } else {
      // Max Retries Exceeded -> Suspend Account Automatically (MÓDULO 9 & MÓDULO 1)
      sub.status = 'suspended';
      await CommercialRepository.saveSubscription(sub);

      // Suspend License
      await LicenseService.suspendLicense(tenantId);

      // Disable resort temporarily
      const resorts = LocalSaaSDb.get<any[]>('resorts') || [];
      const idx = resorts.findIndex(r => r.id === tenantId);
      if (idx >= 0) {
        resorts[idx].active = false; // suspend public site access
        LocalSaaSDb.set('resorts', resorts);
      }

      await this.logBillingEvent(
        tenantId, 
        'account_suspended', 
        `Tenant "${tenantId}" suspendido automáticamente tras superar 3 intentos fallidos de cobro de suscripción.`
      );

      await this.triggerSystemNotification(
        'Suscripción Suspendida por Falta de Pago', 
        `El tenant "${tenantId}" ha sido suspendido tras 3 intentos fallidos de procesamiento de pago. El acceso al PMS y website público ha sido restringido.`
      );

      await AuditService.record(
        'system',
        'billing-engine@stayflow.app',
        'SUSPEND_TENANT_AUTO',
        'tenant',
        tenantId,
        null,
        { unpaidInvoice: invoice },
        'billing-engine@stayflow.app'
      );
    }
  }

  /**
   * Helper to allocate credits (MÓDULO 2)
   */
  public static async allocateCredits(tenantId: string, amount: number, details: string, operatorEmail: string): Promise<void> {
    const billingAcc = await CommercialRepository.getBillingAccount(tenantId);
    if (!billingAcc) throw new Error('Cuenta de facturación no encontrada');

    billingAcc.credits += amount;
    await CommercialRepository.saveBillingAccount(billingAcc);

    await this.logBillingEvent(tenantId, 'subscription_updated', `Se acreditaron $${amount} de saldo a favor. Motivo: ${details}`);
    await AuditService.record(
      'system',
      'system-admin',
      'ALLOCATE_CREDITS',
      'billing_account',
      tenantId,
      null,
      { amount, details },
      operatorEmail
    );
  }

  /**
   * Helper to log events
   */
  public static async logBillingEvent(tenantId: string, eventType: BillingEvent['eventType'], details: string): Promise<BillingEvent> {
    const evt: BillingEvent = {
      id: `evt-${Date.now()}`,
      tenantId,
      eventType,
      details,
      timestamp: new Date().toISOString()
    };
    await CommercialRepository.saveBillingEvent(evt);
    return evt;
  }

  /**
   * Notification Engine trigger helper
   */
  private static async triggerSystemNotification(title: string, message: string) {
    try {
      const notifications = LocalSaaSDb.get<any[]>('notifications_system') || [];
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title,
        message,
        type: 'SYSTEM',
        read: false,
        timestamp: new Date().toISOString()
      });
      LocalSaaSDb.set('notifications_system', notifications);
    } catch (e) {
      console.warn('Billing Notification dispatch failed:', e);
    }
  }
}
