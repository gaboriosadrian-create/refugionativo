import React, { useEffect, useState } from 'react';
import { useSearch } from '../hooks/useSearch';
import { useResort } from '../../../shared/contexts/ResortContext';
import { AccommodationConfigService } from '../../accommodation-config/services/AccommodationConfigService';
import { AccommodationType } from '../../accommodation-config/types';
import { Calendar, Users, Home, PawPrint, Plus, Minus, Search, RotateCcw } from 'lucide-react';

interface SearchFormProps {
  onSearchSubmit?: () => void;
  variant?: 'home' | 'sidebar';
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearchSubmit, variant = 'home' }) => {
  const { resort } = useResort();
  const resortId = resort?.id || 'demo_resort';

  const { criteria, setCriteria, performSearch, resetSearch, loading } = useSearch();
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);

  // Load accommodation types
  useEffect(() => {
    let active = true;
    const fetchTypes = async () => {
      try {
        const config = await AccommodationConfigService.getAccommodationConfig(resortId);
        if (active && config?.accommodationTypes) {
          setTypes(config.accommodationTypes.filter(t => t.active));
        }
      } catch (err) {
        console.error('Error loading accommodation types for search form:', err);
      }
    };
    fetchTypes();
    return () => {
      active = false;
    };
  }, [resortId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowGuestsDropdown(false);
    await performSearch();
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const increment = (field: 'adults' | 'children' | 'babies' | 'pets') => {
    setCriteria({ [field]: criteria[field] + 1 });
  };

  const decrement = (field: 'adults' | 'children' | 'babies' | 'pets') => {
    const minVal = field === 'adults' ? 1 : 0;
    if (criteria[field] > minVal) {
      setCriteria({ [field]: criteria[field] - 1 });
    }
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTomorrowString = (dateStr: string) => {
    if (!dateStr) return getTodayString();
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const totalGuests = criteria.adults + criteria.children;
  const guestSummary = `${totalGuests} ${totalGuests === 1 ? 'Huésped' : 'Huéspedes'}${criteria.pets > 0 ? ` · ${criteria.pets} ${criteria.pets === 1 ? 'Mascota' : 'Mascotas'}` : ''}`;

  if (variant === 'sidebar') {
    return (
      <form onSubmit={handleSearch} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="space-y-1">
          <h3 className="font-display font-extrabold text-lg text-slate-900">Modificar Búsqueda</h3>
          <p className="text-slate-500 text-xs">Ajusta los filtros para ver otras alternativas.</p>
        </div>

        {/* Check-In Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--public-primary)]" />
            <span>Fecha de Entrada</span>
          </label>
          <input
            type="date"
            value={criteria.checkIn}
            min={getTodayString()}
            onChange={(e) => setCriteria({ checkIn: e.target.value })}
            className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:border-[var(--public-primary)] focus:ring-1 focus:ring-[var(--public-primary)] outline-none"
            required
          />
        </div>

        {/* Check-Out Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--public-primary)]" />
            <span>Fecha de Salida</span>
          </label>
          <input
            type="date"
            value={criteria.checkOut}
            min={getTomorrowString(criteria.checkIn)}
            onChange={(e) => setCriteria({ checkOut: e.target.value })}
            className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:border-[var(--public-primary)] focus:ring-1 focus:ring-[var(--public-primary)] outline-none"
            required
          />
        </div>

        {/* Accommodation Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-[var(--public-primary)]" />
            <span>Tipo de Alojamiento</span>
          </label>
          <select
            value={criteria.accommodationTypeId || ''}
            onChange={(e) => setCriteria({ accommodationTypeId: e.target.value || undefined })}
            className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:border-[var(--public-primary)] focus:ring-1 focus:ring-[var(--public-primary)] outline-none cursor-pointer"
          >
            <option value="">Todos los tipos</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.displayName}</option>
            ))}
          </select>
        </div>

        {/* Guests Counters directly in sidebar */}
        <div className="space-y-3.5 border-t border-slate-100 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Adultos</h4>
              <p className="text-[10px] text-slate-400">Desde 13 años</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => decrement('adults')}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                disabled={criteria.adults <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-slate-800 w-4 text-center">{criteria.adults}</span>
              <button
                type="button"
                onClick={() => increment('adults')}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Niños</h4>
              <p className="text-[10px] text-slate-400">De 2 a 12 años</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => decrement('children')}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                disabled={criteria.children <= 0}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-slate-800 w-4 text-center">{criteria.children}</span>
              <button
                type="button"
                onClick={() => increment('children')}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Bebés</h4>
              <p className="text-[10px] text-slate-400">Menores de 2 años</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => decrement('babies')}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                disabled={criteria.babies <= 0}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-slate-800 w-4 text-center">{criteria.babies}</span>
              <button
                type="button"
                onClick={() => increment('babies')}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Mascotas</h4>
              <p className="text-[10px] text-slate-400">Ver políticas permitidas</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => decrement('pets')}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                disabled={criteria.pets <= 0}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-slate-800 w-4 text-center">{criteria.pets}</span>
              <button
                type="button"
                onClick={() => increment('pets')}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={resetSearch}
            className="col-span-1.5 inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all cursor-pointer"
            title="Restaurar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="submit"
            className="col-span-3.5 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--public-primary)] hover:opacity-95 text-white font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            disabled={loading}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>
    );
  }

  // Default Home bar layout
  return (
    <div className="relative w-full max-w-5xl mx-auto z-30">
      <form 
        onSubmit={handleSearch} 
        className="bg-white border border-slate-100 rounded-2xl md:rounded-full p-4 sm:p-5 md:p-3 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center"
      >
        {/* Check-In */}
        <div className="md:col-span-3 px-4 py-2 border-b md:border-b-0 md:border-r border-slate-100">
          <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[var(--public-primary)]" />
            <span>Llegada</span>
          </label>
          <input
            type="date"
            value={criteria.checkIn}
            min={getTodayString()}
            onChange={(e) => setCriteria({ checkIn: e.target.value })}
            className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none focus:text-[var(--public-primary)] transition-all cursor-pointer"
            required
          />
        </div>

        {/* Check-Out */}
        <div className="md:col-span-3 px-4 py-2 border-b md:border-b-0 md:border-r border-slate-100">
          <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[var(--public-primary)]" />
            <span>Salida</span>
          </label>
          <input
            type="date"
            value={criteria.checkOut}
            min={getTomorrowString(criteria.checkIn)}
            onChange={(e) => setCriteria({ checkOut: e.target.value })}
            className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none focus:text-[var(--public-primary)] transition-all cursor-pointer"
            required
          />
        </div>

        {/* Guests selector dropdown trigger */}
        <div className="md:col-span-3 px-4 py-2 border-b md:border-b-0 md:border-r border-slate-100 relative">
          <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
            <Users className="w-3 h-3 text-[var(--public-primary)]" />
            <span>Huéspedes</span>
          </label>
          <button
            type="button"
            onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
            className="w-full text-left bg-transparent text-sm font-bold text-slate-800 outline-none truncate flex items-center justify-between cursor-pointer"
          >
            <span>{guestSummary}</span>
          </button>

          {/* Interactive floating guests selector dropdown */}
          {showGuestsDropdown && (
            <div className="absolute left-0 right-0 md:left-auto md:w-80 mt-4 bg-white border border-slate-100 rounded-2xl shadow-2xl p-5 space-y-4 z-50">
              {/* Adults */}
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Adultos</h4>
                  <p className="text-[10px] text-slate-400">Desde 13 años</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => decrement('adults')}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                    disabled={criteria.adults <= 1}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-slate-800 w-4 text-center">{criteria.adults}</span>
                  <button
                    type="button"
                    onClick={() => increment('adults')}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Niños</h4>
                  <p className="text-[10px] text-slate-400">De 2 a 12 años</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => decrement('children')}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                    disabled={criteria.children <= 0}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-slate-800 w-4 text-center">{criteria.children}</span>
                  <button
                    type="button"
                    onClick={() => increment('children')}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Babies */}
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Bebés</h4>
                  <p className="text-[10px] text-slate-400">Menores de 2 años</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => decrement('babies')}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                    disabled={criteria.babies <= 0}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-slate-800 w-4 text-center">{criteria.babies}</span>
                  <button
                    type="button"
                    onClick={() => increment('babies')}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Pets */}
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mascotas</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Admitidas en cabañas habilitadas</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => decrement('pets')}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                    disabled={criteria.pets <= 0}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-slate-800 w-4 text-center">{criteria.pets}</span>
                  <button
                    type="button"
                    onClick={() => increment('pets')}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowGuestsDropdown(false)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 text-center cursor-pointer block transition-all"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>

        {/* Accommodation Type */}
        <div className="md:col-span-2 px-4 py-2 border-b md:border-b-0 border-slate-100">
          <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
            <Home className="w-3 h-3 text-[var(--public-primary)]" />
            <span>Tipo</span>
          </label>
          <select
            value={criteria.accommodationTypeId || ''}
            onChange={(e) => setCriteria({ accommodationTypeId: e.target.value || undefined })}
            className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer focus:text-[var(--public-primary)] transition-all"
          >
            <option value="">Cualquiera</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.displayName}</option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-1 flex justify-center md:justify-end">
          <button
            type="submit"
            className="w-full md:w-14 h-14 rounded-xl md:rounded-full bg-[var(--public-primary)] text-white hover:opacity-95 shadow-md flex items-center justify-center active:scale-95 transition-all cursor-pointer min-h-[50px]"
            disabled={loading}
            title="Buscar Disponibilidad"
          >
            {loading ? (
              <span className="animate-spin text-xs font-bold">...</span>
            ) : (
              <>
                <span className="md:hidden font-bold text-sm px-4">Buscar Disponibilidad</span>
                <Search className="w-5 h-5 hidden md:block" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
