import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Settings2, User, Sparkles, LogIn, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { useResort } from '../contexts/ResortContext';
import { ThemeSwitcher } from './ThemeSwitcher';

interface UserProfileMenuProps {
  currentView?: 'admin' | 'superadmin';
  onSwitchView?: (view: 'admin' | 'superadmin') => void;
  onLogout?: () => void;
  className?: string;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentView = 'admin',
  onSwitchView,
  onLogout,
  className = ''
}) => {
  const { user, login, openLoginModal, logout, role, isAuthenticated } = useAuth();
  const { resort } = useResort();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = user?.email === 'gaboriosadrian@gmail.com' || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'super_admin';
  const roleLabel = isSuperAdmin ? 'Super Admin' : (role ? (role === 'owner' ? 'Propietario' : role === 'admin' ? 'Administrador' : role === 'manager' ? 'Gerente' : role === 'staff' ? 'Personal' : 'Colaborador') : 'Colaborador');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={openLoginModal || login}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md border border-slate-700/60 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${className}`}
        aria-label="Iniciar sesión"
        title="Iniciar sesión"
      >
        <span className="grid w-5 h-5 place-content-center rounded-full bg-white/20 text-white">
          <LogIn className="w-3.5 h-3.5" />
        </span>
        <span>Iniciar Sesión</span>
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Polished User Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer bg-white/90 dark:bg-slate-800/90 shadow-sm backdrop-blur-sm group"
        aria-label="Menú de perfil y cuenta de usuario"
      >
        <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 ring-2 ring-indigo-500/30 dark:ring-indigo-400/30 bg-slate-100 dark:bg-slate-700">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'Usuario'} className="w-full h-full object-cover" />
          ) : (
            <span className="grid w-full h-full place-content-center bg-gradient-to-br from-indigo-600 to-forest text-white font-extrabold text-xs">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-800" />
        </div>

        <div className="hidden sm:flex flex-col text-left pr-0.5 min-w-0">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[120px]">
            {user.displayName || 'Usuario'}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate leading-tight">
            {roleLabel}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 pr-0.5 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-72 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200/90 dark:border-slate-800 z-[100] p-4 space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
          
          {/* Header Section */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 bg-slate-100 dark:bg-slate-800">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Usuario'} className="w-full h-full object-cover" />
              ) : (
                <span className="grid w-full h-full place-content-center bg-gradient-to-br from-indigo-600 to-forest text-white font-extrabold text-sm">
                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                  {user.displayName || 'Usuario'}
                </span>
                {isSuperAdmin && (
                  <span title="Cuenta Super Admin">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  </span>
                )}
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user.email}
              </div>
            </div>
          </div>

          {/* Active Context Card */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Complejo / Organización
              </span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                isSuperAdmin 
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20' 
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20'
              }`}>
                {roleLabel}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {resort?.name || 'StayFlow Enterprise'}
            </div>
          </div>

          {/* Theme Switcher section */}
          <div className="pt-2">
            <ThemeSwitcher variant="inline" />
          </div>

          {/* Actions & Switch View & Logout */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            {isSuperAdmin && onSwitchView && (
              <>
                {currentView === 'admin' ? (
                  <button
                    onClick={() => {
                      onSwitchView('superadmin');
                      setIsOpen(false);
                    }}
                    className="w-full min-h-[38px] flex items-center gap-2 text-left px-3 py-2 text-xs font-bold rounded-xl text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 transition-all cursor-pointer"
                  >
                    <Settings2 className="w-4 h-4 text-indigo-500" />
                    <span>Consola Super Admin</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onSwitchView('admin');
                      setIsOpen(false);
                    }}
                    className="w-full min-h-[38px] flex items-center gap-2 text-left px-3 py-2 text-xs font-bold rounded-xl text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 transition-all cursor-pointer"
                  >
                    <Settings2 className="w-4 h-4 text-emerald-500" />
                    <span>Administrar Complejo</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={async () => {
                setIsOpen(false);
                if (onLogout) {
                  onLogout();
                } else {
                  await logout();
                }
              }}
              className="w-full min-h-[38px] flex items-center justify-center gap-2 text-left px-3 py-2 text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 rounded-xl transition-all cursor-pointer border border-rose-200/60 dark:border-rose-900/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
