import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, WifiOff, KeyRound, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { AppError, PermissionError, AuthenticationError, RepositoryError, ValidationError } from '../../core/errors/AppErrors';

export interface ErrorAlertProps {
  error: Error | AppError | unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  title,
  onRetry,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  // 1. Identify Error Type and attributes
  let errorMsg = 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.';
  let category: 'network' | 'permission' | 'auth' | 'validation' | 'database' | 'unknown' = 'unknown';
  let errorCode = '';

  if (error instanceof ValidationError) {
    category = 'validation';
    errorMsg = error.message || 'Algunos campos del formulario son incorrectos.';
    errorCode = error.code || 'VALIDATION_ERROR';
  } else if (error instanceof PermissionError) {
    category = 'permission';
    errorMsg = 'No tienes permisos suficientes para realizar esta acción o acceder a este recurso de resort.';
    errorCode = error.code || 'PERMISSION_DENIED';
  } else if (error instanceof AuthenticationError) {
    category = 'auth';
    errorMsg = 'Su sesión ha expirado o no está autenticado. Por favor, vuelva a iniciar sesión.';
    errorCode = error.code || 'AUTH_ERROR';
  } else if (error instanceof RepositoryError) {
    category = 'database';
    errorMsg = 'Error al comunicar con la base de datos de StayFlow.';
    errorCode = error.code || 'DATABASE_ERROR';
  } else if (error instanceof Error) {
    errorCode = (error as any).code || 'ERROR';
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
      category = 'network';
      errorMsg = 'Error de conexión de red. Verifique su acceso a internet y reintente.';
    } else if (msg.includes('permission') || msg.includes('insufficient')) {
      category = 'permission';
      errorMsg = 'Acceso restringido (Permisos insuficientes).';
    } else {
      errorMsg = error.message;
    }
  } else if (typeof error === 'string') {
    errorMsg = error;
  }

  // 2. Select appropriate visual elements
  let IconComponent = AlertCircle;
  let themeClasses = 'bg-red-50 text-red-900 border-red-200';
  let iconColor = 'text-red-500';

  switch (category) {
    case 'network':
      IconComponent = WifiOff;
      themeClasses = 'bg-amber-50 text-amber-900 border-amber-200';
      iconColor = 'text-amber-600';
      break;
    case 'permission':
      IconComponent = ShieldAlert;
      themeClasses = 'bg-purple-50 text-purple-900 border-purple-200';
      iconColor = 'text-purple-600';
      break;
    case 'auth':
      IconComponent = KeyRound;
      themeClasses = 'bg-blue-50 text-blue-900 border-blue-200';
      iconColor = 'text-blue-600';
      break;
    case 'validation':
      IconComponent = AlertTriangle;
      themeClasses = 'bg-rose-50 text-rose-950 border-rose-200';
      iconColor = 'text-rose-500';
      break;
    case 'database':
      IconComponent = AlertCircle;
      themeClasses = 'bg-slate-50 text-slate-900 border-slate-300';
      iconColor = 'text-slate-600';
      break;
  }

  const defaultTitle = title || (
    category === 'network' ? 'Error de Conexión' :
    category === 'permission' ? 'Acceso Denegado' :
    category === 'auth' ? 'Autenticación Requerida' :
    category === 'validation' ? 'Campos Inválidos' :
    category === 'database' ? 'Error de Base de Datos' : 'Ocurrió un Error'
  );

  const rawDetails = error instanceof Error ? error.stack || error.message : JSON.stringify(error, null, 2);

  return (
    <div id="stayflow_error_alert" className={`border rounded-lg p-4 shadow-sm transition-all duration-200 ${themeClasses} ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-1 rounded ${iconColor}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold tracking-tight">{defaultTitle}</h4>
          <p className="text-sm mt-1 leading-relaxed opacity-90">{errorMsg}</p>
          
          {/* Action buttons */}
          <div className="flex items-center gap-4 mt-3">
            {onRetry && (
              <button
                id="error_retry_btn"
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 text-xs font-semibold py-1 px-3.5 rounded-md border bg-white shadow-sm hover:bg-neutral-50 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar Acción
              </button>
            )}
            
            <button
              id="error_details_toggle"
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-85 transition cursor-pointer"
            >
              {showDetails ? (
                <>
                  Ocultar detalles técnicos
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Ver detalles técnicos
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Collapsible expanded technical trace */}
          {showDetails && (
            <div id="error_technical_trace" className="mt-3 p-2 rounded bg-black/5 border border-black/5 font-mono text-[11px] leading-normal overflow-x-auto select-all max-h-48 text-left">
              <div className="font-semibold text-[10px] uppercase tracking-wider opacity-60 mb-1">
                Code: {errorCode || 'UNKNOWN'}
              </div>
              <pre className="whitespace-pre-wrap">{rawDetails}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
