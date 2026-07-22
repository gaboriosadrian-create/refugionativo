import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import { LoggingService } from '../../core/logger/LoggingService';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to LoggingService for centralized production hardening
    LoggingService.error('React Application Crash caught by ErrorBoundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div id="stayflow_global_boundary" className="min-h-screen w-full flex items-center justify-center bg-neutral-50 px-4 py-12 font-sans">
          <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-sm text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 border border-red-100">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Se ha producido un error crítico
            </h2>
            
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
              La aplicación ha tenido una interrupción inesperada. Hemos registrado el incidente automáticamente para que el equipo de soporte lo resuelva.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 rounded-md bg-neutral-100 border border-neutral-200 text-left font-mono text-[11px] text-neutral-700 overflow-x-auto max-h-32">
                <span className="font-bold text-red-600">Error:</span> {this.state.error.message}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <button
                id="boundary_reload_btn"
                onClick={this.handleReset}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar Aplicación
              </button>

              <button
                id="boundary_home_btn"
                onClick={this.handleGoHome}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold text-sm transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Ir a la Página Principal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
