import { BaseRepository } from '../../core/repositories/BaseRepository';
import { AccommodationType } from '../../types';

export class AccommodationTypeRepository extends BaseRepository<AccommodationType> {
  constructor() {
    super('accommodation_types');
  }
}
export const accommodationTypeRepository = new AccommodationTypeRepository();
