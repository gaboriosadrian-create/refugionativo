import { availabilityRepository } from '../repositories/AvailabilityRepository';
import { availabilityBlockRepository } from '../repositories/AvailabilityBlockRepository';
import { availabilityRuleRepository } from '../repositories/AvailabilityRuleRepository';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { accommodationRepository } from '../../accommodations/repositories/AccommodationRepository';
import { Availability, AvailabilityStatus, ValidationResult, AvailabilityBlock, AvailabilityRule } from '../types';
import { getDatesInRange, addDays, getDaysDiff, formatDate } from '../utils';
import { validateConflict, validateDateRange } from '../validators';
import { Logger } from '../../../core/logger/Logger';

export class AvailabilityService {
  /**
   * Retrieves the specific availability status for an accommodation on a specific date.
   * If no explicit database entry exists, it defaults to AVAILABLE.
   */
  static async getDayStatus(
    resortId: string,
    accommodationId: string | number,
    date: string
  ): Promise<AvailabilityStatus> {
    return this.obtenerEstadoDelDía(resortId, accommodationId, date);
  }

  /**
   * Checks the availability for a range of dates.
   * Returns a list of Availability entries (including default AVAILABLE ones for dates with no overrides).
   */
  static async getRangeAvailability(
    resortId: string,
    accommodationId: string | number,
    startDate: string,
    endDate: string
  ): Promise<Availability[]> {
    return this.obtenerDisponibilidad(resortId, accommodationId, startDate, endDate);
  }

  /**
   * Verifies if a given range of dates is completely available (no BLOCKED, MAINTENANCE, RESERVED, etc.)
   */
  static async isRangeAvailable(
    resortId: string,
    accommodationId: string | number,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    return this.verificarDisponibilidad(resortId, accommodationId, startDate, endDate);
  }

  /**
   * API Interna: obtenerEstadoDelDía()
   * Retrieves the availability status of an accommodation on a single day.
   */
  static async obtenerEstadoDelDía(
    resortId: string,
    accommodationId: string | number,
    date: string
  ): Promise<AvailabilityStatus> {
    const list = await this.obtenerDisponibilidad(resortId, accommodationId, date, date);
    return list[0]?.status || AvailabilityStatus.AVAILABLE;
  }

  /**
   * API Interna: obtenerDisponibilidad()
   * Merges manual blocks, maintenance, closures, bookings and overrides in-memory for efficiency.
   */
  static async obtenerDisponibilidad(
    resortId: string,
    accommodationId: string | number,
    startDate: string,
    endDate: string
  ): Promise<Availability[]> {
    validateDateRange(startDate, endDate);

    // 1. Fetch active bookings (for reserved status)
    const bookings = await bookingRepository.getAll(resortId);
    const activeBookings = bookings.filter(b => {
      const matchAcc = (b.accommodationId !== undefined && String(b.accommodationId) === String(accommodationId)) || 
                       (b.cabinId !== undefined && String(b.cabinId) === String(accommodationId));
      const activeStatus = ['pending', 'confirmed', 'checked_in', 'in_house', 'pending_approval'].includes(b.status);
      return matchAcc && activeStatus;
    });

    // 2. Fetch blocks (manual blocks, maintenance, temporal closures)
    const blocks = await availabilityBlockRepository.getAll(resortId);
    const activeBlocks = blocks.filter(b => {
      return b.accommodationId === 'all' || String(b.accommodationId) === String(accommodationId);
    });

    // 3. Fetch overrides (legacy daily override collection)
    const overrides = await availabilityRepository.findRange(resortId, accommodationId, startDate, endDate);
    const overrideMap = new Map<string, Availability>();
    overrides.forEach(o => overrideMap.set(o.date, o));

    // 4. Generate all dates in the requested range
    const dates = getDatesInRange(startDate, endDate);
    const nowStr = new Date().toISOString();

    return dates.map(date => {
      // Find closures (OUT_OF_SERVICE) -> Highest priority
      const closureBlock = activeBlocks.find(b => b.type === 'closure' && date >= b.startDate && date <= b.endDate);
      if (closureBlock) {
        return {
          id: `${accommodationId}_${date}_closure`,
          resortId,
          accommodationId,
          date,
          status: AvailabilityStatus.OUT_OF_SERVICE,
          reason: closureBlock.reason,
          notes: closureBlock.notes || 'Cierre temporal',
          createdAt: closureBlock.createdAt,
          updatedAt: closureBlock.updatedAt
        };
      }

      // Find maintenance -> Second highest
      const maintenanceBlock = activeBlocks.find(b => b.type === 'maintenance' && date >= b.startDate && date <= b.endDate);
      if (maintenanceBlock) {
        return {
          id: `${accommodationId}_${date}_maint`,
          resortId,
          accommodationId,
          date,
          status: AvailabilityStatus.MAINTENANCE,
          reason: maintenanceBlock.reason,
          notes: maintenanceBlock.notes || 'Mantenimiento registrado',
          createdAt: maintenanceBlock.createdAt,
          updatedAt: maintenanceBlock.updatedAt
        };
      }

      // Find manual blocks -> Third highest
      const manualBlock = activeBlocks.find(b => b.type === 'manual' && date >= b.startDate && date <= b.endDate);
      if (manualBlock) {
        return {
          id: `${accommodationId}_${date}_block`,
          resortId,
          accommodationId,
          date,
          status: AvailabilityStatus.BLOCKED,
          reason: manualBlock.reason,
          notes: manualBlock.notes || 'Bloqueo manual',
          createdAt: manualBlock.createdAt,
          updatedAt: manualBlock.updatedAt
        };
      }

      // Find booking overlaps -> Fourth highest
      // CheckIn <= date < CheckOut (Check-out date is not booked for the night)
      const reservation = activeBookings.find(b => date >= b.checkIn && date < b.checkOut);
      if (reservation) {
        return {
          id: `${accommodationId}_${date}_res`,
          resortId,
          accommodationId,
          date,
          status: AvailabilityStatus.RESERVED,
          reason: `Reserva #${reservation.id}`,
          notes: `Huésped: ${reservation.name}`,
          createdAt: reservation.createdAt || nowStr,
          updatedAt: reservation.updatedAt || nowStr
        };
      }

      // Find legacy overrides
      const legacyOverride = overrideMap.get(date);
      if (legacyOverride) {
        return legacyOverride;
      }

      // Default: AVAILABLE
      return {
        id: `${accommodationId}_${date}`,
        resortId,
        accommodationId,
        date,
        status: AvailabilityStatus.AVAILABLE,
        reason: 'default',
        notes: 'Disponible por defecto',
        createdAt: nowStr,
        updatedAt: nowStr
      };
    });
  }

  /**
   * API Interna: verificarDisponibilidad()
   * Checks if an accommodation is fully available (no blocks, bookings or closures) during stay nights.
   */
  static async verificarDisponibilidad(
    resortId: string,
    accommodationId: string | number,
    checkIn: string,
    checkOut: string
  ): Promise<boolean> {
    if (checkIn >= checkOut) return false;
    const checkOutDateBefore = addDays(checkOut, -1);
    const range = await this.obtenerDisponibilidad(resortId, accommodationId, checkIn, checkOutDateBefore);
    return range.every(day => day.status === AvailabilityStatus.AVAILABLE);
  }

  /**
   * API Interna: validarRangoDeFechas()
   * Verifies all stay rules and availability for a proposed booking.
   */
  static async validarRangoDeFechas(
    resortId: string,
    accommodationId: string | number,
    checkIn: string,
    checkOut: string,
    guests?: number
  ): Promise<ValidationResult> {
    try {
      validateDateRange(checkIn, checkOut);
    } catch (err: any) {
      return { isValid: false, reason: 'INVALID_DATES', message: err.message };
    }

    if (checkIn === checkOut) {
      return { isValid: false, reason: 'INVALID_DATES', message: 'La fecha de llegada y salida no pueden ser iguales.' };
    }

    // 1. Check Capacity if guests count is provided
    if (guests !== undefined && guests > 0) {
      const accommodation = await accommodationRepository.findById(resortId, accommodationId);
      if (accommodation) {
        const maxCap = accommodation.capacity?.maxGuests || 0;
        if (maxCap > 0 && guests > maxCap) {
          return {
            isValid: false,
            reason: 'CAPACITY_EXCEEDED',
            message: `El número de huéspedes (${guests}) excede la capacidad máxima de este alojamiento (${maxCap}).`
          };
        }
      }
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 2. Fetch rules to evaluate stay rules
    const rules = await availabilityRuleRepository.getAll(resortId);
    
    // Filter applicable rules (where accommodationId matches, and either has no range, or date is within range)
    const applicableRules = rules.filter(r => {
      const matchesAcc = r.accommodationId === 'all' || String(r.accommodationId) === String(accommodationId);
      if (!matchesAcc) return false;

      // Date range check (optional, if specified)
      if (r.startDate && r.endDate) {
        if (checkIn < r.startDate || checkIn > r.endDate) {
          return false;
        }
      }

      // Days of week check (optional, e.g. [5,6] for weekend rules)
      if (r.daysOfWeek && r.daysOfWeek.length > 0) {
        const utcDay = checkInDate.getUTCDay();
        if (!r.daysOfWeek.includes(utcDay)) {
          return false;
        }
      }

      return true;
    });

    // Evaluate closed to arrival
    const arrivalBlockedRule = applicableRules.find(r => r.closedToArrival === true);
    if (arrivalBlockedRule) {
      return {
        isValid: false,
        reason: 'CLOSED_TO_ARRIVAL',
        message: `No se permiten ingresos (check-in) en la fecha seleccionada (${checkIn}) debido a políticas activas.`
      };
    }

    // Evaluate closed to departure
    const departureBlockedRule = applicableRules.find(r => r.closedToDeparture === true);
    if (departureBlockedRule) {
      return {
        isValid: false,
        reason: 'CLOSED_TO_DEPARTURE',
        message: `No se permiten salidas (check-out) en la fecha seleccionada (${checkOut}) debido a políticas activas.`
      };
    }

    // Evaluate minStay
    let requiredMinStay = 0;
    applicableRules.forEach(r => {
      if (r.minStay !== undefined && r.minStay > requiredMinStay) {
        requiredMinStay = r.minStay;
      }
    });
    if (requiredMinStay > 0 && nights < requiredMinStay) {
      return {
        isValid: false,
        reason: 'MIN_STAY_NOT_MET',
        message: `La estadía mínima para este periodo es de ${requiredMinStay} noches (has seleccionado ${nights}).`
      };
    }

    // Evaluate maxStay
    let requiredMaxStay = Infinity;
    applicableRules.forEach(r => {
      if (r.maxStay !== undefined && r.maxStay < requiredMaxStay) {
        requiredMaxStay = r.maxStay;
      }
    });
    if (requiredMaxStay !== Infinity && nights > requiredMaxStay) {
      return {
        isValid: false,
        reason: 'MAX_STAY_NOT_MET',
        message: `La estadía máxima para este periodo es de ${requiredMaxStay} noches (has seleccionado ${nights}).`
      };
    }

    // Evaluate minStayArrival
    let requiredMinStayArrival = 0;
    applicableRules.forEach(r => {
      if (r.minStayArrival !== undefined && r.minStayArrival > requiredMinStayArrival) {
        requiredMinStayArrival = r.minStayArrival;
      }
    });
    if (requiredMinStayArrival > 0 && nights < requiredMinStayArrival) {
      return {
        isValid: false,
        reason: 'MIN_STAY_NOT_MET',
        message: `Para ingresos en este periodo, se requiere una estadía mínima de ${requiredMinStayArrival} noches.`
      };
    }

    // Evaluate minStayDeparture
    let requiredMinStayDeparture = 0;
    applicableRules.forEach(r => {
      if (r.minStayDeparture !== undefined && r.minStayDeparture > requiredMinStayDeparture) {
        requiredMinStayDeparture = r.minStayDeparture;
      }
    });
    if (requiredMinStayDeparture > 0 && nights < requiredMinStayDeparture) {
      return {
        isValid: false,
        reason: 'MIN_STAY_NOT_MET',
        message: `Para egresos en este periodo, se requiere una estadía mínima de ${requiredMinStayDeparture} noches.`
      };
    }

    // Evaluate minDaysInAdvance
    let requiredAdvance = 0;
    applicableRules.forEach(r => {
      if (r.minDaysInAdvance !== undefined && r.minDaysInAdvance > requiredAdvance) {
        requiredAdvance = r.minDaysInAdvance;
      }
    });
    if (requiredAdvance > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingLeadTime = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (bookingLeadTime < requiredAdvance) {
        return {
          isValid: false,
          reason: 'MIN_ADVANCE_NOT_MET',
          message: `Este periodo requiere reservar con al menos ${requiredAdvance} días de anticipación (tu búsqueda es con ${bookingLeadTime} días).`
        };
      }
    }

    // 3. Evaluate actual blockages & reservation overlaps
    const checkOutDateBefore = addDays(checkOut, -1);
    const dayStatuses = await this.obtenerDisponibilidad(resortId, accommodationId, checkIn, checkOutDateBefore);

    for (const day of dayStatuses) {
      if (day.status !== AvailabilityStatus.AVAILABLE) {
        let reasonCode: ValidationResult['reason'] = 'NO_AVAILABILITY';
        let spanishMsg = 'El alojamiento no está disponible en las fechas seleccionadas.';

        if (day.status === AvailabilityStatus.OUT_OF_SERVICE) {
          reasonCode = 'CLOSED_TEMPORARILY';
          spanishMsg = `El alojamiento se encuentra cerrado temporalmente el día ${day.date}: ${day.reason || 'Cierre temporal'}`;
        } else if (day.status === AvailabilityStatus.MAINTENANCE) {
          reasonCode = 'MAINTENANCE';
          spanishMsg = `El alojamiento está en mantenimiento el día ${day.date}: ${day.reason || 'Mantenimiento'}`;
        } else if (day.status === AvailabilityStatus.BLOCKED) {
          reasonCode = 'BLOCKED';
          spanishMsg = `El alojamiento está bloqueado el día ${day.date}: ${day.reason || 'Bloqueo manual'}`;
        } else if (day.status === AvailabilityStatus.RESERVED) {
          reasonCode = 'NO_AVAILABILITY';
          spanishMsg = `El alojamiento ya tiene una reserva confirmada o pendiente para el día ${day.date}.`;
        }

        return {
          isValid: false,
          reason: reasonCode,
          message: spanishMsg
        };
      }
    }

    return {
      isValid: true,
      message: 'Disponible'
    };
  }

  /**
   * Applies a block or maintenance period for an accommodation.
   * Resolves conflicts and creates daily entries in the database.
   */
  static async applyBlock(
    resortId: string,
    accommodationId: string | number,
    startDate: string,
    endDate: string,
    status: AvailabilityStatus,
    reason: string,
    notes?: string,
    userId?: string
  ): Promise<void> {
    validateDateRange(startDate, endDate);

    if (status === AvailabilityStatus.AVAILABLE) {
      throw new Error('No se puede aplicar un bloqueo con estado AVAILABLE. Use liberar bloqueo en su lugar.');
    }

    // 1. Fetch current overrides in range to check for conflicts
    const existing = await availabilityRepository.findRange(resortId, accommodationId, startDate, endDate);
    
    // Format existing entries to match validator signature
    const periods = existing.map(e => ({
      id: e.id,
      startDate: e.date,
      endDate: e.date
    }));

    // 2. Resolve conflicts: Throws if there are overlaps
    validateConflict(accommodationId, startDate, endDate, periods);

    // 3. Create individual daily entries (for backwards compatibility)
    const dates = getDatesInRange(startDate, endDate);
    const now = new Date().toISOString();

    for (const date of dates) {
      const id = `${accommodationId}_${date}`;
      const availability: Availability = {
        id,
        resortId,
        accommodationId,
        date,
        status,
        reason,
        notes,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId
      };

      await availabilityRepository.create(resortId, availability);
    }

    Logger.info(`Aplicado bloqueo con estado ${status} para alojamiento ${accommodationId} desde ${startDate} hasta ${endDate}`);
  }

  /**
   * Releases blocks or maintenance periods for an accommodation in a date range.
   * Deletes daily entries from the database, returning them to the default AVAILABLE status.
   */
  static async releaseBlock(
    resortId: string,
    accommodationId: string | number,
    startDate: string,
    endDate: string
  ): Promise<void> {
    validateDateRange(startDate, endDate);

    const dates = getDatesInRange(startDate, endDate);
    for (const date of dates) {
      const id = `${accommodationId}_${date}`;
      // Check if entry exists before deleting to save operations
      const existing = await availabilityRepository.findByDate(resortId, accommodationId, date);
      if (existing) {
        await availabilityRepository.deleteAvailability(resortId, id);
      }
    }

    Logger.info(`Liberado bloqueo para alojamiento ${accommodationId} desde ${startDate} hasta ${endDate}`);
  }
}

export default AvailabilityService;
