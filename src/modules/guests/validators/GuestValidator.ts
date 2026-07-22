import { Guest } from '../types';

export class GuestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuestValidationError';
  }
}

export class GuestValidator {
  public static validate(guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!guest.firstName || !guest.firstName.trim()) {
      throw new GuestValidationError('El nombre del huésped es obligatorio.');
    }
    if (!guest.lastName || !guest.lastName.trim()) {
      throw new GuestValidationError('El apellido del huésped es obligatorio.');
    }
    if (!guest.email || !guest.email.trim()) {
      throw new GuestValidationError('El correo electrónico del huésped es obligatorio.');
    }
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guest.email.trim())) {
      throw new GuestValidationError('El correo electrónico proporcionado no tiene un formato válido.');
    }

    if (!guest.documentNumber || !guest.documentNumber.trim()) {
      throw new GuestValidationError('El número de documento del huésped es obligatorio.');
    }
    if (!guest.documentType || !guest.documentType.trim()) {
      throw new GuestValidationError('El tipo de documento es obligatorio.');
    }
    if (!guest.phone || !guest.phone.trim()) {
      throw new GuestValidationError('El teléfono del huésped es obligatorio.');
    }
  }
}
