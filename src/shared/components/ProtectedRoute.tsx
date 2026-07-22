import React from 'react';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { useResort } from '../contexts/ResortContext';
import { Loader2, Lock, ShieldAlert, LogOut } from 'lucide-react';
import { LocalSaaSDb } from '../services/LocalSaaSDb';
import { TenantConfigService } from '../../core/tenant/TenantConfigService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { user, role, loading: authLoading, login, logout } = useAuth();
  const { resort, loading: resortLoading } = useResort();

  if (authLoading || resortLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-forest">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-xs text-muted font-sans font-medium">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-white border border-line rounded-[23px] m-4 shadow-sm animate-fade-in">
        <div className="grid w-12 h-12 place-content-center bg-sage/30 text-forest rounded-2xl mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="font-display font-extrabold text-xl text-ink mb-1.5">Acceso Restringido</h3>
        <p className="text-muted text-xs leading-relaxed max-w-[280px] mb-6 font-sans">
          Debes iniciar sesión con tu cuenta de Google autorizada para acceder a esta sección de administración.
        </p>
        <button
          onClick={login}
          className="min-h-[46px] px-6 inline-flex items-center justify-center rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  // Commercial status check for tenant
  const tenantId = resort?.id || null;
  const isGlobalSuperAdmin = user?.email === 'gaboriosadrian@gmail.com' || role === 'SUPER_ADMIN';

  let commercialStatus = 'Activo';
  if (tenantId) {
    const statuses = LocalSaaSDb.get<Record<string, string>>('saas_tenant_commercial_status') || {};
    if (statuses[tenantId]) {
      commercialStatus = statuses[tenantId];
    } else {
      const config = TenantConfigService.getDefaultConfig(tenantId);
      if (config.status === 'suspended') {
        commercialStatus = 'Suspendido';
      } else if (config.contractedPlan === 'Starter') {
        commercialStatus = 'Trial';
      }
    }
  }

  const isRestricted = ['Suspendido', 'Vencido', 'Cancelado'].includes(commercialStatus);

  if (isRestricted && !isGlobalSuperAdmin) {
    let title = 'Acceso Suspendido';
    let message = 'Tu cuenta se encuentra suspendida preventivamente. Ponte en contacto con el soporte técnico de StayFlow para regularizar tu situación.';
    let iconColor = 'text-rose-500 bg-rose-50 border-rose-200';

    if (commercialStatus === 'Vencido') {
      title = 'Suscripción Vencida';
      message = 'El período contratado para este complejo ha finalizado. Por favor, regulariza tu situación de pago para reactivar el acceso al panel de administración.';
      iconColor = 'text-amber-500 bg-amber-50 border-amber-200';
    } else if (commercialStatus === 'Cancelado') {
      title = 'Cuenta Cancelada';
      message = 'Este complejo ha sido desactivado permanentemente. Si crees que se trata de un error, comunícate con tu administrador de cuenta de StayFlow.';
      iconColor = 'text-slate-500 bg-slate-50 border-slate-200';
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white border border-line rounded-[23px] m-4 shadow-sm animate-fade-in select-none">
        <div className={`grid w-14 h-14 place-content-center rounded-2xl mb-4 border ${iconColor}`}>
          <ShieldAlert className="w-7 h-7" />
        </div>
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Control de Cuenta SaaS</span>
        <h3 className="font-display font-extrabold text-xl text-ink mb-2">{title}</h3>
        <p className="text-muted text-xs leading-relaxed max-w-[420px] mb-6 font-sans">
          {message}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <button
            onClick={logout}
            className="w-full min-h-[42px] px-4 inline-flex items-center justify-center rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    );
  }

  // Multi-tenant check: if they log in but have no role assigned for this specific resort
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-white border border-line rounded-[23px] m-4 shadow-sm animate-fade-in">
        <div className="grid w-12 h-12 place-content-center bg-danger/10 text-danger rounded-2xl mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="font-display font-extrabold text-xl text-ink mb-1.5">Sin Autorización</h3>
        <p className="text-muted text-xs leading-relaxed max-w-[290px] mb-2 font-sans">
          Hola <strong className="text-ink">{user.displayName}</strong>. Tu cuenta (<span className="font-mono text-[11px]">{user.email}</span>) no tiene roles de administración asignados en el complejo <strong className="text-forest">{resort?.name || 'este complejo'}</strong>.
        </p>
        <p className="text-muted text-[10px] leading-relaxed max-w-[290px] mb-6 font-sans">
          Por favor, solicita acceso al propietario o inicia sesión con otra cuenta autorizada.
        </p>
        <div className="flex gap-2.5 w-full max-w-[290px]">
          <button
            onClick={login}
            className="flex-1 min-h-[42px] px-4 inline-flex items-center justify-center rounded-xl bg-forest hover:bg-forest-hover text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            Cambiar Cuenta
          </button>
          <button
            onClick={logout}
            className="min-h-[42px] px-4 inline-flex items-center justify-center rounded-xl border border-line hover:bg-slate-50 text-ink font-bold text-xs transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1 text-muted" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
