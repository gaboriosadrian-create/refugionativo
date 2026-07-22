import { AccommodationConfigService } from '../../modules/accommodation-config/services/AccommodationConfigService';
import { Amenity } from '../../types';

export class AmenityService {
  static async getAmenities(resortId: string): Promise<Amenity[]> {
    const config = await AccommodationConfigService.getAccommodationConfig(resortId);
    return config.amenities as any[];
  }

  static async getAmenity(resortId: string, id: string): Promise<Amenity | null> {
    const amenities = await this.getAmenities(resortId);
    return amenities.find(a => a.id === id) || null;
  }

  static async saveAmenity(resortId: string, amenity: Amenity): Promise<void> {
    const config = await AccommodationConfigService.getAccommodationConfig(resortId);
    const amenities = [...config.amenities];
    const idx = amenities.findIndex(a => a.id === amenity.id);
    if (idx !== -1) {
      amenities[idx] = amenity as any;
    } else {
      amenities.push(amenity as any);
    }
    await AccommodationConfigService.saveAccommodationConfig(resortId, { ...config, amenities });
  }

  static async deleteAmenity(resortId: string, id: string): Promise<void> {
    const config = await AccommodationConfigService.getAccommodationConfig(resortId);
    const amenities = config.amenities.filter(a => a.id !== id);
    await AccommodationConfigService.saveAccommodationConfig(resortId, { ...config, amenities });
  }
}
export default AmenityService;
