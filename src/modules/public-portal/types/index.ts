export interface WebsiteSocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

export interface WebsiteSEO {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
}

export interface WebsiteSettings {
  id?: string;
  resortId: string;
  businessName: string;
  description: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string; // Hex code
  secondaryColor: string; // Hex code
  typography: 'sans' | 'serif' | 'mono' | 'space' | 'elegant';
  languages: string[]; // e.g., ['es', 'en']
  currency: string; // e.g., 'ARS', 'USD'
  timezone: string; // e.g., 'America/Argentina/Buenos_Aires'
  socialLinks: WebsiteSocialLinks;
  whatsapp: string;
  email: string;
  phone: string;
  address: string;
  seo: WebsiteSEO;
  updatedAt: string;
}
