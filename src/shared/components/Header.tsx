import React, { useState } from 'react';
import { Trees, Tent, Mountain, Palmtree, Compass, TreePine, MessageCircle, Settings2, ChevronDown } from 'lucide-react';
import { useResort } from '../contexts/ResortContext';
import { useSettings } from '../../modules/settings/contexts/SettingsContext';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { UserProfileMenu } from './UserProfileMenu';

interface HeaderProps {
  onNavigate: (page: string) => void;
  onOpenWhatsApp: () => void;
  onOpenAdminLogin?: () => void;
  isAdminAuthenticated?: boolean;
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
  onNavigate,
  onOpenWhatsApp,
}) => {
  const { resort, userResorts, changeResort } = useResort();
  const { settings } = useSettings();
  const { role, logout } = useAuth();
  
  const [showResortSelector, setShowResortSelector] = useState(false);

  const appName = settings?.appName || resort?.name || "Refugio Nativo";
  const appSubtitle = settings?.appSubtitle || (resort?.businessType === 'GLAMPING' ? 'Glamping & Estrellas' : "Cabañas & naturaleza");

  // In SaaS mode, allow switching resorts
  const allAvailableResorts = userResorts.length > 0 
    ? userResorts.map(ur => ur.resort) 
    : [
        { id: 'patagonia-refugio', name: 'Refugio Nativo' },
        { id: 'andes-glamping', name: 'Andes Glamping' }
      ];

  const handleSelectResort = async (resortId: string) => {
    await changeResort(resortId);
    setShowResortSelector(false);
  };

  return (
    <header className="sticky top-0 z-40 flex min-h-[76px] flex-col bg-forest/94 text-white px-5 py-3 backdrop-blur-[14px] border-b border-white/10">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
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
          {/* Tenant Selector Switcher Badge */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowResortSelector(!showResortSelector);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/11 text-xs font-bold hover:bg-white/20 transition-all cursor-pointer"
            >
              <span>Complejo</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showResortSelector && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white text-ink shadow-2xl border border-line z-50 p-1">
                <div className="px-3 py-1.5 text-[10px] font-extrabold text-muted uppercase border-b border-line">
                  Complejos de Hospedaje
                </div>
                {allAvailableResorts.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectResort(r.id)}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-sage/40 hover:text-forest transition-colors ${
                      resort?.id === r.id ? 'bg-sage text-forest font-bold' : 'text-ink'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            className="grid w-[42px] h-[42px] place-content-center rounded-full bg-white/11 text-white hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
            onClick={onOpenWhatsApp}
            aria-label="Contactar por WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          
          <button 
            className={`grid w-[42px] h-[42px] place-content-center rounded-full transition-all active:scale-95 cursor-pointer ${
              role ? 'bg-orange text-white' : 'bg-white/11 text-white hover:bg-white/20'
            }`}
            onClick={() => onNavigate('admin')}
            aria-label="Panel de administración"
          >
            <Settings2 className="w-5 h-5" />
          </button>

          {/* User Profile / Login Menu */}
          <UserProfileMenu 
            onSwitchView={(view) => {
              if (view === 'superadmin') {
                onNavigate('superadmin');
              } else {
                onNavigate('admin');
              }
            }}
            onLogout={async () => {
              await logout();
              onNavigate('home');
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
