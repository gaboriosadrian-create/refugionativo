import { ChannelOta, OtaReservation } from './ChannelManagerTypes';
import { Logger } from '../logger/Logger';

export interface ChannelAdapterResult {
  success: boolean;
  latencyMs: number;
  error?: string;
  payloadSent?: any;
}

export interface ChannelAdapter {
  getOtaType(): ChannelOta;
  getOtaName(): string;
  
  syncAvailability(
    cabinId: number,
    otaRoomId: string,
    available: boolean,
    minStay?: number,
    maxStay?: number,
    leadTimeDays?: number
  ): Promise<ChannelAdapterResult>;

  syncRates(
    stayflowRateId: string,
    otaRateId: string,
    basePrice: number,
    markupPercent: number
  ): Promise<ChannelAdapterResult>;

  syncRestrictions(
    otaRoomId: string,
    closed: boolean,
    minStay?: number,
    maxStay?: number
  ): Promise<ChannelAdapterResult>;

  fetchReservations(): Promise<OtaReservation[]>;
}

export class BookingComAdapter implements ChannelAdapter {
  getOtaType(): ChannelOta { return ChannelOta.BOOKING_COM; }
  getOtaName(): string { return 'Booking.com'; }

  async syncAvailability(cabinId: number, otaRoomId: string, available: boolean, minStay = 1, maxStay = 30): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 100)); // Simulate API call
    Logger.info(`[Booking.com Adapter] Synced availability for Room ${otaRoomId} (Cabin ${cabinId}). Status: ${available ? 'Open' : 'Closed'}. Min stay: ${minStay}`);
    return {
      success: true,
      latencyMs: Date.now() - startTime,
      payloadSent: { roomId: otaRoomId, rateCategory: 'Standard', isAvailable: available, restrictions: { minStay, maxStay } }
    };
  }

  async syncRates(stayflowRateId: string, otaRateId: string, basePrice: number, markupPercent: number): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 120 + Math.random() * 80));
    const finalPrice = Math.round(basePrice * (1 + markupPercent / 100));
    Logger.info(`[Booking.com Adapter] Uploaded rate ${otaRateId} with ${markupPercent}% markup. Price: $${finalPrice}`);
    return {
      success: true,
      latencyMs: Date.now() - startTime,
      payloadSent: { ratePlanCode: otaRateId, currency: 'ARS', priceAmount: finalPrice }
    };
  }

  async syncRestrictions(otaRoomId: string, closed: boolean, minStay?: number, maxStay?: number): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 70));
    return { success: true, latencyMs: Date.now() - startTime };
  }

  async fetchReservations(): Promise<OtaReservation[]> {
    // Generate mock reservation import
    await new Promise(resolve => setTimeout(resolve, 150));
    if (Math.random() > 0.4) {
      const now = new Date();
      const checkInDate = new Date();
      checkInDate.setDate(now.getDate() + Math.floor(Math.random() * 10) + 3);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkInDate.getDate() + Math.floor(Math.random() * 4) + 2);

      const guests = ['Carlos Gomez', 'Lucia Fernandez', 'Robert Smith', 'Emma Watson'];
      const chosenGuest = guests[Math.floor(Math.random() * guests.length)];
      const totalDays = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));

      return [{
        otaBookingId: `BCOM-${Math.floor(100000 + Math.random() * 900000)}`,
        ota: ChannelOta.BOOKING_COM,
        guestName: chosenGuest,
        guestEmail: `${chosenGuest.toLowerCase().replace(' ', '.')}@example.com`,
        guestPhone: '+54911' + Math.floor(10000000 + Math.random() * 90000000),
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        cabinId: 1, // Default cabin reference
        totalPrice: 120000 * totalDays,
        paymentStatus: 'approved'
      }];
    }
    return [];
  }
}

export class AirbnbAdapter implements ChannelAdapter {
  getOtaType(): ChannelOta { return ChannelOta.AIRBNB; }
  getOtaName(): string { return 'Airbnb'; }

  async syncAvailability(cabinId: number, otaRoomId: string, available: boolean, minStay = 2): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 90 + Math.random() * 50));
    Logger.info(`[Airbnb Adapter] Synced listing ${otaRoomId} (Cabin ${cabinId}). Status: ${available ? 'Listed' : 'Snoozed'}`);
    return {
      success: true,
      latencyMs: Date.now() - startTime,
      payloadSent: { listingId: otaRoomId, calendarUpdated: true, blockDates: !available }
    };
  }

  async syncRates(stayflowRateId: string, otaRateId: string, basePrice: number, markupPercent: number): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    const finalPrice = Math.round(basePrice * (1 + markupPercent / 100));
    Logger.info(`[Airbnb Adapter] Saved pricing rule for Airbnb listing ${otaRateId}: $${finalPrice}`);
    return {
      success: true,
      latencyMs: Date.now() - startTime,
      payloadSent: { pricingRuleId: otaRateId, amount: finalPrice }
    };
  }

  async syncRestrictions(otaRoomId: string, closed: boolean, minStay?: number, maxStay?: number): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 60));
    return { success: true, latencyMs: Date.now() - startTime };
  }

  async fetchReservations(): Promise<OtaReservation[]> {
    await new Promise(resolve => setTimeout(resolve, 120));
    if (Math.random() > 0.5) {
      const now = new Date();
      const checkInDate = new Date();
      checkInDate.setDate(now.getDate() + Math.floor(Math.random() * 14) + 1);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkInDate.getDate() + Math.floor(Math.random() * 3) + 1);

      const guests = ['Alejandro Silva', 'Mariela Castro', 'John Doe', 'Emily Davis'];
      const chosenGuest = guests[Math.floor(Math.random() * guests.length)];
      const totalDays = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));

      return [{
        otaBookingId: `ABNB-${Math.floor(100000 + Math.random() * 900000)}`,
        ota: ChannelOta.AIRBNB,
        guestName: chosenGuest,
        guestEmail: `${chosenGuest.toLowerCase().replace(' ', '.')}@airbnb-mail.com`,
        guestPhone: '+54911' + Math.floor(20000000 + Math.random() * 80000000),
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        cabinId: 2,
        totalPrice: 150000 * totalDays,
        paymentStatus: 'approved'
      }];
    }
    return [];
  }
}

export class ExpediaAdapter implements ChannelAdapter {
  getOtaType(): ChannelOta { return ChannelOta.EXPEDIA; }
  getOtaName(): string { return 'Expedia'; }

  async syncAvailability(cabinId: number, otaRoomId: string, available: boolean, minStay = 1): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 120));
    Logger.info(`[Expedia Adapter] Synced allotment for RoomType ${otaRoomId}. Allotment set to: ${available ? 1 : 0}`);
    return {
      success: true,
      latencyMs: Date.now() - startTime,
      payloadSent: { ExpediaHotelId: 'EXP-109', RoomTypeId: otaRoomId, allotment: available ? 1 : 0 }
    };
  }

  async syncRates(stayflowRateId: string, otaRateId: string, basePrice: number, markupPercent: number): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 140));
    const finalPrice = Math.round(basePrice * (1 + markupPercent / 100));
    Logger.info(`[Expedia Adapter] Set Expedia QuickConnect rate ${otaRateId} to $${finalPrice}`);
    return {
      success: true,
      latencyMs: Date.now() - startTime,
      payloadSent: { RatePlanId: otaRateId, amount: finalPrice }
    };
  }

  async syncRestrictions(otaRoomId: string, closed: boolean, minStay?: number, maxStay?: number): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 80));
    return { success: true, latencyMs: Date.now() - startTime };
  }

  async fetchReservations(): Promise<OtaReservation[]> {
    await new Promise(resolve => setTimeout(resolve, 110));
    if (Math.random() > 0.6) {
      const now = new Date();
      const checkInDate = new Date();
      checkInDate.setDate(now.getDate() + Math.floor(Math.random() * 20) + 5);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkInDate.getDate() + Math.floor(Math.random() * 5) + 1);

      const guests = ['Mateo Rossi', 'Alice Cooper', 'Gabriela Mistral'];
      const chosenGuest = guests[Math.floor(Math.random() * guests.length)];
      const totalDays = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));

      return [{
        otaBookingId: `EXPE-${Math.floor(100000 + Math.random() * 900000)}`,
        ota: ChannelOta.EXPEDIA,
        guestName: chosenGuest,
        guestEmail: `${chosenGuest.toLowerCase().replace(' ', '.')}@expedia.com`,
        guestPhone: '+54911' + Math.floor(30000000 + Math.random() * 70000000),
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        cabinId: 3,
        totalPrice: 180000 * totalDays,
        paymentStatus: 'approved'
      }];
    }
    return [];
  }
}

export class VrboAdapter implements ChannelAdapter {
  getOtaType(): ChannelOta { return ChannelOta.VRBO; }
  getOtaName(): string { return 'Vrbo'; }

  async syncAvailability(cabinId: number, otaRoomId: string, available: boolean): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 110));
    return { success: true, latencyMs: Date.now() - startTime };
  }

  async syncRates(stayflowRateId: string, otaRateId: string, basePrice: number, markupPercent: number): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 120));
    return { success: true, latencyMs: Date.now() - startTime };
  }

  async syncRestrictions(otaRoomId: string, closed: boolean, minStay?: number, maxStay?: number): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 80));
    return { success: true, latencyMs: Date.now() - startTime };
  }

  async fetchReservations(): Promise<OtaReservation[]> {
    return [];
  }
}

export class GoogleHotelsAdapter implements ChannelAdapter {
  getOtaType(): ChannelOta { return ChannelOta.GOOGLE_HOTELS; }
  getOtaName(): string { return 'Google Hotels'; }

  async syncAvailability(cabinId: number, otaRoomId: string, available: boolean): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 95));
    return { success: true, latencyMs: Date.now() - startTime };
  }

  async syncRates(stayflowRateId: string, otaRateId: string, basePrice: number, markupPercent: number): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, latencyMs: Date.now() - startTime };
  }

  async syncRestrictions(otaRoomId: string, closed: boolean, minStay?: number, maxStay?: number): Promise<ChannelAdapterResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 75));
    return { success: true, latencyMs: Date.now() - startTime };
  }

  async fetchReservations(): Promise<OtaReservation[]> {
    return [];
  }
}
