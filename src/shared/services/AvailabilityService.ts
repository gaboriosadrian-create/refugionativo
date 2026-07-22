import { availabilityRepository } from '../repositories/AvailabilityRepository';
import { Availability } from '../../types';

export class AvailabilityService {
  static async getAvailability(resortId: string): Promise<Availability[]> {
    return availabilityRepository.getAll(resortId);
  }

  static async saveAvailability(resortId: string, availability: Availability): Promise<void> {
    await availabilityRepository.save(resortId, availability);
  }
}
export default AvailabilityService;
