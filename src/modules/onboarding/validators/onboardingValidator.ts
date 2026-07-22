import { 
  OnboardingStep1Data, 
  OnboardingStep2Data, 
  OnboardingStep3Data, 
  OnboardingStep4Data, 
  OnboardingStep5Data, 
  StepValidationResult 
} from '../types';

export class OnboardingValidator {
  public static validateStep1(data?: OnboardingStep1Data): StepValidationResult {
    const errors: string[] = [];
    if (!data) {
      return { isValid: false, errors: ['No se enviaron datos para el Paso 1.'] };
    }

    if (!data.name || !data.name.trim()) {
      errors.push('El nombre comercial del complejo es obligatorio.');
    }
    if (!data.description || !data.description.trim()) {
      errors.push('La descripción física o comercial es obligatoria.');
    }
    if (!data.currency || !data.currency.trim()) {
      errors.push('La moneda de cobro es obligatoria.');
    }
    if (!data.timezone || !data.timezone.trim()) {
      errors.push('La zona horaria es obligatoria.');
    }
    if (!data.language || !data.language.trim()) {
      errors.push('El idioma principal es obligatorio.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static validateStep2(data?: OnboardingStep2Data): StepValidationResult {
    const errors: string[] = [];
    if (!data) {
      return { isValid: false, errors: ['No se enviaron datos para el Paso 2.'] };
    }

    if (!data.email || !data.email.trim()) {
      errors.push('El email de contacto es obligatorio.');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.push('El formato del email de contacto no es válido.');
      }
    }

    if (!data.phone || !data.phone.trim()) {
      errors.push('El teléfono de contacto es obligatorio.');
    }

    if (!data.address || !data.address.trim()) {
      errors.push('La dirección física del complejo es obligatoria.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static validateStep3(data?: OnboardingStep3Data): StepValidationResult {
    const errors: string[] = [];
    if (!data) {
      return { isValid: false, errors: ['No se enviaron datos para el Paso 3.'] };
    }

    if (!data.name || !data.name.trim()) {
      errors.push('El nombre del alojamiento es obligatorio.');
    }
    if (!data.type || !data.type.trim()) {
      errors.push('El tipo de alojamiento es obligatorio.');
    }
    if (data.capacity === undefined || data.capacity <= 0) {
      errors.push('La capacidad de huéspedes debe ser mayor a 0.');
    }
    if (data.price === undefined || data.price <= 0) {
      errors.push('El precio base por noche debe ser mayor a 0.');
    }
    if (!data.description || !data.description.trim()) {
      errors.push('La descripción del alojamiento es obligatoria.');
    }
    if (!data.image || !data.image.trim()) {
      errors.push('La imagen de portada del alojamiento es obligatoria.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static validateStep4(data?: OnboardingStep4Data): StepValidationResult {
    const errors: string[] = [];
    if (!data) {
      return { isValid: false, errors: ['No se enviaron datos para el Paso 4.'] };
    }

    if (data.basePrice === undefined || data.basePrice <= 0) {
      errors.push('El precio de tarifa base debe ser mayor a 0.');
    }
    if (data.minStay === undefined || data.minStay <= 0) {
      errors.push('La estadía mínima de noches debe ser mayor a 0.');
    }
    if (!data.cancellationPolicy || !data.cancellationPolicy.trim()) {
      errors.push('La política de cancelación es obligatoria.');
    }
    if (!data.checkInTime || !data.checkInTime.trim()) {
      errors.push('La hora de Check-in es obligatoria.');
    }
    if (!data.checkOutTime || !data.checkOutTime.trim()) {
      errors.push('La hora de Check-out es obligatoria.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static validateStep5(data?: OnboardingStep5Data): StepValidationResult {
    const errors: string[] = [];
    if (!data) {
      return { isValid: false, errors: ['No se enviaron datos para el Paso 5.'] };
    }

    if (!data.title || !data.title.trim()) {
      errors.push('El título de bienvenida del sitio web es obligatorio.');
    }
    if (!data.subtitle || !data.subtitle.trim()) {
      errors.push('El subtítulo o descripción del sitio web es obligatorio.');
    }
    if (!data.heroImage || !data.heroImage.trim()) {
      errors.push('La imagen hero de portada del sitio web es obligatoria.');
    }
    if (!data.ctaText || !data.ctaText.trim()) {
      errors.push('El texto del botón de llamada a la acción es obligatorio.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
export default OnboardingValidator;
