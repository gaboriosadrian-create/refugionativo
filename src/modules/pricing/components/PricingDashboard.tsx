import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  Sparkles, 
  Info, 
  Sliders, 
  Layers, 
  Clock, 
  Tag, 
  ShieldAlert, 
  Check, 
  X,
  AlertCircle,
  HelpCircle,
  CalendarDays,
  Users,
  Globe,
  Percent,
  TrendingUp
} from 'lucide-react';
import { usePricing } from '../hooks/usePricing';
import { useAccommodations } from '../../../shared/hooks/useAccommodations';
import { 
  Season, 
  RatePlan, 
  PriceRule, 
  MinimumStayRule, 
  PriceRuleType,
  Promotion,
  Surcharge,
  Tax,
  WeeklyRateConfig,
  OccupancyRule
} from '../types';
import { PricingValidator } from '../validators/PricingValidator';
import { formatCurrency, calculateNights } from '../utils/pricingUtils';
import { Logger } from '../../../core/logger/Logger';

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const PricingDashboard: React.FC = () => {
  const {
    seasons,
    ratePlans,
    priceRules,
    minimumStayRules,
    promotions,
    surcharges,
    taxes,
    weeklyRates,
    occupancyRules,
    loading,
    error,
    calculateStayPrice,
    validateStayMinimum,
    saveSeason,
    deleteSeason,
    saveRatePlan,
    deleteRatePlan,
    savePriceRule,
    deletePriceRule,
    saveMinimumStayRule,
    deleteMinimumStayRule,
    savePromotion,
    deletePromotion,
    saveSurcharge,
    deleteSurcharge,
    saveTax,
    deleteTax,
    saveWeeklyRate,
    deleteWeeklyRate,
    saveOccupancyRule,
    deleteOccupancyRule,
    clearError
  } = usePricing();

  const { accommodations: cabins } = useAccommodations();

  const [activeTab, setActiveTab] = useState<'simulator' | 'seasons' | 'rateplans' | 'promotions' | 'surcharges' | 'taxes' | 'weeklyrates'>('simulator');

  // --- LOCAL FORM STATES ---
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  // Seasons form
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [seasonName, setSeasonName] = useState('');
  const [seasonColor, setSeasonColor] = useState('#3b82f6');
  const [seasonStart, setSeasonStart] = useState('');
  const [seasonEnd, setSeasonEnd] = useState('');
  const [seasonPriority, setSeasonPriority] = useState(10);
  const [seasonDescription, setSeasonDescription] = useState('');
  const [seasonBasePrice, setSeasonBasePrice] = useState<number>(10000);

  // Rate plans form
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planSelectedCabins, setPlanSelectedCabins] = useState<number[]>([]);

  // Promotions form
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoName, setPromoName] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoType, setPromoType] = useState<'percent' | 'fixed' | 'free_nights'>('percent');
  const [promoValue, setPromoValue] = useState<number>(10);
  const [promoMinNights, setPromoMinNights] = useState<number>(3);
  const [promoCode, setPromoCode] = useState('');
  const [promoStart, setPromoStart] = useState('');
  const [promoEnd, setPromoEnd] = useState('');

  // Surcharges form
  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
  const [editingSurchargeId, setEditingSurchargeId] = useState<string | null>(null);
  const [surchargeName, setSurchargeName] = useState<'pet' | 'other' | 'cleaning' | 'early_checkin' | 'late_checkout' | 'extra_service'>('cleaning');
  const [surchargeLabel, setSurchargeLabel] = useState('');
  const [surchargeCalcType, setSurchargeCalcType] = useState<'fixed' | 'percentage' | 'per_night' | 'per_guest' | 'per_guest_per_night'>('fixed');
  const [surchargeValue, setSurchargeValue] = useState<number>(1000);
  const [surchargeActive, setSurchargeActive] = useState(true);

  // Taxes form
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState<number>(21);
  const [taxType, setTaxType] = useState<'percentage' | 'fixed_per_night' | 'fixed_per_person' | 'fixed_per_booking'>('percentage');
  const [taxCountry, setTaxCountry] = useState('ES');
  const [taxActive, setTaxActive] = useState(true);

  // Weekly Rates form
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [editingWeeklyId, setEditingWeeklyId] = useState<string | null>(null);
  const [weeklyCabinId, setWeeklyCabinId] = useState<string>('');
  const [weeklySeasonId, setWeeklySeasonId] = useState<string>('');
  const [weeklyType, setWeeklyType] = useState<'fixed' | 'multiplier' | 'percentage'>('percentage');
  const [weeklyRatesValues, setWeeklyRatesValues] = useState<Record<number, number>>({
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 15, 6: 15
  });

  // Occupancy rule modal
  const [isOccModalOpen, setIsOccModalOpen] = useState(false);
  const [editingOccId, setEditingOccId] = useState<string | null>(null);
  const [occRatePlanId, setOccRatePlanId] = useState('');
  const [occMin, setOccMin] = useState<number>(2);
  const [occMax, setOccMax] = useState<number>(6);
  const [occBasePrice, setOccBasePrice] = useState<number>(8000);
  const [occExtraFee, setOccExtraFee] = useState<number>(1500);

  // Minimum Stay form
  const [isMinStayModalOpen, setIsMinStayModalOpen] = useState(false);
  const [editingMinStayId, setEditingMinStayId] = useState<string | null>(null);
  const [minStayCabinId, setMinStayCabinId] = useState<string>('');
  const [minStaySeasonId, setMinStaySeasonId] = useState<string>('');
  const [minStayDaysOfWeek, setMinStayDaysOfWeek] = useState<number[]>([]);
  const [minStayNights, setMinStayNights] = useState<number>(2);
  const [minStayDescription, setMinStayDescription] = useState('');

  // Rules form
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [selectedPlanForRule, setSelectedPlanForRule] = useState<string>('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleType, setRuleType] = useState<PriceRuleType>('base_price');
  const [ruleValue, setRuleValue] = useState<number>(0);
  const [ruleSeasonId, setRuleSeasonId] = useState<string>('');
  const [ruleAppliesFrom, setRuleAppliesFrom] = useState<number>(3);
  const [ruleDescription, setRuleDescription] = useState('');

  // --- SIMULATOR STATE ---
  const [simCabinId, setSimCabinId] = useState<string>('');
  const [simCheckIn, setSimCheckIn] = useState<string>('');
  const [simCheckOut, setSimCheckOut] = useState<string>('');
  const [simAdults, setSimAdults] = useState<number>(2);
  const [simChildren, setSimChildren] = useState<number>(0);
  const [simPets, setSimPets] = useState<boolean>(false);
  const [simRatePlanId, setSimRatePlanId] = useState<string>('');
  const [simPromoCode, setSimPromoCode] = useState<string>('');
  const [simCountry, setSimCountry] = useState<string>('ES');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [simMinStayAlert, setSimMinStayAlert] = useState<any>(null);
  const [simDateErrors, setSimDateErrors] = useState<string[]>([]);

  // Set default simulator values once cabins are loaded
  useEffect(() => {
    if (cabins.length > 0 && !simCabinId) {
      setSimCabinId(String(cabins[0].id));
      const today = new Date();
      const format = (d: Date) => d.toISOString().split('T')[0];
      setSimCheckIn(format(today));
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 2);
      setSimCheckOut(format(tomorrow));
    }
  }, [cabins]);

  // Set default plan for simulator once rate plans are loaded
  useEffect(() => {
    const defaultPlan = ratePlans.find(p => p.isDefault && p.status === 'active');
    if (defaultPlan && !simRatePlanId) {
      setSimRatePlanId(defaultPlan.id);
    } else if (ratePlans.length > 0 && !simRatePlanId) {
      setSimRatePlanId(ratePlans[0].id);
    }
  }, [ratePlans]);

  const activeCabinObj = useMemo(() => {
    return cabins.find(c => String(c.id) === simCabinId) || null;
  }, [cabins, simCabinId]);

  // Run calculation
  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simCabinId || !simCheckIn || !simCheckOut || !activeCabinObj) {
      return;
    }

    setSimulating(true);
    setLocalError(null);
    setSimMinStayAlert(null);

    // Validate dates explicitly
    const dateVal = PricingValidator.validateStayDates(simCheckIn, simCheckOut);
    setSimDateErrors(dateVal);
    if (dateVal.length > 0) {
      setSimulating(false);
      setSimResult(null);
      return;
    }

    const totalGuests = simAdults + simChildren;
    const basePrice = (activeCabinObj as any).pricing?.basePrice || (activeCabinObj as any).price || 8000;

    try {
      // 1. Min stay check
      const minStayCheck = await validateStayMinimum(
        activeCabinObj.id,
        simCheckIn,
        simCheckOut
      );
      if (!minStayCheck.valid) {
        setSimMinStayAlert({
          required: minStayCheck.minRequired,
          nights: calculateNights(simCheckIn, simCheckOut),
          desc: minStayCheck.ruleDescription || 'Regla de estadía mínima'
        });
      }

      // 2. Pricing calculation (includes promotions, surcharges, and localized taxes)
      const result = await calculateStayPrice(
        activeCabinObj.id,
        simCheckIn,
        simCheckOut,
        totalGuests,
        simPets ? 1 : 0,
        basePrice,
        simRatePlanId || undefined,
        simPromoCode || undefined,
        simCountry
      );

      setSimResult(result);
    } catch (err: any) {
      Logger.error('Simulator error:', err);
      setLocalError(err.message || 'Error al calcular la cotización de tarifas.');
    } finally {
      setSimulating(false);
    }
  };

  // Run automatically when simulator inputs change
  useEffect(() => {
    if (simCabinId && simCheckIn && simCheckOut && activeCabinObj) {
      handleRunSimulation();
    }
  }, [simCabinId, simCheckIn, simCheckOut, simAdults, simChildren, simPets, simRatePlanId, simPromoCode, simCountry]);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setLocalSuccess(msg);
      setTimeout(() => setLocalSuccess(null), 4000);
    } else {
      setLocalError(msg);
      setTimeout(() => setLocalError(null), 6000);
    }
  };

  // --- SEASONS OPERATIONS ---
  const handleOpenSeasonModal = (season?: Season) => {
    if (season) {
      setEditingSeasonId(season.id);
      setSeasonName(season.name);
      setSeasonColor(season.color);
      setSeasonStart(season.startDate);
      setSeasonEnd(season.endDate);
      setSeasonPriority(season.priority);
      setSeasonDescription(season.description);
      setSeasonBasePrice(season.basePrice || 10000);
    } else {
      setEditingSeasonId(null);
      setSeasonName('');
      setSeasonColor('#3b82f6');
      const today = new Date().toISOString().split('T')[0];
      setSeasonStart(today);
      setSeasonEnd(today);
      setSeasonPriority(10);
      setSeasonDescription('');
      setSeasonBasePrice(10000);
    }
    setLocalError(null);
    setIsSeasonModalOpen(true);
  };

  const handleSaveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Season> = {
      id: editingSeasonId || `season_${Date.now()}`,
      resortId: 'demo_resort',
      name: seasonName.trim(),
      color: seasonColor,
      startDate: seasonStart,
      endDate: seasonEnd,
      priority: Number(seasonPriority),
      status: 'active',
      description: seasonDescription.trim(),
      basePrice: Number(seasonBasePrice)
    };

    const validationErrors = PricingValidator.validateSeason(payload, seasons);
    if (validationErrors.length > 0) {
      setLocalError(validationErrors[0]);
      return;
    }

    try {
      await saveSeason(payload as Season);
      setIsSeasonModalOpen(false);
      showFeedback('success', `Temporada "${payload.name}" guardada con éxito.`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Error al guardar temporada.');
    }
  };

  const handleDeleteSeason = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la temporada "${name}"?`)) {
      try {
        await deleteSeason(id);
        showFeedback('success', `Temporada "${name}" eliminada.`);
      } catch (err: any) {
        showFeedback('error', err.message || 'Error al eliminar temporada.');
      }
    }
  };

  // --- RATE PLAN OPERATIONS ---
  const handleOpenPlanModal = (plan?: RatePlan) => {
    if (plan) {
      setEditingPlanId(plan.id);
      setPlanName(plan.name);
      setPlanDescription(plan.description);
      setPlanSelectedCabins(plan.cabinIds || []);
    } else {
      setEditingPlanId(null);
      setPlanName('');
      setPlanDescription('');
      setPlanSelectedCabins([]);
    }
    setLocalError(null);
    setIsPlanModalOpen(true);
  };

  const handleSaveRatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<RatePlan> = {
      id: editingPlanId || `plan_${Date.now()}`,
      resortId: 'demo_resort',
      name: planName.trim(),
      description: planDescription.trim(),
      cabinIds: planSelectedCabins,
      isDefault: editingPlanId ? (ratePlans.find(p => p.id === editingPlanId)?.isDefault || false) : false,
      status: 'active'
    };

    const validationErrors = PricingValidator.validateRatePlan(payload, ratePlans);
    if (validationErrors.length > 0) {
      setLocalError(validationErrors[0]);
      return;
    }

    try {
      await saveRatePlan(payload as RatePlan);
      setIsPlanModalOpen(false);
      showFeedback('success', `Plan de tarifa "${payload.name}" guardado.`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Error al guardar plan de tarifa.');
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar el plan "${name}"?`)) {
      try {
        await deleteRatePlan(id);
        const relatedRules = priceRules.filter(r => r.ratePlanId === id);
        for (const rule of relatedRules) {
          await deletePriceRule(rule.id);
        }
        showFeedback('success', `Plan "${name}" y sus reglas eliminados.`);
      } catch (err: any) {
        showFeedback('error', err.message || 'Error al eliminar plan.');
      }
    }
  };

  const handleSetDefaultPlan = async (plan: RatePlan) => {
    try {
      const otherDefaults = ratePlans.filter(p => p.isDefault && p.id !== plan.id);
      for (const p of otherDefaults) {
        await saveRatePlan({ ...p, isDefault: false });
      }
      await saveRatePlan({ ...plan, isDefault: true });
      showFeedback('success', `"${plan.name}" configurado como plan predeterminado.`);
    } catch (err: any) {
      showFeedback('error', 'Error al establecer plan por defecto.');
    }
  };

  const handleOpenRuleModal = (planId: string, rule?: PriceRule) => {
    setSelectedPlanForRule(planId);
    if (rule) {
      setEditingRuleId(rule.id);
      setRuleType(rule.type);
      setRuleValue(rule.value);
      setRuleSeasonId(rule.seasonId || '');
      setRuleDescription(rule.description || '');
      setRuleAppliesFrom(rule.appliesToGuestsFrom || 3);
    } else {
      setEditingRuleId(null);
      setRuleType('discount_percent');
      setRuleValue(10);
      setRuleSeasonId('');
      setRuleDescription('');
      setRuleAppliesFrom(3);
    }
    setLocalError(null);
    setIsRuleModalOpen(true);
  };

  const handleSavePriceRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForRule) return;

    const payload: PriceRule = {
      id: editingRuleId || `rule_${Date.now()}`,
      resortId: 'demo_resort',
      ratePlanId: selectedPlanForRule,
      type: ruleType,
      value: Number(ruleValue),
      seasonId: ruleSeasonId || undefined,
      description: ruleDescription.trim() || `${ruleType} Rule`,
      appliesToGuestsFrom: Number(ruleAppliesFrom),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await savePriceRule(payload);
      setIsRuleModalOpen(false);
      showFeedback('success', `Regla guardada correctamente.`);
    } catch (err: any) {
      showFeedback('error', 'Error al guardar regla de tarifa.');
    }
  };

  const handleDeletePriceRule = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta regla de tarifa?')) {
      try {
        await deletePriceRule(id);
        showFeedback('success', 'Regla eliminada.');
      } catch (err: any) {
        showFeedback('error', 'Error al eliminar regla.');
      }
    }
  };

  // --- PROMOTIONS OPERATIONS ---
  const handleOpenPromoModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromoId(promo.id);
      setPromoName(promo.name);
      setPromoDesc(promo.description);
      setPromoType(promo.type);
      setPromoValue(promo.value);
      setPromoMinNights(promo.minNightsRequired);
      setPromoCode(promo.promoCode || '');
      setPromoStart(promo.startDate || '');
      setPromoEnd(promo.endDate || '');
    } else {
      setEditingPromoId(null);
      setPromoName('');
      setPromoDesc('');
      setPromoType('percent');
      setPromoValue(10);
      setPromoMinNights(3);
      setPromoCode('');
      setPromoStart('');
      setPromoEnd('');
    }
    setLocalError(null);
    setIsPromoModalOpen(true);
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Promotion> = {
      id: editingPromoId || `promo_${Date.now()}`,
      resortId: 'demo_resort',
      name: promoName.trim(),
      description: promoDesc.trim(),
      type: promoType,
      value: Number(promoValue),
      minNightsRequired: Number(promoMinNights),
      promoCode: promoCode.trim() !== '' ? promoCode.trim().toUpperCase() : undefined,
      startDate: promoStart || undefined,
      endDate: promoEnd || undefined,
      status: 'active'
    };

    const valErrors = PricingValidator.validatePromotion(payload, promotions);
    if (valErrors.length > 0) {
      setLocalError(valErrors[0]);
      return;
    }

    try {
      await savePromotion(payload as Promotion);
      setIsPromoModalOpen(false);
      showFeedback('success', `Promoción "${payload.name}" guardada.`);
    } catch (err: any) {
      showFeedback('error', 'Error al guardar la promoción.');
    }
  };

  const handleDeletePromo = async (id: string, name: string) => {
    if (window.confirm(`¿Deseas eliminar la promoción "${name}"?`)) {
      try {
        await deletePromotion(id);
        showFeedback('success', `Promoción "${name}" eliminada.`);
      } catch (err: any) {
        showFeedback('error', 'Error al eliminar promoción.');
      }
    }
  };

  // --- SURCHARGES OPERATIONS ---
  const handleOpenSurchargeModal = (surch?: Surcharge) => {
    if (surch) {
      setEditingSurchargeId(surch.id);
      setSurchargeName(surch.name);
      setSurchargeLabel(surch.label);
      setSurchargeCalcType(surch.calcType);
      setSurchargeValue(surch.value);
      setSurchargeActive(surch.isActive);
    } else {
      setEditingSurchargeId(null);
      setSurchargeName('cleaning');
      setSurchargeLabel('');
      setSurchargeCalcType('fixed');
      setSurchargeValue(1000);
      setSurchargeActive(true);
    }
    setLocalError(null);
    setIsSurchargeModalOpen(true);
  };

  const handleSaveSurcharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Surcharge = {
      id: editingSurchargeId || `surcharge_${Date.now()}`,
      resortId: 'demo_resort',
      name: surchargeName,
      label: surchargeLabel.trim(),
      calcType: surchargeCalcType,
      value: Number(surchargeValue),
      isActive: surchargeActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!payload.name || !payload.label || payload.value < 0) {
      setLocalError('Todos los campos son obligatorios y los valores deben ser positivos.');
      return;
    }

    try {
      await saveSurcharge(payload);
      setIsSurchargeModalOpen(false);
      showFeedback('success', 'Recargo guardado correctamente.');
    } catch (err: any) {
      showFeedback('error', 'Error al guardar recargo.');
    }
  };

  const handleDeleteSurcharge = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este recargo?')) {
      try {
        await deleteSurcharge(id);
        showFeedback('success', 'Recargo eliminado.');
      } catch (err: any) {
        showFeedback('error', 'Error al eliminar recargo.');
      }
    }
  };

  // --- TAXES OPERATIONS ---
  const handleOpenTaxModal = (tx?: Tax) => {
    if (tx) {
      setEditingTaxId(tx.id);
      setTaxName(tx.name);
      setTaxRate(tx.rate);
      setTaxType(tx.type);
      setTaxCountry(tx.country);
      setTaxActive(tx.isActive);
    } else {
      setEditingTaxId(null);
      setTaxName('');
      setTaxRate(21);
      setTaxType('percentage');
      setTaxCountry('ES');
      setTaxActive(true);
    }
    setLocalError(null);
    setIsTaxModalOpen(true);
  };

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Tax> = {
      id: editingTaxId || `tax_${Date.now()}`,
      resortId: 'demo_resort',
      name: taxName.trim(),
      rate: Number(taxRate),
      type: taxType,
      country: taxCountry.trim().toUpperCase(),
      isActive: taxActive
    };

    const valErrors = PricingValidator.validateTax(payload, taxes);
    if (valErrors.length > 0) {
      setLocalError(valErrors[0]);
      return;
    }

    try {
      await saveTax(payload as Tax);
      setIsTaxModalOpen(false);
      showFeedback('success', 'Impuesto guardado correctamente.');
    } catch (err: any) {
      showFeedback('error', 'Error al guardar impuesto.');
    }
  };

  const handleDeleteTax = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este impuesto?')) {
      try {
        await deleteTax(id);
        showFeedback('success', 'Impuesto eliminado.');
      } catch (err: any) {
        showFeedback('error', 'Error al eliminar impuesto.');
      }
    }
  };

  // --- WEEKLY RATES OPERATIONS ---
  const handleOpenWeeklyModal = (config?: WeeklyRateConfig) => {
    if (config) {
      setEditingWeeklyId(config.id);
      setWeeklyCabinId(config.cabinId ? String(config.cabinId) : '');
      setWeeklySeasonId(config.seasonId || '');
      setWeeklyType(config.type);
      setWeeklyRatesValues({ ...config.rates });
    } else {
      setEditingWeeklyId(null);
      setWeeklyCabinId('');
      setWeeklySeasonId('');
      setWeeklyType('percentage');
      setWeeklyRatesValues({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 15, 6: 15 });
    }
    setLocalError(null);
    setIsWeeklyModalOpen(true);
  };

  const handleSaveWeeklyRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<WeeklyRateConfig> = {
      id: editingWeeklyId || `weekly_${Date.now()}`,
      resortId: 'demo_resort',
      cabinId: weeklyCabinId ? Number(weeklyCabinId) : undefined,
      seasonId: weeklySeasonId || undefined,
      type: weeklyType,
      rates: weeklyRatesValues as any,
      isActive: true
    };

    const valErrors = PricingValidator.validateWeeklyRate(payload);
    if (valErrors.length > 0) {
      setLocalError(valErrors[0]);
      return;
    }

    try {
      await saveWeeklyRate(payload as WeeklyRateConfig);
      setIsWeeklyModalOpen(false);
      showFeedback('success', 'Regla de tarifa semanal guardada.');
    } catch (err: any) {
      showFeedback('error', 'Error al guardar tarifa semanal.');
    }
  };

  const handleDeleteWeeklyRate = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta regla semanal?')) {
      try {
        await deleteWeeklyRate(id);
        showFeedback('success', 'Regla eliminada.');
      } catch (err: any) {
        showFeedback('error', 'Error al eliminar regla semanal.');
      }
    }
  };

  // --- OCCUPANCY RULE OPERATIONS ---
  const handleOpenOccModal = (rule?: OccupancyRule) => {
    if (rule) {
      setEditingOccId(rule.id);
      setOccRatePlanId(rule.ratePlanId);
      setOccMin(rule.minOccupancy);
      setOccMax(rule.maxOccupancy);
      setOccBasePrice(rule.basePriceForMinOccupancy);
      setOccExtraFee(rule.extraGuestFee);
    } else {
      setEditingOccId(null);
      setOccRatePlanId(ratePlans[0]?.id || '');
      setOccMin(2);
      setOccMax(6);
      setOccBasePrice(8000);
      setOccExtraFee(1500);
    }
    setLocalError(null);
    setIsOccModalOpen(true);
  };

  const handleSaveOccRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<OccupancyRule> = {
      id: editingOccId || `occ_${Date.now()}`,
      resortId: 'demo_resort',
      ratePlanId: occRatePlanId,
      minOccupancy: Number(occMin),
      maxOccupancy: Number(occMax),
      basePriceForMinOccupancy: Number(occBasePrice),
      extraGuestFee: Number(occExtraFee),
      isActive: true
    };

    const valErrors = PricingValidator.validateOccupancyRule(payload);
    if (valErrors.length > 0) {
      setLocalError(valErrors[0]);
      return;
    }

    try {
      await saveOccupancyRule(payload as OccupancyRule);
      setIsOccModalOpen(false);
      showFeedback('success', 'Regla de ocupación guardada.');
    } catch (err: any) {
      showFeedback('error', 'Error al guardar regla de ocupación.');
    }
  };

  const handleDeleteOccRule = async (id: string) => {
    if (window.confirm('¿Deseas eliminar esta regla de ocupación?')) {
      try {
        await deleteOccupancyRule(id);
        showFeedback('success', 'Regla eliminada.');
      } catch (err: any) {
        showFeedback('error', 'Error al eliminar regla.');
      }
    }
  };

  // --- MINIMUM STAY OPERATIONS ---
  const handleOpenMinStayModal = (rule?: MinimumStayRule) => {
    if (rule) {
      setEditingMinStayId(rule.id);
      setMinStayCabinId(rule.cabinId ? String(rule.cabinId) : '');
      setMinStaySeasonId(rule.seasonId || '');
      setMinStayDaysOfWeek(rule.daysOfWeek || []);
      setMinStayNights(rule.minNights);
      setMinStayDescription(rule.description);
    } else {
      setEditingMinStayId(null);
      setMinStayCabinId('');
      setMinStaySeasonId('');
      setMinStayDaysOfWeek([]);
      setMinStayNights(2);
      setMinStayDescription('');
    }
    setLocalError(null);
    setIsMinStayModalOpen(true);
  };

  const handleSaveMinStayRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<MinimumStayRule> = {
      id: editingMinStayId || `minstay_${Date.now()}`,
      resortId: 'demo_resort',
      cabinId: minStayCabinId ? Number(minStayCabinId) : undefined,
      seasonId: minStaySeasonId || undefined,
      daysOfWeek: minStayDaysOfWeek.length > 0 ? minStayDaysOfWeek : undefined,
      minNights: Number(minStayNights),
      isActive: true,
      description: minStayDescription.trim() || `Mínimo de ${minStayNights} noches`
    };

    const validationErrors = PricingValidator.validateMinimumStayRule(payload);
    if (validationErrors.length > 0) {
      setLocalError(validationErrors[0]);
      return;
    }

    try {
      await saveMinimumStayRule(payload as MinimumStayRule);
      setIsMinStayModalOpen(false);
      showFeedback('success', 'Estancia mínima guardada con éxito.');
    } catch (err: any) {
      showFeedback('error', 'Error al guardar regla de estancia mínima.');
    }
  };

  const handleDeleteMinStayRule = async (id: string) => {
    if (window.confirm('¿Deseas eliminar esta regla de estancia mínima?')) {
      try {
        await deleteMinimumStayRule(id);
        showFeedback('success', 'Regla eliminada.');
      } catch (err: any) {
        showFeedback('error', 'Error al eliminar regla.');
      }
    }
  };

  // --- GENERAL HELPER FOR WEEKDAYS IN MODALS ---
  const handleToggleDayOfWeekSelection = (day: number) => {
    setMinStayDaysOfWeek(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest"></div>
        <p className="text-xs font-semibold text-muted font-mono">Sincronizando el Motor de Revenue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h2 className="text-xl font-display font-extrabold text-ink tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-forest" />
            <span>Motor Tarifario Inteligente (Revenue Engine)</span>
          </h2>
          <p className="text-xs text-muted mt-1">
            Calcula tarifas dinámicas en tiempo real combinando temporadas, días de la semana, ocupación, promociones, recargos e impuestos localizados.
          </p>
        </div>
        
        {/* TAB NAVIGATION */}
        <div className="flex overflow-x-auto gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-center">
          <button 
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'simulator' ? 'bg-white shadow-xs text-forest' : 'text-muted hover:text-ink'}`}
          >
            Simulador y Validación
          </button>
          <button 
            onClick={() => setActiveTab('seasons')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'seasons' ? 'bg-white shadow-xs text-forest' : 'text-muted hover:text-ink'}`}
          >
            Temporadas
          </button>
          <button 
            onClick={() => setActiveTab('rateplans')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'rateplans' ? 'bg-white shadow-xs text-forest' : 'text-muted hover:text-ink'}`}
          >
            Planes & Ocupación
          </button>
          <button 
            onClick={() => setActiveTab('promotions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'promotions' ? 'bg-white shadow-xs text-forest' : 'text-muted hover:text-ink'}`}
          >
            Promociones
          </button>
          <button 
            onClick={() => setActiveTab('surcharges')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'surcharges' ? 'bg-white shadow-xs text-forest' : 'text-muted hover:text-ink'}`}
          >
            Recargos
          </button>
          <button 
            onClick={() => setActiveTab('taxes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'taxes' ? 'bg-white shadow-xs text-forest' : 'text-muted hover:text-ink'}`}
          >
            Impuestos
          </button>
          <button 
            onClick={() => setActiveTab('weeklyrates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'weeklyrates' ? 'bg-white shadow-xs text-forest' : 'text-muted hover:text-ink'}`}
          >
            Tarifas Semanales
          </button>
        </div>
      </div>

      {/* FEEDBACK TOASTS */}
      {localError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{localError}</span>
        </div>
      )}
      {localSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0 text-green-600" />
          <span>{localSuccess}</span>
        </div>
      )}

      {/* ==================== 1. SIMULATOR VIEW ==================== */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SIMULATOR INPUT CARD */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4">
            <h3 className="font-display font-extrabold text-xs text-muted tracking-wider uppercase">Filtros de Simulación</h3>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Alojamiento *</label>
                <select 
                  value={simCabinId}
                  onChange={(e) => setSimCabinId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white outline-none focus:border-forest font-semibold"
                >
                  {cabins.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Base: {formatCurrency((c as any).pricing?.basePrice || (c as any).price || 8000)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Check-In *</label>
                  <input 
                    type="date"
                    value={simCheckIn}
                    onChange={(e) => setSimCheckIn(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Check-Out *</label>
                  <input 
                    type="date"
                    value={simCheckOut}
                    onChange={(e) => setSimCheckOut(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest font-semibold"
                  />
                </div>
              </div>

              {simDateErrors.map((err, i) => (
                <div key={i} className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{err}</span>
                </div>
              ))}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Adultos</label>
                  <input 
                    type="number"
                    min={1}
                    value={simAdults}
                    onChange={(e) => setSimAdults(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Niños</label>
                  <input 
                    type="number"
                    min={0}
                    value={simChildren}
                    onChange={(e) => setSimChildren(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest font-semibold"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 h-10 px-2 rounded-xl border border-line hover:bg-slate-50 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={simPets}
                      onChange={(e) => setSimPets(e.target.checked)}
                      className="rounded border-line text-forest focus:ring-forest w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-ink">Mascota</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Plan de Tarifa *</label>
                <select 
                  value={simRatePlanId}
                  onChange={(e) => setSimRatePlanId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white outline-none focus:border-forest font-semibold"
                >
                  {ratePlans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isDefault ? '(Predeterminado)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Código Promocional</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ej: STAY10"
                      value={simPromoCode}
                      onChange={(e) => setSimPromoCode(e.target.value)}
                      className="w-full h-10 rounded-xl border border-line pl-8 pr-3 text-xs outline-none focus:border-forest uppercase font-mono font-bold"
                    />
                    <Tag className="w-3.5 h-3.5 text-muted absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">País de Facturación</label>
                  <div className="relative">
                    <select 
                      value={simCountry}
                      onChange={(e) => setSimCountry(e.target.value)}
                      className="w-full h-10 rounded-xl border border-line pl-8 pr-3 text-xs bg-white outline-none focus:border-forest font-semibold"
                    >
                      <option value="ES">España (ES)</option>
                      <option value="AR">Argentina (AR)</option>
                      <option value="CL">Chile (CL)</option>
                      <option value="MX">México (MX)</option>
                    </select>
                    <Globe className="w-3.5 h-3.5 text-muted absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* SIMULATOR DETAILED RESULTS BREAKDOWN */}
          <div className="lg:col-span-7 space-y-4">
            {simulating ? (
              <div className="bg-white rounded-2xl border border-line p-10 flex flex-col items-center justify-center space-y-3 h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest"></div>
                <p className="text-xs text-muted font-bold">Simulando cotización...</p>
              </div>
            ) : simResult ? (
              <div className="space-y-4">
                
                {/* STAYS / WARNINGS PANEL */}
                {simMinStayAlert && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-extrabold text-amber-800">Alerta de Estancia Mínima Insuficiente</h4>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        Esta simulación no cumple con la restricción activa: <strong>{simMinStayAlert.desc}</strong>. Requiere al menos <strong>{simMinStayAlert.required} noches</strong> de estancia para check-ins en la fecha solicitada, pero actualmente seleccionaste {simMinStayAlert.nights} noche(s).
                      </p>
                    </div>
                  </div>
                )}

                {/* THE MATHEMATICAL QUOTATION PANEL */}
                <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
                    <h3 className="font-display font-extrabold text-xs text-ink flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-forest" />
                      <span>Resultados de la Simulación</span>
                    </h3>
                    <span className="text-[10px] font-mono font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Cotización Válida
                    </span>
                  </div>

                  <div className="p-5 space-y-5">
                    
                    {/* STATS STRIP */}
                    <div className="grid grid-cols-3 gap-3 border-b border-line/50 pb-4 text-center">
                      <div>
                        <span className="text-[10px] text-muted block font-semibold">Subtotal Noches</span>
                        <span className="text-sm font-extrabold text-ink">{formatCurrency(simResult.basePrice)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block font-semibold">Descuentos / Promos</span>
                        <span className="text-sm font-extrabold text-red-600">-{formatCurrency(simResult.discountsTotal)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block font-semibold">Impuestos & Tasas</span>
                        <span className="text-sm font-extrabold text-ink">+{formatCurrency(simResult.taxesTotal)}</span>
                      </div>
                    </div>

                    {/* NIGHT-BY-NIGHT BREAKDOWN */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Desglose Noche por Noche</h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {simResult.nightlyBreakdown.map((item: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-line/40 flex justify-between items-center text-xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-ink">{item.date}</span>
                                {item.seasonName && (
                                  <span 
                                    className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: item.seasonColor || '#3b82f6' }}
                                  >
                                    {item.seasonName}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted max-w-md">{item.explanation}</p>
                            </div>
                            <span className="font-bold text-ink">{formatCurrency(item.finalPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DETAILED EXPLANATION TRAIL */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Bitácora de Auditoría del Revenue Engine</h4>
                      <div className="p-3 bg-slate-900 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1 max-h-40 overflow-y-auto">
                        {simResult.explanation.map((line: string, i: number) => (
                          <div key={i} className="flex gap-1.5 leading-relaxed">
                            <span className="text-slate-500 font-bold">&gt;</span>
                            <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FINAL PRICE SUMMARY CONTAINER */}
                    <div className="bg-forest/5 border border-forest/15 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-extrabold text-forest uppercase tracking-wider">Total Cotizado (Lanzado con {simCountry})</span>
                        <p className="text-xs text-muted mt-0.5">Incluye cargos adicionales e impuestos localizados.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-display font-extrabold text-forest">{formatCurrency(simResult.totalPrice)}</span>
                        <span className="text-[9px] font-semibold text-muted block mt-0.5">Valores expresados en ARS</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-line p-10 flex flex-col items-center justify-center text-center space-y-2 h-full">
                <HelpCircle className="w-8 h-8 text-muted" />
                <h4 className="text-xs font-bold text-ink">Completa los filtros para iniciar</h4>
                <p className="text-[10px] text-muted max-w-xs">El motor tarifario resolverá instantáneamente la mejor tarifa combinada para el huésped.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 2. SEASONS VIEW ==================== */}
      {activeTab === 'seasons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-extrabold text-sm text-ink">Historial de Temporadas</h3>
            <button 
              onClick={() => handleOpenSeasonModal()}
              className="px-3 py-1.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Temporada</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seasons.map(season => (
              <div key={season.id} className="bg-white rounded-2xl border border-line p-4 shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: season.color }} />
                
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-display font-extrabold text-xs text-ink">{season.name}</h4>
                    <span className="text-[9px] font-mono bg-slate-100 border border-line px-1.5 py-0.5 rounded text-muted font-bold">
                      Prioridad {season.priority}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted line-clamp-2">{season.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-line/50 pt-2.5 font-mono">
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[8px]">Tarifa Base</span>
                    <span className="font-bold text-ink">{formatCurrency(season.basePrice || 10000)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[8px]">Vigencia</span>
                    <span className="font-semibold text-ink">{season.startDate} al {season.endDate}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 border-t border-line/50 pt-2">
                  <button 
                    onClick={() => handleOpenSeasonModal(season)}
                    className="p-1.5 rounded-lg border border-line hover:bg-slate-50 text-muted hover:text-ink cursor-pointer"
                    title="Editar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteSeason(season.id, season.name)}
                    className="p-1.5 rounded-lg border border-line hover:bg-red-50 text-muted hover:text-red-600 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* SEASON MINIMUM STAYS LIST */}
          <div className="border-t border-line pt-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-extrabold text-sm text-ink">Estancias Mínimas Requeridas</h3>
                <p className="text-[10px] text-muted">Aplica requisitos mínimos de noches basados en temporadas, alojamientos específicos o días de check-in.</p>
              </div>
              <button 
                onClick={() => handleOpenMinStayModal()}
                className="px-3 py-1.5 rounded-xl border border-line hover:bg-slate-50 text-ink font-extrabold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-forest" />
                <span>Agregar Restricción</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-line overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-line text-muted font-bold font-mono">
                    <th className="p-3">Detalle / Regla</th>
                    <th className="p-3">Alojamiento</th>
                    <th className="p-3">Temporada</th>
                    <th className="p-3">Días Check-In</th>
                    <th className="p-3">Mínimo Noches</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {minimumStayRules.map(rule => {
                    const matchedCabin = cabins.find(c => c.id === rule.cabinId);
                    const matchedSeason = seasons.find(s => s.id === rule.seasonId);
                    return (
                      <tr key={rule.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-bold text-ink block">{rule.description}</span>
                        </td>
                        <td className="p-3 font-mono">
                          {matchedCabin ? matchedCabin.name : <span className="text-slate-400">Todos</span>}
                        </td>
                        <td className="p-3">
                          {matchedSeason ? (
                            <span className="font-semibold text-xs flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: matchedSeason.color }} />
                              {matchedSeason.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">Toda el año</span>
                          )}
                        </td>
                        <td className="p-3">
                          {rule.daysOfWeek && rule.daysOfWeek.length > 0 ? (
                            <div className="flex gap-0.5">
                              {rule.daysOfWeek.map(d => (
                                <span key={d} className="bg-slate-100 px-1 py-0.5 rounded text-[8px] font-extrabold text-ink font-mono">
                                  {dayNames[d]}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">Todos</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-forest">
                          {rule.minNights} noches
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleOpenMinStayModal(rule)} className="p-1 rounded border border-line text-muted hover:text-ink hover:bg-white cursor-pointer">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteMinStayRule(rule.id)} className="p-1 rounded border border-line text-muted hover:text-red-600 hover:bg-red-50 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 3. RATE PLANS VIEW ==================== */}
      {activeTab === 'rateplans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-extrabold text-sm text-ink">Planes de Tarifa</h3>
              <p className="text-[10px] text-muted">Aplica variaciones porcentuales o fijas a los precios base del inventario.</p>
            </div>
            <button 
              onClick={() => handleOpenPlanModal()}
              className="px-3 py-1.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {ratePlans.map(plan => {
              const activePlanRules = priceRules.filter(r => r.ratePlanId === plan.id);
              const activePlanOccRule = occupancyRules.find(r => r.ratePlanId === plan.id && r.isActive);
              return (
                <div key={plan.id} className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5">
                          <span>{plan.name}</span>
                          {plan.isDefault && (
                            <span className="text-[8px] bg-forest/10 border border-forest/15 text-forest font-extrabold px-1.5 py-0.5 rounded-full">
                              Predeterminado
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">{plan.description}</p>
                      </div>

                      <div className="flex gap-1">
                        {!plan.isDefault && (
                          <button 
                            onClick={() => handleSetDefaultPlan(plan)}
                            className="px-2 py-1 rounded-lg border border-line text-[9px] font-extrabold text-muted hover:text-ink cursor-pointer hover:bg-slate-50"
                          >
                            Predeterminar
                          </button>
                        )}
                        <button onClick={() => handleOpenPlanModal(plan)} className="p-1 rounded-lg border border-line text-muted hover:text-ink cursor-pointer">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeletePlan(plan.id, plan.name)} className="p-1 rounded-lg border border-line text-muted hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* APPLICABILITY STRIP */}
                    <div className="bg-slate-50/50 p-2.5 rounded-xl text-[10px] text-muted flex justify-between items-center border border-line/40">
                      <span>Alojamientos asociados:</span>
                      <span className="font-extrabold text-ink">
                        {plan.cabinIds && plan.cabinIds.length > 0 ? `${plan.cabinIds.length} cabañas` : 'Global (Todas)'}
                      </span>
                    </div>

                    {/* OCCUPANCY SETTINGS DETAILS */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Tarifa Ocupacional</span>
                        <button 
                          onClick={() => handleOpenOccModal(activePlanOccRule ? activePlanOccRule : { ratePlanId: plan.id } as any)}
                          className="text-[9px] font-bold text-forest hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          {activePlanOccRule ? 'Editar Ocupación' : 'Configurar Ocupación'}
                        </button>
                      </div>

                      {activePlanOccRule ? (
                        <div className="p-2.5 bg-slate-50 border border-line/40 rounded-xl space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-muted">Rango Ocupación:</span>
                            <span className="font-mono font-bold text-ink">{activePlanOccRule.minOccupancy} a {activePlanOccRule.maxOccupancy} huéspedes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Tarifa Base Ocupación Mínima:</span>
                            <span className="font-mono font-bold text-ink">{formatCurrency(activePlanOccRule.basePriceForMinOccupancy)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Cargo Huésped Extra:</span>
                            <span className="font-mono font-bold text-forest">+{formatCurrency(activePlanOccRule.extraGuestFee)} c/u</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted italic">No se ha configurado tarifa por ocupación. Usará el precio base de la cabaña.</p>
                      )}
                    </div>

                    {/* PLAN RULES LIST */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Reglas de Variación</span>
                        <button 
                          onClick={() => handleOpenRuleModal(plan.id)}
                          className="px-2 py-0.5 rounded border border-line hover:bg-slate-50 text-[9px] font-bold text-ink flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5 text-forest" />
                          <span>Agregar Variación</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        {activePlanRules.map(rule => {
                          const matchedSeason = seasons.find(s => s.id === rule.seasonId);
                          return (
                            <div key={rule.id} className="p-2 bg-slate-50 border border-line/40 rounded-lg flex justify-between items-center text-[11px]">
                              <div>
                                <span className="font-bold text-ink block">{rule.description}</span>
                                {matchedSeason && (
                                  <span className="text-[8px] bg-slate-200 px-1 py-0.5 rounded font-bold text-muted mt-0.5 inline-block">
                                    Temporada: {matchedSeason.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-ink bg-slate-100 border px-1.5 py-0.5 rounded">
                                  {rule.type.includes('percent') ? `${rule.value}%` : `$${rule.value}`}
                                </span>
                                <button onClick={() => handleDeletePriceRule(rule.id)} className="text-muted hover:text-red-600 p-0.5 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {activePlanRules.length === 0 && (
                          <p className="text-[10px] text-muted italic">No hay variaciones configuradas para este plan.</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== 4. PROMOTIONS VIEW ==================== */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-extrabold text-sm text-ink">Estrategias de Promoción</h3>
              <p className="text-[10px] text-muted">Aplica descuentos porcentuales, fijos o noches gratis basados en criterios dinámicos.</p>
            </div>
            <button 
              onClick={() => handleOpenPromoModal()}
              className="px-3 py-1.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Promoción</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map(promo => (
              <div key={promo.id} className="bg-white rounded-2xl border border-line p-4 shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-display font-extrabold text-xs text-ink flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-forest" />
                      <span>{promo.name}</span>
                    </h4>
                    {promo.promoCode && (
                      <span className="text-[8px] font-mono font-extrabold bg-blue-50 border border-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        CÓDIGO: {promo.promoCode}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted line-clamp-2">{promo.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-line/50 pt-2.5 font-mono">
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[8px]">Descuento</span>
                    <span className="font-bold text-ink">
                      {promo.type === 'percent' ? `${promo.value}%` : promo.type === 'fixed' ? formatCurrency(promo.value) : `${promo.value} noche(s) GRATIS`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[8px]">Estancia Mínima</span>
                    <span className="font-semibold text-ink">{promo.minNightsRequired} noches</span>
                  </div>
                </div>

                {(promo.startDate || promo.endDate) && (
                  <div className="text-[9px] font-mono text-muted border-t border-line/30 pt-1.5">
                    Vigencia: {promo.startDate || 'Siempre'} al {promo.endDate || 'Siempre'}
                  </div>
                )}

                <div className="flex justify-end gap-1.5 border-t border-line/50 pt-2">
                  <button onClick={() => handleOpenPromoModal(promo)} className="p-1.5 rounded-lg border border-line hover:bg-slate-50 text-muted hover:text-ink cursor-pointer">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeletePromo(promo.id, promo.name)} className="p-1.5 rounded-lg border border-line hover:bg-red-50 text-muted hover:text-red-600 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 5. SURCHARGES VIEW ==================== */}
      {activeTab === 'surcharges' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-extrabold text-sm text-ink">Servicios & Recargos Configurables</h3>
              <p className="text-[10px] text-muted">Configura recargos para mascotas, limpieza, seguros, etc. con múltiples formas de cálculo.</p>
            </div>
            <button 
              onClick={() => handleOpenSurchargeModal()}
              className="px-3 py-1.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Recargo</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-line overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-line text-muted font-bold font-mono">
                  <th className="p-3">Nombre en Base de Datos</th>
                  <th className="p-3">Etiqueta Visual</th>
                  <th className="p-3">Tipo de Cálculo</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {surcharges.map(surch => (
                  <tr key={surch.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-ink">{surch.name}</td>
                    <td className="p-3 font-semibold text-ink">{surch.label}</td>
                    <td className="p-3 font-semibold capitalize text-muted">{surch.calcType.replace(/_/g, ' ')}</td>
                    <td className="p-3 font-mono font-bold text-ink">
                      {surch.calcType === 'percentage' ? `${surch.value}%` : formatCurrency(surch.value)}
                    </td>
                    <td className="p-3">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${surch.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-line'}`}>
                        {surch.isActive ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleOpenSurchargeModal(surch)} className="p-1 rounded border border-line text-muted hover:text-ink hover:bg-white cursor-pointer">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteSurcharge(surch.id)} className="p-1 rounded border border-line text-muted hover:text-red-600 hover:bg-red-50 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 6. TAXES VIEW ==================== */}
      {activeTab === 'taxes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-extrabold text-sm text-ink">Configuración de Impuestos</h3>
              <p className="text-[10px] text-muted">Gestión dinámica de impuestos localizados para cumplir con la legislación fiscal de cada país.</p>
            </div>
            <button 
              onClick={() => handleOpenTaxModal()}
              className="px-3 py-1.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Impuesto</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-line overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-line text-muted font-bold font-mono">
                  <th className="p-3">País</th>
                  <th className="p-3">Impuesto</th>
                  <th className="p-3">Tipo de Tasa</th>
                  <th className="p-3">Porcentaje o Tarifa</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {taxes.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-extrabold text-forest">{tx.country.toUpperCase()}</td>
                    <td className="p-3 font-bold text-ink">{tx.name}</td>
                    <td className="p-3 font-semibold capitalize text-muted">{tx.type.replace(/_/g, ' ')}</td>
                    <td className="p-3 font-mono font-bold text-ink">
                      {tx.type === 'percentage' ? `${tx.rate}%` : formatCurrency(tx.rate)}
                    </td>
                    <td className="p-3">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${tx.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-line'}`}>
                        {tx.isActive ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleOpenTaxModal(tx)} className="p-1 rounded border border-line text-muted hover:text-ink hover:bg-white cursor-pointer">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTax(tx.id)} className="p-1 rounded border border-line text-muted hover:text-red-600 hover:bg-red-50 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 7. WEEKLY RATES VIEW ==================== */}
      {activeTab === 'weeklyrates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-extrabold text-sm text-ink">Tarifas por Día de la Semana</h3>
              <p className="text-[10px] text-muted">Aplica modificadores tarifarios fijos, porcentuales o multiplicadores automáticos para días específicos.</p>
            </div>
            <button 
              onClick={() => handleOpenWeeklyModal()}
              className="px-3 py-1.5 rounded-xl bg-forest hover:bg-forest-hover text-white font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Configuración Semanal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyRates.map(config => {
              const matchedCabin = cabins.find(c => c.id === config.cabinId);
              const matchedSeason = seasons.find(s => s.id === config.seasonId);
              return (
                <div key={config.id} className="bg-white rounded-2xl border border-line p-4 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-extrabold uppercase bg-slate-100 px-1.5 py-0.5 rounded text-muted">
                        Tipo: {config.type}
                      </span>
                      <button onClick={() => handleDeleteWeeklyRate(config.id)} className="text-muted hover:text-red-600 cursor-pointer p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted">Alojamiento:</span>
                        <span className="font-bold text-ink">{matchedCabin ? matchedCabin.name : 'Todos'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Temporada:</span>
                        <span className="font-bold text-ink">{matchedSeason ? matchedSeason.name : 'Todas'}</span>
                      </div>
                    </div>

                    {/* WEEKDAYS VALUES GRID */}
                    <div className="grid grid-cols-7 gap-1 pt-1.5">
                      {[1, 2, 3, 4, 5, 6, 0].map(day => {
                        const rate = config.rates[day as 0 | 1 | 2 | 3 | 4 | 5 | 6];
                        return (
                          <div key={day} className="p-1.5 bg-slate-50 border rounded-lg text-center font-mono">
                            <span className="text-[8px] font-bold text-muted block">{dayNames[day]}</span>
                            <span className="text-[10px] font-extrabold text-ink block mt-0.5">
                              {config.type === 'percentage' ? `+${rate}%` : config.type === 'multiplier' ? `x${rate}` : formatCurrency(rate)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-line/50 pt-2 flex justify-end">
                    <button onClick={() => handleOpenWeeklyModal(config)} className="text-xs font-bold text-forest hover:underline cursor-pointer flex items-center gap-0.5">
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar Configuración</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== FORM MODALS ==================== */}

      {/* 1. SEASONS FORM MODAL */}
      {isSeasonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-forest" />
                <span>{editingSeasonId ? 'Editar Temporada' : 'Crear Nueva Temporada'}</span>
              </h3>
              <button onClick={() => setIsSeasonModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSeason} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-ink mb-1">Nombre Temporada *</label>
                  <input 
                    type="text" required value={seasonName} onChange={(e) => setSeasonName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Color *</label>
                  <div className="flex gap-2 items-center h-10">
                    <input 
                      type="color" value={seasonColor} onChange={(e) => setSeasonColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-line p-0"
                    />
                    <span className="font-mono text-[10px] uppercase font-bold text-ink">{seasonColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Fecha Inicio *</label>
                  <input 
                    type="date" required value={seasonStart} onChange={(e) => setSeasonStart(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Fecha Fin *</label>
                  <input 
                    type="date" required value={seasonEnd} onChange={(e) => setSeasonEnd(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Prioridad de Resolución *</label>
                  <input 
                    type="number" min={1} required value={seasonPriority} onChange={(e) => setSeasonPriority(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Tarifa Base por Defecto *</label>
                  <input 
                    type="number" min={0} required value={seasonBasePrice} onChange={(e) => setSeasonBasePrice(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Descripción de la Temporada</label>
                <textarea 
                  value={seasonDescription} onChange={(e) => setSeasonDescription(e.target.value)}
                  className="w-full h-20 rounded-xl border border-line p-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button type="button" onClick={() => setIsSeasonModalOpen(false)} className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-xs cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RATE PLANS FORM MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-forest" />
                <span>{editingPlanId ? 'Editar Plan de Tarifa' : 'Nuevo Plan de Tarifa'}</span>
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRatePlan} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Nombre del Plan *</label>
                <input 
                  type="text" required value={planName} onChange={(e) => setPlanName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Descripción explicativa *</label>
                <input 
                  type="text" required value={planDescription} onChange={(e) => setPlanDescription(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Aplica a Alojamientos (Vacio = Todas las cabañas)</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {cabins.map(cabin => {
                    const isSelected = planSelectedCabins.includes(cabin.id);
                    return (
                      <button
                        key={cabin.id}
                        type="button"
                        onClick={() => {
                          setPlanSelectedCabins(prev => 
                            prev.includes(cabin.id) ? prev.filter(id => id !== cabin.id) : [...prev, cabin.id]
                          );
                        }}
                        className={`p-2 rounded-xl text-left border text-[11px] font-bold flex justify-between items-center transition-all cursor-pointer ${
                          isSelected ? 'bg-forest/5 border-forest text-forest' : 'bg-white border-line text-muted hover:bg-slate-50'
                        }`}
                      >
                        <span>{cabin.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-xs cursor-pointer">Guardar Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. PROMOTIONS FORM MODAL */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-forest" />
                <span>{editingPromoId ? 'Editar Promoción' : 'Nueva Estrategia de Promoción'}</span>
              </h3>
              <button onClick={() => setIsPromoModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Nombre Promoción *</label>
                  <input 
                    type="text" required value={promoName} onChange={(e) => setPromoName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Código de Cupón (Opcional)</label>
                  <input 
                    type="text" placeholder="Ej: STAY10" value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none uppercase font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Tipo Descuento *</label>
                  <select 
                    value={promoType} onChange={(e) => setPromoType(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-line px-2 text-xs bg-white font-semibold"
                  >
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                    <option value="free_nights">Noches Gratis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Valor *</label>
                  <input 
                    type="number" min={1} required value={promoValue} onChange={(e) => setPromoValue(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Estancia Mínima *</label>
                  <input 
                    type="number" min={1} required value={promoMinNights} onChange={(e) => setPromoMinNights(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Vigencia Desde (Opcional)</label>
                  <input 
                    type="date" value={promoStart} onChange={(e) => setPromoStart(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Vigencia Hasta (Opcional)</label>
                  <input 
                    type="date" value={promoEnd} onChange={(e) => setPromoEnd(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Descripción / Términos de la Promoción *</label>
                <textarea 
                  required placeholder="Explica cómo se aplica el beneficio..." value={promoDesc} onChange={(e) => setPromoDesc(e.target.value)}
                  className="w-full h-16 rounded-xl border border-line p-3 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button type="button" onClick={() => setIsPromoModalOpen(false)} className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-xs cursor-pointer">Guardar Promoción</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. SURCHARGES FORM MODAL */}
      {isSurchargeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink">
                <span>{editingSurchargeId ? 'Editar Recargo' : 'Nuevo Recargo Configurable'}</span>
              </h3>
              <button onClick={() => setIsSurchargeModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSurcharge} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Nombre Base de Datos *</label>
                  <select 
                    value={surchargeName} 
                    onChange={(e) => setSurchargeName(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white outline-none font-semibold"
                    disabled={!!editingSurchargeId}
                  >
                    <option value="cleaning">cleaning (Limpieza)</option>
                    <option value="pet">pet (Mascotas)</option>
                    <option value="early_checkin">early_checkin (Check-In Temprano)</option>
                    <option value="late_checkout">late_checkout (Check-Out Tardío)</option>
                    <option value="extra_service">extra_service (Servicio Extra)</option>
                    <option value="other">other (Otros / Varios)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Etiqueta Visual *</label>
                  <input 
                    type="text" placeholder="ej: Suplemento Mascota" required value={surchargeLabel} onChange={(e) => setSurchargeLabel(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Tipo de Cálculo *</label>
                  <select 
                    value={surchargeCalcType} onChange={(e) => setSurchargeCalcType(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-line px-2 text-xs bg-white font-semibold"
                  >
                    <option value="fixed">Monto Fijo único</option>
                    <option value="percentage">Porcentaje del Alojamiento</option>
                    <option value="per_night">Por Noche</option>
                    <option value="per_guest">Por Huésped</option>
                    <option value="per_guest_per_night">Por Huésped y Noche</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Valor del Recargo *</label>
                  <input 
                    type="number" min={0} required value={surchargeValue} onChange={(e) => setSurchargeValue(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button type="button" onClick={() => setIsSurchargeModalOpen(false)} className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-xs cursor-pointer">Guardar Recargo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. TAXES FORM MODAL */}
      {isTaxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink">
                <span>{editingTaxId ? 'Editar Impuesto' : 'Nuevo Impuesto Localizado'}</span>
              </h3>
              <button onClick={() => setIsTaxModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTax} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Código de País *</label>
                  <input 
                    type="text" placeholder="ES, AR, MX..." required value={taxCountry} onChange={(e) => setTaxCountry(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none font-bold uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Nombre Impuesto *</label>
                  <input 
                    type="text" placeholder="IVA, Tasa Ecológica" required value={taxName} onChange={(e) => setTaxName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Tipo de Tasa *</label>
                  <select 
                    value={taxType} onChange={(e) => setTaxType(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-line px-2 text-xs bg-white font-semibold"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed_per_night">Fijo por Noche ($)</option>
                    <option value="fixed_per_person">Fijo por Persona ($)</option>
                    <option value="fixed_per_booking">Fijo por Reserva ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Tasa o Monto *</label>
                  <input 
                    type="number" min={0} required value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button type="button" onClick={() => setIsTaxModalOpen(false)} className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-xs cursor-pointer">Guardar Impuesto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. WEEKLY RATES FORM MODAL */}
      {isWeeklyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink">
                <span>{editingWeeklyId ? 'Editar Tarifa Semanal' : 'Nueva Configuración Semanal'}</span>
              </h3>
              <button onClick={() => setIsWeeklyModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWeeklyRate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Alojamiento (Vacio = Todos)</label>
                  <select 
                    value={weeklyCabinId} onChange={(e) => setWeeklyCabinId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white font-semibold"
                  >
                    <option value="">Aplica globalmente</option>
                    {cabins.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Temporada (Vacio = Siempre)</label>
                  <select 
                    value={weeklySeasonId} onChange={(e) => setWeeklySeasonId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white font-semibold"
                  >
                    <option value="">Todo el año</option>
                    {seasons.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Tipo Modificador *</label>
                <select 
                  value={weeklyType} onChange={(e) => setWeeklyType(e.target.value as any)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white font-semibold"
                >
                  <option value="percentage">Porcentaje Recargo (%)</option>
                  <option value="fixed">Monto Fijo Sobreescribir ($)</option>
                  <option value="multiplier">Multiplicador Tarifario (x)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-2">Valores por Día de la Semana</label>
                <div className="grid grid-cols-7 gap-1">
                  {[1, 2, 3, 4, 5, 6, 0].map(day => (
                    <div key={day} className="text-center">
                      <span className="text-[10px] font-bold text-muted block mb-1">{dayNames[day]}</span>
                      <input 
                        type="number" step="any" min={0} required
                        value={weeklyRatesValues[day] || 0}
                        onChange={(e) => setWeeklyRatesValues(prev => ({ ...prev, [day]: Number(e.target.value) }))}
                        className="w-full h-9 rounded-lg border border-line text-center text-xs font-semibold outline-none focus:border-forest"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button type="button" onClick={() => setIsWeeklyModalOpen(false)} className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-xs cursor-pointer">Guardar Tarifa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. OCCUPANCY RULE FORM MODAL */}
      {isOccModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5">
                <Users className="w-4 h-4 text-forest" />
                <span>Configurar Tarifa por Ocupación</span>
              </h3>
              <button onClick={() => setIsOccModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOccRule} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Huéspedes Mínimos *</label>
                  <input 
                    type="number" min={1} required value={occMin} onChange={(e) => setOccMin(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Huéspedes Máximos *</label>
                  <input 
                    type="number" min={1} required value={occMax} onChange={(e) => setOccMax(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Tarifa Ocupación Mínima *</label>
                  <input 
                    type="number" min={0} required value={occBasePrice} onChange={(e) => setOccBasePrice(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Costo Huésped Extra *</label>
                  <input 
                    type="number" min={0} required value={occExtraFee} onChange={(e) => setOccExtraFee(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button type="button" onClick={() => setIsOccModalOpen(false)} className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-xs cursor-pointer">Guardar Configuración</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. PRICE RULES MODAL FOR RATE PLAN */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink">
                <span>Nueva Regla de Variación Tarifaria</span>
              </h3>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePriceRule} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Tipo de Variación *</label>
                  <select 
                    value={ruleType} onChange={(e) => setRuleType(e.target.value as PriceRuleType)}
                    className="w-full h-10 rounded-xl border border-line px-2 text-xs bg-white font-semibold"
                  >
                    <option value="base_price">Sobreescribir base</option>
                    <option value="person_price">Tarifa por persona</option>
                    <option value="additional_guest">Cargo extra huésped</option>
                    <option value="discount_percent">Descuento (%)</option>
                    <option value="discount_amount">Descuento ($)</option>
                    <option value="surcharge_percent">Recargo (%)</option>
                    <option value="surcharge_amount">Recargo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Valor Numérico *</label>
                  <input 
                    type="number" min={0} required value={ruleValue} onChange={(e) => setRuleValue(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Temporada (Opcional, vacio = Siempre)</label>
                <select 
                  value={ruleSeasonId} onChange={(e) => setRuleSeasonId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white font-semibold"
                >
                  <option value="">Aplica todo el año</option>
                  {seasons.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Descripción explicativa *</label>
                <input 
                  type="text" placeholder="Ej: Descuento de Temporada Baja" required value={ruleDescription} onChange={(e) => setRuleDescription(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button type="button" onClick={() => setIsRuleModalOpen(false)} className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-xs cursor-pointer">Guardar Regla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MINIMUM STAY FORM MODAL */}
      {isMinStayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-line flex justify-between items-center">
              <h3 className="font-display font-extrabold text-sm text-ink flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-forest" />
                <span>Nueva Restricción de Estadía Mínima</span>
              </h3>
              <button onClick={() => setIsMinStayModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMinStayRule} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Mínimo Noches *</label>
                  <input 
                    type="number" min={1} required value={minStayNights} onChange={(e) => setMinStayNights(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Alojamiento (Vacio = Todos)</label>
                  <select 
                    value={minStayCabinId} onChange={(e) => setMinStayCabinId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white font-semibold"
                  >
                    <option value="">Aplica globalmente</option>
                    {cabins.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Temporada (Vacio = Siempre)</label>
                <select 
                  value={minStaySeasonId} onChange={(e) => setMinStaySeasonId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs bg-white font-semibold"
                >
                  <option value="">Aplica todo el año</option>
                  {seasons.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Días específicos de Check-In (Vacio = Todos)</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map(day => {
                    const isSelected = minStayDaysOfWeek.includes(day);
                    return (
                      <button
                        key={day} type="button" onClick={() => handleToggleDayOfWeekSelection(day)}
                        className={`flex-1 h-8 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                          isSelected ? 'bg-forest border-forest text-white' : 'bg-white border-line text-muted hover:bg-slate-50'
                        }`}
                      >
                        {dayNames[day]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Descripción de la regla *</label>
                <input 
                  type="text" required placeholder="Ej: Mínimo 2 noches los fines de semana" value={minStayDescription} onChange={(e) => setMinStayDescription(e.target.value)}
                  className="w-full h-10 rounded-xl border border-line px-3 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line/50">
                <button type="button" onClick={() => setIsMinStayModalOpen(false)} className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs shadow-xs cursor-pointer">Guardar Restricción</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PricingDashboard;
