import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { GuestProfile } from '../types/crm';
import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { getResortSubcollection } from '../../../core/firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { Logger } from '../../../core/logger/Logger';

export class GuestRepository extends BaseRepository<GuestProfile> {
  constructor() {
    super('guestProfiles');
  }

  override async getAll(resortId: string): Promise<GuestProfile[]> {
    let list: GuestProfile[] = [];
    if (isFirebaseConfigured) {
      list = await super.getAll(resortId);
    } else {
      const data = LocalSaaSDb.get<any[]>(`guestProfiles_${resortId}`);
      if (data) {
        list = data.map(item => this.deserialize(item));
      } else {
        // Fallback migration from old 'guests' collection
        const oldData = LocalSaaSDb.get<any[]>(`guests_${resortId}`) || [];
        if (oldData.length > 0) {
          Logger.info(`Migrating ${oldData.length} old guests to guestProfiles for resort ${resortId}`);
          list = oldData.map(item => ({
            ...item,
            nationality: item.country || 'Argentina',
            profession: ''
          }));
          LocalSaaSDb.set(`guestProfiles_${resortId}`, list);
        }
      }
    }
    return list;
  }

  override async save(resortId: string, entity: GuestProfile): Promise<void> {
    if (isFirebaseConfigured) {
      await super.save(resortId, entity);
    } else {
      const list = await this.getAll(resortId);
      const idx = list.findIndex(item => item.id === entity.id);
      const now = new Date().toISOString();
      const payload = {
        ...this.serialize(entity),
        updatedAt: now,
      } as GuestProfile;
      
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        if (!payload.createdAt) {
          payload.createdAt = now;
        }
        list.push(payload);
      }
      LocalSaaSDb.set(`guestProfiles_${resortId}`, list);
    }
  }

  override async delete(resortId: string, id: any): Promise<void> {
    if (isFirebaseConfigured) {
      await super.delete(resortId, id);
    } else {
      const list = await this.getAll(resortId);
      const filtered = list.filter(item => item.id !== id);
      LocalSaaSDb.set(`guestProfiles_${resortId}`, filtered);
    }
  }

  public async findById(resortId: string, id: string): Promise<GuestProfile | null> {
    return this.getById(resortId, id);
  }

  public async findByEmail(resortId: string, email: string): Promise<GuestProfile | null> {
    const all = await this.getAll(resortId);
    if (!email) return null;
    return all.find(g => g.email.toLowerCase().trim() === email.toLowerCase().trim()) || null;
  }

  public async findByDocument(resortId: string, documentType: string, documentNumber: string): Promise<GuestProfile | null> {
    const all = await this.getAll(resortId);
    if (!documentNumber) return null;
    return all.find(g => 
      g.documentType.toLowerCase().trim() === documentType.toLowerCase().trim() && 
      g.documentNumber.toLowerCase().trim() === documentNumber.toLowerCase().trim()
    ) || null;
  }

  public async search(resortId: string, query: string): Promise<GuestProfile[]> {
    const all = await this.getAll(resortId);
    const q = query.toLowerCase().trim();
    if (!q) return all;
    return all.filter(g => 
      g.firstName.toLowerCase().includes(q) ||
      g.lastName.toLowerCase().includes(q) ||
      g.fullName.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.documentNumber.toLowerCase().includes(q) ||
      g.phone.toLowerCase().includes(q)
    );
  }

  public async list(resortId: string): Promise<GuestProfile[]> {
    return this.getAll(resortId);
  }

  public async create(resortId: string, guest: GuestProfile): Promise<GuestProfile> {
    await this.save(resortId, guest);
    return guest;
  }

  public async update(resortId: string, id: string, fields: Partial<GuestProfile>): Promise<GuestProfile> {
    const existing = await this.getById(resortId, id);
    if (!existing) {
      throw new Error(`Huésped con ID ${id} no encontrado.`);
    }
    const updated: GuestProfile = {
      ...existing,
      ...fields,
      updatedAt: new Date().toISOString()
    };
    await this.save(resortId, updated);
    return updated;
  }

  public subscribe(resortId: string, callback: (guests: GuestProfile[]) => void): () => void {
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(resortId, this.collectionName);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
          const list: GuestProfile[] = [];
          snapshot.forEach((doc) => {
            const idVal = doc.id;
            try {
              list.push(this.deserialize({ id: idVal, ...doc.data() }));
            } catch (err) {
              Logger.error(`Error deserializing onSnapshot guest profile item ${doc.id}:`, err);
            }
          });
          callback(list);
        }, (error) => {
          Logger.error(`Subscription error for guestProfiles in resort ${resortId}, falling back to LocalSaaSDb:`, error);
          this.getAll(resortId).then(callback).catch((err) => {
            Logger.error('Local subscription fallback for guestProfiles failed:', err);
          });
        });
        return unsubscribe;
      } catch (error) {
        Logger.error(`Failed to initialize subscription for guestProfiles in resort ${resortId}, falling back to LocalSaaSDb:`, error);
        this.getAll(resortId).then(callback).catch((err) => {
          Logger.error('Local subscription fallback for guestProfiles failed:', err);
        });
        return () => {};
      }
    } else {
      this.getAll(resortId).then(callback).catch((err) => {
        Logger.error('Local subscription fallback for guestProfiles failed:', err);
      });
      return () => {};
    }
  }
}

export const guestRepository = new GuestRepository();
export default guestRepository;
