export function calculateNightsCount(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn + 'T12:00:00');
  const end = new Date(checkOut + 'T12:00:00');
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

export function formatGuestsText(adults: number, children: number, babies: number, pets: number): string {
  const parts: string[] = [];
  const totalGuests = adults + children;
  
  if (totalGuests === 1) {
    parts.push('1 huésped');
  } else if (totalGuests > 1) {
    parts.push(`${totalGuests} huéspedes`);
  }

  if (babies === 1) {
    parts.push('1 bebé');
  } else if (babies > 1) {
    parts.push(`${babies} bebés`);
  }

  if (pets === 1) {
    parts.push('1 mascota');
  } else if (pets > 1) {
    parts.push(`${pets} mascotas`);
  }

  return parts.join(', ');
}

export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTomorrowDateString(from?: string): string {
  const baseDate = from ? new Date(from + 'T12:00:00') : new Date();
  const d = new Date(baseDate.getTime() + 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
