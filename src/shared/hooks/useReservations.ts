import { useState, useEffect, useCallback } from 'react';
import { Booking } from '../../types';
import { ReservationService } from '../services/ReservationService';
import { useResort } from '../contexts/ResortContext';
import { BookingService } from '../../modules/bookings/services/BookingService';

export const useReservations = () => {
  const { resort } = useResort();
  const [reservations, setReservations] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resort) {
      setReservations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Real-time listener subscription
    const unsubscribe = BookingService.subscribeBookings(resort.id, (data) => {
      setReservations(data);
      setLoading(false);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, [resort]);

  const saveReservation = async (booking: Booking) => {
    if (!resort) return;
    try {
      await ReservationService.saveReservation(resort.id, booking);
    } catch (err: any) {
      setError(err.message || 'Error al guardar reserva');
      throw err;
    }
  };

  const updateReservationStatus = async (id: number, status: 'pending' | 'confirmed' | 'cancelled') => {
    if (!resort) return;
    try {
      await ReservationService.updateReservationStatus(resort.id, id, status);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar estado de reserva');
      throw err;
    }
  };

  const checkConflict = async (cabinId: number, checkIn: string, checkOut: string, excludeId?: number) => {
    if (!resort) return false;
    return await ReservationService.hasConflict(resort.id, cabinId, checkIn, checkOut, excludeId);
  };

  return {
    reservations,
    loading,
    error,
    saveReservation,
    updateReservationStatus,
    checkConflict,
    reload: () => {} // noop because it is real-time
  };
};
export default useReservations;
