import { BaseRepository } from '../../core/repositories/BaseRepository';
import { Amenity } from '../../types';

export class AmenityRepository extends BaseRepository<Amenity> {
  constructor() {
    super('amenities');
  }
}
export const amenityRepository = new AmenityRepository();
