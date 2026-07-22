import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { GuestTag } from '../types/crm';

const DEFAULT_TAGS: Omit<GuestTag, 'id' | 'createdAt' | 'resortId'>[] = [
  { name: 'VIP', color: '#EF4444', description: 'Clientes distinguidos de alta prioridad' },
  { name: 'Empresa', color: '#3B82F6', description: 'Clientes corporativos y de negocios' },
  { name: 'Influencer', color: '#EC4899', description: 'Creadores de contenido y prensa' },
  { name: 'Proveedor', color: '#F59E0B', description: 'Socios comerciales y proveedores' },
  { name: 'Cliente frecuente', color: '#10B981', description: 'Huéspedes recurrentes de StayFlow' },
  { name: 'Atención especial', color: '#8B5CF6', description: 'Requiere servicios o cuidados específicos' }
];

export class GuestTagsRepository extends BaseRepository<GuestTag> {
  constructor() {
    super('guestTags');
  }

  override async getAll(resortId: string): Promise<GuestTag[]> {
    const list = await super.getAll(resortId);
    if (list.length === 0) {
      // Pre-populate with defaults
      const now = new Date().toISOString();
      const populated: GuestTag[] = DEFAULT_TAGS.map((t, idx) => ({
        ...t,
        id: `tag_${idx}_${Date.now()}`,
        resortId,
        createdAt: now
      }));
      
      for (const tag of populated) {
        await this.save(resortId, tag);
      }
      return populated;
    }
    return list;
  }
}

export const guestTagsRepository = new GuestTagsRepository();
export default guestTagsRepository;
