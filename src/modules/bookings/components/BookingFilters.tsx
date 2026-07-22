import React from 'react';
import { Search, Filter, Calendar, RotateCcw } from 'lucide-react';
import { Cabin } from '../../../types';

interface BookingFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (val: string) => void;
  cabinFilter: string;
  onCabinFilterChange: (val: string) => void;
  originFilter: string;
  onOriginFilterChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  cabins: Cabin[];
  onReset: () => void;
}

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  cabinFilter,
  onCabinFilterChange,
  originFilter,
  onOriginFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  cabins,
  onReset
}) => {
  // Extract unique origins if they exist in bookings
  const availableOrigins = ['Directo (Web)', 'Manual', 'Booking.com', 'Airbnb', 'Expedia'];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
      {/* Search and Quick reset */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono o código..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1e3a2b] focus:ring-1 focus:ring-[#1e3a2b] transition-all bg-slate-50/50"
          />
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Filtros</span>
        </button>
      </div>

      {/* Advanced Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estado de Reserva</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-[#1e3a2b]"
          >
            <option value="all">Todos los Estados</option>
            <option value="pending_approval">Por Aprobar</option>
            <option value="pending">Pendientes de Pago</option>
            <option value="confirmed">Confirmadas</option>
            <option value="checked_in">Check-in</option>
            <option value="checked_out">Check-out</option>
            <option value="no_show">No-Show</option>
            <option value="expired">Expiradas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        {/* Payment Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estado del Pago</label>
          <select
            value={paymentFilter}
            onChange={(e) => onPaymentFilterChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-[#1e3a2b]"
          >
            <option value="all">Todos los Pagos</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagados</option>
            <option value="refunded">Reembolsados</option>
          </select>
        </div>

        {/* Cabin/Accommodation Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Alojamiento</label>
          <select
            value={cabinFilter}
            onChange={(e) => onCabinFilterChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-[#1e3a2b]"
          >
            <option value="all">Todos los Alojamientos</option>
            {cabins.map((cabin) => (
              <option key={cabin.id} value={cabin.id}>
                {cabin.name}
              </option>
            ))}
          </select>
        </div>

        {/* Origin Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Canal / Origen</label>
          <select
            value={originFilter}
            onChange={(e) => onOriginFilterChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-[#1e3a2b]"
          >
            <option value="all">Todos los Canales</option>
            {availableOrigins.map((orig) => (
              <option key={orig} value={orig}>
                {orig}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Desde (Check-in)</label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-[#1e3a2b]"
            />
          </div>
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hasta (Check-out)</label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-[#1e3a2b]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
