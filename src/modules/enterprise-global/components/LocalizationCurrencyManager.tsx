import React, { useState } from 'react';
import {
  Coins,
  Globe,
  Clock,
  Calendar,
  Percent,
  RefreshCw,
  Save,
  Check,
  DollarSign
} from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import { LocalizationService } from '../services/LocalizationService';

export const LocalizationCurrencyManager: React.FC = () => {
  const {
    availableCurrencies,
    refreshData
  } = useEnterprise();

  const [locConfig, setLocConfig] = useState(LocalizationService.getLocalizationConfig());
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});
  const [isSaved, setIsSaved] = useState(false);

  const handleRateChange = (code: string, newRate: number) => {
    LocalizationService.updateExchangeRate(code, newRate);
    setEditingRates({ ...editingRates, [code]: newRate });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    refreshData();
  };

  const handleSaveLocalization = (e: React.FormEvent) => {
    e.preventDefault();
    LocalizationService.updateLocalizationConfig(locConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-600" />
            <span>Localización (l10n), Monedas y Formatos Regionales</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configura tipos de cambio de divisas, formatos de fecha, zonas horarias, impuestos locales y patrones de números.
          </p>
        </div>

        {isSaved && (
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Check className="w-4 h-4" />
            Configuración Guardada
          </span>
        )}
      </div>

      {/* Currency Exchange Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Tabla de Monedas y Tipos de Cambio Configurados</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tipos de cambio de conversión contra la moneda base (USD = 1.0)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Código ISO</th>
                <th className="px-4 py-3.5">Nombre Divisa</th>
                <th className="px-4 py-3.5">Símbolo</th>
                <th className="px-4 py-3.5">Tasa de Cambio (vs Base USD)</th>
                <th className="px-4 py-3.5">Decimales</th>
                <th className="px-4 py-3.5">Separadores</th>
                <th className="px-4 py-3.5">Vista Previa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {availableCurrencies.map(c => (
                <tr key={c.code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900 font-mono">
                    {c.code} {c.isBaseCurrency && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded ml-1 font-sans">BASE</span>}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">
                    {c.name}
                  </td>
                  <td className="px-4 py-3.5 font-extrabold text-indigo-600">
                    {c.symbol}
                  </td>
                  <td className="px-4 py-3.5">
                    {c.isBaseCurrency ? (
                      <span className="font-mono font-bold text-slate-500">1.00 (Fijo)</span>
                    ) : (
                      <input
                        type="number"
                        step="0.0001"
                        defaultValue={c.exchangeRateToBase}
                        onBlur={e => handleRateChange(c.code, parseFloat(e.target.value))}
                        className="w-28 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono">{c.decimalPlaces}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-500">
                    Dec: '<span className="font-bold text-slate-900">{c.decimalSeparator}</span>' | Mil: '<span className="font-bold text-slate-900">{c.thousandsSeparator}</span>'
                  </td>
                  <td className="px-4 py-3.5 font-bold text-emerald-700">
                    {LocalizationService.formatCurrency(1250.50, c.code)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Formats & Tax Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600" />
          <span>Ajustes Regionales por Defecto del Tenant</span>
        </h3>

        <form onSubmit={handleSaveLocalization} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Zona Horaria Predeterminada</label>
            <select
              value={locConfig.timezone}
              onChange={e => setLocConfig({ ...locConfig, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Santiago">America/Santiago (CLT)</option>
              <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
              <option value="America/Buenos_Aires">America/Buenos_Aires (ART)</option>
              <option value="Europe/Madrid">Europe/Madrid (CET)</option>
              <option value="America/Mexico_City">America/Mexico_City (CST)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Formato de Fecha</label>
            <select
              value={locConfig.dateFormat}
              onChange={e => setLocConfig({ ...locConfig, dateFormat: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Día/Mes/Año)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (Mes/Día/Año)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Estándar)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Formato de Hora</label>
            <select
              value={locConfig.timeFormat}
              onChange={e => setLocConfig({ ...locConfig, timeFormat: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="24h">24 Horas (14:30)</option>
              <option value="12h">12 Horas (2:30 PM)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tasa de Impuesto Predeterminada (%)</label>
            <input
              type="number"
              step="0.1"
              value={locConfig.defaultTaxRate}
              onChange={e => setLocConfig({ ...locConfig, defaultTaxRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Etiqueta Impuesto Local</label>
            <input
              type="text"
              value={locConfig.taxLabel}
              onChange={e => setLocConfig({ ...locConfig, taxLabel: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Ajustes Regionales</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
