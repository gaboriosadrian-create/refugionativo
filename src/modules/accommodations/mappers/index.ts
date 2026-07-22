import { Accommodation, AccommodationCapacity, Pricing, AccommodationGallery, AccommodationPolicy, AccommodationLocation } from '../types';

/**
 * Maps a raw database document (Firestore/LocalSaaSDb) into a strongly-typed Domain Accommodation entity.
 * Supports legacy properties to guarantee flawless backward compatibility.
 */
export function toDomain(raw: any): Accommodation {
  if (!raw) {
    throw new Error('Cannot map null or undefined raw accommodation data to domain');
  }

  // Handle compatibility with numeric / string IDs
  const idVal = raw.id !== undefined && raw.id !== null
    ? (isNaN(Number(raw.id)) ? raw.id : Number(raw.id))
    : '';

  // 1. Capacity Mapping
  let capacity: AccommodationCapacity;
  if (raw.capacity && typeof raw.capacity === 'object' && !Array.isArray(raw.capacity)) {
    capacity = {
      adults: Number(raw.capacity.adults) || 0,
      children: Number(raw.capacity.children) || 0,
      babies: Number(raw.capacity.babies) || 0,
      pets: Number(raw.capacity.pets) || 0,
      maxGuests: Number(raw.capacity.maxGuests) || Number(raw.maxGuests) || Number(raw.capacity.adults) || 2
    };
  } else {
    // Fallback from legacy flat capacity properties
    const maxGuestsVal = Number(raw.maxGuests) || Number(raw.capacity) || 2;
    capacity = {
      adults: Number(raw.capacity) || maxGuestsVal,
      children: 0,
      babies: 0,
      pets: 0,
      maxGuests: maxGuestsVal
    };
  }

  // 2. Pricing Mapping
  let pricing: Pricing;
  if (raw.pricing && typeof raw.pricing === 'object') {
    pricing = {
      basePrice: Number(raw.pricing.basePrice) || 0,
      currency: raw.pricing.currency || 'ARS',
      taxIncluded: raw.pricing.taxIncluded ?? true,
      weekendPrice: raw.pricing.weekendPrice !== undefined ? Number(raw.pricing.weekendPrice) : undefined,
      minimumStay: raw.pricing.minimumStay !== undefined ? Number(raw.pricing.minimumStay) : 1,
      futureSeasonPricing: Array.isArray(raw.pricing.futureSeasonPricing)
        ? raw.pricing.futureSeasonPricing.map((item: any) => ({
            seasonName: item.seasonName || '',
            priceMultiplier: Number(item.priceMultiplier) || 1,
            priceOverride: item.priceOverride !== undefined ? Number(item.priceOverride) : undefined,
            startDate: item.startDate,
            endDate: item.endDate
          }))
        : []
    };
  } else {
    // Fallback from legacy flat pricing properties
    pricing = {
      basePrice: Number(raw.price) || 0,
      currency: raw.currency || 'ARS',
      taxIncluded: true,
      weekendPrice: undefined,
      minimumStay: Number(raw.minGuests) || 1,
      futureSeasonPricing: []
    };
  }

  // 3. Gallery Mapping
  let gallery: AccommodationGallery;
  if (raw.gallery && typeof raw.gallery === 'object') {
    gallery = {
      coverImage: raw.gallery.coverImage || raw.image || '',
      images: Array.isArray(raw.gallery.images)
        ? raw.gallery.images.map((img: any) => {
            if (typeof img === 'string') {
              return { url: img, title: '', alt: '' };
            }
            return {
              url: img.url || '',
              title: img.title || '',
              alt: img.alt || '',
              sortOrder: img.sortOrder !== undefined ? Number(img.sortOrder) : undefined
            };
          })
        : []
    };
  } else {
    // Fallback from legacy flat images
    gallery = {
      coverImage: raw.image || '',
      images: Array.isArray(raw.images)
        ? raw.images.map((img: any) => {
            if (typeof img === 'string') {
              return { url: img, title: '', alt: '' };
            }
            return {
              url: img.url || '',
              title: img.title || '',
              alt: img.alt || ''
            };
          })
        : []
    };
  }

  // 4. Policies Mapping
  let policies: AccommodationPolicy;
  if (raw.policies && typeof raw.policies === 'object') {
    policies = {
      checkIn: raw.policies.checkIn || raw.policies.checkInTime || '14:00',
      checkOut: raw.policies.checkOut || raw.policies.checkOutTime || '10:00',
      smoking: !!raw.policies.smoking,
      pets: raw.policies.pets !== undefined ? !!raw.policies.pets : true,
      children: raw.policies.children !== undefined ? !!raw.policies.children : true,
      cancellation: raw.policies.cancellation || raw.policies.cancellationPolicy || 'Cancelación gratuita hasta 7 días antes de la llegada.'
    };
  } else {
    policies = {
      checkIn: '14:00',
      checkOut: '10:00',
      smoking: false,
      pets: true,
      children: true,
      cancellation: 'Cancelación gratuita hasta 7 días antes de la llegada.'
    };
  }

  // 5. Location Mapping
  let location: AccommodationLocation;
  if (raw.location && typeof raw.location === 'object') {
    location = {
      address: raw.location.address || '',
      city: raw.location.city || '',
      province: raw.location.province || '',
      country: raw.location.country || 'Argentina',
      coordinates: raw.location.coordinates || raw.coordinates || undefined,
      mapUrl: raw.location.mapUrl || ''
    };
  } else {
    location = {
      address: typeof raw.location === 'string' ? raw.location : '',
      city: '',
      province: '',
      country: 'Argentina',
      coordinates: raw.coordinates || undefined,
      mapUrl: ''
    };
  }

  return {
    id: idVal,
    resortId: raw.resortId || '',
    slug: raw.slug || '',
    name: raw.name || '',
    typeId: raw.typeId || raw.type || 'standard',
    status: raw.status || 'available',
    description: raw.description || '',
    shortDescription: raw.shortDescription || '',
    capacity,
    pricing,
    gallery,
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    policies,
    location,
    customFields: raw.customFields && typeof raw.customFields === 'object' ? raw.customFields : {},
    featured: !!raw.featured,
    visible: raw.visible !== undefined ? !!raw.visible : (raw.active !== undefined ? !!raw.active : true),
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 0,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    createdBy: raw.createdBy,
    updatedBy: raw.updatedBy,
    deleted: raw.deleted !== undefined ? !!raw.deleted : false,
    deletedAt: raw.deletedAt,
    deletedBy: raw.deletedBy
  };
}

/**
 * Maps a Domain Accommodation entity into a raw Firestore-compatible JSON format.
 */
export function toFirestore(domain: Accommodation): any {
  return {
    resortId: domain.resortId,
    slug: domain.slug,
    name: domain.name,
    typeId: domain.typeId,
    status: domain.status,
    description: domain.description,
    shortDescription: domain.shortDescription || '',
    capacity: {
      adults: domain.capacity.adults,
      children: domain.capacity.children,
      babies: domain.capacity.babies,
      pets: domain.capacity.pets,
      maxGuests: domain.capacity.maxGuests
    },
    pricing: {
      basePrice: domain.pricing.basePrice,
      currency: domain.pricing.currency,
      taxIncluded: domain.pricing.taxIncluded,
      weekendPrice: domain.pricing.weekendPrice ?? null,
      minimumStay: domain.pricing.minimumStay ?? 1,
      futureSeasonPricing: domain.pricing.futureSeasonPricing || []
    },
    gallery: {
      coverImage: domain.gallery.coverImage,
      images: domain.gallery.images
    },
    amenities: domain.amenities,
    policies: {
      checkIn: domain.policies.checkIn,
      checkOut: domain.policies.checkOut,
      smoking: domain.policies.smoking,
      pets: domain.policies.pets,
      children: domain.policies.children,
      cancellation: domain.policies.cancellation
    },
    location: {
      address: domain.location.address,
      city: domain.location.city,
      province: domain.location.province,
      country: domain.location.country,
      coordinates: domain.location.coordinates || null,
      mapUrl: domain.location.mapUrl || ''
    },
    customFields: domain.customFields,
    featured: domain.featured,
    visible: domain.visible,
    sortOrder: domain.sortOrder,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
    createdBy: domain.createdBy || null,
    updatedBy: domain.updatedBy || null,
    deleted: domain.deleted ?? false,
    deletedAt: domain.deletedAt || null,
    deletedBy: domain.deletedBy || null
  };
}

/**
 * Maps a domain Accommodation model back to the simplified, legacy flat format.
 * Enables zero-change backward compatibility with pre-existing templates and views.
 */
export function toLegacy(domain: Accommodation): any {
  return {
    id: domain.id,
    name: domain.name,
    slug: domain.slug,
    type: domain.typeId,
    status: domain.status,
    description: domain.description,
    shortDescription: domain.shortDescription,
    price: domain.pricing.basePrice,
    discount: 0, // discount was previously flat, can default to 0
    offer: '',
    category: 'standard',
    capacity: domain.capacity.maxGuests,
    maxGuests: domain.capacity.maxGuests,
    minGuests: domain.pricing.minimumStay || 1,
    image: domain.gallery.coverImage,
    images: domain.gallery.images.map(img => img.url),
    amenities: domain.amenities,
    customFields: domain.customFields,
    featured: domain.featured,
    active: domain.visible,
    location: domain.location.address || (domain.location.city ? `${domain.location.city}, ${domain.location.province}` : ''),
    coordinates: domain.location.coordinates,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
    deleted: domain.deleted,
    deletedAt: domain.deletedAt,
    deletedBy: domain.deletedBy
  };
}
