import { commercialCalendarRepository } from '../repositories/CommercialCalendarRepository';
import { CommercialCalendarEvent } from '../types';
import { Logger } from '../../../core/logger/Logger';

export class CommercialCalendarService {
  public static async getEvents(resortId: string): Promise<CommercialCalendarEvent[]> {
    try {
      let events = await commercialCalendarRepository.getAll(resortId);
      if (events.length === 0) {
        events = await this.seedDefaultEvents(resortId);
      }
      return events;
    } catch (e) {
      Logger.error('[CommercialCalendarService] Error loading events:', e);
      return [];
    }
  }

  public static async saveEvent(resortId: string, event: CommercialCalendarEvent): Promise<void> {
    await commercialCalendarRepository.save(resortId, event);
    Logger.info(`[CommercialCalendarService] Saved event: ${event.title}`);
  }

  public static async deleteEvent(resortId: string, id: string): Promise<void> {
    await commercialCalendarRepository.delete(resortId, id);
    Logger.info(`[CommercialCalendarService] Deleted event: ${id}`);
  }

  private static async seedDefaultEvents(resortId: string): Promise<CommercialCalendarEvent[]> {
    const defaultEvents: CommercialCalendarEvent[] = [
      {
        id: `cal_event_ny_${resortId}`,
        resortId,
        title: 'Año Nuevo',
        type: 'holiday',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
        impact: 'high',
        description: 'Feriado global de inicio de año con altísima demanda.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `cal_event_easter_${resortId}`,
        resortId,
        title: 'Semana Santa',
        type: 'holiday',
        startDate: '2026-04-02',
        endDate: '2026-04-05',
        impact: 'high',
        description: 'Fin de semana largo religioso con alta afluencia de turismo nacional.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `cal_event_congress_${resortId}`,
        resortId,
        title: 'Congreso de Medicina',
        type: 'congress',
        startDate: '2026-09-15',
        endDate: '2026-09-18',
        impact: 'medium',
        description: 'Congreso médico internacional de gran escala en la región.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `cal_event_music_${resortId}`,
        resortId,
        title: 'Festival de Música Primavera',
        type: 'festival',
        startDate: '2026-10-10',
        endDate: '2026-10-12',
        impact: 'high',
        description: 'Festival musical masivo al aire libre cerca del complejo.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `cal_event_summer_${resortId}`,
        resortId,
        title: 'Vacaciones de Verano',
        type: 'vacation',
        startDate: '2026-01-05',
        endDate: '2026-02-28',
        impact: 'high',
        description: 'Temporada principal de vacaciones escolares y clima ideal.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `cal_event_winter_${resortId}`,
        resortId,
        title: 'Vacaciones de Invierno',
        type: 'vacation',
        startDate: '2026-07-15',
        endDate: '2026-08-05',
        impact: 'medium',
        description: 'Receso escolar invernal, demanda familiar media-alta.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const event of defaultEvents) {
      await commercialCalendarRepository.save(resortId, event);
    }

    return defaultEvents;
  }
}
export const commercialCalendarService = new CommercialCalendarService();
