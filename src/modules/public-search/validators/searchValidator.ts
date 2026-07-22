import { SearchCriteria } from '../types';

export interface ValidationError {
  field: keyof SearchCriteria | 'dates' | 'general';
  message: string;
}

export function validateSearchCriteria(criteria: SearchCriteria): ValidationError[] {
  const errors: ValidationError[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  if (!criteria.checkIn) {
    errors.push({ field: 'checkIn', message: 'La fecha de llegada es obligatoria.' });
  } else if (criteria.checkIn < todayStr) {
    errors.push({ field: 'checkIn', message: 'La fecha de llegada no puede ser anterior a hoy.' });
  }

  if (!criteria.checkOut) {
    errors.push({ field: 'checkOut', message: 'La fecha de salida es obligatoria.' });
  }

  if (criteria.checkIn && criteria.checkOut) {
    if (criteria.checkIn >= criteria.checkOut) {
      errors.push({ field: 'dates', message: 'La fecha de salida debe ser posterior a la fecha de llegada.' });
    }
  }

  if (criteria.adults < 1) {
    errors.push({ field: 'adults', message: 'Debe haber al menos 1 adulto.' });
  }

  if (criteria.adults < 0) {
    errors.push({ field: 'adults', message: 'La cantidad de adultos no puede ser negativa.' });
  }
  if (criteria.children < 0) {
    errors.push({ field: 'children', message: 'La cantidad de niños no puede ser negativa.' });
  }
  if (criteria.babies < 0) {
    errors.push({ field: 'babies', message: 'La cantidad de bebés no puede ser negativa.' });
  }
  if (criteria.pets < 0) {
    errors.push({ field: 'pets', message: 'La cantidad de mascotas no puede ser negativa.' });
  }

  return errors;
}
