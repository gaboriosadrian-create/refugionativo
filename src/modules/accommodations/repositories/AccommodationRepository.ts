import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { Accommodation } from '../types';
import * as Mappers from '../mappers';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { getResortSubcollection } from '../../../core/firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { Logger } from '../../../core/logger/Logger';
import { AccommodationRepositoryError } from '../errors';

export class AccommodationRepository extends BaseRepository<Accommodation> {
  constructor() {
    super('accommodations');
  }

  protected override serialize(entity: Accommodation): any {
    return Mappers.toFirestore(entity);
  }

  protected override deserialize(data: any): Accommodation {
    return Mappers.toDomain(data);
  }

  async create(resortId: string, entity: Accommodation): Promise<void> {
    try {
      await this.save(resortId, entity);
      Logger.info(`Accommodation created: ${entity.id} for resort ${resortId}`);
    } catch (error) {
      throw new AccommodationRepositoryError(`Failed to create accommodation with ID ${entity.id}`, error);
    }
  }

  async update(resortId: string, entity: Accommodation): Promise<void> {
    try {
      await this.save(resortId, entity);
      Logger.info(`Accommodation updated: ${entity.id} for resort ${resortId}`);
    } catch (error) {
      throw new AccommodationRepositoryError(`Failed to update accommodation with ID ${entity.id}`, error);
    }
  }

  async findById(resortId: string, id: string | number): Promise<Accommodation | null> {
    try {
      return await this.getById(resortId, id);
    } catch (error) {
      throw new AccommodationRepositoryError(`Failed to find accommodation by ID ${id}`, error);
    }
  }

  async findAll(resortId: string): Promise<Accommodation[]> {
    try {
      const all = await this.getAll(resortId);
      return all.filter(acc => !acc.deleted);
    } catch (error) {
      throw new AccommodationRepositoryError(`Failed to find all accommodations for resort ${resortId}`, error);
    }
  }

  async findVisible(resortId: string): Promise<Accommodation[]> {
    try {
      const all = await this.getAll(resortId);
      return all.filter(acc => acc.visible && !acc.deleted);
    } catch (error) {
      throw new AccommodationRepositoryError(`Failed to find visible accommodations`, error);
    }
  }

  async findFeatured(resortId: string): Promise<Accommodation[]> {
    try {
      const all = await this.getAll(resortId);
      return all.filter(acc => acc.featured && !acc.deleted);
    } catch (error) {
      throw new AccommodationRepositoryError(`Failed to find featured accommodations`, error);
    }
  }

  async findBySlug(resortId: string, slug: string): Promise<Accommodation | null> {
    try {
      const all = await this.getAll(resortId);
      const acc = all.find(acc => acc.slug === slug) || null;
      if (acc && acc.deleted) return null;
      return acc;
    } catch (error) {
      throw new AccommodationRepositoryError(`Failed to find accommodation by slug ${slug}`, error);
    }
  }

  subscribe(resortId: string, callback: (accommodations: Accommodation[]) => void): () => void {
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(resortId, this.collectionName);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
          const list: Accommodation[] = [];
          snapshot.forEach((doc) => {
            const idVal = isNaN(Number(doc.id)) ? doc.id : Number(doc.id);
            try {
              list.push(this.deserialize({ id: idVal, ...doc.data() }));
            } catch (err) {
              Logger.error(`Error deserializing onSnapshot item ${doc.id}:`, err);
            }
          });
          callback(list.filter(acc => !acc.deleted));
        }, (error) => {
          Logger.error(`Subscription error for accommodations in resort ${resortId}, falling back to LocalSaaSDb:`, error);
          this.findAll(resortId).then(callback).catch((err) => {
            Logger.error('Local subscription fallback find all failed:', err);
          });
        });
        return unsubscribe;
      } catch (error) {
        Logger.error(`Failed to initialize subscription for accommodations in resort ${resortId}, falling back to LocalSaaSDb:`, error);
        this.findAll(resortId).then(callback).catch((err) => {
          Logger.error('Local subscription fallback find all failed:', err);
        });
        return () => {};
      }
    } else {
      // In local mode, execute immediately and return empty teardown
      this.findAll(resortId).then(callback).catch((err) => {
        Logger.error('Local subscription fallback find all failed:', err);
      });
      return () => {};
    }
  }
}

export const accommodationRepository = new AccommodationRepository();
