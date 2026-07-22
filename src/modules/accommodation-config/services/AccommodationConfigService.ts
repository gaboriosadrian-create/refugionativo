import { accommodationConfigRepository } from '../repositories/AccommodationConfigRepository';
import { AccommodationConfig, AccommodationType, Amenity, AccommodationPolicies, CustomFieldConfig, CapacityOptions, StatusOption } from '../types';
import { Logger } from '../../../core/logger/Logger';

export class AccommodationConfigService {
  /**
   * Generates default accommodation configuration for a resort.
   */
  static getDefaultConfig(resortId: string): AccommodationConfig {
    // Default amenities
    const defaultAmenities: Amenity[] = [
      { id: 'wifi', name: 'WiFi Starlink', icon: 'Wifi', category: 'General', description: 'Conexión a internet satelital de alta velocidad.', visible: true, sortOrder: 1 },
      { id: 'parrilla', name: 'Parrilla Privada', icon: 'Flame', category: 'Exterior', description: 'Parrilla exterior equipada.', visible: true, sortOrder: 2 },
      { id: 'cocina_completa', name: 'Cocina Completa', icon: 'CookingPot', category: 'Cocina', description: 'Heladera, horno, vajilla y utensilios.', visible: true, sortOrder: 3 },
      { id: 'calefaccion', name: 'Calefacción central o estufa', icon: 'Flame', category: 'General', description: 'Para mantener la calidez en días fríos.', visible: true, sortOrder: 4 },
      { id: 'jacuzzi', name: 'Jacuzzi Climatizado', icon: 'Flame', category: 'Wellness', description: 'Jacuzzi privado exterior o interior.', visible: true, sortOrder: 5 },
      { id: 'estacionamiento', name: 'Estacionamiento Gratuito', icon: 'Compass', category: 'Servicios', description: 'Espacio de parking cerca de la unidad.', visible: true, sortOrder: 6 }
    ];

    // Default accommodation types
    const defaultTypes: AccommodationType[] = [
      {
        id: 'cabin',
        displayName: 'Cabaña',
        icon: 'trees',
        active: true,
        sortOrder: 1,
        color: '#15803d', // Green
        defaultAmenities: ['wifi', 'parrilla', 'cocina_completa'],
        customFields: [
          { key: 'salamandra', label: 'Estufa a leña / Salamandra', type: 'boolean' },
          { key: 'deck_vistas', label: 'Deck con vistas panorámicas', type: 'boolean' }
        ]
      },
      {
        id: 'glamping',
        displayName: 'Glamping Dome',
        icon: 'tent',
        active: true,
        sortOrder: 2,
        color: '#0369a1', // Blue
        defaultAmenities: ['wifi', 'jacuzzi', 'parrilla'],
        customFields: [
          { key: 'telescopio', label: 'Telescopio profesional', type: 'boolean' },
          { key: 'climatizado', label: 'Domo Climatizado', type: 'boolean' }
        ]
      },
      {
        id: 'room',
        displayName: 'Habitación de Hotel',
        icon: 'hotel',
        active: true,
        sortOrder: 3,
        color: '#6d28d9', // Purple
        defaultAmenities: ['wifi', 'calefaccion'],
        customFields: [
          { key: 'vista_lago', label: 'Vistas al Lago', type: 'boolean' }
        ]
      }
    ];

    // Default policies
    const defaultPolicies: AccommodationPolicies = {
      checkInTime: '14:00',
      checkInInstructions: 'Recepción abierta desde las 14:00. Check-in autónomo con caja de llaves si llega tarde.',
      checkOutTime: '10:00',
      checkOutInstructions: 'Dejar las llaves en recepción o en la caja de llaves. Asegurar ventanas y puertas.',
      petsAllowed: true,
      petsPolicy: 'Se aceptan mascotas de tamaño pequeño o mediano. No permitidas sobre camas o sillones.',
      childrenAllowed: true,
      childrenPolicy: 'Niños menores de 2 años se hospedan sin cargo adicional.',
      smokingAllowed: false,
      cancellationPolicy: 'Cancelación gratuita hasta 7 días antes de la fecha de llegada seleccionada.',
      depositRequired: true,
      depositPolicy: 'Se requiere el pago de una seña equivalente al 30% del total para confirmar la reserva.',
      observations: 'Mantener el silencio y el respeto por el entorno natural entre las 23:00 y las 08:00 hs.'
    };

    // Default custom fields (global fields)
    const defaultCustomFields: CustomFieldConfig[] = [
      {
        key: 'salamandra_leña',
        label: '¿Tiene Salamandra a Leña?',
        type: 'boolean',
        required: false,
        visible: true,
        filterable: true,
        searchable: false,
        sortOrder: 1,
        defaultValue: false
      },
      {
        key: 'vista_panorámica',
        label: '¿Vistas Panorámicas Especiales?',
        type: 'boolean',
        required: false,
        visible: true,
        filterable: true,
        searchable: false,
        sortOrder: 2,
        defaultValue: false
      },
      {
        key: 'distancia_lago_metros',
        label: 'Distancia al Lago (metros)',
        type: 'number',
        required: false,
        visible: true,
        filterable: false,
        searchable: false,
        sortOrder: 3,
        defaultValue: 100
      }
    ];

    // Default capacity options
    const defaultCapacity: CapacityOptions = {
      adults: { enabled: true, max: 10, label: 'Adultos' },
      children: { enabled: true, max: 8, label: 'Niños (2-12 años)' },
      babies: { enabled: true, max: 4, label: 'Bebés (0-2 años)' },
      pets: { enabled: true, max: 3, label: 'Mascotas' },
      maxGuestsLimit: 12
    };

    // Default status options
    const defaultStatus: StatusOption[] = [
      { id: 'available', label: 'Disponible', color: 'green', active: true },
      { id: 'maintenance', label: 'Mantenimiento', color: 'orange', active: true },
      { id: 'occupied', label: 'Ocupado', color: 'blue', active: true },
      { id: 'inactive', label: 'Inactivo', color: 'red', active: true }
    ];

    return {
      accommodationTypes: defaultTypes,
      amenities: defaultAmenities,
      policies: defaultPolicies,
      customFields: defaultCustomFields,
      capacityOptions: defaultCapacity,
      statusOptions: defaultStatus
    };
  }

  /**
   * Retrieves or seeds the AccommodationConfig for a given resort.
   */
  static async getAccommodationConfig(resortId: string): Promise<AccommodationConfig> {
    Logger.info(`Obteniendo configuración de alojamientos para Resort: ${resortId}`);
    try {
      let config = await accommodationConfigRepository.getConfig(resortId);
      if (!config || !config.accommodationTypes || !config.amenities || !config.policies) {
        Logger.info(`Configuración no encontrada o incompleta para Resort: ${resortId}. Creando valores por defecto...`);
        config = this.getDefaultConfig(resortId);
        await accommodationConfigRepository.saveConfig(resortId, config);
      }
      return config;
    } catch (error) {
      Logger.error(`Error en getAccommodationConfig para Resort: ${resortId}:`, error);
      // Fallback in case of database failures
      return this.getDefaultConfig(resortId);
    }
  }

  /**
   * Saves the AccommodationConfig for a given resort.
   */
  static async saveAccommodationConfig(resortId: string, config: AccommodationConfig): Promise<void> {
    Logger.info(`Guardando configuración de alojamientos para Resort: ${resortId}`);
    await accommodationConfigRepository.saveConfig(resortId, config);
  }
}

export default AccommodationConfigService;
