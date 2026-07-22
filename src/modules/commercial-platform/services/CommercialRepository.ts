import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { getDocument, saveDocument, queryCollection } from '../../../core/firebase/firestore';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { 
  Subscription, 
  License, 
  BillingAccount, 
  BillingHistory, 
  BillingEvent, 
  PaymentAttempt, 
  CommercialPlan, 
  FinancialMetrics, 
  TrialAccount, 
  Coupon 
} from '../types';

export class CommercialRepository {
  // Generic helper for lists
  private static async getList<T>(collectionName: string, defaultVal: T[]): Promise<T[]> {
    if (isFirebaseConfigured) {
      try {
        const list = await queryCollection(collectionName);
        if (list && list.length > 0) return list as any as T[];
      } catch (err) {
        console.warn(`Error fetching ${collectionName} from Firestore:`, err);
      }
    }
    return LocalSaaSDb.get<T[]>(collectionName) || defaultVal;
  }

  // Generic helper for single doc
  private static async getDoc<T>(path: string, localKey: string): Promise<T | null> {
    if (isFirebaseConfigured) {
      try {
        const doc = await getDocument(path);
        if (doc) return doc as any as T;
      } catch (err) {
        console.warn(`Error fetching ${path} from Firestore:`, err);
      }
    }
    return LocalSaaSDb.get<T>(localKey) || null;
  }

  // Generic helper for saving
  private static async saveDoc<T>(path: string, localKey: string, data: any, listKeyForLocal?: string): Promise<void> {
    // Save to LocalSaaSDb
    if (listKeyForLocal) {
      const list = LocalSaaSDb.get<any[]>(listKeyForLocal) || [];
      const idx = list.findIndex(item => item.id === data.id);
      if (idx >= 0) {
        list[idx] = data;
      } else {
        list.push(data);
      }
      LocalSaaSDb.set(listKeyForLocal, list);
    } else {
      LocalSaaSDb.set(localKey, data);
    }

    // Save to Firestore
    if (isFirebaseConfigured) {
      try {
        await saveDocument(path, data, true);
      } catch (err) {
        console.error(`Error saving ${path} to Firestore:`, err);
      }
    }
  }

  // 1. Subscriptions
  public static async getSubscriptions(): Promise<Subscription[]> {
    return this.getList<Subscription>('subscriptions', []);
  }

  public static async getSubscription(tenantId: string): Promise<Subscription | null> {
    const list = await this.getSubscriptions();
    return list.find(s => s.tenantId === tenantId) || null;
  }

  public static async saveSubscription(sub: Subscription): Promise<void> {
    await this.saveDoc(`subscriptions/${sub.id}`, `subscription_${sub.tenantId}`, sub, 'subscriptions');
  }

  // 2. Licenses
  public static async getLicenses(): Promise<License[]> {
    return this.getList<License>('licenses', []);
  }

  public static async getLicense(tenantId: string): Promise<License | null> {
    const list = await this.getLicenses();
    return list.find(l => l.tenantId === tenantId) || null;
  }

  public static async saveLicense(license: License): Promise<void> {
    await this.saveDoc(`licenses/${license.id}`, `license_${license.tenantId}`, license, 'licenses');
  }

  // 3. Billing Accounts
  public static async getBillingAccounts(): Promise<BillingAccount[]> {
    return this.getList<BillingAccount>('billingAccounts', []);
  }

  public static async getBillingAccount(tenantId: string): Promise<BillingAccount | null> {
    const list = await this.getBillingAccounts();
    return list.find(a => a.tenantId === tenantId) || null;
  }

  public static async saveBillingAccount(acc: BillingAccount): Promise<void> {
    await this.saveDoc(`billingAccounts/${acc.id}`, `billingAccount_${acc.tenantId}`, acc, 'billingAccounts');
  }

  // 4. Billing History (or invoices)
  public static async getBillingHistory(): Promise<BillingHistory[]> {
    return this.getList<BillingHistory>('billingHistory', []);
  }

  public static async saveBillingHistory(item: BillingHistory): Promise<void> {
    await this.saveDoc(`billingHistory/${item.id}`, `billingHistory_${item.id}`, item, 'billingHistory');
    // Save to duplicate collection "invoices" as requested
    await this.saveDoc(`invoices/${item.id}`, `invoice_${item.id}`, item, 'invoices');
  }

  // 5. Billing Events
  public static async getBillingEvents(): Promise<BillingEvent[]> {
    return this.getList<BillingEvent>('billingEvents', []);
  }

  public static async saveBillingEvent(evt: BillingEvent): Promise<void> {
    await this.saveDoc(`billingEvents/${evt.id}`, `billingEvent_${evt.id}`, evt, 'billingEvents');
  }

  // 6. Payment Attempts
  public static async getPaymentAttempts(): Promise<PaymentAttempt[]> {
    return this.getList<PaymentAttempt>('paymentAttempts', []);
  }

  public static async savePaymentAttempt(attempt: PaymentAttempt): Promise<void> {
    await this.saveDoc(`paymentAttempts/${attempt.id}`, `paymentAttempt_${attempt.id}`, attempt, 'paymentAttempts');
  }

  // 7. Subscription Plans (using 'subscriptionPlans' collection)
  public static async getSubscriptionPlans(): Promise<CommercialPlan[]> {
    return this.getList<CommercialPlan>('subscriptionPlans', []);
  }

  public static async saveSubscriptionPlan(plan: CommercialPlan): Promise<void> {
    await this.saveDoc(`subscriptionPlans/${plan.id}`, `subscriptionPlan_${plan.id}`, plan, 'subscriptionPlans');
  }

  // 8. Financial Metrics
  public static async getFinancialMetrics(): Promise<FinancialMetrics | null> {
    return this.getDoc<FinancialMetrics>('financialMetrics/latest', 'financialMetrics_latest');
  }

  public static async saveFinancialMetrics(metrics: FinancialMetrics): Promise<void> {
    await this.saveDoc('financialMetrics/latest', 'financialMetrics_latest', metrics);
  }

  // 9. Trial Accounts
  public static async getTrialAccounts(): Promise<TrialAccount[]> {
    return this.getList<TrialAccount>('trialAccounts', []);
  }

  public static async getTrialAccount(tenantId: string): Promise<TrialAccount | null> {
    const list = await this.getTrialAccounts();
    return list.find(t => t.tenantId === tenantId) || null;
  }

  public static async saveTrialAccount(trial: TrialAccount): Promise<void> {
    await this.saveDoc(`trialAccounts/${trial.id}`, `trialAccount_${trial.tenantId}`, trial, 'trialAccounts');
  }

  // 10. Coupons
  public static async getCoupons(): Promise<Coupon[]> {
    return this.getList<Coupon>('coupons', []);
  }

  public static async saveCoupon(coupon: Coupon): Promise<void> {
    await this.saveDoc(`coupons/${coupon.id}`, `coupon_${coupon.id}`, coupon, 'coupons');
  }
}
