import React, { useMemo } from 'react';
import { Search, SlidersHorizontal, RefreshCw, Eye, Tag, Activity } from 'lucide-react';
import { useBackofficeCalendar } from '../hooks/useBackofficeCalendar';

export const TimelineFilters: React.FC = () => {
  const { filters, updateFilters, resetFilters, accommodations, refreshData, loading } = useBackofficeCalendar();

  // Extract unique accommodation types for dropdown filtering
  const uniqueTypes = useMemo(() => {
    const typesSet = new Set<string>();
    accommodations.forEach(acc => {
      if (acc.typeId) typesSet.add(acc.typeId);
    });
    return Array.from(typesSet);
  }, [accommodations]);

  // Map type IDs to friendly display labels
  const getFriendlyTypeLabel = (typeId: string): string => {
    const mapping: Record<string, string> = {
      cabin: 'Cabaña',
      room: 'Habitación',
      dome: 'Domo',
      glamping: 'Glamping',
      apartment: 'Departamento',
      suite: 'Suite'
    };
    return mapping[typeId.toLowerCase()] || typeId.charAt(0).toUpperCase() + typeId.slice(1);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-150/80 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Name / ID Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar alojamiento por nombre..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-forest/50 focus:ring-1 focus:ring-forest/20 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Type Filter */}
          <div className="relative flex items-center">
            <Tag className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={filters.typeId}
              onChange={(e) => updateFilters({ typeId: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-white focus:border-forest/50 transition-all cursor-pointer appearance-none"
            >
              <option value="all">Todos los Tipos</option>
              {uniqueTypes.map(t => (
                <option key={t} value={t}>{getFriendlyTypeLabel(t)}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative flex items-center">
            <Activity className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-white focus:border-forest/50 transition-all cursor-pointer appearance-none"
            >
              <option value="all">Todos los Estados</option>
              <option value="available">Disponible</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="occupied">Ocupado</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          {/* Visibility Filter */}
          <div className="relative flex items-center">
            <Eye className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={filters.visible}
              onChange={(e) => updateFilters({ visible: e.target.value as 'all' | 'yes' | 'no' })}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-white focus:border-forest/50 transition-all cursor-pointer appearance-none"
            >
              <option value="all">Visibilidad (Todos)</option>
              <option value="yes">Visibles en Web</option>
              <option value="no">Ocultos en Web</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter controls row */}
      <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="font-medium">Total: {accommodations.length} alojamientos registrados</span>
        </div>

        <div className="flex gap-2">
          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-bold tracking-tight cursor-pointer transition-colors"
          >
            Limpiar Filtros
          </button>

          {/* Sync / Refresh */}
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineFilters;
