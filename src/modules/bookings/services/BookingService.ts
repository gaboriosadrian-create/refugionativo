import { Booking, Cabin } from '../../../types';
import { bookingRepository } from '../repositories/BookingRepository';
import { bookingHistoryRepository } from '../repositories/BookingHistoryRepository';
import { accommodationRepository } from '../../accommodations/repositories/AccommodationRepository';
import { availabilityRepository } from '../../availability/repositories/AvailabilityRepository';
import { AvailabilityService } from '../../availability/services/AvailabilityService';
import { AvailabilityStatus, Availability } from '../../availability/types';
import { getDatesInRange, addDays } from '../../availability/utils';
import { 
  BookingValidationError, 
  BookingConflictError, 
  BookingAvailabilityError, 
  BookingCapacityError 
} from '../errors';
import { Logger } from '../../../core/logger/Logger';
import { db, isFirebaseConfigured } from '../../../core/firebase/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { BookingHistory } from '../types';
import { GuestService } from '../../guests/services/GuestService';
import { PricingService } from '../../pricing/services/PricingService';
import { NotificationEngine } from '../../../core/notifications/NotificationEngine';
import { NotificationEvent } from '../../../core/notifications/NotificationTypes';

export class BookingService {
  /**
   * Helper to format dates and ensure consistency.
   */
  private static getTodayDateStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Evaluates overlaps between two date intervals.
   */
  private static hasOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Calculates total nights of stay.
   */
  public static calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn + 'T12:00:00');
    const end = new Date(checkOut + 'T12:00:00');
    const diff = end.getTime() - start.getTime();
    return Math.max(0, Math.round(diff / 86400000));
  }

  /**
   * Checks if an accommodation is available for a requested period.
   * Excludes check-out date from the blocked range, as standard in hospitality.
   */
  public static async hasConflict(
    resortId: string,
    accommodationId: number,
    checkIn: string,
    checkOut: string,
    excludeBookingId?: number
  ): Promise<boolean> {
    // 1. Check reservation database overlaps
    const allReservations = await bookingRepository.getAll(resortId);
    const overlappingReservation = allReservations.some(b => {
      if (b.id === excludeBookingId) return false;
      if (Number(b.cabinId) !== Number(accommodationId)) return false;
      if (b.status === 'cancelled' || b.status === 'pending_approval') return false;
      return this.hasOverlap(checkIn, checkOut, b.checkIn, b.checkOut);
    });

    if (overlappingReservation) {
      return true;
    }

    // 2. Check manual blocks, maintenance or out of service overrides via AvailabilityService
    // Since check-out date is not occupied, we query up to checkOut - 1
    const endDateStr = addDays(checkOut, -1);
    const rangeAvail = await AvailabilityService.getRangeAvailability(resortId, accommodationId, checkIn, endDateStr);
    
    return rangeAvail.some(day => {
      if (day.status === AvailabilityStatus.AVAILABLE) return false;
      // If there is an override, verify if it was placed by this exact booking (ignore if so)
      if (excludeBookingId && day.reason === `reserva_${excludeBookingId}`) return false;
      return true;
    });
  }

  /**
   * Retrieves all bookings for a given resort.
   */
  public static async getBookings(resortId: string): Promise<Booking[]> {
    return bookingRepository.getAll(resortId);
  }

  /**
   * Creates a new booking, running all required validations and atomically
   * blocking dates and saving history using a Firestore Batch Write.
   */
  public static async createBooking(
    resortId: string,
    bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'totalPrice'> & { id?: number; status?: Booking['status']; totalPrice?: number },
    userId?: string
  ): Promise<Booking> {
    const { id, cabinId, checkIn, checkOut, guests, name, phone, email, paymentMethod, status, notes } = bookingData;
    Logger.info(`Iniciando flujo de creación de reserva para alojamiento ${cabinId} en Resort ${resortId}`);

    // 1. Validar alojamiento existente
    const accommodation = await accommodationRepository.findById(resortId, cabinId);
    if (!accommodation) {
      throw new BookingValidationError(`El alojamiento seleccionado (ID: ${cabinId}) no existe.`);
    }
    if (accommodation.status === 'inactive' || accommodation.deleted) {
      throw new BookingValidationError(`El alojamiento "${accommodation.name}" está inactivo o fuera de servicio.`);
    }

    // 2. Validar fechas
    if (!checkIn || !checkOut) {
      throw new BookingValidationError('Las fechas de check-in y check-out son obligatorias.');
    }
    if (checkIn >= checkOut) {
      throw new BookingValidationError('La fecha de check-out debe ser estrictamente posterior a la fecha de check-in.');
    }
    const todayStr = this.getTodayDateStr();
    if (checkIn < todayStr) {
      throw new BookingValidationError(`La fecha de check-in (${checkIn}) no puede ser anterior a hoy (${todayStr}).`);
    }

    // 3. Validar rango (estancia mínima)
    const nights = this.calculateNights(checkIn, checkOut);
    if (nights === 0) {
      throw new BookingValidationError('La reserva debe durar al menos 1 noche.');
    }
    const baseCabinPrice = accommodation.pricing?.basePrice || (accommodation as any).price || 0;
    const minStayCheck = await PricingService.validateMinimumStay(resortId, cabinId, checkIn, checkOut);
    if (!minStayCheck.valid) {
      throw new BookingValidationError(
        `La estancia mínima para este periodo es de ${minStayCheck.minRequired} noches (${minStayCheck.ruleDescription || 'Estancia mínima por temporada/día'}). Tu solicitud es de ${nights} noches.`
      );
    }

    // 4. Validar capacidad
    const maxCapacity = accommodation.capacity?.maxGuests || (accommodation as any).capacity || (accommodation as any).maxGuests || 1;
    const minCapacity = (accommodation as any).minGuests || 1;
    if (guests > maxCapacity) {
      throw new BookingCapacityError(`La capacidad máxima de este alojamiento es de ${maxCapacity} huéspedes. Solicitaste para ${guests}.`);
    }
    if (guests < minCapacity) {
      throw new BookingCapacityError(`La capacidad mínima permitida es de ${minCapacity} huéspedes. Solicitaste para ${guests}.`);
    }

    // 5 & 6. Consultar disponibilidad y detectar conflictos
    const conflict = await this.hasConflict(resortId, cabinId, checkIn, checkOut);
    if (conflict) {
      throw new BookingConflictError(`Conflicto de disponibilidad: El alojamiento no está disponible para el periodo seleccionado (${checkIn} al ${checkOut}).`);
    }

    // 7 & 8. Calcular noches e importes delegando en el PricingService
    const petsCount = (bookingData as any).petsCount || 0;
    const pricingResult = await PricingService.calculatePrice(
      resortId,
      cabinId,
      checkIn,
      checkOut,
      guests,
      petsCount,
      baseCabinPrice
    );
    const totalPrice = bookingData.totalPrice !== undefined ? bookingData.totalPrice : pricingResult.totalPrice;

    // 9. Resolver Huésped Automático / Reutilizable
    let guestId = bookingData.guestId;
    let guestSnapshot = bookingData.guestSnapshot;

    try {
      if (!guestId) {
        const nameParts = (name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || 'Huésped';
        const lastName = nameParts.slice(1).join(' ') || 'Registrado';
        
        const guest = await GuestService.findOrCreateOrUpdateGuest(resortId, {
          firstName,
          lastName,
          email: email || '',
          phone: phone || '',
        }, userId);
        
        guestId = guest.id;
        guestSnapshot = GuestService.toSnapshot(guest);
      } else if (!guestSnapshot) {
        const guest = await GuestService.getGuestById(resortId, guestId);
        if (guest) {
          guestSnapshot = GuestService.toSnapshot(guest);
        }
      }
    } catch (guestErr) {
      Logger.error('Error al resolver o registrar el huésped de la reserva:', guestErr);
    }

    // 10. Construir objeto Booking
    const bookingId = id || Date.now();
    const finalStatus: Booking['status'] = status || (paymentMethod ? 'confirmed' : 'pending');
    const paymentStatus: Booking['paymentStatus'] = paymentMethod ? 'paid' : 'pending';

    const newBooking: Booking = {
      id: bookingId,
      cabinId,
      accommodationId: cabinId,
      name,
      phone,
      email: email || '',
      guests,
      checkIn,
      checkOut,
      status: finalStatus,
      totalPrice,
      paymentMethod: paymentMethod || '',
      paymentStatus,
      notes: notes || '',
      guestId,
      guestSnapshot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 11. Generar Historial
    const historyRecord: BookingHistory = {
      id: `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId,
      action: 'creation',
      description: `Reserva #${bookingId} creada para ${name}. Periodo: ${checkIn} al ${checkOut} (${nights} noches). Huéspedes: ${guests}. Precio total: $${totalPrice}.`,
      timestamp: new Date().toISOString(),
      userId,
      payloadAfter: newBooking
    };

    // 10. Bloquear automáticamente disponibilidad en el rango de noches (desde checkIn hasta checkOut - 1)
    const datesToBlock = getDatesInRange(checkIn, addDays(checkOut, -1));
    const nowStr = new Date().toISOString();
    const dailyBlocks: Availability[] = datesToBlock.map(date => ({
      id: `${cabinId}_${date}`,
      resortId,
      accommodationId: cabinId,
      date,
      status: AvailabilityStatus.RESERVED,
      reason: `reserva_${bookingId}`,
      notes: `Reservado por ${name} (Reserva #${bookingId})`,
      createdAt: nowStr,
      updatedAt: nowStr,
      createdBy: userId,
      updatedBy: userId
    }));

    // Ejecución Atómica (Firestore Batch Writes o LocalSaaSDb secuencial)
    if (isFirebaseConfigured) {
      try {
        const batch = writeBatch(db);

        // Guardar Reserva
        const bookingRef = doc(db, 'resorts', resortId, 'reservations', String(bookingId));
        batch.set(bookingRef, newBooking);

        // Guardar Historial de Auditoría
        const historyRef = doc(db, 'resorts', resortId, 'booking_history', historyRecord.id);
        batch.set(historyRef, historyRecord);

        // Bloquear Disponibilidad diaria
        for (const block of dailyBlocks) {
          const avRef = doc(db, 'resorts', resortId, 'availability', block.id);
          batch.set(avRef, block, { merge: true });
        }

        // Commitear Batch Write
        await batch.commit();
        Logger.info(`Reserva #${bookingId} y bloqueos aplicados exitosamente en Firestore (Batch Write).`);
      } catch (err) {
        Logger.error('Error al comitear Batch Write para creación de reserva:', err);
        throw err;
      }
    } else {
      // Local storage fallback
      await bookingRepository.save(resortId, newBooking);
      await bookingHistoryRepository.save(resortId, historyRecord);
      for (const block of dailyBlocks) {
        await availabilityRepository.create(resortId, block);
      }
      Logger.info(`Reserva #${bookingId} guardada localmente de manera consistente.`);
    }

    // Trigger BOOKING_CREATED event and schedule relative notifications
    try {
      NotificationEngine.trigger(NotificationEvent.BOOKING_CREATED, { booking: newBooking }, undefined, resortId);
      
      // If confirmed, schedule reminders right away
      if (newBooking.status === 'confirmed') {
        const parseDate = (dStr: string) => new Date(dStr + 'T12:00:00');
        const checkInDate = parseDate(newBooking.checkIn);
        const prevCheckIn = new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000);
        const checkInSchedule = prevCheckIn > new Date() ? prevCheckIn.toISOString() : new Date(Date.now() + 60000).toISOString();
        
        const checkOutDate = parseDate(newBooking.checkOut);
        const prevCheckOut = new Date(checkOutDate.getTime() - 24 * 60 * 60 * 1000);
        const checkOutSchedule = prevCheckOut > new Date() ? prevCheckOut.toISOString() : new Date(Date.now() + 120000).toISOString();

        NotificationEngine.trigger(NotificationEvent.CHECKIN_UPCOMING, { booking: newBooking }, { scheduledFor: checkInSchedule }, resortId);
        NotificationEngine.trigger(NotificationEvent.CHECKOUT_UPCOMING, { booking: newBooking }, { scheduledFor: checkOutSchedule }, resortId);
      }
    } catch (notifErr) {
      Logger.error('Error triggering notifications for booking creation:', notifErr);
    }

    return newBooking;
  }

  /**
   * Creates a new booking request in PENDING_APPROVAL status.
   * This is initiated by guest from the Public Portal.
   */
  public static async createBookingRequest(
    resortId: string,
    payload: {
      cabinId: number;
      checkIn: string;
      checkOut: string;
      name: string;
      phone: string;
      email?: string;
      guests: number;
      notes?: string;
    },
    userId?: string
  ): Promise<Booking> {
    const { cabinId, checkIn, checkOut, guests, name, phone, email, notes } = payload;
    Logger.info(`Iniciando flujo de creación de Solicitud de Reserva para alojamiento ${cabinId} en Resort ${resortId}`);

    // 1. Validar alojamiento existente
    const accommodation = await accommodationRepository.findById(resortId, cabinId);
    if (!accommodation) {
      throw new BookingValidationError(`El alojamiento seleccionado (ID: ${cabinId}) no existe.`);
    }
    if (accommodation.status === 'inactive' || accommodation.deleted) {
      throw new BookingValidationError(`El alojamiento "${accommodation.name}" está inactivo o fuera de servicio.`);
    }

    // 2. Validar fechas
    if (!checkIn || !checkOut) {
      throw new BookingValidationError('Las fechas de check-in y check-out son obligatorias.');
    }
    if (checkIn >= checkOut) {
      throw new BookingValidationError('La fecha de check-out debe ser estrictamente posterior a la fecha de check-in.');
    }
    const todayStr = this.getTodayDateStr();
    if (checkIn < todayStr) {
      throw new BookingValidationError(`La fecha de check-in (${checkIn}) no puede ser anterior a hoy (${todayStr}).`);
    }

    // 3. Validar rango (estancia mínima)
    const nights = this.calculateNights(checkIn, checkOut);
    if (nights === 0) {
      throw new BookingValidationError('La reserva debe durar al menos 1 noche.');
    }
    const baseCabinPrice = accommodation.pricing?.basePrice || (accommodation as any).price || 0;
    const minStayCheck = await PricingService.validateMinimumStay(resortId, cabinId, checkIn, checkOut);
    if (!minStayCheck.valid) {
      throw new BookingValidationError(
        `La estancia mínima para este periodo es de ${minStayCheck.minRequired} noches (${minStayCheck.ruleDescription || 'Estancia mínima por temporada/día'}). Tu solicitud es de ${nights} noches.`
      );
    }

    // 4. Validar capacidad
    const maxCapacity = accommodation.capacity?.maxGuests || (accommodation as any).capacity || (accommodation as any).maxGuests || 1;
    const minCapacity = (accommodation as any).minGuests || 1;
    if (guests > maxCapacity) {
      throw new BookingCapacityError(`La capacidad máxima de este alojamiento es de ${maxCapacity} huéspedes. Solicitaste para ${guests}.`);
    }
    if (guests < minCapacity) {
      throw new BookingCapacityError(`La capacidad mínima permitida es de ${minCapacity} huéspedes. Solicitaste para ${guests}.`);
    }

    // 5. Consultar disponibilidad y detectar conflictos (con reservas confirmadas u otras activas)
    const conflict = await this.hasConflict(resortId, cabinId, checkIn, checkOut);
    if (conflict) {
      throw new BookingConflictError(`Conflicto de disponibilidad: El alojamiento no está disponible para el periodo seleccionado (${checkIn} al ${checkOut}).`);
    }

    // 6. Calcular precio dinámico
    const petsCount = (payload as any).petsCount || 0;
    const pricingResult = await PricingService.calculatePrice(
      resortId,
      cabinId,
      checkIn,
      checkOut,
      guests,
      petsCount,
      baseCabinPrice
    );
    const totalPrice = pricingResult.totalPrice;

    // 7. Resolver Huésped Automático / Reutilizable
    let guestId: string | undefined;
    let guestSnapshot: any;

    try {
      const nameParts = (name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || 'Huésped';
      const lastName = nameParts.slice(1).join(' ') || 'Registrado';
      
      const guest = await GuestService.findOrCreateOrUpdateGuest(resortId, {
        firstName,
        lastName,
        email: email || '',
        phone: phone || '',
      }, userId || 'Public Portal');
      
      guestId = guest.id;
      guestSnapshot = GuestService.toSnapshot(guest);
    } catch (guestErr) {
      Logger.error('Error al resolver o registrar el huésped de la reserva:', guestErr);
    }

    // 8. Construir objeto Booking con estado 'pending_approval'
    const bookingId = Date.now();
    const newBooking: Booking = {
      id: bookingId,
      cabinId,
      accommodationId: cabinId,
      name,
      phone,
      email: email || '',
      guests,
      checkIn,
      checkOut,
      status: 'pending_approval',
      totalPrice,
      paymentMethod: '',
      paymentStatus: 'pending',
      notes: notes || '',
      guestId,
      guestSnapshot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 9. Generar Historial
    const historyRecord: BookingHistory = {
      id: `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId,
      action: 'creation',
      description: `Solicitud de reserva #${bookingId} enviada para ${name} (Pendiente de Aprobación). Periodo: ${checkIn} al ${checkOut} (${nights} noches). Huéspedes: ${guests}. Importe estimado: $${totalPrice}.`,
      timestamp: new Date().toISOString(),
      userId: userId || 'Public Portal',
      payloadAfter: newBooking
    };

    // 10. Persistir de forma consistente
    if (isFirebaseConfigured) {
      try {
        const batch = writeBatch(db);

        // Guardar Reserva
        const bookingRef = doc(db, 'resorts', resortId, 'reservations', String(bookingId));
        batch.set(bookingRef, newBooking);

        // Guardar Historial
        const historyRef = doc(db, 'resorts', resortId, 'booking_history', historyRecord.id);
        batch.set(historyRef, historyRecord);

        await batch.commit();
        Logger.info(`Solicitud de Reserva #${bookingId} guardada en Firestore.`);
      } catch (err) {
        Logger.error('Error al registrar Solicitud de Reserva en Firestore:', err);
        throw err;
      }
    } else {
      // Local fallback
      await bookingRepository.save(resortId, newBooking);
      await bookingHistoryRepository.save(resortId, historyRecord);
      Logger.info(`Solicitud de Reserva #${bookingId} guardada localmente.`);
    }

    // Trigger BOOKING_CREATED event for Request
    try {
      NotificationEngine.trigger(NotificationEvent.BOOKING_CREATED, { booking: newBooking }, undefined, resortId);
    } catch (notifErr) {
      Logger.error('Error triggering notifications for booking request:', notifErr);
    }

    return newBooking;
  }

  /**
   * Modifies an existing booking, recalculating rates if required, validating
   * new availability and modifying blocks consistently.
   */
  public static async updateBooking(
    resortId: string,
    id: number,
    updatedFields: Partial<Booking>,
    userId?: string
  ): Promise<Booking> {
    Logger.info(`Iniciando actualización de reserva #${id} en Resort ${resortId}`);

    const booking = await bookingRepository.getById(resortId, id);
    if (!booking) {
      throw new BookingValidationError(`La reserva con ID ${id} no existe.`);
    }

    // Mezclar estado candidato
    const candidateBooking: Booking = {
      ...booking,
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    // 1. Validar alojamiento si cambia o para confirmar
    const cabinId = candidateBooking.cabinId;
    const accommodation = await accommodationRepository.findById(resortId, cabinId);
    if (!accommodation) {
      throw new BookingValidationError(`El alojamiento seleccionado (ID: ${cabinId}) no existe.`);
    }

    // 2 & 3. Validar fechas y rangos
    if (candidateBooking.checkIn >= candidateBooking.checkOut) {
      throw new BookingValidationError('La fecha de check-out debe ser estrictamente posterior a la fecha de check-in.');
    }

    const nights = this.calculateNights(candidateBooking.checkIn, candidateBooking.checkOut);
    if (nights === 0) {
      throw new BookingValidationError('La reserva debe durar al menos 1 noche.');
    }

    const minStay = accommodation.pricing?.minimumStay || (accommodation as any).minGuests || 1;
    if (nights < minStay) {
      throw new BookingValidationError(`La estancia mínima para este alojamiento es de ${minStay} noches. Tu actualización resulta en ${nights} noches.`);
    }

    // 4. Validar capacidad
    const maxCapacity = accommodation.capacity?.maxGuests || (accommodation as any).capacity || (accommodation as any).maxGuests || 1;
    if (candidateBooking.guests > maxCapacity) {
      throw new BookingCapacityError(`La capacidad máxima de este alojamiento es de ${maxCapacity} huéspedes. Solicitaste para ${candidateBooking.guests}.`);
    }

    // Verificar si cambiaron aspectos críticos de conflicto (fechas, alojamiento o estado que sale de 'cancelled' o 'no_show')
    const datesChanged = booking.checkIn !== candidateBooking.checkIn || booking.checkOut !== candidateBooking.checkOut;
    const cabinChanged = Number(booking.cabinId) !== Number(candidateBooking.cabinId);
    const previousStatusReleased = booking.status === 'cancelled' || booking.status === 'no_show' || booking.status === 'expired';
    const statusReopened = previousStatusReleased && candidateBooking.status !== 'cancelled' && candidateBooking.status !== 'no_show' && candidateBooking.status !== 'expired';

    if ((datesChanged || cabinChanged || statusReopened) && candidateBooking.status !== 'cancelled' && candidateBooking.status !== 'no_show' && candidateBooking.status !== 'expired') {
      const conflict = await this.hasConflict(resortId, cabinId, candidateBooking.checkIn, candidateBooking.checkOut, id);
      if (conflict) {
        throw new BookingConflictError(`Conflicto de disponibilidad: El alojamiento no está disponible para las nuevas fechas (${candidateBooking.checkIn} al ${candidateBooking.checkOut}).`);
      }
    }

    // Calcular nuevos importes si cambió el alojamiento o las fechas
    if (datesChanged || cabinChanged) {
      const pricePerNight = accommodation.pricing?.basePrice || (accommodation as any).price || 0;
      const discountPercent = (accommodation as any).discount || 0;
      const effectivePricePerNight = Math.round(pricePerNight * (1 - discountPercent / 100));
      candidateBooking.totalPrice = effectivePricePerNight * nights;
    }

    // Actualizar estado del pago automático si pasa a confirmado
    if (updatedFields.status === 'confirmed' && booking.status !== 'confirmed') {
      candidateBooking.paymentStatus = 'paid';
    }

    // Registrar cambios en el Historial
    const changes: string[] = [];
    let actionType: BookingHistory['action'] = 'update';

    if (cabinChanged) {
      changes.push(`alojamiento (de #${booking.cabinId} a #${candidateBooking.cabinId})`);
      actionType = 'accommodation_change';
    }
    if (datesChanged) {
      changes.push(`fechas (de ${booking.checkIn}/${booking.checkOut} a ${candidateBooking.checkIn}/${candidateBooking.checkOut})`);
      actionType = 'date_change';
    }
    if (booking.guests !== candidateBooking.guests) {
      changes.push(`huéspedes (de ${booking.guests} a ${candidateBooking.guests})`);
    }
    if (booking.status !== candidateBooking.status) {
      changes.push(`estado (de ${booking.status} a ${candidateBooking.status})`);
      if (candidateBooking.status === 'confirmed') actionType = 'confirmation';
      if (candidateBooking.status === 'cancelled') actionType = 'cancellation';
      if (candidateBooking.status === 'checked_in') actionType = 'status_change';
      if (candidateBooking.status === 'in_house') actionType = 'status_change';
      if (candidateBooking.status === 'checked_out') actionType = 'status_change';
      if (candidateBooking.status === 'completed') actionType = 'status_change';
      if (candidateBooking.status === 'no_show') actionType = 'status_change';
    }

    const historyRecord: BookingHistory = {
      id: `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      resortId,
      bookingId: id,
      action: actionType,
      description: `Reserva #${id} actualizada: ${changes.join(', ') || 'campos informativos modificados'}.`,
      timestamp: new Date().toISOString(),
      userId,
      payloadBefore: booking,
      payloadAfter: candidateBooking
    };

    // Calcular bloques de disponibilidad a borrar y crear
    const oldDates = getDatesInRange(booking.checkIn, addDays(booking.checkOut, -1));
    const newDates = candidateBooking.status !== 'cancelled' && candidateBooking.status !== 'no_show' && candidateBooking.status !== 'pending_approval' && candidateBooking.status !== 'expired'
      ? getDatesInRange(candidateBooking.checkIn, addDays(candidateBooking.checkOut, -1)) 
      : [];

    const nowStr = new Date().toISOString();
    const dailyBlocks: Availability[] = newDates.map(date => ({
      id: `${candidateBooking.cabinId}_${date}`,
      resortId,
      accommodationId: candidateBooking.cabinId,
      date,
      status: AvailabilityStatus.RESERVED,
      reason: `reserva_${id}`,
      notes: `Reservado por ${candidateBooking.name} (Reserva #${id})`,
      createdAt: booking.createdAt || nowStr,
      updatedAt: nowStr,
      createdBy: (booking as any).createdBy || userId,
      updatedBy: userId
    }));

    if (isFirebaseConfigured) {
      try {
        const batch = writeBatch(db);

        // Actualizar Reserva
        const bookingRef = doc(db, 'resorts', resortId, 'reservations', String(id));
        batch.set(bookingRef, candidateBooking);

        // Guardar Historial
        const historyRef = doc(db, 'resorts', resortId, 'booking_history', historyRecord.id);
        batch.set(historyRef, historyRecord);

        // Eliminar bloques viejos de disponibilidad
        for (const date of oldDates) {
          const oldAvRef = doc(db, 'resorts', resortId, 'availability', `${booking.cabinId}_${date}`);
          batch.delete(oldAvRef);
        }

        // Crear bloques nuevos de disponibilidad (si no está cancelado, ni no_show, ni pendiente de aprobación, ni expidada)
        if (candidateBooking.status !== 'cancelled' && candidateBooking.status !== 'no_show' && candidateBooking.status !== 'pending_approval' && candidateBooking.status !== 'expired') {
          for (const block of dailyBlocks) {
            const avRef = doc(db, 'resorts', resortId, 'availability', block.id);
            batch.set(avRef, block, { merge: true });
          }
        }

        await batch.commit();
        Logger.info(`Reserva #${id} y disponibilidad actualizados de manera atómica (Batch Write).`);
      } catch (err) {
        Logger.error(`Error comiteando Batch Write para actualizar reserva #${id}:`, err);
        throw err;
      }
    } else {
      // Local implementation
      await bookingRepository.save(resortId, candidateBooking);
      await bookingHistoryRepository.save(resortId, historyRecord);

      // Eliminar bloques anteriores
      for (const date of oldDates) {
        await availabilityRepository.deleteAvailability(resortId, `${booking.cabinId}_${date}`);
      }

      // Crear bloques nuevos (si no está cancelado, ni no_show, ni pendiente de aprobación, ni expirada)
      if (candidateBooking.status !== 'cancelled' && candidateBooking.status !== 'no_show' && candidateBooking.status !== 'pending_approval' && candidateBooking.status !== 'expired') {
        for (const block of dailyBlocks) {
          await availabilityRepository.create(resortId, block);
        }
      }
      Logger.info(`Reserva #${id} actualizada localmente de manera consistente.`);
    }

    // Event-driven Notifications based on status transitions
    if (booking.status !== candidateBooking.status) {
      try {
        const cabinName = (candidateBooking as any).cabinName || `Cabaña #${candidateBooking.cabinId}`;
        const opUserId = userId || 'System';
        const opUserName = userId || 'System';

        if (candidateBooking.status === 'checked_in' || candidateBooking.status === 'in_house') {
          // Set Room Status to occupied
          const { RoomStatusService } = await import('../../stay-operations/services/RoomStatusService');
          await RoomStatusService.updateRoomStatus(
            resortId,
            candidateBooking.cabinId,
            cabinName,
            'occupied',
            opUserId,
            opUserName
          );
        } else if (candidateBooking.status === 'checked_out') {
          // Trigger checkout cleaning task
          const { HousekeepingService } = await import('../../stay-operations/services/HousekeepingService');
          await HousekeepingService.createTask(resortId, {
            cabinId: candidateBooking.cabinId,
            cabinName,
            type: 'check_out',
            priority: 'high',
            notes: `Limpieza automática por check-out de la reserva #${id}. Huésped: ${candidateBooking.name}.`
          });
        }
      } catch (opErr) {
        Logger.error('Error triggering smart operations from booking transition:', opErr);
      }

      try {
        if (candidateBooking.status === 'confirmed') {
          NotificationEngine.trigger(NotificationEvent.BOOKING_CONFIRMED, { booking: candidateBooking }, undefined, resortId);
          NotificationEngine.trigger(NotificationEvent.PAYMENT_APPROVED, { booking: candidateBooking }, undefined, resortId);
          
          // Schedule upcoming check-in and check-out relative notifications
          const parseDate = (dStr: string) => new Date(dStr + 'T12:00:00');
          const checkInDate = parseDate(candidateBooking.checkIn);
          const prevCheckIn = new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000);
          const checkInSchedule = prevCheckIn > new Date() ? prevCheckIn.toISOString() : new Date(Date.now() + 60000).toISOString();
          
          const checkOutDate = parseDate(candidateBooking.checkOut);
          const prevCheckOut = new Date(checkOutDate.getTime() - 24 * 60 * 60 * 1000);
          const checkOutSchedule = prevCheckOut > new Date() ? prevCheckOut.toISOString() : new Date(Date.now() + 120000).toISOString();

          NotificationEngine.trigger(NotificationEvent.CHECKIN_UPCOMING, { booking: candidateBooking }, { scheduledFor: checkInSchedule }, resortId);
          NotificationEngine.trigger(NotificationEvent.CHECKOUT_UPCOMING, { booking: candidateBooking }, { scheduledFor: checkOutSchedule }, resortId);
        } else if (candidateBooking.status === 'cancelled') {
          NotificationEngine.trigger(NotificationEvent.BOOKING_CANCELLED, { booking: candidateBooking }, undefined, resortId);
        } else if (candidateBooking.status === 'checked_in' || candidateBooking.status === 'in_house') {
          NotificationEngine.trigger(NotificationEvent.CHECKIN_COMPLETED, { booking: candidateBooking }, undefined, resortId);
        } else if (candidateBooking.status === 'checked_out' || candidateBooking.status === 'completed') {
          NotificationEngine.trigger(NotificationEvent.CHECKOUT_COMPLETED, { booking: candidateBooking }, undefined, resortId);
        }
      } catch (notifErr) {
        Logger.error('Error triggering notifications during booking status transition:', notifErr);
      }
    }

    return candidateBooking;
  }

  /**
   * Confirms a reservation, changing its status.
   */
  public static async confirmBooking(resortId: string, id: number, userId?: string): Promise<Booking> {
    const booking = await bookingRepository.getById(resortId, id);
    if (!booking) {
      throw new BookingValidationError(`La reserva con ID #${id} no existe.`);
    }
    if (booking.status !== 'pending') {
      throw new BookingValidationError(`No se puede confirmar la reserva: el estado actual es "${booking.status}". Solo se pueden confirmar reservas en estado "pendiente".`);
    }
    return this.updateBooking(resortId, id, { status: 'confirmed' }, userId);
  }

  /**
   * Performs check-in of a confirmed booking (confirmed -> checked_in).
   */
  public static async performCheckIn(resortId: string, id: number, userId?: string): Promise<Booking> {
    const booking = await bookingRepository.getById(resortId, id);
    if (!booking) {
      throw new BookingValidationError(`La reserva con ID #${id} no existe.`);
    }
    if (booking.status !== 'confirmed') {
      throw new BookingValidationError(`No se puede realizar el check-in: la reserva debe estar en estado "confirmada" (estado actual: "${booking.status}").`);
    }
    return this.updateBooking(resortId, id, { status: 'checked_in' }, userId);
  }

  /**
   * Sets the stay status to in_house (checked_in -> in_house).
   */
  public static async setInHouse(resortId: string, id: number, userId?: string): Promise<Booking> {
    const booking = await bookingRepository.getById(resortId, id);
    if (!booking) {
      throw new BookingValidationError(`La reserva con ID #${id} no existe.`);
    }
    if (booking.status !== 'checked_in') {
      throw new BookingValidationError(`No se puede iniciar hospedaje: el estado actual debe ser "checked_in" (estado actual: "${booking.status}").`);
    }
    return this.updateBooking(resortId, id, { status: 'in_house' }, userId);
  }

  /**
   * Performs check-out of an in-house booking (in_house -> checked_out).
   */
  public static async performCheckOut(resortId: string, id: number, userId?: string): Promise<Booking> {
    const booking = await bookingRepository.getById(resortId, id);
    if (!booking) {
      throw new BookingValidationError(`La reserva con ID #${id} no existe.`);
    }
    if (booking.status !== 'in_house' && booking.status !== 'checked_in') {
      throw new BookingValidationError(`No se puede realizar el check-out: el huésped debe estar hospedado (estado actual: "${booking.status}").`);
    }
    return this.updateBooking(resortId, id, { status: 'checked_out' }, userId);
  }

  /**
   * Marks a booking as no-show (confirmed or pending -> no_show).
   * Freeing up all previously blocked dates.
   */
  public static async markNoShow(resortId: string, id: number, userId?: string): Promise<Booking> {
    const booking = await bookingRepository.getById(resortId, id);
    if (!booking) {
      throw new BookingValidationError(`La reserva con ID #${id} no existe.`);
    }
    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
      throw new BookingValidationError(`No se puede marcar como No-Show: la reserva debe estar pendiente o confirmada (estado actual: "${booking.status}").`);
    }
    return this.updateBooking(resortId, id, { status: 'no_show' }, userId);
  }

  /**
   * Completes a stay (checked_out -> completed).
   */
  public static async completeStay(resortId: string, id: number, userId?: string): Promise<Booking> {
    const booking = await bookingRepository.getById(resortId, id);
    if (!booking) {
      throw new BookingValidationError(`La reserva con ID #${id} no existe.`);
    }
    if (booking.status !== 'checked_out') {
      throw new BookingValidationError(`No se puede completar la estadía: el estado actual debe ser "checked_out" (estado actual: "${booking.status}").`);
    }
    return this.updateBooking(resortId, id, { status: 'completed' }, userId);
  }

  /**
   * Cancels a reservation, changing its status and automatically freeing up
   * all previously blocked dates in a single batch write.
   */
  public static async cancelBooking(resortId: string, id: number, userId?: string): Promise<Booking> {
    const booking = await bookingRepository.getById(resortId, id);
    if (!booking) {
      throw new BookingValidationError(`La reserva con ID #${id} no existe.`);
    }
    return this.updateBooking(resortId, id, { status: 'cancelled', paymentStatus: 'refunded' }, userId);
  }

  /**
   * Simple state transit utility.
   */
  public static async updateBookingStatus(
    resortId: string,
    id: number,
    status: Booking['status'],
    userId?: string
  ): Promise<Booking> {
    return this.updateBooking(resortId, id, { status }, userId);
  }

  /**
   * Deletes a booking from the system, automatically freeing up its blocked availability dates.
   */
  public static async deleteBooking(resortId: string, id: number, userId?: string): Promise<void> {
    const booking = await bookingRepository.getById(resortId, id);
    if (!booking) {
      throw new BookingValidationError(`La reserva con ID #${id} no existe.`);
    }

    // Get the blocked dates range to release them
    const dates = getDatesInRange(booking.checkIn, addDays(booking.checkOut, -1));

    if (isFirebaseConfigured) {
      try {
        const batch = writeBatch(db);
        
        // 1. Delete booking document
        const bookingPath = bookingRepository.getResortPath(resortId, id);
        const bookingRef = doc(db, bookingPath);
        batch.delete(bookingRef);

        // 2. Delete availability dates
        for (const date of dates) {
          const availId = `${booking.cabinId}_${date}`;
          const availPath = availabilityRepository.getResortPath(resortId, availId);
          const availRef = doc(db, availPath);
          batch.delete(availRef);
        }

        // 3. Create a deletion log record in history
        const logId = Date.now() + 1;
        const logPayload: BookingHistory = {
          id: String(logId),
          resortId,
          bookingId: id,
          action: 'status_change',
          description: `Reserva #${id} eliminada físicamente por el administrador.`,
          timestamp: new Date().toISOString(),
          userId: userId || 'admin'
        };
        const logPath = bookingHistoryRepository.getResortPath(resortId, logId);
        const logRef = doc(db, logPath);
        batch.set(logRef, logPayload);

        await batch.commit();
        Logger.info(`Reserva #${id} y sus bloques de disponibilidad eliminados mediante Batch Write.`);
      } catch (err) {
        Logger.error(`Error comiteando Batch Write para eliminar reserva #${id}:`, err);
        throw err;
      }
    } else {
      // Local implementation
      await bookingRepository.delete(resortId, id);
      
      // Delete blocks
      for (const date of dates) {
        await availabilityRepository.deleteAvailability(resortId, `${booking.cabinId}_${date}`);
      }

      // Add a history record
      const logId = Date.now() + 1;
      const logPayload: BookingHistory = {
        id: String(logId),
        resortId,
        bookingId: id,
        action: 'status_change',
        description: `Reserva #${id} eliminada físicamente por el administrador (Local).`,
        timestamp: new Date().toISOString(),
        userId: userId || 'admin'
      };
      await bookingHistoryRepository.save(resortId, logPayload);
      Logger.info(`Reserva #${id} eliminada localmente.`);
    }
  }

  /**
   * Retrieves the comprehensive history log for a specific booking.
   */
  public static async getBookingHistory(resortId: string, bookingId: number): Promise<BookingHistory[]> {
    const allLogs = await bookingHistoryRepository.getAll(resortId);
    return allLogs
      .filter(log => Number(log.bookingId) === Number(bookingId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Automatically expires pending bookings that exceed the parameterizable expiration time (in minutes).
   */
  public static async expirePendingBookings(resortId: string, expirationMinutes: number = 30): Promise<number> {
    Logger.info(`Iniciando chequeo de expiración automática para resort ${resortId} con umbral de ${expirationMinutes} minutos.`);
    const bookings = await this.getBookings(resortId);
    const now = new Date();
    let expiredCount = 0;

    for (const b of bookings) {
      if (b.status === 'pending' || b.status === 'pending_approval') {
        const createdAt = b.createdAt ? new Date(b.createdAt) : null;
        if (createdAt) {
          const diffMinutes = (now.getTime() - createdAt.getTime()) / 60000;
          if (diffMinutes >= expirationMinutes) {
            Logger.info(`Expirando reserva #${b.id} por superar tiempo límite.`);
            await this.updateBooking(resortId, b.id, { status: 'expired' }, 'auto-expiration-service');
            expiredCount++;
          }
        }
      }
    }

    return expiredCount;
  }

  /**
   * Subscribes to real-time changes in bookings.
   */
  public static subscribeBookings(resortId: string, callback: (bookings: Booking[]) => void): () => void {
    return bookingRepository.subscribe(resortId, callback);
  }

  /**
   * Subscribes to real-time changes in booking history.
   */
  public static subscribeHistory(resortId: string, callback: (history: BookingHistory[]) => void): () => void {
    return bookingHistoryRepository.subscribe(resortId, callback);
  }
}

export default BookingService;
