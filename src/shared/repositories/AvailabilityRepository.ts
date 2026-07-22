import { BaseRepository } from '../../core/repositories/BaseRepository';
import { Availability } from '../../types';

export class AvailabilityRepository extends BaseRepository<Availability> {
  constructor() {
    super('availability');
  }
}
export const availabilityRepository = new AvailabilityRepository();
