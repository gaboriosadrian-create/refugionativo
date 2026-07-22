import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { GuestSegment } from '../types/crm';

const DEFAULT_SEGMENTS: Omit<GuestSegment, 'id'>[] = [
  {
    resortId: '',
    name: 'Nuevo',
    description: 'Huéspedes que registran su primera estadía o reserva activa.',
    ruleType: 'auto',
    criteria: { minBookings: 1 },
    isActive: true
  },
  {
    resortId: '',
    name: 'Frecuente',
    description: 'Huéspedes con 3 o más estadías completadas.',
    ruleType: 'auto',
    criteria: { minBookings: 3 },
    isActive: true
  },
  {
    resortId: '',
    name: 'VIP',
    description: 'Huéspedes de alto valor, facturación acumulada superior a $150,000.',
    ruleType: 'auto',
    criteria: { minRevenue: 150000 },
    isActive: true
  },
  {
    resortId: '',
    name: 'Corporativo',
    description: 'Huéspedes que viajan por negocios, asociados a la etiqueta Empresa.',
    ruleType: 'auto',
    criteria: { tagsRequired: ['Empresa'] },
    isActive: true
  },
  {
    resortId: '',
    name: 'Familia',
    description: 'Huéspedes con requisitos familiares o indicación de menores en notas.',
    ruleType: 'auto',
    criteria: { tagsRequired: ['Familia'] },
    isActive: true
  },
  {
    resortId: '',
    name: 'Larga Estadía',
    description: 'Huéspedes con un acumulado superior a 14 noches hospedadas.',
    ruleType: 'auto',
    criteria: { minNights: 14 },
    isActive: true
  },
  {
    resortId: '',
    name: 'Internacional',
    description: 'Huéspedes con nacionalidad o país diferente al local.',
    ruleType: 'auto',
    criteria: { isInternational: true },
    isActive: true
  },
  {
    resortId: '',
    name: 'Nacional',
    description: 'Huéspedes de origen local (Argentina por defecto).',
    ruleType: 'auto',
    criteria: { isInternational: false },
    isActive: true
  }
];

export class GuestSegmentsRepository extends BaseRepository<GuestSegment> {
  constructor() {
    super('guestSegments');
  }

  override async getAll(resortId: string): Promise<GuestSegment[]> {
    const list = await super.getAll(resortId);
    if (list.length === 0) {
      // Pre-populate with defaults
      const populated: GuestSegment[] = DEFAULT_SEGMENTS.map((s, idx) => ({
        ...s,
        id: `seg_${idx}_${Date.now()}`,
        resortId
      }));

      for (const segment of populated) {
        await this.save(resortId, segment);
      }
      return populated;
    }
    return list;
  }
}

export const guestSegmentsRepository = new GuestSegmentsRepository();
export default guestSegmentsRepository;
