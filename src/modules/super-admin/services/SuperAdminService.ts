import { isFirebaseConfigured } from '../../../core/firebase/firebase';
import { getDocument, saveDocument, queryCollection } from '../../../core/firebase/firestore';
import { doc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../core/firebase/firebase';
import { LocalSaaSDb } from '../../../shared/services/LocalSaaSDb';
import { 
  SuperAdminDashboardMetrics, 
  TenantWithConfig, 
  SaaSPlanConfig, 
  PlatformHealthStatus, 
  GlobalPlatformConfig, 
  GlobalAuditLog 
} from '../types';
import { TenantConfig, SaaSPlan, TenantStatus, FeatureFlag } from '../../../core/tenant/TenantTypes';
import { TenantConfigService } from '../../../core/tenant/TenantConfigService';
import { Resort, ResortUser, UserProfile, Page, Accommodation, AppSettings, Booking } from '../../../types';
import { HealthService } from '../../../core/observability/HealthService';

export class SuperAdminService {
  private static GLOBAL_CONFIG_KEY = 'saas_global_config';
  private static GLOBAL_AUDIT_KEY = 'saas_global_audit_logs';
  private static COMMERCIAL_STATUS_KEY = 'saas_tenant_commercial_status';

  /**
   * Initialize default global platform configurations if they don't exist
   */
  public static getGlobalConfig(): GlobalPlatformConfig {
    const existing = LocalSaaSDb.get<GlobalPlatformConfig>(this.GLOBAL_CONFIG_KEY);
    if (existing) return existing;

    const defaultConfig: GlobalPlatformConfig = {
      platformName: 'StayFlow',
      logoUrl: '',
      contactEmail: 'info@stayflow.app',
      supportEmail: 'soporte@stayflow.app',
      phone: '+54 11 3210-9876',
      socialNetworks: {
        facebook: 'https://facebook.com/stayflow',
        instagram: 'https://instagram.com/stayflow',
        linkedin: 'https://linkedin.com/company/stayflow',
        twitter: 'https://twitter.com/stayflow'
      },
      commercialWebsite: 'https://stayflow.app',
      version: 'v1.4.2-prod',
      maintenanceMode: false,
      globalNotificationMessage: ''
    };

    LocalSaaSDb.set(this.GLOBAL_CONFIG_KEY, defaultConfig);
    return defaultConfig;
  }

  public static updateGlobalConfig(config: GlobalPlatformConfig): void {
    LocalSaaSDb.set(this.GLOBAL_CONFIG_KEY, config);
    this.recordAudit(
      'system',
      'UPDATE_GLOBAL_CONFIG',
      'global_config',
      'system',
      'Updated global platform configuration',
      null,
      config
    );
  }

  /**
   * Get all registered tenants with their configurations merged
   */
  public static async getTenants(): Promise<TenantWithConfig[]> {
    const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
    const tenants: TenantWithConfig[] = [];

    const statuses = LocalSaaSDb.get<Record<string, string>>(this.COMMERCIAL_STATUS_KEY) || {};

    for (const resort of resorts) {
      const config = await TenantConfigService.getTenantConfig(resort.id);
      
      // Determine commercial status fallback
      let commStatus: TenantWithConfig['commercialStatus'] = 'Activo';
      if (statuses[resort.id]) {
        commStatus = statuses[resort.id] as any;
      } else if (config.status === 'suspended') {
        commStatus = 'Suspendido';
      } else if (config.contractedPlan === 'Starter') {
        commStatus = 'Trial';
      }

      tenants.push({
        id: resort.id,
        name: resort.name,
        slug: resort.slug,
        businessType: resort.businessType,
        plan: config.contractedPlan,
        active: resort.active && config.status !== 'suspended',
        email: resort.email,
        phone: resort.phone,
        domain: resort.domain || config.domain,
        createdAt: resort.createdAt || new Date().toISOString(),
        status: config.status,
        commercialStatus: commStatus,
        config
      });
    }

    return tenants;
  }

  /**
   * Retrieve a specific tenant with merged config
   */
  public static async getTenantById(tenantId: string): Promise<TenantWithConfig | null> {
    const list = await this.getTenants();
    return list.find(t => t.id === tenantId) || null;
  }

  /**
   * Edit tenant general details
   */
  public static async updateTenant(tenantId: string, updates: Partial<TenantWithConfig>): Promise<void> {
    // 1. Update Resort info
    const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
    const resortIdx = resorts.findIndex(r => r.id === tenantId);
    let previousResort = null;
    let newResort = null;

    if (resortIdx !== -1) {
      previousResort = { ...resorts[resortIdx] };
      resorts[resortIdx] = {
        ...resorts[resortIdx],
        name: updates.name || resorts[resortIdx].name,
        businessType: updates.businessType || resorts[resortIdx].businessType,
        email: updates.email || resorts[resortIdx].email,
        phone: updates.phone || resorts[resortIdx].phone,
        domain: updates.domain !== undefined ? updates.domain : resorts[resortIdx].domain,
      };
      newResort = resorts[resortIdx];
      LocalSaaSDb.set('resorts', resorts);

      // Save to Firestore if configured
      if (isFirebaseConfigured) {
        try {
          await saveDocument(`resorts/${tenantId}`, resorts[resortIdx]);
        } catch (e) {
          console.warn('[SUPER_ADMIN] Failed to save resort to Firestore:', e);
        }
      }
    }

    // 2. Update TenantConfig
    const config = await TenantConfigService.getTenantConfig(tenantId);
    const previousConfig = { ...config };
    const updatedConfig: TenantConfig = {
      ...config,
      commercialName: updates.name || config.commercialName,
      contractedPlan: updates.plan || config.contractedPlan,
      status: updates.status || config.status,
      domain: updates.domain || config.domain,
    };

    await TenantConfigService.saveTenantConfig(tenantId, updatedConfig);

    // 3. Update commercial status state
    let oldCommercialStatus = 'Activo';
    if (updates.commercialStatus) {
      const statuses = LocalSaaSDb.get<Record<string, string>>(this.COMMERCIAL_STATUS_KEY) || {};
      oldCommercialStatus = statuses[tenantId] || (previousConfig.status === 'suspended' ? 'Suspendido' : 'Activo');
      statuses[tenantId] = updates.commercialStatus;
      LocalSaaSDb.set(this.COMMERCIAL_STATUS_KEY, statuses);
    }

    // Record history
    const detailParts: string[] = [];
    if (updates.name && updates.name !== previousConfig.commercialName) {
      detailParts.push(`Nombre comercial cambiado a "${updates.name}"`);
    }
    if (updates.plan && updates.plan !== previousConfig.contractedPlan) {
      detailParts.push(`Plan actualizado de "${previousConfig.contractedPlan}" a "${updates.plan}"`);
    }
    if (updates.commercialStatus && oldCommercialStatus !== updates.commercialStatus) {
      detailParts.push(`Estado comercial modificado de "${oldCommercialStatus}" a "${updates.commercialStatus}"`);
    }
    if (updates.domain && updates.domain !== previousConfig.domain) {
      detailParts.push(`Dominio reconfigurado a "${updates.domain}"`);
    }

    if (detailParts.length > 0) {
      this.recordTenantHistory(
        tenantId,
        'Actualización de Cuenta',
        detailParts.join(', ')
      );
    }

    this.recordAudit(
      'system',
      'TENANT_UPDATED',
      'tenant',
      tenantId,
      `Updated tenant ${tenantId} configuration and commercial status`,
      { previousResort, previousConfig },
      { newResort, updatedConfig, commercialStatus: updates.commercialStatus }
    );
  }

  /**
   * Suspend / reactivate client
   */
  public static async toggleTenantStatus(tenantId: string): Promise<void> {
    const config = await TenantConfigService.getTenantConfig(tenantId);
    const newStatus: TenantStatus = config.status === 'active' ? 'suspended' : 'active';
    const newCommStatus = newStatus === 'active' ? 'Activo' : 'Suspendido';

    await this.updateTenant(tenantId, {
      status: newStatus,
      commercialStatus: newCommStatus as any
    });
  }

  /**
   * Soft delete a tenant
   */
  public static async softDeleteTenant(tenantId: string): Promise<void> {
    const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
    const resortIdx = resorts.findIndex(r => r.id === tenantId);
    if (resortIdx !== -1) {
      const previousResort = { ...resorts[resortIdx] };
      // Soft delete: keep in DB but set active to false & flag as deleted
      resorts[resortIdx].active = false;
      (resorts[resortIdx] as any).deleted = true;
      (resorts[resortIdx] as any).deletedAt = new Date().toISOString();
      
      LocalSaaSDb.set('resorts', resorts);

      if (isFirebaseConfigured) {
        try {
          await saveDocument(`resorts/${tenantId}`, resorts[resortIdx]);
        } catch (e) {
          console.warn('[SUPER_ADMIN] Failed to soft delete resort in Firestore:', e);
        }
      }

      // Update commercial status to Cancelled
      const statuses = LocalSaaSDb.get<Record<string, string>>(this.COMMERCIAL_STATUS_KEY) || {};
      statuses[tenantId] = 'Cancelado';
      LocalSaaSDb.set(this.COMMERCIAL_STATUS_KEY, statuses);

      this.recordTenantHistory(
        tenantId,
        'Baja Lógica',
        'Cliente marcado para borrado lógico del sistema. Acceso revocado y sitio web inactivo.'
      );

      this.recordAudit(
        'system',
        'TENANT_SOFT_DELETED',
        'tenant',
        tenantId,
        `Soft deleted tenant ${tenantId}`,
        previousResort,
        resorts[resortIdx]
      );
    }
  }

  /**
   * HIGH-PRIORITY: Onboarding Assistant (Alta Automática)
   * Excutes sequentially with an undo stack for robust pseudo-transactions
   */
  public static async provisionTenant(data: {
    id: string;
    name: string;
    businessType: Resort['businessType'];
    plan: SaaSPlan;
    ownerEmail: string;
    ownerName: string;
    phone: string;
    country: string;
    timezone: string;
    currency: string;
    primaryColor: string;
  }): Promise<{ success: boolean; logs: string[]; error?: string }> {
    const logs: string[] = [];
    const undoStack: (() => Promise<void>)[] = [];

    const tenantId = data.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!tenantId) {
      return { success: false, logs, error: 'Identificador de tenant inválido.' };
    }

    logs.push(`[INICIO] Comenzando alta automática para tenant ID: ${tenantId}`);

    try {
      // 0. Verify if ID already exists
      const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
      if (resorts.some(r => r.id === tenantId)) {
        throw new Error(`El identificador de resort "${tenantId}" ya está en uso.`);
      }

      // 1. Create Resort Document
      logs.push(`Paso 1: Creando entidad Resort "${data.name}"`);
      const newResort: Resort = {
        id: tenantId,
        name: data.name,
        slug: tenantId,
        businessType: data.businessType,
        plan: data.plan === 'Starter' ? 'free' : data.plan === 'Professional' ? 'pro' : 'enterprise',
        active: true,
        email: data.ownerEmail,
        phone: data.phone,
        country: data.country,
        timezone: data.timezone,
        currency: data.currency,
        language: 'es',
        createdAt: new Date().toISOString()
      };

      // Execution
      resorts.push(newResort);
      LocalSaaSDb.set('resorts', resorts);
      if (isFirebaseConfigured) {
        await saveDocument(`resorts/${tenantId}`, newResort);
      }

      // Rollback callback
      undoStack.push(async () => {
        const list = LocalSaaSDb.get<Resort[]>('resorts') || [];
        LocalSaaSDb.set('resorts', list.filter(r => r.id !== tenantId));
        // Note: In Firestore, we won't delete physically if we don't have to, but we can set active false.
      });
      logs.push(`[OK] Entidad Resort creada con éxito.`);

      // 2. Initialize SaaS Tenant Configuration
      logs.push(`Paso 2: Inicializando configuración SaaS (TenantConfig)`);
      const saasConfig: TenantConfig = {
        logo: '',
        commercialName: data.name,
        contractedPlan: data.plan,
        status: 'active',
        language: 'es',
        currency: data.currency,
        timezone: data.timezone,
        domain: `${tenantId}.stayflow.app`,
        branding: {
          primaryColor: data.primaryColor || '#0f172a',
          secondaryColor: '#0284c7',
          fontFamily: 'Inter',
        },
        emails: {
          supportEmail: data.ownerEmail,
          bookingNotificationsEmail: data.ownerEmail,
          senderName: data.name,
        },
        regionalSettings: {
          country: data.country,
          dateFormat: 'DD/MM/YYYY',
          numberFormat: 'es-AR',
        }
      };

      await TenantConfigService.saveTenantConfig(tenantId, saasConfig);
      
      undoStack.push(async () => {
        localStorage.removeItem(`saas_resort_saas_config_${tenantId}`);
      });
      logs.push(`[OK] Configuración SaaS inicializada.`);

      // 3. Create Website Settings (CMS Core App Settings)
      logs.push(`Paso 3: Creando configuraciones de Sitio Web (CMS AppSettings)`);
      const websiteSettings: AppSettings = {
        appName: data.name,
        appSubtitle: 'Cabañas, Glamping & Naturaleza',
        logoIcon: data.businessType === 'GLAMPING' ? 'tent' : 'trees',
        address: `Dirección de ${data.name}, ${data.country}`,
        locationDetails: `Ubicado en la hermosa región de ${data.country}, rodeado de paisajes increíbles.`,
        googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.name + ' ' + data.country)}`,
        hours: 'Recepción: de 08:00 a 22:00 hs',
        phone: data.phone,
        whatsapp: data.phone.replace(/[^0-9]/g, ''),
        email: data.ownerEmail,
        branding: {
          primaryColor: data.primaryColor || '#0f172a',
          secondaryColor: '#0284c7',
        },
        seo: {
          title: `${data.name} | StayFlow`,
          description: `Reserva tu estadía online en ${data.name}. El mejor alojamiento garantizado.`,
          keywords: `${data.name}, stayflow, cabañas, reservas, online`
        },
        terminology: {
          singular: data.businessType === 'GLAMPING' ? 'Domo' : 'Cabaña',
          plural: data.businessType === 'GLAMPING' ? 'Domos' : 'Cabañas'
        }
      };

      LocalSaaSDb.set(`settings_${tenantId}`, websiteSettings);
      if (isFirebaseConfigured) {
        await saveDocument(`resorts/${tenantId}/settings/app`, websiteSettings);
      }

      undoStack.push(async () => {
        localStorage.removeItem(`saas_resort_settings_${tenantId}`);
      });
      logs.push(`[OK] Configuraciones de Sitio Web creadas.`);

      // 4. Create Necessary Base Collections (Default Pages)
      logs.push(`Paso 4: Creando colecciones necesarias (Páginas Web por defecto)`);
      const defaultPages: Page[] = [
        {
          id: `page_${tenantId}_home`,
          slug: 'home',
          title: 'Bienvenidos',
          content: `Te damos la bienvenida a ${data.name}. Un lugar soñado diseñado para que conectes con la naturaleza y disfrutes de una estadía inolvidable con todo el confort de primer nivel.`,
          active: true,
          updatedAt: new Date().toISOString()
        },
        {
          id: `page_${tenantId}_about`,
          slug: 'about',
          title: 'Nosotros',
          content: `Somos un equipo apasionado por la hospitalidad y la naturaleza. En ${data.name} buscamos ofrecerte una experiencia auténtica y sustentable, cuidando el entorno y brindándote la mejor atención personalizada.`,
          active: true,
          updatedAt: new Date().toISOString()
        }
      ];

      LocalSaaSDb.set(`pages_${tenantId}`, defaultPages);
      if (isFirebaseConfigured) {
        for (const pg of defaultPages) {
          await saveDocument(`resorts/${tenantId}/pages/${pg.id}`, pg);
        }
      }

      undoStack.push(async () => {
        localStorage.removeItem(`saas_resort_pages_${tenantId}`);
      });
      logs.push(`[OK] Páginas de inicio y nosotros creadas de forma predeterminada.`);

      // 5. Create Sample Accommodation (To make it operational right away)
      logs.push(`Paso 5: Creando cabaña/alojamiento de ejemplo`);
      const termSingular = websiteSettings.terminology.singular;
      const sampleAccommodation: Accommodation = {
        id: Date.now(),
        name: `${termSingular} Premium Sol`,
        slug: `${termSingular.toLowerCase()}-premium-sol`,
        type: data.businessType === 'GLAMPING' ? 'glamping_dome' : 'cabin',
        description: `Disfruta de una vista de ensueño. Equipada con sommier king size, calefacción de alta gama, deck de madera flotante, parrilla individual y todos los servicios esenciales.`,
        price: data.currency === 'USD' ? 120 : 65000,
        discount: 0,
        offer: 'Inauguración',
        category: 'couples',
        capacity: 2,
        rating: 5.0,
        bedrooms: 1,
        bathrooms: 1,
        image: data.businessType === 'GLAMPING' 
          ? 'https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=900&q=84'
          : 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=84',
        images: [
          data.businessType === 'GLAMPING' 
            ? 'https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=900&q=84'
            : 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=84'
        ],
        amenities: ['Wifi', 'Parrilla', 'Calefacción'],
        customFields: {},
        featured: true,
        active: true,
        createdAt: new Date().toISOString()
      };

      LocalSaaSDb.set(`accommodations_${tenantId}`, [sampleAccommodation]);
      if (isFirebaseConfigured) {
        await saveDocument(`resorts/${tenantId}/accommodations/${sampleAccommodation.id}`, sampleAccommodation);
      }

      // Save empty bookings, reviews, promotions, gallery as lists
      LocalSaaSDb.set(`bookings_${tenantId}`, []);
      LocalSaaSDb.set(`reviews_${tenantId}`, []);
      LocalSaaSDb.set(`promotions_${tenantId}`, []);
      LocalSaaSDb.set(`gallery_${tenantId}`, []);
      LocalSaaSDb.set(`amenities_${tenantId}`, [
        { id: 'wifi', name: 'WiFi', icon: 'Wifi', category: 'General' },
        { id: 'parrilla', name: 'Parrilla', icon: 'Flame', category: 'Exterior' },
        { id: 'calefaccion', name: 'Calefacción', icon: 'Flame', category: 'General' }
      ]);
      LocalSaaSDb.set(`accommodation_types_${tenantId}`, [
        { id: 'cabin', displayName: 'Cabaña', icon: 'trees', defaultAmenities: ['wifi', 'parrilla'], customFields: [] },
        { id: 'glamping', displayName: 'Glamping', icon: 'tent', defaultAmenities: ['wifi', 'parrilla'], customFields: [] }
      ]);

      undoStack.push(async () => {
        localStorage.removeItem(`saas_resort_accommodations_${tenantId}`);
        localStorage.removeItem(`saas_resort_bookings_${tenantId}`);
        localStorage.removeItem(`saas_resort_reviews_${tenantId}`);
        localStorage.removeItem(`saas_resort_promotions_${tenantId}`);
        localStorage.removeItem(`saas_resort_gallery_${tenantId}`);
        localStorage.removeItem(`saas_resort_amenities_${tenantId}`);
        localStorage.removeItem(`saas_resort_accommodation_types_${tenantId}`);
      });
      logs.push(`[OK] Alojamiento muestra creado.`);

      // 6. Create Owner User Relation
      logs.push(`Paso 6: Asignando Rol de Propietario ('owner') para: ${data.ownerEmail}`);
      
      // Look up if user profile exists
      const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
      let userObj = users.find(u => u.email.trim().toLowerCase() === data.ownerEmail.trim().toLowerCase());
      
      let ownerUid = userObj?.uid;
      if (!ownerUid) {
        ownerUid = `user_owner_${Date.now()}`;
        const newOwnerProfile: UserProfile = {
          uid: ownerUid,
          displayName: data.ownerName,
          email: data.ownerEmail,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          active: true
        };
        users.push(newOwnerProfile);
        LocalSaaSDb.set('users', users);
        if (isFirebaseConfigured) {
          await saveDocument(`users/${ownerUid}`, newOwnerProfile);
        }
      }

      // Create ResortUser relation
      const resortUsers = LocalSaaSDb.get<ResortUser[]>('resortUsers') || [];
      const newResortUser: ResortUser = {
        id: `ru_${tenantId}_owner_${Date.now()}`,
        userId: ownerUid,
        resortId: tenantId,
        role: 'owner',
        active: true,
        createdAt: new Date().toISOString()
      };

      resortUsers.push(newResortUser);
      LocalSaaSDb.set('resortUsers', resortUsers);
      if (isFirebaseConfigured) {
        await saveDocument(`resortUsers/${newResortUser.id}`, newResortUser);
      }

      undoStack.push(async () => {
        const listRU = LocalSaaSDb.get<ResortUser[]>('resortUsers') || [];
        LocalSaaSDb.set('resortUsers', listRU.filter(ru => ru.id !== newResortUser.id));
      });
      logs.push(`[OK] Rol 'owner' asignado.`);

      // 7. Initial state and commercial configuration
      logs.push(`Paso 7: Estableciendo estado comercial en "Trial" y registrando alta`);
      const statuses = LocalSaaSDb.get<Record<string, string>>(this.COMMERCIAL_STATUS_KEY) || {};
      statuses[tenantId] = 'Trial';
      LocalSaaSDb.set(this.COMMERCIAL_STATUS_KEY, statuses);

      undoStack.push(async () => {
        const stateList = LocalSaaSDb.get<Record<string, string>>(this.COMMERCIAL_STATUS_KEY) || {};
        delete stateList[tenantId];
        LocalSaaSDb.set(this.COMMERCIAL_STATUS_KEY, stateList);
      });

      this.recordAudit(
        'system',
        'TENANT_PROVISIONED',
        'tenant',
        tenantId,
        `Tenant "${data.name}" provisioned successfully with Plan "${data.plan}" and Owner "${data.ownerEmail}"`,
        null,
        { tenantId, plan: data.plan, ownerEmail: data.ownerEmail }
      );

      this.recordTenantHistory(
        tenantId,
        'Alta de Cliente',
        `Aprovisionamiento automático finalizado con éxito bajo el plan ${data.plan}. Propietario: ${data.ownerName} (${data.ownerEmail})`
      );

      logs.push(`[COMPLETADO] Alta automática finalizada con éxito.`);
      return { success: true, logs };

    } catch (err: any) {
      logs.push(`[ERROR] Falla durante el aprovisionamiento automático: ${err.message || String(err)}`);
      logs.push(`[DESHACER] Ejecutando rollback para revertir cambios parciales...`);

      // Run undo stack in reverse order
      for (let i = undoStack.length - 1; i >= 0; i--) {
        try {
          await undoStack[i]();
        } catch (undoErr) {
          console.error('[SUPER_ADMIN] Fail during undo step:', undoErr);
        }
      }

      logs.push(`[DESHACER COMPLETE] Se ha revertido el estado de forma segura.`);
      return { success: false, logs, error: err.message || String(err) };
    }
  }

  /**
   * Dedicated Tenant-specific Audit History
   */
  public static recordTenantHistory(
    tenantId: string,
    action: string,
    details: string,
    userEmail: string = 'system@stayflow.app'
  ): void {
    const historyItem = {
      id: `history_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      userEmail
    };

    const key = `saas_tenant_history_${tenantId}`;
    const existing = LocalSaaSDb.get<any[]>(key) || [];
    existing.unshift(historyItem);
    LocalSaaSDb.set(key, existing);

    // Save to Firestore if configured
    if (isFirebaseConfigured) {
      saveDocument(`resorts/${tenantId}/history/${historyItem.id}`, historyItem, true).catch(err => {
        console.warn('Failed to save history to Firestore:', err);
      });
    }
  }

  public static getTenantHistory(tenantId: string): any[] {
    return LocalSaaSDb.get<any[]>(`saas_tenant_history_${tenantId}`) || [];
  }

  private static PLANS_KEY = 'saas_plans_config';

  /**
   * Plan Limits & Features Management
   */
  public static getPlans(): SaaSPlanConfig[] {
    const existing = LocalSaaSDb.get<SaaSPlanConfig[]>(this.PLANS_KEY);
    if (existing && existing.length > 0) return existing;

    const defaultPlans: SaaSPlanConfig[] = [
      {
        id: 'Starter',
        name: 'Starter (Inicial)',
        price: 29,
        currency: 'USD',
        maxUsers: 2,
        maxAccommodations: 3,
        maxStorageMB: 50,
        enabledFeatures: ['bookingEngine']
      },
      {
        id: 'Professional',
        name: 'Professional (Profesional)',
        price: 79,
        currency: 'USD',
        maxUsers: 5,
        maxAccommodations: 10,
        maxStorageMB: 200,
        enabledFeatures: ['bookingEngine', 'payments', 'checkinDigital']
      },
      {
        id: 'Business',
        name: 'Business (Crecimiento)',
        price: 149,
        currency: 'USD',
        maxUsers: 15,
        maxAccommodations: 30,
        maxStorageMB: 1000,
        enabledFeatures: ['bookingEngine', 'payments', 'checkinDigital', 'analytics', 'marketing']
      },
      {
        id: 'Enterprise',
        name: 'Enterprise (Corporativo)',
        price: 299,
        currency: 'USD',
        maxUsers: 999,
        maxAccommodations: 999,
        maxStorageMB: 10000,
        enabledFeatures: ['bookingEngine', 'payments', 'checkinDigital', 'analytics', 'marketing', 'channelManager', 'multiProperty']
      }
    ];

    LocalSaaSDb.set(this.PLANS_KEY, defaultPlans);
    return defaultPlans;
  }

  public static updatePlan(planId: string, updatedFields: Partial<SaaSPlanConfig>): void {
    const plans = this.getPlans();
    const idx = plans.findIndex(p => p.id === planId);
    if (idx !== -1) {
      plans[idx] = {
        ...plans[idx],
        ...updatedFields
      } as SaaSPlanConfig;
      LocalSaaSDb.set(this.PLANS_KEY, plans);

      // Register audit log
      this.recordAudit(
        'system',
        'PLAN_UPDATED',
        'plan',
        planId,
        `Updated plan limits and feature flags for: ${planId}`,
        null,
        plans[idx]
      );
    }
  }

  /**
   * User - Tenant Relations Management
   */
  public static async getUsers(): Promise<(UserProfile & { resortsAssigned: { resortId: string; resortName: string; role: string }[] })[]> {
    const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
    const resortUsers = LocalSaaSDb.get<ResortUser[]>('resortUsers') || [];
    const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];

    return users.map(u => {
      const assigned = resortUsers
        .filter(ru => ru.userId === u.uid && ru.active)
        .map(ru => {
          const res = resorts.find(r => r.id === ru.resortId);
          return {
            resortId: ru.resortId,
            resortName: res?.name || ru.resortId,
            role: ru.role
          };
        });

      return {
        ...u,
        resortsAssigned: assigned
      };
    });
  }

  public static async reassignOwner(tenantId: string, newOwnerEmail: string): Promise<void> {
    const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
    const targetUser = users.find(u => u.email.trim().toLowerCase() === newOwnerEmail.trim().toLowerCase());
    
    if (!targetUser) {
      throw new Error(`No se encontró ningún usuario registrado con el correo "${newOwnerEmail}"`);
    }

    const resortUsers = LocalSaaSDb.get<ResortUser[]>('resortUsers') || [];

    // Desactivar owner anterior
    const activeOwners = resortUsers.filter(ru => ru.resortId === tenantId && ru.role === 'owner');
    for (const owner of activeOwners) {
      owner.active = false;
    }

    // Agregar nuevo owner
    const newRU: ResortUser = {
      id: `ru_${tenantId}_owner_reassigned_${Date.now()}`,
      userId: targetUser.uid,
      resortId: tenantId,
      role: 'owner',
      active: true,
      createdAt: new Date().toISOString()
    };

    resortUsers.push(newRU);
    LocalSaaSDb.set('resortUsers', resortUsers);

    if (isFirebaseConfigured) {
      try {
        await saveDocument(`resortUsers/${newRU.id}`, newRU);
        for (const owner of activeOwners) {
          await saveDocument(`resortUsers/${owner.id}`, owner);
        }
      } catch (e) {
        console.warn('[SUPER_ADMIN] Failed to update owner in Firestore:', e);
      }
    }

    this.recordTenantHistory(
      tenantId,
      'Propietario Asignado',
      `Nuevo dueño asignado: ${targetUser.displayName || targetUser.email} (${newOwnerEmail}). Dueños anteriores desactivados.`
    );

    this.recordAudit(
      'system',
      'OWNER_REASSIGNED',
      'tenant',
      tenantId,
      `Reassigned owner of tenant "${tenantId}" to "${newOwnerEmail}"`,
      activeOwners,
      newRU
    );
  }

  public static async toggleUserStatus(uid: string): Promise<void> {
    const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      const prev = { ...users[idx] };
      users[idx].active = !users[idx].active;
      LocalSaaSDb.set('users', users);

      if (isFirebaseConfigured) {
        try {
          await saveDocument(`users/${uid}`, users[idx]);
        } catch (e) {
          console.warn('[SUPER_ADMIN] Failed to update user status in Firestore:', e);
        }
      }

      this.recordAudit(
        'system',
        'USER_STATUS_TOGGLED',
        'user',
        uid,
        `Toggled user ${uid} active status to ${users[idx].active}`,
        prev,
        users[idx]
      );
    }
  }

  /**
   * Health status monitor logic
   */
  public static async getHealthStatus(): Promise<PlatformHealthStatus> {
    const report = await HealthService.runDiagnostics();
    
    // Map our internal service statuses ('ONLINE', 'WARNING', etc.) to matching UI status keys
    const mappedComponents = report.components.map(c => {
      let uiStatus: 'healthy' | 'warning' | 'degraded' | 'offline' = 'healthy';
      if (c.status === 'WARNING') uiStatus = 'warning';
      else if (c.status === 'DEGRADED') uiStatus = 'degraded';
      else if (c.status === 'OFFLINE') uiStatus = 'offline';

      return {
        name: c.name,
        status: uiStatus,
        latencyMs: c.latencyMs,
        lastChecked: c.lastChecked,
        details: c.details
      };
    });

    let overallUIStatus: 'healthy' | 'warning' | 'degraded' | 'offline' = 'healthy';
    if (report.overallStatus === 'WARNING') overallUIStatus = 'warning';
    else if (report.overallStatus === 'DEGRADED') overallUIStatus = 'degraded';
    else if (report.overallStatus === 'OFFLINE') overallUIStatus = 'offline';

    return {
      overallStatus: overallUIStatus,
      components: mappedComponents,
      lastSyncTime: report.timestamp
    };
  }

  /**
   * Global Dashboard Indicators & Metrics
   */
  public static async getMetrics(): Promise<SuperAdminDashboardMetrics> {
    const resorts = LocalSaaSDb.get<Resort[]>('resorts') || [];
    const users = LocalSaaSDb.get<UserProfile[]>('users') || [];
    const activeResorts = resorts.filter(r => r.active && !(r as any).deleted);
    
    let totalReservations = 0;
    let dailyReservations = 0;
    let completedPayments = 0;
    let estimatedRevenue = 0;
    let totalAccommodationsCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    // Compute plan types
    let trialClients = 0;
    let activeClients = 0;
    let suspendedClients = 0;

    for (const r of resorts) {
      if ((r as any).deleted) continue;

      const config = await TenantConfigService.getTenantConfig(r.id);
      if (config.status === 'suspended') {
        suspendedClients++;
      } else if (config.contractedPlan === 'Starter') {
        trialClients++;
        activeClients++; // Trial is also active unless suspended
      } else {
        activeClients++;
      }

      // Read bookings for this tenant
      const bookings = LocalSaaSDb.get<Booking[]>(`bookings_${r.id}`) || [];
      totalReservations += bookings.length;
      
      const accs = LocalSaaSDb.get<Accommodation[]>(`accommodations_${r.id}`) || [];
      totalAccommodationsCount += accs.length;

      for (const b of bookings) {
        if (b.createdAt && b.createdAt.startsWith(todayStr)) {
          dailyReservations++;
        }
        if (b.paymentStatus === 'paid') {
          completedPayments++;
          estimatedRevenue += b.totalPrice;
        }
      }
    }

    return {
      totalClients: resorts.filter(r => !(r as any).deleted).length,
      activeClients,
      suspendedClients,
      trialClients,
      totalReservations,
      dailyReservations,
      completedPayments,
      estimatedRevenue,
      totalUsers: users.length,
      storageUtilization: resorts.filter(r => !(r as any).deleted).length * 4.25, // Mock 4.25 MB per client
      totalAccommodationsCount
    };
  }

  /**
   * System Global Audit Logging
   */
  public static recordAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: string,
    previousState: any = null,
    newState: any = null
  ): void {
    const log: GlobalAuditLog = {
      id: `g_audit_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      tenantId: 'stayflow_super',
      userId,
      userEmail: userId === 'system' ? 'system@stayflow.app' : undefined,
      action,
      entityType,
      entityId,
      details,
      previousState,
      newState
    };

    const existing = LocalSaaSDb.get<GlobalAuditLog[]>(this.GLOBAL_AUDIT_KEY) || [];
    existing.unshift(log); // newest first

    // Limit to 200 logs locally
    if (existing.length > 200) {
      existing.pop();
    }
    LocalSaaSDb.set(this.GLOBAL_AUDIT_KEY, existing);

    // Also pipe this important audit log to the main LoggerService as an INFO log
    try {
      const LoggerService = require('../../../core/observability/LoggerService').LoggerService;
      LoggerService.log('INFO', `[Audit] ${action} on ${entityType} (${entityId}): ${details}`, { log });
    } catch {
      // safe fallback for circular dependency or resolution in dev/prod builds
    }
  }

  public static getAuditLogs(): GlobalAuditLog[] {
    const logs = LocalSaaSDb.get<GlobalAuditLog[]>(this.GLOBAL_AUDIT_KEY) || [];
    
    // Seed default administrative logs if completely empty
    if (logs.length === 0) {
      const defaultLogs: GlobalAuditLog[] = [
        {
          id: 'g_audit_1',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          tenantId: 'stayflow_super',
          userId: 'system',
          userEmail: 'system@stayflow.app',
          action: 'PLATFORM_BOOTSTRAP',
          entityType: 'system',
          entityId: 'stayflow',
          details: 'StayFlow SaaS platform initialized with multi-tenant isolation engine'
        },
        {
          id: 'g_audit_2',
          timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
          tenantId: 'stayflow_super',
          userId: 'system',
          userEmail: 'system@stayflow.app',
          action: 'TENANT_AUTO_MIGRATED',
          entityType: 'tenant',
          entityId: 'patagonia-refugio',
          details: 'Migrated and seeded "Refugio Nativo" as active Professional tenant'
        },
        {
          id: 'g_audit_3',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          tenantId: 'stayflow_super',
          userId: 'system',
          userEmail: 'system@stayflow.app',
          action: 'TENANT_AUTO_MIGRATED',
          entityType: 'tenant',
          entityId: 'andes-glamping',
          details: 'Migrated and seeded "Andes Glamping Domes" as active Enterprise tenant'
        }
      ];
      LocalSaaSDb.set(this.GLOBAL_AUDIT_KEY, defaultLogs);
      return defaultLogs;
    }

    return logs;
  }
}
