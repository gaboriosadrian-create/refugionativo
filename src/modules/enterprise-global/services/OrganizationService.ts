import {
  Organization,
  OrganizationUser,
  RegionalManager,
  CorporateRole,
  PropertyMetrics,
  CrossPropertyFilter
} from '../types';
import { organizationRepository } from '../repositories/organizationRepository';
import { localizationRepository } from '../repositories/localizationRepository';
import { complianceRepository } from '../repositories/complianceRepository';

export class OrganizationService {
  public static getOrganizations(): Organization[] {
    return organizationRepository.getOrganizations();
  }

  public static getOrganizationById(id: string): Organization | undefined {
    return organizationRepository.getOrganizationById(id);
  }

  public static createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Organization {
    const org = organizationRepository.createOrganization(data);
    complianceRepository.logAudit({
      organizationId: org.id,
      tenantId: 'tenant-default',
      actorEmail: 'system.admin@stayflow.com',
      actorRole: 'CORPORATE_ADMIN',
      action: 'CREATE_ORGANIZATION',
      category: 'config_change',
      targetResource: `organizations/${org.id}`,
      details: { name: org.name, code: org.code, country: org.country },
      ipAddress: '127.0.0.1'
    });
    return org;
  }

  public static getOrganizationUsers(orgId: string): OrganizationUser[] {
    return organizationRepository.getOrganizationUsers(orgId);
  }

  public static addOrganizationUser(user: Omit<OrganizationUser, 'id' | 'createdAt'>): OrganizationUser {
    const orgUser = organizationRepository.addOrganizationUser(user);
    complianceRepository.logAudit({
      organizationId: user.organizationId,
      tenantId: 'tenant-default',
      actorEmail: 'system.admin@stayflow.com',
      actorRole: 'CORPORATE_ADMIN',
      action: 'ASSIGN_CORPORATE_ROLE',
      category: 'security',
      targetResource: `organizationUsers/${orgUser.id}`,
      details: { userEmail: user.userEmail, role: user.corporateRole },
      ipAddress: '127.0.0.1'
    });
    return orgUser;
  }

  public static getRegionalManagers(orgId: string): RegionalManager[] {
    return organizationRepository.getRegionalManagers(orgId);
  }

  public static createRegionalManager(rm: Omit<RegionalManager, 'id' | 'createdAt'>): RegionalManager {
    return organizationRepository.createRegionalManager(rm);
  }

  // Cross-Property Metrics Calculation & Consolidation Engine
  public static getCrossPropertyMetrics(filter: CrossPropertyFilter): {
    properties: PropertyMetrics[];
    summary: {
      totalRevenue: number;
      revenueInDisplayCurrency: number;
      averageOccupancy: number;
      overallAdr: number;
      overallRevpar: number;
      totalBookings: number;
      cancellationRate: number;
      totalRooms: number;
      totalOccupiedRooms: number;
      maintenancePendingCount: number;
      housekeepingPendingCount: number;
      displayCurrency: string;
    };
  } {
    // Simulated live properties dataset across multi-organizations & brands
    const MOCK_PROPERTIES: PropertyMetrics[] = [
      {
        propertyId: 'prop-1',
        propertyName: 'Sanctuary Alpine Lodge',
        brandId: 'brand-boutique-retreats',
        brandName: 'StayFlow Sanctuary Retreats',
        organizationId: 'org-stayflow-global',
        organizationName: 'StayFlow Luxury Resorts',
        country: 'US',
        countryFlag: '🇺🇸',
        totalRooms: 24,
        occupiedRooms: 20,
        occupancyRate: 83.3,
        totalRevenue: 142500,
        adr: 285.0,
        revpar: 237.5,
        totalBookings: 118,
        cancellations: 5,
        cancellationRate: 4.2,
        maintenancePending: 2,
        housekeepingPending: 3,
        nativeCurrency: 'USD',
        revenueInBaseCurrency: 142500
      },
      {
        propertyId: 'prop-2',
        propertyName: 'Sanctuary Sierra Nevada',
        brandId: 'brand-boutique-retreats',
        brandName: 'StayFlow Sanctuary Retreats',
        organizationId: 'org-stayflow-global',
        organizationName: 'StayFlow Luxury Resorts',
        country: 'ES',
        countryFlag: '🇪🇸',
        totalRooms: 18,
        occupiedRooms: 15,
        occupancyRate: 83.3,
        totalRevenue: 98000,
        adr: 217.7,
        revpar: 181.4,
        totalBookings: 84,
        cancellations: 3,
        cancellationRate: 3.5,
        maintenancePending: 1,
        housekeepingPending: 2,
        nativeCurrency: 'EUR',
        revenueInBaseCurrency: 106520 //Converted
      },
      {
        propertyId: 'prop-3',
        propertyName: 'Terra Eco Domes Atacama',
        brandId: 'brand-eco-glamping-co',
        brandName: 'Terra Eco Glamping Collection',
        organizationId: 'org-stayflow-global',
        organizationName: 'StayFlow Luxury Resorts',
        country: 'CL',
        countryFlag: '🇨🇱',
        totalRooms: 15,
        occupiedRooms: 13,
        occupancyRate: 86.6,
        totalRevenue: 78500000, // CLP
        adr: 180000,
        revpar: 155882,
        totalBookings: 92,
        cancellations: 4,
        cancellationRate: 4.3,
        maintenancePending: 0,
        housekeepingPending: 1,
        nativeCurrency: 'CLP',
        revenueInBaseCurrency: 83510 // Converted to USD
      },
      {
        propertyId: 'prop-4',
        propertyName: 'Terra Canopy Amazonia',
        brandId: 'brand-eco-glamping-co',
        brandName: 'Terra Eco Glamping Collection',
        organizationId: 'org-stayflow-global',
        organizationName: 'StayFlow Luxury Resorts',
        country: 'BR',
        countryFlag: '🇧🇷',
        totalRooms: 20,
        occupiedRooms: 17,
        occupancyRate: 85.0,
        totalRevenue: 420000, // BRL
        adr: 820,
        revpar: 697,
        totalBookings: 105,
        cancellations: 6,
        cancellationRate: 5.7,
        maintenancePending: 3,
        housekeepingPending: 4,
        nativeCurrency: 'BRL',
        revenueInBaseCurrency: 77064
      },
      {
        propertyId: 'prop-5',
        propertyName: 'Sanctuary Bariloche Lakes',
        brandId: 'brand-boutique-retreats',
        brandName: 'StayFlow Sanctuary Retreats',
        organizationId: 'org-stayflow-global',
        organizationName: 'StayFlow Luxury Resorts',
        country: 'AR',
        countryFlag: '🇦🇷',
        totalRooms: 16,
        occupiedRooms: 12,
        occupancyRate: 75.0,
        totalRevenue: 68000000, // ARS
        adr: 180000,
        revpar: 135000,
        totalBookings: 78,
        cancellations: 4,
        cancellationRate: 5.1,
        maintenancePending: 1,
        housekeepingPending: 2,
        nativeCurrency: 'ARS',
        revenueInBaseCurrency: 73913
      },
      {
        propertyId: 'prop-6',
        propertyName: 'Aetheria Executive Suites CDMX',
        brandId: 'brand-urban-suites',
        brandName: 'Aetheria City Living & Suites',
        organizationId: 'org-stayflow-global',
        organizationName: 'StayFlow Luxury Resorts',
        country: 'MX',
        countryFlag: '🇲🇽',
        totalRooms: 32,
        occupiedRooms: 28,
        occupancyRate: 87.5,
        totalRevenue: 1850000, // MXN
        adr: 2200,
        revpar: 1925,
        totalBookings: 160,
        cancellations: 8,
        cancellationRate: 5.0,
        maintenancePending: 2,
        housekeepingPending: 5,
        nativeCurrency: 'MXN',
        revenueInBaseCurrency: 101369
      }
    ];

    // Filter properties
    let filtered = MOCK_PROPERTIES;

    if (filter.organizationId) {
      filtered = filtered.filter(p => p.organizationId === filter.organizationId);
    }
    if (filter.brandId) {
      filtered = filtered.filter(p => p.brandId === filter.brandId);
    }
    if (filter.country) {
      filtered = filtered.filter(p => p.country === filter.country);
    }
    if (filter.propertyId) {
      filtered = filtered.filter(p => p.propertyId === filter.propertyId);
    }

    // Currencies list for rate conversion
    const currencies = localizationRepository.getCurrencies();
    const targetCurrencyObj = currencies.find(c => c.code === filter.displayCurrency) || currencies[0];
    const targetRate = targetCurrencyObj.exchangeRateToBase || 1.0;

    let totalRoomsSum = 0;
    let occupiedRoomsSum = 0;
    let totalRevBaseSum = 0;
    let totalBookingsSum = 0;
    let totalCancellationsSum = 0;
    let maintenanceCount = 0;
    let housekeepingCount = 0;

    filtered.forEach(p => {
      totalRoomsSum += p.totalRooms;
      occupiedRoomsSum += p.occupiedRooms;
      totalRevBaseSum += p.revenueInBaseCurrency;
      totalBookingsSum += p.totalBookings;
      totalCancellationsSum += p.cancellations;
      maintenanceCount += p.maintenancePending;
      housekeepingCount += p.housekeepingPending;
    });

    const averageOccupancy = totalRoomsSum > 0 ? (occupiedRoomsSum / totalRoomsSum) * 100 : 0;
    const overallAdrInBase = totalBookingsSum > 0 ? totalRevBaseSum / totalBookingsSum : 0;
    const overallRevparInBase = totalRoomsSum > 0 ? totalRevBaseSum / totalRoomsSum : 0;
    const cancellationRate = totalBookingsSum > 0 ? (totalCancellationsSum / totalBookingsSum) * 100 : 0;

    const revenueInDisplayCurrency = totalRevBaseSum * targetRate;

    return {
      properties: filtered,
      summary: {
        totalRevenue: totalRevBaseSum,
        revenueInDisplayCurrency,
        averageOccupancy: Math.round(averageOccupancy * 10) / 10,
        overallAdr: Math.round(overallAdrInBase * targetRate * 100) / 100,
        overallRevpar: Math.round(overallRevparInBase * targetRate * 100) / 100,
        totalBookings: totalBookingsSum,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        totalRooms: totalRoomsSum,
        totalOccupiedRooms: occupiedRoomsSum,
        maintenancePendingCount: maintenanceCount,
        housekeepingPendingCount: housekeepingCount,
        displayCurrency: filter.displayCurrency
      }
    };
  }
}
