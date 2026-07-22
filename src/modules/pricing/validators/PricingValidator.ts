import { 
  Season, 
  RatePlan, 
  PriceRule, 
  MinimumStayRule,
  Promotion,
  Tax,
  WeeklyRateConfig,
  OccupancyRule
} from '../types';

export class PricingValidator {
  /**
   * Validates if a season overlaps in dates with any existing season.
   * Returns a list of error messages.
   */
  public static validateSeason(
    newSeason: Partial<Season>,
    existingSeasons: Season[]
  ): string[] {
    const errors: string[] = [];

    if (!newSeason.name || newSeason.name.trim() === '') {
      errors.push('El nombre de la temporada es obligatorio.');
    }

    if (!newSeason.startDate || !newSeason.endDate) {
      errors.push('Las fechas de inicio y fin son obligatorias.');
      return errors;
    }

    const start = new Date(newSeason.startDate + 'T12:00:00');
    const end = new Date(newSeason.endDate + 'T12:00:00');

    if (start > end) {
      errors.push('La fecha de inicio no puede ser posterior a la fecha de fin.');
    }

    // Check overlaps with active seasons of same or overlapping priorities
    const otherSeasons = existingSeasons.filter(
      s => s.id !== newSeason.id && s.status === 'active'
    );

    for (const season of otherSeasons) {
      const sStart = new Date(season.startDate + 'T12:00:00');
      const sEnd = new Date(season.endDate + 'T12:00:00');

      // Check date range intersection
      const overlaps = start <= sEnd && end >= sStart;

      if (overlaps) {
        // If priorities are identical, we should avoid ambiguity
        if (season.priority === (newSeason.priority || 0)) {
          errors.push(
            `Conflicto de fechas: Se superpone con "${season.name}" (${season.startDate} al ${season.endDate}) con idéntica prioridad (${season.priority}). Cambia las fechas o ajusta la prioridad para desempatar.`
          );
        }
      }
    }

    return errors;
  }

  /**
   * Validates a RatePlan configuration.
   */
  public static validateRatePlan(
    newPlan: Partial<RatePlan>,
    existingPlans: RatePlan[]
  ): string[] {
    const errors: string[] = [];

    if (!newPlan.name || newPlan.name.trim() === '') {
      errors.push('El nombre del plan tarifario es obligatorio.');
    }

    const nameLower = (newPlan.name || '').trim().toLowerCase();
    const isDuplicate = existingPlans.some(
      p => p.id !== newPlan.id && p.name.trim().toLowerCase() === nameLower
    );

    if (isDuplicate) {
      errors.push(`Ya existe un plan de tarifas registrado con el nombre "${newPlan.name}".`);
    }

    return errors;
  }

  /**
   * Validates a PriceRule configuration to prevent negative prices, bad percentages, etc.
   */
  public static validatePriceRule(rule: Partial<PriceRule>): string[] {
    const errors: string[] = [];

    if (rule.value === undefined || rule.value === null) {
      errors.push('El valor de la regla es obligatorio.');
      return errors;
    }

    if (rule.value < 0) {
      errors.push('El valor de la regla no puede ser negativo.');
    }

    if (rule.type === 'discount_percent' || rule.type === 'surcharge_percent') {
      if (rule.value > 100) {
        errors.push('El porcentaje de descuento o recargo no puede exceder el 100%.');
      }
    }

    if (rule.type === 'additional_guest') {
      if (rule.appliesToGuestsFrom === undefined || rule.appliesToGuestsFrom < 1) {
        errors.push('Debes especificar un umbral de huéspedes válido para el cargo adicional (mínimo 1).');
      }
    }

    return errors;
  }

  /**
   * Validates a MinimumStayRule configuration.
   */
  public static validateMinimumStayRule(rule: Partial<MinimumStayRule>): string[] {
    const errors: string[] = [];

    if (rule.minNights === undefined || rule.minNights < 1) {
      errors.push('La estadía mínima debe ser al menos de 1 noche.');
    }

    return errors;
  }

  /**
   * Validates a Promotion configuration.
   */
  public static validatePromotion(promo: Partial<Promotion>, existingPromos: Promotion[]): string[] {
    const errors: string[] = [];

    if (!promo.name || promo.name.trim() === '') {
      errors.push('El nombre de la promoción es obligatorio.');
    }

    if (promo.value === undefined || promo.value <= 0) {
      errors.push('El valor de la promoción debe ser mayor que cero.');
    }

    if (promo.minNightsRequired === undefined || promo.minNightsRequired < 1) {
      errors.push('La estancia mínima para aplicar debe ser de al menos 1 noche.');
    }

    if (promo.startDate && promo.endDate) {
      const start = new Date(promo.startDate + 'T12:00:00');
      const end = new Date(promo.endDate + 'T12:00:00');
      if (start > end) {
        errors.push('La fecha de inicio de la promoción no puede ser posterior a la fecha de fin.');
      }
    }

    // Check code uniqueness
    if (promo.promoCode && promo.promoCode.trim() !== '') {
      const codeUpper = promo.promoCode.trim().toUpperCase();
      const duplicateCode = existingPromos.some(
        p => p.id !== promo.id && p.status === 'active' && p.promoCode && p.promoCode.trim().toUpperCase() === codeUpper
      );
      if (duplicateCode) {
        errors.push(`El código promocional "${promo.promoCode}" ya está activo en otra promoción.`);
      }
    }

    return errors;
  }

  /**
   * Validates a Tax configuration.
   */
  public static validateTax(tax: Partial<Tax>, existingTaxes: Tax[]): string[] {
    const errors: string[] = [];

    if (!tax.name || tax.name.trim() === '') {
      errors.push('El nombre del impuesto es obligatorio.');
    }

    if (tax.rate === undefined || tax.rate < 0) {
      errors.push('La tasa del impuesto no puede ser negativa.');
    }

    if (!tax.country || tax.country.trim() === '') {
      errors.push('El código de país es obligatorio para preparar la localización.');
    }

    // Check for duplicate country + name
    const nameLower = (tax.name || '').trim().toLowerCase();
    const countryLower = (tax.country || '').trim().toLowerCase();
    const duplicate = existingTaxes.some(
      t => t.id !== tax.id && t.isActive && t.name.trim().toLowerCase() === nameLower && t.country.trim().toLowerCase() === countryLower
    );

    if (duplicate) {
      errors.push(`Ya existe un impuesto activo registrado con el nombre "${tax.name}" para el país "${tax.country.toUpperCase()}".`);
    }

    return errors;
  }

  /**
   * Validates a Weekly Rate configuration.
   */
  public static validateWeeklyRate(config: Partial<WeeklyRateConfig>): string[] {
    const errors: string[] = [];

    if (!config.rates) {
      errors.push('La configuración de tarifas por día de la semana es obligatoria.');
      return errors;
    }

    const days = [0, 1, 2, 3, 4, 5, 6];
    for (const d of days) {
      const val = config.rates[d as any];
      if (val === undefined || val === null) {
        errors.push(`Falta configurar el valor para el día de la semana #${d}.`);
      } else if (val < 0) {
        errors.push(`La tarifa para el día de la semana #${d} no puede ser negativa.`);
      }
    }

    return errors;
  }

  /**
   * Validates an OccupancyRule configuration.
   */
  public static validateOccupancyRule(rule: Partial<OccupancyRule>): string[] {
    const errors: string[] = [];

    if (rule.minOccupancy === undefined || rule.minOccupancy < 1) {
      errors.push('La ocupación mínima debe ser al menos de 1 huésped.');
    }

    if (rule.maxOccupancy === undefined || rule.maxOccupancy < 1) {
      errors.push('La ocupación máxima debe ser al menos de 1 huésped.');
    }

    if (rule.minOccupancy !== undefined && rule.maxOccupancy !== undefined && rule.minOccupancy > rule.maxOccupancy) {
      errors.push('La ocupación mínima no puede superar la ocupación máxima.');
    }

    if (rule.basePriceForMinOccupancy === undefined || rule.basePriceForMinOccupancy < 0) {
      errors.push('La tarifa base para ocupación mínima no puede ser negativa.');
    }

    if (rule.extraGuestFee === undefined || rule.extraGuestFee < 0) {
      errors.push('El costo por huésped adicional no puede ser negativo.');
    }

    return errors;
  }

  /**
   * Validates check-in and check-out dates.
   */
  public static validateStayDates(checkIn: string, checkOut: string): string[] {
    const errors: string[] = [];

    if (!checkIn || !checkOut) {
      errors.push('Las fechas de check-in y check-out son requeridas.');
      return errors;
    }

    const start = new Date(checkIn + 'T12:00:00');
    const end = new Date(checkOut + 'T12:00:00');

    if (isNaN(start.getTime())) {
      errors.push('La fecha de check-in tiene un formato inválido.');
    }
    if (isNaN(end.getTime())) {
      errors.push('La fecha de check-out tiene un formato inválido.');
    }

    if (start >= end) {
      errors.push('La fecha de check-in debe ser estrictamente anterior a la fecha de check-out (al menos 1 noche).');
    }

    return errors;
  }
}
