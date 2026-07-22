import { reviewRepository } from '../repositories/ReviewRepository';
import { Review } from '../../types';

export class ReviewService {
  static async getReviews(resortId: string): Promise<Review[]> {
    return reviewRepository.getAll(resortId);
  }

  static async saveReview(resortId: string, review: Review): Promise<void> {
    await reviewRepository.save(resortId, review);
  }
}
export default ReviewService;
