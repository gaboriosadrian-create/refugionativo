import { BillingHistory, Coupon } from '../types';
import { CommercialRepository } from './CommercialRepository';

export class InvoiceService {
  private static async getVATRateForCountry(country: string): Promise<number> {
    const rates: Record<string, number> = {
      'Argentina': 0.21, // 21% IVA
      'Chile': 0.19,     // 19% IVA
      'Uruguay': 0.22,   // 22% IVA
      'España': 0.21,    // 21% IVA
      'Colombia': 0.19,  // 19% IVA
      'México': 0.16     // 16% IVA
    };
    return rates[country] !== undefined ? rates[country] : 0.0; // Default zero taxes or USA sales tax
  }

  public static async createCoupon(coupon: Coupon): Promise<void> {
    await CommercialRepository.saveCoupon(coupon);
  }

  public static async getCoupons(): Promise<Coupon[]> {
    const list = await CommercialRepository.getCoupons();
    if (list.length === 0) {
      // Seed default coupons
      const defaults: Coupon[] = [
        { id: 'BIENVENIDO10', code: 'BIENVENIDO10', discountType: 'percentage', discountValue: 10, expiryDate: '2027-12-31', active: true, redemptionsCount: 0 },
        { id: 'ANUALSAVE20', code: 'ANUALSAVE20', discountType: 'percentage', discountValue: 20, expiryDate: '2027-12-31', active: true, redemptionsCount: 0 },
        { id: 'DESCUENTO50', code: 'DESCUENTO50', discountType: 'percentage', discountValue: 50, expiryDate: '2027-12-31', active: true, redemptionsCount: 0 }
      ];
      for (const c of defaults) {
        await CommercialRepository.saveCoupon(c);
      }
      return defaults;
    }
    return list;
  }

  public static async validateCoupon(code: string): Promise<Coupon | null> {
    const coupons = await this.getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.active);
    if (!coupon) return null;

    const now = new Date();
    if (now > new Date(coupon.expiryDate)) {
      coupon.active = false;
      await CommercialRepository.saveCoupon(coupon);
      return null;
    }

    if (coupon.maxRedemptions !== undefined && coupon.redemptionsCount >= coupon.maxRedemptions) {
      coupon.active = false;
      await CommercialRepository.saveCoupon(coupon);
      return null;
    }

    return coupon;
  }

  public static async generateInvoice(
    tenantId: string, 
    baseAmount: number, 
    couponCode?: string
  ): Promise<BillingHistory> {
    let finalAmount = baseAmount;
    let discountApplied = 0;

    if (couponCode) {
      const coupon = await this.validateCoupon(couponCode);
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          discountApplied = (baseAmount * coupon.discountValue) / 100;
        } else {
          discountApplied = coupon.discountValue;
        }
        finalAmount = Math.max(0, baseAmount - discountApplied);
        
        // Update coupon redemptions
        coupon.redemptionsCount++;
        await CommercialRepository.saveCoupon(coupon);
      }
    }

    // Get billing account to extract country & business name
    const billingAcc = await CommercialRepository.getBillingAccount(tenantId);
    const country = billingAcc?.country || 'Argentina';
    const vatRate = await this.getVATRateForCountry(country);
    
    const tax = finalAmount * vatRate;
    const total = finalAmount + tax;

    const invId = `inv-${Date.now()}`;
    const invoiceNumber = `SF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const invoice: BillingHistory = {
      id: invId,
      tenantId,
      invoiceNumber,
      amount: Number(finalAmount.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      currency: billingAcc?.currency || 'USD',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0], // 5 days due date
      discountCode: couponCode,
      items: [
        {
          description: `Suscripción Mensual SaaS - StayFlow Platform`,
          amount: Number(baseAmount.toFixed(2))
        },
        ...(discountApplied > 0 ? [{ description: `Descuento aplicado: ${couponCode}`, amount: -Number(discountApplied.toFixed(2)) }] : []),
        ...(tax > 0 ? [{ description: `Impuesto Regional / IVA (${(vatRate * 100).toFixed(0)}%)`, amount: Number(tax.toFixed(2)) }] : [])
      ]
    };

    return invoice;
  }
}
