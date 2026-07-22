import React from 'react';
import {
  Activity,
  Globe,
  Languages,
  AlertTriangle,
  Radio,
  Server,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import { ComplianceService } from '../services/ComplianceService';

export const EnterpriseObservabilityPanel: React.FC = () => {
  const { availableLanguages, availableCurrencies } = useEnterprise();
  const obsLogs = ComplianceService.getObservabilityLogs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Telemetry & Enterprise Telemetry Engine</span>
          </div>
          <h2 className="text-xl font-extrabold">
            Observabilidad Global Enterprise
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Métricas de uso por país, idioma preferido de usuarios, trazabilidad de errores de i18n y telemetría de rendimiento multi-tenant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-400/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Telemetry Gateway Running
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Países Activos</span>
            <Globe className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">6 Países</div>
          <p className="text-xs text-slate-500 mt-1">US, ES, CL, BR, AR, MX</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Idiomas en Vivo</span>
            <Languages className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{availableLanguages.length} Idiomas</div>
          <p className="text-xs text-slate-500 mt-1">Español, Inglés, Portugués</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Monedas Disponibles</span>
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{availableCurrencies.length} Divisas</div>
          <p className="text-xs text-slate-500 mt-1">USD, EUR, BRL, ARS, CLP, MXN</p>
        </div>
      </div>

      {/* Live Observability Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Stream de Eventos de Observabilidad</span>
        </h3>

        <div className="space-y-3">
          {obsLogs.map(log => (
            <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 mt-0.5">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] bg-slate-200 px-2 py-0.5 rounded">
                    {log.type}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString('es-ES')}
                  </span>
                </div>
                <p className="font-semibold text-slate-800 mt-1">{log.message}</p>
                <div className="font-mono text-slate-500 text-[11px] mt-1 bg-white p-2 rounded border border-slate-200/80">
                  {JSON.stringify(log.metadata)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
