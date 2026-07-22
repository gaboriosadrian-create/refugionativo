import seasonRepository from '../repositories/SeasonRepository';
import ratePlanRepository from '../repositories/RatePlanRepository';
import { priceRuleRepository } from '../repositories/PriceRuleRepository';
import minimumStayRuleRepository from '../repositories/MinimumStayRuleRepository';
import promotionRepository from '../repositories/PromotionRepository';
import surchargeRepository from '../repositories/SurchargeRepository';
import taxRepository from '../repositories/TaxRepository';
import weeklyRateRepository from '../repositories/WeeklyRateRepository';
import occupancyRuleRepository from '../repositories/OccupancyRuleRepository';
import { 
  Season, 
  RatePlan, 
  PriceRule, 
  MinimumStayRule, 
  PricingResult, 
  NightlyBreakdownItem,
  PriceRuleType,
  Promotion,
  Surcharge,
  Tax,
  WeeklyRateConfig,
  OccupancyRule
} from '../types';
import { 
  calculateNights, 
  getDatesInRange, 
  isDateInSeason, 
  getDayOfWeek 
} from '../utils/pricingUtils';
import { Logger } from '../../../core/logger/Logger';

export class PricingService {
  /**
   * Seeds default pricing configuration for a resort if none exists.
   */
  public static async seedDefaultPricingIfNeeded(resortId: string): Promise<void> {
    try {
      const existingSeasons = await seasonRepository.getAll(resortId);
      if (existingSeasons.length > 0) {
        return; // Already seeded
      }

      Logger.info(`Seeding default pricing structures for resort ${resortId}`);

      // 1. Seed Seasons
      const defaultSeasons: Season[] = [
        {
          id: `season_baja_${resortId}`,
          resortId,
          name: 'Temporada Baja',
          color: '#3b82f6', // blue
          startDate: '2026-05-01',
          endDate: '2026-06-30',
          priority: 10,
          status: 'active',
          description: 'Meses de otoño e invierno con menor demanda.',
          basePrice: 8000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `season_media_${resortId}`,
          resortId,
          name: 'Temporada Media',
          color: '#f59e0b', // amber
          startDate: '2026-03-01',
          endDate: '2026-04-30',
          priority: 20,
          status: 'active',
          description: 'Meses templados y fines de semana largos ordinarios.',
          basePrice: 12000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `season_alta_${resortId}`,
          resortId,
          name: 'Temporada Alta',
          color: '#ef4444', // red
          startDate: '2026-12-01',
          endDate: '2027-02-28',
          priority: 50,
          status: 'active',
          description: 'Meses de verano de alta concurrencia y vacaciones escolares.',
          basePrice: 18000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `season_festiva_${resortId}`,
          resortId,
          name: 'Fiestas & Eventos',
          color: '#8b5cf6', // purple
          startDate: '2026-12-23',
          endDate: '2027-01-02',
          priority: 100,
          status: 'active',
          description: 'Navidad, Año Nuevo y festividades de alta demanda.',
          basePrice: 24000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const season of defaultSeasons) {
        await seasonRepository.save(resortId, season);
      }

      // 2. Seed Rate Plans
      const ratePlans: RatePlan[] = [
        {
          id: `plan_standard_${resortId}`,
          resortId,
          name: 'Tarifa Estándar',
          description: 'Tarifa base de alojamiento con cancelación flexible.',
          isDefault: true,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `plan_non_refund_${resortId}`,
          resortId,
          name: 'No Reembolsable',
          description: 'Descuento especial por pago anticipado sin derecho a reembolso.',
          isDefault: false,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `plan_long_stay_${resortId}`,
          resortId,
          name: 'Estadía Prolongada',
          description: 'Descuentos progresivos automáticos para estadías largas de más de 7 noches.',
          isDefault: false,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const plan of ratePlans) {
        await ratePlanRepository.save(resortId, plan);
      }

      // 3. Seed Price Rules
      const rules: PriceRule[] = [
        {
          id: `rule_std_baja_discount_${resortId}`,
          resortId,
          ratePlanId: `plan_standard_${resortId}`,
          seasonId: `season_baja_${resortId}`,
          type: 'discount_percent',
          value: 15, // 15% discount in Low Season
          isActive: true,
          description: 'Descuento de Temporada Baja en tarifa estándar.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `rule_std_festiva_surcharge_${resortId}`,
          resortId,
          ratePlanId: `plan_standard_${resortId}`,
          seasonId: `season_festiva_${resortId}`,
          type: 'surcharge_percent',
          value: 25, // 25% surcharge for Holiday Season
          isActive: true,
          description: 'Recargo de Temporada Navideña / Fin de Año.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `rule_nonref_discount_${resortId}`,
          resortId,
          ratePlanId: `plan_non_refund_${resortId}`,
          type: 'discount_percent',
          value: 10, // flat 10% discount
          isActive: true,
          description: 'Descuento permanente del 10% por tarifa no reembolsable.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `rule_long_stay_discount_${resortId}`,
          resortId,
          ratePlanId: `plan_long_stay_${resortId}`,
          type: 'discount_percent',
          value: 20, // 20% discount
          isActive: true,
          description: 'Descuento del 20% para reservas de estadías largas.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const rule of rules) {
        await priceRuleRepository.save(resortId, rule);
      }

      // 4. Seed Minimum Stay Rules
      const minStays: MinimumStayRule[] = [
        {
          id: `minstay_festiva_${resortId}`,
          resortId,
          seasonId: `season_festiva_${resortId}`,
          minNights: 4,
          isActive: true,
          description: 'Mínimo de 4 noches durante las fiestas de Fin de Año.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `minstay_weekend_${resortId}`,
          resortId,
          daysOfWeek: [5, 6], // Friday and Saturday check-ins
          minNights: 2,
          isActive: true,
          description: 'Estancia mínima de 2 noches para check-ins de fin de semana (Vie/Sáb).',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const minStay of minStays) {
        await minimumStayRuleRepository.save(resortId, minStay);
      }

      // 5. Seed Occupancy Rules
      const occRules: OccupancyRule[] = [
        {
          id: `occ_rule_std_${resortId}`,
          resortId,
          ratePlanId: `plan_standard_${resortId}`,
          minOccupancy: 2,
          basePriceForMinOccupancy: 10000,
          extraGuestFee: 1500,
          maxOccupancy: 6,
          childRateMultiplier: 0.5,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const occRule of occRules) {
        await occupancyRuleRepository.save(resortId, occRule);
      }

      // 6. Seed Promotions
      const promotions: Promotion[] = [
        {
          id: `promo_autumn_${resortId}`,
          resortId,
          name: 'Descuento de Otoño',
          description: 'Obtén un 15% de descuento en estadías de 3 noches o más.',
          type: 'percent',
          value: 15,
          minNightsRequired: 3,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `promo_code_stay10_${resortId}`,
          resortId,
          name: 'Bienvenido StayFlow',
          description: 'Código de descuento del 10% para tu primera estadía.',
          type: 'percent',
          value: 10,
          minNightsRequired: 1,
          promoCode: 'STAY10',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `promo_3x2_${resortId}`,
          resortId,
          name: 'Estadía Corta 3x2',
          description: 'Reserva 3 noches y paga solo 2 (una noche gratis).',
          type: 'free_nights',
          value: 1,
          minNightsRequired: 3,
          freeNightsConfig: { multiplier: 3 },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const promo of promotions) {
        await promotionRepository.save(resortId, promo);
      }

      // 7. Seed Surcharges
      const surcharges: Surcharge[] = [
        {
          id: `surcharge_cleaning_${resortId}`,
          resortId,
          name: 'cleaning',
          label: 'Servicio de Limpieza',
          calcType: 'fixed',
          value: 3500,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `surcharge_pet_${resortId}`,
          resortId,
          name: 'pet',
          label: 'Suplemento de Mascota',
          calcType: 'per_night',
          value: 1200,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `surcharge_early_${resortId}`,
          resortId,
          name: 'early_checkin',
          label: 'Check-In Temprano',
          calcType: 'fixed',
          value: 1500,
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `surcharge_late_${resortId}`,
          resortId,
          name: 'late_checkout',
          label: 'Check-Out Tardío',
          calcType: 'fixed',
          value: 1500,
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const surcharge of surcharges) {
        await surchargeRepository.save(resortId, surcharge);
      }

      // 8. Seed Taxes
      const taxes: Tax[] = [
        {
          id: `tax_iva_${resortId}`,
          resortId,
          name: 'IVA Hospedaje',
          rate: 21, // 21%
          type: 'percentage',
          country: 'ES',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `tax_city_${resortId}`,
          resortId,
          name: 'Tasa Ecológica / Turismo',
          rate: 250, // 250 ARS fixed per person
          type: 'fixed_per_person',
          country: 'ES',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const tax of taxes) {
        await taxRepository.save(resortId, tax);
      }

      // 9. Seed Weekly Rate Config (Weekend surcharge: +15% on Friday & Saturday)
      const weeklyConfig: WeeklyRateConfig = {
        id: `weekly_weekend_${resortId}`,
        resortId,
        type: 'percentage',
        rates: {
          1: 0,   // Mon: +0%
          2: 0,   // Tue: +0%
          3: 0,   // Wed: +0%
          4: 0,   // Thu: +0%
          5: 15,  // Fri: +15%
          6: 15,  // Sat: +15%
          0: 0    // Sun: +0%
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await weeklyRateRepository.save(resortId, weeklyConfig);

      Logger.info(`Successfully seeded default pricing setup for resort ${resortId}`);
    } catch (err) {
      Logger.error(`Error seeding default pricing config for resort ${resortId}:`, err);
    }
  }

  /**
   * Resolves the active season for a specific date.
   */
  public static async getSeason(resortId: string, dateStr: string): Promise<Season | null> {
    const seasons = await seasonRepository.getAll(resortId);
    const activeSeasons = seasons.filter(s => s.status === 'active');
    
    // Find matching seasons
    const matching = activeSeasons.filter(s => isDateInSeason(dateStr, s.startDate, s.endDate));
    
    if (matching.length === 0) {
      return null;
    }
    
    // Sort by priority descending (higher priority wins)
    matching.sort((a, b) => b.priority - a.priority);
    return matching[0];
  }

  /**
   * Resolves the applicable rate plan. If none is requested, gets the default plan.
   */
  public static async getApplicableRatePlan(
    resortId: string, 
    cabinId: number, 
    requestedPlanId?: string
  ): Promise<RatePlan | null> {
    const plans = await ratePlanRepository.getAll(resortId);
    const activePlans = plans.filter(p => p.status === 'active');

    if (requestedPlanId) {
      const found = activePlans.find(p => p.id === requestedPlanId);
      if (found) return found;
    }

    // Filter plans that apply to this specific cabin, or apply globally (empty or undefined cabinIds)
    const applicable = activePlans.filter(p => !p.cabinIds || p.cabinIds.length === 0 || p.cabinIds.includes(cabinId));
    
    // Look for default
    const defaultPlan = applicable.find(p => p.isDefault);
    if (defaultPlan) return defaultPlan;

    // Fallback to first available
    return applicable.length > 0 ? applicable[0] : null;
  }

  /**
   * Validates if a stay matches minimum stay requirements.
   * Returns a validation result object.
   */
  public static async validateMinimumStay(
    resortId: string,
    cabinId: number,
    checkIn: string,
    checkOut: string
  ): Promise<{ valid: boolean; minRequired: number; ruleDescription?: string }> {
    const nights = calculateNights(checkIn, checkOut);
    const rules = await minimumStayRuleRepository.getAll(resortId);
    const activeRules = rules.filter(r => r.isActive);

    let maxMinRequired = 1;
    let matchingRuleDescription: string | undefined;

    // Get seasons for each night in range to see if rule season matches
    const dates = getDatesInRange(checkIn, checkOut);
    const seasonIdsInStay = new Set<string>();
    for (const date of dates) {
      const season = await this.getSeason(resortId, date);
      if (season) {
        seasonIdsInStay.add(season.id);
      }
    }

    const checkInDayOfWeek = getDayOfWeek(checkIn);

    for (const rule of activeRules) {
      // 1. Cabin match
      if (rule.cabinId && rule.cabinId !== cabinId) {
        continue;
      }

      // 2. Season match
      if (rule.seasonId && !seasonIdsInStay.has(rule.seasonId)) {
        continue;
      }

      // 3. Day of week match (applied specifically to check-in day)
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0 && !rule.daysOfWeek.includes(checkInDayOfWeek)) {
        continue;
      }

      // Rule matches! Check if it is more restrictive than currently found
      if (rule.minNights > maxMinRequired) {
        maxMinRequired = rule.minNights;
        matchingRuleDescription = rule.description;
      }
    }

    const valid = nights >= maxMinRequired;
    return {
      valid,
      minRequired: maxMinRequired,
      ruleDescription: matchingRuleDescription
    };
  }

  /**
   * REVENUE ENGINE INTERNAL API: obtenerTarifaBase()
   * Calculates the core base price of a night combining season, day of the week and occupancy.
   */
  public static async obtenerTarifaBase(
    resortId: string,
    cabinId: number,
    dateStr: string,
    guests: number,
    ratePlan: RatePlan,
    baseCabinPrice: number,
    explanationList?: string[]
  ): Promise<{ basePrice: number; explanation: string; season?: Season }> {
    const season = await this.getSeason(resortId, dateStr);

    let currentBase = baseCabinPrice;
    let explanation = '';

    // 1. Season base price override
    if (season) {
      if (season.cabinRates && season.cabinRates[String(cabinId)] !== undefined) {
        currentBase = season.cabinRates[String(cabinId)];
        explanation += `Precio base temporada [${season.name}] para alojamiento #${cabinId}: $${currentBase}. `;
      } else if (season.basePrice !== undefined && season.basePrice > 0) {
        currentBase = season.basePrice;
        explanation += `Precio base temporada [${season.name}]: $${currentBase}. `;
      } else {
        explanation += `Precio base estándar de $${currentBase}. `;
      }
    } else {
      explanation += `Precio base estándar de $${currentBase}. `;
    }

    // 2. Occupancy Rules override
    const occupancyRules = await occupancyRuleRepository.getAll(resortId);
    const activeOccRule = occupancyRules.find(r => r.ratePlanId === ratePlan.id && r.isActive);
    if (activeOccRule) {
      if (guests <= activeOccRule.minOccupancy) {
        currentBase = activeOccRule.basePriceForMinOccupancy;
        explanation += `Tarifa ocupación mínima (${activeOccRule.minOccupancy} huéspedes): $${currentBase}. `;
      } else {
        const extraGuests = guests - activeOccRule.minOccupancy;
        const extraFee = extraGuests * activeOccRule.extraGuestFee;
        currentBase = activeOccRule.basePriceForMinOccupancy + extraFee;
        explanation += `Tarifa para ${guests} huéspedes (Base ${activeOccRule.minOccupancy}: $${activeOccRule.basePriceForMinOccupancy} + ${extraGuests} extra x $${activeOccRule.extraGuestFee}): $${currentBase}. `;
      }
    }

    // 3. Day of week rates
    const dayOfWeek = getDayOfWeek(dateStr);
    const weeklyConfigs = await weeklyRateRepository.getAll(resortId);
    const activeWeeklyConfigs = weeklyConfigs.filter(c => c.isActive);

    const matchedConfig = activeWeeklyConfigs.find(c => c.cabinId === cabinId && c.seasonId === season?.id) ||
                         activeWeeklyConfigs.find(c => c.cabinId === cabinId && !c.seasonId) ||
                         activeWeeklyConfigs.find(c => !c.cabinId && c.seasonId === season?.id) ||
                         activeWeeklyConfigs.find(c => !c.cabinId && !c.seasonId);

    if (matchedConfig) {
      const rateModifier = matchedConfig.rates[dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6];
      if (rateModifier !== undefined && rateModifier !== null && rateModifier !== 0) {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = days[dayOfWeek];

        if (matchedConfig.type === 'fixed') {
          currentBase = rateModifier;
          explanation += `Tarifa fija para ${dayName}: $${currentBase}. `;
        } else if (matchedConfig.type === 'multiplier') {
          const old = currentBase;
          currentBase = Math.round(currentBase * rateModifier);
          explanation += `Tarifa de ${dayName} con multiplicador x${rateModifier}: $${old} -> $${currentBase}. `;
        } else if (matchedConfig.type === 'percentage') {
          const old = currentBase;
          const delta = Math.round(currentBase * (rateModifier / 100));
          currentBase += delta;
          explanation += `Recargo de ${dayName} de +${rateModifier}%: $${old} -> $${currentBase}. `;
        }
      }
    }

    if (explanationList) {
      explanationList.push(explanation.trim());
    }

    return {
      basePrice: currentBase,
      explanation: explanation.trim(),
      season: season || undefined
    };
  }

  /**
   * Retrieves the precise cost breakdown for a single night, applying nightly rate plan rules.
   */
  public static async getNightPrice(
    resortId: string,
    cabinId: number,
    dateStr: string,
    guests: number,
    ratePlan: RatePlan,
    baseCabinPrice: number
  ): Promise<{ finalPrice: number; originalBase: number; explanation: string; season?: Season }> {
    const explanationList: string[] = [];
    const { basePrice, season } = await this.obtenerTarifaBase(
      resortId,
      cabinId,
      dateStr,
      guests,
      ratePlan,
      baseCabinPrice,
      explanationList
    );

    // Fetch all rules linked to this rate plan
    const allRules = await priceRuleRepository.getAll(resortId);
    const rules = allRules.filter(r => r.ratePlanId === ratePlan.id && r.isActive);

    // Filter rules applicable to the resolved season
    const applicableRules = rules.filter(r => {
      if (!r.seasonId) return true; // General rule
      return season && r.seasonId === season.id; // Season-specific rule
    });

    let calculatedPrice = basePrice;

    // 1. Base Price Overrides from Rules (if standard price override)
    const basePriceOverride = applicableRules.find(r => r.type === 'base_price');
    if (basePriceOverride) {
      calculatedPrice = basePriceOverride.value;
      explanationList.push(`Regla: Base sobreescrito a $${calculatedPrice} por regla de plan.`);
    }

    // 2. Person Price Rule (replaces base price entirely if exists)
    const personPriceRule = applicableRules.find(r => r.type === 'person_price');
    if (personPriceRule) {
      calculatedPrice = guests * personPriceRule.value;
      explanationList.push(`Regla: Tarifa por persona $${personPriceRule.value} x ${guests} huéspedes = $${calculatedPrice}.`);
    }

    // 3. Additional Guest Fees (if no OccupancyRule is used)
    const occupancyRules = await occupancyRuleRepository.getAll(resortId);
    const hasOccRule = occupancyRules.some(r => r.ratePlanId === ratePlan.id && r.isActive);
    if (!hasOccRule) {
      const additionalGuestRule = applicableRules.find(r => r.type === 'additional_guest');
      if (additionalGuestRule && additionalGuestRule.appliesToGuestsFrom !== undefined) {
        const threshold = additionalGuestRule.appliesToGuestsFrom;
        if (guests >= threshold) {
          const extraGuests = guests - threshold + 1;
          const fee = extraGuests * additionalGuestRule.value;
          calculatedPrice += fee;
          explanationList.push(`Regla: Recargo por ${extraGuests} huésped(es) adicional(es) a partir del #${threshold} (+$${additionalGuestRule.value} c/u) = +$${fee}.`);
        }
      }
    }

    // 4. Surcharge Percentages / Amounts (nightly-level)
    const surchargePercents = applicableRules.filter(r => r.type === 'surcharge_percent');
    for (const rule of surchargePercents) {
      const surcharge = Math.round(calculatedPrice * (rule.value / 100));
      calculatedPrice += surcharge;
      explanationList.push(`Regla: Recargo de ${rule.value}% (${rule.description}) = +$${surcharge}.`);
    }

    const surchargeAmounts = applicableRules.filter(r => r.type === 'surcharge_amount');
    for (const rule of surchargeAmounts) {
      calculatedPrice += rule.value;
      explanationList.push(`Regla: Recargo fijo (${rule.description}) = +$${rule.value}.`);
    }

    // 5. Discount Percentages / Amounts (nightly-level)
    const discountPercents = applicableRules.filter(r => r.type === 'discount_percent');
    for (const rule of discountPercents) {
      const discount = Math.round(calculatedPrice * (rule.value / 100));
      calculatedPrice -= discount;
      explanationList.push(`Regla: Descuento de ${rule.value}% (${rule.description}) = -$${discount}.`);
    }

    const discountAmounts = applicableRules.filter(r => r.type === 'discount_amount');
    for (const rule of discountAmounts) {
      calculatedPrice -= rule.value;
      explanationList.push(`Regla: Descuento fijo (${rule.description}) = -$${rule.value}.`);
    }

    if (calculatedPrice < 0) {
      calculatedPrice = 0;
    }

    const seasonDesc = season ? `Temporada: ${season.name}` : 'Temporada estándar';
    const explanation = `[${seasonDesc}] ` + explanationList.join(' ');

    return {
      finalPrice: calculatedPrice,
      originalBase: basePrice,
      explanation,
      season: season || undefined
    };
  }

  /**
   * REVENUE ENGINE INTERNAL API: obtenerPromociones()
   * Resolves automatically valid promotions and computes their discount value.
   */
  public static async obtenerPromociones(
    resortId: string,
    cabinId: number,
    checkIn: string,
    checkOut: string,
    nights: number,
    nightlyBreakdown: NightlyBreakdownItem[],
    subtotalPrice: number,
    promoCode?: string
  ): Promise<{ appliedPromotions: { promo: Promotion; discount: number }[]; totalDiscount: number }> {
    const promos = await promotionRepository.getAll(resortId);
    const activePromos = promos.filter(p => p.status === 'active');
    
    const appliedPromotions: { promo: Promotion; discount: number }[] = [];
    let totalDiscount = 0;

    for (const promo of activePromos) {
      // 1. Check cabin match
      if (promo.cabinIds && promo.cabinIds.length > 0 && !promo.cabinIds.includes(cabinId)) {
        continue;
      }

      // 2. Check nights minimum
      if (nights < promo.minNightsRequired) {
        continue;
      }

      // 3. Check dates validity
      if (promo.startDate) {
        const checkInDate = new Date(checkIn + 'T12:00:00');
        const promoStart = new Date(promo.startDate + 'T12:00:00');
        if (checkInDate < promoStart) continue;
      }
      if (promo.endDate) {
        const checkInDate = new Date(checkIn + 'T12:00:00');
        const promoEnd = new Date(promo.endDate + 'T12:00:00');
        if (checkInDate > promoEnd) continue;
      }

      // 4. Check promo code
      if (promo.promoCode && promo.promoCode.trim().toUpperCase() !== (promoCode || '').trim().toUpperCase()) {
        continue;
      }

      // 5. Compute discount
      let discountAmount = 0;
      if (promo.type === 'percent') {
        discountAmount = Math.round(subtotalPrice * (promo.value / 100));
      } else if (promo.type === 'fixed') {
        discountAmount = promo.value;
      } else if (promo.type === 'free_nights') {
        // Free night promo (e.g. 3x2: pay for 2, 1 free).
        // Let's sort nightly breakdown from cheapest to most expensive, and make the 'value' cheapest nights free.
        const sortedBreakdown = [...nightlyBreakdown].sort((a, b) => a.finalPrice - b.finalPrice);
        const freeNightsCount = Math.min(promo.value, sortedBreakdown.length);
        for (let i = 0; i < freeNightsCount; i++) {
          discountAmount += sortedBreakdown[i].finalPrice;
        }
      }

      if (discountAmount > 0) {
        appliedPromotions.push({
          promo,
          discount: discountAmount
        });
        totalDiscount += discountAmount;
      }
    }

    return {
      appliedPromotions,
      totalDiscount
    };
  }

  /**
   * REVENUE ENGINE INTERNAL API: calcularRecargos()
   * Computes all applicable surcharges.
   */
  public static async calcularRecargos(
    resortId: string,
    nights: number,
    guests: number,
    petsCount: number,
    nightlySubtotal: number
  ): Promise<{ appliedSurcharges: { surcharge: Surcharge; fee: number }[]; totalSurcharges: number }> {
    const surcharges = await surchargeRepository.getAll(resortId);
    const activeSurcharges = surcharges.filter(s => s.isActive);

    const appliedSurcharges: { surcharge: Surcharge; fee: number }[] = [];
    let totalSurcharges = 0;

    for (const surcharge of activeSurcharges) {
      // 1. Handle pet surcharge precondition
      if (surcharge.name === 'pet' && petsCount === 0) {
        continue;
      }

      let fee = 0;
      const countFactor = surcharge.name === 'pet' ? petsCount : 1;

      if (surcharge.calcType === 'fixed') {
        fee = surcharge.value * countFactor;
      } else if (surcharge.calcType === 'percentage') {
        fee = Math.round(nightlySubtotal * (surcharge.value / 100));
      } else if (surcharge.calcType === 'per_night') {
        fee = surcharge.value * nights * countFactor;
      } else if (surcharge.calcType === 'per_guest') {
        fee = surcharge.value * (surcharge.name === 'pet' ? petsCount : guests);
      } else if (surcharge.calcType === 'per_guest_per_night') {
        fee = surcharge.value * (surcharge.name === 'pet' ? petsCount : guests) * nights;
      }

      if (fee > 0) {
        appliedSurcharges.push({
          surcharge,
          fee
        });
        totalSurcharges += fee;
      }
    }

    return {
      appliedSurcharges,
      totalSurcharges
    };
  }

  /**
   * REVENUE ENGINE INTERNAL API: calcularImpuestos()
   * Computes all active taxes.
   */
  public static async calcularImpuestos(
    resortId: string,
    nights: number,
    guests: number,
    subtotalWithSurcharges: number,
    countryCode: string = 'ES'
  ): Promise<{ appliedTaxes: { tax: Tax; amount: number }[]; totalTaxes: number }> {
    const taxes = await taxRepository.getAll(resortId);
    // Filter active taxes for the requested country
    const activeTaxes = taxes.filter(t => t.isActive && t.country.toLowerCase() === countryCode.toLowerCase());

    const appliedTaxes: { tax: Tax; amount: number }[] = [];
    let totalTaxes = 0;

    for (const tax of activeTaxes) {
      let amount = 0;
      if (tax.type === 'percentage') {
        amount = Math.round(subtotalWithSurcharges * (tax.rate / 100));
      } else if (tax.type === 'fixed_per_night') {
        amount = tax.rate * nights;
      } else if (tax.type === 'fixed_per_person') {
        amount = tax.rate * guests;
      } else if (tax.type === 'fixed_per_booking') {
        amount = tax.rate;
      }

      if (amount > 0) {
        appliedTaxes.push({
          tax,
          amount
        });
        totalTaxes += amount;
      }
    }

    return {
      appliedTaxes,
      totalTaxes
    };
  }

  /**
   * REVENUE ENGINE INTERNAL API: obtenerPrecioFinal()
   * Simply handles formatting the final results structure.
   */
  public static obtenerPrecioFinal(
    nightlySubtotal: number,
    feesTotal: number,
    discountsTotal: number,
    taxesTotal: number
  ): number {
    const total = nightlySubtotal + feesTotal - discountsTotal + taxesTotal;
    return total < 0 ? 0 : total;
  }

  /**
   * REVENUE ENGINE CENTRAL SERVICE: calcularTarifa()
   * Primary pricing computation engine.
   * Calculates stay details night-by-night and computes flat rules, taxes, promotions, and surcharges.
   */
  public static async calculatePrice(
    resortId: string,
    cabinId: number,
    checkIn: string,
    checkOut: string,
    guests: number,
    petsCount: number,
    baseCabinPrice: number,
    requestedPlanId?: string,
    promoCode?: string,
    countryCode: string = 'ES'
  ): Promise<PricingResult> {
    // 1. Ensure defaults are pre-seeded
    await this.seedDefaultPricingIfNeeded(resortId);

    const nights = calculateNights(checkIn, checkOut);
    const explanation: string[] = [];
    
    if (nights === 0) {
      return {
        totalPrice: 0,
        basePrice: 0,
        nightlyBreakdown: [],
        discountsTotal: 0,
        feesTotal: 0,
        taxesTotal: 0,
        explanation: ['La estadía debe tener al menos 1 noche.']
      };
    }

    // 2. Fetch active rate plan
    const ratePlan = await this.getApplicableRatePlan(resortId, cabinId, requestedPlanId);
    if (!ratePlan) {
      throw new Error('No se encontró ningún plan de tarifa activo aplicable para este alojamiento.');
    }
    explanation.push(`Plan tarifario aplicado: **${ratePlan.name}** (${ratePlan.description}).`);

    // 3. Compute nightly breakdown
    const dates = getDatesInRange(checkIn, checkOut);
    const nightlyBreakdown: NightlyBreakdownItem[] = [];
    let nightlySubtotal = 0;
    let primarySeason: Season | undefined;

    for (const date of dates) {
      const nightDetails = await this.getNightPrice(resortId, cabinId, date, guests, ratePlan, baseCabinPrice);
      nightlySubtotal += nightDetails.finalPrice;
      
      if (nightDetails.season && !primarySeason) {
        primarySeason = nightDetails.season;
      }

      nightlyBreakdown.push({
        date,
        basePrice: baseCabinPrice,
        seasonName: nightDetails.season?.name,
        seasonColor: nightDetails.season?.color,
        finalPrice: nightDetails.finalPrice,
        explanation: nightDetails.explanation
      });
    }

    explanation.push(`Subtotal base de alojamiento (${nights} noches): $${nightlySubtotal}.`);

    // 4. Process Promotions using central API
    const { appliedPromotions, totalDiscount } = await this.obtenerPromociones(
      resortId,
      cabinId,
      checkIn,
      checkOut,
      nights,
      nightlyBreakdown,
      nightlySubtotal,
      promoCode
    );

    for (const appPromo of appliedPromotions) {
      explanation.push(`Promoción aplicada: **${appPromo.promo.name}** (-$${appPromo.discount}).`);
    }

    // 5. Process Surcharges using central API
    const { appliedSurcharges, totalSurcharges } = await this.calcularRecargos(
      resortId,
      nights,
      guests,
      petsCount,
      nightlySubtotal
    );

    for (const appSurch of appliedSurcharges) {
      explanation.push(`Recargo aplicado: **${appSurch.surcharge.label}** (+$${appSurch.fee}).`);
    }

    // 6. Calculate taxes on the net subtotal (base + surcharges - discounts)
    const netSubtotal = nightlySubtotal + totalSurcharges - totalDiscount;
    const { appliedTaxes, totalTaxes } = await this.calcularImpuestos(
      resortId,
      nights,
      guests,
      netSubtotal,
      countryCode
    );

    for (const appTax of appliedTaxes) {
      const taxDesc = appTax.tax.type === 'percentage' ? `${appTax.tax.rate}%` : `$${appTax.tax.rate}`;
      explanation.push(`Impuesto: **${appTax.tax.name}** (${taxDesc}): +$${appTax.amount}.`);
    }

    // 7. Get final price using central API
    const totalPrice = this.obtenerPrecioFinal(nightlySubtotal, totalSurcharges, totalDiscount, totalTaxes);
    explanation.push(`Importe Final Calculado: **$${totalPrice}**.`);

    return {
      totalPrice,
      basePrice: nightlySubtotal,
      nightlyBreakdown,
      appliedSeason: primarySeason,
      appliedRatePlan: ratePlan,
      discountsTotal: totalDiscount,
      feesTotal: totalSurcharges,
      taxesTotal: totalTaxes,
      explanation
    };
  }

  /**
   * Direct alias for Spanish API requirements
   */
  public static async calcularTarifa(
    resortId: string,
    cabinId: number,
    checkIn: string,
    checkOut: string,
    guests: number,
    petsCount: number,
    baseCabinPrice: number,
    requestedPlanId?: string,
    promoCode?: string,
    countryCode: string = 'ES'
  ): Promise<PricingResult> {
    return this.calculatePrice(
      resortId,
      cabinId,
      checkIn,
      checkOut,
      guests,
      petsCount,
      baseCabinPrice,
      requestedPlanId,
      promoCode,
      countryCode
    );
  }

  /**
   * Prepares a high-fidelity quotation ready for presentation or checkout preview.
   */
  public static async prepareBookingQuote(
    resortId: string,
    cabinId: number,
    checkIn: string,
    checkOut: string,
    guests: number,
    petsCount: number,
    baseCabinPrice: number,
    requestedPlanId?: string,
    promoCode?: string,
    countryCode: string = 'ES'
  ): Promise<{ 
    pricingResult: PricingResult; 
    minimumStayValid: boolean; 
    minNightsRequired: number; 
    ruleMessage?: string 
  }> {
    const minStayCheck = await this.validateMinimumStay(resortId, cabinId, checkIn, checkOut);
    const pricingResult = await this.calculatePrice(
      resortId, 
      cabinId, 
      checkIn, 
      checkOut, 
      guests, 
      petsCount, 
      baseCabinPrice, 
      requestedPlanId,
      promoCode,
      countryCode
    );

    return {
      pricingResult,
      minimumStayValid: minStayCheck.valid,
      minNightsRequired: minStayCheck.minRequired,
      ruleMessage: minStayCheck.ruleDescription
    };
  }
}
export default PricingService;
