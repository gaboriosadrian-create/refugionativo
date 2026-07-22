import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { OnboardingProgress } from '../types';

export class OnboardingRepository extends BaseRepository<OnboardingProgress> {
  constructor() {
    super('onboardingProgress');
  }

  async getProgress(resortId: string): Promise<OnboardingProgress | null> {
    const data = await this.getById(resortId, 'progress');
    if (!data) return null;
    return data as OnboardingProgress;
  }

  async saveProgress(resortId: string, progress: OnboardingProgress): Promise<void> {
    await this.save(resortId, progress);
  }

  public createDefaultProgress(resortId: string): OnboardingProgress {
    const now = new Date().toISOString();
    return {
      id: 'progress',
      resortId,
      currentStep: 1,
      completed: false,
      stepsSaved: {
        step1: false,
        step2: false,
        step3: false,
        step4: false,
        step5: false,
        step6: false
      },
      stepData: {},
      createdAt: now,
      updatedAt: now
    };
  }
}

export const onboardingRepository = new OnboardingRepository();
