import React, { useRef } from 'react';
import { useWebsite } from '../contexts/WebsiteContext';
import { useSearch, SearchForm, SearchResults } from '../../public-search';
import { 
  ArrowRight, 
  MapPin, 
  Trees, 
  ShieldCheck, 
  Leaf, 
  Heart, 
  Star, 
  MessageCircle
} from 'lucide-react';
import * as Icons from 'lucide-react';

export const Home: React.FC = () => {
  const { settings, websiteContent, accommodations, navigateTo } = useWebsite();
  const { hasSearched } = useSearch();
  const resultsRef = useRef<HTMLDivElement>(null);

  if (!settings) return null;

  const handleSearchSubmit = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const featured = accommodations.filter(a => a.featured || a.sortOrder === 0).slice(0, 3);
  const displayAccommodations = featured.length > 0 ? featured : accommodations.slice(0, 3);

  // Default beautiful services list
  const fallbackServices = [
    { icon: 'Wifi', title: 'WiFi de Alta Velocidad', desc: 'Conectividad Starlink estable en todo el predio para home-office.' },
    { icon: 'Coffee', title: 'Desayuno Artesanal', desc: 'Canasta de panificados caseros y mermeladas regionales entregada en tu puerta.' },
    { icon: 'Flame', title: 'Área de Fogón', desc: 'Espacio común de encuentro bajo las estrellas patagónicas.' },
    { icon: 'Compass', title: 'Senderos Exclusivos', desc: 'Caminatas guiadas y autoguiadas por el bosque nativo y cascadas.' },
    { icon: 'Car', title: 'Estacionamiento Gratis', desc: 'Seguridad y comodidad justo al lado de tu alojamiento.' },
    { icon: 'Tv', title: 'Smart TV & Streaming', desc: 'Entretenimiento garantizado con acceso a tus plataformas favoritas.' }
  ];

  // Gallery images gathered from actual accommodations
  const galleryImages = accommodations
    .flatMap(a => [a.gallery?.coverImage, ...(a.gallery?.images?.map(img => img.url) || [])])
    .filter(Boolean)
    .slice(0, 6);

  const defaultGallery = [
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80'
  ];

  const finalGallery = galleryImages.length >= 3 ? galleryImages : defaultGallery;

  const handleWhatsAppClick = () => {
    const number = websiteContent?.contact?.whatsapp || settings.whatsapp || "5492945550138";
    const appName = settings.businessName || "StayFlow Resort";
    const message = encodeURIComponent(`Hola ${appName}, quisiera consultar sobre alojamiento.`);
    window.open(`https://wa.me/${number}?text=${message}`, "_blank", "noopener noreferrer");
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Sparkles;
    return <IconComponent className="w-6 h-6 text-[var(--public-primary)]" />;
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center bg-slate-950 text-white overflow-hidden">
        {/* Hero Background image with lazy loading */}
        <div className="absolute inset-0">
          <img 
            src={websiteContent?.home?.heroImage || "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1800&q=85"} 
            alt={settings.businessName} 
            className="w-full h-full object-cover opacity-45 select-none"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 space-y-10">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur-md text-emerald-300">
              <MapPin className="w-3.5 h-3.5" />
              {websiteContent?.contact?.address || settings.address}
            </span>
            
            <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight leading-tight max-w-3xl">
              {websiteContent?.home?.title || settings.seo.title.split('|')[0] || `Tu descanso en la Patagonia.`}
            </h1>
            
            <p className="text-slate-200/90 text-base sm:text-lg leading-relaxed max-w-2xl">
              {websiteContent?.home?.subtitle || settings.description}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigateTo((websiteContent?.home?.ctaLink as any) || 'accommodations')}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[var(--public-primary)] hover:opacity-95 text-white font-bold text-sm px-8 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <span>{websiteContent?.home?.ctaText || 'Explorar Alojamientos'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={handleWhatsAppClick}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm px-8 backdrop-blur-sm active:scale-95 transition-all cursor-pointer"
              >
                <span>Consultar por WhatsApp</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <SearchForm onSearchSubmit={handleSearchSubmit} variant="home" />
          </div>
        </div>
      </section>

      {/* Search Results section */}
      {hasSearched && (
        <section ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 scroll-mt-28">
          <SearchResults />
        </section>
      )}

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-sans">Garantía Directa</h3>
              <p className="text-slate-500 text-xs">Reserva segura y trato personalizado con el dueño.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-800">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-sans">Entorno de Ensueño</h3>
              <p className="text-slate-500 text-xs">Ubicación privilegiada rodeada de bosques y lagos.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-800">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-sans">Sostenibilidad</h3>
              <p className="text-slate-500 text-xs">Comprometidos con el cuidado del medio ambiente local.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resort Summary Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--public-primary)] uppercase tracking-widest">
              <Trees className="w-4 h-4" /> El Complejo
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
              {websiteContent?.about?.title || "Un santuario diseñado para desconectar y revitalizar el alma"}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              {websiteContent?.about?.description || `En ${settings.businessName}, entendemos que viajar es más que cambiar de lugar; es cambiar el ritmo. Ubicado en el corazón del Valle, nuestro complejo combina la belleza indómita del entorno natural con las comodidades modernas necesarias para una estancia sin preocupaciones.`}
            </p>
            {websiteContent?.about?.history ? (
              <p className="text-slate-600 text-sm leading-relaxed italic bg-slate-50 p-5 rounded-2xl border border-slate-100">
                {websiteContent.about.history}
              </p>
            ) : (
              <p className="text-slate-600 text-sm leading-relaxed">
                Cada rincón ha sido pensado para integrarse armoniosamente con el bosque patagónico. Disfruta de la tranquilidad, el sonido del viento entre las ramas y la calidez del hogar a leña. Es el lugar perfecto para parejas buscando romance o familias con ganas de aventura.
              </p>
            )}

            {/* Mission & Vision micro-banners */}
            {websiteContent?.about?.mission && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Nuestra Misión</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{websiteContent.about.mission}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Nuestra Visión</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{websiteContent.about.vision}</p>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img 
              src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80" 
              alt="Bosque" 
              className="rounded-3xl object-cover h-64 w-full shadow-md hover:scale-105 transition-all duration-300"
              loading="lazy"
            />
            <img 
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80" 
              alt="Montaña" 
              className="rounded-3xl object-cover h-64 w-full shadow-md mt-8 hover:scale-105 transition-all duration-300"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Featured Accommodations */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[var(--public-primary)] uppercase tracking-widest block">Nuestras Opciones</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">Alojamientos Destacados</h2>
              <p className="text-slate-500 text-xs">Propuestas totalmente equipadas diseñadas con una calidez inconfundible</p>
            </div>
            <button 
              onClick={() => navigateTo('accommodations')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--public-primary)] hover:underline animate-pulse"
            >
              <span>Ver todos los alojamientos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayAccommodations.map((acc) => {
              const formattedPrice = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: settings.currency || 'ARS',
                maximumFractionDigits: 0
              }).format(acc.pricing?.basePrice || 0);

              return (
                <div 
                  key={acc.id} 
                  className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full group"
                >
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img 
                      src={acc.gallery?.coverImage || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80'} 
                      alt={acc.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      loading="lazy"
                    />
                    {acc.featured && (
                      <span className="absolute top-4 left-4 bg-orange text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Recomendada
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-display font-bold text-xl text-slate-900">{acc.name}</h3>
                        <span className="flex items-center gap-1 text-amber-500 font-extrabold text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          5.0
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-2 line-clamp-2">
                        {acc.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Tarifa base desde</span>
                        <span className="font-display font-black text-lg text-[var(--public-primary)]">
                          {formattedPrice} <span className="text-xs font-normal text-slate-500">/ noche</span>
                        </span>
                      </div>
                      <button 
                        onClick={() => navigateTo('accommodation-detail', acc.slug)}
                        className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-slate-100 hover:bg-[var(--public-primary)] hover:text-white text-[var(--public-primary)] font-bold text-xs transition-all cursor-pointer"
                      >
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[var(--public-primary)] uppercase tracking-widest">Atención y Confort</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">Servicios Incluidos en tu Estadía</h2>
          <p className="text-slate-500 text-xs">Disfruta de una experiencia integral sin preocuparte por los detalles organizativos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(websiteContent?.services && websiteContent.services.length > 0
            ? websiteContent.services.filter(s => s.active).sort((a, b) => a.order - b.order)
            : fallbackServices
          ).map((svc: any, idx) => (
            <div key={idx} className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm space-y-3">
              <div className="p-3 bg-emerald-50 rounded-xl w-max">
                {svc.icon ? renderIcon(svc.icon) : <Icons.Sparkles className="w-6 h-6 text-[var(--public-primary)]" />}
              </div>
              <h3 className="font-bold text-sm text-slate-900 font-sans">{svc.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{svc.description || svc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Carousel Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2 text-center">
          <span className="text-xs font-bold text-[var(--public-primary)] uppercase tracking-widest">Nuestra Galería</span>
          <h2 className="font-display font-black text-3xl text-slate-900">Un Recorrido Visual por el Complejo</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(websiteContent?.gallery && websiteContent.gallery.length > 0
            ? websiteContent.gallery.filter(g => g.active).sort((a, b) => a.order - b.order).map(g => g.url)
            : finalGallery
          ).map((img, index) => (
            <div key={index} className="overflow-hidden rounded-2xl aspect-[4/3] relative group shadow-sm bg-slate-100">
              <img 
                src={img} 
                alt={`Galería ${index + 1}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Map & Location info */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-6">
            <span className="text-xs font-bold text-[var(--public-primary)] uppercase tracking-widest block">Ubicación Privilegiada</span>
            <h2 className="font-display font-black text-3xl text-slate-900">Cómo Llegar</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Estamos localizados en una zona de alta tranquilidad, resguardados del ruido de la autopista y rodeados de vegetación autóctona pura.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <Icons.MapPin className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Dirección</h4>
                  <p className="text-slate-500 text-xs">{websiteContent?.contact?.address || settings.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icons.Compass className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Coordenadas de Acceso</h4>
                  <p className="text-slate-500 text-xs">Lat: -40.1554, Lng: -71.3538 (San Martín de los Andes)</p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm relative h-[350px]">
            {/* Embedded static/placeholder elegant map card */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80')" }}>
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="relative z-10 text-center space-y-4 max-w-sm text-white">
                <Icons.MapPin className="w-10 h-10 text-orange mx-auto animate-bounce" />
                <h3 className="font-bold text-lg font-sans">Navegación Interactiva</h3>
                <p className="text-xs text-slate-200">
                  Ubicación exacta de {settings.businessName}. Presiona el botón de abajo para trazar la ruta de navegación GPS interactiva.
                </p>
                <a 
                  href={websiteContent?.contact?.googleMapsUrl || "https://maps.google.com"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex min-h-[44px] items-center justify-center px-6 rounded-xl bg-[var(--public-primary)] hover:opacity-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Abrir Mapa de Google
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-[var(--public-primary)] text-white p-8 sm:p-12 text-center overflow-hidden shadow-xl">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/60 to-slate-950/80" />
          </div>
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="font-display font-black text-3xl sm:text-4xl">¿Listo para vivir la experiencia?</h2>
            <p className="text-slate-200/90 text-sm leading-relaxed">
              Consúltanos de manera directa por WhatsApp para verificar tarifas personalizadas, promociones de temporada y coordinar tu reserva de forma segura.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={handleWhatsAppClick}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-white text-[var(--public-primary)] hover:bg-slate-100 font-bold text-sm px-8 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-[var(--public-primary)] text-[var(--public-primary)]" />
                <span>Contactar por WhatsApp</span>
              </button>
              <button 
                onClick={() => navigateTo('accommodations')}
                className="inline-flex min-h-[50px] items-center justify-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm px-8 backdrop-blur-sm active:scale-95 transition-all cursor-pointer"
              >
                <span>Ver todos los alojamientos</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
