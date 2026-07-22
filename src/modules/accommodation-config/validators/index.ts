import { AccommodationType, Amenity, CustomFieldConfig, AccommodationPolicies, CapacityOptions } from '../types';

export class ConfigValidationError extends Error {
  constructor(public message: string, public field?: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export function validateAccommodationType(type: AccommodationType, existingTypes: AccommodationType[]): void {
  if (!type.id || type.id.trim() === '') {
    throw new ConfigValidationError('El ID único es obligatorio', 'id');
  }
  if (!type.displayName || type.displayName.trim() === '') {
    throw new ConfigValidationError('El nombre visible es obligatorio', 'displayName');
  }
  
  // Check duplicates
  const isDuplicateId = existingTypes.some(t => t.id === type.id);
  if (isDuplicateId) {
    throw new ConfigValidationError(`Ya existe un tipo de alojamiento con el ID "${type.id}"`, 'id');
  }

  const isDuplicateName = existingTypes.some(t => t.displayName.toLowerCase() === type.displayName.toLowerCase());
  if (isDuplicateName) {
    throw new ConfigValidationError(`Ya existe un tipo de alojamiento con el nombre "${type.displayName}"`, 'displayName');
  }
}

export function validateAmenity(amenity: Amenity, existingAmenities: Amenity[]): void {
  if (!amenity.id || amenity.id.trim() === '') {
    throw new ConfigValidationError('El ID único es obligatorio', 'id');
  }
  if (!amenity.name || amenity.name.trim() === '') {
    throw new ConfigValidationError('El nombre es obligatorio', 'name');
  }

  const isDuplicateId = existingAmenities.some(a => a.id === amenity.id);
  if (isDuplicateId) {
    throw new ConfigValidationError(`Ya existe un amenity con el ID "${amenity.id}"`, 'id');
  }

  const isDuplicateName = existingAmenities.some(a => a.name.toLowerCase() === amenity.name.toLowerCase());
  if (isDuplicateName) {
    throw new ConfigValidationError(`Ya existe un amenity con el nombre "${amenity.name}"`, 'name');
  }
}

export function validateCustomField(field: CustomFieldConfig, existingFields: CustomFieldConfig[]): void {
  if (!field.key || field.key.trim() === '') {
    throw new ConfigValidationError('La clave (key) es obligatoria', 'key');
  }
  if (!field.label || field.label.trim() === '') {
    throw new ConfigValidationError('La etiqueta (label) es obligatoria', 'label');
  }

  const isValidKey = /^[a-z0-9_]+$/.test(field.key);
  if (!isValidKey) {
    throw new ConfigValidationError('La clave debe contener solo letras minúsculas, números y guiones bajos', 'key');
  }

  const isDuplicateKey = existingFields.some(f => f.key === field.key);
  if (isDuplicateKey) {
    throw new ConfigValidationError(`Ya existe un campo personalizado con la clave "${field.key}"`, 'key');
  }
}

export function validatePolicies(policies: AccommodationPolicies): void {
  if (!policies.checkInTime || !/^\d{2}:\d{2}$/.test(policies.checkInTime)) {
    throw new ConfigValidationError('El formato de hora de Check-in debe ser HH:MM', 'checkInTime');
  }
  if (!policies.checkOutTime || !/^\d{2}:\d{2}$/.test(policies.checkOutTime)) {
    throw new ConfigValidationError('El formato de hora de Check-out debe ser HH:MM', 'checkOutTime');
  }
  if (!policies.cancellationPolicy || policies.cancellationPolicy.trim() === '') {
    throw new ConfigValidationError('La política de cancelación es obligatoria', 'cancellationPolicy');
  }
}

export function validateCapacityOptions(options: CapacityOptions): void {
  if (options.maxGuestsLimit <= 0) {
    throw new ConfigValidationError('El límite máximo de huéspedes debe ser mayor que cero', 'maxGuestsLimit');
  }
}
