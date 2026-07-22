import { Resort, ResortUser, UserProfile, Accommodation, Booking, AppSettings, Page, Review, Promotion, GalleryImage, AccommodationType, Amenity } from '../../types';

const STORAGE_KEY_PREFIX = 'saas_resort_';

// Initial Seed Data
const defaultResorts: Resort[] = [
  {
    id: 'patagonia-refugio',
    name: 'Refugio Nativo',
    slug: 'refugio-native',
    businessType: 'CABIN',
    plan: 'pro',
    active: true,
    logo: '',
    coverImage: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=84',
    email: 'contacto@refugionativo.com',
    phone: '+54 9 294 555 0138',
    website: 'https://refugionativo.com',
    domain: 'refugionativo.com',
    country: 'Argentina',
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    language: 'es',
    createdAt: new Date().toISOString()
  },
  {
    id: 'andes-glamping',
    name: 'Andes Glamping Domes',
    slug: 'andes-glamping',
    businessType: 'GLAMPING',
    plan: 'free',
    active: true,
    logo: '',
    coverImage: 'https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=1200&q=84',
    email: 'domos@andesglamping.com',
    phone: '+54 9 261 444 8899',
    website: 'https://andesglamping.com',
    domain: 'andesglamping.com',
    country: 'Argentina',
    timezone: 'America/Argentina/Mendoza',
    currency: 'USD',
    language: 'es',
    createdAt: new Date().toISOString()
  }
];

const defaultUsers: UserProfile[] = [
  {
    uid: 'demo-owner-uid',
    displayName: 'Adrián Gaborios (Owner)',
    email: 'gaboriosadrian@gmail.com',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    active: true
  },
  {
    uid: 'demo-staff-uid',
    displayName: 'Mariana López (Staff)',
    email: 'mariana@example.com',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    active: true
  }
];

const defaultResortUsers: ResortUser[] = [
  {
    id: 'ru1',
    userId: 'demo-owner-uid',
    resortId: 'patagonia-refugio',
    role: 'owner',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ru2',
    userId: 'demo-owner-uid',
    resortId: 'andes-glamping',
    role: 'admin',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ru3',
    userId: 'demo-staff-uid',
    resortId: 'patagonia-refugio',
    role: 'staff',
    active: true,
    createdAt: new Date().toISOString()
  }
];

const defaultSettingsMap: Record<string, AppSettings> = {
  'patagonia-refugio': {
    appName: "Refugio Nativo",
    appSubtitle: "Cabañas & naturaleza",
    logoIcon: "trees",
    address: "Camino del Bosque 1840, Patagonia Argentina",
    locationDetails: "Nos encontramos en el Camino del Bosque 1840, a solo 15 minutos del centro urbano de la localidad y a 8 minutos del lago principal.",
    googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Camino+del+Bosque+1840+Patagonia",
    hours: "Recepción: todos los días, 08:00 a 22:00 hs",
    phone: "+54 9 294 555 0138",
    whatsapp: "5492945550138",
    email: "gaboriosadrian@gmail.com",
    terminology: {
      singular: "Cabaña",
      plural: "Cabañas"
    }
  },
  'andes-glamping': {
    appName: "Andes Glamping Domes",
    appSubtitle: "Lujo y estrellas en Mendoza",
    logoIcon: "tent",
    address: "Ruta del Sol Km 45, Valle de Uco, Mendoza",
    locationDetails: "Ubicado en el corazón de los viñedos, con vistas a la Cordillera de los Andes y techo transparente para ver el cielo estrellado.",
    googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Valle+de+Uco+Mendoza",
    hours: "Recepción: 24 hs",
    phone: "+54 9 261 444 8899",
    whatsapp: "5492614448899",
    email: "domos@andesglamping.com",
    terminology: {
      singular: "Domo",
      plural: "Domos"
    }
  }
};

const defaultAccommodationsMap: Record<string, Accommodation[]> = {
  'patagonia-refugio': [
    {
      id: 1,
      name: "Cabaña Arrayán",
      slug: "cabana-arrayan",
      type: "cabin",
      description: "Cálida cabaña para dos personas, con ventanales al bosque, cocina equipada y hogar a leña.",
      price: 78000,
      discount: 10,
      offer: "Escapada romántica",
      category: "couples",
      capacity: 2,
      rating: 4.9,
      bedrooms: 1,
      bathrooms: 1,
      image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=84",
      images: [
        "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=84",
        "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=84"
      ],
      amenities: ["Wifi", "Parrilla", "Cocina Completa", "Hogar a Leña", "Estacionamiento"],
      customFields: { salamandra: true, parrilla: true },
      featured: true,
      active: true
    },
    {
      id: 2,
      name: "Cabaña Coihue",
      slug: "cabana-coihue",
      type: "cabin",
      description: "Amplia cabaña familiar con dos habitaciones, parrilla privada y vistas panorámicas.",
      price: 112000,
      discount: 0,
      offer: "",
      category: "family",
      capacity: 5,
      rating: 4.8,
      bedrooms: 2,
      bathrooms: 1,
      image: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=84",
      images: [
        "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=84"
      ],
      amenities: ["Wifi", "Parrilla", "Cocina Completa", "Calefacción", "Jardín Privado", "Estacionamiento"],
      customFields: { salamandra: false, parrilla: true },
      featured: true,
      active: true
    },
    {
      id: 3,
      name: "Cabaña Lenga",
      slug: "cabana-lenga",
      type: "cabin",
      description: "Diseño moderno integrado al paisaje, deck exterior y bañera con vista a las montañas.",
      price: 99000,
      discount: 15,
      offer: "15% temporada baja",
      category: "couples",
      capacity: 2,
      rating: 5.0,
      bedrooms: 1,
      bathrooms: 1,
      image: "https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=900&q=84",
      images: [
        "https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=900&q=84"
      ],
      amenities: ["Wifi", "Deck Exterior", "Bañera Panorámica", "Kitchenette", "Estacionamiento"],
      customFields: { salamandra: true, parrilla: false },
      featured: true,
      active: true
    }
  ],
  'andes-glamping': [
    {
      id: 101,
      name: "Domo Alpha Centauri",
      slug: "domo-alpha-centauri",
      type: "glamping_dome",
      description: "Espectacular domo geodésico con deck suspendido, jacuzzi exterior climatizado y telescopio profesional para observación.",
      price: 150000,
      discount: 0,
      offer: "Estrellas & Vino",
      category: "couples",
      capacity: 2,
      rating: 4.9,
      bedrooms: 1,
      bathrooms: 1,
      image: "https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=900&q=84",
      images: [
        "https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=900&q=84"
      ],
      amenities: ["Wifi", "Jacuzzi", "Telescopio", "Cama King", "Minibar"],
      customFields: { jacuzzi: true, tipoDomo: "Geodésico Premium" },
      featured: true,
      active: true
    },
    {
      id: 102,
      name: "Domo Sirius",
      slug: "domo-sirius",
      type: "glamping_dome",
      description: "Domo familiar con un altillo panorámico, terraza privada y espacio fogonero para las noches patagónicas.",
      price: 185000,
      discount: 10,
      offer: "10% reserva anticipada",
      category: "family",
      capacity: 4,
      rating: 4.7,
      bedrooms: 2,
      bathrooms: 1,
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=84",
      images: [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=84"
      ],
      amenities: ["Wifi", "Fogonero", "Terraza", "Calefacción", "Minibar"],
      customFields: { jacuzzi: false, tipoDomo: "Geodésico Familiar" },
      featured: true,
      active: true
    }
  ]
};

const defaultBookingsMap: Record<string, Booking[]> = {
  'patagonia-refugio': [
    {
      id: Date.now() - 20000,
      cabinId: 1,
      name: "Sofía Martínez",
      phone: "+54 9 11 4522 1098",
      email: "sofia@example.com",
      guests: 2,
      checkIn: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: "confirmed",
      totalPrice: 210600,
      paymentMethod: "visa",
      paymentStatus: "paid",
      notes: "Aniversario de bodas"
    },
    {
      id: Date.now() - 10000,
      cabinId: 3,
      name: "Daniel Rojas",
      phone: "+54 9 341 558 9201",
      email: "daniel@example.com",
      guests: 2,
      checkIn: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 13 * 86400000).toISOString().split('T')[0],
      status: "pending",
      totalPrice: 252450,
      paymentMethod: "mastercard",
      paymentStatus: "pending"
    }
  ],
  'andes-glamping': [
    {
      id: Date.now() - 5000,
      cabinId: 101,
      name: "Lucas Giménez",
      phone: "+54 9 261 555 1212",
      email: "lucas@example.com",
      guests: 2,
      checkIn: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      status: "confirmed",
      totalPrice: 450000,
      paymentMethod: "transfer",
      paymentStatus: "paid",
      notes: "Luna de miel"
    }
  ]
};

const defaultPagesMap: Record<string, Page[]> = {
  'patagonia-refugio': [
    { id: 'p1', slug: 'home', title: 'Bienvenidos', content: 'Un oasis de paz y naturaleza en la cordillera patagónica.', active: true, updatedAt: new Date().toISOString() },
    { id: 'p2', slug: 'about', title: 'Sobre Nosotros', content: 'Somos una familia apasionada por el turismo sostenible y el cuidado del bosque nativo.', active: true, updatedAt: new Date().toISOString() }
  ],
  'andes-glamping': [
    { id: 'p1', slug: 'home', title: 'Andes Glamping', content: 'Una experiencia cinco estrellas bajo los cielos más puros del mundo.', active: true, updatedAt: new Date().toISOString() }
  ]
};

const defaultReviewsMap: Record<string, Review[]> = {
  'patagonia-refugio': [
    { id: 'r1', accommodationId: 1, guestName: 'Carlos P.', rating: 5, comment: 'La mejor experiencia de descanso. El hogar a leña es un sueño.', date: '2026-06-15', approved: true },
    { id: 'r2', accommodationId: 2, guestName: 'Valeria M.', rating: 4, comment: 'Hermosa cabaña familiar. Muy buena parrilla.', date: '2026-07-02', approved: true }
  ],
  'andes-glamping': [
    { id: 'r101', accommodationId: 101, guestName: 'Juan S.', rating: 5, comment: 'Ver las estrellas desde el jacuzzi con una copa de malbec es insuperable.', date: '2026-07-10', approved: true }
  ]
};

const defaultPromotionsMap: Record<string, Promotion[]> = {
  'patagonia-refugio': [
    { id: 'pr1', code: 'WINTER15', discountType: 'percentage', value: 15, active: true, startDate: '2026-06-01', endDate: '2026-08-31' }
  ],
  'andes-glamping': [
    { id: 'pr101', code: 'GLAMPING10', discountType: 'percentage', value: 10, active: true, startDate: '2026-01-01', endDate: '2026-12-31' }
  ]
};

const defaultGalleryMap: Record<string, GalleryImage[]> = {
  'patagonia-refugio': [
    { id: 'g1', url: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=600&q=80', path: 'local/gallery/g1', fileName: 'refugio1.jpg', createdAt: new Date().toISOString() },
    { id: 'g2', url: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=600&q=80', path: 'local/gallery/g2', fileName: 'refugio2.jpg', createdAt: new Date().toISOString() }
  ],
  'andes-glamping': [
    { id: 'g101', url: 'https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=600&q=80', path: 'local/gallery/g101', fileName: 'glamping1.jpg', createdAt: new Date().toISOString() }
  ]
};

const defaultAccommodationTypesMap: Record<string, AccommodationType[]> = {
  'patagonia-refugio': [
    {
      id: 'cabin',
      displayName: 'Cabaña',
      icon: 'trees',
      defaultAmenities: ['wifi', 'parrilla', 'cocina_completa'],
      customFields: [
        { key: 'salamandra', label: 'Salamandra / Estufa a leña', type: 'boolean' },
        { key: 'vistas', label: 'Vistas al Bosque', type: 'boolean' }
      ]
    },
    {
      id: 'glamping',
      displayName: 'Glamping',
      icon: 'tent',
      defaultAmenities: ['wifi', 'parrilla', 'fogonero'],
      customFields: [
        { key: 'jacuzzi_exterior', label: 'Jacuzzi Exterior', type: 'boolean' },
        { key: 'telescopio', label: 'Telescopio', type: 'boolean' }
      ]
    }
  ],
  'andes-glamping': [
    {
      id: 'glamping',
      displayName: 'Glamping',
      icon: 'tent',
      defaultAmenities: ['wifi', 'jacuzzi', 'telescopio'],
      customFields: [
        { key: 'jacuzzi_exterior', label: 'Jacuzzi Exterior', type: 'boolean' },
        { key: 'telescopio', label: 'Telescopio', type: 'boolean' }
      ]
    },
    {
      id: 'tiny_house',
      displayName: 'Tiny House',
      icon: 'mountain',
      defaultAmenities: ['wifi', 'calefaccion'],
      customFields: [
        { key: 'deck_privado', label: 'Deck Privado', type: 'boolean' }
      ]
    }
  ]
};

const defaultAmenitiesMap: Record<string, Amenity[]> = {
  'patagonia-refugio': [
    { id: 'wifi', name: 'WiFi de Alta Velocidad', icon: 'Wifi', category: 'General' },
    { id: 'parrilla', name: 'Parrilla Privada', icon: 'Flame', category: 'Exterior' },
    { id: 'cocina_completa', name: 'Cocina Completa', icon: 'CookingPot', category: 'Cocina' },
    { id: 'hogar_lena', name: 'Hogar a Leña', icon: 'Flame', category: 'General' },
    { id: 'estacionamiento', name: 'Estacionamiento Gratuito', icon: 'Compass', category: 'Servicios' }
  ],
  'andes-glamping': [
    { id: 'wifi', name: 'WiFi Starlink', icon: 'Wifi', category: 'General' },
    { id: 'jacuzzi', name: 'Jacuzzi Climatizado', icon: 'Flame', category: 'Wellness' },
    { id: 'telescopio', name: 'Telescopio Profesional', icon: 'Compass', category: 'Entretenimiento' },
    { id: 'fogonero', name: 'Fogonero de Piedra', icon: 'Flame', category: 'Exterior' },
    { id: 'minibar', name: 'Minibar Premium', icon: 'CookingPot', category: 'Cocina' }
  ]
};

export class LocalSaaSDb {
  static init() {
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'resorts')) {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'resorts', JSON.stringify(defaultResorts));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(defaultUsers));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'resortUsers', JSON.stringify(defaultResortUsers));
      
      // Store map objects
      Object.keys(defaultSettingsMap).forEach(id => {
        localStorage.setItem(STORAGE_KEY_PREFIX + `settings_${id}`, JSON.stringify(defaultSettingsMap[id]));
      });
      Object.keys(defaultAccommodationsMap).forEach(id => {
        localStorage.setItem(STORAGE_KEY_PREFIX + `accommodations_${id}`, JSON.stringify(defaultAccommodationsMap[id]));
      });
      Object.keys(defaultBookingsMap).forEach(id => {
        localStorage.setItem(STORAGE_KEY_PREFIX + `bookings_${id}`, JSON.stringify(defaultBookingsMap[id]));
      });
      Object.keys(defaultPagesMap).forEach(id => {
        localStorage.setItem(STORAGE_KEY_PREFIX + `pages_${id}`, JSON.stringify(defaultPagesMap[id]));
      });
      Object.keys(defaultReviewsMap).forEach(id => {
        localStorage.setItem(STORAGE_KEY_PREFIX + `reviews_${id}`, JSON.stringify(defaultReviewsMap[id]));
      });
      Object.keys(defaultPromotionsMap).forEach(id => {
        localStorage.setItem(STORAGE_KEY_PREFIX + `promotions_${id}`, JSON.stringify(defaultPromotionsMap[id]));
      });
      Object.keys(defaultGalleryMap).forEach(id => {
        localStorage.setItem(STORAGE_KEY_PREFIX + `gallery_${id}`, JSON.stringify(defaultGalleryMap[id]));
      });
      Object.keys(defaultAccommodationTypesMap).forEach(id => {
        localStorage.setItem(STORAGE_KEY_PREFIX + `accommodation_types_${id}`, JSON.stringify(defaultAccommodationTypesMap[id]));
      });
      Object.keys(defaultAmenitiesMap).forEach(id => {
        localStorage.setItem(STORAGE_KEY_PREFIX + `amenities_${id}`, JSON.stringify(defaultAmenitiesMap[id]));
      });
    }
  }

  static get<T>(key: string): T {
    this.init();
    const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return data ? JSON.parse(data) : null as unknown as T;
  }

  static set(key: string, data: any): void {
    this.init();
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  }
}
