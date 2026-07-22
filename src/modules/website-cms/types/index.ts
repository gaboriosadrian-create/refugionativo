export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  active: boolean;
  order: number;
}

export interface GalleryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  altText: string;
  order: number;
  active: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  visible: boolean;
}

export interface FooterLink {
  label: string;
  url: string;
}

export interface WebsiteContent {
  id?: string;
  resortId: string;
  home: {
    title: string;
    subtitle: string;
    heroImage: string;
    ctaText: string;
    ctaLink: string;
  };
  about: {
    title: string;
    description: string;
    history: string;
    mission: string;
    vision: string;
  };
  services: ServiceItem[];
  gallery: GalleryItem[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellations: string;
    pets: string;
    children: string;
    smoking: string;
    rules: string[];
  };
  faq: FaqItem[];
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    googleMapsUrl: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
  };
  footer: {
    text: string;
    copyright: string;
    links: FooterLink[];
  };
  seo: {
    title: string;
    metaDescription: string;
    keywords: string;
    ogImage: string;
    twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';
  };
  publishedAt?: string;
  version?: number;
  updatedAt: string;
}
