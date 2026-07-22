import { BookingRequestInput, BookingRequestError } from '../types';

export function validateBookingRequest(input: BookingRequestInput): BookingRequestError {
  const errors: BookingRequestError = {};

  if (!input.firstName || input.firstName.trim().length < 2) {
    errors.firstName = 'El nombre debe tener al menos 2 caracteres.';
  }

  if (!input.lastName || input.lastName.trim().length < 2) {
    errors.lastName = 'El apellido debe tener al menos 2 caracteres.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email)) {
    errors.email = 'Introduce una dirección de correo electrónico válida.';
  }

  if (!input.phone || input.phone.trim().length < 6) {
    errors.phone = 'Introduce un número de teléfono de contacto válido.';
  }

  if (!input.country || input.country.trim().length < 2) {
    errors.country = 'Por favor, selecciona o escribe tu país de origen.';
  }

  if (!input.policyAccepted) {
    errors.policyAccepted = 'Debes leer y aceptar las políticas del complejo y términos de cancelación.';
  }

  return errors;
}
