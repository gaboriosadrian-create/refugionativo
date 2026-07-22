import React, { useState } from 'react';
import { useWebsite } from '../contexts/WebsiteContext';
import { 
  Globe, 
  Coins, 
  Menu, 
  X, 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin, 
  LogOut,
  ChevronDown
} from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  onSwitchToBackoffice: () => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, onSwitchToBackoffice }) => {
  const { 
    settings, 
    websiteContent: typedWebsiteContent,
    activePage, 
    navigateTo, 
    currency, 
    setCurrency, 
    language, 
    setLanguage 
  } = useWebsite();

  const websiteContent = typedWebsiteContent as any;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  if (!settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full border-4 border-t-emerald-600 border-slate-200 animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600 font-sans">Cargando Portal Público...</p>
        </div>
      </div>
    );
  }

  const primaryColor = settings.primaryColor || '#0f3c25';
  const secondaryColor = settings.secondaryColor || '#f7f9f5';

  // Map typography to Tailwind classes
  const fontClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    space: 'font-sans tracking-wide',
    elegant: 'font-serif tracking-tight'
  }[settings.typography || 'sans'];

  // Currency list
  const currencies = [
    { code: 'ARS', label: 'ARS ($)' },
    { code: 'USD', label: 'USD (US$)' },
    { code: 'EUR', label: 'EUR (€)' }
  ];

  // Language list
  const languages = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' }
  ];

  // Apply colors dynamically using CSS variables
  const colorStyles = `
    :root {
      --public-primary: ${primaryColor};
      --public-secondary: ${secondaryColor};
    }
  `;

  const navItems = [
    { id: 'home', label: 'Inicio' },
    { id: 'accommodations', label: 'Alojamientos' },
    { id: 'contact', label: 'Contacto' },
    { id: 'policies', label: 'Políticas' }
  ] as const;

  const handleWhatsAppClick = () => {
    const number = websiteContent?.contact?.whatsapp || settings.whatsapp || "5492945550138";
    const appName = settings.businessName || "StayFlow Resort";
    const message = encodeURIComponent(`Hola ${appName}, visito su sitio web y quisiera consultar sobre alojamiento.`);
    window.open(`https://wa.me/${number}?text=${message}`, "_blank", "noopener noreferrer");
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#fafaf9] ${fontClass} text-slate-800`}>
      <style>{colorStyles}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Brand Logo / Name */}
            <div 
              onClick={() => navigateTo('home')} 
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.businessName} 
                  className="h-11 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              <span className="font-display font-extrabold text-2xl tracking-tight text-[var(--public-primary)]">
                {settings.businessName}
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`text-sm font-bold transition-all relative py-2 cursor-pointer ${
                    activePage === item.id 
                      ? 'text-[var(--public-primary)]' 
                      : 'text-slate-500 hover:text-[var(--public-primary)]'
                  }`}
                >
                  {item.label}
                  {activePage === item.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--public-primary)] rounded-full animate-fade-in" />
                  )}
                </button>
              ))}
            </nav>

            {/* Config & Action Selectors */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setLanguageDropdownOpen(!languageDropdownOpen);
                    setCurrencyDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:border-slate-300 transition-all cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{languages.find(l => l.code === language)?.label || 'Español'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {languageDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white border border-slate-100 shadow-lg py-1 z-50">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLanguage(l.code);
                          setLanguageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer ${
                          language === l.code ? 'text-[var(--public-primary)] font-bold' : 'text-slate-600'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setCurrencyDropdownOpen(!currencyDropdownOpen);
                    setLanguageDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:border-slate-300 transition-all cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{currencies.find(c => c.code === currency)?.label || 'ARS ($)'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {currencyDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white border border-slate-100 shadow-lg py-1 z-50">
                    {currencies.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCurrency(c.code);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer ${
                          currency === c.code ? 'text-[var(--public-primary)] font-bold' : 'text-slate-600'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reserve CTA */}
              <button
                onClick={handleWhatsAppClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--public-primary)] hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Reservar</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white animate-fade-in">
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigateTo(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 rounded-xl text-base font-bold transition-all cursor-pointer ${
                    activePage === item.id 
                      ? 'bg-slate-50 text-[var(--public-primary)]' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 px-4">
                {/* Language Select */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 bg-white focus:outline-none"
                >
                  {languages.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>

                {/* Currency Select */}
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 bg-white focus:outline-none"
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 px-4">
                <button
                  onClick={() => {
                    handleWhatsAppClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[var(--public-primary)] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span>Contactar Reservas</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow animate-fade-in duration-300">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Column 1: Info */}
            <div className="space-y-4">
              <span className="font-display font-black text-2xl tracking-tight text-white">
                {settings.businessName}
              </span>
              <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                {websiteContent?.footer?.description || settings.description}
              </p>
              {/* Social links */}
              <div className="flex space-x-4 pt-2">
                {(websiteContent?.footer?.socialLinks?.instagram || settings.socialLinks.instagram) && (
                  <a 
                    href={websiteContent?.footer?.socialLinks?.instagram || settings.socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 rounded-full hover:bg-[var(--public-primary)] hover:text-white transition-all text-slate-400"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {(websiteContent?.footer?.socialLinks?.facebook || settings.socialLinks.facebook) && (
                  <a 
                    href={websiteContent?.footer?.socialLinks?.facebook || settings.socialLinks.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 rounded-full hover:bg-[var(--public-primary)] hover:text-white transition-all text-slate-400"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {(websiteContent?.footer?.socialLinks?.twitter || settings.socialLinks.twitter) && (
                  <a 
                    href={websiteContent?.footer?.socialLinks?.twitter || settings.socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 rounded-full hover:bg-[var(--public-primary)] hover:text-white transition-all text-slate-400"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {websiteContent?.footer?.socialLinks?.linkedin && (
                  <a 
                    href={websiteContent.footer.socialLinks.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 rounded-full hover:bg-[var(--public-primary)] hover:text-white transition-all text-slate-400"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Navegación</h4>
              <ul className="space-y-2 text-xs">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => navigateTo(item.id)}
                      className="hover:text-white hover:underline transition-all cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contacto</h4>
              {(websiteContent?.contact?.address || settings.address) && (
                <div className="flex items-start gap-2.5 text-xs text-slate-400">
                  <MapPin className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
                  <span>{websiteContent?.contact?.address || settings.address}</span>
                </div>
              )}
              {(websiteContent?.contact?.phone || settings.phone) && (
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <Phone className="w-4 h-4 text-orange flex-shrink-0" />
                  <span>{websiteContent?.contact?.phone || settings.phone}</span>
                </div>
              )}
              {(websiteContent?.contact?.email || settings.email) && (
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <Mail className="w-4 h-4 text-orange flex-shrink-0" />
                  <span className="break-all">{websiteContent?.contact?.email || settings.email}</span>
                </div>
              )}
            </div>

            {/* Column 4: Platform Switcher (Secure link to admin) */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Acceso</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                ¿Formas parte del equipo de gestión? Haz clic aquí para administrar reservas, tarifas y alojamientos.
              </p>
              <button
                onClick={onSwitchToBackoffice}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Acceder al Backoffice</span>
              </button>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} {settings.businessName}. {websiteContent?.footer?.copyrightText || 'Todos los derechos reservados.'}</p>
            <p>SaaS Platform Multi-Tenant • Powered by StayFlow • {websiteContent?.seo?.title || ''}</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <button
        onClick={handleWhatsAppClick}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-[#25d366] text-white shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center hover:opacity-95"
        title="Consultar por WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
      </button>
    </div>
  );
};
