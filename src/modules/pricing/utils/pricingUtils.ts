export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn + 'T12:00:00');
  const end = new Date(checkOut + 'T12:00:00');
  const diffTime = end.getTime() - start.getTime();
  if (diffTime <= 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDatesInRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const start = new Date(checkIn + 'T12:00:00');
  const end = new Date(checkOut + 'T12:00:00');
  
  const current = new Date(start);
  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function isDateInSeason(dateStr: string, startStr: string, endStr: string): boolean {
  const date = new Date(dateStr + 'T12:00:00');
  const start = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');
  return date >= start && date <= end;
}

export function getDayOfWeek(dateStr: string): number {
  // 0 is Sunday, 1 is Monday, etc.
  const date = new Date(dateStr + 'T12:00:00');
  return date.getDay();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
