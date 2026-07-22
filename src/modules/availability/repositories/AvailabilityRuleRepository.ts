import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { AvailabilityRule } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { getResortSubcollection } from '../../../core/firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { Logger } from '../../../core/logger/Logger';

export class AvailabilityRuleRepository extends BaseRepository<AvailabilityRule> {
  constructor() {
    super('availabilityRules');
  }

  subscribe(
    resortId: string,
    callback: (rules: AvailabilityRule[]) => void
  ): () => void {
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(resortId, this.collectionName);
        const unsubscribe = onSnapshot(
          colRef,
          snapshot => {
            const list: AvailabilityRule[] = [];
            snapshot.forEach(doc => {
              const id = doc.id;
              list.push({ id, ...doc.data() } as AvailabilityRule);
            });
            callback(list);
          },
          error => {
            Logger.error(`Subscription error for availabilityRules in resort ${resortId}, falling back to LocalSaaSDb:`, error);
            this.getAll(resortId)
              .then(callback)
              .catch(err => {
                Logger.error('Local subscription fallback for availabilityRules failed:', err);
              });
          }
        );
        return unsubscribe;
      } catch (error) {
        Logger.error(`Failed to initialize subscription for availabilityRules in resort ${resortId}, falling back to LocalSaaSDb:`, error);
        this.getAll(resortId)
          .then(callback)
          .catch(err => {
            Logger.error('Local subscription fallback for availabilityRules failed:', err);
          });
        return () => {};
      }
    } else {
      this.getAll(resortId)
        .then(callback)
        .catch(err => {
          Logger.error('Local subscription fallback for availabilityRules failed:', err);
        });
      return () => {};
    }
  }
}

export const availabilityRuleRepository = new AvailabilityRuleRepository();
export default availabilityRuleRepository;
