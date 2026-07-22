import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { getDocument, saveDocument, queryCollection } from '../../../core/firebase/firestore';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { 
  CommercialPlan, 
  CommercialLead, 
  CustomerOnboardingProgress, 
  BillingProfile, 
  CommercialMetrics,
  SaaSPlanType
} from '../types';
import { Resort, AppSettings, ResortUser } from '../../../types';
import { TenantConfigService } from '../../../core/tenant/TenantConfigService';

// Default mock plans to seed
const DEFAULT_PLANS: CommercialPlan[] = [
  {
    id: 'Starter',
    name: 'StayFlow Starter',
    price: 49,
    billingPeriod: 'monthly',
    maxAccommodations: 1,
    maxRooms: 5,
    maxUsers: 2,
    storageGB: 5,
    supportLevel: 'Email',
    integrations: ['WhatsApp Integration'],
    features: ['Motor de Reservas', 'Gestión de Huéspedes', 'PMS Simple'],
    active: true
  },
  {
    id: 'Professional',
    name: 'StayFlow Professional',
    price: 99,
    billingPeriod: 'monthly',
    maxAccommodations: 3,
    maxRooms: 20,
    maxUsers: 5,
    storageGB: 20,
    supportLevel: 'Chat & Email',
    integrations: ['WhatsApp Integration', 'Mercado Pago', 'Stripe'],
    features: ['Motor de Reservas', 'Gestión de Huéspedes', 'PMS Completo', 'Pagos Online', 'Estadísticas Base'],
    active: true
  },
  {
    id: 'Business',
    name: 'StayFlow Business',
    price: 199,
    billingPeriod: 'monthly',
    maxAccommodations: 10,
    maxRooms: 100,
    maxUsers: 15,
    storageGB: 100,
    supportLevel: '24/7 Priority Phone',
    integrations: ['WhatsApp Integration', 'Mercado Pago', 'Stripe', 'Google Calendar', 'Airbnb Sync'],
    features: ['Todo lo de Professional', 'Asistente de IA (Copilot)', 'Múltiples Propiedades', 'Revenue Engine', 'BI & Analytics Avanzado'],
    active: true
  },
  {
    id: 'Enterprise',
    name: 'StayFlow Enterprise',
    price: 399,
    billingPeriod: 'monthly',
    maxAccommodations: 99,
    maxRooms: 999,
    maxUsers: 99,
    storageGB: 1000,
    supportLevel: 'Dedicated Account Manager',
    integrations: ['Integraciones Ilimitadas', 'Open API', 'Channel Manager Realtime', 'Custom Gateways'],
    features: ['Todo lo de Business', 'SLA Garantizado', 'Desarrollo a Medida', 'Multi-Tenant Completo', 'Super Admin Dedicado'],
    active: true
  }
];

// Seed initial leads/demos
const DEFAULT_LEADS: CommercialLead[] = [
  {
    id: 'lead-1',
    companyName: 'Altos del Bosque Cabañas',
    contactName: 'Carlos Gómez',
    email: 'carlos@altosdelbosque.com',
    phone: '+5492944112233',
    country: 'Argentina',
    accommodationType: 'CABIN',
    roomCount: 8,
    message: 'Interesados en migrar nuestro PMS actual a StayFlow para automatizar reservas.',
    status: 'Lead',
    stageHistory: [
      { stage: 'Lead', timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), note: 'Registrado desde la web comercial' }
    ],
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'lead-2',
    companyName: 'Hotel Sol y Arena',
    contactName: 'Lucía Fernández',
    email: 'lucia.f@hotelsolyarena.com',
    phone: '+59899123456',
    country: 'Uruguay',
    accommodationType: 'HOTEL',
    roomCount: 25,
    message: 'Quisiéramos ver una demostración del motor de reservas e integración con Stripe.',
    status: 'Demo',
    stageHistory: [
      { stage: 'Lead', timestamp: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(), note: 'Registrado desde la web comercial' },
      { stage: 'Demo', timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), note: 'Demo agendada para el jueves 23 de julio' }
    ],
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'lead-3',
    companyName: 'EcoGlamping Domes',
    contactName: 'Mateo Rivas',
    email: 'contacto@ecoglamping.cl',
    phone: '+56988776655',
    country: 'Chile',
    accommodationType: 'GLAMPING',
    roomCount: 12,
    message: 'Excelente propuesta. Solicitamos cotización para plan Business.',
    status: 'Proposal',
    stageHistory: [
      { stage: 'Lead', timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
      { stage: 'Demo', timestamp: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() },
      { stage: 'Proposal', timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), note: 'Propuesta enviada por email' }
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'lead-4',
    companyName: 'Hostel Patagonia',
    contactName: 'Juliana Martínez',
    email: 'juliana@hostelpatagonia.com',
    phone: '+5492945887766',
    country: 'Argentina',
    accommodationType: 'HOSTEL',
    roomCount: 18,
    message: 'Negociando descuento por pago anual de plan Starter.',
    status: 'Negotiation',
    stageHistory: [
      { stage: 'Lead', timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
      { stage: 'Demo', timestamp: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString() },
      { stage: 'Proposal', timestamp: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString() },
      { stage: 'Negotiation', timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), note: 'Ofrecido 15% de descuento en plan Starter anual' }
    ],
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  }
];

const DEFAULT_METRICS: CommercialMetrics = {
  totalLeads: 24,
  totalDemos: 14,
  conversionRate: 18.5,
  mrr: 1540,
  arr: 18480,
  churnRate: 1.2,
  activeClientsCount: 12,
  demosScheduledCount: 3,
  planDistribution: {
    Starter: 3,
    Professional: 6,
    Business: 2,
    Enterprise: 1
  },
  monthlyRevenueHistory: [
    { month: 'Ene', revenue: 800 },
    { month: 'Feb', revenue: 950 },
    { month: 'Mar', revenue: 1100 },
    { month: 'Abr', revenue: 1250 },
    { month: 'May', revenue: 1400 },
    { month: 'Jun', revenue: 1540 }
  ]
};

export class CommercialService {
  /**
   * Initialize collections if empty
   */
  public static async initializeData() {
    if (!LocalSaaSDb.get<CommercialPlan[]>('commercialPlans')) {
      LocalSaaSDb.set('commercialPlans', DEFAULT_PLANS);
    }
    if (!LocalSaaSDb.get<CommercialLead[]>('commercialLeads')) {
      LocalSaaSDb.set('commercialLeads', DEFAULT_LEADS);
    }
    if (!LocalSaaSDb.get<CommercialMetrics>('commercialMetrics')) {
      LocalSaaSDb.set('commercialMetrics', DEFAULT_METRICS);
    }
    if (!LocalSaaSDb.get<BillingProfile[]>('billingProfiles')) {
      LocalSaaSDb.set('billingProfiles', []);
    }
  }

  /**
   * Get all commercial plans
   */
  public static async getPlans(): Promise<CommercialPlan[]> {
    await this.initializeData();
    if (isFirebaseConfigured) {
      try {
        const plans = await queryCollection('commercialPlans');
        if (plans && plans.length > 0) return plans as any as CommercialPlan[];
      } catch (err) {
        console.warn('Error fetching commercialPlans from Firestore:', err);
      }
    }
    return LocalSaaSDb.get<CommercialPlan[]>('commercialPlans') || DEFAULT_PLANS;
  }

  /**
   * Save / Update a commercial plan
   */
  public static async savePlan(plan: CommercialPlan): Promise<void> {
    const plans = await this.getPlans();
    const idx = plans.findIndex(p => p.id === plan.id);
    if (idx >= 0) {
      plans[idx] = plan;
    } else {
      plans.push(plan);
    }
    LocalSaaSDb.set('commercialPlans', plans);

    if (isFirebaseConfigured) {
      try {
        await saveDocument(`commercialPlans/${plan.id}`, plan, true);
      } catch (err) {
        console.error('Error saving plan to Firestore:', err);
      }
    }
  }

  /**
   * Get all commercial leads
   */
  public static async getLeads(): Promise<CommercialLead[]> {
    await this.initializeData();
    if (isFirebaseConfigured) {
      try {
        const leads = await queryCollection('commercialLeads');
        if (leads && leads.length > 0) return leads as any as CommercialLead[];
      } catch (err) {
        console.warn('Error fetching commercialLeads from Firestore:', err);
      }
    }
    return LocalSaaSDb.get<CommercialLead[]>('commercialLeads') || DEFAULT_LEADS;
  }

  /**
   * Save a Lead / Submit Demo Request
   */
  public static async submitDemoRequest(leadData: Omit<CommercialLead, 'id' | 'status' | 'stageHistory' | 'createdAt'>): Promise<CommercialLead> {
    await this.initializeData();
    const leads = await this.getLeads();
    const newLead: CommercialLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      status: 'Lead',
      stageHistory: [
        { stage: 'Lead', timestamp: new Date().toISOString(), note: 'Nueva solicitud de demo desde el portal web comercial.' }
      ],
      createdAt: new Date().toISOString()
    };

    leads.push(newLead);
    LocalSaaSDb.set('commercialLeads', leads);

    // Save to demoRequests collection too as requested by Firestore guidelines
    if (isFirebaseConfigured) {
      try {
        await saveDocument(`commercialLeads/${newLead.id}`, newLead, true);
        await saveDocument(`demoRequests/${newLead.id}`, newLead, true);
      } catch (err) {
        console.error('Error writing lead to Firestore:', err);
      }
    }

    // Trigger Notification Engine
    try {
      const notifications = LocalSaaSDb.get<any[]>('notifications_system') || [];
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Nueva Solicitud de Demo SaaS',
        message: `El cliente "${newLead.contactName}" de "${newLead.companyName}" (${newLead.country}) ha solicitado una demo para ${newLead.roomCount} habitaciones.`,
        type: 'SYSTEM',
        read: false,
        timestamp: new Date().toISOString()
      });
      LocalSaaSDb.set('notifications_system', notifications);
    } catch (e) {
      console.warn('Notification engine logging failed:', e);
    }

    // Update Analytics Commercial
    await this.recalculateMetrics();

    return newLead;
  }

  /**
   * Update lead stage in CRM
   */
  public static async updateLeadStage(leadId: string, newStage: CommercialLead['status'], note?: string): Promise<CommercialLead> {
    const leads = await this.getLeads();
    const idx = leads.findIndex(l => l.id === leadId);
    if (idx < 0) throw new Error('Lead not found');

    const lead = leads[idx];
    const prevStage = lead.status;
    lead.status = newStage;
    lead.stageHistory.push({
      stage: newStage,
      timestamp: new Date().toISOString(),
      note: note || `Cambio de estado de ${prevStage} a ${newStage}`
    });

    leads[idx] = lead;
    LocalSaaSDb.set('commercialLeads', leads);

    if (isFirebaseConfigured) {
      try {
        await saveDocument(`commercialLeads/${leadId}`, lead, true);
        await saveDocument(`salesPipeline/${leadId}`, { leadId, stage: newStage, history: lead.stageHistory }, true);
      } catch (err) {
        console.error('Error updating lead in Firestore:', err);
      }
    }

    await this.recalculateMetrics();
    return lead;
  }

  /**
   * Get commercial dashboard metrics
   */
  public static async getMetrics(): Promise<CommercialMetrics> {
    await this.initializeData();
    if (isFirebaseConfigured) {
      try {
        const doc = await getDocument('commercialMetrics/summary');
        if (doc) return doc as any as CommercialMetrics;
      } catch (err) {
        console.warn('Error fetching commercialMetrics from Firestore:', err);
      }
    }
    return LocalSaaSDb.get<CommercialMetrics>('commercialMetrics') || DEFAULT_METRICS;
  }

  /**
   * Recalculate metrics based on lead database
   */
  private static async recalculateMetrics() {
    const leads = await this.getLeads();
    const billingProfiles = await this.getBillingProfiles();
    
    const totalLeads = leads.length;
    const totalDemos = leads.filter(l => l.status !== 'Lead').length;
    const activeClientsCount = leads.filter(l => l.status === 'Cliente').length;
    const demosScheduledCount = leads.filter(l => l.status === 'Demo').length;

    const conversionRate = totalLeads > 0 ? Number(((activeClientsCount / totalLeads) * 100).toFixed(1)) : 0;
    
    // Calculate MRR from active billing profiles
    const mrr = billingProfiles
      .filter(p => p.status === 'active')
      .reduce((sum, p) => sum + p.amount, 0);
    const arr = mrr * 12;

    const currentMetrics = LocalSaaSDb.get<CommercialMetrics>('commercialMetrics') || DEFAULT_METRICS;
    const updatedMetrics: CommercialMetrics = {
      ...currentMetrics,
      totalLeads,
      totalDemos,
      conversionRate,
      mrr: mrr || currentMetrics.mrr,
      arr: arr || currentMetrics.arr,
      activeClientsCount,
      demosScheduledCount
    };

    LocalSaaSDb.set('commercialMetrics', updatedMetrics);
    if (isFirebaseConfigured) {
      try {
        await saveDocument('commercialMetrics/summary', updatedMetrics, true);
      } catch (e) {
        console.error('Firestore save of commercial metrics failed:', e);
      }
    }
  }

  /**
   * Get all billing profiles
   */
  public static async getBillingProfiles(): Promise<BillingProfile[]> {
    await this.initializeData();
    if (isFirebaseConfigured) {
      try {
        const list = await queryCollection('billingProfiles');
        if (list && list.length > 0) return list as any as BillingProfile[];
      } catch (err) {
        console.warn('Error fetching billingProfiles from Firestore:', err);
      }
    }
    return LocalSaaSDb.get<BillingProfile[]>('billingProfiles') || [];
  }

  /**
   * Save billing profile
   */
  public static async saveBillingProfile(profile: BillingProfile): Promise<void> {
    const profiles = await this.getBillingProfiles();
    const idx = profiles.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    LocalSaaSDb.set('billingProfiles', profiles);

    if (isFirebaseConfigured) {
      try {
        await saveDocument(`billingProfiles/${profile.id}`, profile, true);
      } catch (err) {
        console.error('Error saving billing profile to Firestore:', err);
      }
    }
    await this.recalculateMetrics();
  }

  /**
   * Get customer onboarding progress for a tenant
   */
  public static async getOnboardingProgress(tenantId: string): Promise<CustomerOnboardingProgress | null> {
    if (isFirebaseConfigured) {
      try {
        const doc = await getDocument(`customerOnboarding/${tenantId}`);
        if (doc) return doc as any as CustomerOnboardingProgress;
      } catch (err) {
        console.warn('Error fetching customerOnboarding from Firestore:', err);
      }
    }
    return LocalSaaSDb.get<CustomerOnboardingProgress>(`customer_onboarding_wizard_${tenantId}`);
  }

  /**
   * Save customer onboarding progress
   */
  public static async saveOnboardingProgress(progress: CustomerOnboardingProgress): Promise<void> {
    LocalSaaSDb.set(`customer_onboarding_wizard_${progress.id}`, progress);
    if (isFirebaseConfigured) {
      try {
        await saveDocument(`customerOnboarding/${progress.id}`, progress, true);
      } catch (err) {
        console.error('Error saving customerOnboarding to Firestore:', err);
      }
    }
  }

  /**
   * MÓDULO 4 & MÓDULO 6 — Alta Automática de Tenant & Tenant Provisioning
   * Create a tenant fully configured from a single process.
   */
  public static async provisionTenant(lead: CommercialLead, planType: SaaSPlanType): Promise<string> {
    const tenantId = lead.companyName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const finalTenantId = tenantId || `tenant-${Date.now()}`;

    // 1. Check if already exists in resorts
    const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
    if (resorts.some(r => r.id === finalTenantId)) {
      throw new Error(`El tenant "${finalTenantId}" ya está registrado en la base de datos.`);
    }

    // 2. Create the Resort record representing the Tenant (MÓDULO 4: create tenant, collections)
    const newResort: Resort = {
      id: finalTenantId,
      name: lead.companyName,
      slug: finalTenantId,
      businessType: (lead.accommodationType === 'HOSTEL' ? 'OTHER' : lead.accommodationType) as any,
      plan: planType.toLowerCase() as any,
      active: true,
      logo: '',
      coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=84',
      email: lead.email,
      phone: lead.phone,
      website: `https://${finalTenantId}.stayflow.app`,
      domain: `${finalTenantId}.stayflow.app`,
      country: lead.country,
      timezone: 'America/Argentina/Buenos_Aires',
      currency: lead.country === 'Argentina' ? 'ARS' : 'USD',
      language: 'es',
      createdAt: new Date().toISOString()
    };

    resorts.push(newResort);
    LocalSaaSDb.set('resorts', resorts);

    // Write to firestore if configured
    if (isFirebaseConfigured) {
      try {
        await saveDocument(`resorts/${finalTenantId}`, newResort, true);
        await saveDocument(`tenants/${finalTenantId}`, {
          id: finalTenantId,
          name: lead.companyName,
          plan: planType,
          status: 'active',
          ownerEmail: lead.email,
          createdAt: new Date().toISOString()
        }, true);
      } catch (err) {
        console.error('Firestore tenant save failed:', err);
      }
    }

    // 3. Create SaaS config (TenantConfig)
    const saasConfig = TenantConfigService.getDefaultConfig(finalTenantId);
    saasConfig.commercialName = lead.companyName;
    saasConfig.contractedPlan = planType;
    saasConfig.domain = `${finalTenantId}.stayflow.app`;
    saasConfig.emails.supportEmail = lead.email;
    saasConfig.emails.bookingNotificationsEmail = lead.email;
    await TenantConfigService.saveTenantConfig(finalTenantId, saasConfig);

    // 4. Create Initial User Profile if doesn't exist
    const users = LocalSaaSDb.get<any[]>('users') || [];
    let userProfile = users.find(u => u.email === lead.email);
    const userId = userProfile ? userProfile.uid : `user-${Date.now()}`;
    if (!userProfile) {
      userProfile = {
        uid: userId,
        displayName: lead.contactName,
        email: lead.email,
        photoURL: '',
        active: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      users.push(userProfile);
      LocalSaaSDb.set('users', users);
    }

    // 5. Create ResortUser (Role: owner)
    const resortUsers = LocalSaaSDb.get<ResortUser[]>('resortUsers') || [];
    const newResortUser: ResortUser = {
      id: `ru-${Date.now()}`,
      userId: userId,
      resortId: finalTenantId,
      role: 'owner',
      active: true,
      createdAt: new Date().toISOString()
    };
    resortUsers.push(newResortUser);
    LocalSaaSDb.set('resortUsers', resortUsers);

    // 6. Populate default collections for the tenant: accommodations, bookings, website CMS settings, pages, amenities (Tenant Provisioning)
    const defaultSettings: any = {
      appName: lead.companyName,
      appSubtitle: lead.accommodationType === 'GLAMPING' ? 'Glamping & Estrellas' : 'Estadías perfectas',
      logoIcon: 'trees',
      address: `Ubicación en ${lead.country}`,
      locationDetails: `Ubicación en ${lead.country}`,
      googleMapsLink: '',
      hours: 'Atención 24hs',
      phone: lead.phone,
      whatsapp: lead.phone,
      email: lead.email,
      instagram: '',
      facebook: '',
      bookingPolicy: 'Garantía con tarjeta de crédito o transferencia bancaria.',
      cancellationPolicy: 'Cancelación gratuita hasta 7 días antes de la llegada.',
      welcomeTitle: `Bienvenido a ${lead.companyName}`,
      welcomeSubtitle: 'Descubre la tranquilidad de reconectar con la naturaleza',
      themeColor: '#07140e',
      accentColor: '#dca54c',
      termsLink: '',
      policiesLink: ''
    };
    LocalSaaSDb.set(`settings_${finalTenantId}`, defaultSettings);

    const defaultAccommodations = [
      {
        id: 101,
        name: 'Suite Forest Premium',
        category: 'couples',
        price: lead.country === 'Argentina' ? 85000 : 90,
        discount: 10,
        description: 'Exclusiva cabaña para dos personas con deck privado, hidromasaje y ventanales panorámicos al bosque.',
        image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80',
        capacity: 2,
        roomsCount: 1,
        active: true
      },
      {
        id: 102,
        name: 'Cabaña Familiar Alpina',
        category: 'family',
        price: lead.country === 'Argentina' ? 140000 : 150,
        discount: 0,
        description: 'Amplia cabaña de dos plantas totalmente equipada para hasta 5 personas, ideal para disfrutar en familia.',
        image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=800&q=80',
        capacity: 5,
        roomsCount: 2,
        active: true
      }
    ];
    LocalSaaSDb.set(`accommodations_${finalTenantId}`, defaultAccommodations);
    LocalSaaSDb.set(`bookings_${finalTenantId}`, []);

    const defaultPages = [
      { id: 'home', title: 'Inicio', slug: 'home', active: true, sections: [] },
      { id: 'accommodations', title: 'Cabañas', slug: 'accommodations', active: true, sections: [] },
      { id: 'contact', title: 'Contacto', slug: 'contact', active: true, sections: [] }
    ];
    LocalSaaSDb.set(`pages_${finalTenantId}`, defaultPages);

    const defaultAmenities = [
      { id: 'wifi', name: 'WiFi Starlink', icon: 'Wifi', category: 'General' },
      { id: 'calefaccion', name: 'Calefacción central', icon: 'Flame', category: 'Climatización' },
      { id: 'estacionamiento', name: 'Estacionamiento', icon: 'Compass', category: 'Servicios' }
    ];
    LocalSaaSDb.set(`amenities_${finalTenantId}`, defaultAmenities);

    // 7. Initialize onboarding progress for Customer Onboarding Wizard
    const onboardingProg: CustomerOnboardingProgress = {
      id: finalTenantId,
      userId: userId,
      currentStep: 1,
      profile: {
        fullName: lead.contactName,
        phone: lead.phone,
        roleInCompany: 'Propietario / Director'
      },
      company: {
        legalName: lead.companyName,
        taxId: lead.country === 'Argentina' ? '30-12345678-9' : 'RUT-123456',
        billingAddress: `Sede principal, ${lead.country}`
      },
      resort: {
        name: lead.companyName,
        businessType: lead.accommodationType === 'OTHER' ? 'CABIN' : lead.accommodationType,
        country: lead.country,
        currency: lead.country === 'Argentina' ? 'ARS' : 'USD',
        timezone: 'America/Argentina/Buenos_Aires',
        email: lead.email,
        phone: lead.phone
      },
      rooms: [
        { id: 'room-1', name: 'Suite Vista Montaña', category: 'Premium', price: lead.country === 'Argentina' ? 95000 : 100, capacity: 2 },
        { id: 'room-2', name: 'Cabaña Bosque Standard', category: 'Familiar', price: lead.country === 'Argentina' ? 120000 : 130, capacity: 4 }
      ],
      branding: {
        logoIcon: 'trees',
        primaryColor: '#07140e',
        secondaryColor: '#dca54c'
      },
      domain: {
        requestedSubdomain: finalTenantId,
        status: 'active'
      },
      payments: {
        selectedPlan: planType,
        billingCycle: 'monthly',
        paymentMethodPlaceholder: 'Visa terminada en 4242'
      },
      completed: false,
      updatedAt: new Date().toISOString()
    };
    await this.saveOnboardingProgress(onboardingProg);

    // 8. Create Billing Profile
    const plan = DEFAULT_PLANS.find(p => p.id === planType) || DEFAULT_PLANS[0];
    const newBillingProfile: BillingProfile = {
      id: finalTenantId,
      tenantName: lead.companyName,
      planId: planType,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      amount: plan.price,
      currency: 'USD',
      paymentMethod: {
        brand: 'Visa',
        last4: '4242'
      },
      invoices: [
        {
          id: `inv-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: plan.price,
          status: 'paid'
        }
      ]
    };
    await this.saveBillingProfile(newBillingProfile);

    // Seed advanced engines
    try {
      const { CommercialRepository } = await import('./CommercialRepository');
      const { SubscriptionEngine } = await import('./SubscriptionEngine');
      const { FinancialDashboardService } = await import('./FinancialDashboardService');

      // Create Billing Account
      const billingAcc = {
        id: finalTenantId,
        tenantId: finalTenantId,
        companyName: lead.companyName,
        taxId: lead.country === 'Argentina' ? '30-12345678-9' : 'RUT-123456',
        billingAddress: `Sede principal, ${lead.country}`,
        country: lead.country,
        currency: 'USD',
        email: lead.email,
        phone: lead.phone,
        paymentProvider: 'none' as const,
        paymentMethod: { brand: 'Visa', last4: '4242' },
        credits: 0,
        updatedAt: new Date().toISOString()
      };
      await CommercialRepository.saveBillingAccount(billingAcc);

      // Create Subscription starting as Trial or Active
      await SubscriptionEngine.createSubscription(finalTenantId, planType, 14, 'monthly');

      // Refresh Financial Metrics
      await FinancialDashboardService.recalculateFinancialMetrics();
    } catch (e) {
      console.warn('Failed to seed subscription and license engine inside provisionTenant:', e);
    }

    // 9. Log Event
    try {
      const audits = LocalSaaSDb.get<any[]>('audit_logs') || [];
      audits.unshift({
        id: `audit-${Date.now()}`,
        userId: 'system-provisioner',
        userEmail: 'system@stayflow.app',
        action: 'PROVISION_TENANT',
        details: `Alta automática y aprovisionamiento del tenant "${finalTenantId}" (${lead.companyName}) completado exitosamente con plan "${planType}".`,
        timestamp: new Date().toISOString(),
        tenantId: finalTenantId
      });
      LocalSaaSDb.set('audit_logs', audits);
    } catch (e) {
      console.warn('Logging audit trail failed:', e);
    }

    // 10. Update Lead Status in CRM to Active client
    await this.updateLeadStage(lead.id, 'Cliente', `Aprobado y provisionado automáticamente como el tenant "${finalTenantId}".`);

    return finalTenantId;
  }
}
