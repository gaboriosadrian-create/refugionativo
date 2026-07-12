import React from 'react';
import { Trees, Tent, Mountain, Palmtree, Compass, TreePine, MessageCircle, Settings2 } from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings | null;
  onNavigate: (page: string) => void;
  onOpenWhatsApp: () => void;
  onOpenAdminLogin: () => void;
  isAdminAuthenticated: boolean;
}

const renderLogoIcon = (iconName?: string) => {
  switch (iconName?.toLowerCase()) {
    case 'tent': return <Tent className="w-5 h-5 text-forest" />;
    case 'mountain': return <Mountain className="w-5 h-5 text-forest" />;
    case 'palmtree': return <Palmtree className="w-5 h-5 text-forest" />;
    case 'compass': return <Compass className="w-5 h-5 text-forest" />;
    case 'treepine': return <TreePine className="w-5 h-5 text-forest" />;
    default: return <Trees className="w-5 h-5 text-forest" />;
  }
};

export const Header: React.FC<HeaderProps> = ({
  settings,
  onNavigate,
  onOpenWhatsApp,
  onOpenAdminLogin,
  isAdminAuthenticated,
}) => {
  const appName = settings?.appName || "Refugio Nativo";
  const appSubtitle = settings?.appSubtitle || "Cabañas & naturaleza";

  return (
    <header className="sticky top-0 z-40 flex min-h-[76px] items-center justify-between bg-forest/94 text-white px-5 py-3 backdrop-blur-[14px]">
      <div 
        className="flex items-center gap-[11px] cursor-pointer"
        onClick={() => onNavigate('home')}
        aria-label="Ir al inicio"
      >
        <span className="grid w-[42px] h-[42px] place-content-center rounded-full border border-white/24 text-forest bg-white">
          {renderLogoIcon(settings?.logoIcon)}
        </span>
        <span className="flex flex-col">
          <strong className="font-display font-bold text-base leading-none tracking-tight">{appName}</strong>
          <small className="text-[10px] text-white/68 tracking-[1.7px] uppercase font-medium">{appSubtitle}</small>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          className="grid w-[42px] h-[42px] place-content-center rounded-full bg-white/11 text-white hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
          onClick={onOpenWhatsApp}
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        <button 
          className={`grid w-[42px] h-[42px] place-content-center rounded-full transition-all active:scale-95 cursor-pointer ${
            isAdminAuthenticated ? 'bg-orange text-white' : 'bg-white/11 text-white hover:bg-white/20'
          }`}
          onClick={() => {
            if (isAdminAuthenticated) {
              onNavigate('admin');
            } else {
              onOpenAdminLogin();
            }
          }}
          aria-label="Panel de administración"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
