import { promotionRepository } from '../repositories/PromotionRepository';
import { Promotion } from '../../types';

export class PromotionService {
  static async getPromotions(resortId: string): Promise<Promotion[]> {
    return promotionRepository.getAll(resortId);
  }

  static async savePromotion(resortId: string, promotion: Promotion): Promise<void> {
    await promotionRepository.save(resortId, promotion);
  }
}
export default PromotionService;
