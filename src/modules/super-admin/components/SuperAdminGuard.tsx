import React, { useEffect, useState } from 'react';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { SuperAdminService } from '../services/SuperAdminService';
import { PermissionService } from '../../../core/security/PermissionService';

interface SuperAdminGuardProps {
  children: React.ReactNode;
  onRedirect: () => void;
}

export const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({ children, onRedirect }) => {
  const { user, role, loading } = useAuth();
  const [denied, setDenied] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    if (loading) return;

    const isSuper = PermissionService.isSuperAdmin(role, user?.email || null);
    if (!isSuper && user) {
      // Register unauthorized access attempt
      SuperAdminService.recordAudit(
        user.uid,
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'security_guard',
        'super_admin_console',
        `Attempted unauthorized access to Super Admin console from email: ${user.email}`
      );
      setDenied(true);
    }
  }, [user, role, loading]);

  useEffect(() => {
    if (!denied) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [denied, onRedirect]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-indigo-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-sans uppercase tracking-widest">Verificando Credenciales...</p>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-rose-500/10 rounded-3xl filter blur-xl animate-pulse"></div>
          <div className="relative grid w-16 h-16 place-content-center bg-rose-500/10 text-rose-500 border border-rose-500/25 rounded-2xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>

        <h2 className="font-display font-black text-2xl text-white mb-2 tracking-tight">Acceso Denegado</h2>
        <p className="text-sm font-bold text-rose-400 font-mono mb-4">SECURITY_LEVEL_VIOLATION</p>
        
        <p className="text-slate-400 text-xs leading-relaxed max-w-[440px] mb-8 font-sans">
          Tu cuenta (<span className="font-mono text-indigo-300 bg-indigo-950/30 px-1.5 py-0.5 rounded border border-indigo-500/10">{user?.email}</span>) no posee el rol de **SUPER_ADMIN** requerido para acceder a la Consola SaaS StayFlow. Este evento ha sido registrado en la bitácora de auditoría global de la plataforma.
        </p>

        <div className="space-y-4">
          <button
            onClick={onRedirect}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-extrabold border border-slate-800 transition-all hover:border-slate-700 active:scale-95 cursor-pointer shadow-lg"
          >
            <span>Ir al Backoffice del Complejo</span>
            <ArrowRight className="w-3.5 h-3.5 text-forest" />
          </button>
          
          <p className="text-[10px] text-slate-500 font-medium">
            Redirección automática en <span className="font-bold text-indigo-400">{countdown}s</span>...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
