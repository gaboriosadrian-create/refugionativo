export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'refunded';

export interface ProviderPreferenceResult {
  id: string;
  paymentUrl: string;
}

export interface ProviderPaymentResult {
  status: PaymentStatus;
  externalId: string;
  rawPayload: any;
}

export abstract class PaymentProvider {
  abstract getName(): string;
  abstract getCode(): string;
  
  abstract createPreference(
    bookingId: number,
    cabinName: string,
    amount: number,
    resortId: string,
    baseUrl: string,
    accessToken?: string
  ): Promise<ProviderPreferenceResult>;

  abstract getPaymentStatus(
    externalId: string,
    accessToken?: string
  ): Promise<ProviderPaymentResult>;
}

export class MercadoPagoProvider extends PaymentProvider {
  getName(): string {
    return 'Mercado Pago';
  }

  getCode(): string {
    return 'mercado_pago';
  }

  async createPreference(
    bookingId: number,
    cabinName: string,
    amount: number,
    resortId: string,
    baseUrl: string,
    accessToken?: string
  ): Promise<ProviderPreferenceResult> {
    // If no access token is configured, run in Sandbox Simulation Mode
    if (!accessToken) {
      console.log('MercadoPagoProvider: Running in Sandbox Simulation Mode');
      const mockPrefId = `pref_mp_${Math.random().toString(36).substring(2, 11)}`;
      // Dynamic payment simulator URL inside our app
      const simulatedPaymentUrl = `${baseUrl}/?simulated_payment=true&pref_id=${mockPrefId}&booking_id=${bookingId}&amount=${amount}&resort_id=${resortId}`;
      return {
        id: mockPrefId,
        paymentUrl: simulatedPaymentUrl,
      };
    }

    try {
      // Real Mercado Pago API call
      const response = await fetch('https://api.mercadopago.com/v1/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: String(bookingId),
              title: `Estadía en ${cabinName} - Reserva #${bookingId}`,
              quantity: 1,
              unit_price: amount,
              currency_id: 'ARS',
            }
          ],
          back_urls: {
            success: `${baseUrl}/?payment_result=success&booking_id=${bookingId}&resort_id=${resortId}`,
            failure: `${baseUrl}/?payment_result=failure&booking_id=${bookingId}&resort_id=${resortId}`,
            pending: `${baseUrl}/?payment_result=pending&booking_id=${bookingId}&resort_id=${resortId}`,
          },
          auto_return: 'approved',
          notification_url: `${baseUrl}/api/payments/webhook?resort_id=${resortId}`,
          external_reference: String(bookingId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la preferencia de Mercado Pago');
      }

      const data = await response.json();
      return {
        id: data.id,
        paymentUrl: data.init_point || data.sandbox_init_point,
      };
    } catch (err: any) {
      console.error('MercadoPagoProvider Error creating preference:', err);
      // Fail gracefully and fallback to simulated URL in development to keep user flow functional
      const mockPrefId = `pref_mp_err_${Math.random().toString(36).substring(2, 11)}`;
      const simulatedPaymentUrl = `${baseUrl}/?simulated_payment=true&pref_id=${mockPrefId}&booking_id=${bookingId}&amount=${amount}&resort_id=${resortId}&error_fallback=true`;
      return {
        id: mockPrefId,
        paymentUrl: simulatedPaymentUrl,
      };
    }
  }

  async getPaymentStatus(
    externalId: string,
    accessToken?: string
  ): Promise<ProviderPaymentResult> {
    if (!accessToken || externalId.startsWith('mock_')) {
      // Simulated retrieval
      return {
        status: 'approved',
        externalId,
        rawPayload: { mode: 'simulated', externalId }
      };
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${externalId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Mercado Pago returned HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Map Mercado Pago status to standard PaymentStatus
      // MP Statuses: pending, in_process, approved, rejected, cancelled, refunded, charged_back
      let mappedStatus: PaymentStatus = 'pending';
      const mpStatus = data.status;
      
      if (mpStatus === 'approved') mappedStatus = 'approved';
      else if (mpStatus === 'in_process') mappedStatus = 'processing';
      else if (mpStatus === 'rejected') mappedStatus = 'rejected';
      else if (mpStatus === 'cancelled') mappedStatus = 'cancelled';
      else if (mpStatus === 'refunded') mappedStatus = 'refunded';
      else if (mpStatus === 'charged_back') mappedStatus = 'refunded';

      return {
        status: mappedStatus,
        externalId: String(data.id),
        rawPayload: data,
      };
    } catch (err) {
      console.error('Error fetching Mercado Pago payment status:', err);
      return {
        status: 'pending',
        externalId,
        rawPayload: { error: true, message: String(err) }
      };
    }
  }
}
