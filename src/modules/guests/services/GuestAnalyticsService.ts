import { guestMetricsRepository } from '../repositories/GuestMetricsRepository';
import { guestSegmentsRepository } from '../repositories/GuestSegmentsRepository';
import { guestRepository } from '../repositories/GuestRepository';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { GuestMetrics, GuestProfile, GuestSegment } from '../types/crm';
import { Logger } from '../../../core/logger/Logger';

export class GuestAnalyticsService {
  /**
   * Calculates or recalculates historical metrics for a guest.
   */
  public static async calculateMetrics(resortId: string, guestId: string): Promise<GuestMetrics> {
    Logger.info(`[GuestAnalyticsService] Calculating metrics for guest ${guestId}`);
    
    const bookings = await bookingRepository.getAll(resortId);
    const guestBookings = bookings.filter(b => b.guestId === guestId && b.status !== 'cancelled');

    let bookingsCount = guestBookings.length;
    let nightsStayed = 0;
    let totalRevenue = 0;
    let lastStayDate: string | undefined = undefined;
    let nextBookingDate: string | undefined = undefined;

    const nowTime = new Date().getTime();
    const channelsCount: Record<string, number> = {};

    // Sort by check-in date
    const sortedBookings = [...guestBookings].sort((a, b) => 
      new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
    );

    for (const b of sortedBookings) {
      const checkInTime = new Date(b.checkIn).getTime();
      const checkOutTime = new Date(b.checkOut).getTime();
      
      // Calculate nights
      const diffMs = checkOutTime - checkInTime;
      const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      nightsStayed += nights;

      // Revenue
      totalRevenue += b.totalPrice || 0;

      // Channel preference tracking
      const channel = (b as any).channel || 'Directo';
      channelsCount[channel] = (channelsCount[channel] || 0) + 1;

      // Track last and next stays
      if (checkInTime < nowTime) {
        lastStayDate = b.checkIn;
      } else if (!nextBookingDate || checkInTime < new Date(nextBookingDate).getTime()) {
        nextBookingDate = b.checkIn;
      }
    }

    // Determine preferred channel
    let preferredChannel = 'Directo';
    let maxCount = 0;
    for (const [chan, count] of Object.entries(channelsCount)) {
      if (count > maxCount) {
        maxCount = count;
        preferredChannel = chan;
      }
    }

    // Calculate frequency: total bookings / years since first booking (min 1 year)
    let frequency = bookingsCount;
    if (sortedBookings.length > 0) {
      const firstCheckIn = new Date(sortedBookings[0].checkIn).getTime();
      const yearsElapsed = Math.max(1, (nowTime - firstCheckIn) / (1000 * 60 * 60 * 24 * 365));
      frequency = Number((bookingsCount / yearsElapsed).toFixed(2));
    }

    const metrics: GuestMetrics = {
      id: guestId,
      resortId,
      guestId,
      bookingsCount,
      nightsStayed,
      totalRevenue,
      lastStayDate,
      nextBookingDate,
      preferredChannel,
      frequency,
      estimatedLtv: totalRevenue, // baseline LTV is historical revenue
      updatedAt: new Date().toISOString()
    };

    await guestMetricsRepository.saveMetrics(resortId, metrics);
    return metrics;
  }

  /**
   * Dynamically evaluates segmentation rules for a guest profile and its metrics.
   */
  public static async evaluateSegments(
    resortId: string, 
    guestId: string, 
    metrics?: GuestMetrics, 
    profile?: GuestProfile
  ): Promise<string[]> {
    const finalMetrics = metrics || await this.calculateMetrics(resortId, guestId);
    const finalProfile = profile || await guestRepository.findById(resortId, guestId);

    if (!finalProfile) return [];

    const segments = await guestSegmentsRepository.getAll(resortId);
    const activeSegments = segments.filter(s => s.isActive);
    const matchingSegments: string[] = [];

    for (const seg of activeSegments) {
      if (seg.ruleType === 'manual') continue; // Skip manual assignments

      const criteria = seg.criteria;
      if (!criteria) continue;

      let matches = true;

      if (criteria.minBookings !== undefined && finalMetrics.bookingsCount < criteria.minBookings) {
        matches = false;
      }
      if (criteria.minRevenue !== undefined && finalMetrics.totalRevenue < criteria.minRevenue) {
        matches = false;
      }
      if (criteria.minNights !== undefined && finalMetrics.nightsStayed < criteria.minNights) {
        matches = false;
      }
      if (criteria.isInternational !== undefined) {
        const isInt = finalProfile.country.toLowerCase().trim() !== 'argentina';
        if (isInt !== criteria.isInternational) {
          matches = false;
        }
      }
      if (criteria.tagsRequired && criteria.tagsRequired.length > 0) {
        const hasAllTags = criteria.tagsRequired.every(t => 
          finalProfile.tags && finalProfile.tags.some(pt => pt.toLowerCase() === t.toLowerCase())
        );
        if (!hasAllTags) {
          matches = false;
        }
      }

      if (matches) {
        matchingSegments.push(seg.name);
      }
    }

    return matchingSegments;
  }
}

export default GuestAnalyticsService;
