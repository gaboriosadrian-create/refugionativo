import React, { useState } from 'react';
import { Trees, Tent, Mountain, Palmtree, Compass, TreePine, MessageCircle, Settings2, ChevronDown, LogOut, User, LogIn } from 'lucide-react';
import { useResort } from '../contexts/ResortContext';
import { useSettings } from '../../modules/settings/contexts/SettingsContext';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { PermissionService } from '../../core/security/PermissionService';

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
  const { user, role, login, logout, isAuthenticated } = useAuth();
  
  const [showResortSelector, setShowResortSelector] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
    setShowProfileMenu(false);
  };

  const getRoleLabel = (r: string | null) => {
    if (!r) return 'Sin acceso';
    switch (r) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'owner': return 'Propietario';
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'staff': return 'Personal';
      default: return 'Colaborador';
    }
  };

  const getRoleBadgeColor = (r: string | null) => {
    if (!r) return 'bg-danger/10 text-danger border-danger/25';
    switch (r) {
      case 'SUPER_ADMIN': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'owner': return 'bg-orange/10 text-orange border-orange/20';
      case 'admin': return 'bg-forest/10 text-forest border-forest/20';
      case 'manager': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const handleLogoutClick = async () => {
    await logout();
    setShowProfileMenu(false);
    onNavigate('home');
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
                setShowProfileMenu(false);
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

          {/* User Profile / Login Dropdown */}
          <div className="relative">
            {isAuthenticated && user ? (
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowResortSelector(false);
                }}
                className="w-[42px] h-[42px] rounded-full border border-white/20 overflow-hidden active:scale-95 transition-all cursor-pointer"
                aria-label="Menú de usuario"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="grid w-full h-full place-content-center bg-white/10 text-white font-bold text-sm">
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={login}
                className="grid w-[42px] h-[42px] place-content-center rounded-full bg-white/11 text-white hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
                aria-label="Iniciar sesión con Google"
                title="Iniciar sesión"
              >
                <LogIn className="w-5 h-5" />
              </button>
            )}

            {showProfileMenu && user && (() => {
              const isSuperAdmin = PermissionService.isSuperAdmin(role, user.email);
              const menuItems = [
                {
                  id: 'profile',
                  label: 'Mi Perfil',
                  icon: <User className="w-3.5 h-3.5 text-forest" />,
                  action: () => {
                    onNavigate('admin');
                    setShowProfileMenu(false);
                  },
                  visible: true,
                },
                {
                  id: 'resort',
                  label: 'Mi Complejo',
                  icon: <Trees className="w-3.5 h-3.5 text-forest" />,
                  action: () => {
                    onNavigate('admin');
                    setShowProfileMenu(false);
                  },
                  visible: PermissionService.hasScreen(role, 'dashboard'),
                },
                {
                  id: 'settings',
                  label: 'Configuración',
                  icon: <Settings2 className="w-3.5 h-3.5 text-forest" />,
                  action: () => {
                    onNavigate('admin');
                    setShowProfileMenu(false);
                  },
                  visible: PermissionService.hasScreen(role, 'settings'),
                },
              ];

              return (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white text-ink shadow-2xl border border-line z-50 p-4 space-y-3.5 animate-fade-in">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-line">
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-slate-100">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="grid w-full h-full place-content-center bg-forest text-white font-bold text-xs">
                          {user.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-ink truncate">{user.displayName}</div>
                      <div className="text-[10px] text-muted truncate">{user.email}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[9px] font-extrabold text-muted uppercase tracking-wider">Complejo Activo</div>
                    <div className="text-xs font-bold text-forest truncate">{resort?.name || 'Ninguno'}</div>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(role)}`}>
                      {getRoleLabel(role)}
                    </span>
                  </div>

                  {/* Dynamic Permission-based Menu Items */}
                  <div className="pt-2 border-t border-line space-y-1">
                    {menuItems
                      .filter(item => item.visible)
                      .map(item => (
                        <button
                          key={item.id}
                          onClick={item.action}
                          className="w-full min-h-[34px] flex items-center gap-2 text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                  </div>

                  {/* Super Admin Console Section */}
                  {isSuperAdmin && (
                    <div className="pt-2 border-t border-line space-y-2">
                      <div className="flex items-center gap-1.5 px-2.5">
                        <div className="h-[1px] bg-indigo-100 flex-1"></div>
                        <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase">SaaS Global</span>
                        <div className="h-[1px] bg-indigo-100 flex-1"></div>
                      </div>
                      <button
                        onClick={() => {
                          onNavigate('superadmin');
                          setShowProfileMenu(false);
                        }}
                        className="w-full min-h-[38px] flex items-center justify-center gap-1.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer border border-indigo-700/30 shadow-md shadow-indigo-600/15"
                      >
                        🚀 Consola StayFlow
                      </button>
                    </div>
                  )}

                  <div className="pt-2 border-t border-line">
                    <button
                      onClick={handleLogoutClick}
                      className="w-full min-h-[38px] flex items-center justify-center gap-1.5 text-xs font-bold text-danger bg-danger/5 hover:bg-danger/10 border border-danger/10 rounded-xl transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
