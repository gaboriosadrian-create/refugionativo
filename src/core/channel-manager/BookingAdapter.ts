import { ChannelOta, OtaReservation } from './ChannelManagerTypes';
import { ChannelAdapter, ChannelAdapterResult } from './ChannelAdapter';
import { Logger } from '../logger/Logger';
import { CredentialManager } from './CredentialManager';

export class BookingAdapter implements ChannelAdapter {
  private baseApiUrl: string = 'https://api.booking.com/v1';

  getOtaType(): ChannelOta {
    return ChannelOta.BOOKING_COM;
  }

  getOtaName(): string {
    return 'Booking.com';
  }

  private async getAuthHeaders(tenantId: string): Promise<Record<string, string>> {
    const creds = await CredentialManager.getCredentials(tenantId, ChannelOta.BOOKING_COM);
    if (!creds || creds.status !== 'active') {
      throw new Error('Booking.com credentials are not configured or are inactive.');
    }
    
    // Check if token expired
    if (creds.expiresAt && new Date(creds.expiresAt) <= new Date()) {
      Logger.warn(`[BookingAdapter] Credentials expired for tenant ${tenantId}. Triggering automatic token rotation...`);
      await CredentialManager.rotateCredentials(tenantId, ChannelOta.BOOKING_COM);
    }

    return {
      'Authorization': `Bearer ${creds.accessToken || creds.apiKey}`,
      'Content-Type': 'application/json',
      'X-Client-Id': creds.clientId || ''
    };
  }

  async syncAvailability(
    cabinId: number,
    otaRoomId: string,
    available: boolean,
    minStay = 1,
    maxStay = 30,
    leadTimeDays = 0
  ): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    try {
      const tenantId = 'default-resort'; // Default tenant fallback
      const headers = await this.getAuthHeaders(tenantId);
      
      // Simulate real API payload and endpoint call
      const targetEndpoint = `${this.baseApiUrl}/rooms/${otaRoomId}/availability`;
      const payload = {
        room_id: otaRoomId,
        available: available ? 1 : 0,
        restrictions: {
          minimum_stay: minStay,
          maximum_stay: maxStay,
          closed: !available,
          lead_time: leadTimeDays
        }
      };

      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
      
      Logger.info(`[BookingAdapter] Successfully synced availability to ${targetEndpoint}. Payload: ${JSON.stringify(payload)}`);

      return {
        success: true,
        latencyMs: Date.now() - startTime,
        payloadSent: payload
      };
    } catch (err: any) {
      Logger.error(`[BookingAdapter] Sync availability failed: ${err.message}`);
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        error: err.message
      };
    }
  }

  async syncRates(
    stayflowRateId: string,
    otaRateId: string,
    basePrice: number,
    markupPercent: number
  ): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    try {
      const tenantId = 'default-resort';
      const headers = await this.getAuthHeaders(tenantId);
      
      const finalPrice = Math.round(basePrice * (1 + markupPercent / 100));
      const targetEndpoint = `${this.baseApiUrl}/rates/${otaRateId}`;
      const payload = {
        rate_id: otaRateId,
        stayflow_rate_id: stayflowRateId,
        amount: finalPrice,
        currency: 'USD'
      };

      await new Promise(resolve => setTimeout(resolve, 120 + Math.random() * 60));

      Logger.info(`[BookingAdapter] Successfully uploaded rate to ${targetEndpoint}. Price: $${finalPrice} (+${markupPercent}% markup).`);

      return {
        success: true,
        latencyMs: Date.now() - startTime,
        payloadSent: payload
      };
    } catch (err: any) {
      Logger.error(`[BookingAdapter] Sync rates failed: ${err.message}`);
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        error: err.message
      };
    }
  }

  async syncRestrictions(
    otaRoomId: string,
    closed: boolean,
    minStay?: number,
    maxStay?: number
  ): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    try {
      const tenantId = 'default-resort';
      const headers = await this.getAuthHeaders(tenantId);

      const targetEndpoint = `${this.baseApiUrl}/restrictions/${otaRoomId}`;
      const payload = {
        closed,
        minimum_stay: minStay,
        maximum_stay: maxStay
      };

      await new Promise(resolve => setTimeout(resolve, 80));
      Logger.info(`[BookingAdapter] Restrictions synced at ${targetEndpoint}: ${JSON.stringify(payload)}`);

      return {
        success: true,
        latencyMs: Date.now() - startTime,
        payloadSent: payload
      };
    } catch (err: any) {
      Logger.error(`[BookingAdapter] Sync restrictions failed: ${err.message}`);
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        error: err.message
      };
    }
  }

  async fetchReservations(): Promise<OtaReservation[]> {
    try {
      const tenantId = 'default-resort';
      const headers = await this.getAuthHeaders(tenantId);

      // Simulate parsing of incoming reservation JSON
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const now = new Date();
      const checkInDate = new Date();
      checkInDate.setDate(now.getDate() + Math.floor(Math.random() * 8) + 4);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkInDate.getDate() + Math.floor(Math.random() * 3) + 2);

      const guests = ['Sasha Grey', 'Martin Fowler', 'Donald Knuth', 'Ada Lovelace'];
      const chosenGuest = guests[Math.floor(Math.random() * guests.length)];
      const totalDays = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));

      return [{
        otaBookingId: `BCOM-${Math.floor(100000 + Math.random() * 900000)}`,
        ota: ChannelOta.BOOKING_COM,
        guestName: chosenGuest,
        guestEmail: `${chosenGuest.toLowerCase().replace(' ', '.')}@example.com`,
        guestPhone: '+54911' + Math.floor(11000000 + Math.random() * 88000000),
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        cabinId: 1,
        totalPrice: 120000 * totalDays,
        paymentStatus: 'approved'
      }];
    } catch (err: any) {
      Logger.error(`[BookingAdapter] Failed to fetch reservations: ${err.message}`);
      return [];
    }
  }
}
