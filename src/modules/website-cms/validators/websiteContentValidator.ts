import { WebsiteContent } from '../types';

export interface WebsiteContentValidationError {
  home?: {
    title?: string;
    subtitle?: string;
    heroImage?: string;
    ctaText?: string;
  };
  about?: {
    title?: string;
    description?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  seo?: {
    title?: string;
    metaDescription?: string;
  };
  general?: string;
}

export function validateWebsiteContent(content: WebsiteContent): WebsiteContentValidationError {
  const errors: WebsiteContentValidationError = {};

  // Home validation
  if (!content.home.title?.trim()) {
    errors.home = errors.home || {};
    errors.home.title = 'El título principal es obligatorio.';
  }
  if (!content.home.subtitle?.trim()) {
    errors.home = errors.home || {};
    errors.home.subtitle = 'El subtítulo es obligatorio.';
  }
  if (!content.home.heroImage?.trim()) {
    errors.home = errors.home || {};
    errors.home.heroImage = 'La imagen del Hero es obligatoria.';
  }
  if (!content.home.ctaText?.trim()) {
    errors.home = errors.home || {};
    errors.home.ctaText = 'El texto del botón es obligatorio.';
  }

  // About validation
  if (!content.about.title?.trim()) {
    errors.about = errors.about || {};
    errors.about.title = 'El título de Sobre Nosotros es obligatorio.';
  }
  if (!content.about.description?.trim()) {
    errors.about = errors.about || {};
    errors.about.description = 'La descripción es obligatoria.';
  }

  // Contact validation
  if (content.contact.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(content.contact.email.trim())) {
      errors.contact = errors.contact || {};
      errors.contact.email = 'El formato de correo electrónico no es válido.';
    }
  }

  // SEO validation
  if (content.seo.title && content.seo.title.length > 70) {
    errors.seo = errors.seo || {};
    errors.seo.title = 'Se recomienda que el título SEO no supere los 70 caracteres.';
  }
  if (content.seo.metaDescription && content.seo.metaDescription.length > 160) {
    errors.seo = errors.seo || {};
    errors.seo.metaDescription = 'Se recomienda que la meta-descripción no supere los 160 caracteres.';
  }

  return errors;
}
