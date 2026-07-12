export interface Cabin {
  id: number;
  name: string;
  image: string;
  description: string;
  price: number;
  discount: number; // percentage (0 to 100)
  offer: string; // e.g. "Escapada romántica"
  category: 'couples' | 'family';
  capacity: number;
  rating: number;
}

export interface Booking {
  id: number;
  cabinId: number;
  name: string;
  phone: string;
  email?: string;
  guests: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: number;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  image: string;
}

export interface AppSettings {
  appName: string;
  appSubtitle: string;
  logoIcon: string; // e.g. "trees", "tent", "mountain", "palmtree"
  address: string;
  locationDetails: string;
  googleMapsLink: string;
  hours: string;
  phone: string;
  whatsapp: string;
  email: string;
}
