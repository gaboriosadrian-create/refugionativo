import React, { useState } from 'react';
import { TimelineHeader } from './TimelineHeader';
import { TimelineFilters } from './TimelineFilters';
import { TimelineGrid } from './TimelineGrid';
import { TimelineLegend } from './TimelineLegend';
import { EventDetailsModal, CreateBlockModal } from './TimelineDialogs';
import { BookingForm } from '../../bookings/components/BookingForm';
import { BackofficeCalendarProvider, useBackofficeCalendar } from '../contexts/BackofficeCalendarContext';
import { CalendarEvent } from '../types';
import { Booking, Cabin } from '../../../types';
import { BookingService } from '../../bookings/services/BookingService';
import { useResort } from '../../../shared/contexts/ResortContext';
import { AlertCircle } from 'lucide-react';

const InnerTimelineCalendar: React.FC = () => {
  const { resort } = useResort();
  const {
    accommodations,
    refreshData,
    selectedAccommodationId,
    selectedStartDate,
    selectedEndDate,
    clearRangeSelection
  } = useBackofficeCalendar();

  // Dialog Modals State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  
  // State for prefilling BookingForm
  const [prefilledBooking, setPrefilledBooking] = useState<Booking | null>(null);

  // Status / Feedback alerts
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Triggers booking creation form with prefilled dates and accommodation/cabin ID
  const handleOpenCreateBooking = (accommodationId: string | number, checkIn: string, checkOut: string) => {
    const mockBooking: any = {
      id: 0, // indicates new booking
      cabinId: Number(accommodationId),
      checkIn,
      checkOut,
      guests: 1,
      name: '',
      phone: '',
      status: 'pending'
    };

    setPrefilledBooking(mockBooking as Booking);
    setIsBookingFormOpen(true);
  };

  // Submits the booking created from the timeline selection
  const handleBookingFormSubmit = async (payload: any) => {
    if (!resort) return;
    try {
      await BookingService.createBooking(resort.id, payload, 'Backoffice-Calendar');
      showNotification('¡Reserva creada exitosamente desde el Timeline!');
      clearRangeSelection();
      setIsBookingFormOpen(false);
      setPrefilledBooking(null);
      await refreshData();
    } catch (err: any) {
      showNotification(err.message || 'Error al crear la reserva desde el Timeline', 'error');
      throw err;
    }
  };

  return (
    <div className="space-y-5">
      {/* Dynamic Action Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-55 rounded-2xl p-4 shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <AlertCircle className={`w-5 h-5 shrink-0 ${notification.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
          <span className="text-xs font-black leading-relaxed">{notification.message}</span>
        </div>
      )}

      {/* Main Title Row */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <span>Timeline de Complejo</span>
          <span className="inline-block bg-[#1e3a2b]/15 text-[#1e3a2b] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Reutilizable
          </span>
        </h2>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Vista unificada y sincronizada de reservas, bloqueos y tareas de mantenimiento técnico por alojamiento.
        </p>
      </div>

      {/* Segmented Controls & Date Navigation Header */}
      <TimelineHeader />

      {/* Search Bar & Multi-Select Dropdowns Filters */}
      <TimelineFilters />

      {/* Grid Canvas Scheduler */}
      <TimelineGrid
        onSelectEvent={setSelectedEvent}
        onOpenCreateBooking={handleOpenCreateBooking}
        onOpenCreateBlock={() => setIsBlockModalOpen(true)}
      />

      {/* Legend showing visual states */}
      <TimelineLegend />

      {/* Modals & Slideouts */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onViewBookingDetails={(bookingId) => {
            // Can be extended to switch to reservations list, or open details directly
            alert(`Navegando a detalles de reserva #${bookingId}.`);
          }}
        />
      )}

      {isBlockModalOpen && (
        <CreateBlockModal
          isOpen={isBlockModalOpen}
          onClose={() => setIsBlockModalOpen(false)}
        />
      )}

      {isBookingFormOpen && (
        <BookingForm
          booking={prefilledBooking}
          cabins={accommodations as unknown as Cabin[]}
          onClose={() => {
            setIsBookingFormOpen(false);
            setPrefilledBooking(null);
          }}
          onSubmit={handleBookingFormSubmit}
        />
      )}
    </div>
  );
};

export const TimelineCalendar: React.FC = () => {
  return (
    <BackofficeCalendarProvider>
      <InnerTimelineCalendar />
    </BackofficeCalendarProvider>
  );
};

export default TimelineCalendar;
