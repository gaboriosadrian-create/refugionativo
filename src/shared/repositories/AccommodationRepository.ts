import { BaseRepository } from '../../core/repositories/BaseRepository';
import { Accommodation } from '../../types';

export class AccommodationRepository extends BaseRepository<Accommodation> {
  constructor() {
    super('accommodations');
  }
}
export const accommodationRepository = new AccommodationRepository();
