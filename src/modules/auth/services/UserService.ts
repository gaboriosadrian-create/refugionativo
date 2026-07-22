import { userRepository } from '../../../shared/repositories/UserRepository';
import { UserProfile } from '../../../types';

export class UserService {
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    return userRepository.getUserProfile(uid);
  }

  static async saveUserProfile(profile: UserProfile): Promise<void> {
    await userRepository.saveUserProfile(profile);
  }

  static async getAllUsers(): Promise<UserProfile[]> {
    return userRepository.getAllUsers();
  }
}
