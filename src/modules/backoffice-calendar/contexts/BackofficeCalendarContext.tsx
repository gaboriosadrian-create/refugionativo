import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useResort } from '../../../shared/contexts/ResortContext';
import { AccommodationService } from '../../accommodations/services/AccommodationService';
import { BookingService } from '../../bookings/services/BookingService';
import { AvailabilityService } from '../../availability/services/AvailabilityService';
import { Accommodation } from '../../accommodations/types';
import { Booking } from '../../../types';
import { Availability, AvailabilityStatus } from '../../availability/types';
import {
  CalendarViewType,
  CalendarEvent,
  CalendarFilterState,
  DEFAULT_CALENDAR_COLORS,
  CalendarColorConfig
} from '../types';
import {
  formatDateISO,
  getDaysInMonthList,
  getDaysInWeekList,
  addDays,
  parseDateISO,
  calculateNights
} from '../utils/dateUtils';
import { Logger } from '../../../core/logger/Logger';

interface BackofficeCalendarContextProps {
  // Navigation
  viewType: CalendarViewType;
  setViewType: (type: CalendarViewType) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  daysList: Date[];
  nextPeriod: () => void;
  prevPeriod: () => void;
  goToToday: () => void;
  jumpToMonthYear: (month: number, year: number) => void;

  // Data
  loading: boolean;
  accommodations: Accommodation[];        // All accommodations
  filteredAccommodations: Accommodation[]; // Accommodations after filters are applied
  rawBookings: Booking[];
  eventsByAccommodation: Record<string | number, CalendarEvent[]>;

  // Selection & Forms
  selectedAccommodationId: string | number | null;
  selectedStartDate: string | null;
  selectedEndDate: string | null;
  selectRange: (accommodationId: string | number, startDate: string, endDate: string) => void;
  clearRangeSelection: () => void;

  // Filters
  filters: CalendarFilterState;
  updateFilters: (filters: Partial<CalendarFilterState>) => void;
  resetFilters: () => void;

  // Theme Colors
  colors: CalendarColorConfig;

  // Actions
  refreshData: () => Promise<void>;
  createBlock: (reason: string, notes?: string, isMaintenance?: boolean) => Promise<void>;
  deleteBlock: (accommodationId: string | number, startDate: string, endDate: string) => Promise<void>;
}

const BackofficeCalendarContext = createContext<BackofficeCalendarContextProps | undefined>(undefined);

export const BackofficeCalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resort } = useResort();

  // Navigation State
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });

  // Selection Range State
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<string | number | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<CalendarFilterState>({
    typeId: 'all',
    status: 'all',
    visible: 'all',
    search: ''
  });

  // Raw fetched data
  const [loading, setLoading] = useState(false);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [rawBookings, setRawBookings] = useState<Booking[]>([]);
  const [availabilitiesByAccommodation, setAvailabilitiesByAccommodation] = useState<Record<string | number, Availability[]>>({});

  // Memoized days list based on current Date and view Type
  const daysList = useMemo(() => {
    if (viewType === 'month') {
      return getDaysInMonthList(currentDate.getFullYear(), currentDate.getMonth());
    } else if (viewType === 'week') {
      return getDaysInWeekList(currentDate);
    } else {
      // 'day' view
      return [currentDate];
    }
  }, [currentDate, viewType]);

  // Determine date ranges for fetching overrides
  const rangeBoundaries = useMemo(() => {
    if (daysList.length === 0) return { start: '', end: '' };
    const start = formatDateISO(daysList[0]);
    const end = formatDateISO(daysList[daysList.length - 1]);
    return { start, end };
  }, [daysList]);

  // 1. Fetch data from services (exclusive domain services access)
  const loadData = useCallback(async () => {
    if (!resort) return;
    setLoading(true);
    try {
      const { start, end } = rangeBoundaries;
      if (!start || !end) return;

      Logger.info(`BackofficeCalendarContext - Loading calendar range: ${start} to ${end}`);

      // Fetch accommodations and bookings in parallel
      const [accsList, bookingsList] = await Promise.all([
        AccommodationService.getAccommodations(resort.id),
        BookingService.getBookings(resort.id)
      ]);

      setAccommodations(accsList);
      setRawBookings(bookingsList);

      // Fetch availability overrides for each accommodation for the given range
      const availMap: Record<string | number, Availability[]> = {};
      const overridePromises = accsList.map(async (acc) => {
        try {
          const overrides = await AvailabilityService.getRangeAvailability(resort.id, acc.id, start, end);
          availMap[acc.id] = overrides;
        } catch (err) {
          Logger.error(`Error loading availability for accommodation ${acc.id}:`, err);
          availMap[acc.id] = [];
        }
      });

      await Promise.all(overridePromises);
      setAvailabilitiesByAccommodation(availMap);

    } catch (error) {
      Logger.error('BackofficeCalendarContext - Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [resort, rangeBoundaries]);

  // Reload data when range or resort changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Navigation Actions
  const nextPeriod = () => {
    setCurrentDate((prev) => {
      if (viewType === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      } else if (viewType === 'week') {
        return addDays(prev, 7);
      } else {
        return addDays(prev, 1);
      }
    });
    clearRangeSelection();
  };

  const prevPeriod = () => {
    setCurrentDate((prev) => {
      if (viewType === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      } else if (viewType === 'week') {
        return addDays(prev, -7);
      } else {
        return addDays(prev, -1);
      }
    });
    clearRangeSelection();
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    clearRangeSelection();
  };

  const jumpToMonthYear = (month: number, year: number) => {
    setCurrentDate(new Date(year, month, 1));
    clearRangeSelection();
  };

  // 3. Selection Range actions
  const selectRange = (accommodationId: string | number, startDate: string, endDate: string) => {
    setSelectedAccommodationId(accommodationId);
    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
  };

  const clearRangeSelection = () => {
    setSelectedAccommodationId(null);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
  };

  // 4. Filters logic
  const updateFilters = (newFilters: Partial<CalendarFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      typeId: 'all',
      status: 'all',
      visible: 'all',
      search: ''
    });
  };

  // Memoized and filtered accommodations list
  const filteredAccommodations = useMemo(() => {
    let result = [...accommodations];

    // Search filter
    if (filters.search.trim()) {
      const s = filters.search.toLowerCase().trim();
      result = result.filter((acc) => acc.name.toLowerCase().includes(s));
    }

    // Type filter
    if (filters.typeId !== 'all') {
      result = result.filter((acc) => acc.typeId === filters.typeId);
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter((acc) => acc.status === filters.status);
    }

    // Visibility filter
    if (filters.visible !== 'all') {
      const isVisible = filters.visible === 'yes';
      result = result.filter((acc) => acc.visible === isVisible);
    }

    return result;
  }, [accommodations, filters]);

  // Helper to group adjacent daily overrides into long calendar blocks
  const groupContiguousBlocks = useCallback((accId: string | number, overrides: Availability[]): CalendarEvent[] => {
    const nonAvailable = overrides.filter(a => a.status !== AvailabilityStatus.AVAILABLE && a.status !== AvailabilityStatus.RESERVED);
    if (nonAvailable.length === 0) return [];

    // Sort ascending by date string
    const sorted = [...nonAvailable].sort((a, b) => a.date.localeCompare(b.date));
    const events: CalendarEvent[] = [];

    let currentBlock: {
      startDate: string;
      endDate: string;
      status: 'blocked' | 'maintenance';
      reason: string;
      notes?: string;
      raws: Availability[];
    } | null = null;

    for (const item of sorted) {
      const statusMapped = item.status === AvailabilityStatus.MAINTENANCE ? 'maintenance' : 'blocked';

      if (!currentBlock) {
        currentBlock = {
          startDate: item.date,
          endDate: item.date,
          status: statusMapped,
          reason: item.reason,
          notes: item.notes,
          raws: [item]
        };
      } else {
        // Check if contiguous (exactly 1 day of difference) & same block type and reason
        const prev = parseDateISO(currentBlock.endDate);
        const curr = parseDateISO(item.date);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1 && currentBlock.status === statusMapped && currentBlock.reason === item.reason) {
          currentBlock.endDate = item.date;
          currentBlock.raws.push(item);
        } else {
          // Push previous completed block
          events.push({
            id: `block_${accId}_${currentBlock.startDate}_${currentBlock.endDate}`,
            type: currentBlock.status === 'maintenance' ? 'maintenance' : 'block',
            title: currentBlock.reason || (currentBlock.status === 'maintenance' ? 'Mantenimiento' : 'Bloqueado'),
            startDate: currentBlock.startDate,
            // exclusive end date for visual drawing
            endDate: formatDateISO(addDays(parseDateISO(currentBlock.endDate), 1)),
            status: currentBlock.status === 'maintenance' ? 'maintenance' : 'blocked',
            nights: currentBlock.raws.length,
            notes: currentBlock.notes,
            raw: currentBlock.raws[0]
          });

          currentBlock = {
            startDate: item.date,
            endDate: item.date,
            status: statusMapped,
            reason: item.reason,
            notes: item.notes,
            raws: [item]
          };
        }
      }
    }

    if (currentBlock) {
      events.push({
        id: `block_${accId}_${currentBlock.startDate}_${currentBlock.endDate}`,
        type: currentBlock.status === 'maintenance' ? 'maintenance' : 'block',
        title: currentBlock.reason || (currentBlock.status === 'maintenance' ? 'Mantenimiento' : 'Bloqueado'),
        startDate: currentBlock.startDate,
        endDate: formatDateISO(addDays(parseDateISO(currentBlock.endDate), 1)),
        status: currentBlock.status === 'maintenance' ? 'maintenance' : 'blocked',
        nights: currentBlock.raws.length,
        notes: currentBlock.notes,
        raw: currentBlock.raws[0]
      });
    }

    return events;
  }, []);

  // 5. Compile Bookings and Blocks into Unified Calendar Events per Accommodation
  const eventsByAccommodation = useMemo(() => {
    const result: Record<string | number, CalendarEvent[]> = {};

    accommodations.forEach((acc) => {
      const accEvents: CalendarEvent[] = [];

      // A. Gather Bookings for this accommodation that overlap our viewport
      const bookingsForAcc = rawBookings.filter(
        (b) => Number(b.cabinId) === Number(acc.id) && b.status !== 'cancelled'
      );

      bookingsForAcc.forEach((b) => {
        const nights = calculateNights(b.checkIn, b.checkOut);

        // Check if booking is check-in today or check-out today to mark special statuses
        const todayStr = formatDateISO(new Date());
        let mappedStatus: CalendarEvent['status'] = 'confirmed';
        if (b.status === 'pending' || b.status === 'pending_approval' || b.status === 'no_show') {
          mappedStatus = 'pending';
        } else if (b.status === 'cancelled') {
          mappedStatus = 'cancelled';
        }
        
        let computedStatus: CalendarEvent['status'] = mappedStatus;
        if (b.checkIn === todayStr && (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'in_house')) {
          computedStatus = 'check_in';
        } else if (b.checkOut === todayStr && (b.status === 'confirmed' || b.status === 'checked_out' || b.status === 'completed')) {
          computedStatus = 'check_out';
        }

        accEvents.push({
          id: `booking_${b.id}`,
          type: 'booking',
          title: b.name,
          startDate: b.checkIn,
          endDate: b.checkOut,
          status: computedStatus,
          guests: b.guests,
          nights,
          notes: b.notes,
          raw: b
        });
      });

      // B. Gather Availability Blocks for this accommodation
      const overrides = availabilitiesByAccommodation[acc.id] || [];
      const blocks = groupContiguousBlocks(acc.id, overrides);
      accEvents.push(...blocks);

      result[acc.id] = accEvents;
    });

    return result;
  }, [accommodations, rawBookings, availabilitiesByAccommodation, groupContiguousBlocks]);

  // 6. External Mutation Actions (wrapping AvailabilityService domain methods)
  const createBlock = async (reason: string, notes?: string, isMaintenance?: boolean) => {
    if (!resort || !selectedAccommodationId || !selectedStartDate || !selectedEndDate) {
      throw new Error('Faltan parámetros necesarios para aplicar el bloqueo.');
    }

    const status = isMaintenance ? AvailabilityStatus.MAINTENANCE : AvailabilityStatus.BLOCKED;
    // Note: SelectedEndDate in our UI is standard calendar date selection (exclusive check-out style),
    // but the block API might expect inclusive ranges. Let's make sure we block dates correctly up to endDate - 1.
    const lastBlockDate = formatDateISO(addDays(parseDateISO(selectedEndDate), -1));

    Logger.info(`BackofficeCalendarContext - Applying block: Acc ${selectedAccommodationId}, ${selectedStartDate} to ${lastBlockDate}`);
    
    await AvailabilityService.applyBlock(
      resort.id,
      selectedAccommodationId,
      selectedStartDate,
      lastBlockDate,
      status,
      reason,
      notes,
      'Backoffice-Calendar'
    );

    clearRangeSelection();
    await loadData();
  };

  const deleteBlock = async (accommodationId: string | number, startDate: string, endDate: string) => {
    if (!resort) return;
    // Subtract 1 day from visual exclusive end date to release blocks accurately
    const endInclusive = formatDateISO(addDays(parseDateISO(endDate), -1));

    Logger.info(`BackofficeCalendarContext - Releasing block: Acc ${accommodationId}, ${startDate} to ${endInclusive}`);

    await AvailabilityService.releaseBlock(
      resort.id,
      accommodationId,
      startDate,
      endInclusive
    );

    await loadData();
  };

  return (
    <BackofficeCalendarContext.Provider
      value={{
        viewType,
        setViewType,
        currentDate,
        setCurrentDate,
        daysList,
        nextPeriod,
        prevPeriod,
        goToToday,
        jumpToMonthYear,
        loading,
        accommodations,
        filteredAccommodations,
        rawBookings,
        eventsByAccommodation,
        selectedAccommodationId,
        selectedStartDate,
        selectedEndDate,
        selectRange,
        clearRangeSelection,
        filters,
        updateFilters,
        resetFilters,
        colors: DEFAULT_CALENDAR_COLORS,
        refreshData: loadData,
        createBlock,
        deleteBlock
      }}
    >
      {children}
    </BackofficeCalendarContext.Provider>
  );
};

export const useBackofficeCalendar = () => {
  const context = useContext(BackofficeCalendarContext);
  if (context === undefined) {
    throw new Error('useBackofficeCalendar must be used within a BackofficeCalendarProvider');
  }
  return context;
};
