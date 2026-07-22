import { AccommodationConfigService } from '../../modules/accommodation-config/services/AccommodationConfigService';
import { AccommodationType } from '../../types';

export class AccommodationTypeService {
  static async getAccommodationTypes(resortId: string): Promise<AccommodationType[]> {
    const config = await AccommodationConfigService.getAccommodationConfig(resortId);
    return config.accommodationTypes as any[];
  }

  static async getAccommodationType(resortId: string, id: string): Promise<AccommodationType | null> {
    const types = await this.getAccommodationTypes(resortId);
    return types.find(t => t.id === id) || null;
  }

  static async saveAccommodationType(resortId: string, type: AccommodationType): Promise<void> {
    const config = await AccommodationConfigService.getAccommodationConfig(resortId);
    const types = [...config.accommodationTypes];
    const idx = types.findIndex(t => t.id === type.id);
    if (idx !== -1) {
      types[idx] = type as any;
    } else {
      types.push(type as any);
    }
    await AccommodationConfigService.saveAccommodationConfig(resortId, { ...config, accommodationTypes: types });
  }

  static async deleteAccommodationType(resortId: string, id: string): Promise<void> {
    const config = await AccommodationConfigService.getAccommodationConfig(resortId);
    const types = config.accommodationTypes.filter(t => t.id !== id);
    await AccommodationConfigService.saveAccommodationConfig(resortId, { ...config, accommodationTypes: types });
  }
}
export default AccommodationTypeService;
