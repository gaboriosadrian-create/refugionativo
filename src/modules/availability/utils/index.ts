/**
 * Formats a Date object to YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets today's date formatted as YYYY-MM-DD.
 */
export function getTodayDateStr(): string {
  return formatDate(new Date());
}

/**
 * Returns an array of YYYY-MM-DD date strings from start to end (inclusive).
 */
export function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  // Clone start date to iterate
  const current = new Date(start);
  
  // Safety cap to prevent infinite loop
  let iterations = 0;
  const maxIterations = 366 * 2; // Limit range to 2 years

  while (current <= end && iterations < maxIterations) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
    iterations++;
  }

  return dates;
}

/**
 * Calculates the number of days between two date strings (inclusive).
 */
export function getDaysDiff(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Add days to a formatted date string.
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}
