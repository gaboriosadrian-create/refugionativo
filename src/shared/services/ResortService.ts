import { resortRepository } from '../repositories/ResortRepository';
import { Resort, ResortUser } from '../../types';

export class ResortService {
  static async getResort(resortId: string): Promise<Resort | null> {
    return resortRepository.getResort(resortId);
  }

  static async getResortBySlug(slug: string): Promise<Resort | null> {
    return resortRepository.getResortBySlug(slug);
  }

  static async getResortUser(userId: string, resortId: string): Promise<ResortUser | null> {
    return resortRepository.getResortUser(userId, resortId);
  }

  static async getResortsForUser(userId: string): Promise<{ resort: Resort; role: string }[]> {
    const resortUsers = await resortRepository.getResortUsersForUser(userId);
    const list: { resort: Resort; role: string }[] = [];
    for (const ru of resortUsers) {
      const resort = await this.getResort(ru.resortId);
      if (resort) {
        list.push({ resort, role: ru.role });
      }
    }
    return list;
  }

  static async saveResort(resort: Resort): Promise<void> {
    await resortRepository.saveResort(resort);
  }
}
export default ResortService;
