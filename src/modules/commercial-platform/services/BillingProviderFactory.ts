import { PaymentAttempt } from '../types';
import { CommercialRepository } from './CommercialRepository';

export interface ChargeRequest {
  tenantId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentMethod: { brand: string; last4: string };
}

export interface ChargeResponse {
  success: boolean;
  transactionId: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface IBillingProvider {
  charge(request: ChargeRequest): Promise<ChargeResponse>;
  generatePaymentLink(tenantId: string, amount: number, currency: string, description: string): Promise<string>;
}

// Concrete Stripe Provider
export class StripeBillingProvider implements IBillingProvider {
  public async charge(request: ChargeRequest): Promise<ChargeResponse> {
    // Simulating card processing
    const isSuccess = request.paymentMethod.last4 !== '9999'; // Simulated error for 9999 card
    
    const attempt: PaymentAttempt = {
      id: `att-stripe-${Date.now()}`,
      tenantId: request.tenantId,
      subscriptionId: request.subscriptionId,
      amount: request.amount,
      currency: request.currency,
      provider: 'stripe',
      status: isSuccess ? 'success' : 'failed',
      errorCode: isSuccess ? undefined : 'CARD_DECLINED',
      errorMessage: isSuccess ? undefined : 'La tarjeta de crédito tiene fondos insuficientes.',
      attemptNumber: 1,
      timestamp: new Date().toISOString()
    };
    await CommercialRepository.savePaymentAttempt(attempt);

    return {
      success: isSuccess,
      transactionId: `ch_stripe_${Date.now()}`,
      errorCode: isSuccess ? undefined : 'CARD_DECLINED',
      errorMessage: isSuccess ? undefined : 'La tarjeta de crédito tiene fondos insuficientes.'
    };
  }

  public async generatePaymentLink(tenantId: string, amount: number, currency: string, description: string): Promise<string> {
    return `https://checkout.stripe.com/pay/stayflow_simulated_${tenantId}?amount=${amount}&currency=${currency}`;
  }
}

// Concrete Mercado Pago Provider (Latin America / Argentina/ Brazil/ etc.)
export class MercadoPagoBillingProvider implements IBillingProvider {
  public async charge(request: ChargeRequest): Promise<ChargeResponse> {
    // Simulating MP API processing
    const isSuccess = request.paymentMethod.last4 !== '8888'; // Simulated error for 8888 card

    const attempt: PaymentAttempt = {
      id: `att-mp-${Date.now()}`,
      tenantId: request.tenantId,
      subscriptionId: request.subscriptionId,
      amount: request.amount,
      currency: request.currency,
      provider: 'mercadopago',
      status: isSuccess ? 'success' : 'failed',
      errorCode: isSuccess ? undefined : 'cc_rejected_high_risk',
      errorMessage: isSuccess ? undefined : 'Pago rechazado por sospecha de fraude (Filtro de seguridad MP).',
      attemptNumber: 1,
      timestamp: new Date().toISOString()
    };
    await CommercialRepository.savePaymentAttempt(attempt);

    return {
      success: isSuccess,
      transactionId: `mp_pay_${Date.now()}`,
      errorCode: isSuccess ? undefined : 'cc_rejected_high_risk',
      errorMessage: isSuccess ? undefined : 'Pago rechazado por sospecha de fraude (Filtro de seguridad MP).'
    };
  }

  public async generatePaymentLink(tenantId: string, amount: number, currency: string, description: string): Promise<string> {
    return `https://www.mercadopago.com/checkout/stayflow_simulated_${tenantId}?pref_id=${Date.now()}`;
  }
}

// Concrete PayPal Provider
export class PayPalBillingProvider implements IBillingProvider {
  public async charge(request: ChargeRequest): Promise<ChargeResponse> {
    const isSuccess = request.paymentMethod.last4 !== '7777'; // Simulated error for 7777 card

    const attempt: PaymentAttempt = {
      id: `att-paypal-${Date.now()}`,
      tenantId: request.tenantId,
      subscriptionId: request.subscriptionId,
      amount: request.amount,
      currency: request.currency,
      provider: 'paypal',
      status: isSuccess ? 'success' : 'failed',
      errorCode: isSuccess ? undefined : 'PAYER_ACTION_REQUIRED',
      errorMessage: isSuccess ? undefined : 'El cliente debe autorizar la transacción en su portal de PayPal.',
      attemptNumber: 1,
      timestamp: new Date().toISOString()
    };
    await CommercialRepository.savePaymentAttempt(attempt);

    return {
      success: isSuccess,
      transactionId: `paypal_txn_${Date.now()}`,
      errorCode: isSuccess ? undefined : 'PAYER_ACTION_REQUIRED',
      errorMessage: isSuccess ? undefined : 'El cliente debe autorizar la transacción en su portal de PayPal.'
    };
  }

  public async generatePaymentLink(tenantId: string, amount: number, currency: string, description: string): Promise<string> {
    return `https://paypal.com/checkout/stayflow_simulated_${tenantId}?amount=${amount}`;
  }
}

// Billing Provider Factory (SOLID Open-Closed Principle)
export class BillingProviderFactory {
  public static getProvider(provider: 'stripe' | 'mercadopago' | 'paypal'): IBillingProvider {
    switch (provider) {
      case 'stripe':
        return new StripeBillingProvider();
      case 'mercadopago':
        return new MercadoPagoBillingProvider();
      case 'paypal':
        return new PayPalBillingProvider();
      default:
        return new StripeBillingProvider();
    }
  }

  public static getProviderForCountry(country: string): 'stripe' | 'mercadopago' | 'paypal' {
    const MP_COUNTRIES = ['Argentina', 'Chile', 'Uruguay', 'Colombia', 'México', 'Peru', 'Brasil'];
    if (MP_COUNTRIES.includes(country)) {
      return 'mercadopago';
    }
    const PAYPAL_COUNTRIES = ['España', 'EEUU', 'USA', 'Reino Unido'];
    if (PAYPAL_COUNTRIES.includes(country)) {
      return 'paypal';
    }
    return 'stripe'; // Default global gateway
  }
}
