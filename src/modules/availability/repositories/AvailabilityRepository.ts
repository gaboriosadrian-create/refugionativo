import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { Availability } from '../types';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { getResortSubcollection, queryCollection } from '../../../core/firebase/firestore';
import { onSnapshot, where, query } from 'firebase/firestore';
import { Logger } from '../../../core/logger/Logger';

export class AvailabilityRepository extends BaseRepository<Availability> {
  constructor() {
    super('availability');
  }

  async create(resortId: string, availability: Availability): Promise<void> {
    try {
      await this.save(resortId, availability);
      Logger.info(`Availability created: ${availability.id} for resort ${resortId}`);
    } catch (error) {
      Logger.error(`Error in AvailabilityRepository.create:`, error);
      throw error;
    }
  }

  async updateAvailability(resortId: string, availability: Availability): Promise<void> {
    try {
      await this.save(resortId, availability);
      Logger.info(`Availability updated: ${availability.id} for resort ${resortId}`);
    } catch (error) {
      Logger.error(`Error in AvailabilityRepository.updateAvailability:`, error);
      throw error;
    }
  }

  async deleteAvailability(resortId: string, id: string): Promise<void> {
    try {
      await this.delete(resortId, id);
      Logger.info(`Availability deleted: ${id} for resort ${resortId}`);
    } catch (error) {
      Logger.error(`Error in AvailabilityRepository.deleteAvailability:`, error);
      throw error;
    }
  }

  async findByDate(
    resortId: string,
    accommodationId: string | number,
    date: string
  ): Promise<Availability | null> {
    try {
      const docId = `${accommodationId}_${date}`;
      return await this.getById(resortId, docId);
    } catch (error) {
      Logger.error(`Error in AvailabilityRepository.findByDate:`, error);
      throw error;
    }
  }

  async findRange(
    resortId: string,
    accommodationId: string | number,
    startDate: string,
    endDate: string
  ): Promise<Availability[]> {
    try {
      if (isFirebaseConfigured) {
        // Query within the subcollection by accommodationId first to avoid requiring a composite index
        const path = `resorts/${resortId}/availability`;
        const qResults = await queryCollection(
          path,
          where('accommodationId', '==', accommodationId)
        );
        const list = qResults as Availability[];
        return list.filter(
          a => a.date >= startDate && a.date <= endDate
        );
      } else {
        // Fallback to local storage filtering
        const all = await this.getAll(resortId);
        return all.filter(
          a =>
            a.accommodationId === accommodationId &&
            a.date >= startDate &&
            a.date <= endDate
        );
      }
    } catch (error) {
      Logger.error(`Error in AvailabilityRepository.findRange:`, error);
      throw error;
    }
  }

  async findAccommodationAvailability(
    resortId: string,
    accommodationId: string | number
  ): Promise<Availability[]> {
    try {
      if (isFirebaseConfigured) {
        const path = `resorts/${resortId}/availability`;
        const qResults = await queryCollection(
          path,
          where('accommodationId', '==', accommodationId)
        );
        return qResults as Availability[];
      } else {
        const all = await this.getAll(resortId);
        return all.filter(a => a.accommodationId === accommodationId);
      }
    } catch (error) {
      Logger.error(`Error in AvailabilityRepository.findAccommodationAvailability:`, error);
      throw error;
    }
  }

  subscribe(
    resortId: string,
    callback: (availabilities: Availability[]) => void
  ): () => void {
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(resortId, this.collectionName);
        const unsubscribe = onSnapshot(
          colRef,
          snapshot => {
            const list: Availability[] = [];
            snapshot.forEach(doc => {
              const id = doc.id;
              list.push({ id, ...doc.data() } as Availability);
            });
            callback(list);
          },
          error => {
            Logger.error(`Subscription error for availability in resort ${resortId}, falling back to LocalSaaSDb:`, error);
            this.getAll(resortId)
              .then(callback)
              .catch(err => {
                Logger.error('Local subscription fallback for availability failed:', err);
              });
          }
        );
        return unsubscribe;
      } catch (error) {
        Logger.error(`Failed to initialize subscription for availability in resort ${resortId}, falling back to LocalSaaSDb:`, error);
        this.getAll(resortId)
          .then(callback)
          .catch(err => {
            Logger.error('Local subscription fallback for availability failed:', err);
          });
        return () => {};
      }
    } else {
      // Local fallback
      this.getAll(resortId)
        .then(callback)
        .catch(err => {
          Logger.error('Local subscription fallback for availability failed:', err);
        });
      
      // Return dummy unsubscribe
      return () => {};
    }
  }
}

export const availabilityRepository = new AvailabilityRepository();
export default availabilityRepository;
