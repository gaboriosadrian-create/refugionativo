import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { GuestTimelineEvent } from '../types/crm';

export class GuestTimelineRepository extends BaseRepository<GuestTimelineEvent> {
  constructor() {
    super('guestTimeline');
  }

  public async getByGuestId(resortId: string, guestId: string): Promise<GuestTimelineEvent[]> {
    const all = await this.getAll(resortId);
    return all
      .filter(e => e.guestId === guestId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public async addEvent(resortId: string, event: Omit<GuestTimelineEvent, 'id' | 'timestamp'> & { timestamp?: string }): Promise<GuestTimelineEvent> {
    const id = `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const fullEvent: GuestTimelineEvent = {
      ...event,
      id,
      timestamp: event.timestamp || new Date().toISOString()
    };
    await this.save(resortId, fullEvent);
    return fullEvent;
  }
}

export const guestTimelineRepository = new GuestTimelineRepository();
export default guestTimelineRepository;
