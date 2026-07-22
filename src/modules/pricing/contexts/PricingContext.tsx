import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Season, 
  RatePlan, 
  PriceRule, 
  MinimumStayRule, 
  PricingResult,
  Promotion,
  Surcharge,
  Tax,
  WeeklyRateConfig,
  OccupancyRule
} from '../types';
import seasonRepository from '../repositories/SeasonRepository';
import ratePlanRepository from '../repositories/RatePlanRepository';
import priceRuleRepository from '../repositories/PriceRuleRepository';
import minimumStayRuleRepository from '../repositories/MinimumStayRuleRepository';
import promotionRepository from '../repositories/PromotionRepository';
import surchargeRepository from '../repositories/SurchargeRepository';
import taxRepository from '../repositories/TaxRepository';
import weeklyRateRepository from '../repositories/WeeklyRateRepository';
import occupancyRuleRepository from '../repositories/OccupancyRuleRepository';
import { PricingService } from '../services/PricingService';
import { useAuth } from '../../auth/hooks/useAuth';
import { Logger } from '../../../core/logger/Logger';

interface PricingContextType {
  seasons: Season[];
  ratePlans: RatePlan[];
  priceRules: PriceRule[];
  minimumStayRules: MinimumStayRule[];
  promotions: Promotion[];
  surcharges: Surcharge[];
  taxes: Tax[];
  weeklyRates: WeeklyRateConfig[];
  occupancyRules: OccupancyRule[];
  loading: boolean;
  error: string | null;
  calculateStayPrice: (
    cabinId: number, 
    checkIn: string, 
    checkOut: string, 
    guests: number, 
    petsCount: number, 
    baseCabinPrice: number,
    requestedPlanId?: string,
    promoCode?: string,
    countryCode?: string
  ) => Promise<PricingResult>;
  validateStayMinimum: (
    cabinId: number,
    checkIn: string,
    checkOut: string
  ) => Promise<{ valid: boolean; minRequired: number; ruleDescription?: string }>;
  saveSeason: (season: Season) => Promise<void>;
  deleteSeason: (id: string) => Promise<void>;
  saveRatePlan: (plan: RatePlan) => Promise<void>;
  deleteRatePlan: (id: string) => Promise<void>;
  savePriceRule: (rule: PriceRule) => Promise<void>;
  deletePriceRule: (id: string) => Promise<void>;
  saveMinimumStayRule: (rule: MinimumStayRule) => Promise<void>;
  deleteMinimumStayRule: (id: string) => Promise<void>;
  savePromotion: (promo: Promotion) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  saveSurcharge: (surcharge: Surcharge) => Promise<void>;
  deleteSurcharge: (id: string) => Promise<void>;
  saveTax: (tax: Tax) => Promise<void>;
  deleteTax: (id: string) => Promise<void>;
  saveWeeklyRate: (config: WeeklyRateConfig) => Promise<void>;
  deleteWeeklyRate: (id: string) => Promise<void>;
  saveOccupancyRule: (rule: OccupancyRule) => Promise<void>;
  deleteOccupancyRule: (id: string) => Promise<void>;
  clearError: () => void;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export const PricingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const resortId = (user as any)?.resortId || 'demo_resort';

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [priceRules, setPriceRules] = useState<PriceRule[]>([]);
  const [minimumStayRules, setMinimumStayRules] = useState<MinimumStayRule[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [surcharges, setSurcharges] = useState<Surcharge[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [weeklyRates, setWeeklyRates] = useState<WeeklyRateConfig[]>([]);
  const [occupancyRules, setOccupancyRules] = useState<OccupancyRule[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up active subscription listeners for real-time syncing
  useEffect(() => {
    setLoading(true);

    // Seed defaults if necessary
    PricingService.seedDefaultPricingIfNeeded(resortId).then(() => {
      // Set up real-time subscriptions
      const unsubSeasons = seasonRepository.subscribe(resortId, (data) => {
        setSeasons([...data].sort((a, b) => b.priority - a.priority));
      });

      const unsubRatePlans = ratePlanRepository.subscribe(resortId, (data) => {
        setRatePlans(data);
      });

      const unsubPriceRules = priceRuleRepository.subscribe(resortId, (data) => {
        setPriceRules(data);
      });

      const unsubMinStays = minimumStayRuleRepository.subscribe(resortId, (data) => {
        setMinimumStayRules(data);
      });

      const unsubPromos = promotionRepository.subscribe(resortId, (data) => {
        setPromotions(data);
      });

      const unsubSurcharges = surchargeRepository.subscribe(resortId, (data) => {
        setSurcharges(data);
      });

      const unsubTaxes = taxRepository.subscribe(resortId, (data) => {
        setTaxes(data);
      });

      const unsubWeekly = weeklyRateRepository.subscribe(resortId, (data) => {
        setWeeklyRates(data);
      });

      const unsubOcc = occupancyRuleRepository.subscribe(resortId, (data) => {
        setOccupancyRules(data);
        setLoading(false);
      });

      return () => {
        unsubSeasons();
        unsubRatePlans();
        unsubPriceRules();
        unsubMinStays();
        unsubPromos();
        unsubSurcharges();
        unsubTaxes();
        unsubWeekly();
        unsubOcc();
      };
    }).catch(err => {
      Logger.error('Failed to seed or subscribe pricing systems:', err);
      setError('Error al sincronizar el motor de tarifas.');
      setLoading(false);
    });
  }, [resortId]);

  const calculateStayPrice = async (
    cabinId: number, 
    checkIn: string, 
    checkOut: string, 
    guests: number, 
    petsCount: number, 
    baseCabinPrice: number,
    requestedPlanId?: string,
    promoCode?: string,
    countryCode?: string
  ): Promise<PricingResult> => {
    try {
      return await PricingService.calculatePrice(
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
    } catch (err: any) {
      Logger.error('Pricing calculation failed in context wrapper:', err);
      throw err;
    }
  };

  const validateStayMinimum = async (
    cabinId: number,
    checkIn: string,
    checkOut: string
  ) => {
    return await PricingService.validateMinimumStay(resortId, cabinId, checkIn, checkOut);
  };

  const saveSeason = async (season: Season) => {
    try {
      await seasonRepository.save(resortId, season);
    } catch (err: any) {
      setError(err.message || 'Fallo al guardar temporada.');
      throw err;
    }
  };

  const deleteSeason = async (id: string) => {
    try {
      await seasonRepository.delete(resortId, id);
    } catch (err: any) {
      setError(err.message || 'Fallo al eliminar temporada.');
      throw err;
    }
  };

  const saveRatePlan = async (plan: RatePlan) => {
    try {
      await ratePlanRepository.save(resortId, plan);
    } catch (err: any) {
      setError(err.message || 'Fallo al guardar plan de tarifa.');
      throw err;
    }
  };

  const deleteRatePlan = async (id: string) => {
    try {
      await ratePlanRepository.delete(resortId, id);
    } catch (err: any) {
      setError(err.message || 'Fallo al eliminar plan de tarifa.');
      throw err;
    }
  };

  const savePriceRule = async (rule: PriceRule) => {
    try {
      await priceRuleRepository.save(resortId, rule);
    } catch (err: any) {
      setError(err.message || 'Fallo al guardar regla de precio.');
      throw err;
    }
  };

  const deletePriceRule = async (id: string) => {
    try {
      await priceRuleRepository.delete(resortId, id);
    } catch (err: any) {
      setError(err.message || 'Fallo al eliminar regla de precio.');
      throw err;
    }
  };

  const saveMinimumStayRule = async (rule: MinimumStayRule) => {
    try {
      await minimumStayRuleRepository.save(resortId, rule);
    } catch (err: any) {
      setError(err.message || 'Fallo al guardar regla de estancia mínima.');
      throw err;
    }
  };

  const deleteMinimumStayRule = async (id: string) => {
    try {
      await minimumStayRuleRepository.delete(resortId, id);
    } catch (err: any) {
      setError(err.message || 'Fallo al eliminar regla de estancia mínima.');
      throw err;
    }
  };

  const savePromotion = async (promo: Promotion) => {
    try {
      await promotionRepository.save(resortId, promo);
    } catch (err: any) {
      setError(err.message || 'Fallo al guardar promoción.');
      throw err;
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      await promotionRepository.delete(resortId, id);
    } catch (err: any) {
      setError(err.message || 'Fallo al eliminar promoción.');
      throw err;
    }
  };

  const saveSurcharge = async (surcharge: Surcharge) => {
    try {
      await surchargeRepository.save(resortId, surcharge);
    } catch (err: any) {
      setError(err.message || 'Fallo al guardar recargo.');
      throw err;
    }
  };

  const deleteSurcharge = async (id: string) => {
    try {
      await surchargeRepository.delete(resortId, id);
    } catch (err: any) {
      setError(err.message || 'Fallo al eliminar recargo.');
      throw err;
    }
  };

  const saveTax = async (tax: Tax) => {
    try {
      await taxRepository.save(resortId, tax);
    } catch (err: any) {
      setError(err.message || 'Fallo al guardar impuesto.');
      throw err;
    }
  };

  const deleteTax = async (id: string) => {
    try {
      await taxRepository.delete(resortId, id);
    } catch (err: any) {
      setError(err.message || 'Fallo al eliminar impuesto.');
      throw err;
    }
  };

  const saveWeeklyRate = async (config: WeeklyRateConfig) => {
    try {
      await weeklyRateRepository.save(resortId, config);
    } catch (err: any) {
      setError(err.message || 'Fallo al guardar tarifa semanal.');
      throw err;
    }
  };

  const deleteWeeklyRate = async (id: string) => {
    try {
      await weeklyRateRepository.delete(resortId, id);
    } catch (err: any) {
      setError(err.message || 'Fallo al eliminar tarifa semanal.');
      throw err;
    }
  };

  const saveOccupancyRule = async (rule: OccupancyRule) => {
    try {
      await occupancyRuleRepository.save(resortId, rule);
    } catch (err: any) {
      setError(err.message || 'Fallo al guardar regla de ocupación.');
      throw err;
    }
  };

  const deleteOccupancyRule = async (id: string) => {
    try {
      await occupancyRuleRepository.delete(resortId, id);
    } catch (err: any) {
      setError(err.message || 'Fallo al eliminar regla de ocupación.');
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <PricingContext.Provider value={{
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
    }}>
      {children}
    </PricingContext.Provider>
  );
};

export const usePricingContext = () => {
  const context = useContext(PricingContext);
  if (context === undefined) {
    throw new Error('usePricingContext must be used within a PricingProvider');
  }
  return context;
};
export default PricingProvider;
