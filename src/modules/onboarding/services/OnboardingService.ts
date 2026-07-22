import { onboardingRepository } from '../repositories/OnboardingRepository';
import { OnboardingValidator } from '../validators/onboardingValidator';
import { ResortService } from '../../../shared/services/ResortService';
import { SettingsService } from '../../settings/services/SettingsService';
import { AccommodationService } from '../../../shared/services/AccommodationService';
import { PricingService } from '../../pricing/services/PricingService';
import { WebsiteContentService } from '../../website-cms/services/WebsiteContentService';
import { 
  OnboardingProgress, 
  OnboardingStep1Data, 
  OnboardingStep2Data, 
  OnboardingStep3Data, 
  OnboardingStep4Data, 
  OnboardingStep5Data 
} from '../types';
import { Resort, AppSettings, Accommodation } from '../../../types';
import { Logger } from '../../../core/logger/Logger';

export class OnboardingService {
  /**
   * Retrieves the current onboarding progress for a resort.
   * If none exists, creates and returns a default one.
   */
  public static async getProgress(resortId: string): Promise<OnboardingProgress> {
    try {
      let progress = await onboardingRepository.getProgress(resortId);
      if (!progress) {
        Logger.info(`Inicializando progreso de onboarding por primera vez para Resort: ${resortId}`);
        progress = onboardingRepository.createDefaultProgress(resortId);
        await onboardingRepository.saveProgress(resortId, progress);
      }
      return progress;
    } catch (err) {
      Logger.error(`Error al obtener progreso de onboarding para ${resortId}:`, err);
      return onboardingRepository.createDefaultProgress(resortId);
    }
  }

  /**
   * Saves step 1 data (Resort Data) to onboarding progress.
   */
  public static async saveStep1(resortId: string, data: OnboardingStep1Data): Promise<OnboardingProgress> {
    const val = OnboardingValidator.validateStep1(data);
    if (!val.isValid) {
      throw new Error(`Errores en Paso 1: ${val.errors.join(', ')}`);
    }

    const progress = await this.getProgress(resortId);
    progress.stepData.step1 = data;
    progress.stepsSaved.step1 = true;
    if (progress.currentStep === 1) {
      progress.currentStep = 2;
    }
    progress.updatedAt = new Date().toISOString();

    await onboardingRepository.saveProgress(resortId, progress);
    return progress;
  }

  /**
   * Saves step 2 data (Contact Info) to onboarding progress.
   */
  public static async saveStep2(resortId: string, data: OnboardingStep2Data): Promise<OnboardingProgress> {
    const val = OnboardingValidator.validateStep2(data);
    if (!val.isValid) {
      throw new Error(`Errores en Paso 2: ${val.errors.join(', ')}`);
    }

    const progress = await this.getProgress(resortId);
    progress.stepData.step2 = data;
    progress.stepsSaved.step2 = true;
    if (progress.currentStep === 2) {
      progress.currentStep = 3;
    }
    progress.updatedAt = new Date().toISOString();

    await onboardingRepository.saveProgress(resortId, progress);
    return progress;
  }

  /**
   * Saves step 3 data (First Accommodation) to onboarding progress.
   */
  public static async saveStep3(resortId: string, data: OnboardingStep3Data): Promise<OnboardingProgress> {
    const val = OnboardingValidator.validateStep3(data);
    if (!val.isValid) {
      throw new Error(`Errores en Paso 3: ${val.errors.join(', ')}`);
    }

    const progress = await this.getProgress(resortId);
    progress.stepData.step3 = data;
    progress.stepsSaved.step3 = true;
    if (progress.currentStep === 3) {
      progress.currentStep = 4;
    }
    progress.updatedAt = new Date().toISOString();

    await onboardingRepository.saveProgress(resortId, progress);
    return progress;
  }

  /**
   * Saves step 4 data (Rates & Policies) to onboarding progress.
   */
  public static async saveStep4(resortId: string, data: OnboardingStep4Data): Promise<OnboardingProgress> {
    const val = OnboardingValidator.validateStep4(data);
    if (!val.isValid) {
      throw new Error(`Errores en Paso 4: ${val.errors.join(', ')}`);
    }

    const progress = await this.getProgress(resortId);
    progress.stepData.step4 = data;
    progress.stepsSaved.step4 = true;
    if (progress.currentStep === 4) {
      progress.currentStep = 5;
    }
    progress.updatedAt = new Date().toISOString();

    await onboardingRepository.saveProgress(resortId, progress);
    return progress;
  }

  /**
   * Saves step 5 data (Website CMS Settings) to onboarding progress.
   */
  public static async saveStep5(resortId: string, data: OnboardingStep5Data): Promise<OnboardingProgress> {
    const val = OnboardingValidator.validateStep5(data);
    if (!val.isValid) {
      throw new Error(`Errores en Paso 5: ${val.errors.join(', ')}`);
    }

    const progress = await this.getProgress(resortId);
    progress.stepData.step5 = data;
    progress.stepsSaved.step5 = true;
    if (progress.currentStep === 5) {
      progress.currentStep = 6;
    }
    progress.updatedAt = new Date().toISOString();

    await onboardingRepository.saveProgress(resortId, progress);
    return progress;
  }

  /**
   * Updates the current active step number without saving form data.
   */
  public static async updateCurrentStep(resortId: string, step: number): Promise<OnboardingProgress> {
    const progress = await this.getProgress(resortId);
    progress.currentStep = step;
    progress.updatedAt = new Date().toISOString();
    await onboardingRepository.saveProgress(resortId, progress);
    return progress;
  }

  /**
   * Validates all steps, compiles them, writes them to their respective operational layers,
   * publishes the website, seeds pricing if necessary, and marks the onboarding as fully complete.
   */
  public static async publishAndComplete(resortId: string): Promise<OnboardingProgress> {
    Logger.info(`Iniciando compilación y publicación final de onboarding para Resort: ${resortId}`);
    
    const progress = await this.getProgress(resortId);
    const { step1, step2, step3, step4, step5 } = progress.stepData;

    // 1. Strict Validation checks
    const val1 = OnboardingValidator.validateStep1(step1);
    const val2 = OnboardingValidator.validateStep2(step2);
    const val3 = OnboardingValidator.validateStep3(step3);
    const val4 = OnboardingValidator.validateStep4(step4);
    const val5 = OnboardingValidator.validateStep5(step5);

    const errors: string[] = [
      ...val1.errors,
      ...val2.errors,
      ...val3.errors,
      ...val4.errors,
      ...val5.errors
    ];

    if (errors.length > 0) {
      Logger.error(`Fallo en validación de onboarding completo para Resort ${resortId}:`, errors);
      throw new Error(`No se puede completar el onboarding. Errores pendientes: ${errors.join(' | ')}`);
    }

    if (!step1 || !step2 || !step3 || !step4 || !step5) {
      throw new Error('Faltan guardar datos de pasos intermedios para completar el onboarding.');
    }

    try {
      // 2. Compile Step 1 & 2: Save Resort Profile Settings
      let resort = await ResortService.getResort(resortId);
      if (resort) {
        const updatedResort: Resort = {
          ...resort,
          name: step1.name,
          slug: resort.slug || step1.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''),
          businessType: step1.language === 'OTHER' ? 'OTHER' : (step3.type.toUpperCase() as any), // maps to active accommodation type
          logo: step1.logo || resort.logo || 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80',
          coverImage: step1.coverImage || resort.coverImage,
          email: step2.email,
          phone: step2.phone,
          currency: step1.currency,
          timezone: step1.timezone,
          language: step1.language,
        };
        await ResortService.saveResort(updatedResort);
        Logger.info(`[Onboarding Compile] Perfil del Resort actualizado.`);
      }

      // 3. Compile Step 1, 2, 4: Save App Settings
      let currentSettings = await SettingsService.getSettings(resortId);
      const appSettings: AppSettings = {
        appName: step1.name,
        appSubtitle: step1.description,
        logoIcon: 'trees',
        address: step2.address,
        locationDetails: step2.address,
        googleMapsLink: step2.googleMapsUrl || '',
        hours: `Check-in: ${step4.checkInTime} hs / Check-out: ${step4.checkOutTime} hs`,
        phone: step2.phone,
        whatsapp: step2.whatsapp,
        email: step2.email,
        terminology: {
          singular: step3.type === 'cabin' ? 'Cabaña' : step3.type === 'glamping' ? 'Domo' : 'Habitación',
          plural: step3.type === 'cabin' ? 'Cabañas' : step3.type === 'glamping' ? 'Domos' : 'Habitaciones',
        },
        branding: {
          primaryColor: '#2d6a4f', // Forest green default
          secondaryColor: '#40916c',
        }
      };
      await SettingsService.saveSettings(resortId, appSettings);
      Logger.info(`[Onboarding Compile] Configuración SaaS AppSettings guardada.`);

      // 4. Compile Step 3 & 4: Save First Accommodation
      const existingAccommodations = await AccommodationService.getAccommodations(resortId);
      const nextId = existingAccommodations.length > 0 
        ? Math.max(...existingAccommodations.map(a => a.id), 0) + 1 
        : 1;

      const firstAccommodation: Accommodation = {
        id: nextId,
        name: step3.name,
        slug: step3.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''),
        type: step3.type,
        status: 'available',
        description: step3.description,
        price: step3.price,
        discount: 0,
        offer: '',
        category: 'standard',
        capacity: step3.capacity,
        rating: 4.8,
        image: step3.image,
        images: [step3.image],
        amenities: step3.amenities,
        active: true,
        featured: true,
        policies: {
          checkInTime: step4.checkInTime,
          checkOutTime: step4.checkOutTime,
          rules: [
            'No fumar en el interior del alojamiento.',
            'Mantener silencio respetuoso nocturno.',
            'Hacer uso responsable de las instalaciones.'
          ],
          cancellationPolicy: step4.cancellationPolicy
        }
      };
      await AccommodationService.saveAccommodation(resortId, firstAccommodation);
      Logger.info(`[Onboarding Compile] Primer alojamiento creado con ID: ${nextId}.`);

      // 5. Compile Step 4: Seed Pricing Engines and configure base Season/Rate
      await PricingService.seedDefaultPricingIfNeeded(resortId);
      Logger.info(`[Onboarding Compile] Motores de tarifas pre-configurados.`);

      // 6. Compile Step 5: Save & Publish Web Content CMS
      const cmsContent = await WebsiteContentService.getContent(resortId);
      
      // Merge with step onboarding info
      cmsContent.home.title = step5.title;
      cmsContent.home.subtitle = step5.subtitle;
      cmsContent.home.heroImage = step5.heroImage;
      cmsContent.home.ctaText = step5.ctaText;
      
      cmsContent.contact.email = step2.email;
      cmsContent.contact.phone = step2.phone;
      cmsContent.contact.whatsapp = step2.whatsapp;
      cmsContent.contact.address = step2.address;
      cmsContent.contact.googleMapsUrl = step2.googleMapsUrl || '';
      cmsContent.contact.instagram = step2.instagram || '';
      cmsContent.contact.facebook = step2.facebook || '';

      cmsContent.policies.checkIn = `Check-in a partir de las ${step4.checkInTime} hs.`;
      cmsContent.policies.checkOut = `Check-out antes de las ${step4.checkOutTime} hs.`;
      cmsContent.policies.cancellations = step4.cancellationPolicy;

      // Also publish to CMS Web
      await WebsiteContentService.publishContent(resortId, cmsContent);
      Logger.info(`[Onboarding Compile] Contenido del sitio web CMS publicado de forma oficial.`);

      // 7. Complete Onboarding Progress state
      progress.completed = true;
      progress.currentStep = 6;
      progress.stepsSaved.step6 = true;
      progress.updatedAt = new Date().toISOString();

      await onboardingRepository.saveProgress(resortId, progress);
      Logger.info(`[Onboarding Complete] Onboarding del Resort ${resortId} marcado como completado.`);
      
      return progress;
    } catch (err) {
      Logger.error(`Error crítico durante compilación de onboarding:`, err);
      throw new Error(`Error al compilar y publicar: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
export default OnboardingService;
