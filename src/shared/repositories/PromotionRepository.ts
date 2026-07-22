import { BaseRepository } from '../../core/repositories/BaseRepository';
import { Promotion } from '../../types';

export class PromotionRepository extends BaseRepository<Promotion> {
  constructor() {
    super('promotions');
  }
}
export const promotionRepository = new PromotionRepository();
