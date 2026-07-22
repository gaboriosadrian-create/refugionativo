import {
  Organization,
  Brand,
  OrganizationSettings,
  OrganizationUser,
  RegionalManager,
  EnterprisePolicy
} from '../types';

// Initial seed data for multi-organization enterprise structures
const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-stayflow-global',
    name: 'StayFlow Luxury Resorts & Hotels Group',
    code: 'STAYFLOW-CORP',
    logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=120&q=80',
    baseCurrency: 'USD',
    defaultTimezone: 'America/New_York',
    country: 'US',
    plan: 'enterprise',
    status: 'active',
    brandIds: ['brand-boutique-retreats', 'brand-eco-glamping-co', 'brand-urban-suites'],
    propertyCount: 8,
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2026-06-10T12:00:00.000Z',
  },
  {
    id: 'org-andina-hospitality',
    name: 'Andina Latam Hospitality Chain',
    code: 'ANDINA-LATAM',
    logoUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=120&q=80',
    baseCurrency: 'EUR',
    defaultTimezone: 'America/Santiago',
    country: 'CL',
    plan: 'enterprise',
    status: 'active',
    brandIds: ['brand-cabanas-andinas'],
    propertyCount: 4,
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  }
];

const INITIAL_BRANDS: Brand[] = [
  {
    id: 'brand-boutique-retreats',
    organizationId: 'org-stayflow-global',
    name: 'StayFlow Sanctuary Retreats',
    slug: 'sanctuary-retreats',
    logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=100&q=80',
    brandColor: '#0f766e',
    secondaryColor: '#f0fdf4',
    description: 'Colección ultra-exclusiva de cabañas de montaña y villas privadas.',
    propertyIds: ['prop-1', 'prop-2', 'prop-5'],
    createdAt: '2025-01-16T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
  },
  {
    id: 'brand-eco-glamping-co',
    organizationId: 'org-stayflow-global',
    name: 'Terra Eco Glamping Collection',
    slug: 'terra-eco-glamping',
    logoUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=100&q=80',
    brandColor: '#15803d',
    secondaryColor: '#fefce8',
    description: 'Experiencias de glamping sostenible en parques nacionales y bosques primarios.',
    propertyIds: ['prop-3', 'prop-4'],
    createdAt: '2025-02-10T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
  },
  {
    id: 'brand-urban-suites',
    organizationId: 'org-stayflow-global',
    name: 'Aetheria City Living & Suites',
    slug: 'aetheria-city-suites',
    logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=100&q=80',
    brandColor: '#1e293b',
    secondaryColor: '#f1f5f9',
    description: 'Apartahoteles corporativos de alto estándar en principales capitales.',
    propertyIds: ['prop-6', 'prop-7', 'prop-8'],
    createdAt: '2025-04-05T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
  }
];

const INITIAL_ORG_USERS: OrganizationUser[] = [
  {
    id: 'orguser-1',
    organizationId: 'org-stayflow-global',
    userId: 'usr-corp-admin-01',
    userEmail: 'director.global@stayflow.com',
    userName: 'Carlos Mendoza',
    corporateRole: 'CORPORATE_ADMIN',
    assignedBrands: ['brand-boutique-retreats', 'brand-eco-glamping-co', 'brand-urban-suites'],
    assignedCountries: ['US', 'ES', 'BR', 'CL', 'AR', 'MX'],
    assignedPropertyIds: ['prop-1', 'prop-2', 'prop-3', 'prop-4', 'prop-5', 'prop-6', 'prop-7', 'prop-8'],
    status: 'active',
    createdAt: '2025-01-15T00:00:00.000Z',
    lastLogin: '2026-07-22T08:30:00.000Z'
  },
  {
    id: 'orguser-2',
    organizationId: 'org-stayflow-global',
    userId: 'usr-regional-latam',
    userEmail: 'latam.manager@stayflow.com',
    userName: 'Sofia Albarracin',
    corporateRole: 'REGIONAL_MANAGER',
    assignedBrands: ['brand-boutique-retreats', 'brand-eco-glamping-co'],
    assignedCountries: ['CL', 'AR', 'BR'],
    assignedPropertyIds: ['prop-1', 'prop-3', 'prop-4'],
    status: 'active',
    createdAt: '2025-02-01T00:00:00.000Z',
    lastLogin: '2026-07-21T14:15:00.000Z'
  },
  {
    id: 'orguser-3',
    organizationId: 'org-stayflow-global',
    userId: 'usr-financial-chief',
    userEmail: 'cfo@stayflow.com',
    userName: 'Mariano Silva',
    corporateRole: 'FINANCIAL_MANAGER',
    assignedBrands: ['brand-boutique-retreats', 'brand-eco-glamping-co', 'brand-urban-suites'],
    assignedCountries: ['US', 'ES', 'BR', 'CL', 'AR'],
    assignedPropertyIds: ['prop-1', 'prop-2', 'prop-3', 'prop-4', 'prop-5'],
    status: 'active',
    createdAt: '2025-03-10T00:00:00.000Z',
    lastLogin: '2026-07-22T06:00:00.000Z'
  }
];

const INITIAL_REGIONAL_MANAGERS: RegionalManager[] = [
  {
    id: 'rm-01',
    organizationId: 'org-stayflow-global',
    userId: 'usr-regional-latam',
    userEmail: 'latam.manager@stayflow.com',
    userName: 'Sofia Albarracin',
    regionCode: 'LATAM-SOUTH',
    regionName: 'Sudamérica (Chile, Argentina, Brasil)',
    assignedCountries: ['CL', 'AR', 'BR'],
    propertyIds: ['prop-1', 'prop-3', 'prop-4'],
    createdAt: '2025-02-01T00:00:00.000Z'
  },
  {
    id: 'rm-02',
    organizationId: 'org-stayflow-global',
    userId: 'usr-regional-europe',
    userEmail: 'europe.manager@stayflow.com',
    userName: 'Jean-Luc Moreau',
    regionCode: 'EU-WEST',
    regionName: 'Europa Occidental (España, Portugal, Francia)',
    assignedCountries: ['ES', 'PT', 'FR'],
    propertyIds: ['prop-2', 'prop-5'],
    createdAt: '2025-02-15T00:00:00.000Z'
  }
];

const INITIAL_POLICIES: EnterprisePolicy[] = [
  {
    id: 'policy-canc-global',
    organizationId: 'org-stayflow-global',
    policyType: 'cancellation',
    name: 'Política Estándar de Cancelación Flexible 48h',
    content: 'Reembolso total del depósito hasta 48 horas antes de la fecha de Check-In programada.',
    version: '2.1',
    isGlobal: true,
    appliesToBrands: ['brand-boutique-retreats', 'brand-eco-glamping-co'],
    createdAt: '2025-01-20T00:00:00.000Z',
    updatedAt: '2026-03-15T00:00:00.000Z'
  },
  {
    id: 'policy-sec-global',
    organizationId: 'org-stayflow-global',
    policyType: 'security',
    name: 'Protocolo de Seguridad de Datos e Identidad de Huéspedes',
    content: 'Encriptación obligatoria de documentos de identidad, tokens PCI-DSS para tarjetas y retención auditada de logs.',
    version: '1.4',
    isGlobal: true,
    appliesToBrands: ['brand-boutique-retreats', 'brand-eco-glamping-co', 'brand-urban-suites'],
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z'
  }
];

class OrganizationRepository {
  private organizations: Organization[] = [...INITIAL_ORGANIZATIONS];
  private brands: Brand[] = [...INITIAL_BRANDS];
  private orgUsers: OrganizationUser[] = [...INITIAL_ORG_USERS];
  private regionalManagers: RegionalManager[] = [...INITIAL_REGIONAL_MANAGERS];
  private policies: EnterprisePolicy[] = [...INITIAL_POLICIES];

  public getOrganizations(): Organization[] {
    return this.organizations;
  }

  public getOrganizationById(id: string): Organization | undefined {
    return this.organizations.find(o => o.id === id);
  }

  public createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Organization {
    const newOrg: Organization = {
      ...data,
      id: `org-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.organizations.push(newOrg);
    return newOrg;
  }

  public updateOrganization(id: string, updates: Partial<Organization>): Organization | null {
    const idx = this.organizations.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.organizations[idx] = {
      ...this.organizations[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.organizations[idx];
  }

  // Brands
  public getBrandsByOrg(organizationId: string): Brand[] {
    return this.brands.filter(b => b.organizationId === organizationId);
  }

  public getAllBrands(): Brand[] {
    return this.brands;
  }

  public createBrand(data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>): Brand {
    const newBrand: Brand = {
      ...data,
      id: `brand-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.brands.push(newBrand);
    // Link to org
    const org = this.getOrganizationById(data.organizationId);
    if (org && !org.brandIds.includes(newBrand.id)) {
      org.brandIds.push(newBrand.id);
    }
    return newBrand;
  }

  // Org Users & RBAC
  public getOrganizationUsers(organizationId: string): OrganizationUser[] {
    return this.orgUsers.filter(u => u.organizationId === organizationId);
  }

  public addOrganizationUser(user: Omit<OrganizationUser, 'id' | 'createdAt'>): OrganizationUser {
    const newUser: OrganizationUser = {
      ...user,
      id: `orguser-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.orgUsers.push(newUser);
    return newUser;
  }

  // Regional Managers
  public getRegionalManagers(organizationId: string): RegionalManager[] {
    return this.regionalManagers.filter(rm => rm.organizationId === organizationId);
  }

  public createRegionalManager(rm: Omit<RegionalManager, 'id' | 'createdAt'>): RegionalManager {
    const newRM: RegionalManager = {
      ...rm,
      id: `rm-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.regionalManagers.push(newRM);
    return newRM;
  }

  // Enterprise Policies
  public getPolicies(organizationId: string): EnterprisePolicy[] {
    return this.policies.filter(p => p.organizationId === organizationId);
  }

  public createPolicy(policy: Omit<EnterprisePolicy, 'id' | 'createdAt' | 'updatedAt'>): EnterprisePolicy {
    const newPolicy: EnterprisePolicy = {
      ...policy,
      id: `policy-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.policies.push(newPolicy);
    return newPolicy;
  }
}

export const organizationRepository = new OrganizationRepository();
