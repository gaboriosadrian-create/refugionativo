import { ChannelOta } from './ChannelManagerTypes';
import { ChannelAdapter } from './ChannelAdapter';
import { BookingAdapter } from './BookingAdapter';
import { AirbnbAdapter } from './AirbnbAdapter';
import { ExpediaAdapter } from './ExpediaAdapter';
import { GoogleHotelsAdapter } from './GoogleHotelsAdapter';
import { VrboAdapter } from './VrboAdapter';

export class AdapterFactory {
  private static adapters: Record<ChannelOta, ChannelAdapter> = {
    [ChannelOta.BOOKING_COM]: new BookingAdapter(),
    [ChannelOta.AIRBNB]: new AirbnbAdapter(),
    [ChannelOta.EXPEDIA]: new ExpediaAdapter(),
    [ChannelOta.VRBO]: new VrboAdapter(),
    [ChannelOta.GOOGLE_HOTELS]: new GoogleHotelsAdapter()
  };

  /**
   * Retrieves the modular adapter implementation for a given channel automatically.
   * Completely eliminates conditional branching or repeated mapping.
   */
  public static getAdapter(ota: ChannelOta): ChannelAdapter {
    const adapter = this.adapters[ota];
    if (!adapter) {
      throw new Error(`Unsupported OTA channel adapter requested: ${ota}`);
    }
    return adapter;
  }
}
