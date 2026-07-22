import React from 'react';
import { ChevronUp, ChevronDown, Calendar, Eye, FileText, Landmark, MessageSquare, Info } from 'lucide-react';
import { Booking, Cabin } from '../../../types';
import { BookingStatusBadge, PaymentStatusBadge } from './BookingStatusBadge';
import { BookingActions } from './BookingActions';
import { BookingService } from '../services/BookingService';

export type SortKey = 'id' | 'checkIn' | 'createdAt' | 'name' | 'totalPrice';
export type SortOrder = 'asc' | 'desc';

interface BookingsTableProps {
  bookings: Booking[];
  cabins: Cabin[];
  onViewDetails: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onDuplicate: (booking: Booking) => void;
  onConfirmStatus: (id: number) => void;
  onCancelStatus: (id: number) => void;
  onReopenStatus: (id: number) => void;
  onDeleteBooking: (id: number) => void;
  
  // Sorting state
  sortKey: SortKey;
  sortOrder: SortOrder;
  onSort: (key: SortKey) => void;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({
  bookings,
  cabins,
  onViewDetails,
  onEdit,
  onDuplicate,
  onConfirmStatus,
  onCancelStatus,
  onReopenStatus,
  onDeleteBooking,
  sortKey,
  sortOrder,
  onSort
}) => {

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatDateWithYear = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#1e3a2b]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#1e3a2b]" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              {/* Reference ID column */}
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-all select-none"
                onClick={() => onSort('id')}
              >
                <div className="flex items-center gap-1">
                  <span>Código / ID</span>
                  {renderSortIndicator('id')}
                </div>
              </th>

              {/* Guest column */}
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-all select-none"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-1">
                  <span>Huésped</span>
                  {renderSortIndicator('name')}
                </div>
              </th>

              {/* Cabin/Alojamiento column */}
              <th className="py-3 px-4">Alojamiento</th>

              {/* Stay interval column */}
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-all select-none"
                onClick={() => onSort('checkIn')}
              >
                <div className="flex items-center gap-1">
                  <span>Estadía / Noches</span>
                  {renderSortIndicator('checkIn')}
                </div>
              </th>

              {/* Guests Count column */}
              <th className="py-3 px-4 text-center">Huéspedes</th>

              {/* Status column */}
              <th className="py-3 px-4">Estado</th>

              {/* Payment column */}
              <th className="py-3 px-4">Pago</th>

              {/* Pricing column */}
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-all select-none text-right"
                onClick={() => onSort('totalPrice')}
              >
                <div className="flex items-center gap-1 justify-end">
                  <span>Importe Total</span>
                  {renderSortIndicator('totalPrice')}
                </div>
              </th>

              {/* Origin / Channel */}
              <th className="py-3 px-4 text-center">Canal</th>

              {/* Creation Date */}
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-all select-none"
                onClick={() => onSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  <span>Registro</span>
                  {renderSortIndicator('createdAt')}
                </div>
              </th>

              {/* Actions */}
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold bg-white">
                  No se encontraron reservas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const cabin = cabins.find(c => c.id === booking.cabinId);
                const nights = BookingService.calculateNights(booking.checkIn, booking.checkOut);
                const b = booking as any;
                const origin = b.origin || (booking.paymentMethod ? 'Directo (Web)' : 'Manual');

                return (
                  <tr 
                    key={booking.id} 
                    className="hover:bg-slate-50/50 transition-all group cursor-pointer"
                    onClick={() => onViewDetails(booking)}
                  >
                    {/* ID */}
                    <td className="py-3 px-4 font-extrabold text-[#1e3a2b] whitespace-nowrap">
                      #{booking.id}
                    </td>

                    {/* Guest info */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800 line-clamp-1">{booking.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{booking.phone}</p>
                      </div>
                    </td>

                    {/* Cabin/Alojamiento */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {cabin?.name || `Cabaña #${booking.cabinId}`}
                    </td>

                    {/* Stay / Nights */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">
                          {formatDateShort(booking.checkIn)} al {formatDateShort(booking.checkOut)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                          {nights} Noches
                        </p>
                      </div>
                    </td>

                    {/* Guests Count */}
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {booking.guests}
                      {b.pets > 0 && <span className="text-[10px] text-emerald-600 block">+{b.pets}🐾</span>}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <BookingStatusBadge status={booking.status} />
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <PaymentStatusBadge status={booking.paymentStatus || 'pending'} />
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-extrabold text-forest text-right">
                      {formatPrice(booking.totalPrice)}
                    </td>

                    {/* Origin / Channel */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-[#1e3a2b] bg-[#1e3a2b]/10">
                        {origin}
                      </span>
                    </td>

                    {/* Date Registered */}
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {formatDateWithYear(booking.createdAt)}
                    </td>

                    {/* Actions dropdown */}
                    <td className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewDetails(booking)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
                          title="Ver detalle completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <BookingActions
                          booking={booking}
                          onConfirm={onConfirmStatus}
                          onCancel={onCancelStatus}
                          onReopen={onReopenStatus}
                          onEdit={onEdit}
                          onDuplicate={onDuplicate}
                          onDelete={onDeleteBooking}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
