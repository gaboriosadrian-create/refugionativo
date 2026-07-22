import { BaseRepository } from '../../core/repositories/BaseRepository';
import { Review } from '../../types';

export class ReviewRepository extends BaseRepository<Review> {
  constructor() {
    super('reviews');
  }
}
export const reviewRepository = new ReviewRepository();
