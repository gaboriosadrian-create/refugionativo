import { Logger } from '../../../core/logger/Logger';

/**
 * Validates if a string is a valid ISO Date string (YYYY-MM-DD).
 */
export function validateDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validates a start and end date range.
 * Throws an error if any date is invalid or if the range is inverted.
 */
export function validateDateRange(startDateStr: string, endDateStr: string): void {
  if (!validateDateString(startDateStr)) {
    throw new Error(`Fecha de inicio inválida: ${startDateStr}`);
  }
  if (!validateDateString(endDateStr)) {
    throw new Error(`Fecha de fin inválida: ${endDateStr}`);
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (start > end) {
    throw new Error(`El rango de fechas está invertido: la fecha de inicio ${startDateStr} es posterior a la fecha de fin ${endDateStr}`);
  }
}

/**
 * Verifies if there are any date range overlaps/conflicts.
 * Returns true if a conflict is found.
 */
export function hasOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 <= end2 && start2 <= end1;
}

/**
 * Validates if a target range conflicts with any existing ranges of the same accommodation.
 * Throws an error if there is a conflict.
 */
export function validateConflict(
  accommodationId: string | number,
  startDate: string,
  endDate: string,
  existingPeriods: { id?: string; startDate: string; endDate: string }[],
  ignoreId?: string
): void {
  validateDateRange(startDate, endDate);

  for (const period of existingPeriods) {
    if (ignoreId && period.id === ignoreId) {
      continue;
    }
    if (hasOverlap(startDate, endDate, period.startDate, period.endDate)) {
      Logger.warn(`Conflicto de disponibilidad detectado para el alojamiento ${accommodationId} entre ${startDate}/${endDate} y ${period.startDate}/${period.endDate}`);
      throw new Error(`Conflicto detectado: Las fechas seleccionadas (${startDate} a ${endDate}) se superponen con un bloqueo o periodo de mantenimiento existente (${period.startDate} a ${period.endDate}).`);
    }
  }
}
