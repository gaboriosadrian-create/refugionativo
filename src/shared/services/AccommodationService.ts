import { accommodationRepository } from '../repositories/AccommodationRepository';
import { Accommodation } from '../../types';

export class AccommodationService {
  static async getAccommodations(resortId: string): Promise<Accommodation[]> {
    return accommodationRepository.getAll(resortId);
  }

  static async getAccommodation(resortId: string, id: number): Promise<Accommodation | null> {
    return accommodationRepository.getById(resortId, id);
  }

  static async saveAccommodation(resortId: string, accommodation: Accommodation): Promise<void> {
    await accommodationRepository.save(resortId, accommodation);
  }

  static async deleteAccommodation(resortId: string, id: number): Promise<void> {
    await accommodationRepository.delete(resortId, id);
  }
}
export default AccommodationService;
