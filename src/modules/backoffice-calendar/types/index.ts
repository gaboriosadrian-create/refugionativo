import { Booking } from '../../../types';
import { Availability } from '../../availability/types';

export type CalendarViewType = 'month' | 'week' | 'day';

export interface CalendarTheme {
  bg: string;
  text: string;
  border: string;
  badge: string;
}

export interface CalendarColorConfig {
  available: CalendarTheme;
  pending: CalendarTheme;
  confirmed: CalendarTheme;
  checkIn: CalendarTheme;
  checkOut: CalendarTheme;
  cancelled: CalendarTheme;
  maintenance: CalendarTheme;
  bloqueado: CalendarTheme;
}

export type CalendarEventType = 'booking' | 'block' | 'maintenance';

export interface CalendarEvent {
  id: string | number;
  type: CalendarEventType;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'pending' | 'confirmed' | 'cancelled' | 'blocked' | 'maintenance' | 'check_in' | 'check_out';
  guests?: number;
  nights: number;
  notes?: string;
  raw?: Booking | Availability;
}

export interface CalendarFilterState {
  typeId: string; // accommodation type filter (e.g. 'all' or actual id)
  status: string; // accommodation status filter: 'all' | 'available' | 'maintenance' | 'occupied' | 'inactive'
  visible: 'all' | 'yes' | 'no';
  search: string; // accommodation name search
}

export const DEFAULT_CALENDAR_COLORS: CalendarColorConfig = {
  available: {
    bg: 'bg-emerald-50/40 hover:bg-emerald-100/50',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
    badge: 'bg-emerald-100 text-emerald-800'
  },
  pending: {
    bg: 'bg-amber-50/95 hover:bg-amber-100/95',
    text: 'text-amber-800',
    border: 'border-amber-200/80',
    badge: 'bg-amber-100 text-amber-900'
  },
  confirmed: {
    bg: 'bg-forest/10 hover:bg-forest/15',
    text: 'text-forest',
    border: 'border-forest/20',
    badge: 'bg-forest text-white'
  },
  checkIn: {
    bg: 'bg-indigo-50/95 hover:bg-indigo-100/95',
    text: 'text-indigo-800',
    border: 'border-indigo-200/80',
    badge: 'bg-indigo-150 text-indigo-900'
  },
  checkOut: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200/80',
    badge: 'bg-purple-100 text-purple-900'
  },
  cancelled: {
    bg: 'bg-rose-50/90 hover:bg-rose-100/90',
    text: 'text-rose-700',
    border: 'border-rose-100',
    badge: 'bg-rose-100 text-rose-850'
  },
  maintenance: {
    bg: 'bg-orange-50 hover:bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200/80',
    badge: 'bg-orange-100 text-orange-900'
  },
  bloqueado: {
    bg: 'bg-slate-100/90 hover:bg-slate-150/90',
    text: 'text-slate-700',
    border: 'border-slate-300/80',
    badge: 'bg-slate-200 text-slate-800'
  }
};
