import { guestRepository } from '../repositories/GuestRepository';
import { guestTimelineRepository } from '../repositories/GuestTimelineRepository';
import { guestHistoryRepository } from '../repositories/GuestHistoryRepository';
import { guestPreferencesRepository } from '../repositories/GuestPreferencesRepository';
import { bookingRepository } from '../../bookings/repositories/BookingRepository';
import { GuestProfile } from '../types/crm';
import { Logger } from '../../../core/logger/Logger';

export class GuestMergeService {
  public static async mergeProfiles(
    resortId: string,
    targetGuestId: string,
    sourceGuestId: string,
    userId?: string
  ): Promise<GuestProfile> {
    const operator = userId || 'system';

    if (targetGuestId === sourceGuestId) {
      throw new Error('No se puede fusionar un perfil consigo mismo.');
    }

    const target = await guestRepository.findById(resortId, targetGuestId);
    const source = await guestRepository.findById(resortId, sourceGuestId);

    if (!target || !source) {
      throw new Error('No se encontraron los perfiles que se desean fusionar.');
    }

    Logger.info(`[GuestMergeService] Fusionando perfil duplicado #${sourceGuestId} (${source.fullName}) en #${targetGuestId} (${target.fullName})`);

    // 1. Enrich Target Profile
    const enrichment: Partial<GuestProfile> = {};
    if (!target.phone && source.phone) enrichment.phone = source.phone;
    if (!target.country && source.country) enrichment.country = source.country;
    if (!target.province && source.province) enrichment.province = source.province;
    if (!target.city && source.city) enrichment.city = source.city;
    if (!target.address && source.address) enrichment.address = source.address;
    if (!target.profession && source.profession) enrichment.profession = source.profession;
    if (!target.nationality && source.nationality) enrichment.nationality = source.nationality;
    
    // Notes unification
    if (source.notes && source.notes.trim()) {
      if (target.notes && target.notes.trim()) {
        if (!target.notes.includes(source.notes)) {
          enrichment.notes = `${target.notes}\n[Notas de Fusión]: ${source.notes}`;
        }
      } else {
        enrichment.notes = source.notes;
      }
    }

    // Tags unification
    const combinedTags = Array.from(new Set([...(target.tags || []), ...(source.tags || [])]));
    if (combinedTags.length !== (target.tags || []).length) {
      enrichment.tags = combinedTags;
    }

    const updatedTarget = await guestRepository.update(resortId, targetGuestId, {
      ...enrichment,
      updatedBy: operator,
      updatedAt: new Date().toISOString()
    });

    // 2. Unify Preferences
    const targetPref = await guestPreferencesRepository.getByGuestId(resortId, targetGuestId);
    const sourcePref = await guestPreferencesRepository.getByGuestId(resortId, sourceGuestId);
    
    const prefUpdated = {
      ...targetPref,
      favoriteRoomType: targetPref.favoriteRoomType || sourcePref.favoriteRoomType,
      preferredFloor: targetPref.preferredFloor || sourcePref.preferredFloor,
      preferredView: targetPref.preferredView || sourcePref.preferredView,
      bedType: targetPref.bedType || sourcePref.bedType,
      pillowType: targetPref.pillowType || sourcePref.pillowType,
      dietaryRestrictions: targetPref.dietaryRestrictions || sourcePref.dietaryRestrictions,
      accessibilityNeeds: targetPref.accessibilityNeeds || sourcePref.accessibilityNeeds,
      favoriteDrinks: targetPref.favoriteDrinks || sourcePref.favoriteDrinks,
      remarks: targetPref.remarks || sourcePref.remarks,
      hasPets: targetPref.hasPets || sourcePref.hasPets,
      updatedAt: new Date().toISOString()
    };
    await guestPreferencesRepository.savePreferences(resortId, prefUpdated);

    // 3. Re-associate bookings in Booking Engine
    const bookings = await bookingRepository.getAll(resortId);
    const sourceBookings = bookings.filter(b => b.guestId === sourceGuestId);
    
    Logger.info(`[GuestMergeService] Reasociando ${sourceBookings.length} reservas del perfil origen al perfil destino.`);
    for (const b of sourceBookings) {
      await bookingRepository.save(resortId, {
        ...b,
        guestId: targetGuestId,
        updatedAt: new Date().toISOString()
      });

      // Track timeline event on newly associated booking
      await guestTimelineRepository.addEvent(resortId, {
        guestId: targetGuestId,
        resortId,
        type: 'booking',
        title: 'Reserva reasociada por fusión',
        description: `Se reasoció la reserva #${b.id} desde el perfil anterior de ${source.fullName}.`,
        createdBy: operator,
        referenceId: String(b.id)
      });
    }

    // 4. Record history and timeline for target (main profile)
    await guestHistoryRepository.addRecord(resortId, {
      guestId: targetGuestId,
      resortId,
      eventType: 'profile_merged',
      description: `Fusión de perfiles: el perfil duplicado #${sourceGuestId} (${source.fullName}) fue absorbido por este perfil.`,
      performedBy: operator,
      referenceId: sourceGuestId
    });

    await guestTimelineRepository.addEvent(resortId, {
      guestId: targetGuestId,
      resortId,
      type: 'change',
      title: 'Fusión de Ficha de Huésped',
      description: `Se incorporó el historial, preferencias y datos de contacto de ${source.fullName} a este perfil.`,
      createdBy: operator,
      referenceId: sourceGuestId
    });

    // 5. Record history/deactivation details on source (old profile)
    await guestHistoryRepository.addRecord(resortId, {
      guestId: sourceGuestId,
      resortId,
      eventType: 'profile_merged',
      description: `Fusión de perfiles: este perfil fue absorbido y desactivado. Perfil principal resultante: #${targetGuestId} (${target.fullName}).`,
      performedBy: operator,
      referenceId: targetGuestId
    });

    await guestTimelineRepository.addEvent(resortId, {
      guestId: sourceGuestId,
      resortId,
      type: 'change',
      title: 'Ficha Fusionada y Desactivada',
      description: `Este perfil fue fusionado dentro de la ficha principal de ${target.fullName}.`,
      createdBy: operator,
      referenceId: targetGuestId
    });

    // Deactivate old profile
    await guestRepository.update(resortId, sourceGuestId, {
      isActive: false,
      notes: `${source.notes || ''}\n[FUSIONADO Y DESACTIVADO] Absorbido dentro del perfil principal #${targetGuestId} (${target.fullName}) el ${new Date().toLocaleDateString()}`,
      updatedBy: operator,
      updatedAt: new Date().toISOString()
    });

    return updatedTarget;
  }
}

export default GuestMergeService;
