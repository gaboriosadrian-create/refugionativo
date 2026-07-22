import { Accommodation } from '../../accommodations/types';
import { PricingResult } from '../../pricing/types';

export interface SearchCriteria {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  babies: number;
  pets: number;
  accommodationTypeId?: string;
}

export interface SearchResultItem {
  accommodation: Accommodation;
  pricingResult: PricingResult;
  minimumStayValid: boolean;
  minNightsRequired: number;
  ruleMessage?: string;
}
