/**
 * Formats a Date object to YYYY-MM-DD string using local timezone.
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns an array of Date objects representing all days in the specified month.
 * Month is 0-indexed (0 = January, 11 = December).
 */
export function getDaysInMonthList(year: number, month: number): Date[] {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

/**
 * Returns an array of 7 Date objects representing the week starting on startOfWeekDate.
 */
export function getDaysInWeekList(startOfWeekDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(startOfWeekDate);
  // Get Monday of that week
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(start.setDate(diff));

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    days.push(current);
  }
  return days;
}

/**
 * Adds or subtracts days from a Date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculates the number of nights between two dates.
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn + 'T12:00:00');
  const end = new Date(checkOut + 'T12:00:00');
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Checks if two date ranges overlap.
 */
export function isOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Generates an array of YYYY-MM-DD date strings within a range (inclusive start, exclusive end).
 */
export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  const current = new Date(start);

  while (current < end) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Safe parser from date string to Date object.
 */
export function parseDateISO(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00');
}
