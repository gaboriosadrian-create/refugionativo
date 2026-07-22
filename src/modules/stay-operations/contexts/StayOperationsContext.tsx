import React, { createContext, useState, ReactNode } from 'react';
import { Booking } from '../../../types';
import { StayOperationsService } from '../services/StayOperationsService';
import { StayTransition } from '../types';
import { useResort } from '../../../shared/contexts/ResortContext';

interface StayOperationsContextType {
  loading: boolean;
  error: string | null;
  executeStayTransition: (bookingId: number, action: string) => Promise<Booking>;
  getAllowedTransitions: (booking: Booking) => StayTransition[];
  isValidTransition: (booking: Booking, action: string) => boolean;
  clearError: () => void;
}

export const StayOperationsContext = createContext<StayOperationsContextType | undefined>(undefined);

interface StayOperationsProviderProps {
  children: ReactNode;
}

export const StayOperationsProvider: React.FC<StayOperationsProviderProps> = ({ children }) => {
  const { resort } = useResort();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const executeStayTransition = async (bookingId: number, action: string): Promise<Booking> => {
    if (!resort) {
      const errMessage = 'No se ha seleccionado un complejo/resort activo.';
      setError(errMessage);
      throw new Error(errMessage);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedBooking = await StayOperationsService.executeTransition(
        resort.id,
        bookingId,
        action,
        'Backoffice Staff'
      );
      return updatedBooking;
    } catch (err: any) {
      const errMsg = err.message || 'Error al ejecutar la transición de estadía';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAllowedTransitions = (booking: Booking): StayTransition[] => {
    return StayOperationsService.getAllowedTransitions(booking);
  };

  const isValidTransition = (booking: Booking, action: string): boolean => {
    return StayOperationsService.isValidTransition(booking, action);
  };

  return (
    <StayOperationsContext.Provider
      value={{
        loading,
        error,
        executeStayTransition,
        getAllowedTransitions,
        isValidTransition,
        clearError
      }}
    >
      {children}
    </StayOperationsContext.Provider>
  );
};
