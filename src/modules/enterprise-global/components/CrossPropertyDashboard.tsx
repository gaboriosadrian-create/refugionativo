import React, { useState } from 'react';
import {
  Building2,
  Globe,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import { OrganizationService } from '../services/OrganizationService';
import { CrossPropertyFilter } from '../types';

export const CrossPropertyDashboard: React.FC = () => {
  const {
    organizations,
    brands,
    availableCurrencies,
    currentCurrency,
    setCurrency,
    formatCurrency,
    t
  } = useEnterprise();

  const [filter, setFilter] = useState<CrossPropertyFilter>({
    organizationId: '',
    brandId: '',
    country: '',
    propertyId: '',
    dateRange: 'this_month',
    displayCurrency: currentCurrency || 'USD'
  });

  const { properties, summary } = OrganizationService.getCrossPropertyMetrics({
    ...filter,
    displayCurrency: filter.displayCurrency
  });

  const handleCurrencyChange = (curr: string) => {
    setFilter(prev => ({ ...prev, displayCurrency: curr }));
    setCurrency(curr);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Global Enterprise Executive Intelligence</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Dashboard Consolidado Multi-Propiedad
            </h1>
            <p className="text-sm text-indigo-200/80 mt-1 max-w-2xl">
              Monitoreo ejecutivo en tiempo real de ocupación, ADR, RevPAR, ingresos consolidados y estado de operaciones entre organizaciones, marcas y cadenas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
              <span className="text-xs text-indigo-200 block font-medium">Moneda de Consolidación</span>
              <select
                value={filter.displayCurrency}
                onChange={e => handleCurrencyChange(e.target.value)}
                className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
              >
                {availableCurrencies.map(c => (
                  <option key={c.code} value={c.code} className="text-slate-900 font-semibold">
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-wider pr-2 border-r border-slate-200">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Filtros</span>
        </div>

        {/* Organization Filter */}
        <select
          value={filter.organizationId}
          onChange={e => setFilter({ ...filter, organizationId: e.target.value })}
          className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas las Organizaciones</option>
          {organizations.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>

        {/* Brand Filter */}
        <select
          value={filter.brandId}
          onChange={e => setFilter({ ...filter, brandId: e.target.value })}
          className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas las Marcas / Cadenas</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Country Filter */}
        <select
          value={filter.country}
          onChange={e => setFilter({ ...filter, country: e.target.value })}
          className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los Países</option>
          <option value="US">🇺🇸 Estados Unidos</option>
          <option value="ES">🇪🇸 España</option>
          <option value="CL">🇨🇱 Chile</option>
          <option value="BR">🇧🇷 Brasil</option>
          <option value="AR">🇦🇷 Argentina</option>
          <option value="MX">🇲🇽 México</option>
        </select>

        {/* Period Filter */}
        <select
          value={filter.dateRange}
          onChange={e => setFilter({ ...filter, dateRange: e.target.value as any })}
          className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="today">Hoy</option>
          <option value="this_week">Esta Semana</option>
          <option value="this_month">Este Mes</option>
          <option value="this_quarter">Este Trimestre</option>
          <option value="this_year">Este Año</option>
        </select>

        {(filter.organizationId || filter.brandId || filter.country) && (
          <button
            onClick={() => setFilter({ organizationId: '', brandId: '', country: '', propertyId: '', dateRange: 'this_month', displayCurrency: currentCurrency })}
            className="text-xs text-rose-600 font-semibold hover:underline ml-auto flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ocupación Consolidada</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{summary.averageOccupancy}%</div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{summary.totalOccupiedRooms} / {summary.totalRooms} habitaciones ocupadas</span>
            </p>
          </div>
        </div>

        {/* Consolidated Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingresos Convertidos</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(summary.revenueInDisplayCurrency, summary.displayCurrency)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {summary.totalBookings} reservas activas registradas
            </p>
          </div>
        </div>

        {/* ADR */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarifa Promedio (ADR)</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(summary.overallAdr, summary.displayCurrency)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Promedio ponderado por noche
            </p>
          </div>
        </div>

        {/* RevPAR */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RevPAR Global</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(summary.overallRevpar, summary.displayCurrency)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Ingreso por hab. disponible
            </p>
          </div>
        </div>
      </div>

      {/* Operational Alert Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Pendientes de Mantenimiento</h4>
              <p className="text-sm font-semibold">{summary.maintenancePendingCount} solicitudes activas entre propiedades</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-200/80 rounded-full text-xs font-bold text-amber-900">Prioridad Alta</span>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center justify-between text-sky-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 rounded-lg text-sky-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Estado de Housekeeping</h4>
              <p className="text-sm font-semibold">{summary.housekeepingPendingCount} habitaciones en preparación</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-sky-200/80 rounded-full text-xs font-bold text-sky-900">En Proceso</span>
        </div>
      </div>

      {/* Cross Property Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Desglose por Propiedad y Cadena Hotelera</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Métricas individuales normalizadas a {summary.displayCurrency}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Propiedad / Hotel</th>
                <th className="px-4 py-3.5">Marca / Cadena</th>
                <th className="px-4 py-3.5">País</th>
                <th className="px-4 py-3.5">Ocupación</th>
                <th className="px-4 py-3.5">Ingresos Locales</th>
                <th className="px-4 py-3.5">Ingresos ({summary.displayCurrency})</th>
                <th className="px-4 py-3.5">ADR Local</th>
                <th className="px-4 py-3.5">RevPAR Local</th>
                <th className="px-4 py-3.5 text-center">Estado Op.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {properties.map(p => (
                <tr key={p.propertyId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {p.propertyName}
                  </td>
                  <td className="px-4 py-3.5 text-indigo-600 font-semibold">
                    {p.brandName}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                      <span>{p.countryFlag}</span>
                      <span>{p.country}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${p.occupancyRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900">{p.occupancyRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">
                    {formatCurrency(p.totalRevenue, p.nativeCurrency)}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-emerald-600">
                    {formatCurrency(p.revenueInBaseCurrency, summary.displayCurrency)}
                  </td>
                  <td className="px-4 py-3.5">
                    {formatCurrency(p.adr, p.nativeCurrency)}
                  </td>
                  <td className="px-4 py-3.5">
                    {formatCurrency(p.revpar, p.nativeCurrency)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Normal
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
