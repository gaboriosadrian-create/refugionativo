import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { AvailabilityBlock } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { getResortSubcollection } from '../../../core/firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { Logger } from '../../../core/logger/Logger';

export class AvailabilityBlockRepository extends BaseRepository<AvailabilityBlock> {
  constructor() {
    super('availabilityBlocks');
  }

  subscribe(
    resortId: string,
    callback: (blocks: AvailabilityBlock[]) => void
  ): () => void {
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(resortId, this.collectionName);
        const unsubscribe = onSnapshot(
          colRef,
          snapshot => {
            const list: AvailabilityBlock[] = [];
            snapshot.forEach(doc => {
              const id = doc.id;
              list.push({ id, ...doc.data() } as AvailabilityBlock);
            });
            callback(list);
          },
          error => {
            Logger.error(`Subscription error for availabilityBlocks in resort ${resortId}, falling back to LocalSaaSDb:`, error);
            this.getAll(resortId)
              .then(callback)
              .catch(err => {
                Logger.error('Local subscription fallback for availabilityBlocks failed:', err);
              });
          }
        );
        return unsubscribe;
      } catch (error) {
        Logger.error(`Failed to initialize subscription for availabilityBlocks in resort ${resortId}, falling back to LocalSaaSDb:`, error);
        this.getAll(resortId)
          .then(callback)
          .catch(err => {
            Logger.error('Local subscription fallback for availabilityBlocks failed:', err);
          });
        return () => {};
      }
    } else {
      this.getAll(resortId)
        .then(callback)
        .catch(err => {
          Logger.error('Local subscription fallback for availabilityBlocks failed:', err);
        });
      return () => {};
    }
  }
}

export const availabilityBlockRepository = new AvailabilityBlockRepository();
export default availabilityBlockRepository;
