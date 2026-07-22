import { isFirebaseConfigured } from '../firebase/firebase';
import { getDocument, saveDocument, getResortSubcollection } from '../firebase/firestore';
import { doc, getDocs, deleteDoc } from 'firebase/firestore';
import { LocalSaaSDb } from '../../shared/services/LocalSaaSDb';
import { handleFirestoreError, OperationType } from '../errors/AppErrors';
import { Logger } from '../logger/Logger';
import { TenantManager } from '../tenant/TenantManager';

export abstract class BaseRepository<T extends { id: any }> {
  constructor(protected readonly collectionName: string) {}

  public getResortPath(resortId?: string, id?: any): string {
    const tenantId = resortId || TenantManager.getCurrentTenantId();
    return id !== undefined 
      ? `resorts/${tenantId}/${this.collectionName}/${id}` 
      : `resorts/${tenantId}/${this.collectionName}`;
  }

  async getAll(resortId?: string): Promise<T[]> {
    const tenantId = resortId || TenantManager.getCurrentTenantId();
    if (isFirebaseConfigured) {
      try {
        const colRef = getResortSubcollection(tenantId, this.collectionName);
        const snap = await getDocs(colRef);
        const list: T[] = [];
        snap.forEach(d => {
          const idVal = isNaN(Number(d.id)) ? d.id : Number(d.id);
          list.push(this.deserialize({ id: idVal, ...d.data() }));
        });
        return list;
      } catch (error) {
        Logger.error(`Error en BaseRepository.getAll para ${this.collectionName}, falling back to LocalSaaSDb:`, error);
        const data = LocalSaaSDb.get<any>(`${this.collectionName}_${tenantId}`);
        if (!data) return [];
        if (!Array.isArray(data)) {
          const single = { id: 'general', ...data } as T;
          return [this.deserialize(single)];
        }
        return data.map(item => this.deserialize(item));
      }
    } else {
      const data = LocalSaaSDb.get<any>(`${this.collectionName}_${tenantId}`);
      if (!data) return [];
      if (!Array.isArray(data)) {
        const single = { id: 'general', ...data } as T;
        return [this.deserialize(single)];
      }
      return data.map(item => this.deserialize(item));
    }
  }

  async getById(resortId?: string, id?: any): Promise<T | null> {
    const tenantId = resortId || TenantManager.getCurrentTenantId();
    // Support single parameter call getById(id) if first argument is the entity ID
    let finalId = id;
    let finalTenantId = tenantId;
    if (id === undefined && resortId !== undefined) {
      // Called as getById(id)
      finalId = resortId;
      finalTenantId = TenantManager.getCurrentTenantId();
    }

    if (isFirebaseConfigured) {
      const path = this.getResortPath(finalTenantId, finalId);
      try {
        const data = await getDocument(path);
        if (!data) return null;
        const idVal = isNaN(Number(finalId)) ? finalId : Number(finalId);
        return this.deserialize({ id: idVal, ...data });
      } catch (error) {
        Logger.error(`Error en BaseRepository.getById para ${path}, falling back to LocalSaaSDb:`, error);
        const list = await this.getAll(finalTenantId);
        return list.find(item => item.id === finalId) || null;
      }
    } else {
      const list = await this.getAll(finalTenantId);
      return list.find(item => item.id === finalId) || null;
    }
  }

  async save(resortId?: string, entity?: T): Promise<void> {
    let finalEntity = entity;
    let finalTenantId = resortId || TenantManager.getCurrentTenantId();
    if (entity === undefined && resortId !== undefined) {
      // Called as save(entity)
      finalEntity = resortId as unknown as T;
      finalTenantId = TenantManager.getCurrentTenantId();
    }

    if (!finalEntity) {
      throw new Error(`Cannot save: entity is undefined in ${this.collectionName}`);
    }

    const serialized = this.serialize(finalEntity);
    const id = finalEntity.id;
    if (isFirebaseConfigured) {
      const path = this.getResortPath(finalTenantId, id);
      try {
        const now = new Date().toISOString();
        const payload = {
          ...serialized,
          updatedAt: now,
        };
        delete (payload as any).id;
        
        await saveDocument(path, payload, true);
        Logger.info(`Entidad ${this.collectionName} guardada en Firestore: ${id}`);
      } catch (error) {
        Logger.error(`Error en BaseRepository.save para ${path}, falling back to LocalSaaSDb:`, error);
        const list = await this.getAll(finalTenantId);
        const idx = list.findIndex(item => item.id === id);
        const now = new Date().toISOString();
        const payload = {
          ...serialized,
          updatedAt: now,
        };
        
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...payload };
        } else {
          if (!payload.createdAt) {
            payload.createdAt = now;
          }
          list.push(payload as T);
        }
        LocalSaaSDb.set(`${this.collectionName}_${finalTenantId}`, list);
      }
    } else {
      const list = await this.getAll(finalTenantId);
      const idx = list.findIndex(item => item.id === id);
      const now = new Date().toISOString();
      const payload = {
        ...serialized,
        updatedAt: now,
      };
      
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        if (!payload.createdAt) {
          payload.createdAt = now;
        }
        list.push(payload as T);
      }
      LocalSaaSDb.set(`${this.collectionName}_${finalTenantId}`, list);
      Logger.info(`Entidad ${this.collectionName} guardada en LocalSaaSDb: ${id}`);
    }
  }

  async delete(resortId?: string, id?: any): Promise<void> {
    let finalId = id;
    let finalTenantId = resortId || TenantManager.getCurrentTenantId();
    if (id === undefined && resortId !== undefined) {
      // Called as delete(id)
      finalId = resortId;
      finalTenantId = TenantManager.getCurrentTenantId();
    }

    if (isFirebaseConfigured) {
      const path = this.getResortPath(finalTenantId, finalId);
      try {
        const colRef = getResortSubcollection(finalTenantId, this.collectionName);
        const docRef = doc(colRef, String(finalId));
        await deleteDoc(docRef);
        Logger.info(`Entidad ${this.collectionName} eliminada de Firestore: ${finalId}`);
      } catch (error) {
        Logger.error(`Error en BaseRepository.delete para ${path}, falling back to LocalSaaSDb:`, error);
        const list = await this.getAll(finalTenantId);
        const filtered = list.filter(item => item.id !== finalId);
        LocalSaaSDb.set(`${this.collectionName}_${finalTenantId}`, filtered);
      }
    } else {
      const list = await this.getAll(finalTenantId);
      const filtered = list.filter(item => item.id !== finalId);
      LocalSaaSDb.set(`${this.collectionName}_${finalTenantId}`, filtered);
      Logger.info(`Entidad ${this.collectionName} eliminada de LocalSaaSDb: ${finalId}`);
    }
  }

  protected serialize(entity: T): any {
    return { ...entity };
  }

  protected deserialize(data: any): T {
    return { ...data } as T;
  }
}
