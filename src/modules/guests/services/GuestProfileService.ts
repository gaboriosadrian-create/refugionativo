import { GuestProfile } from '../types/crm';
import { guestRepository } from '../repositories/GuestRepository';
import { guestTimelineRepository } from '../repositories/GuestTimelineRepository';
import { guestHistoryRepository } from '../repositories/GuestHistoryRepository';
import { guestPreferencesRepository } from '../repositories/GuestPreferencesRepository';
import { GuestValidator } from '../validators/GuestValidator';
import { Logger } from '../../../core/logger/Logger';

export class GuestProfileService {
  public static async getProfiles(resortId: string): Promise<GuestProfile[]> {
    return guestRepository.list(resortId);
  }

  public static async getProfileById(resortId: string, id: string): Promise<GuestProfile | null> {
    return guestRepository.findById(resortId, id);
  }

  public static async createProfile(
    resortId: string,
    profileData: Omit<GuestProfile, 'id' | 'resortId' | 'createdAt' | 'updatedAt' | 'fullName' | 'isActive' | 'createdBy' | 'updatedBy'> & { isActive?: boolean },
    userId?: string
  ): Promise<GuestProfile> {
    const creator = userId || 'system';
    
    const candidate: Omit<GuestProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      ...profileData,
      resortId,
      fullName: `${profileData.firstName.trim()} ${profileData.lastName.trim()}`,
      nationality: profileData.nationality || profileData.country || 'Argentina',
      isActive: profileData.isActive !== undefined ? profileData.isActive : true,
      createdBy: creator,
      updatedBy: creator
    };

    // Validate
    GuestValidator.validate(candidate);

    // Duplicate check by document
    const duplicateByDoc = await guestRepository.findByDocument(resortId, candidate.documentType, candidate.documentNumber);
    if (duplicateByDoc) {
      throw new Error(`Ya existe un huésped registrado con el documento ${candidate.documentType} ${candidate.documentNumber} (${duplicateByDoc.fullName}).`);
    }

    // Duplicate check by email
    const duplicateByEmail = await guestRepository.findByEmail(resortId, candidate.email);
    if (duplicateByEmail) {
      throw new Error(`Ya existe un huésped registrado con el correo electrónico ${candidate.email} (${duplicateByEmail.fullName}).`);
    }

    const id = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const newProfile: GuestProfile = {
      ...candidate,
      id,
      createdAt: now,
      updatedAt: now
    };

    Logger.info(`[GuestProfileService] Creando perfil único con ID ${id}: ${newProfile.fullName}`);
    const created = await guestRepository.create(resortId, newProfile);

    // Track in History
    await guestHistoryRepository.addRecord(resortId, {
      guestId: id,
      resortId,
      eventType: 'booking_created', // fallback general type or profile created
      description: `Ficha unificada creada para el huésped: ${newProfile.fullName}`,
      performedBy: creator,
      referenceId: id
    });

    // Track on Timeline
    await guestTimelineRepository.addEvent(resortId, {
      guestId: id,
      resortId,
      type: 'observation',
      title: 'Ficha Unificada Creada',
      description: `El perfil de ${newProfile.fullName} fue registrado con éxito en el sistema.`,
      createdBy: creator,
      referenceId: id
    });

    // Create default preferences
    await guestPreferencesRepository.getByGuestId(resortId, id);

    return created;
  }

  public static async updateProfile(
    resortId: string,
    id: string,
    fields: Partial<GuestProfile>,
    userId?: string
  ): Promise<GuestProfile> {
    const updater = userId || 'system';
    const existing = await guestRepository.findById(resortId, id);
    if (!existing) {
      throw new Error(`El huésped con ID ${id} no existe.`);
    }

    const candidate: GuestProfile = {
      ...existing,
      ...fields,
      fullName: `${fields.firstName !== undefined ? fields.firstName.trim() : existing.firstName} ${fields.lastName !== undefined ? fields.lastName.trim() : existing.lastName}`,
      updatedBy: updater,
      updatedAt: new Date().toISOString()
    };

    // Validate
    GuestValidator.validate(candidate);

    // Duplicate document checks
    if (fields.documentType !== undefined || fields.documentNumber !== undefined) {
      const duplicateByDoc = await guestRepository.findByDocument(resortId, candidate.documentType, candidate.documentNumber);
      if (duplicateByDoc && duplicateByDoc.id !== id) {
        throw new Error(`Ya existe otro huésped registrado con el documento ${candidate.documentType} ${candidate.documentNumber} (${duplicateByDoc.fullName}).`);
      }
    }

    // Duplicate email checks
    if (fields.email !== undefined) {
      const duplicateByEmail = await guestRepository.findByEmail(resortId, candidate.email);
      if (duplicateByEmail && duplicateByEmail.id !== id) {
        throw new Error(`Ya existe otro huésped registrado con el correo electrónico ${candidate.email} (${duplicateByEmail.fullName}).`);
      }
    }

    Logger.info(`[GuestProfileService] Actualizando perfil ${id}: ${candidate.fullName}`);
    const updated = await guestRepository.update(resortId, id, candidate);

    // Track update in History & Timeline
    await guestHistoryRepository.addRecord(resortId, {
      guestId: id,
      resortId,
      eventType: 'preference_updated',
      description: `Perfil actualizado. Campos modificados: ${Object.keys(fields).join(', ')}`,
      performedBy: updater,
      referenceId: id
    });

    await guestTimelineRepository.addEvent(resortId, {
      guestId: id,
      resortId,
      type: 'change',
      title: 'Perfil de Huésped Actualizado',
      description: `Se actualizaron datos de contacto de ${updated.fullName}`,
      createdBy: updater,
      referenceId: id
    });

    return updated;
  }
}

export default GuestProfileService;
