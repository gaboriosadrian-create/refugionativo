import { isFirebaseConfigured } from '../../core/firebase/firebase';
import { getDocument, saveDocument, queryCollection } from '../../core/firebase/firestore';
import { Resort, AppSettings, Accommodation, Booking, AccommodationType, Amenity } from '../../types';
import { LocalSaaSDb } from './LocalSaaSDb';
import { SettingsService } from '../../modules/settings/services/SettingsService';
import { AccommodationConfigService } from '../../modules/accommodation-config/services/AccommodationConfigService';
import { OnboardingService } from '../../modules/onboarding/services/OnboardingService';
import { PricingService } from '../../modules/pricing/services/PricingService';
import { WebsiteContentService } from '../../modules/website-cms/services/WebsiteContentService';
import { WebsiteSettingsService } from '../../modules/public-portal/services/WebsiteSettingsService';
import { Logger } from '../../core/logger/Logger';

export class FirestoreSeedService {
  private static seedingPromise: Promise<void> | null = null;

  /**
   * Automatically inspects Firestore and seeds the minimum expected layout and data
   * for default operational resorts, doing so in a strictly idempotent manner.
   */
  public static async seedAllDefaultResorts(): Promise<void> {
    if (!isFirebaseConfigured) return;
    if (this.seedingPromise) return this.seedingPromise;

    this.seedingPromise = (async () => {
      try {
        Logger.info('[SEED] Iniciando verificación e inicialización de Firestore...');
        
        const defaultResortIds = ['patagonia-refugio', 'andes-glamping'];
        
        for (const resortId of defaultResortIds) {
          await this.seedResortIfNeeded(resortId);
        }
        
        Logger.info('[SEED] Verificación e inicialización de Firestore completada.');
      } catch (err) {
        Logger.error('[SEED] Error crítico en seedAllDefaultResorts:', err);
      }
    })();

    return this.seedingPromise;
  }

  /**
   * Idempotently seeds a specific resort by checking document and collection existence.
   */
  public static async seedResortIfNeeded(resortId: string): Promise<void> {
    if (!isFirebaseConfigured) return;

    try {
      // 1. Check & Seed the Resort Document itself
      const resortPath = `resorts/${resortId}`;
      let resortDoc = await getDocument(resortPath) as Resort | null;
      if (!resortDoc) {
        Logger.info(`[SEED] Resort '${resortId}' no encontrado. Inicializando documento base...`);
        const resortsList = LocalSaaSDb.get<Resort[]>('resorts') || [];
        const found = resortsList.find(r => r.id === resortId);
        if (found) {
          await saveDocument(resortPath, found);
          resortDoc = found;
        } else {
          const fallbackResort: Resort = {
            id: resortId,
            name: resortId === 'patagonia-refugio' ? 'Refugio Nativo' : 'Andes Glamping Domes',
            slug: resortId,
            businessType: resortId === 'patagonia-refugio' ? 'CABIN' : 'GLAMPING',
            plan: 'pro',
            active: true,
            email: resortId === 'patagonia-refugio' ? 'contacto@refugionativo.com' : 'domos@andesglamping.com',
            phone: resortId === 'patagonia-refugio' ? '+54 9 294 555 0138' : '+54 9 261 444 8899',
            country: 'Argentina',
            timezone: resortId === 'patagonia-refugio' ? 'America/Argentina/Buenos_Aires' : 'America/Argentina/Mendoza',
            currency: resortId === 'patagonia-refugio' ? 'ARS' : 'USD',
            language: 'es',
            createdAt: new Date().toISOString()
          };
          await saveDocument(resortPath, fallbackResort);
          resortDoc = fallbackResort;
        }
      }

      // 2. Check & Seed settings/general (AppSettings)
      const settingsPath = `resorts/${resortId}/settings/general`;
      const settingsDoc = await getDocument(settingsPath);
      if (!settingsDoc) {
        Logger.info(`[SEED] AppSettings para '${resortId}' no encontrado. Inicializando...`);
        const appSettings = LocalSaaSDb.get<AppSettings>(`settings_${resortId}`);
        if (appSettings) {
          await saveDocument(settingsPath, appSettings);
        } else {
          const defaultSettings: AppSettings = {
            appName: resortId === 'patagonia-refugio' ? "Refugio Nativo" : "Andes Glamping Domes",
            appSubtitle: resortId === 'patagonia-refugio' ? "Cabañas & naturaleza" : "Lujo y estrellas en Mendoza",
            logoIcon: resortId === 'patagonia-refugio' ? "trees" : "tent",
            address: resortId === 'patagonia-refugio' ? "Camino del Bosque 1840, Patagonia Argentina" : "Ruta del Sol Km 45, Valle de Uco, Mendoza",
            locationDetails: resortId === 'patagonia-refugio' ? "Nos encontramos en el Camino del Bosque 1840..." : "Ubicado en el corazón de los viñedos...",
            googleMapsLink: resortId === 'patagonia-refugio' ? "https://www.google.com/maps/search/?api=1&query=Camino+del+Bosque+1840+Patagonia" : "",
            hours: resortId === 'patagonia-refugio' ? "Recepción: todos los días, 08:00 a 22:00 hs" : "Recepción: 24 hs",
            phone: resortId === 'patagonia-refugio' ? "+54 9 294 555 0138" : "+54 9 261 444 8899",
            whatsapp: resortId === 'patagonia-refugio' ? "5492945550138" : "5492614448899",
            email: resortId === 'patagonia-refugio' ? "contacto@refugionativo.com" : "domos@andesglamping.com",
            terminology: {
              singular: resortId === 'patagonia-refugio' ? "Cabaña" : "Domo",
              plural: resortId === 'patagonia-refugio' ? "Cabañas" : "Domos"
            }
          };
          await saveDocument(settingsPath, defaultSettings);
        }
      }

      // 3. Check & Seed settings/accommodations (AccommodationConfig)
      const configPath = `resorts/${resortId}/settings/accommodations`;
      const configDoc = await getDocument(configPath);
      if (!configDoc) {
        Logger.info(`[SEED] AccommodationConfig para '${resortId}' no encontrado. Inicializando...`);
        const defaultAcConfig = AccommodationConfigService.getDefaultConfig(resortId);
        await saveDocument(configPath, defaultAcConfig);
      }

      // 4. Check & Seed websiteSettings/general (WebsiteSettings)
      const webSettingsPath = `resorts/${resortId}/websiteSettings/general`;
      const webSettingsDoc = await getDocument(webSettingsPath);
      if (!webSettingsDoc) {
        Logger.info(`[SEED] WebsiteSettings para '${resortId}' no encontrado. Inicializando...`);
        await WebsiteSettingsService.getSettings(resortId);
      }

      // 5. Check & Seed websiteContent/general (CMS WebContent)
      const cmsPath = `resorts/${resortId}/websiteContent/general`;
      const cmsDoc = await getDocument(cmsPath);
      if (!cmsDoc) {
        Logger.info(`[SEED] WebsiteContent CMS para '${resortId}' no encontrado. Inicializando...`);
        await WebsiteContentService.getContent(resortId);
      }

      // 6. Check & Seed onboardingProgress/progress (OnboardingProgress)
      const onboardingPath = `resorts/${resortId}/onboardingProgress/progress`;
      const onboardingDoc = await getDocument(onboardingPath);
      if (!onboardingDoc) {
        Logger.info(`[SEED] OnboardingProgress para '${resortId}' no encontrado. Inicializando...`);
        await OnboardingService.getProgress(resortId);
      }

      // 7. Check & Seed accommodation_types subcollection
      const typesList = await queryCollection(`resorts/${resortId}/accommodation_types`);
      if (typesList.length === 0) {
        Logger.info(`[SEED] Colección 'accommodation_types' para '${resortId}' vacía. Inicializando...`);
        const defaultTypes = LocalSaaSDb.get<AccommodationType[]>(`accommodation_types_${resortId}`) || [];
        for (const t of defaultTypes) {
          await saveDocument(`resorts/${resortId}/accommodation_types/${t.id}`, t);
        }
      }

      // 8. Check & Seed amenities subcollection
      const amenitiesList = await queryCollection(`resorts/${resortId}/amenities`);
      if (amenitiesList.length === 0) {
        Logger.info(`[SEED] Colección 'amenities' para '${resortId}' vacía. Inicializando...`);
        const defaultAmenities = LocalSaaSDb.get<Amenity[]>(`amenities_${resortId}`) || [];
        for (const a of defaultAmenities) {
          await saveDocument(`resorts/${resortId}/amenities/${a.id}`, a);
        }
      }

      // 9. Check & Seed accommodations (cabins) subcollection
      const accList = await queryCollection(`resorts/${resortId}/accommodations`);
      if (accList.length === 0) {
        Logger.info(`[SEED] Colección 'accommodations' para '${resortId}' vacía. Inicializando...`);
        const defaultAccs = LocalSaaSDb.get<Accommodation[]>(`accommodations_${resortId}`) || [];
        for (const a of defaultAccs) {
          await saveDocument(`resorts/${resortId}/accommodations/${a.id}`, a);
        }
      }

      // 10. Check & Seed reservations (bookings) subcollection
      const resList = await queryCollection(`resorts/${resortId}/reservations`);
      if (resList.length === 0) {
        Logger.info(`[SEED] Colección 'reservations' para '${resortId}' vacía. Inicializando...`);
        const defaultBookings = LocalSaaSDb.get<Booking[]>(`bookings_${resortId}`) || [];
        for (const b of defaultBookings) {
          await saveDocument(`resorts/${resortId}/reservations/${b.id}`, b);
        }
      }

      // 11. Check & Seed pricing tables
      await PricingService.seedDefaultPricingIfNeeded(resortId);

    } catch (err) {
      Logger.error(`[SEED] Error al inicializar resort '${resortId}':`, err);
    }
  }
}
